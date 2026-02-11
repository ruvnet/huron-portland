// Package handlers provides HTTP handlers for the grants management API.
package handlers

import (
	"encoding/json"
	"net/http"
	"strconv"

	"github.com/go-chi/chi/v5"
	"github.com/google/uuid"
	appproposal "github.com/huron-bangalore/grants-management/internal/application/proposal"
	"github.com/huron-bangalore/grants-management/internal/domain/proposal"
	"github.com/huron-bangalore/grants-management/internal/interfaces/http/middleware"
	"github.com/rs/zerolog/log"
)

// ProposalHandler handles proposal HTTP requests.
type ProposalHandler struct {
	service *appproposal.Service
}

// NewProposalHandler creates a new proposal handler.
func NewProposalHandler(service *appproposal.Service) *ProposalHandler {
	return &ProposalHandler{service: service}
}

// List handles GET /api/v1/proposals
func (h *ProposalHandler) List(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	// Parse query parameters
	filter := parseListFilter(r)

	// Get proposals
	result, err := h.service.List(ctx, *tenantCtx, filter)
	if err != nil {
		log.Error().Err(err).Msg("Failed to list proposals")
		writeError(w, http.StatusInternalServerError, "INTERNAL_ERROR", "Failed to list proposals")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"proposals": result.Proposals,
		"total":     result.Total,
		"offset":    result.Offset,
		"limit":     result.Limit,
	})
}

// Create handles POST /api/v1/proposals
func (h *ProposalHandler) Create(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	var cmd appproposal.CreateProposalCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	result, err := h.service.Create(ctx, *tenantCtx, cmd)
	if err != nil {
		log.Error().Err(err).Msg("Failed to create proposal")
		writeError(w, http.StatusBadRequest, "CREATE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusCreated, result)
}

// GetByID handles GET /api/v1/proposals/{id}
func (h *ProposalHandler) GetByID(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID")
		return
	}

	result, err := h.service.GetByID(ctx, *tenantCtx, id)
	if err != nil {
		log.Error().Err(err).Str("id", idStr).Msg("Failed to get proposal")
		writeError(w, http.StatusNotFound, "NOT_FOUND", "Proposal not found")
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// Update handles PUT /api/v1/proposals/{id}
func (h *ProposalHandler) Update(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID")
		return
	}

	var cmd appproposal.UpdateCommand
	if err := json.NewDecoder(r.Body).Decode(&cmd); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}
	cmd.ProposalID = id

	result, err := h.service.Update(ctx, *tenantCtx, cmd)
	if err != nil {
		log.Error().Err(err).Str("id", idStr).Msg("Failed to update proposal")
		if err == proposal.ErrProposalNotEditable {
			writeError(w, http.StatusConflict, "NOT_EDITABLE", "Proposal cannot be edited in current state")
			return
		}
		if err == proposal.ErrVersionMismatch {
			writeError(w, http.StatusConflict, "VERSION_MISMATCH", "Proposal was modified by another user")
			return
		}
		writeError(w, http.StatusBadRequest, "UPDATE_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// Delete handles DELETE /api/v1/proposals/{id}
func (h *ProposalHandler) Delete(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID")
		return
	}

	if err := h.service.Delete(ctx, *tenantCtx, id); err != nil {
		log.Error().Err(err).Str("id", idStr).Msg("Failed to delete proposal")
		writeError(w, http.StatusBadRequest, "DELETE_FAILED", err.Error())
		return
	}

	w.WriteHeader(http.StatusNoContent)
}

// Transition handles POST /api/v1/proposals/{id}/transition
func (h *ProposalHandler) Transition(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID")
		return
	}

	var req struct {
		Transition      string `json:"transition"`
		Comment         string `json:"comment"`
		ExpectedVersion int    `json:"expected_version"`
	}
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_REQUEST", "Invalid request body")
		return
	}

	cmd := appproposal.TransitionCommand{
		ProposalID:      id,
		Transition:      proposal.ProposalTransition(req.Transition),
		Comment:         req.Comment,
		ExpectedVersion: req.ExpectedVersion,
	}

	result, err := h.service.Transition(ctx, *tenantCtx, cmd)
	if err != nil {
		log.Error().Err(err).Str("id", idStr).Str("transition", req.Transition).Msg("Failed to transition proposal")
		if err == proposal.ErrInvalidTransition {
			writeError(w, http.StatusBadRequest, "INVALID_TRANSITION", "Invalid state transition")
			return
		}
		if err == proposal.ErrVersionMismatch {
			writeError(w, http.StatusConflict, "VERSION_MISMATCH", "Proposal was modified by another user")
			return
		}
		writeError(w, http.StatusBadRequest, "TRANSITION_FAILED", err.Error())
		return
	}

	writeJSON(w, http.StatusOK, result)
}

// Search handles GET /api/v1/proposals/search
func (h *ProposalHandler) Search(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	query := r.URL.Query().Get("q")
	if query == "" {
		writeError(w, http.StatusBadRequest, "MISSING_QUERY", "Search query is required")
		return
	}

	limit := 10
	if l := r.URL.Query().Get("limit"); l != "" {
		if parsed, err := strconv.Atoi(l); err == nil && parsed > 0 && parsed <= 100 {
			limit = parsed
		}
	}

	results, err := h.service.Search(ctx, *tenantCtx, query, limit)
	if err != nil {
		log.Error().Err(err).Str("query", query).Msg("Failed to search proposals")
		writeError(w, http.StatusInternalServerError, "SEARCH_FAILED", "Search failed")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"results": results,
		"query":   query,
	})
}

