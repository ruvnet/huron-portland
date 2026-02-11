# Domain Events and Integration Patterns

## Overview

This document catalogs all domain events in the HRS Grants Module and defines the integration patterns between bounded contexts.

## Event Catalog

### Proposal Context Events

| Event Name | Description | Payload | Consumers |
|------------|-------------|---------|-----------|
| `proposal.created` | New proposal created | ProposalID, PI, Sponsor, Department | Notification, Audit |
| `proposal.updated` | Proposal details changed | ProposalID, ChangedFields, Actor | Audit, Search Index |
| `proposal.state_changed` | State transition occurred | ProposalID, FromState, ToState, Action, Actor | Notification, Integration, Audit |
| `proposal.submitted_for_review` | Ready for internal review | ProposalID, ReviewerDept, Deadline | Notification, Workflow |
| `proposal.approved` | Approved by department/sponsor | ProposalID, ApproverID, Level | Notification, Workflow |
| `proposal.rejected` | Rejected by reviewer | ProposalID, RejecterID, Reason | Notification |
| `proposal.submitted_to_agency` | Sent to funding agency | ProposalID, SubmissionID, AgencyName | SF424, Notification |
| `proposal.awarded` | Funding awarded | ProposalID, AwardAmount, StartDate | Award, Notification, Finance |
| `proposal.not_awarded` | Proposal declined | ProposalID, Reason | Notification |
| `proposal.withdrawn` | Proposal withdrawn | ProposalID, Reason, Actor | Notification, Audit |
| `proposal.team_member_added` | New team member | ProposalID, PersonID, Role | Notification, Budget |
| `proposal.team_member_removed` | Team member removed | ProposalID, PersonID | Notification, Budget |
| `proposal.cloned` | Proposal duplicated | SourceProposalID, NewProposalID | Audit |

### Budget Context Events

| Event Name | Description | Payload | Consumers |
|------------|-------------|---------|-----------|
| `budget.created` | New budget created | BudgetID, ProposalID | Audit |
| `budget.updated` | Budget modified | BudgetID, ChangedCategories, NewTotals | Audit, Proposal |
| `budget.period_added` | New budget period | BudgetID, PeriodNumber, StartDate, EndDate | Audit |
| `budget.personnel_added` | Personnel added to budget | BudgetID, PersonID, Effort, Salary | Notification |
| `budget.finalized` | Budget locked for submission | BudgetID, TotalAmount | Proposal, SF424 |
| `budget.revision_created` | Budget revision for award | BudgetID, AwardID, RevisionNumber | Notification, Audit |

### Award Context Events

| Event Name | Description | Payload | Consumers |
|------------|-------------|---------|-----------|
| `award.created` | Award established | AwardID, ProposalID, Amount, Period | Account, Notification |
| `award.activated` | Award became active | AwardID, StartDate, Budget | Account, Notification |
| `award.modified` | Award modification applied | AwardID, ModificationType, Changes | Account, Notification |
| `award.suspended` | Award suspended | AwardID, Reason, SuspendedBy | Account, Notification |
| `award.resumed` | Award resumed from suspension | AwardID, ResumedBy | Account, Notification |
| `award.extended` | No-cost extension granted | AwardID, NewEndDate | Account, Notification |
| `award.closeout_initiated` | Closeout process started | AwardID, CloseoutDate | Account, Compliance |
| `award.closed` | Award fully closed | AwardID, FinalExpenditure | Account, Audit |
| `award.subaward_issued` | Subaward created | AwardID, SubawardID, SubrecipientOrg | Compliance, Account |

### SF424 Context Events

| Event Name | Description | Payload | Consumers |
|------------|-------------|---------|-----------|
| `sf424.generated` | Form generated | FormID, ProposalID, FormType | Audit |
| `sf424.validated` | Form validation completed | FormID, IsValid, Errors | Notification |
| `sf424.submitted` | Form submitted to Grants.gov | FormID, TrackingNumber, Timestamp | Proposal, Notification |
| `sf424.rejected` | Grants.gov rejected submission | FormID, Errors, TrackingNumber | Notification |
| `sf424.received_by_agency` | Agency received application | FormID, AgencyTrackingNumber | Notification, Proposal |

