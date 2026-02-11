# Domain Aggregates and Entities

## Overview

This document provides detailed specifications for all aggregates and entities in the HRS Grants Module. Each aggregate is designed following DDD principles with clear boundaries, invariants, and behaviors.

---

## 1. Proposal Aggregate

### Aggregate Root: Proposal

```go
package proposal

// Proposal is the aggregate root for grant proposals
type Proposal struct {
    // Identity
    ID        ProposalID  `json:"id"`
    TenantID  TenantID    `json:"tenant_id"`

    // Core Attributes
    Title              string         `json:"title"`
    Abstract           string         `json:"abstract"`
    State              ProposalState  `json:"state"`
    Type               ProposalType   `json:"type"`

    // Relationships (by ID reference)
    PrincipalInvestigatorID PersonID     `json:"pi_id"`
    SponsorID               SponsorID    `json:"sponsor_id"`
    OpportunityID           *OpportunityID `json:"opportunity_id,omitempty"`
    DepartmentID            DepartmentID `json:"department_id"`
    ParentProposalID        *ProposalID  `json:"parent_proposal_id,omitempty"`

    // Timeline
    ProjectStartDate   time.Time  `json:"project_start_date"`
    ProjectEndDate     time.Time  `json:"project_end_date"`
    SubmissionDeadline *time.Time `json:"submission_deadline,omitempty"`

    // Embedded Entities
    TeamMembers  []TeamMember      `json:"team_members"`
    StateHistory []StateTransition `json:"state_history"`

    // Metadata
    CreatedAt time.Time  `json:"created_at"`
    UpdatedAt time.Time  `json:"updated_at"`
    CreatedBy PersonID   `json:"created_by"`
    UpdatedBy PersonID   `json:"updated_by"`
    Version   int        `json:"version"`
    DeletedAt *time.Time `json:"deleted_at,omitempty"`

    // Uncommitted Events
    events []DomainEvent
}

// Invariants:
// 1. Title must not be empty (max 200 chars)
// 2. ProjectEndDate must be after ProjectStartDate
// 3. Must have at least one team member (the PI)
// 4. State transitions must follow valid paths
// 5. Only one PI role allowed

// Behaviors
func (p *Proposal) Create(cmd CreateProposalCommand, actor Actor) error
func (p *Proposal) Update(cmd UpdateProposalCommand, actor Actor) error
func (p *Proposal) Transition(action ProposalAction, actor Actor, reason string) (*StateTransition, error)
func (p *Proposal) AddTeamMember(member TeamMember, actor Actor) error
func (p *Proposal) RemoveTeamMember(personID PersonID, actor Actor) error
func (p *Proposal) UpdateTeamMember(personID PersonID, updates TeamMemberUpdate, actor Actor) error
func (p *Proposal) Clone(newType ProposalType, actor Actor) (*Proposal, error)
func (p *Proposal) CanTransition(action ProposalAction) bool
func (p *Proposal) AvailableActions(actor Actor) []ProposalAction
```

### Entity: TeamMember

```go
// TeamMember represents a person on the proposal team
type TeamMember struct {
    PersonID      PersonID   `json:"person_id"`
    Role          TeamRole   `json:"role"`
    EffortPercent float64    `json:"effort_percent"` // 0-100
    IsPISurrogate bool       `json:"is_pi_surrogate"`
    AddedAt       time.Time  `json:"added_at"`
    AddedBy       PersonID   `json:"added_by"`
}

// Invariants:
// 1. EffortPercent must be between 0 and 100
// 2. Only one member can have PRINCIPAL_INVESTIGATOR role
// 3. IsPISurrogate can only be true if Role is not PI
```

### Entity: StateTransition

```go
// StateTransition records a state change
type StateTransition struct {
    ID         string         `json:"id"`
    FromState  ProposalState  `json:"from_state"`
    ToState    ProposalState  `json:"to_state"`
    Action     ProposalAction `json:"action"`
    ActorID    PersonID       `json:"actor_id"`
    ActorRole  string         `json:"actor_role"`
    Reason     string         `json:"reason,omitempty"`
    Timestamp  time.Time      `json:"timestamp"`
    Metadata   map[string]any `json:"metadata,omitempty"`
}
```

### Value Objects

