// Package postgres provides PostgreSQL repository implementations.
package postgres

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/huron-bangalore/grants-management/internal/domain/common"
	"github.com/huron-bangalore/grants-management/internal/domain/proposal"
	"github.com/jackc/pgx/v5"
	"github.com/pgvector/pgvector-go"
)

// ProposalRepository implements the proposal.Repository interface.
type ProposalRepository struct {
	pool *Pool
}

// NewProposalRepository creates a new proposal repository.
func NewProposalRepository(pool *Pool) *ProposalRepository {
	return &ProposalRepository{pool: pool}
}

// Save persists a proposal (insert or update).
func (r *ProposalRepository) Save(ctx context.Context, p *proposal.Proposal) error {
	// Convert complex fields to JSON
	coInvestigatorsJSON, err := json.Marshal(p.CoInvestigators)
	if err != nil {
		return fmt.Errorf("failed to marshal co-investigators: %w", err)
	}

	keyPersonnelJSON, err := json.Marshal(p.KeyPersonnel)
	if err != nil {
		return fmt.Errorf("failed to marshal key personnel: %w", err)
	}

	keywordsJSON, err := json.Marshal(p.Keywords)
	if err != nil {
		return fmt.Errorf("failed to marshal keywords: %w", err)
	}

	stateHistoryJSON, err := json.Marshal(p.StateHistory)
	if err != nil {
		return fmt.Errorf("failed to marshal state history: %w", err)
	}

	attachmentsJSON, err := json.Marshal(p.Attachments)
	if err != nil {
		return fmt.Errorf("failed to marshal attachments: %w", err)
	}

	query := `
		INSERT INTO proposals (
			id, tenant_id, title, short_title, abstract, state, proposal_number,
			external_id, principal_investigator_id, co_investigators, key_personnel,
			sponsor_id, opportunity_id, sponsor_deadline, internal_deadline,
			project_start_date, project_end_date, department, research_area, keywords,
			budget_id, irb_required, iacuc_required, ibc_required, export_control,
			conflict_of_interest, embedding, state_history, attachments,
			created_at, updated_at, created_by, updated_by, version
		) VALUES (
			$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
			$16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29,
			$30, $31, $32, $33, $34
		)
		ON CONFLICT (id) DO UPDATE SET
			title = EXCLUDED.title,
			short_title = EXCLUDED.short_title,
			abstract = EXCLUDED.abstract,
			state = EXCLUDED.state,
			external_id = EXCLUDED.external_id,
			co_investigators = EXCLUDED.co_investigators,
			key_personnel = EXCLUDED.key_personnel,
			sponsor_deadline = EXCLUDED.sponsor_deadline,
			internal_deadline = EXCLUDED.internal_deadline,
			project_start_date = EXCLUDED.project_start_date,
			project_end_date = EXCLUDED.project_end_date,
			research_area = EXCLUDED.research_area,
			keywords = EXCLUDED.keywords,
			budget_id = EXCLUDED.budget_id,
			irb_required = EXCLUDED.irb_required,
			iacuc_required = EXCLUDED.iacuc_required,
			ibc_required = EXCLUDED.ibc_required,
			export_control = EXCLUDED.export_control,
			conflict_of_interest = EXCLUDED.conflict_of_interest,
			embedding = EXCLUDED.embedding,
			state_history = EXCLUDED.state_history,
			attachments = EXCLUDED.attachments,
			updated_at = EXCLUDED.updated_at,
			updated_by = EXCLUDED.updated_by,
			version = proposals.version + 1
		WHERE proposals.version = $34
	`

	var embeddingValue interface{}
	if len(p.Embedding.Slice()) > 0 {
		embeddingValue = p.Embedding
	}

	result, err := r.pool.Exec(ctx, query,
		p.ID,
		uuid.UUID(p.TenantID),
		p.Title,
		p.ShortTitle,
		p.Abstract,
		p.State,
		p.ProposalNumber,
		p.ExternalID,
		p.PrincipalInvestigatorID,
		coInvestigatorsJSON,
		keyPersonnelJSON,
		p.SponsorID,
		p.OpportunityID,
		p.SponsorDeadline,
		p.InternalDeadline,
		p.ProjectPeriod.StartDate,
		p.ProjectPeriod.EndDate,
		p.Department,
		p.ResearchArea,
		keywordsJSON,
		p.BudgetID,
		p.IRBRequired,
		p.IACUCRequired,
		p.IBCRequired,
		p.ExportControl,
		p.ConflictOfInterest,
		embeddingValue,
		stateHistoryJSON,
		attachmentsJSON,
		p.CreatedAt,
		p.UpdatedAt,
		p.CreatedBy,
		p.UpdatedBy,
		p.Version,
	)

	if err != nil {
		return fmt.Errorf("failed to save proposal: %w", err)
	}

	if result.RowsAffected() == 0 {
		return proposal.ErrVersionMismatch
	}

	return nil
}

