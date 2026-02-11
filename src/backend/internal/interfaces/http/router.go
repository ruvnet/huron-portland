// Package http provides the HTTP interface for the grants management API.
package http

import (
	"net/http"
	"time"

	"github.com/go-chi/chi/v5"
	chimw "github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
	"github.com/go-chi/httprate"
	"github.com/huron-bangalore/grants-management/internal/interfaces/http/handlers"
	"github.com/huron-bangalore/grants-management/internal/interfaces/http/middleware"
)

// RouterConfig contains router configuration.
type RouterConfig struct {
	TenantConfig     middleware.TenantConfig
	SecurityConfig   middleware.SecurityConfig
	AllowedOrigins   []string
	RateLimitReqs    int
	RateLimitWindow  time.Duration
	EnableProfiling  bool
}

// DefaultRouterConfig returns default router configuration.
func DefaultRouterConfig() RouterConfig {
	return RouterConfig{
		TenantConfig:    middleware.DefaultTenantConfig(),
		SecurityConfig:  middleware.DefaultSecurityConfig(),
		AllowedOrigins:  []string{"*"},
		RateLimitReqs:   100,
		RateLimitWindow: time.Minute,
		EnableProfiling: false,
	}
}

// Handlers contains all API handlers.
type Handlers struct {
	Proposal *handlers.ProposalHandler
}

// NewRouter creates a new HTTP router.
func NewRouter(cfg RouterConfig, h Handlers) *chi.Mux {
	r := chi.NewRouter()

	// Core middleware
	r.Use(chimw.RequestID)
	r.Use(chimw.RealIP)
	r.Use(middleware.RecoveryMiddleware)
	r.Use(middleware.LoggingMiddleware)

	// Security middleware (aidefence patterns)
	r.Use(middleware.SecurityMiddleware(cfg.SecurityConfig))

	// CORS
	r.Use(cors.Handler(cors.Options{
		AllowedOrigins:   cfg.AllowedOrigins,
		AllowedMethods:   []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowedHeaders:   []string{"Accept", "Authorization", "Content-Type", "X-Tenant-ID", "X-Request-ID"},
		ExposedHeaders:   []string{"Link", "X-Total-Count", "X-Request-ID"},
		AllowCredentials: true,
		MaxAge:           300,
	}))

	// Rate limiting
	r.Use(httprate.LimitByIP(cfg.RateLimitReqs, cfg.RateLimitWindow))

	// Request timeout
	r.Use(chimw.Timeout(30 * time.Second))

	// Health endpoints (no auth required)
	r.Get("/health", healthHandler)
	r.Get("/ready", readyHandler)

	// API routes
	r.Route("/api", func(r chi.Router) {
		// Apply tenant middleware to all API routes
		r.Use(middleware.TenantMiddleware(cfg.TenantConfig))

		// API version 1
		r.Route("/v1", func(r chi.Router) {
			// Proposals
			r.Route("/proposals", func(r chi.Router) {
				r.Get("/", h.Proposal.List)
				r.Post("/", h.Proposal.Create)
				r.Get("/search", h.Proposal.Search)
				r.Get("/dashboard", h.Proposal.Dashboard)
				r.Get("/upcoming-deadlines", h.Proposal.UpcomingDeadlines)
				r.Get("/overdue", h.Proposal.Overdue)

				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", h.Proposal.GetByID)
					r.Put("/", h.Proposal.Update)
					r.Delete("/", h.Proposal.Delete)
					r.Post("/transition", h.Proposal.Transition)
					r.Get("/history", h.Proposal.GetHistory)
					r.Get("/available-transitions", h.Proposal.AvailableTransitions)
				})
			})

			// Budgets (placeholder)
			r.Route("/budgets", func(r chi.Router) {
				r.Get("/", notImplementedHandler)
				r.Post("/", notImplementedHandler)
				r.Route("/{id}", func(r chi.Router) {
					r.Get("/", notImplementedHandler)
					r.Put("/", notImplementedHandler)
				})
			})

			// Sponsors (placeholder)
			r.Route("/sponsors", func(r chi.Router) {
				r.Get("/", notImplementedHandler)
				r.Get("/search", notImplementedHandler)
			})

			// People (placeholder)
			r.Route("/people", func(r chi.Router) {
				r.Get("/", notImplementedHandler)
				r.Get("/search", notImplementedHandler)
			})

			// Opportunities (placeholder)
			r.Route("/opportunities", func(r chi.Router) {
				r.Get("/", notImplementedHandler)
				r.Get("/search", notImplementedHandler)
			})
		})
	})

	// Mount profiler if enabled
	if cfg.EnableProfiling {
		r.Mount("/debug", chimw.Profiler())
	}

	return r
}

// healthHandler returns a simple health check response.
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"healthy"}`))
}

// readyHandler returns a readiness check response.
func readyHandler(w http.ResponseWriter, r *http.Request) {
	// TODO: Add actual readiness checks (database, etc.)
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	w.Write([]byte(`{"status":"ready"}`))
}

// notImplementedHandler returns a not implemented response.
func notImplementedHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusNotImplemented)
	w.Write([]byte(`{"error":"Not implemented"}`))
}

// JSON response helpers

// JSONResponse represents a standard JSON response.
type JSONResponse struct {
	Success bool        `json:"success"`
	Data    interface{} `json:"data,omitempty"`
	Error   *APIError   `json:"error,omitempty"`
	Meta    *Meta       `json:"meta,omitempty"`
}

// APIError represents an API error.
type APIError struct {
	Code    string `json:"code"`
	Message string `json:"message"`
	Details interface{} `json:"details,omitempty"`
}

// Meta contains response metadata.
type Meta struct {
	RequestID  string `json:"request_id,omitempty"`
	TotalCount int64  `json:"total_count,omitempty"`
	Offset     int    `json:"offset,omitempty"`
	Limit      int    `json:"limit,omitempty"`
}

// NewSuccessResponse creates a success response.
func NewSuccessResponse(data interface{}, meta *Meta) JSONResponse {
	return JSONResponse{
		Success: true,
		Data:    data,
		Meta:    meta,
	}
}

// NewErrorResponse creates an error response.
func NewErrorResponse(code, message string, details interface{}) JSONResponse {
	return JSONResponse{
		Success: false,
		Error: &APIError{
			Code:    code,
			Message: message,
			Details: details,
		},
	}
}