### Compliance Context Events

| Event Name | Description | Payload | Consumers |
|------------|-------------|---------|-----------|
| `compliance.item_created` | Compliance requirement added | ItemID, ProposalID, Type | Notification |
| `compliance.approved` | Compliance item approved | ItemID, ApproverID, ExpirationDate | Proposal, Notification |
| `compliance.expired` | Compliance approval expired | ItemID, Type, ProposalID | Notification |
| `compliance.revoked` | Compliance revoked | ItemID, Reason, RevokedBy | Proposal, Notification |
| `compliance.renewal_required` | Renewal needed soon | ItemID, ExpirationDate | Notification |

### Account Context Events

| Event Name | Description | Payload | Consumers |
|------------|-------------|---------|-----------|
| `account.created` | Financial account created | AccountID, AwardID, ChartString | Audit |
| `account.funded` | Initial funding received | AccountID, Amount | Notification |
| `account.transaction_posted` | Transaction recorded | AccountID, TransactionID, Amount, Type | Audit |
| `account.budget_exceeded` | Spending over budget | AccountID, BudgetAmount, ActualAmount | Notification |
| `account.closing` | Account nearing close date | AccountID, CloseDate, Balance | Notification |
| `account.closed` | Account closed | AccountID, FinalBalance | Audit |

### Identity Context Events

| Event Name | Description | Payload | Consumers |
|------------|-------------|---------|-----------|
| `person.created` | New person added | PersonID, Email, DepartmentID | Audit |
| `person.updated` | Person info changed | PersonID, ChangedFields | Audit, Search |
| `person.profile_extended` | Extended profile added | PersonID, ProfileType | Proposal |
| `person.deactivated` | Person deactivated | PersonID, Reason | All Contexts |
| `organization.created` | New organization added | OrgID, Type, Name | Audit |
| `organization.updated` | Organization info changed | OrgID, ChangedFields | SF424, Audit |

---

## Event Schema Definitions

### Base Event Structure

```go
// Shared event structure
type DomainEvent struct {
    // Metadata
    ID            string    `json:"id"`
    Type          string    `json:"type"`
    Version       int       `json:"version"`
    Timestamp     time.Time `json:"timestamp"`
    CorrelationID string    `json:"correlation_id"`
    CausationID   string    `json:"causation_id"`

    // Source
    AggregateType string    `json:"aggregate_type"`
    AggregateID   string    `json:"aggregate_id"`
    TenantID      string    `json:"tenant_id"`

    // Actor
    ActorID       string    `json:"actor_id"`
    ActorType     string    `json:"actor_type"`  // USER, SYSTEM, INTEGRATION

    // Payload
    Data          json.RawMessage `json:"data"`
}
```

### Example Event Definitions

```go
// ProposalStateChanged event
type ProposalStateChangedData struct {
    ProposalID    string `json:"proposal_id"`
    FromState     string `json:"from_state"`
    ToState       string `json:"to_state"`
    Action        string `json:"action"`
    Reason        string `json:"reason,omitempty"`
    ActorID       string `json:"actor_id"`
    ActorRole     string `json:"actor_role"`
}

// AwardCreated event
type AwardCreatedData struct {
    AwardID           string    `json:"award_id"`
    ProposalID        string    `json:"proposal_id"`
    SponsorAwardNumber string   `json:"sponsor_award_number"`
    TotalAmount       int64     `json:"total_amount"`
    StartDate         time.Time `json:"start_date"`
    EndDate           time.Time `json:"end_date"`
    PrincipalInvestigatorID string `json:"pi_id"`
}

// SF424Submitted event
type SF424SubmittedData struct {
    FormPackageID  string    `json:"form_package_id"`
    ProposalID     string    `json:"proposal_id"`
    TrackingNumber string    `json:"tracking_number"`
    SubmittedAt    time.Time `json:"submitted_at"`
    FormTypes      []string  `json:"form_types"`
}
```