// FindByID retrieves a proposal by ID within a tenant.
func (r *ProposalRepository) FindByID(ctx context.Context, tenantID common.TenantID, id uuid.UUID) (*proposal.Proposal, error) {
	query := `
		SELECT id, tenant_id, title, short_title, abstract, state, proposal_number,
			external_id, principal_investigator_id, co_investigators, key_personnel,
			sponsor_id, opportunity_id, sponsor_deadline, internal_deadline,
			project_start_date, project_end_date, department, research_area, keywords,
			budget_id, irb_required, iacuc_required, ibc_required, export_control,
			conflict_of_interest, embedding, state_history, attachments,
			created_at, updated_at, created_by, updated_by, version
		FROM proposals
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	row := r.pool.QueryRow(ctx, query, id, uuid.UUID(tenantID))
	return r.scanProposal(row)
}

// FindByNumber retrieves a proposal by its proposal number.
func (r *ProposalRepository) FindByNumber(ctx context.Context, tenantID common.TenantID, number string) (*proposal.Proposal, error) {
	query := `
		SELECT id, tenant_id, title, short_title, abstract, state, proposal_number,
			external_id, principal_investigator_id, co_investigators, key_personnel,
			sponsor_id, opportunity_id, sponsor_deadline, internal_deadline,
			project_start_date, project_end_date, department, research_area, keywords,
			budget_id, irb_required, iacuc_required, ibc_required, export_control,
			conflict_of_interest, embedding, state_history, attachments,
			created_at, updated_at, created_by, updated_by, version
		FROM proposals
		WHERE proposal_number = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	row := r.pool.QueryRow(ctx, query, number, uuid.UUID(tenantID))
	return r.scanProposal(row)
}

// scanProposal scans a row into a Proposal.
func (r *ProposalRepository) scanProposal(row pgx.Row) (*proposal.Proposal, error) {
	var p proposal.Proposal
	var tenantUUID uuid.UUID
	var coInvestigatorsJSON, keyPersonnelJSON, keywordsJSON, stateHistoryJSON, attachmentsJSON []byte
	var embedding pgvector.Vector
	var opportunityID, budgetID *uuid.UUID
	var sponsorDeadline, internalDeadline *time.Time

	err := row.Scan(
		&p.ID,
		&tenantUUID,
		&p.Title,
		&p.ShortTitle,
		&p.Abstract,
		&p.State,
		&p.ProposalNumber,
		&p.ExternalID,
		&p.PrincipalInvestigatorID,
		&coInvestigatorsJSON,
		&keyPersonnelJSON,
		&p.SponsorID,
		&opportunityID,
		&sponsorDeadline,
		&internalDeadline,
		&p.ProjectPeriod.StartDate,
		&p.ProjectPeriod.EndDate,
		&p.Department,
		&p.ResearchArea,
		&keywordsJSON,
		&budgetID,
		&p.IRBRequired,
		&p.IACUCRequired,
		&p.IBCRequired,
		&p.ExportControl,
		&p.ConflictOfInterest,
		&embedding,
		&stateHistoryJSON,
		&attachmentsJSON,
		&p.CreatedAt,
		&p.UpdatedAt,
		&p.CreatedBy,
		&p.UpdatedBy,
		&p.Version,
	)

	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, nil
		}
		return nil, fmt.Errorf("failed to scan proposal: %w", err)
	}

	p.TenantID = common.TenantID(tenantUUID)
	p.OpportunityID = opportunityID
	p.BudgetID = budgetID
	p.SponsorDeadline = sponsorDeadline
	p.InternalDeadline = internalDeadline
	p.Embedding = embedding

	// Unmarshal JSON fields
	if err := json.Unmarshal(coInvestigatorsJSON, &p.CoInvestigators); err != nil {
		return nil, fmt.Errorf("failed to unmarshal co-investigators: %w", err)
	}
	if err := json.Unmarshal(keyPersonnelJSON, &p.KeyPersonnel); err != nil {
		return nil, fmt.Errorf("failed to unmarshal key personnel: %w", err)
	}
	if err := json.Unmarshal(keywordsJSON, &p.Keywords); err != nil {
		return nil, fmt.Errorf("failed to unmarshal keywords: %w", err)
	}
	if err := json.Unmarshal(stateHistoryJSON, &p.StateHistory); err != nil {
		return nil, fmt.Errorf("failed to unmarshal state history: %w", err)
	}
	if err := json.Unmarshal(attachmentsJSON, &p.Attachments); err != nil {
		return nil, fmt.Errorf("failed to unmarshal attachments: %w", err)
	}

	return &p, nil
}

