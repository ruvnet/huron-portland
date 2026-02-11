// Package proposal provides the application service for proposal management.
package proposal

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/huron-bangalore/grants-management/internal/application/ports"
	"github.com/huron-bangalore/grants-management/internal/domain/common"
	"github.com/huron-bangalore/grants-management/internal/domain/proposal"
)

// Service provides application-level operations for proposals.
type Service struct {
	repo           ports.ProposalRepository
	budgetRepo     ports.BudgetRepository
	personRepo     ports.PersonRepository
	sponsorRepo    ports.SponsorRepository
	embedGenerator ports.EmbeddingGenerator
	notifier       ports.NotificationService
	auditLogger    ports.AuditLogger
	uow            ports.UnitOfWork
}

// ServiceConfig contains configuration for the service.
type ServiceConfig struct {
	Repo           ports.ProposalRepository
	BudgetRepo     ports.BudgetRepository
	PersonRepo     ports.PersonRepository
	SponsorRepo    ports.SponsorRepository
	EmbedGenerator ports.EmbeddingGenerator
	Notifier       ports.NotificationService
	AuditLogger    ports.AuditLogger
	UoW            ports.UnitOfWork
}

// NewService creates a new proposal application service.
func NewService(cfg ServiceConfig) *Service {
	return &Service{
		repo:           cfg.Repo,
		budgetRepo:     cfg.BudgetRepo,
		personRepo:     cfg.PersonRepo,
		sponsorRepo:    cfg.SponsorRepo,
		embedGenerator: cfg.EmbedGenerator,
		notifier:       cfg.Notifier,
		auditLogger:    cfg.AuditLogger,
		uow:            cfg.UoW,
	}
}

// CreateProposalCommand represents the command to create a proposal.
type CreateProposalCommand struct {
	Title            string     `json:"title"`
	ShortTitle       string     `json:"short_title,omitempty"`
	Abstract         string     `json:"abstract,omitempty"`
	PIID             uuid.UUID  `json:"pi_id"`
	CoInvestigators  []uuid.UUID `json:"co_investigators,omitempty"`
	SponsorID        uuid.UUID  `json:"sponsor_id"`
	OpportunityID    *uuid.UUID `json:"opportunity_id,omitempty"`
	Department       string     `json:"department"`
	ProjectStartDate string     `json:"project_start_date"` // RFC3339
	ProjectEndDate   string     `json:"project_end_date"`   // RFC3339
	SponsorDeadline  *string    `json:"sponsor_deadline,omitempty"`
	InternalDeadline *string    `json:"internal_deadline,omitempty"`
	ResearchArea     string     `json:"research_area,omitempty"`
	Keywords         []string   `json:"keywords,omitempty"`
	IRBRequired      bool       `json:"irb_required"`
	IACUCRequired    bool       `json:"iacuc_required"`
	IBCRequired      bool       `json:"ibc_required"`
	ExportControl    bool       `json:"export_control"`
}

// CreateProposalResult contains the result of creating a proposal.
type CreateProposalResult struct {
	Proposal    *proposal.Proposal `json:"proposal"`
	PIName      string             `json:"pi_name"`
	SponsorName string             `json:"sponsor_name"`
}

