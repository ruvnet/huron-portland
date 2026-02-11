# ADR-005: SF424 Form Generation and Grants.gov Integration

## Status
Accepted

## Date
2026-01-25

## Context

The HRS Grants Module must support:
- SF424 form generation in compliance with Grants.gov requirements
- Multiple SF424 form variants (SF424, SF424A, SF424B, SF424C, SF424D, SF424 R&R)
- XML generation matching federal schemas
- Validation against Grants.gov business rules
- Submission tracking and status updates

## Decision

We will implement a dedicated **SF424 Bounded Context** with:
1. Form Builder pattern for flexible form construction
2. Schema-driven validation
3. XML generation using Go templates
4. Integration adapter for Grants.gov API

### SF424 Form Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   SF424 BOUNDED CONTEXT                     │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────────────────────────────────┐   │
│  │                    FORM BUILDER                      │   │
│  │  (Constructs SF424 forms from proposal data)        │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                  SCHEMA VALIDATOR                    │   │
│  │  (Validates against Grants.gov XSD schemas)         │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   XML GENERATOR                      │   │
│  │  (Produces compliant XML for submission)            │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │               SUBMISSION ADAPTER                     │   │
│  │  (Handles Grants.gov API communication)             │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Domain Model

```go
// domain/sf424/form.go

package sf424

import (
    "encoding/xml"
    "time"
)

// FormType represents different SF424 form variants
type FormType string

const (
    FormTypeSF424    FormType = "SF424"
    FormTypeSF424A   FormType = "SF424A"
    FormTypeSF424B   FormType = "SF424B"
    FormTypeSF424C   FormType = "SF424C"
    FormTypeSF424D   FormType = "SF424D"
    FormTypeSF424RR  FormType = "SF424_R_R"
)

// SF424Form is the aggregate root for form management
type SF424Form struct {
    ID                  string
    ProposalID          string
    TenantID            string
    FormType            FormType
    Version             string
    Status              FormStatus

    // Core Form Data
    ApplicantInfo       ApplicantInformation
    ProjectInfo         ProjectInformation
    BudgetInfo          BudgetInformation
    AuthorizedRep       AuthorizedRepresentative

    // Metadata
    CreatedAt           time.Time
    UpdatedAt           time.Time
    ValidatedAt         *time.Time
    SubmittedAt         *time.Time

    // Validation
    ValidationErrors    []ValidationError

    // Generated XML
    GeneratedXML        []byte
    XMLHash             string
}

type FormStatus string

const (
    FormStatusDraft      FormStatus = "DRAFT"
    FormStatusValidating FormStatus = "VALIDATING"
    FormStatusValid      FormStatus = "VALID"
    FormStatusInvalid    FormStatus = "INVALID"
    FormStatusSubmitted  FormStatus = "SUBMITTED"
)

// ApplicantInformation matches SF424 Section A
type ApplicantInformation struct {
    LegalName              string  `xml:"ApplicantInfo>OrganizationName"`
    DUNSNUMBER             string  `xml:"ApplicantInfo>DUNS"`
    EIN                    string  `xml:"ApplicantInfo>EIN"`
    OrganizationType       string  `xml:"ApplicantInfo>OrganizationType"`
    Address                Address `xml:"ApplicantInfo>Address"`
    OrganizationalUnit     string  `xml:"ApplicantInfo>OrganizationalUnit"`
    DepartmentName         string  `xml:"ApplicantInfo>DepartmentName"`
    Division               string  `xml:"ApplicantInfo>Division"`
}

// ProjectInformation matches SF424 Section B
type ProjectInformation struct {
    Title                  string    `xml:"ProjectInfo>ProjectTitle"`
    Description            string    `xml:"ProjectInfo>ProjectDescription"`
    StartDate              time.Time `xml:"ProjectInfo>ProjectStartDate"`
    EndDate                time.Time `xml:"ProjectInfo>ProjectEndDate"`
    FederalAgency          string    `xml:"ProjectInfo>FederalAgencyName"`
    CFDANumber             string    `xml:"ProjectInfo>CFDANumber"`
    CFDATitle              string    `xml:"ProjectInfo>CFDATitle"`
    FundingOpportunityNum  string    `xml:"ProjectInfo>FundingOpportunityNumber"`
    CompetitionID          string    `xml:"ProjectInfo>CompetitionID"`
}

// BudgetInformation matches SF424 Section C
type BudgetInformation struct {
    FederalEstimated       Money `xml:"BudgetInfo>FederalEstimatedFunding"`
    ApplicantEstimated     Money `xml:"BudgetInfo>ApplicantEstimatedFunding"`
    StateEstimated         Money `xml:"BudgetInfo>StateEstimatedFunding"`
    LocalEstimated         Money `xml:"BudgetInfo>LocalEstimatedFunding"`
    OtherEstimated         Money `xml:"BudgetInfo>OtherEstimatedFunding"`
    ProgramIncomeEstimated Money `xml:"BudgetInfo>ProgramIncomeEstimatedFunding"`
    TotalEstimated         Money `xml:"BudgetInfo>TotalEstimatedFunding"`
}

type Money struct {
    Amount   int64  // Stored in cents
    Currency string // Always "USD" for federal grants
}

// ValidationError represents a form validation issue
type ValidationError struct {
    Field       string
    Code        string
    Message     string
    Severity    ErrorSeverity
    XPath       string
}

type ErrorSeverity string

const (
    SeverityError   ErrorSeverity = "ERROR"
    SeverityWarning ErrorSeverity = "WARNING"
)
```

