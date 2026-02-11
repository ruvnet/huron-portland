# Domain-Driven Design: Bounded Contexts

## Overview

The HRS Grants Module is organized into 7 bounded contexts, each representing a distinct area of the grants management domain. These contexts are designed for high cohesion within and loose coupling between contexts.

## Context Map

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           GRANTS MANAGEMENT SYSTEM                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│  │   PROPOSAL   │───▶│    BUDGET    │───▶│    AWARD     │                 │
│  │  MANAGEMENT  │    │  MANAGEMENT  │    │  MANAGEMENT  │                 │
│  └──────┬───────┘    └──────────────┘    └──────┬───────┘                 │
│         │                                        │                         │
│         │         ┌──────────────┐              │                         │
│         └────────▶│    SF424     │◀─────────────┘                         │
│                   │  MANAGEMENT  │                                         │
│                   └──────────────┘                                         │
│                                                                             │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                 │
│  │  COMPLIANCE  │    │   ACCOUNT    │    │   IDENTITY   │                 │
│  │  MANAGEMENT  │    │  MANAGEMENT  │    │  MANAGEMENT  │                 │
│  └──────────────┘    └──────────────┘    └──────────────┘                 │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

Legend:
  ──▶  Upstream/Downstream (data flows from upstream to downstream)
  ◀──  Conformist (downstream conforms to upstream model)
```

## Context Relationships

| Upstream | Downstream | Pattern | Description |
|----------|------------|---------|-------------|
| Proposal | Budget | Partnership | Budget is integral to proposal |
| Proposal | SF424 | Customer-Supplier | SF424 consumes proposal data |
| Proposal | Compliance | Customer-Supplier | Compliance attached to proposals |
| Award | Account | Anti-Corruption Layer | Account integrates with external finance |
| Identity | All Contexts | Shared Kernel | Common person/org entities |

---

## 1. Proposal Management Context

### Purpose
Manages the complete lifecycle of grant proposals from creation through submission and award decision.

### Ubiquitous Language
- **Proposal**: A formal request for funding submitted to a sponsor
- **Principal Investigator (PI)**: Lead researcher responsible for the proposal
- **Sponsor**: Funding agency (NIH, NSF, DOD, etc.)
- **Opportunity**: A funding opportunity announcement (FOA) from a sponsor
- **Submission**: The act of sending a proposal to a sponsor for review

### Aggregate: Proposal

```go
// domain/proposal/aggregate.go

package proposal

type Proposal struct {
    // Identity
    ID        ProposalID
    TenantID  TenantID

    // Core attributes
    Title            string
    Abstract         string
    State            ProposalState
    Type             ProposalType  // NEW, RENEWAL, CONTINUATION, REVISION

    // Relationships
    PrincipalInvestigatorID PersonID
    SponsorID               SponsorID
    OpportunityID           OpportunityID
    DepartmentID            DepartmentID

    // Timeline
    ProjectStartDate time.Time
    ProjectEndDate   time.Time
    SubmissionDeadline time.Time

    // Team
    TeamMembers []TeamMember

    // State machine
    StateHistory []StateTransition

    // Metadata
    CreatedAt time.Time
    UpdatedAt time.Time
    CreatedBy PersonID
    UpdatedBy PersonID
    Version   int

    // Domain events
    events []DomainEvent
}

// Value Objects
type ProposalID string
type TenantID string
type PersonID string
type SponsorID string

type ProposalType string
const (
    TypeNew          ProposalType = "NEW"
    TypeRenewal      ProposalType = "RENEWAL"
    TypeContinuation ProposalType = "CONTINUATION"
    TypeRevision     ProposalType = "REVISION"
)

type TeamMember struct {
    PersonID     PersonID
    Role         TeamRole
    Effort       float64  // Percentage of time
    IsPISurrogate bool
}

type TeamRole string
const (
    RolePI          TeamRole = "PRINCIPAL_INVESTIGATOR"
    RoleCoPI        TeamRole = "CO_PRINCIPAL_INVESTIGATOR"
    RoleSeniorPersonnel TeamRole = "SENIOR_PERSONNEL"
    RolePostDoc     TeamRole = "POST_DOCTORAL"
    RoleGradStudent TeamRole = "GRADUATE_STUDENT"
)
```

### Domain Services

```go
// ProposalSubmissionService handles complex submission logic
type ProposalSubmissionService interface {
    ValidateForSubmission(proposal *Proposal) ([]ValidationError, error)
    PrepareSubmissionPackage(proposal *Proposal) (*SubmissionPackage, error)
    SubmitToSponsor(proposal *Proposal) (*SubmissionResult, error)
}