```go
// ProposalID is a strongly-typed identifier
type ProposalID string

func NewProposalID() ProposalID {
    return ProposalID(uuid.New().String())
}

func (id ProposalID) String() string {
    return string(id)
}

func (id ProposalID) IsValid() bool {
    _, err := uuid.Parse(string(id))
    return err == nil
}

// ProposalState represents workflow states
type ProposalState string

const (
    StateDraft              ProposalState = "DRAFT"
    StateInProgress         ProposalState = "IN_PROGRESS"
    StateReadyForReview     ProposalState = "READY_FOR_REVIEW"
    StateUnderDeptReview    ProposalState = "UNDER_DEPT_REVIEW"
    StateDeptApproved       ProposalState = "DEPT_APPROVED"
    StateDeptRejected       ProposalState = "DEPT_REJECTED"
    StateUnderSponsorReview ProposalState = "UNDER_SPONSOR_REVIEW"
    StateSponsorApproved    ProposalState = "SPONSOR_APPROVED"
    StateSponsorRejected    ProposalState = "SPONSOR_REJECTED"
    StateReadyForSubmission ProposalState = "READY_FOR_SUBMISSION"
    StateSubmitting         ProposalState = "SUBMITTING"
    StateSubmitted          ProposalState = "SUBMITTED"
    StateSubmissionFailed   ProposalState = "SUBMISSION_FAILED"
    StateUnderAgencyReview  ProposalState = "UNDER_AGENCY_REVIEW"
    StateAwarded            ProposalState = "AWARDED"
    StateNotAwarded         ProposalState = "NOT_AWARDED"
    StateWithdrawn          ProposalState = "WITHDRAWN"
    StateRevisionRequested  ProposalState = "REVISION_REQUESTED"
    StateRevisionInProgress ProposalState = "REVISION_IN_PROGRESS"
    StateRevisionSubmitted  ProposalState = "REVISION_SUBMITTED"
    StateArchived           ProposalState = "ARCHIVED"
)

func (s ProposalState) IsEditable() bool {
    return s == StateDraft || s == StateInProgress || s == StateRevisionInProgress
}

func (s ProposalState) IsTerminal() bool {
    return s == StateArchived || s == StateWithdrawn
}

// ProposalType categorizes proposals
type ProposalType string

const (
    TypeNew          ProposalType = "NEW"
    TypeRenewal      ProposalType = "RENEWAL"
    TypeContinuation ProposalType = "CONTINUATION"
    TypeRevision     ProposalType = "REVISION"
)

// TeamRole defines roles on the team
type TeamRole string

const (
    RolePI              TeamRole = "PRINCIPAL_INVESTIGATOR"
    RoleCoPI            TeamRole = "CO_PRINCIPAL_INVESTIGATOR"
    RoleSeniorPersonnel TeamRole = "SENIOR_PERSONNEL"
    RolePostDoc         TeamRole = "POST_DOCTORAL"
    RoleGradStudent     TeamRole = "GRADUATE_STUDENT"
    RoleUndergrad       TeamRole = "UNDERGRADUATE"
    RoleOther           TeamRole = "OTHER"
)
```

---

## 2. Budget Aggregate

### Aggregate Root: Budget

```go
package budget

// Budget is the aggregate root for proposal budgets
type Budget struct {
    // Identity
    ID         BudgetID   `json:"id"`
    ProposalID ProposalID `json:"proposal_id"`
    TenantID   TenantID   `json:"tenant_id"`

    // Structure
    Periods []BudgetPeriod `json:"periods"`

    // F&A Configuration
    FARate FARate `json:"fa_rate"`
    FABase FABase `json:"fa_base"`

    // Status
    Status   BudgetStatus `json:"status"`
    IsLocked bool         `json:"is_locked"`

    // Calculated Totals (denormalized for performance)
    TotalDirectCosts   Money `json:"total_direct_costs"`
    TotalIndirectCosts Money `json:"total_indirect_costs"`
    TotalCostSharing   Money `json:"total_cost_sharing"`
    TotalProjectCost   Money `json:"total_project_cost"`

    // Metadata
    Version   int       `json:"version"`
    UpdatedAt time.Time `json:"updated_at"`
    UpdatedBy PersonID  `json:"updated_by"`
}

// Invariants:
// 1. Periods must be contiguous and non-overlapping
// 2. Total calculations must be accurate
// 3. Cannot modify if IsLocked = true
// 4. At least one period required

// Behaviors
func (b *Budget) AddPeriod(period BudgetPeriod) error
func (b *Budget) UpdatePeriod(periodID BudgetPeriodID, updates PeriodUpdate) error
func (b *Budget) RemovePeriod(periodID BudgetPeriodID) error
func (b *Budget) AddPersonnelCost(periodID BudgetPeriodID, cost PersonnelCost) error
func (b *Budget) UpdatePersonnelCost(periodID BudgetPeriodID, costID string, updates PersonnelUpdate) error
func (b *Budget) RemovePersonnelCost(periodID BudgetPeriodID, costID string) error
func (b *Budget) Finalize(actor Actor) error
func (b *Budget) Unlock(actor Actor, reason string) error
func (b *Budget) RecalculateTotals() error
```