### Form Builder

```go
// domain/sf424/builder.go

package sf424

import (
    "github.com/hrs/grants/domain/proposal"
    "github.com/hrs/grants/domain/budget"
    "github.com/hrs/grants/domain/identity"
)

// FormBuilder constructs SF424 forms from domain objects
type FormBuilder struct {
    schemas map[FormType]*FormSchema
}

// FormSchema defines the structure and rules for each form type
type FormSchema struct {
    Type           FormType
    Version        string
    XSDPath        string
    RequiredFields []string
    ValidationRules []ValidationRule
}

// Build creates an SF424Form from proposal data
func (b *FormBuilder) Build(
    prop *proposal.Proposal,
    bdg *budget.Budget,
    org *identity.Organization,
    pi *identity.Person,
) (*SF424Form, error) {
    form := &SF424Form{
        ID:         generateID(),
        ProposalID: prop.ID,
        TenantID:   prop.TenantID,
        FormType:   determineFormType(prop),
        Version:    "2.1",
        Status:     FormStatusDraft,
        CreatedAt:  time.Now().UTC(),
    }

    // Populate Applicant Information
    form.ApplicantInfo = ApplicantInformation{
        LegalName:          org.LegalName,
        DUNSNUMBER:         org.DUNS,
        EIN:                org.EIN,
        OrganizationType:   org.Type.ToSF424Code(),
        Address:            mapAddress(org.Address),
        OrganizationalUnit: prop.Department.Name,
        DepartmentName:     prop.Department.Name,
    }

    // Populate Project Information
    form.ProjectInfo = ProjectInformation{
        Title:                 prop.Title,
        Description:           prop.Abstract,
        StartDate:             prop.ProjectStartDate,
        EndDate:               prop.ProjectEndDate,
        FederalAgency:         prop.Sponsor.AgencyName,
        CFDANumber:            prop.Opportunity.CFDANumber,
        CFDATitle:             prop.Opportunity.CFDATitle,
        FundingOpportunityNum: prop.Opportunity.Number,
        CompetitionID:         prop.Opportunity.CompetitionID,
    }

    // Populate Budget Information
    form.BudgetInfo = BudgetInformation{
        FederalEstimated: Money{
            Amount:   bdg.TotalFederalRequest(),
            Currency: "USD",
        },
        ApplicantEstimated: Money{
            Amount:   bdg.TotalCostSharing(),
            Currency: "USD",
        },
        TotalEstimated: Money{
            Amount:   bdg.TotalProjectCost(),
            Currency: "USD",
        },
    }

    // Populate Authorized Representative
    form.AuthorizedRep = buildAuthorizedRep(org.AuthorizedSignatory)

    return form, nil
}
```

### XML Generator

