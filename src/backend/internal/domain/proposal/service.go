// Package proposal provides domain services for proposal management.
package proposal

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/huron-bangalore/grants-management/internal/domain/common"
)

// ErrProposalNotFound is returned when a proposal is not found.
var ErrProposalNotFound = errors.New("proposal not found")

// ErrUnauthorized is returned when a user lacks permission.
var ErrUnauthorized = errors.New("unauthorized access")

// ErrInvalidInput is returned for invalid input data.
var ErrInvalidInput = errors.New("invalid input")

// Service provides domain operations for proposals.
type Service struct {
	repo       Repository
	eventStore common.EventStore
	publisher  common.EventPublisher
}

// NewService creates a new proposal domain service.
func NewService(repo Repository, eventStore common.EventStore, publisher common.EventPublisher) *Service {
	return &Service{
		repo:       repo,
		eventStore: eventStore,
		publisher:  publisher,
	}
}

// CreateProposalInput contains the input for creating a proposal.
type CreateProposalInput struct {
	Title            string
	ShortTitle       string
	Abstract         string
	PIID             uuid.UUID
	SponsorID        uuid.UUID
	Department       string
	ProjectStartDate time.Time
	ProjectEndDate   time.Time
	SponsorDeadline  *time.Time
	InternalDeadline *time.Time
	ResearchArea     string
	Keywords         []string
}

// CreateProposal creates a new proposal.
func (s *Service) CreateProposal(ctx context.Context, tenantCtx common.TenantContext, input CreateProposalInput) (*Proposal, error) {
	// Validate input
	if input.Title == "" {
		return nil, fmt.Errorf("%w: title is required", ErrInvalidInput)
	}
	if input.PIID == uuid.Nil {
		return nil, fmt.Errorf("%w: principal investigator is required", ErrInvalidInput)
	}
	if input.SponsorID == uuid.Nil {
		return nil, fmt.Errorf("%w: sponsor is required", ErrInvalidInput)
	}
	if input.ProjectEndDate.Before(input.ProjectStartDate) {
		return nil, fmt.Errorf("%w: project end date must be after start date", ErrInvalidInput)
	}

	// Create proposal
	proposal := NewProposal(
		tenantCtx.TenantID,
		tenantCtx.UserID,
		input.Title,
		input.PIID,
		input.SponsorID,
		input.Department,
		common.DateRange{
			StartDate: input.ProjectStartDate,
			EndDate:   input.ProjectEndDate,
		},
	)

	// Set optional fields
	proposal.ShortTitle = input.ShortTitle
	proposal.Abstract = input.Abstract
	proposal.SponsorDeadline = input.SponsorDeadline
	proposal.InternalDeadline = input.InternalDeadline
	proposal.ResearchArea = input.ResearchArea
	proposal.Keywords = input.Keywords

	// Persist
	if err := s.repo.Save(ctx, proposal); err != nil {
		return nil, fmt.Errorf("failed to save proposal: %w", err)
	}

	// Persist events
	if s.eventStore != nil {
		events := proposal.GetUncommittedEvents()
		if err := s.eventStore.Append(events...); err != nil {
			return nil, fmt.Errorf("failed to append events: %w", err)
		}
	}

	// Publish events
	if s.publisher != nil {
		events := proposal.GetUncommittedEvents()
		if err := s.publisher.Publish(events...); err != nil {
			// Log but don't fail - events can be replayed
			fmt.Printf("failed to publish events: %v\n", err)
		}
	}

	proposal.ClearUncommittedEvents()

	return proposal, nil
}

// GetProposal retrieves a proposal by ID.
func (s *Service) GetProposal(ctx context.Context, tenantCtx common.TenantContext, id uuid.UUID) (*Proposal, error) {
	proposal, err := s.repo.FindByID(ctx, tenantCtx.TenantID, id)
	if err != nil {
		return nil, err
	}
	if proposal == nil {
		return nil, ErrProposalNotFound
	}
	return proposal, nil
}

// UpdateProposal updates a proposal.
func (s *Service) UpdateProposal(ctx context.Context, tenantCtx common.TenantContext, id uuid.UUID, updates ProposalUpdates, expectedVersion int) (*Proposal, error) {
	proposal, err := s.GetProposal(ctx, tenantCtx, id)
	if err != nil {
		return nil, err
	}

	// Check version for optimistic locking
	if expectedVersion > 0 && proposal.Version != expectedVersion {
		return nil, ErrVersionMismatch
	}

	// Apply updates
	if err := proposal.Update(tenantCtx.UserID, updates); err != nil {
		return nil, err
	}

	// Persist
	if err := s.repo.Save(ctx, proposal); err != nil {
		return nil, fmt.Errorf("failed to save proposal: %w", err)
	}

	return proposal, nil
}

// TransitionProposalInput contains input for transitioning a proposal.
type TransitionProposalInput struct {
	ProposalID  uuid.UUID
	Transition  ProposalTransition
	Comment     string
	ExpectedVersion int
}