// Dashboard handles GET /api/v1/proposals/dashboard
func (h *ProposalHandler) Dashboard(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	dashboard, err := h.service.GetDashboard(ctx, *tenantCtx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get dashboard data")
		writeError(w, http.StatusInternalServerError, "DASHBOARD_FAILED", "Failed to get dashboard data")
		return
	}

	writeJSON(w, http.StatusOK, dashboard)
}

// UpcomingDeadlines handles GET /api/v1/proposals/upcoming-deadlines
func (h *ProposalHandler) UpcomingDeadlines(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	days := 14
	if d := r.URL.Query().Get("days"); d != "" {
		if parsed, err := strconv.Atoi(d); err == nil && parsed > 0 && parsed <= 90 {
			days = parsed
		}
	}

	proposals, err := h.service.GetDashboard(ctx, *tenantCtx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get upcoming deadlines")
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to get upcoming deadlines")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"proposals": proposals.UpcomingDeadlines,
		"days":      days,
	})
}

// Overdue handles GET /api/v1/proposals/overdue
func (h *ProposalHandler) Overdue(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	dashboard, err := h.service.GetDashboard(ctx, *tenantCtx)
	if err != nil {
		log.Error().Err(err).Msg("Failed to get overdue proposals")
		writeError(w, http.StatusInternalServerError, "FETCH_FAILED", "Failed to get overdue proposals")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"proposals": dashboard.OverdueProposals,
	})
}

// GetHistory handles GET /api/v1/proposals/{id}/history
func (h *ProposalHandler) GetHistory(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID")
		return
	}

	detail, err := h.service.GetByID(ctx, *tenantCtx, id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "Proposal not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"history": detail.Proposal.StateHistory,
	})
}

// AvailableTransitions handles GET /api/v1/proposals/{id}/available-transitions
func (h *ProposalHandler) AvailableTransitions(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	tenantCtx := middleware.GetTenantContext(ctx)
	if tenantCtx == nil {
		writeError(w, http.StatusUnauthorized, "UNAUTHORIZED", "Missing tenant context")
		return
	}

	idStr := chi.URLParam(r, "id")
	id, err := uuid.Parse(idStr)
	if err != nil {
		writeError(w, http.StatusBadRequest, "INVALID_ID", "Invalid proposal ID")
		return
	}

	detail, err := h.service.GetByID(ctx, *tenantCtx, id)
	if err != nil {
		writeError(w, http.StatusNotFound, "NOT_FOUND", "Proposal not found")
		return
	}

	writeJSON(w, http.StatusOK, map[string]interface{}{
		"current_state":          detail.Proposal.State,
		"available_transitions":  detail.AvailableActions,
	})
}

// Helper functions

func parseListFilter(r *http.Request) proposal.ListFilter {
	filter := proposal.DefaultListFilter()

	if offset := r.URL.Query().Get("offset"); offset != "" {
		if v, err := strconv.Atoi(offset); err == nil && v >= 0 {
			filter.Offset = v
		}
	}

	if limit := r.URL.Query().Get("limit"); limit != "" {
		if v, err := strconv.Atoi(limit); err == nil && v > 0 && v <= 100 {
			filter.Limit = v
		}
	}

	if sortBy := r.URL.Query().Get("sort_by"); sortBy != "" {
		filter.SortBy = sortBy
	}

	if sortOrder := r.URL.Query().Get("sort_order"); sortOrder == "asc" || sortOrder == "desc" {
		filter.SortOrder = sortOrder
	}

	if states := r.URL.Query()["state"]; len(states) > 0 {
		filter.States = make([]proposal.ProposalState, len(states))
		for i, s := range states {
			filter.States[i] = proposal.ProposalState(s)
		}
	}

	if departments := r.URL.Query()["department"]; len(departments) > 0 {
		filter.Departments = departments
	}

	if query := r.URL.Query().Get("q"); query != "" {
		filter.Query = query
	}

	return filter
}

func writeJSON(w http.ResponseWriter, status int, data interface{}) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(data); err != nil {
		log.Error().Err(err).Msg("Failed to encode JSON response")
	}
}

func writeError(w http.ResponseWriter, status int, code, message string) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(map[string]interface{}{
		"success": false,
		"error": map[string]string{
			"code":    code,
			"message": message,
		},
	})
}
