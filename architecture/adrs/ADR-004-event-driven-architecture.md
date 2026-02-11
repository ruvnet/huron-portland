# ADR-004: Event-Driven Architecture for Domain Events

## Status
Accepted

## Date
2026-01-25

## Context

The HRS Grants Module requires:
- Loose coupling between bounded contexts
- Audit trail of all significant domain changes
- Integration with external systems (Grants.gov, Financial systems)
- Real-time notifications to users
- Eventual consistency across contexts

## Decision

We will implement an **Event-Driven Architecture** using domain events with:
1. Domain events as part of the aggregate pattern
2. Transactional outbox pattern for reliable publishing
3. Event sourcing for critical aggregates (optional enhancement)
4. Async event handlers for side effects

### Event Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BOUNDED CONTEXT A                        │
│  ┌───────────┐     ┌──────────────────┐                    │
│  │ Aggregate │────▶│  Domain Events   │                    │
│  └───────────┘     └────────┬─────────┘                    │
│                             │                               │
│  ┌──────────────────────────▼──────────────────────────┐   │
│  │                  OUTBOX TABLE                        │   │
│  │  (Stored in same transaction as aggregate changes)  │   │
│  └──────────────────────────┬──────────────────────────┘   │
└─────────────────────────────┼───────────────────────────────┘
                              │
┌─────────────────────────────▼───────────────────────────────┐
│                      EVENT BUS                               │
│  (PostgreSQL LISTEN/NOTIFY or Message Broker)               │
└─────────────────────────────┬───────────────────────────────┘
                              │
         ┌────────────────────┼────────────────────┐
         │                    │                    │
         ▼                    ▼                    ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Event Handler  │  │  Event Handler  │  │  Event Handler  │
│  (Notification) │  │  (Integration)  │  │  (Audit Log)    │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

### Domain Event Base

```go
// domain/shared/events.go

package shared

import (
    "encoding/json"
    "time"
)

// DomainEvent is the base interface for all domain events
type DomainEvent interface {
    EventType() string
    AggregateID() string
    AggregateType() string
    OccurredAt() time.Time
    TenantID() string
    Payload() json.RawMessage
}

// BaseEvent provides common event fields
type BaseEvent struct {
    ID            string          `json:"id"`
    Type          string          `json:"type"`
    AggregateID_  string          `json:"aggregate_id"`
    AggregateType_ string         `json:"aggregate_type"`
    TenantID_     string          `json:"tenant_id"`
    OccurredAt_   time.Time       `json:"occurred_at"`
    Version       int             `json:"version"`
    CorrelationID string          `json:"correlation_id"`
    CausationID   string          `json:"causation_id"`
    Metadata      json.RawMessage `json:"metadata"`
    Data          json.RawMessage `json:"data"`
}

func (e *BaseEvent) EventType() string      { return e.Type }
func (e *BaseEvent) AggregateID() string    { return e.AggregateID_ }
func (e *BaseEvent) AggregateType() string  { return e.AggregateType_ }
func (e *BaseEvent) OccurredAt() time.Time  { return e.OccurredAt_ }
func (e *BaseEvent) TenantID() string       { return e.TenantID_ }
func (e *BaseEvent) Payload() json.RawMessage { return e.Data }
```

### Proposal Domain Events

