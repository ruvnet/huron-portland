// Package ports defines the application layer port interfaces.
package ports

import (
	"context"

	"github.com/google/uuid"
	"github.com/huron-bangalore/grants-management/internal/domain/budget"
	"github.com/huron-bangalore/grants-management/internal/domain/common"
	"github.com/huron-bangalore/grants-management/internal/domain/proposal"
)

// ProposalRepository defines the proposal repository port.
type ProposalRepository interface {
	proposal.Repository
}

// BudgetRepository defines the budget repository port.
type BudgetRepository interface {
	// Save persists a budget.
	Save(ctx context.Context, budget *budget.Budget) error

	// FindByID retrieves a budget by ID.
	FindByID(ctx context.Context, tenantID common.TenantID, id uuid.UUID) (*budget.Budget, error)

	// FindByProposalID retrieves a budget by proposal ID.
	FindByProposalID(ctx context.Context, tenantID common.TenantID, proposalID uuid.UUID) (*budget.Budget, error)

	// Delete soft-deletes a budget.
	Delete(ctx context.Context, tenantID common.TenantID, id uuid.UUID) error

	// List retrieves all budgets with filtering.
	List(ctx context.Context, tenantID common.TenantID, filter BudgetListFilter) ([]*budget.Budget, int64, error)
}

// BudgetListFilter defines filtering options for budgets.
type BudgetListFilter struct {
	Offset     int                  `json:"offset"`
	Limit      int                  `json:"limit"`
	Statuses   []budget.BudgetStatus `json:"statuses,omitempty"`
	ProposalIDs []uuid.UUID          `json:"proposal_ids,omitempty"`
}

// PersonRepository defines the person/user repository port.
type PersonRepository interface {
	// FindByID retrieves a person by ID.
	FindByID(ctx context.Context, tenantID common.TenantID, id uuid.UUID) (*Person, error)

	// FindByIDs retrieves multiple people by IDs.
	FindByIDs(ctx context.Context, tenantID common.TenantID, ids []uuid.UUID) ([]*Person, error)

	// Search searches for people by name or email.
	Search(ctx context.Context, tenantID common.TenantID, query string, limit int) ([]*Person, error)
}

// Person represents a user/person in the system.
type Person struct {
	ID          uuid.UUID `json:"id"`
	TenantID    common.TenantID `json:"tenant_id"`
	Email       string    `json:"email"`
	FirstName   string    `json:"first_name"`
	LastName    string    `json:"last_name"`
	Title       string    `json:"title,omitempty"`
	Department  string    `json:"department,omitempty"`
	Institution string    `json:"institution,omitempty"`
	IsActive    bool      `json:"is_active"`
	Roles       []string  `json:"roles,omitempty"`
}

// FullName returns the person's full name.
func (p *Person) FullName() string {
	return p.FirstName + " " + p.LastName
}

// SponsorRepository defines the sponsor repository port.
type SponsorRepository interface {
	// FindByID retrieves a sponsor by ID.
	FindByID(ctx context.Context, tenantID common.TenantID, id uuid.UUID) (*Sponsor, error)

	// Search searches for sponsors by name.
	Search(ctx context.Context, tenantID common.TenantID, query string, limit int) ([]*Sponsor, error)

	// List retrieves all sponsors with pagination.
	List(ctx context.Context, tenantID common.TenantID, offset, limit int) ([]*Sponsor, int64, error)
}

// Sponsor represents a funding sponsor/agency.
type Sponsor struct {
	ID           uuid.UUID `json:"id"`
	TenantID     common.TenantID `json:"tenant_id"`
	Name         string    `json:"name"`
	Abbreviation string    `json:"abbreviation,omitempty"`
	Type         string    `json:"type"` // federal, state, foundation, industry
	Website      string    `json:"website,omitempty"`
	IsActive     bool      `json:"is_active"`
}

// OpportunityRepository defines the funding opportunity repository port.
type OpportunityRepository interface {
	// FindByID retrieves an opportunity by ID.
	FindByID(ctx context.Context, tenantID common.TenantID, id uuid.UUID) (*Opportunity, error)

	// FindBySponsor retrieves opportunities for a sponsor.
	FindBySponsor(ctx context.Context, tenantID common.TenantID, sponsorID uuid.UUID) ([]*Opportunity, error)

	// Search searches for opportunities.
	Search(ctx context.Context, tenantID common.TenantID, query string, limit int) ([]*Opportunity, error)

	// FindUpcoming retrieves opportunities with upcoming deadlines.
	FindUpcoming(ctx context.Context, tenantID common.TenantID, days int) ([]*Opportunity, error)
}