// FindByPI retrieves all proposals for a principal investigator.
func (r *ProposalRepository) FindByPI(ctx context.Context, tenantID common.TenantID, piID uuid.UUID, filter proposal.ListFilter) ([]*proposal.Proposal, int64, error) {
	filter.PIIDs = []uuid.UUID{piID}
	return r.List(ctx, tenantID, filter)
}

// FindBySponsor retrieves all proposals for a sponsor.
func (r *ProposalRepository) FindBySponsor(ctx context.Context, tenantID common.TenantID, sponsorID uuid.UUID, filter proposal.ListFilter) ([]*proposal.Proposal, int64, error) {
	filter.SponsorIDs = []uuid.UUID{sponsorID}
	return r.List(ctx, tenantID, filter)
}

// FindByState retrieves all proposals in a given state.
func (r *ProposalRepository) FindByState(ctx context.Context, tenantID common.TenantID, state proposal.ProposalState, filter proposal.ListFilter) ([]*proposal.Proposal, int64, error) {
	filter.States = []proposal.ProposalState{state}
	return r.List(ctx, tenantID, filter)
}

// FindByDepartment retrieves all proposals for a department.
func (r *ProposalRepository) FindByDepartment(ctx context.Context, tenantID common.TenantID, department string, filter proposal.ListFilter) ([]*proposal.Proposal, int64, error) {
	filter.Departments = []string{department}
	return r.List(ctx, tenantID, filter)
}

// List retrieves all proposals with filtering and pagination.
func (r *ProposalRepository) List(ctx context.Context, tenantID common.TenantID, filter proposal.ListFilter) ([]*proposal.Proposal, int64, error) {
	// Build query
	var conditions []string
	var args []interface{}
	argNum := 1

	conditions = append(conditions, fmt.Sprintf("tenant_id = $%d", argNum))
	args = append(args, uuid.UUID(tenantID))
	argNum++

	conditions = append(conditions, "deleted_at IS NULL")

	if len(filter.States) > 0 {
		placeholders := make([]string, len(filter.States))
		for i, s := range filter.States {
			placeholders[i] = fmt.Sprintf("$%d", argNum)
			args = append(args, s)
			argNum++
		}
		conditions = append(conditions, fmt.Sprintf("state IN (%s)", strings.Join(placeholders, ", ")))
	}

	if len(filter.Departments) > 0 {
		placeholders := make([]string, len(filter.Departments))
		for i, d := range filter.Departments {
			placeholders[i] = fmt.Sprintf("$%d", argNum)
			args = append(args, d)
			argNum++
		}
		conditions = append(conditions, fmt.Sprintf("department IN (%s)", strings.Join(placeholders, ", ")))
	}

	if len(filter.PIIDs) > 0 {
		placeholders := make([]string, len(filter.PIIDs))
		for i, id := range filter.PIIDs {
			placeholders[i] = fmt.Sprintf("$%d", argNum)
			args = append(args, id)
			argNum++
		}
		conditions = append(conditions, fmt.Sprintf("principal_investigator_id IN (%s)", strings.Join(placeholders, ", ")))
	}

	if len(filter.SponsorIDs) > 0 {
		placeholders := make([]string, len(filter.SponsorIDs))
		for i, id := range filter.SponsorIDs {
			placeholders[i] = fmt.Sprintf("$%d", argNum)
			args = append(args, id)
			argNum++
		}
		conditions = append(conditions, fmt.Sprintf("sponsor_id IN (%s)", strings.Join(placeholders, ", ")))
	}

	if filter.Query != "" {
		conditions = append(conditions, fmt.Sprintf(
			"(title ILIKE $%d OR abstract ILIKE $%d OR proposal_number ILIKE $%d)",
			argNum, argNum, argNum,
		))
		args = append(args, "%"+filter.Query+"%")
		argNum++
	}

	whereClause := strings.Join(conditions, " AND ")

	// Count query
	countQuery := fmt.Sprintf("SELECT COUNT(*) FROM proposals WHERE %s", whereClause)
	var total int64
	if err := r.pool.QueryRow(ctx, countQuery, args...).Scan(&total); err != nil {
		return nil, 0, fmt.Errorf("failed to count proposals: %w", err)
	}

	// Main query with pagination
	sortBy := "created_at"
	if filter.SortBy != "" {
		sortBy = filter.SortBy
	}
	sortOrder := "DESC"
	if filter.SortOrder == "asc" {
		sortOrder = "ASC"
	}

	offset := filter.Offset
	if offset < 0 {
		offset = 0
	}
	limit := filter.Limit
	if limit <= 0 || limit > 100 {
		limit = 20
	}

	query := fmt.Sprintf(`
		SELECT id, tenant_id, title, short_title, abstract, state, proposal_number,
			external_id, principal_investigator_id, co_investigators, key_personnel,
			sponsor_id, opportunity_id, sponsor_deadline, internal_deadline,
			project_start_date, project_end_date, department, research_area, keywords,
			budget_id, irb_required, iacuc_required, ibc_required, export_control,
			conflict_of_interest, embedding, state_history, attachments,
			created_at, updated_at, created_by, updated_by, version
		FROM proposals
		WHERE %s
		ORDER BY %s %s
		LIMIT $%d OFFSET $%d
	`, whereClause, sortBy, sortOrder, argNum, argNum+1)

	args = append(args, limit, offset)

	rows, err := r.pool.Query(ctx, query, args...)
	if err != nil {
		return nil, 0, fmt.Errorf("failed to query proposals: %w", err)
	}
	defer rows.Close()

	var proposals []*proposal.Proposal
	for rows.Next() {
		p, err := r.scanProposalFromRows(rows)
		if err != nil {
			return nil, 0, err
		}
		proposals = append(proposals, p)
	}

	return proposals, total, nil
}