// TransitionProposal transitions a proposal to a new state.
func (s *Service) TransitionProposal(ctx context.Context, tenantCtx common.TenantContext, input TransitionProposalInput) (*Proposal, error) {
	proposal, err := s.GetProposal(ctx, tenantCtx, input.ProposalID)
	if err != nil {
		return nil, err
	}

	// Check version for optimistic locking
	if input.ExpectedVersion > 0 && proposal.Version != input.ExpectedVersion {
		return nil, ErrVersionMismatch
	}

	// Validate authorization for transition
	if !s.canPerformTransition(tenantCtx, proposal, input.Transition) {
		return nil, ErrUnauthorized
	}

	// Perform transition
	if err := proposal.TransitionTo(input.Transition, tenantCtx.UserID, input.Comment); err != nil {
		return nil, err
	}

	// Persist
	if err := s.repo.Save(ctx, proposal); err != nil {
		return nil, fmt.Errorf("failed to save proposal: %w", err)
	}

	// Handle events
	if s.eventStore != nil {
		events := proposal.GetUncommittedEvents()
		if err := s.eventStore.Append(events...); err != nil {
			return nil, fmt.Errorf("failed to append events: %w", err)
		}
	}

	if s.publisher != nil {
		events := proposal.GetUncommittedEvents()
		_ = s.publisher.Publish(events...)
	}

	proposal.ClearUncommittedEvents()

	return proposal, nil
}

// canPerformTransition checks if user can perform a transition.
func (s *Service) canPerformTransition(tenantCtx common.TenantContext, proposal *Proposal, transition ProposalTransition) bool {
	// Get metadata for current state
	metadata := GetStateMetadata(proposal.State)

	// Check if user has any required role
	for _, requiredRole := range metadata.RequiredRoles {
		if tenantCtx.HasRole(requiredRole) {
			return true
		}
	}

	// PI can always withdraw their own proposal
	if transition == TransitionWithdraw && proposal.PrincipalInvestigatorID == tenantCtx.UserID {
		return true
	}

	return false
}

// ListProposals lists proposals with filtering.
func (s *Service) ListProposals(ctx context.Context, tenantCtx common.TenantContext, filter ListFilter) ([]*Proposal, int64, error) {
	return s.repo.List(ctx, tenantCtx.TenantID, filter)
}

// SearchProposals performs semantic search.
func (s *Service) SearchProposals(ctx context.Context, tenantCtx common.TenantContext, embedding []float32, limit int, threshold float64) ([]*ProposalSearchResult, error) {
	if limit <= 0 {
		limit = 10
	}
	if threshold <= 0 {
		threshold = 0.7
	}
	return s.repo.Search(ctx, tenantCtx.TenantID, embedding, limit, threshold)
}

// GetUpcomingDeadlines retrieves proposals with upcoming deadlines.
func (s *Service) GetUpcomingDeadlines(ctx context.Context, tenantCtx common.TenantContext, days int) ([]*Proposal, error) {
	if days <= 0 {
		days = 7
	}
	return s.repo.GetUpcomingDeadlines(ctx, tenantCtx.TenantID, days)
}

// GetProposalsByState retrieves proposals by state.
func (s *Service) GetProposalsByState(ctx context.Context, tenantCtx common.TenantContext, state ProposalState, filter ListFilter) ([]*Proposal, int64, error) {
	return s.repo.FindByState(ctx, tenantCtx.TenantID, state, filter)
}

// CountByState returns counts of proposals by state.
func (s *Service) CountByState(ctx context.Context, tenantCtx common.TenantContext) (map[ProposalState]int64, error) {
	return s.repo.CountByState(ctx, tenantCtx.TenantID)
}

// DeleteProposal soft-deletes a proposal (only drafts).
func (s *Service) DeleteProposal(ctx context.Context, tenantCtx common.TenantContext, id uuid.UUID) error {
	proposal, err := s.GetProposal(ctx, tenantCtx, id)
	if err != nil {
		return err
	}

	// Only allow deletion of drafts
	if proposal.State != StateDraft {
		return fmt.Errorf("%w: only draft proposals can be deleted", ErrInvalidInput)
	}

	// Check authorization
	if proposal.PrincipalInvestigatorID != tenantCtx.UserID && !tenantCtx.HasRole("ADMIN") {
		return ErrUnauthorized
	}

	return s.repo.Delete(ctx, tenantCtx.TenantID, id)
}

// AddKeyPersonnel adds key personnel to a proposal.
func (s *Service) AddKeyPersonnel(ctx context.Context, tenantCtx common.TenantContext, proposalID uuid.UUID, keyPerson KeyPerson) (*Proposal, error) {
	proposal, err := s.GetProposal(ctx, tenantCtx, proposalID)
	if err != nil {
		return nil, err
	}

	if err := proposal.AddKeyPerson(tenantCtx.UserID, keyPerson); err != nil {
		return nil, err
	}

	if err := s.repo.Save(ctx, proposal); err != nil {
		return nil, fmt.Errorf("failed to save proposal: %w", err)
	}

	return proposal, nil
}

// UpdateEmbedding updates the semantic search embedding for a proposal.
func (s *Service) UpdateEmbedding(ctx context.Context, tenantCtx common.TenantContext, proposalID uuid.UUID, embedding []float32) error {
	proposal, err := s.GetProposal(ctx, tenantCtx, proposalID)
	if err != nil {
		return err
	}

	proposal.SetEmbedding(embedding)

	if err := s.repo.Save(ctx, proposal); err != nil {
		return fmt.Errorf("failed to save proposal: %w", err)
	}

	return nil
}