// Opportunity represents a funding opportunity.
type Opportunity struct {
	ID             uuid.UUID `json:"id"`
	TenantID       common.TenantID `json:"tenant_id"`
	SponsorID      uuid.UUID `json:"sponsor_id"`
	Title          string    `json:"title"`
	Number         string    `json:"number"` // FOA number
	Description    string    `json:"description"`
	Deadline       *string   `json:"deadline,omitempty"`
	MaxAward       *int64    `json:"max_award,omitempty"`
	URL            string    `json:"url,omitempty"`
	IsActive       bool      `json:"is_active"`
}

// AttachmentRepository defines the attachment storage port.
type AttachmentRepository interface {
	// Store stores a file and returns the storage path.
	Store(ctx context.Context, tenantID common.TenantID, proposalID uuid.UUID, fileName string, contentType string, data []byte) (string, error)

	// Retrieve retrieves a file by storage path.
	Retrieve(ctx context.Context, storagePath string) ([]byte, error)

	// Delete deletes a file by storage path.
	Delete(ctx context.Context, storagePath string) error

	// GetURL returns a presigned URL for file access.
	GetURL(ctx context.Context, storagePath string, expiry int) (string, error)
}

// EmbeddingGenerator defines the embedding generation port.
type EmbeddingGenerator interface {
	// Generate generates an embedding for text.
	Generate(ctx context.Context, text string) ([]float32, error)

	// GenerateBatch generates embeddings for multiple texts.
	GenerateBatch(ctx context.Context, texts []string) ([][]float32, error)
}

// NotificationService defines the notification port.
type NotificationService interface {
	// SendEmail sends an email notification.
	SendEmail(ctx context.Context, to []string, subject, body string) error

	// SendProposalNotification sends a proposal-related notification.
	SendProposalNotification(ctx context.Context, proposalID uuid.UUID, notificationType string, recipients []uuid.UUID) error
}

// AuditLogger defines the audit logging port.
type AuditLogger interface {
	// Log logs an audit event.
	Log(ctx context.Context, event AuditEvent) error

	// Query retrieves audit events.
	Query(ctx context.Context, filter AuditFilter) ([]AuditEvent, error)
}

// AuditEvent represents an audit log event.
type AuditEvent struct {
	ID            uuid.UUID              `json:"id"`
	TenantID      common.TenantID        `json:"tenant_id"`
	EntityType    string                 `json:"entity_type"`
	EntityID      uuid.UUID              `json:"entity_id"`
	Action        string                 `json:"action"`
	PerformedBy   uuid.UUID              `json:"performed_by"`
	PerformedAt   string                 `json:"performed_at"`
	IPAddress     string                 `json:"ip_address,omitempty"`
	UserAgent     string                 `json:"user_agent,omitempty"`
	OldValues     map[string]interface{} `json:"old_values,omitempty"`
	NewValues     map[string]interface{} `json:"new_values,omitempty"`
}

// AuditFilter defines filtering options for audit queries.
type AuditFilter struct {
	EntityType  string    `json:"entity_type,omitempty"`
	EntityID    uuid.UUID `json:"entity_id,omitempty"`
	PerformedBy uuid.UUID `json:"performed_by,omitempty"`
	StartDate   string    `json:"start_date,omitempty"`
	EndDate     string    `json:"end_date,omitempty"`
	Offset      int       `json:"offset"`
	Limit       int       `json:"limit"`
}

// UnitOfWork defines a transaction boundary.
type UnitOfWork interface {
	// Begin starts a new transaction.
	Begin(ctx context.Context) (UnitOfWork, error)

	// Commit commits the transaction.
	Commit() error

	// Rollback rolls back the transaction.
	Rollback() error

	// ProposalRepo returns the proposal repository in this unit of work.
	ProposalRepo() ProposalRepository

	// BudgetRepo returns the budget repository in this unit of work.
	BudgetRepo() BudgetRepository
}