```go
// domain/sf424/xml_generator.go

package sf424

import (
    "bytes"
    "crypto/sha256"
    "encoding/hex"
    "encoding/xml"
    "text/template"
)

// XMLGenerator produces Grants.gov compliant XML
type XMLGenerator struct {
    templates map[FormType]*template.Template
}

// Generate creates XML representation of the form
func (g *XMLGenerator) Generate(form *SF424Form) ([]byte, error) {
    tmpl, ok := g.templates[form.FormType]
    if !ok {
        return nil, ErrUnsupportedFormType
    }

    var buf bytes.Buffer

    // Add XML declaration
    buf.WriteString(`<?xml version="1.0" encoding="UTF-8"?>` + "\n")

    // Execute template
    if err := tmpl.Execute(&buf, form); err != nil {
        return nil, err
    }

    xmlData := buf.Bytes()

    // Calculate hash for integrity verification
    hash := sha256.Sum256(xmlData)
    form.XMLHash = hex.EncodeToString(hash[:])
    form.GeneratedXML = xmlData

    return xmlData, nil
}

// SF424 XML Template
const sf424Template = `
<GrantApplication xmlns="http://apply.grants.gov/forms/SF424-V2.1"
                  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                  xsi:schemaLocation="http://apply.grants.gov/forms/SF424-V2.1">
    <SF424>
        <SubmissionTypeCode>{{.SubmissionType}}</SubmissionTypeCode>
        <ApplicationTypeCode>{{.ApplicationType}}</ApplicationTypeCode>

        <ApplicantInfo>
            <OrganizationName>{{.ApplicantInfo.LegalName}}</OrganizationName>
            <DUNSID>{{.ApplicantInfo.DUNSNUMBER}}</DUNSID>
            <EmployerID>{{.ApplicantInfo.EIN}}</EmployerID>
            <ApplicantTypeCode>{{.ApplicantInfo.OrganizationType}}</ApplicantTypeCode>

            <Address>
                <Street1>{{.ApplicantInfo.Address.Street1}}</Street1>
                <City>{{.ApplicantInfo.Address.City}}</City>
                <State>{{.ApplicantInfo.Address.State}}</State>
                <ZipCode>{{.ApplicantInfo.Address.ZipCode}}</ZipCode>
                <Country>{{.ApplicantInfo.Address.Country}}</Country>
            </Address>
        </ApplicantInfo>

        <ProjectInfo>
            <ProjectTitle>{{.ProjectInfo.Title}}</ProjectTitle>
            <ProjectDescription>{{.ProjectInfo.Description}}</ProjectDescription>
            <ProposedStartDate>{{formatDate .ProjectInfo.StartDate}}</ProposedStartDate>
            <ProposedEndDate>{{formatDate .ProjectInfo.EndDate}}</ProposedEndDate>
            <AgencyName>{{.ProjectInfo.FederalAgency}}</AgencyName>
            <CFDANumber>{{.ProjectInfo.CFDANumber}}</CFDANumber>
        </ProjectInfo>

        <BudgetInfo>
            <FederalEstimatedAmount>{{formatMoney .BudgetInfo.FederalEstimated}}</FederalEstimatedAmount>
            <ApplicantEstimatedAmount>{{formatMoney .BudgetInfo.ApplicantEstimated}}</ApplicantEstimatedAmount>
            <TotalEstimatedAmount>{{formatMoney .BudgetInfo.TotalEstimated}}</TotalEstimatedAmount>
        </BudgetInfo>

        <AuthorizedRepresentative>
            <FirstName>{{.AuthorizedRep.FirstName}}</FirstName>
            <LastName>{{.AuthorizedRep.LastName}}</LastName>
            <Title>{{.AuthorizedRep.Title}}</Title>
            <PhoneNumber>{{.AuthorizedRep.Phone}}</PhoneNumber>
            <Email>{{.AuthorizedRep.Email}}</Email>
        </AuthorizedRepresentative>
    </SF424>
</GrantApplication>
`
```

### Schema Validator