```go
// domain/proposal/events.go

package proposal

import (
    "encoding/json"
    "time"
    "github.com/hrs/grants/domain/shared"
)

// ProposalCreated is emitted when a new proposal is created
type ProposalCreated struct {
    shared.BaseEvent
    ProposalData ProposalCreatedData `json:"proposal_data"`
}

type ProposalCreatedData struct {
    Title                 string    `json:"title"`
    PrincipalInvestigator string    `json:"principal_investigator"`
    SponsorID             string    `json:"sponsor_id"`
    DepartmentID          string    `json:"department_id"`
    ProjectStartDate      time.Time `json:"project_start_date"`
    ProjectEndDate        time.Time `json:"project_end_date"`
}

// ProposalStateChanged is emitted on every state transition
type ProposalStateChanged struct {
    shared.BaseEvent
    TransitionData StateTransitionData `json:"transition_data"`
}

type StateTransitionData struct {
    FromState   ProposalState `json:"from_state"`
    ToState     ProposalState `json:"to_state"`
    Action      string        `json:"action"`
    ActorID     string        `json:"actor_id"`
    ActorRole   string        `json:"actor_role"`
    Reason      string        `json:"reason,omitempty"`
}

// ProposalSubmitted is emitted when proposal is submitted to agency
type ProposalSubmitted struct {
    shared.BaseEvent
    SubmissionData SubmissionData `json:"submission_data"`
}

type SubmissionData struct {
    GrantsGovTrackingID string    `json:"grants_gov_tracking_id"`
    SubmissionTimestamp time.Time `json:"submission_timestamp"`
    SF424FormVersion    string    `json:"sf424_form_version"`
}

// BudgetUpdated is emitted when budget changes
type BudgetUpdated struct {
    shared.BaseEvent
    BudgetData BudgetUpdateData `json:"budget_data"`
}

type BudgetUpdateData struct {
    TotalDirectCosts   int64 `json:"total_direct_costs"`
    TotalIndirectCosts int64 `json:"total_indirect_costs"`
    TotalBudget        int64 `json:"total_budget"`
    Version            int   `json:"version"`
}
```

### Event-Emitting Aggregate

```go
// domain/proposal/aggregate.go

package proposal

type Proposal struct {
    // ... fields ...
    events []DomainEvent  // uncommitted events
}

// Events returns uncommitted domain events
func (p *Proposal) Events() []DomainEvent {
    return p.events
}

// ClearEvents clears uncommitted events after persistence
func (p *Proposal) ClearEvents() {
    p.events = nil
}

// Create initializes a new proposal and emits creation event
func (p *Proposal) Create(cmd CreateProposalCommand, actor Actor) error {
    // ... validation logic ...

    p.ID = generateID()
    p.State = StateDraft
    p.Title = cmd.Title
    // ... set other fields ...

    // Emit domain event
    p.events = append(p.events, &ProposalCreated{
        BaseEvent: shared.BaseEvent{
            ID:            generateEventID(),
            Type:          "proposal.created",
            AggregateID_:  p.ID,
            AggregateType_: "proposal",
            TenantID_:     p.TenantID,
            OccurredAt_:   time.Now().UTC(),
        },
        ProposalData: ProposalCreatedData{
            Title:                 p.Title,
            PrincipalInvestigator: p.PrincipalInvestigatorID,
            // ... other data ...
        },
    })

    return nil
}
```

### Transactional Outbox Pattern

```go
// infrastructure/persistence/outbox.go

package persistence

import (
    "context"
    "database/sql"
    "encoding/json"
)

// OutboxMessage represents a pending event to be published
type OutboxMessage struct {
    ID          string          `db:"id"`
    EventType   string          `db:"event_type"`
    AggregateID string          `db:"aggregate_id"`
    Payload     json.RawMessage `db:"payload"`
    CreatedAt   time.Time       `db:"created_at"`
    ProcessedAt *time.Time      `db:"processed_at"`
}

// SaveWithEvents persists aggregate and its events atomically
func (r *ProposalRepository) SaveWithEvents(ctx context.Context, proposal *Proposal) error {
    tx, err := r.db.BeginTx(ctx, nil)
    if err != nil {
        return err
    }
    defer tx.Rollback()

    // Set tenant context
    if err := r.setTenantContext(ctx, tx); err != nil {
        return err
    }

    // Save proposal
    if err := r.saveProposal(ctx, tx, proposal); err != nil {
        return err
    }

    // Save events to outbox in same transaction
    for _, event := range proposal.Events() {
        payload, _ := json.Marshal(event)
        _, err := tx.ExecContext(ctx, `
            INSERT INTO event_outbox (id, event_type, aggregate_id, payload, created_at)
            VALUES ($1, $2, $3, $4, $5)
        `, generateID(), event.EventType(), event.AggregateID(), payload, time.Now())
        if err != nil {
            return err
        }
    }

    if err := tx.Commit(); err != nil {
        return err
    }

    proposal.ClearEvents()
    return nil
}
```