### Entity: BudgetPeriod

```go
// BudgetPeriod represents one fiscal year of the budget
type BudgetPeriod struct {
    ID           BudgetPeriodID `json:"id"`
    PeriodNumber int            `json:"period_number"` // 1, 2, 3, etc.
    StartDate    time.Time      `json:"start_date"`
    EndDate      time.Time      `json:"end_date"`

    // Cost Categories
    Personnel   []PersonnelCost   `json:"personnel"`
    Equipment   []EquipmentCost   `json:"equipment"`
    Travel      []TravelCost      `json:"travel"`
    Supplies    []SupplyCost      `json:"supplies"`
    Contractual []ContractualCost `json:"contractual"`
    Other       []OtherCost       `json:"other"`

    // Calculated
    DirectCostsSubtotal   Money `json:"direct_costs_subtotal"`
    IndirectCostsSubtotal Money `json:"indirect_costs_subtotal"`
    CostSharingSubtotal   Money `json:"cost_sharing_subtotal"`
    PeriodTotal           Money `json:"period_total"`
}
```

### Entity: PersonnelCost

```go
// PersonnelCost represents salary and fringe for one person
type PersonnelCost struct {
    ID              string    `json:"id"`
    PersonID        PersonID  `json:"person_id"`
    Role            TeamRole  `json:"role"`
    Name            string    `json:"name"` // Denormalized for display
    BaseSalary      Money     `json:"base_salary"`
    EffortPercent   float64   `json:"effort_percent"`
    RequestedSalary Money     `json:"requested_salary"`
    FringeBenefits  Money     `json:"fringe_benefits"`
    FringeRate      float64   `json:"fringe_rate"`
    TotalCost       Money     `json:"total_cost"`
    CostSharing     Money     `json:"cost_sharing"`
    Justification   string    `json:"justification,omitempty"`
}

// Invariants:
// 1. RequestedSalary = BaseSalary * EffortPercent
// 2. FringeBenefits = RequestedSalary * FringeRate
// 3. TotalCost = RequestedSalary + FringeBenefits
```

### Value Objects

```go
// Money represents currency amounts
type Money struct {
    Amount   int64  `json:"amount"`   // Stored in cents
    Currency string `json:"currency"` // ISO 4217 code
}

func NewMoney(dollars float64, currency string) Money {
    return Money{
        Amount:   int64(dollars * 100),
        Currency: currency,
    }
}

func (m Money) Add(other Money) Money {
    if m.Currency != other.Currency {
        panic("currency mismatch")
    }
    return Money{Amount: m.Amount + other.Amount, Currency: m.Currency}
}

func (m Money) Subtract(other Money) Money {
    if m.Currency != other.Currency {
        panic("currency mismatch")
    }
    return Money{Amount: m.Amount - other.Amount, Currency: m.Currency}
}

func (m Money) Multiply(factor float64) Money {
    return Money{Amount: int64(float64(m.Amount) * factor), Currency: m.Currency}
}

func (m Money) ToDollars() float64 {
    return float64(m.Amount) / 100
}

func (m Money) String() string {
    return fmt.Sprintf("$%.2f", m.ToDollars())
}

// FARate represents F&A rate configuration
type FARate struct {
    Rate          float64 `json:"rate"`           // e.g., 0.55 for 55%
    Type          string  `json:"type"`           // MTDC, TDC, etc.
    AgreementID   string  `json:"agreement_id"`   // Negotiated rate agreement
    EffectiveDate time.Time `json:"effective_date"`
    ExpirationDate time.Time `json:"expiration_date"`
}

// FABase defines what costs the rate applies to
type FABase string

const (
    FABaseMTDC          FABase = "MODIFIED_TOTAL_DIRECT_COSTS"
    FABaseTDC           FABase = "TOTAL_DIRECT_COSTS"
    FABaseSalariesWages FABase = "SALARIES_AND_WAGES"
)
```