// Create creates a new proposal.
func (s *Service) Create(ctx context.Context, tenantCtx common.TenantContext, cmd CreateProposalCommand) (*CreateProposalResult, error) {
	// Validate PI exists
	pi, err := s.personRepo.FindByID(ctx, tenantCtx.TenantID, cmd.PIID)
	if err != nil {
		return nil, fmt.Errorf("failed to find PI: %w", err)
	}
	if pi == nil {
		return nil, errors.New("principal investigator not found")
	}

	// Validate sponsor exists
	sponsor, err := s.sponsorRepo.FindByID(ctx, tenantCtx.TenantID, cmd.SponsorID)
	if err != nil {
		return nil, fmt.Errorf("failed to find sponsor: %w", err)
	}
	if sponsor == nil {
		return nil, errors.New("sponsor not found")
	}

	// Parse dates
	input, err := parseCreateInput(cmd)
	if err != nil {
		return nil, err
	}

	// Create domain service
	domainService := proposal.NewService(s.repo, nil, nil)

	// Create the proposal
	prop, err := domainService.CreateProposal(ctx, tenantCtx, input)
	if err != nil {
		return nil, err
	}

	// Add co-investigators
	for _, coiID := range cmd.CoInvestigators {
		if err := prop.AddCoInvestigator(tenantCtx.UserID, coiID); err != nil {
			return nil, fmt.Errorf("failed to add co-investigator: %w", err)
		}
	}

	// Set compliance flags
	updates := proposal.ProposalUpdates{
		IRBRequired:   &cmd.IRBRequired,
		IACUCRequired: &cmd.IACUCRequired,
		IBCRequired:   &cmd.IBCRequired,
		ExportControl: &cmd.ExportControl,
	}
	_ = prop.Update(tenantCtx.UserID, updates)

	// Save
	if err := s.repo.Save(ctx, prop); err != nil {
		return nil, fmt.Errorf("failed to save proposal: %w", err)
	}

	// Generate and store embedding asynchronously
	if s.embedGenerator != nil {
		go s.updateProposalEmbedding(context.Background(), tenantCtx, prop)
	}

	// Log audit event
	if s.auditLogger != nil {
		_ = s.auditLogger.Log(ctx, ports.AuditEvent{
			ID:          uuid.New(),
			TenantID:    tenantCtx.TenantID,
			EntityType:  "proposal",
			EntityID:    prop.ID,
			Action:      "created",
			PerformedBy: tenantCtx.UserID,
		})
	}

	return &CreateProposalResult{
		Proposal:    prop,
		PIName:      pi.FullName(),
		SponsorName: sponsor.Name,
	}, nil
}

// parseCreateInput parses the create command into domain input.
func parseCreateInput(cmd CreateProposalCommand) (proposal.CreateProposalInput, error) {
	input := proposal.CreateProposalInput{
		Title:        cmd.Title,
		ShortTitle:   cmd.ShortTitle,
		Abstract:     cmd.Abstract,
		PIID:         cmd.PIID,
		SponsorID:    cmd.SponsorID,
		Department:   cmd.Department,
		ResearchArea: cmd.ResearchArea,
		Keywords:     cmd.Keywords,
	}

	// Parse project dates
	startDate, err := parseDate(cmd.ProjectStartDate)
	if err != nil {
		return input, fmt.Errorf("invalid project start date: %w", err)
	}
	input.ProjectStartDate = startDate

	endDate, err := parseDate(cmd.ProjectEndDate)
	if err != nil {
		return input, fmt.Errorf("invalid project end date: %w", err)
	}
	input.ProjectEndDate = endDate

	// Parse optional deadlines
	if cmd.SponsorDeadline != nil {
		deadline, err := parseDate(*cmd.SponsorDeadline)
		if err != nil {
			return input, fmt.Errorf("invalid sponsor deadline: %w", err)
		}
		input.SponsorDeadline = &deadline
	}

	if cmd.InternalDeadline != nil {
		deadline, err := parseDate(*cmd.InternalDeadline)
		if err != nil {
			return input, fmt.Errorf("invalid internal deadline: %w", err)
		}
		input.InternalDeadline = &deadline
	}

	return input, nil
}

// parseDate parses an RFC3339 date string.
func parseDate(s string) (time.Time, error) {
	return time.Parse(time.RFC3339, s)
}

// updateProposalEmbedding generates and stores the embedding for a proposal.
func (s *Service) updateProposalEmbedding(ctx context.Context, tenantCtx common.TenantContext, prop *proposal.Proposal) {
	// Combine title, abstract, and keywords for embedding
	text := prop.Title
	if prop.Abstract != "" {
		text += " " + prop.Abstract
	}
	for _, kw := range prop.Keywords {
		text += " " + kw
	}

	embedding, err := s.embedGenerator.Generate(ctx, text)
	if err != nil {
		// Log error but don't fail
		fmt.Printf("failed to generate embedding: %v\n", err)
		return
	}

	prop.SetEmbedding(embedding)
	if err := s.repo.Save(ctx, prop); err != nil {
		fmt.Printf("failed to save proposal embedding: %v\n", err)
	}
}