### Event Processor

```go
// infrastructure/messaging/event_processor.go

package messaging

import (
    "context"
    "time"
)

type EventProcessor struct {
    db       *sql.DB
    handlers map[string][]EventHandler
}

type EventHandler interface {
    Handle(ctx context.Context, event DomainEvent) error
}

// ProcessPendingEvents polls outbox and publishes events
func (p *EventProcessor) ProcessPendingEvents(ctx context.Context) error {
    rows, err := p.db.QueryContext(ctx, `
        SELECT id, event_type, aggregate_id, payload, created_at
        FROM event_outbox
        WHERE processed_at IS NULL
        ORDER BY created_at
        LIMIT 100
        FOR UPDATE SKIP LOCKED
    `)
    if err != nil {
        return err
    }
    defer rows.Close()

    for rows.Next() {
        var msg OutboxMessage
        if err := rows.Scan(&msg.ID, &msg.EventType, &msg.AggregateID, &msg.Payload, &msg.CreatedAt); err != nil {
            continue
        }

        // Dispatch to handlers
        event := deserializeEvent(msg.EventType, msg.Payload)
        for _, handler := range p.handlers[msg.EventType] {
            if err := handler.Handle(ctx, event); err != nil {
                // Log error, implement retry logic
                continue
            }
        }

        // Mark as processed
        p.db.ExecContext(ctx, `
            UPDATE event_outbox SET processed_at = $1 WHERE id = $2
        `, time.Now(), msg.ID)
    }

    return nil
}
```

### Event Handlers

```go
// application/handlers/notification_handler.go

type NotificationHandler struct {
    notificationService NotificationService
}

func (h *NotificationHandler) Handle(ctx context.Context, event DomainEvent) error {
    switch e := event.(type) {
    case *ProposalStateChanged:
        return h.handleStateChange(ctx, e)
    case *ProposalSubmitted:
        return h.handleSubmission(ctx, e)
    }
    return nil
}

func (h *NotificationHandler) handleStateChange(ctx context.Context, event *ProposalStateChanged) error {
    // Notify relevant users based on new state
    recipients := h.determineRecipients(event.TransitionData.ToState)
    return h.notificationService.Send(ctx, NotificationRequest{
        Type:       "PROPOSAL_STATE_CHANGED",
        Recipients: recipients,
        Data: map[string]interface{}{
            "proposal_id": event.AggregateID(),
            "new_state":   event.TransitionData.ToState,
            "action":      event.TransitionData.Action,
        },
    })
}
```

## Event Catalog

| Event | Description | Consumers |
|-------|-------------|-----------|
| `proposal.created` | New proposal created | Audit, Notification |
| `proposal.state_changed` | Proposal state transition | Audit, Notification, Integration |
| `proposal.submitted` | Submitted to Grants.gov | Audit, Integration, Notification |
| `budget.updated` | Budget modified | Audit, Financial System |
| `award.activated` | Award is active | Audit, Financial, Notification |
| `compliance.approved` | Compliance item approved | Audit, Notification |

## Rationale

1. **Decoupling**: Bounded contexts communicate via events, not direct calls
2. **Reliability**: Outbox pattern ensures no events are lost
3. **Auditability**: All events provide complete audit trail
4. **Scalability**: Event handlers can scale independently
5. **Integration**: External systems subscribe to relevant events

## Consequences

### Positive
- Loose coupling between contexts
- Complete audit trail
- Easy integration with external systems
- Enables event sourcing for critical paths

### Negative
- Eventual consistency complexity
- Event versioning challenges
- Debugging distributed flows is harder

## References
- [Transactional Outbox Pattern](https://microservices.io/patterns/data/transactional-outbox.html)
- [Domain Events by Martin Fowler](https://martinfowler.com/eaaDev/DomainEvent.html)
- FR-015: Change Tracking and Audit Logging