---

## 3. Award Aggregate

### Aggregate Root: Award

```go
package award

// Award is the aggregate root for funded grants
type Award struct {
    // Identity
    ID         AwardID    `json:"id"`
    ProposalID ProposalID `json:"proposal_id"`
    TenantID   TenantID   `json:"tenant_id"`

    // Sponsor Information
    SponsorAwardNumber string    `json:"sponsor_award_number"`
    SponsorID          SponsorID `json:"sponsor_id"`
    PrimeAwardID       *AwardID  `json:"prime_award_id,omitempty"` // If subaward

    // Award Details
    Title  string      `json:"title"`
    Type   AwardType   `json:"type"`
    Status AwardStatus `json:"status"`

    // Timeline
    ProjectStartDate time.Time `json:"project_start_date"`
    ProjectEndDate   time.Time `json:"project_end_date"`
    BudgetStartDate  time.Time `json:"budget_start_date"`
    BudgetEndDate    time.Time `json:"budget_end_date"`

    // Financial
    TotalAwardAmount Money `json:"total_award_amount"`
    ObligatedAmount  Money `json:"obligated_amount"`
    ExpendedAmount   Money `json:"expended_amount"`   // From finance system
    AvailableBalance Money `json:"available_balance"` // Calculated

    // Team
    PrincipalInvestigatorID PersonID `json:"pi_id"`

    // Child Aggregates (by reference)
    ModificationIDs []ModificationID `json:"modification_ids"`
    SubawardIDs     []SubawardID     `json:"subaward_ids"`

    // Metadata
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    Version   int       `json:"version"`
}

// Invariants:
// 1. BudgetEndDate must be on or before ProjectEndDate
// 2. ObligatedAmount cannot exceed TotalAwardAmount
// 3. Status transitions must follow valid paths
// 4. Cannot modify if Status is CLOSED or TERMINATED

// Behaviors
func (a *Award) Activate(cmd ActivateAwardCommand, actor Actor) error
func (a *Award) Suspend(reason string, actor Actor) error
func (a *Award) Resume(actor Actor) error
func (a *Award) RequestModification(cmd ModificationCommand, actor Actor) (*Modification, error)
func (a *Award) ApplyModification(modID ModificationID, actor Actor) error
func (a *Award) Extend(newEndDate time.Time, actor Actor) error
func (a *Award) InitiateCloseout(actor Actor) error
func (a *Award) Close(finalReport FinalReport, actor Actor) error
func (a *Award) UpdateFinancials(expenditure Money) error
```

### Entity: Modification

```go
// Modification represents a change to the award
type Modification struct {
    ID                 ModificationID     `json:"id"`
    AwardID            AwardID            `json:"award_id"`
    ModificationNumber string             `json:"modification_number"`
    Type               ModificationType   `json:"type"`
    Status             ModificationStatus `json:"status"`
    EffectiveDate      time.Time          `json:"effective_date"`
    Description        string             `json:"description"`
    Changes            ModificationChanges `json:"changes"`
    RequestedBy        PersonID           `json:"requested_by"`
    RequestedAt        time.Time          `json:"requested_at"`
    ApprovedBy         *PersonID          `json:"approved_by,omitempty"`
    ApprovedAt         *time.Time         `json:"approved_at,omitempty"`
}

type ModificationChanges struct {
    BudgetRevision     *BudgetRevision   `json:"budget_revision,omitempty"`
    TimelineExtension  *TimelineExtension `json:"timeline_extension,omitempty"`
    ScopeChange        *ScopeChange      `json:"scope_change,omitempty"`
    PIChange           *PIChange         `json:"pi_change,omitempty"`
    SupplementalAmount *Money            `json:"supplemental_amount,omitempty"`
}
```

### Value Objects