// GetByID retrieves a proposal by ID with enriched data.
func (s *Service) GetByID(ctx context.Context, tenantCtx common.TenantContext, id uuid.UUID) (*ProposalDetail, error) {
	prop, err := s.repo.FindByID(ctx, tenantCtx.TenantID, id)
	if err != nil {
		return nil, err
	}
	if prop == nil {
		return nil, errors.New("proposal not found")
	}

	return s.enrichProposal(ctx, tenantCtx, prop)
}

// ProposalDetail contains enriched proposal data.
type ProposalDetail struct {
	Proposal           *proposal.Proposal   `json:"proposal"`
	PI                 *ports.Person        `json:"pi"`
	Sponsor            *ports.Sponsor       `json:"sponsor"`
	CoInvestigators    []*ports.Person      `json:"co_investigators,omitempty"`
	AvailableActions   []proposal.ProposalTransition `json:"available_actions"`
	BudgetSummary      interface{}          `json:"budget_summary,omitempty"`
}

// enrichProposal adds related data to a proposal.
func (s *Service) enrichProposal(ctx context.Context, tenantCtx common.TenantContext, prop *proposal.Proposal) (*ProposalDetail, error) {
	detail := &ProposalDetail{
		Proposal:         prop,
		AvailableActions: prop.GetAvailableTransitions(),
	}

	// Get PI
	if s.personRepo != nil {
		pi, _ := s.personRepo.FindByID(ctx, tenantCtx.TenantID, prop.PrincipalInvestigatorID)
		detail.PI = pi
	}

	// Get Sponsor
	if s.sponsorRepo != nil {
		sponsor, _ := s.sponsorRepo.FindByID(ctx, tenantCtx.TenantID, prop.SponsorID)
		detail.Sponsor = sponsor
	}

	// Get Co-Investigators
	if s.personRepo != nil && len(prop.CoInvestigators) > 0 {
		cois, _ := s.personRepo.FindByIDs(ctx, tenantCtx.TenantID, prop.CoInvestigators)
		detail.CoInvestigators = cois
	}

	// Get Budget Summary
	if s.budgetRepo != nil && prop.BudgetID != nil {
		budget, _ := s.budgetRepo.FindByID(ctx, tenantCtx.TenantID, *prop.BudgetID)
		if budget != nil {
			detail.BudgetSummary = budget.Summary()
		}
	}

	return detail, nil
}

// List retrieves proposals with filtering and enrichment.
func (s *Service) List(ctx context.Context, tenantCtx common.TenantContext, filter proposal.ListFilter) (*ListResult, error) {
	proposals, total, err := s.repo.List(ctx, tenantCtx.TenantID, filter)
	if err != nil {
		return nil, err
	}

	return &ListResult{
		Proposals: proposals,
		Total:     total,
		Offset:    filter.Offset,
		Limit:     filter.Limit,
	}, nil
}

// ListResult contains paginated proposal results.
type ListResult struct {
	Proposals []*proposal.Proposal `json:"proposals"`
	Total     int64                `json:"total"`
	Offset    int                  `json:"offset"`
	Limit     int                  `json:"limit"`
}

// TransitionCommand represents a state transition command.
type TransitionCommand struct {
	ProposalID      uuid.UUID                  `json:"proposal_id"`
	Transition      proposal.ProposalTransition `json:"transition"`
	Comment         string                     `json:"comment,omitempty"`
	ExpectedVersion int                        `json:"expected_version,omitempty"`
}