// scanProposalFromRows scans rows into a Proposal.
func (r *ProposalRepository) scanProposalFromRows(rows pgx.Rows) (*proposal.Proposal, error) {
	var p proposal.Proposal
	var tenantUUID uuid.UUID
	var coInvestigatorsJSON, keyPersonnelJSON, keywordsJSON, stateHistoryJSON, attachmentsJSON []byte
	var embedding pgvector.Vector
	var opportunityID, budgetID *uuid.UUID
	var sponsorDeadline, internalDeadline *time.Time

	err := rows.Scan(
		&p.ID,
		&tenantUUID,
		&p.Title,
		&p.ShortTitle,
		&p.Abstract,
		&p.State,
		&p.ProposalNumber,
		&p.ExternalID,
		&p.PrincipalInvestigatorID,
		&coInvestigatorsJSON,
		&keyPersonnelJSON,
		&p.SponsorID,
		&opportunityID,
		&sponsorDeadline,
		&internalDeadline,
		&p.ProjectPeriod.StartDate,
		&p.ProjectPeriod.EndDate,
		&p.Department,
		&p.ResearchArea,
		&keywordsJSON,
		&budgetID,
		&p.IRBRequired,
		&p.IACUCRequired,
		&p.IBCRequired,
		&p.ExportControl,
		&p.ConflictOfInterest,
		&embedding,
		&stateHistoryJSON,
		&attachmentsJSON,
		&p.CreatedAt,
		&p.UpdatedAt,
		&p.CreatedBy,
		&p.UpdatedBy,
		&p.Version,
	)

	if err != nil {
		return nil, fmt.Errorf("failed to scan proposal row: %w", err)
	}

	p.TenantID = common.TenantID(tenantUUID)
	p.OpportunityID = opportunityID
	p.BudgetID = budgetID
	p.SponsorDeadline = sponsorDeadline
	p.InternalDeadline = internalDeadline
	p.Embedding = embedding

	// Unmarshal JSON fields
	_ = json.Unmarshal(coInvestigatorsJSON, &p.CoInvestigators)
	_ = json.Unmarshal(keyPersonnelJSON, &p.KeyPersonnel)
	_ = json.Unmarshal(keywordsJSON, &p.Keywords)
	_ = json.Unmarshal(stateHistoryJSON, &p.StateHistory)
	_ = json.Unmarshal(attachmentsJSON, &p.Attachments)

	return &p, nil
}