```go
type AwardStatus string

const (
    AwardStatusPending         AwardStatus = "PENDING"
    AwardStatusActive          AwardStatus = "ACTIVE"
    AwardStatusSuspended       AwardStatus = "SUSPENDED"
    AwardStatusNoCostExtension AwardStatus = "NO_COST_EXTENSION"
    AwardStatusCloseout        AwardStatus = "CLOSEOUT"
    AwardStatusClosed          AwardStatus = "CLOSED"
    AwardStatusTerminated      AwardStatus = "TERMINATED"
)

type AwardType string

const (
    AwardTypeGrant            AwardType = "GRANT"
    AwardTypeCooperative      AwardType = "COOPERATIVE_AGREEMENT"
    AwardTypeContract         AwardType = "CONTRACT"
    AwardTypeSubaward         AwardType = "SUBAWARD"
    AwardTypeIndustrySponsored AwardType = "INDUSTRY_SPONSORED"
)

type ModificationType string

const (
    ModTypeBudgetRevision      ModificationType = "BUDGET_REVISION"
    ModTypeNoCostExtension     ModificationType = "NO_COST_EXTENSION"
    ModTypeScopeChange         ModificationType = "SCOPE_CHANGE"
    ModTypePIChange            ModificationType = "PI_CHANGE"
    ModTypeCarryforward        ModificationType = "CARRYFORWARD"
    ModTypeSupplementalFunding ModificationType = "SUPPLEMENTAL_FUNDING"
    ModTypeRebudget            ModificationType = "REBUDGET"
)
```

---

## 4. SF424 Aggregate

### Aggregate Root: FormPackage

```go
package sf424

// FormPackage is the aggregate root for Grants.gov submissions
type FormPackage struct {
    // Identity
    ID         FormPackageID `json:"id"`
    ProposalID ProposalID    `json:"proposal_id"`
    TenantID   TenantID      `json:"tenant_id"`

    // Forms
    SF424          *SF424Form   `json:"sf424"`
    SF424A         *SF424AForm  `json:"sf424a,omitempty"`
    SF424B         *SF424BForm  `json:"sf424b,omitempty"`
    SF424RR        *SF424RRForm `json:"sf424_rr,omitempty"`
    OtherForms     []FormRef    `json:"other_forms,omitempty"`

    // Attachments
    ProjectNarrative *Attachment  `json:"project_narrative,omitempty"`
    BudgetNarrative  *Attachment  `json:"budget_narrative,omitempty"`
    OtherAttachments []Attachment `json:"other_attachments,omitempty"`

    // Status
    Status           FormPackageStatus   `json:"status"`
    ValidationStatus ValidationStatus    `json:"validation_status"`
    ValidationErrors []ValidationError   `json:"validation_errors,omitempty"`

    // Submission
    SubmissionAttempts []SubmissionAttempt `json:"submission_attempts,omitempty"`
    GrantsGovTracking  *GrantsGovTracking  `json:"grants_gov_tracking,omitempty"`

    // Generated Data
    GeneratedXML []byte `json:"-"` // Binary, not serialized
    XMLHash      string `json:"xml_hash,omitempty"`

    // Metadata
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    Version   int       `json:"version"`
}

// Invariants:
// 1. SF424 is always required
// 2. Cannot submit without ValidationStatus = VALID
// 3. Must have ProjectNarrative attachment

// Behaviors
func (f *FormPackage) Generate(proposal *Proposal, budget *Budget, org *Organization) error
func (f *FormPackage) Validate() ([]ValidationError, error)
func (f *FormPackage) Submit(actor Actor) (*SubmissionAttempt, error)
func (f *FormPackage) UpdateStatus(status GrantsGovStatus) error
func (f *FormPackage) AddAttachment(att Attachment) error
func (f *FormPackage) RemoveAttachment(attID AttachmentID) error
```

### Value Objects