// Transition transitions a proposal to a new state.
func (s *Service) Transition(ctx context.Context, tenantCtx common.TenantContext, cmd TransitionCommand) (*proposal.Proposal, error) {
	// Get current proposal
	prop, err := s.repo.FindByID(ctx, tenantCtx.TenantID, cmd.ProposalID)
	if err != nil {
		return nil, err
	}
	if prop == nil {
		return nil, errors.New("proposal not found")
	}

	// Check version for optimistic locking
	if cmd.ExpectedVersion > 0 && prop.Version != cmd.ExpectedVersion {
		return nil, proposal.ErrVersionMismatch
	}

	// Store old state for notification
	oldState := prop.State

	// Perform transition
	if err := prop.TransitionTo(cmd.Transition, tenantCtx.UserID, cmd.Comment); err != nil {
		return nil, err
	}

	// Save
	if err := s.repo.Save(ctx, prop); err != nil {
		return nil, fmt.Errorf("failed to save proposal: %w", err)
	}

	// Send notifications
	if s.notifier != nil {
		metadata := proposal.GetStateMetadata(prop.State)
		_ = s.notifier.SendProposalNotification(ctx, prop.ID, "state_changed", s.getNotificationRecipients(ctx, tenantCtx, prop, metadata))
	}

	// Log audit event
	if s.auditLogger != nil {
		_ = s.auditLogger.Log(ctx, ports.AuditEvent{
			ID:          uuid.New(),
			TenantID:    tenantCtx.TenantID,
			EntityType:  "proposal",
			EntityID:    prop.ID,
			Action:      "state_changed",
			PerformedBy: tenantCtx.UserID,
			OldValues:   map[string]interface{}{"state": oldState.String()},
			NewValues:   map[string]interface{}{"state": prop.State.String()},
		})
	}

	return prop, nil
}

// getNotificationRecipients returns user IDs for notification.
func (s *Service) getNotificationRecipients(ctx context.Context, tenantCtx common.TenantContext, prop *proposal.Proposal, metadata proposal.StateMetadata) []uuid.UUID {
	recipients := []uuid.UUID{prop.PrincipalInvestigatorID}
	// Add co-investigators
	recipients = append(recipients, prop.CoInvestigators...)
	return recipients
}

// Search performs semantic search on proposals.
func (s *Service) Search(ctx context.Context, tenantCtx common.TenantContext, query string, limit int) ([]*proposal.ProposalSearchResult, error) {
	if s.embedGenerator == nil {
		return nil, errors.New("search not available - embedding generator not configured")
	}

	// Generate query embedding
	embedding, err := s.embedGenerator.Generate(ctx, query)
	if err != nil {
		return nil, fmt.Errorf("failed to generate query embedding: %w", err)
	}

	return s.repo.Search(ctx, tenantCtx.TenantID, embedding, limit, 0.7)
}

// UpdateCommand represents an update command.
type UpdateCommand struct {
	ProposalID      uuid.UUID                `json:"proposal_id"`
	Updates         proposal.ProposalUpdates `json:"updates"`
	ExpectedVersion int                      `json:"expected_version,omitempty"`
}

// Update updates a proposal.
func (s *Service) Update(ctx context.Context, tenantCtx common.TenantContext, cmd UpdateCommand) (*proposal.Proposal, error) {
	domainService := proposal.NewService(s.repo, nil, nil)
	return domainService.UpdateProposal(ctx, tenantCtx, cmd.ProposalID, cmd.Updates, cmd.ExpectedVersion)
}

// Delete soft-deletes a proposal.
func (s *Service) Delete(ctx context.Context, tenantCtx common.TenantContext, id uuid.UUID) error {
	domainService := proposal.NewService(s.repo, nil, nil)
	return domainService.DeleteProposal(ctx, tenantCtx, id)
}

// GetDashboard retrieves dashboard statistics.
func (s *Service) GetDashboard(ctx context.Context, tenantCtx common.TenantContext) (*DashboardData, error) {
	// Get counts by state
	counts, err := s.repo.CountByState(ctx, tenantCtx.TenantID)
	if err != nil {
		return nil, err
	}

	// Get upcoming deadlines
	upcoming, err := s.repo.GetUpcomingDeadlines(ctx, tenantCtx.TenantID, 14)
	if err != nil {
		return nil, err
	}

	// Get overdue
	overdue, err := s.repo.GetOverdue(ctx, tenantCtx.TenantID)
	if err != nil {
		return nil, err
	}

	return &DashboardData{
		ProposalsByState:  counts,
		UpcomingDeadlines: upcoming,
		OverdueProposals:  overdue,
	}, nil
}

// DashboardData contains dashboard statistics.
type DashboardData struct {
	ProposalsByState  map[proposal.ProposalState]int64 `json:"proposals_by_state"`
	UpcomingDeadlines []*proposal.Proposal             `json:"upcoming_deadlines"`
	OverdueProposals  []*proposal.Proposal             `json:"overdue_proposals"`
}