---

## Integration Patterns

### 1. Event-Driven Integration

```
┌──────────────────────────────────────────────────────────────────────┐
│                         EVENT BUS                                    │
│  (PostgreSQL LISTEN/NOTIFY or Message Broker like RabbitMQ/Kafka)   │
└──────────────────────────────────────────────────────────────────────┘
         ▲                    ▲                    ▲
         │                    │                    │
    ┌────┴────┐          ┌────┴────┐          ┌────┴────┐
    │ Proposal│          │  Award  │          │ Account │
    │ Context │          │ Context │          │ Context │
    └─────────┘          └─────────┘          └─────────┘
```

### 2. Synchronous Query (for real-time data needs)

```go
// When SF424 needs current proposal data synchronously
type ProposalQueryService interface {
    GetProposalSummary(ctx context.Context, id ProposalID) (*ProposalSummary, error)
    GetBudgetSummary(ctx context.Context, proposalID ProposalID) (*BudgetSummary, error)
}
```

### 3. Event Handlers

```go
// Handle award creation when proposal is awarded
type ProposalAwardedHandler struct {
    awardService award.AwardService
}

func (h *ProposalAwardedHandler) Handle(ctx context.Context, event *ProposalAwarded) error {
    cmd := award.CreateAwardCommand{
        ProposalID:      event.ProposalID,
        AwardAmount:     event.AwardAmount,
        StartDate:       event.StartDate,
        EndDate:         event.EndDate,
        SponsorAwardNum: event.SponsorAwardNumber,
    }
    return h.awardService.CreateAward(ctx, cmd)
}

// Handle account creation when award is activated
type AwardActivatedHandler struct {
    accountService account.AccountService
}

func (h *AwardActivatedHandler) Handle(ctx context.Context, event *AwardActivated) error {
    cmd := account.CreateAccountCommand{
        AwardID:   event.AwardID,
        Budget:    event.InitialBudget,
        StartDate: event.StartDate,
        EndDate:   event.EndDate,
    }
    return h.accountService.CreateAccount(ctx, cmd)
}
```

### 4. Saga Pattern for Cross-Context Operations

```go
// SubmissionSaga coordinates proposal submission across contexts
type SubmissionSaga struct {
    proposalService  proposal.ProposalService
    sf424Service     sf424.SF424Service
    eventBus         EventBus
}

func (s *SubmissionSaga) Execute(ctx context.Context, proposalID ProposalID) error {
    // Step 1: Validate proposal is ready
    if err := s.proposalService.ValidateForSubmission(ctx, proposalID); err != nil {
        return err
    }

    // Step 2: Generate SF424 forms
    formPackage, err := s.sf424Service.GeneratePackage(ctx, proposalID)
    if err != nil {
        return err
    }

    // Step 3: Validate forms
    validationResult, err := s.sf424Service.Validate(ctx, formPackage.ID)
    if err != nil || !validationResult.IsValid {
        return ErrValidationFailed
    }

    // Step 4: Submit to Grants.gov
    submission, err := s.sf424Service.Submit(ctx, formPackage.ID)
    if err != nil {
        // Compensating action: mark proposal as submission failed
        s.proposalService.MarkSubmissionFailed(ctx, proposalID, err)
        return err
    }

    // Step 5: Update proposal state
    return s.proposalService.MarkSubmitted(ctx, proposalID, submission.TrackingNumber)
}
```

---

## Event Sourcing (Optional Enhancement)

For critical aggregates like Proposal and Award, event sourcing can provide complete audit history.