// ProposalCloningService handles proposal duplication
type ProposalCloningService interface {
    Clone(source *Proposal, newType ProposalType) (*Proposal, error)
}
```

### Repository Interface

```go
type ProposalRepository interface {
    Save(ctx context.Context, proposal *Proposal) error
    GetByID(ctx context.Context, id ProposalID) (*Proposal, error)
    FindByPI(ctx context.Context, piID PersonID, params ListParams) ([]*Proposal, error)
    FindByDepartment(ctx context.Context, deptID DepartmentID, params ListParams) ([]*Proposal, error)
    FindByStatus(ctx context.Context, status ProposalState, params ListParams) ([]*Proposal, error)
}
```

### Domain Events

| Event | Trigger | Consumers |
|-------|---------|-----------|
| ProposalCreated | New proposal | Notification, Audit |
| ProposalStateChanged | State transition | Notification, Integration, Audit |
| ProposalSubmitted | Submission to sponsor | SF424, Notification, Audit |
| TeamMemberAdded | New team member | Notification, Budget |
| ProposalAwarded | Award received | Award Context, Notification |

---

## 2. Budget Management Context

### Purpose
Manages multi-period budgets with detailed cost categories, cost sharing, and F&A calculations.

### Ubiquitous Language
- **Budget**: Financial plan for a proposal or award
- **Budget Period**: A fiscal year within the project timeline
- **Direct Costs**: Costs directly attributable to the project
- **Indirect Costs (F&A)**: Facilities and administrative costs
- **Cost Sharing**: Institutional contribution to project costs

### Aggregate: Budget

```go
// domain/budget/aggregate.go

package budget

type Budget struct {
    ID         BudgetID
    ProposalID ProposalID
    TenantID   TenantID

    // Structure
    Periods    []BudgetPeriod

    // Totals (calculated)
    TotalDirectCosts    Money
    TotalIndirectCosts  Money
    TotalCostSharing    Money
    TotalProjectCost    Money

    // F&A Rate
    FARate     FARate
    FABase     FABase

    // Status
    Status     BudgetStatus
    IsLocked   bool

    // Metadata
    Version   int
    UpdatedAt time.Time
    UpdatedBy PersonID
}

type BudgetPeriod struct {
    ID          BudgetPeriodID
    PeriodNumber int
    StartDate   time.Time
    EndDate     time.Time

    // Cost Categories
    Personnel        []PersonnelCost
    Equipment        []EquipmentCost
    Travel           []TravelCost
    Supplies         []SupplyCost
    Contractual      []ContractualCost
    Other            []OtherCost
    IndirectCosts    Money

    // Totals
    TotalDirectCosts   Money
    TotalIndirectCosts Money
    TotalPeriodCost    Money
}

type PersonnelCost struct {
    PersonID        PersonID
    Role            TeamRole
    BaseSalary      Money
    EffortPercent   float64
    RequestedSalary Money
    FringeBenefits  Money
    TotalCost       Money
}

// Value Objects
type Money struct {
    Amount   int64  // Cents
    Currency string
}

func (m Money) Add(other Money) Money {
    return Money{Amount: m.Amount + other.Amount, Currency: m.Currency}
}

type FARate struct {
    Rate     float64 // e.g., 0.55 for 55%
    Type     string  // MTDC, TDC, SALARIES_WAGES
    Agreement string  // Negotiated rate agreement ID
}

type FABase string
const (
    FABaseMTDC          FABase = "MODIFIED_TOTAL_DIRECT_COSTS"
    FABaseTDC           FABase = "TOTAL_DIRECT_COSTS"
    FABaseSalariesWages FABase = "SALARIES_AND_WAGES"
)
```

### Domain Services

```go
// BudgetCalculationService handles complex calculations
type BudgetCalculationService interface {
    CalculateIndirectCosts(period *BudgetPeriod, faRate FARate) Money
    CalculateCostSharing(period *BudgetPeriod, requirements CostSharingRequirements) Money
    ValidateBudgetLimits(budget *Budget, sponsor SponsorLimits) []ValidationError
}