```go
// GrantsGovTracking tracks submission status
type GrantsGovTracking struct {
    TrackingNumber     string          `json:"tracking_number"`
    ReceivedDateTime   time.Time       `json:"received_datetime"`
    Status             GrantsGovStatus `json:"status"`
    AgencyTrackingNum  string          `json:"agency_tracking_num,omitempty"`
    StatusHistory      []StatusUpdate  `json:"status_history"`
    LastCheckedAt      time.Time       `json:"last_checked_at"`
}

type GrantsGovStatus string

const (
    GGStatusReceived         GrantsGovStatus = "RECEIVED"
    GGStatusValidating       GrantsGovStatus = "VALIDATING"
    GGStatusValidated        GrantsGovStatus = "VALIDATED"
    GGStatusRejected         GrantsGovStatus = "REJECTED"
    GGStatusReceivedByAgency GrantsGovStatus = "RECEIVED_BY_AGENCY"
    GGStatusAgencyTracking   GrantsGovStatus = "AGENCY_TRACKING_NUMBER_ASSIGNED"
)

// Attachment represents a document attachment
type Attachment struct {
    ID           AttachmentID `json:"id"`
    Name         string       `json:"name"`
    FileName     string       `json:"file_name"`
    ContentType  string       `json:"content_type"`
    Size         int64        `json:"size"`
    Hash         string       `json:"hash"` // SHA-256
    StoragePath  string       `json:"storage_path"`
    UploadedAt   time.Time    `json:"uploaded_at"`
    UploadedBy   PersonID     `json:"uploaded_by"`
}
```

---

## 5. Compliance Aggregate

### Aggregate Root: ComplianceItem

```go
package compliance

// ComplianceItem is the aggregate root for regulatory requirements
type ComplianceItem struct {
    // Identity
    ID         ComplianceItemID `json:"id"`
    ProposalID ProposalID       `json:"proposal_id"`
    AwardID    *AwardID         `json:"award_id,omitempty"`
    TenantID   TenantID         `json:"tenant_id"`

    // Type and Protocol
    Type             ComplianceType `json:"type"`
    ProtocolNumber   string         `json:"protocol_number"`
    ExternalSystemID string         `json:"external_system_id,omitempty"`
    Title            string         `json:"title"`
    Description      string         `json:"description,omitempty"`

    // Status
    Status         ComplianceStatus `json:"status"`
    ExpirationDate *time.Time       `json:"expiration_date,omitempty"`

    // Approval
    ApprovedBy    *PersonID  `json:"approved_by,omitempty"`
    ApprovedAt    *time.Time `json:"approved_at,omitempty"`
    ApprovalNotes string     `json:"approval_notes,omitempty"`

    // Documents
    Attachments []Attachment `json:"attachments,omitempty"`

    // Metadata
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
    Version   int       `json:"version"`
}

// Invariants:
// 1. ProtocolNumber must be unique per Type within proposal
// 2. ExpirationDate required when Status = APPROVED
// 3. Cannot approve without ApprovedBy

// Behaviors
func (c *ComplianceItem) Approve(approver PersonID, expirationDate time.Time, notes string) error
func (c *ComplianceItem) Revoke(reason string, actor Actor) error
func (c *ComplianceItem) Renew(newExpirationDate time.Time, actor Actor) error
func (c *ComplianceItem) MarkExpired() error
func (c *ComplianceItem) LinkToAward(awardID AwardID) error
func (c *ComplianceItem) AddAttachment(att Attachment) error
```

### Value Objects

```go
type ComplianceType string

const (
    ComplianceIRB    ComplianceType = "IRB"     // Human subjects
    ComplianceIACUC  ComplianceType = "IACUC"   // Animal subjects
    ComplianceIBC    ComplianceType = "IBC"     // Biosafety
    ComplianceRCR    ComplianceType = "RCR"     // Responsible conduct
    ComplianceCOI    ComplianceType = "COI"     // Conflict of interest
    ComplianceExport ComplianceType = "EXPORT"  // Export control
)

type ComplianceStatus string

const (
    ComplianceNotRequired ComplianceStatus = "NOT_REQUIRED"
    CompliancePending     ComplianceStatus = "PENDING"
    ComplianceApproved    ComplianceStatus = "APPROVED"
    ComplianceExpired     ComplianceStatus = "EXPIRED"
    ComplianceRevoked     ComplianceStatus = "REVOKED"
)
```

---

## 6. Identity Aggregate (Shared Kernel)

### Aggregate Root: Person