// Search performs semantic search using vector similarity.
func (r *ProposalRepository) Search(ctx context.Context, tenantID common.TenantID, embedding []float32, limit int, threshold float64) ([]*proposal.ProposalSearchResult, error) {
	query := `
		SELECT id, tenant_id, title, short_title, abstract, state, proposal_number,
			external_id, principal_investigator_id, co_investigators, key_personnel,
			sponsor_id, opportunity_id, sponsor_deadline, internal_deadline,
			project_start_date, project_end_date, department, research_area, keywords,
			budget_id, irb_required, iacuc_required, ibc_required, export_control,
			conflict_of_interest, embedding, state_history, attachments,
			created_at, updated_at, created_by, updated_by, version,
			1 - (embedding <=> $1) AS similarity
		FROM proposals
		WHERE tenant_id = $2
			AND deleted_at IS NULL
			AND embedding IS NOT NULL
			AND 1 - (embedding <=> $1) > $3
		ORDER BY embedding <=> $1
		LIMIT $4
	`

	vec := pgvector.NewVector(embedding)
	rows, err := r.pool.Query(ctx, query, vec, uuid.UUID(tenantID), threshold, limit)
	if err != nil {
		return nil, fmt.Errorf("failed to search proposals: %w", err)
	}
	defer rows.Close()

	var results []*proposal.ProposalSearchResult
	for rows.Next() {
		var p proposal.Proposal
		var tenantUUID uuid.UUID
		var coInvestigatorsJSON, keyPersonnelJSON, keywordsJSON, stateHistoryJSON, attachmentsJSON []byte
		var emb pgvector.Vector
		var opportunityID, budgetID *uuid.UUID
		var sponsorDeadline, internalDeadline *time.Time
		var similarity float64

		err := rows.Scan(
			&p.ID,
			&tenantUUID,
			&p.Title,
			&p.ShortTitle,
			&p.Abstract,
			&p.State,
			&p.ProposalNumber,
			&p.ExternalID,
			&p.PrincipalInvestigatorID,
			&coInvestigatorsJSON,
			&keyPersonnelJSON,
			&p.SponsorID,
			&opportunityID,
			&sponsorDeadline,
			&internalDeadline,
			&p.ProjectPeriod.StartDate,
			&p.ProjectPeriod.EndDate,
			&p.Department,
			&p.ResearchArea,
			&keywordsJSON,
			&budgetID,
			&p.IRBRequired,
			&p.IACUCRequired,
			&p.IBCRequired,
			&p.ExportControl,
			&p.ConflictOfInterest,
			&emb,
			&stateHistoryJSON,
			&attachmentsJSON,
			&p.CreatedAt,
			&p.UpdatedAt,
			&p.CreatedBy,
			&p.UpdatedBy,
			&p.Version,
			&similarity,
		)

		if err != nil {
			return nil, fmt.Errorf("failed to scan search result: %w", err)
		}

		p.TenantID = common.TenantID(tenantUUID)
		p.OpportunityID = opportunityID
		p.BudgetID = budgetID
		p.SponsorDeadline = sponsorDeadline
		p.InternalDeadline = internalDeadline
		p.Embedding = emb

		_ = json.Unmarshal(coInvestigatorsJSON, &p.CoInvestigators)
		_ = json.Unmarshal(keyPersonnelJSON, &p.KeyPersonnel)
		_ = json.Unmarshal(keywordsJSON, &p.Keywords)
		_ = json.Unmarshal(stateHistoryJSON, &p.StateHistory)
		_ = json.Unmarshal(attachmentsJSON, &p.Attachments)

		results = append(results, &proposal.ProposalSearchResult{
			Proposal:   &p,
			Similarity: similarity,
		})
	}

	return results, nil
}

// Delete soft-deletes a proposal.
func (r *ProposalRepository) Delete(ctx context.Context, tenantID common.TenantID, id uuid.UUID) error {
	query := `
		UPDATE proposals
		SET deleted_at = NOW()
		WHERE id = $1 AND tenant_id = $2 AND deleted_at IS NULL
	`

	result, err := r.pool.Exec(ctx, query, id, uuid.UUID(tenantID))
	if err != nil {
		return fmt.Errorf("failed to delete proposal: %w", err)
	}

	if result.RowsAffected() == 0 {
		return errors.New("proposal not found")
	}

	return nil
}