// BudgetVersioningService manages budget versions
type BudgetVersioningService interface {
    CreateVersion(budget *Budget, reason string) (*BudgetVersion, error)
    CompareVersions(v1, v2 *BudgetVersion) (*BudgetDiff, error)
    RestoreVersion(budget *Budget, versionID BudgetVersionID) error
}
```

---

## 3. Award Management Context

### Purpose
Manages funded awards from activation through closeout, including modifications and reporting.

### Ubiquitous Language
- **Award**: A funded grant resulting from an approved proposal
- **Award Modification**: A change to the award terms (budget, timeline, scope)
- **Subaward**: Funds passed through to another institution
- **Closeout**: Final administrative steps to close an award

### Aggregate: Award

```go
// domain/award/aggregate.go

package award

type Award struct {
    ID           AwardID
    ProposalID   ProposalID
    TenantID     TenantID

    // Sponsor Information
    SponsorAwardNumber string
    SponsorID          SponsorID
    PrimeAwardID       *AwardID  // If this is a subaward

    // Award Details
    Title              string
    Type               AwardType
    Status             AwardStatus

    // Timeline
    ProjectStartDate   time.Time
    ProjectEndDate     time.Time
    BudgetStartDate    time.Time
    BudgetEndDate      time.Time

    // Financial
    TotalAwardAmount   Money
    ObligatedAmount    Money
    ExpendedAmount     Money
    AvailableBalance   Money

    // Team
    PrincipalInvestigatorID PersonID

    // Modifications
    Modifications      []AwardModification

    // Subawards
    Subawards          []Subaward

    // Compliance
    ComplianceItems    []ComplianceItem
    ReportingSchedule  []ReportingRequirement
}

type AwardStatus string
const (
    StatusPending       AwardStatus = "PENDING"
    StatusActive        AwardStatus = "ACTIVE"
    StatusSuspended     AwardStatus = "SUSPENDED"
    StatusNoCostExtension AwardStatus = "NO_COST_EXTENSION"
    StatusCloseout      AwardStatus = "CLOSEOUT"
    StatusClosed        AwardStatus = "CLOSED"
    StatusTerminated    AwardStatus = "TERMINATED"
)

type AwardModification struct {
    ID              ModificationID
    ModificationNumber string
    Type            ModificationType
    EffectiveDate   time.Time
    Description     string
    Changes         ModificationChanges
    Status          ModificationStatus
}

type ModificationType string
const (
    ModTypeBudgetRevision     ModificationType = "BUDGET_REVISION"
    ModTypeNoCostExtension    ModificationType = "NO_COST_EXTENSION"
    ModTypeScopeChange        ModificationType = "SCOPE_CHANGE"
    ModTypePIChange           ModificationType = "PI_CHANGE"
    ModTypeCarryforward       ModificationType = "CARRYFORWARD"
    ModTypeSupplementalFunding ModificationType = "SUPPLEMENTAL_FUNDING"
)
```

---

## 4. SF424 Form Management Context

### Purpose
Manages federal form generation, validation, and submission to Grants.gov.

### Ubiquitous Language
- **SF424**: Standard Form 424, the federal grant application cover sheet
- **Form Package**: Collection of required forms for a submission
- **Grants.gov**: Federal grants portal for electronic submission

### Aggregate: FormPackage

```go
// domain/sf424/aggregate.go

package sf424

type FormPackage struct {
    ID           FormPackageID
    ProposalID   ProposalID
    TenantID     TenantID

    // Forms in package
    SF424        *SF424Form
    SF424A       *SF424AForm  // Budget Information (Non-Construction)
    SF424B       *SF424BForm  // Assurances (Non-Construction)
    SF424RR      *SF424RRForm // R&R Cover Page
    ProjectNarrative *Attachment
    BudgetNarrative  *Attachment
    OtherAttachments []Attachment

    // Status
    Status       FormPackageStatus
    ValidationStatus ValidationStatus

    // Submission
    SubmissionAttempts []SubmissionAttempt
    GrantsGovTracking  *GrantsGovTracking
}

type GrantsGovTracking struct {
    TrackingNumber    string
    ReceivedDateTime  time.Time
    Status            GrantsGovStatus
    AgencyTrackingNum string
    StatusHistory     []StatusUpdate
}

