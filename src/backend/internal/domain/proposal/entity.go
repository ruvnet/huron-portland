// Package proposal defines the Proposal aggregate root and related entities.
package proposal

import (
	"errors"
	"time"

	"github.com/google/uuid"
	"github.com/huron-bangalore/grants-management/internal/domain/common"
	"github.com/pgvector/pgvector-go"
)

// ErrInvalidTransition is returned when a state transition is not allowed.
var ErrInvalidTransition = errors.New("invalid state transition")

// ErrProposalNotEditable is returned when trying to edit a non-editable proposal.
var ErrProposalNotEditable = errors.New("proposal cannot be edited in current state")

// ErrVersionMismatch is returned when optimistic locking fails.
var ErrVersionMismatch = errors.New("version mismatch - proposal was modified")

// Proposal is the aggregate root for grant proposals.
type Proposal struct {
	common.BaseEntity
	common.AggregateRoot

	// Core Information
	Title           string        `json:"title"`
	ShortTitle      string        `json:"short_title,omitempty"`
	Abstract        string        `json:"abstract,omitempty"`
	State           ProposalState `json:"state"`
	ProposalNumber  string        `json:"proposal_number"` // System-generated
	ExternalID      string        `json:"external_id,omitempty"` // Sponsor's ID

	// Personnel
	PrincipalInvestigatorID uuid.UUID     `json:"principal_investigator_id"`
	CoInvestigators         []uuid.UUID   `json:"co_investigators,omitempty"`
	KeyPersonnel            []KeyPerson   `json:"key_personnel,omitempty"`

	// Sponsor Information
	SponsorID          uuid.UUID  `json:"sponsor_id"`
	OpportunityID      *uuid.UUID `json:"opportunity_id,omitempty"`
	SponsorDeadline    *time.Time `json:"sponsor_deadline,omitempty"`
	InternalDeadline   *time.Time `json:"internal_deadline,omitempty"`

	// Project Details
	ProjectPeriod    common.DateRange `json:"project_period"`
	Department       string           `json:"department"`
	ResearchArea     string           `json:"research_area,omitempty"`
	Keywords         []string         `json:"keywords,omitempty"`

	// Budget Reference
	BudgetID *uuid.UUID `json:"budget_id,omitempty"`

	// Compliance
	IRBRequired       bool   `json:"irb_required"`
	IACUCRequired     bool   `json:"iacuc_required"`
	IBCRequired       bool   `json:"ibc_required"`
	ExportControl     bool   `json:"export_control"`
	ConflictOfInterest bool  `json:"conflict_of_interest"`

	// Semantic Search
	Embedding pgvector.Vector `json:"-"` // 1536-dimensional embedding

	// State History
	StateHistory []StateTransition `json:"state_history,omitempty"`

	// Attachments
	Attachments []Attachment `json:"attachments,omitempty"`
}

// KeyPerson represents a key personnel on the proposal.
type KeyPerson struct {
	PersonID    uuid.UUID `json:"person_id"`
	Role        string    `json:"role"`
	Effort      float64   `json:"effort"` // Percentage
	CalendarMonths float64 `json:"calendar_months,omitempty"`
	AcademicMonths float64 `json:"academic_months,omitempty"`
	SummerMonths   float64 `json:"summer_months,omitempty"`
}

// StateTransition records a state change.
type StateTransition struct {
	FromState   ProposalState `json:"from_state"`
	ToState     ProposalState `json:"to_state"`
	Transition  ProposalTransition `json:"transition"`
	PerformedBy uuid.UUID    `json:"performed_by"`
	PerformedAt time.Time    `json:"performed_at"`
	Comment     string       `json:"comment,omitempty"`
}

// Attachment represents a file attachment.
type Attachment struct {
	ID           uuid.UUID `json:"id"`
	FileName     string    `json:"file_name"`
	FileType     string    `json:"file_type"`
	FileSizeBytes int64    `json:"file_size_bytes"`
	StoragePath  string    `json:"storage_path"`
	UploadedBy   uuid.UUID `json:"uploaded_by"`
	UploadedAt   time.Time `json:"uploaded_at"`
	Category     string    `json:"category"` // e.g., "narrative", "budget", "bio_sketch"
}

// NewProposal creates a new proposal in draft state.
func NewProposal(
	tenantID common.TenantID,
	userID uuid.UUID,
	title string,
	piID uuid.UUID,
	sponsorID uuid.UUID,
	department string,
	projectPeriod common.DateRange,
) *Proposal {
	p := &Proposal{
		BaseEntity:              common.NewBaseEntity(tenantID, userID),
		Title:                   title,
		State:                   StateDraft,
		PrincipalInvestigatorID: piID,
		SponsorID:               sponsorID,
		Department:              department,
		ProjectPeriod:           projectPeriod,
		StateHistory:            make([]StateTransition, 0),
		CoInvestigators:         make([]uuid.UUID, 0),
		KeyPersonnel:            make([]KeyPerson, 0),
		Keywords:                make([]string, 0),
		Attachments:             make([]Attachment, 0),
	}

	// Generate proposal number
	p.ProposalNumber = generateProposalNumber(p.ID)

	// Add creation event
	p.AddEvent(common.NewProposalCreatedEvent(p.ID, tenantID, title, piID, sponsorID))

	return p
}

// generateProposalNumber creates a unique proposal number.
func generateProposalNumber(id uuid.UUID) string {
	// Format: PROP-YYYY-XXXXXX (where X is first 6 chars of UUID)
	year := time.Now().Year()
	shortID := id.String()[:6]
	return "PROP-" + string(rune(year)) + "-" + shortID
}