// GetUpcomingDeadlines retrieves proposals with deadlines in the next N days.
func (r *ProposalRepository) GetUpcomingDeadlines(ctx context.Context, tenantID common.TenantID, days int) ([]*proposal.Proposal, error) {
	query := `
		SELECT id, tenant_id, title, short_title, abstract, state, proposal_number,
			external_id, principal_investigator_id, co_investigators, key_personnel,
			sponsor_id, opportunity_id, sponsor_deadline, internal_deadline,
			project_start_date, project_end_date, department, research_area, keywords,
			budget_id, irb_required, iacuc_required, ibc_required, export_control,
			conflict_of_interest, embedding, state_history, attachments,
			created_at, updated_at, created_by, updated_by, version
		FROM proposals
		WHERE tenant_id = $1
			AND deleted_at IS NULL
			AND sponsor_deadline IS NOT NULL
			AND sponsor_deadline > NOW()
			AND sponsor_deadline <= NOW() + INTERVAL '%d days'
			AND state NOT IN ('SUBMITTED', 'AWARDED', 'ACTIVE', 'CLOSED', 'WITHDRAWN', 'DECLINED', 'NOT_FUNDED')
		ORDER BY sponsor_deadline ASC
	`

	formattedQuery := fmt.Sprintf(query, days)
	rows, err := r.pool.Query(ctx, formattedQuery, uuid.UUID(tenantID))
	if err != nil {
		return nil, fmt.Errorf("failed to query upcoming deadlines: %w", err)
	}
	defer rows.Close()

	var proposals []*proposal.Proposal
	for rows.Next() {
		p, err := r.scanProposalFromRows(rows)
		if err != nil {
			return nil, err
		}
		proposals = append(proposals, p)
	}

	return proposals, nil
}

// GetOverdue retrieves proposals that are past their deadline.
func (r *ProposalRepository) GetOverdue(ctx context.Context, tenantID common.TenantID) ([]*proposal.Proposal, error) {
	query := `
		SELECT id, tenant_id, title, short_title, abstract, state, proposal_number,
			external_id, principal_investigator_id, co_investigators, key_personnel,
			sponsor_id, opportunity_id, sponsor_deadline, internal_deadline,
			project_start_date, project_end_date, department, research_area, keywords,
			budget_id, irb_required, iacuc_required, ibc_required, export_control,
			conflict_of_interest, embedding, state_history, attachments,
			created_at, updated_at, created_by, updated_by, version
		FROM proposals
		WHERE tenant_id = $1
			AND deleted_at IS NULL
			AND sponsor_deadline IS NOT NULL
			AND sponsor_deadline < NOW()
			AND state NOT IN ('SUBMITTED', 'AWARDED', 'ACTIVE', 'CLOSED', 'WITHDRAWN', 'DECLINED', 'NOT_FUNDED')
		ORDER BY sponsor_deadline ASC
	`

	rows, err := r.pool.Query(ctx, query, uuid.UUID(tenantID))
	if err != nil {
		return nil, fmt.Errorf("failed to query overdue proposals: %w", err)
	}
	defer rows.Close()

	var proposals []*proposal.Proposal
	for rows.Next() {
		p, err := r.scanProposalFromRows(rows)
		if err != nil {
			return nil, err
		}
		proposals = append(proposals, p)
	}

	return proposals, nil
}

// CountByState returns the count of proposals by state.
func (r *ProposalRepository) CountByState(ctx context.Context, tenantID common.TenantID) (map[proposal.ProposalState]int64, error) {
	query := `
		SELECT state, COUNT(*)
		FROM proposals
		WHERE tenant_id = $1 AND deleted_at IS NULL
		GROUP BY state
	`

	rows, err := r.pool.Query(ctx, query, uuid.UUID(tenantID))
	if err != nil {
		return nil, fmt.Errorf("failed to count by state: %w", err)
	}
	defer rows.Close()

	counts := make(map[proposal.ProposalState]int64)
	for rows.Next() {
		var state proposal.ProposalState
		var count int64
		if err := rows.Scan(&state, &count); err != nil {
			return nil, fmt.Errorf("failed to scan count: %w", err)
		}
		counts[state] = count
	}

	return counts, nil
}

// GetStateHistory retrieves the state transition history for a proposal.
func (r *ProposalRepository) GetStateHistory(ctx context.Context, tenantID common.TenantID, id uuid.UUID) ([]proposal.StateTransition, error) {
	p, err := r.FindByID(ctx, tenantID, id)
	if err != nil {
		return nil, err
	}
	if p == nil {
		return nil, errors.New("proposal not found")
	}
	return p.StateHistory, nil
}