type GrantsGovStatus string
const (
    GGStatusReceived        GrantsGovStatus = "RECEIVED"
    GGStatusValidating      GrantsGovStatus = "VALIDATING"
    GGStatusValidated       GrantsGovStatus = "VALIDATED"
    GGStatusRejected        GrantsGovStatus = "REJECTED"
    GGStatusReceivedByAgency GrantsGovStatus = "RECEIVED_BY_AGENCY"
    GGStatusAgencyTracking  GrantsGovStatus = "AGENCY_TRACKING_NUMBER_ASSIGNED"
)
```

---

## 5. Compliance Management Context

### Purpose
Manages regulatory compliance requirements (IRB, IACUC, IBC protocols).

### Ubiquitous Language
- **IRB Protocol**: Institutional Review Board approval for human subjects
- **IACUC Protocol**: Institutional Animal Care and Use Committee approval
- **IBC Protocol**: Institutional Biosafety Committee approval
- **Compliance Item**: A regulatory requirement attached to a proposal/award

### Aggregate: ComplianceItem

```go
// domain/compliance/aggregate.go

package compliance

type ComplianceItem struct {
    ID              ComplianceItemID
    ProposalID      ProposalID
    AwardID         *AwardID  // Set when award is created
    TenantID        TenantID

    // Type and Protocol
    Type            ComplianceType
    ProtocolNumber  string
    ExternalSystemID string

    // Status
    Status          ComplianceStatus
    ExpirationDate  *time.Time

    // Approval
    ApprovedBy      *PersonID
    ApprovedAt      *time.Time
    ApprovalNotes   string

    // Documents
    Attachments     []Attachment
}

type ComplianceType string
const (
    ComplianceIRB   ComplianceType = "IRB"     // Human subjects
    ComplianceIACUC ComplianceType = "IACUC"   // Animal subjects
    ComplianceIBC   ComplianceType = "IBC"     // Biosafety
    ComplianceRCR   ComplianceType = "RCR"     // Responsible conduct of research
    ComplianceCOI   ComplianceType = "COI"     // Conflict of interest
    ComplianceExport ComplianceType = "EXPORT" // Export control
)

type ComplianceStatus string
const (
    StatusNotRequired ComplianceStatus = "NOT_REQUIRED"
    StatusPending     ComplianceStatus = "PENDING"
    StatusApproved    ComplianceStatus = "APPROVED"
    StatusExpired     ComplianceStatus = "EXPIRED"
    StatusRevoked     ComplianceStatus = "REVOKED"
)
```

---

## 6. Financial Account Management Context

### Purpose
Manages financial accounts and integrates with external financial systems.

### Ubiquitous Language
- **Account**: A financial account in the institution's general ledger
- **Chart String**: The coding structure for financial transactions
- **Fund**: A source of funding for transactions
- **Transaction**: A financial movement (expense, transfer)

### Aggregate: FinancialAccount

```go
// domain/account/aggregate.go

package account

type FinancialAccount struct {
    ID              AccountID
    AwardID         AwardID
    TenantID        TenantID

    // Account Identifiers
    AccountNumber   string
    ChartString     ChartString
    ExternalID      string  // ID in external finance system

    // Account Details
    Name            string
    Type            AccountType
    Status          AccountStatus

    // Financial Position
    Budget          Money
    Encumbered      Money
    Expended        Money
    Available       Money

    // Timeline
    EffectiveDate   time.Time
    ExpirationDate  time.Time

    // Hierarchy
    ParentAccountID *AccountID
    ChildAccounts   []AccountID
}

type ChartString struct {
    Fund       string  // Source of funds
    Org        string  // Organizational unit
    Account    string  // Type of expense
    Program    string  // Program or project
    Activity   string  // Specific activity
    Location   string  // Physical location
}

func (c ChartString) String() string {
    return fmt.Sprintf("%s-%s-%s-%s-%s-%s",
        c.Fund, c.Org, c.Account, c.Program, c.Activity, c.Location)
}
```

---

## 7. Identity Management Context (Shared Kernel)

### Purpose
Manages persons, organizations, and their relationships. This is a shared kernel used by all other contexts.

### Ubiquitous Language
- **Person**: An individual in the system (researcher, staff)
- **Organization**: An institution, department, or external entity
- **Extended Profile**: Additional domain-specific attributes for a person

### Aggregate: Person

```go
// domain/identity/person.go

