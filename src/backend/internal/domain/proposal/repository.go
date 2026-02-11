// Package proposal defines the repository interface for proposals.
package proposal

import (
	"context"

	"github.com/google/uuid"
	"github.com/huron-bangalore/grants-management/internal/domain/common"
)

// Repository defines the interface for proposal persistence.
type Repository interface {
	// Save persists a proposal (insert or update).
	Save(ctx context.Context, proposal *Proposal) error

	// FindByID retrieves a proposal by ID within a tenant.
	FindByID(ctx context.Context, tenantID common.TenantID, id uuid.UUID) (*Proposal, error)

	// FindByNumber retrieves a proposal by its proposal number.
	FindByNumber(ctx context.Context, tenantID common.TenantID, number string) (*Proposal, error)

	// FindByPI retrieves all proposals for a principal investigator.
	FindByPI(ctx context.Context, tenantID common.TenantID, piID uuid.UUID, filter ListFilter) ([]*Proposal, int64, error)

	// FindBySponsor retrieves all proposals for a sponsor.
	FindBySponsor(ctx context.Context, tenantID common.TenantID, sponsorID uuid.UUID, filter ListFilter) ([]*Proposal, int64, error)

	// FindByState retrieves all proposals in a given state.
	FindByState(ctx context.Context, tenantID common.TenantID, state ProposalState, filter ListFilter) ([]*Proposal, int64, error)

	// FindByDepartment retrieves all proposals for a department.
	FindByDepartment(ctx context.Context, tenantID common.TenantID, department string, filter ListFilter) ([]*Proposal, int64, error)

	// List retrieves all proposals with filtering and pagination.
	List(ctx context.Context, tenantID common.TenantID, filter ListFilter) ([]*Proposal, int64, error)

	// Search performs semantic search using vector similarity.
	Search(ctx context.Context, tenantID common.TenantID, embedding []float32, limit int, threshold float64) ([]*ProposalSearchResult, error)

	// Delete soft-deletes a proposal.
	Delete(ctx context.Context, tenantID common.TenantID, id uuid.UUID) error

	// GetUpcomingDeadlines retrieves proposals with deadlines in the next N days.
	GetUpcomingDeadlines(ctx context.Context, tenantID common.TenantID, days int) ([]*Proposal, error)

	// GetOverdue retrieves proposals that are past their deadline.
	GetOverdue(ctx context.Context, tenantID common.TenantID) ([]*Proposal, error)

	// CountByState returns the count of proposals by state.
	CountByState(ctx context.Context, tenantID common.TenantID) (map[ProposalState]int64, error)

	// GetStateHistory retrieves the state transition history for a proposal.
	GetStateHistory(ctx context.Context, tenantID common.TenantID, id uuid.UUID) ([]StateTransition, error)
}

// ListFilter defines filtering and pagination options.
type ListFilter struct {
	// Pagination
	Offset int `json:"offset"`
	Limit  int `json:"limit"`

	// Sorting
	SortBy    string `json:"sort_by"`
	SortOrder string `json:"sort_order"` // "asc" or "desc"

	// Filters
	States      []ProposalState `json:"states,omitempty"`
	Departments []string        `json:"departments,omitempty"`
	PIIDs       []uuid.UUID     `json:"pi_ids,omitempty"`
	SponsorIDs  []uuid.UUID     `json:"sponsor_ids,omitempty"`

	// Date Filters
	CreatedAfter   *string `json:"created_after,omitempty"`   // RFC3339
	CreatedBefore  *string `json:"created_before,omitempty"`  // RFC3339
	DeadlineAfter  *string `json:"deadline_after,omitempty"`  // RFC3339
	DeadlineBefore *string `json:"deadline_before,omitempty"` // RFC3339

	// Text Search
	Query string `json:"query,omitempty"`

	// Include Options
	IncludeKeywords    bool `json:"include_keywords"`
	IncludeAttachments bool `json:"include_attachments"`
	IncludeHistory     bool `json:"include_history"`
}

// DefaultListFilter returns a default list filter.
func DefaultListFilter() ListFilter {
	return ListFilter{
		Offset:    0,
		Limit:     20,
		SortBy:    "created_at",
		SortOrder: "desc",
	}
}

// ProposalSearchResult contains a proposal with its similarity score.
type ProposalSearchResult struct {
	Proposal   *Proposal `json:"proposal"`
	Similarity float64   `json:"similarity"`
}

// ProposalSummary provides a lightweight view of a proposal.
type ProposalSummary struct {
	ID               uuid.UUID     `json:"id"`
	ProposalNumber   string        `json:"proposal_number"`
	Title            string        `json:"title"`
	State            ProposalState `json:"state"`
	Department       string        `json:"department"`
	PIName           string        `json:"pi_name"`
	SponsorName      string        `json:"sponsor_name"`
	SponsorDeadline  *string       `json:"sponsor_deadline,omitempty"`
	DaysToDeadline   *int          `json:"days_to_deadline,omitempty"`
	TotalBudget      *int64        `json:"total_budget,omitempty"`
	CreatedAt        string        `json:"created_at"`
	UpdatedAt        string        `json:"updated_at"`
}

// ReadRepository defines a read-only interface for CQRS patterns.
type ReadRepository interface {
	// GetSummaries retrieves proposal summaries with aggregated data.
	GetSummaries(ctx context.Context, tenantID common.TenantID, filter ListFilter) ([]ProposalSummary, int64, error)

	// GetDashboardStats retrieves statistics for the dashboard.
	GetDashboardStats(ctx context.Context, tenantID common.TenantID) (*DashboardStats, error)
}

// DashboardStats contains aggregated statistics.
type DashboardStats struct {
	TotalProposals    int64                   `json:"total_proposals"`
	ProposalsByState  map[ProposalState]int64 `json:"proposals_by_state"`
	UpcomingDeadlines int64                   `json:"upcoming_deadlines"`
	OverdueProposals  int64                   `json:"overdue_proposals"`
	SubmittedThisMonth int64                  `json:"submitted_this_month"`
	AwardedThisYear    int64                  `json:"awarded_this_year"`
	TotalAwardAmount   int64                  `json:"total_award_amount"`
}