```go
package identity

// Person represents individuals in the system
type Person struct {
    // Identity
    ID         PersonID  `json:"id"`
    TenantID   TenantID  `json:"tenant_id"`
    ExternalID string    `json:"external_id,omitempty"` // HR system ID

    // Name
    FirstName  string `json:"first_name"`
    MiddleName string `json:"middle_name,omitempty"`
    LastName   string `json:"last_name"`
    Suffix     string `json:"suffix,omitempty"`

    // Contact
    Email     string `json:"email"`
    Phone     string `json:"phone,omitempty"`

    // Institutional
    DepartmentID DepartmentID `json:"department_id"`
    Title        string       `json:"title,omitempty"`
    Position     string       `json:"position,omitempty"`

    // Extended Profile (for researchers)
    ExtendedProfile *ExtendedProfile `json:"extended_profile,omitempty"`

    // Identifiers
    ORCID        string `json:"orcid,omitempty"`
    ERACommonsID string `json:"era_commons_id,omitempty"`

    // Status
    Status    PersonStatus `json:"status"`
    CreatedAt time.Time    `json:"created_at"`
    UpdatedAt time.Time    `json:"updated_at"`
}

// ExtendedProfile contains researcher-specific information
type ExtendedProfile struct {
    Credentials  []Credential  `json:"credentials,omitempty"`
    Education    []Education   `json:"education,omitempty"`
    Appointments []Appointment `json:"appointments,omitempty"`
    BiosketchURL string        `json:"biosketch_url,omitempty"`
}
```

### Aggregate Root: Organization

```go
// Organization represents institutions and sponsors
type Organization struct {
    // Identity
    ID         OrganizationID `json:"id"`
    TenantID   TenantID       `json:"tenant_id"`
    ExternalID string         `json:"external_id,omitempty"`

    // Identifiers
    DUNS string `json:"duns,omitempty"`
    EIN  string `json:"ein,omitempty"`
    UEI  string `json:"uei,omitempty"` // Unique Entity Identifier

    // Details
    LegalName string           `json:"legal_name"`
    DBA       string           `json:"dba,omitempty"` // Doing business as
    Type      OrganizationType `json:"type"`

    // Address
    Address Address `json:"address"`

    // For sponsors
    IsSponsor   bool   `json:"is_sponsor"`
    SponsorCode string `json:"sponsor_code,omitempty"`

    // Authorized signatory
    AuthorizedSignatoryID *PersonID `json:"authorized_signatory_id,omitempty"`

    // Status
    Status    OrgStatus `json:"status"`
    CreatedAt time.Time `json:"created_at"`
    UpdatedAt time.Time `json:"updated_at"`
}
```

### Value Objects

```go
// Address represents a physical address
type Address struct {
    Street1    string `json:"street1"`
    Street2    string `json:"street2,omitempty"`
    City       string `json:"city"`
    State      string `json:"state"`
    PostalCode string `json:"postal_code"`
    Country    string `json:"country"` // ISO 3166-1 alpha-2
}

func (a Address) IsComplete() bool {
    return a.Street1 != "" && a.City != "" && a.State != "" &&
           a.PostalCode != "" && a.Country != ""
}

// Credential represents academic credentials
type Credential struct {
    Type         string    `json:"type"`  // PhD, MD, MS, etc.
    Field        string    `json:"field"` // Area of study
    Institution  string    `json:"institution"`
    Year         int       `json:"year"`
}
```

---

## Repository Interfaces

Each aggregate has a corresponding repository interface:

```go
// ProposalRepository
type ProposalRepository interface {
    Save(ctx context.Context, proposal *Proposal) error
    GetByID(ctx context.Context, id ProposalID) (*Proposal, error)
    FindByTenant(ctx context.Context, tenantID TenantID, params ListParams) ([]*Proposal, int, error)
    FindByPI(ctx context.Context, piID PersonID, params ListParams) ([]*Proposal, int, error)
    FindByDepartment(ctx context.Context, deptID DepartmentID, params ListParams) ([]*Proposal, int, error)
    Delete(ctx context.Context, id ProposalID) error
}

// BudgetRepository
type BudgetRepository interface {
    Save(ctx context.Context, budget *Budget) error
    GetByID(ctx context.Context, id BudgetID) (*Budget, error)
    GetByProposalID(ctx context.Context, proposalID ProposalID) (*Budget, error)
}

// AwardRepository
type AwardRepository interface {
    Save(ctx context.Context, award *Award) error
    GetByID(ctx context.Context, id AwardID) (*Award, error)
    GetByProposalID(ctx context.Context, proposalID ProposalID) (*Award, error)
    FindByTenant(ctx context.Context, tenantID TenantID, params ListParams) ([]*Award, int, error)
    FindByPI(ctx context.Context, piID PersonID, params ListParams) ([]*Award, int, error)
}

// Similar patterns for other aggregates...
```