package identity

type Person struct {
    ID              PersonID
    TenantID        TenantID

    // Identity
    ExternalID      string  // HR system ID
    ORCID           string  // Researcher identifier

    // Basic Info
    FirstName       string
    MiddleName      string
    LastName        string
    Suffix          string
    Email           string
    Phone           string

    // Institutional
    DepartmentID    DepartmentID
    Title           string
    Position        string

    // Extended Profile (for PI/researchers)
    ExtendedProfile *ExtendedProfile

    // Status
    Status          PersonStatus
    CreatedAt       time.Time
    UpdatedAt       time.Time
}

type ExtendedProfile struct {
    Credentials     []Credential  // PhD, MD, etc.
    Education       []Education
    Appointments    []Appointment
    ERACommonsID    string
    BiosketchURL    string
}

// Organization aggregate
type Organization struct {
    ID              OrganizationID
    TenantID        TenantID

    // Identity
    ExternalID      string
    DUNS            string
    EIN             string
    UEI             string  // Unique Entity Identifier

    // Details
    LegalName       string
    DBA             string  // Doing business as
    Type            OrganizationType
    Address         Address

    // For sponsors
    IsSponsor       bool
    SponsorCode     string

    // Authorized signatory for SF424
    AuthorizedSignatory *PersonID
}

type OrganizationType string
const (
    OrgTypeUniversity       OrganizationType = "UNIVERSITY"
    OrgTypeHospital         OrganizationType = "HOSPITAL"
    OrgTypeFederalAgency    OrganizationType = "FEDERAL_AGENCY"
    OrgTypeNonProfit        OrganizationType = "NON_PROFIT"
    OrgTypeForProfit        OrganizationType = "FOR_PROFIT"
    OrgTypeStateGovernment  OrganizationType = "STATE_GOVERNMENT"
    OrgTypeLocalGovernment  OrganizationType = "LOCAL_GOVERNMENT"
)
```

---

## Cross-Context Integration Patterns

### Anti-Corruption Layer (Account <-> External Finance)

```go
// infrastructure/external/finance/adapter.go

package finance

// FinanceSystemAdapter translates between our domain and external system
type FinanceSystemAdapter struct {
    client   ExternalFinanceClient
    mapper   AccountMapper
}

// CreateAccount creates account in external system
func (a *FinanceSystemAdapter) CreateAccount(ctx context.Context, account *account.FinancialAccount) (string, error) {
    // Translate to external format
    externalReq := a.mapper.ToExternalFormat(account)

    // Call external system
    resp, err := a.client.CreateAccount(ctx, externalReq)
    if err != nil {
        return "", fmt.Errorf("external finance error: %w", err)
    }

    // Return external ID
    return resp.AccountID, nil
}
```

### Customer-Supplier (Proposal -> SF424)

```go
// application/services/sf424_generation_service.go

type SF424GenerationService struct {
    proposalRepo proposal.ProposalRepository
    budgetRepo   budget.BudgetRepository
    formBuilder  sf424.FormBuilder
}

func (s *SF424GenerationService) GenerateForProposal(ctx context.Context, proposalID proposal.ProposalID) (*sf424.FormPackage, error) {
    // Consume proposal data (upstream)
    prop, err := s.proposalRepo.GetByID(ctx, proposalID)
    if err != nil {
        return nil, err
    }

    bdg, err := s.budgetRepo.GetByProposalID(ctx, proposalID)
    if err != nil {
        return nil, err
    }

    // Build forms (downstream conforms to upstream model)
    return s.formBuilder.BuildPackage(prop, bdg)
}
```

---

## Summary

| Context | Aggregate Root | Key Entities | External Integrations |
|---------|---------------|--------------|----------------------|
| Proposal | Proposal | TeamMember, StateTransition | - |
| Budget | Budget | BudgetPeriod, PersonnelCost | - |
| Award | Award | Modification, Subaward | - |
| SF424 | FormPackage | SF424Form, Attachment | Grants.gov |
| Compliance | ComplianceItem | Attachment | IRB/IACUC systems |
| Account | FinancialAccount | ChartString | Finance systems |
| Identity | Person, Organization | ExtendedProfile | HR systems |