```go
// Event-sourced Proposal aggregate
type EventSourcedProposal struct {
    ID      ProposalID
    Version int
    State   ProposalState

    // Uncommitted events from current transaction
    uncommittedEvents []DomainEvent
}

// Apply events to rebuild state
func (p *EventSourcedProposal) Apply(event DomainEvent) error {
    switch e := event.(type) {
    case *ProposalCreated:
        p.ID = ProposalID(e.ProposalID)
        p.State = StateDraft
    case *ProposalStateChanged:
        p.State = ProposalState(e.ToState)
    // ... handle other events
    }
    p.Version++
    return nil
}

// Load from event store
func (r *EventSourcedProposalRepository) Load(ctx context.Context, id ProposalID) (*EventSourcedProposal, error) {
    events, err := r.eventStore.GetEvents(ctx, "proposal", string(id))
    if err != nil {
        return nil, err
    }

    proposal := &EventSourcedProposal{}
    for _, event := range events {
        if err := proposal.Apply(event); err != nil {
            return nil, err
        }
    }

    return proposal, nil
}
```

---

## Notification Mapping

Events trigger notifications based on roles and preferences:

| Event | Recipients | Channel |
|-------|------------|---------|
| `proposal.submitted_for_review` | Department Reviewers | Email, In-App |
| `proposal.approved` | PI, Team Members | Email, In-App |
| `proposal.rejected` | PI | Email |
| `proposal.awarded` | PI, Team, Grants Admin | Email, In-App |
| `award.modified` | PI, Grants Admin | Email, In-App |
| `compliance.expired` | PI, Compliance Officer | Email (urgent) |
| `account.budget_exceeded` | PI, Finance Officer | Email (urgent), In-App |

---

## Idempotency and Ordering

### Event Idempotency

```go
// EventProcessor ensures idempotent handling
type EventProcessor struct {
    processedEvents ProcessedEventStore
}

func (p *EventProcessor) Process(ctx context.Context, event DomainEvent) error {
    // Check if already processed
    if p.processedEvents.Exists(ctx, event.ID) {
        return nil // Already handled, skip
    }

    // Process event
    if err := p.handleEvent(ctx, event); err != nil {
        return err
    }

    // Mark as processed
    return p.processedEvents.Mark(ctx, event.ID)
}
```

### Event Ordering

```go
// Ensure events for same aggregate are processed in order
type OrderedEventProcessor struct {
    locks sync.Map // Per-aggregate locks
}

func (p *OrderedEventProcessor) Process(ctx context.Context, event DomainEvent) error {
    // Get lock for this aggregate
    lockKey := fmt.Sprintf("%s:%s", event.AggregateType, event.AggregateID)
    lock, _ := p.locks.LoadOrStore(lockKey, &sync.Mutex{})
    mu := lock.(*sync.Mutex)

    mu.Lock()
    defer mu.Unlock()

    // Verify version ordering
    currentVersion := p.getLastProcessedVersion(ctx, event.AggregateID)
    if event.Version <= currentVersion {
        return nil // Already processed or out of order
    }

    return p.handleEvent(ctx, event)
}
```

---

## Monitoring and Observability

### Event Metrics

```go
// Track event processing metrics
type EventMetrics struct {
    eventsPublished  prometheus.Counter
    eventsProcessed  prometheus.Counter
    eventsFailed     prometheus.Counter
    processingTime   prometheus.Histogram
}

func (m *EventMetrics) RecordPublish(eventType string) {
    m.eventsPublished.WithLabelValues(eventType).Inc()
}

func (m *EventMetrics) RecordProcess(eventType string, duration time.Duration, success bool) {
    m.processingTime.WithLabelValues(eventType).Observe(duration.Seconds())
    if success {
        m.eventsProcessed.WithLabelValues(eventType).Inc()
    } else {
        m.eventsFailed.WithLabelValues(eventType).Inc()
    }
}
```

### Dead Letter Queue

```go
// Failed events go to DLQ for investigation
type DeadLetterQueue struct {
    store DLQStore
}

func (q *DeadLetterQueue) Send(ctx context.Context, event DomainEvent, err error) error {
    return q.store.Save(ctx, &FailedEvent{
        Event:       event,
        Error:       err.Error(),
        FailedAt:    time.Now(),
        RetryCount:  0,
    })
}
```
