// Package common provides domain events infrastructure.
package common

import (
	"time"

	"github.com/google/uuid"
)

// DomainEvent represents an event that occurred in the domain.
type DomainEvent interface {
	EventID() uuid.UUID
	EventType() string
	AggregateID() uuid.UUID
	AggregateType() string
	TenantID() TenantID
	OccurredAt() time.Time
	Version() int
}

// BaseDomainEvent provides common fields for all domain events.
type BaseDomainEvent struct {
	ID            uuid.UUID `json:"event_id"`
	Type          string    `json:"event_type"`
	AggregateUUID uuid.UUID `json:"aggregate_id"`
	Aggregate     string    `json:"aggregate_type"`
	Tenant        TenantID  `json:"tenant_id"`
	Occurred      time.Time `json:"occurred_at"`
	EventVersion  int       `json:"version"`
}

// EventID returns the unique event identifier.
func (e BaseDomainEvent) EventID() uuid.UUID { return e.ID }

// EventType returns the type of the event.
func (e BaseDomainEvent) EventType() string { return e.Type }

// AggregateID returns the aggregate root identifier.
func (e BaseDomainEvent) AggregateID() uuid.UUID { return e.AggregateUUID }

// AggregateType returns the type of the aggregate.
func (e BaseDomainEvent) AggregateType() string { return e.Aggregate }

// TenantID returns the tenant identifier.
func (e BaseDomainEvent) TenantID() TenantID { return e.Tenant }

// OccurredAt returns when the event occurred.
func (e BaseDomainEvent) OccurredAt() time.Time { return e.Occurred }

// Version returns the event version.
func (e BaseDomainEvent) Version() int { return e.EventVersion }

// NewBaseDomainEvent creates a new base domain event.
func NewBaseDomainEvent(eventType string, aggregateID uuid.UUID, aggregateType string, tenantID TenantID, version int) BaseDomainEvent {
	return BaseDomainEvent{
		ID:            uuid.New(),
		Type:          eventType,
		AggregateUUID: aggregateID,
		Aggregate:     aggregateType,
		Tenant:        tenantID,
		Occurred:      time.Now().UTC(),
		EventVersion:  version,
	}
}

// ProposalCreatedEvent is emitted when a proposal is created.
type ProposalCreatedEvent struct {
	BaseDomainEvent
	Title       string    `json:"title"`
	PrincipalPI uuid.UUID `json:"principal_pi"`
	SponsorID   uuid.UUID `json:"sponsor_id"`
}

// NewProposalCreatedEvent creates a new proposal created event.
func NewProposalCreatedEvent(aggregateID uuid.UUID, tenantID TenantID, title string, principalPI, sponsorID uuid.UUID) ProposalCreatedEvent {
	return ProposalCreatedEvent{
		BaseDomainEvent: NewBaseDomainEvent("proposal.created", aggregateID, "Proposal", tenantID, 1),
		Title:           title,
		PrincipalPI:     principalPI,
		SponsorID:       sponsorID,
	}
}

// ProposalStateChangedEvent is emitted when a proposal's state changes.
type ProposalStateChangedEvent struct {
	BaseDomainEvent
	FromState string `json:"from_state"`
	ToState   string `json:"to_state"`
	Reason    string `json:"reason,omitempty"`
}

// NewProposalStateChangedEvent creates a new proposal state changed event.
func NewProposalStateChangedEvent(aggregateID uuid.UUID, tenantID TenantID, version int, fromState, toState, reason string) ProposalStateChangedEvent {
	return ProposalStateChangedEvent{
		BaseDomainEvent: NewBaseDomainEvent("proposal.state_changed", aggregateID, "Proposal", tenantID, version),
		FromState:       fromState,
		ToState:         toState,
		Reason:          reason,
	}
}

// BudgetUpdatedEvent is emitted when a budget is updated.
type BudgetUpdatedEvent struct {
	BaseDomainEvent
	ProposalID   uuid.UUID `json:"proposal_id"`
	TotalDirect  int64     `json:"total_direct"`
	TotalIndirect int64    `json:"total_indirect"`
	GrandTotal   int64     `json:"grand_total"`
}

// NewBudgetUpdatedEvent creates a new budget updated event.
func NewBudgetUpdatedEvent(aggregateID uuid.UUID, tenantID TenantID, version int, proposalID uuid.UUID, direct, indirect, total int64) BudgetUpdatedEvent {
	return BudgetUpdatedEvent{
		BaseDomainEvent: NewBaseDomainEvent("budget.updated", aggregateID, "Budget", tenantID, version),
		ProposalID:      proposalID,
		TotalDirect:     direct,
		TotalIndirect:   indirect,
		GrandTotal:      total,
	}
}

// EventStore defines the interface for storing domain events.
type EventStore interface {
	// Append appends events to the event store.
	Append(events ...DomainEvent) error
	// Load loads events for an aggregate.
	Load(aggregateID uuid.UUID) ([]DomainEvent, error)
	// LoadFromVersion loads events from a specific version.
	LoadFromVersion(aggregateID uuid.UUID, version int) ([]DomainEvent, error)
}

// EventPublisher defines the interface for publishing domain events.
type EventPublisher interface {
	// Publish publishes domain events.
	Publish(events ...DomainEvent) error
}

// EventHandler defines the interface for handling domain events.
type EventHandler interface {
	// Handle handles a domain event.
	Handle(event DomainEvent) error
	// HandledEventTypes returns the event types this handler handles.
	HandledEventTypes() []string
}

// AggregateRoot provides event sourcing capabilities.
type AggregateRoot struct {
	uncommittedEvents []DomainEvent
}

// AddEvent adds an uncommitted event.
func (ar *AggregateRoot) AddEvent(event DomainEvent) {
	ar.uncommittedEvents = append(ar.uncommittedEvents, event)
}

// GetUncommittedEvents returns all uncommitted events.
func (ar *AggregateRoot) GetUncommittedEvents() []DomainEvent {
	return ar.uncommittedEvents
}

// ClearUncommittedEvents clears uncommitted events after persistence.
func (ar *AggregateRoot) ClearUncommittedEvents() {
	ar.uncommittedEvents = nil
}