// TransitionTo transitions the proposal to a new state.
func (p *Proposal) TransitionTo(transition ProposalTransition, userID uuid.UUID, comment string) error {
	sm := NewProposalStateMachine()

	if !sm.CanTransition(p.State, transition) {
		return ErrInvalidTransition
	}

	nextState, err := sm.GetNextState(p.State, transition)
	if err != nil {
		return err
	}

	// Record the transition
	stateChange := StateTransition{
		FromState:   p.State,
		ToState:     nextState,
		Transition:  transition,
		PerformedBy: userID,
		PerformedAt: time.Now().UTC(),
		Comment:     comment,
	}
	p.StateHistory = append(p.StateHistory, stateChange)

	oldState := p.State
	p.State = nextState
	p.Touch(userID)

	// Add state change event
	p.AddEvent(common.NewProposalStateChangedEvent(
		p.ID,
		p.TenantID,
		p.Version,
		oldState.String(),
		nextState.String(),
		comment,
	))

	return nil
}

// CanEdit returns true if the proposal can be edited.
func (p *Proposal) CanEdit() bool {
	return p.State.CanEdit()
}

// Update updates proposal fields if the proposal is editable.
func (p *Proposal) Update(userID uuid.UUID, updates ProposalUpdates) error {
	if !p.CanEdit() {
		return ErrProposalNotEditable
	}

	if updates.Title != nil {
		p.Title = *updates.Title
	}
	if updates.ShortTitle != nil {
		p.ShortTitle = *updates.ShortTitle
	}
	if updates.Abstract != nil {
		p.Abstract = *updates.Abstract
	}
	if updates.ResearchArea != nil {
		p.ResearchArea = *updates.ResearchArea
	}
	if updates.Keywords != nil {
		p.Keywords = updates.Keywords
	}
	if updates.SponsorDeadline != nil {
		p.SponsorDeadline = updates.SponsorDeadline
	}
	if updates.InternalDeadline != nil {
		p.InternalDeadline = updates.InternalDeadline
	}
	if updates.IRBRequired != nil {
		p.IRBRequired = *updates.IRBRequired
	}
	if updates.IACUCRequired != nil {
		p.IACUCRequired = *updates.IACUCRequired
	}
	if updates.IBCRequired != nil {
		p.IBCRequired = *updates.IBCRequired
	}
	if updates.ExportControl != nil {
		p.ExportControl = *updates.ExportControl
	}
	if updates.ConflictOfInterest != nil {
		p.ConflictOfInterest = *updates.ConflictOfInterest
	}

	p.Touch(userID)
	return nil
}

// ProposalUpdates contains optional updates to a proposal.
type ProposalUpdates struct {
	Title              *string
	ShortTitle         *string
	Abstract           *string
	ResearchArea       *string
	Keywords           []string
	SponsorDeadline    *time.Time
	InternalDeadline   *time.Time
	IRBRequired        *bool
	IACUCRequired      *bool
	IBCRequired        *bool
	ExportControl      *bool
	ConflictOfInterest *bool
}

// AddCoInvestigator adds a co-investigator to the proposal.
func (p *Proposal) AddCoInvestigator(userID, coiID uuid.UUID) error {
	if !p.CanEdit() {
		return ErrProposalNotEditable
	}

	// Check if already exists
	for _, coi := range p.CoInvestigators {
		if coi == coiID {
			return nil // Already added
		}
	}

	p.CoInvestigators = append(p.CoInvestigators, coiID)
	p.Touch(userID)
	return nil
}

// RemoveCoInvestigator removes a co-investigator from the proposal.
func (p *Proposal) RemoveCoInvestigator(userID, coiID uuid.UUID) error {
	if !p.CanEdit() {
		return ErrProposalNotEditable
	}

	for i, coi := range p.CoInvestigators {
		if coi == coiID {
			p.CoInvestigators = append(p.CoInvestigators[:i], p.CoInvestigators[i+1:]...)
			p.Touch(userID)
			return nil
		}
	}
	return nil
}

// AddKeyPerson adds a key person to the proposal.
func (p *Proposal) AddKeyPerson(userID uuid.UUID, keyPerson KeyPerson) error {
	if !p.CanEdit() {
		return ErrProposalNotEditable
	}

	p.KeyPersonnel = append(p.KeyPersonnel, keyPerson)
	p.Touch(userID)
	return nil
}

// AddAttachment adds an attachment to the proposal.
func (p *Proposal) AddAttachment(userID uuid.UUID, attachment Attachment) error {
	if !p.CanEdit() {
		return ErrProposalNotEditable
	}

	attachment.ID = uuid.New()
	attachment.UploadedBy = userID
	attachment.UploadedAt = time.Now().UTC()

	p.Attachments = append(p.Attachments, attachment)
	p.Touch(userID)
	return nil
}

// SetEmbedding sets the semantic search embedding.
func (p *Proposal) SetEmbedding(embedding []float32) {
	p.Embedding = pgvector.NewVector(embedding)
}

// GetAvailableTransitions returns the available state transitions.
func (p *Proposal) GetAvailableTransitions() []ProposalTransition {
	sm := NewProposalStateMachine()
	return sm.GetAvailableTransitions(p.State)
}

// IsOverdue returns true if the proposal is past its deadline.
func (p *Proposal) IsOverdue() bool {
	if p.SponsorDeadline == nil {
		return false
	}
	return time.Now().After(*p.SponsorDeadline)
}

// DaysUntilDeadline returns the number of days until the sponsor deadline.
func (p *Proposal) DaysUntilDeadline() *int {
	if p.SponsorDeadline == nil {
		return nil
	}
	days := int(time.Until(*p.SponsorDeadline).Hours() / 24)
	return &days
}