```go
// domain/sf424/validator.go

package sf424

import (
    "github.com/lestrrat-go/libxml2"
    "github.com/lestrrat-go/libxml2/xsd"
)

// SchemaValidator validates forms against Grants.gov XSD schemas
type SchemaValidator struct {
    schemas map[FormType]*xsd.Schema
}

// Validate checks the form against its XSD schema
func (v *SchemaValidator) Validate(form *SF424Form) ([]ValidationError, error) {
    schema, ok := v.schemas[form.FormType]
    if !ok {
        return nil, ErrSchemaNotFound
    }

    var errors []ValidationError

    // Parse generated XML
    doc, err := libxml2.ParseString(string(form.GeneratedXML))
    if err != nil {
        errors = append(errors, ValidationError{
            Field:    "XML",
            Code:     "PARSE_ERROR",
            Message:  err.Error(),
            Severity: SeverityError,
        })
        return errors, nil
    }
    defer doc.Free()

    // Validate against schema
    if err := schema.Validate(doc); err != nil {
        for _, schemaErr := range xsd.GetLastErrors() {
            errors = append(errors, ValidationError{
                Field:    schemaErr.Path,
                Code:     "SCHEMA_VIOLATION",
                Message:  schemaErr.Message,
                Severity: SeverityError,
                XPath:    schemaErr.Path,
            })
        }
    }

    // Business rule validations
    businessErrors := v.validateBusinessRules(form)
    errors = append(errors, businessErrors...)

    return errors, nil
}

// validateBusinessRules checks Grants.gov specific business rules
func (v *SchemaValidator) validateBusinessRules(form *SF424Form) []ValidationError {
    var errors []ValidationError

    // Rule: DUNS must be 9 digits
    if len(form.ApplicantInfo.DUNSNUMBER) != 9 {
        errors = append(errors, ValidationError{
            Field:    "ApplicantInfo.DUNSNUMBER",
            Code:     "INVALID_DUNS",
            Message:  "DUNS number must be exactly 9 digits",
            Severity: SeverityError,
        })
    }

    // Rule: Project end date must be after start date
    if !form.ProjectInfo.EndDate.After(form.ProjectInfo.StartDate) {
        errors = append(errors, ValidationError{
            Field:    "ProjectInfo.EndDate",
            Code:     "INVALID_DATE_RANGE",
            Message:  "Project end date must be after start date",
            Severity: SeverityError,
        })
    }

    // Rule: Budget totals must balance
    calculated := form.BudgetInfo.FederalEstimated.Amount +
                  form.BudgetInfo.ApplicantEstimated.Amount +
                  form.BudgetInfo.StateEstimated.Amount +
                  form.BudgetInfo.LocalEstimated.Amount +
                  form.BudgetInfo.OtherEstimated.Amount

    if calculated != form.BudgetInfo.TotalEstimated.Amount {
        errors = append(errors, ValidationError{
            Field:    "BudgetInfo.TotalEstimated",
            Code:     "BUDGET_MISMATCH",
            Message:  "Total estimated funding must equal sum of all funding sources",
            Severity: SeverityError,
        })
    }

    return errors
}
```

### Grants.gov Integration Adapter

```go
// infrastructure/external/grantsgov/client.go

package grantsgov

import (
    "context"
    "encoding/xml"
    "net/http"
)

// Client interfaces with Grants.gov API
type Client struct {
    httpClient   *http.Client
    baseURL      string
    apiKey       string
    retryConfig  RetryConfig
}

// SubmissionResult contains the response from submission
type SubmissionResult struct {
    TrackingNumber   string
    ReceivedDateTime time.Time
    Status           string
    Errors           []SubmissionError
}

// Submit sends the SF424 form to Grants.gov
func (c *Client) Submit(ctx context.Context, form *sf424.SF424Form) (*SubmissionResult, error) {
    // Build multipart form data
    body, contentType, err := c.buildSubmissionPayload(form)
    if err != nil {
        return nil, err
    }

    req, err := http.NewRequestWithContext(ctx, "POST", c.baseURL+"/submit", body)
    if err != nil {
        return nil, err
    }

    req.Header.Set("Content-Type", contentType)
    req.Header.Set("Authorization", "Bearer "+c.apiKey)

    // Submit with retry logic
    resp, err := c.doWithRetry(ctx, req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var result SubmissionResult
    if err := xml.NewDecoder(resp.Body).Decode(&result); err != nil {
        return nil, err
    }

    return &result, nil
}

// CheckStatus retrieves the current status of a submission
func (c *Client) CheckStatus(ctx context.Context, trackingNumber string) (*SubmissionStatus, error) {
    req, err := http.NewRequestWithContext(ctx, "GET",
        c.baseURL+"/status/"+trackingNumber, nil)
    if err != nil {
        return nil, err
    }

    req.Header.Set("Authorization", "Bearer "+c.apiKey)

    resp, err := c.httpClient.Do(req)
    if err != nil {
        return nil, err
    }
    defer resp.Body.Close()

    var status SubmissionStatus
    if err := xml.NewDecoder(resp.Body).Decode(&status); err != nil {
        return nil, err
    }

    return &status, nil
}
```

## Rationale

1. **Compliance**: Schema-driven validation ensures Grants.gov compatibility
2. **Flexibility**: Template-based XML supports multiple form versions
3. **Auditability**: XML hashing provides integrity verification
4. **Testability**: Form builder is unit testable without external dependencies
5. **Maintainability**: Schema updates are isolated to templates

## Consequences

### Positive
- Guaranteed schema compliance before submission
- Clear separation between form building and submission
- Version control for form templates
- Detailed validation error messages

### Negative
- Schema updates require template maintenance
- XML template debugging can be complex
- External dependency on Grants.gov API availability

## References
- [Grants.gov XML Schemas](https://www.grants.gov/web/grants/applicants/download-application-package.html)
- [SF424 Form Family](https://www.grants.gov/forms/sf-424-family)
- FR-040: SF424 Form Management
- IR-001: Grants.gov Integration
