// Package middleware provides HTTP middleware for the grants management API.
package middleware

import (
	"context"
	"net/http"
	"strings"

	"github.com/go-chi/chi/v5/middleware"
	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"github.com/huron-bangalore/grants-management/internal/domain/common"
	"github.com/rs/zerolog/log"
)

// ContextKey is a type for context keys.
type ContextKey string

const (
	// TenantContextKey is the context key for tenant context.
	TenantContextKey ContextKey = "tenant_context"
	// RequestIDKey is the context key for request ID.
	RequestIDKey ContextKey = "request_id"
)

// TenantConfig contains tenant middleware configuration.
type TenantConfig struct {
	JWTSecret         []byte
	TenantHeader      string
	RequireAuth       bool
	AllowedTenants    []string
	BypassPaths       []string
}

// DefaultTenantConfig returns default tenant middleware configuration.
func DefaultTenantConfig() TenantConfig {
	return TenantConfig{
		TenantHeader: "X-Tenant-ID",
		RequireAuth:  true,
		BypassPaths:  []string{"/health", "/ready", "/metrics"},
	}
}

// TenantMiddleware extracts tenant context from requests.
func TenantMiddleware(cfg TenantConfig) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check bypass paths
			for _, path := range cfg.BypassPaths {
				if strings.HasPrefix(r.URL.Path, path) {
					next.ServeHTTP(w, r)
					return
				}
			}

			// Extract tenant context
			tenantCtx, err := extractTenantContext(r, cfg)
			if err != nil {
				log.Warn().Err(err).Str("path", r.URL.Path).Msg("Failed to extract tenant context")
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			// Check if tenant is allowed
			if len(cfg.AllowedTenants) > 0 {
				allowed := false
				for _, t := range cfg.AllowedTenants {
					if t == tenantCtx.TenantID.String() {
						allowed = true
						break
					}
				}
				if !allowed {
					http.Error(w, "Tenant not allowed", http.StatusForbidden)
					return
				}
			}

			// Add tenant context to request context
			ctx := context.WithValue(r.Context(), TenantContextKey, tenantCtx)

			// Add request ID
			reqID := middleware.GetReqID(r.Context())
			if reqID == "" {
				reqID = uuid.New().String()
			}
			ctx = context.WithValue(ctx, RequestIDKey, reqID)

			next.ServeHTTP(w, r.WithContext(ctx))
		})
	}
}

// extractTenantContext extracts tenant context from the request.
func extractTenantContext(r *http.Request, cfg TenantConfig) (*common.TenantContext, error) {
	var tenantID common.TenantID
	var userID uuid.UUID
	var roles []string

	// Try to extract from JWT token first
	authHeader := r.Header.Get("Authorization")
	if strings.HasPrefix(authHeader, "Bearer ") {
		tokenString := strings.TrimPrefix(authHeader, "Bearer ")
		claims, err := parseJWTClaims(tokenString, cfg.JWTSecret)
		if err == nil {
			tenantID = claims.TenantID
			userID = claims.UserID
			roles = claims.Roles
		} else if cfg.RequireAuth {
			return nil, err
		}
	}

	// Fall back to header if no JWT
	if tenantID == (common.TenantID{}) {
		tenantHeader := r.Header.Get(cfg.TenantHeader)
		if tenantHeader != "" {
			parsed, err := common.ParseTenantID(tenantHeader)
			if err != nil {
				return nil, err
			}
			tenantID = parsed
		}
	}

	// Check if we have required context
	if cfg.RequireAuth && (tenantID == (common.TenantID{}) || userID == uuid.Nil) {
		return nil, jwt.ErrTokenMalformed
	}

	return &common.TenantContext{
		TenantID: tenantID,
		UserID:   userID,
		Roles:    roles,
	}, nil
}

// JWTClaims represents the claims in a JWT token.
type JWTClaims struct {
	TenantID common.TenantID `json:"tenant_id"`
	UserID   uuid.UUID       `json:"user_id"`
	Email    string          `json:"email"`
	Roles    []string        `json:"roles"`
	jwt.RegisteredClaims
}

// parseJWTClaims parses and validates JWT claims.
func parseJWTClaims(tokenString string, secret []byte) (*JWTClaims, error) {
	token, err := jwt.ParseWithClaims(tokenString, &JWTClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, jwt.ErrSignatureInvalid
		}
		return secret, nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*JWTClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, jwt.ErrTokenMalformed
}

// GetTenantContext retrieves the tenant context from the request context.
func GetTenantContext(ctx context.Context) *common.TenantContext {
	if tc, ok := ctx.Value(TenantContextKey).(*common.TenantContext); ok {
		return tc
	}
	return nil
}

// GetRequestID retrieves the request ID from the context.
func GetRequestID(ctx context.Context) string {
	if id, ok := ctx.Value(RequestIDKey).(string); ok {
		return id
	}
	return ""
}

// RequireRole creates middleware that requires a specific role.
func RequireRole(role string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tc := GetTenantContext(r.Context())
			if tc == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			if !tc.HasRole(role) {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RequireAnyRole creates middleware that requires any of the specified roles.
func RequireAnyRole(roles ...string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			tc := GetTenantContext(r.Context())
			if tc == nil {
				http.Error(w, "Unauthorized", http.StatusUnauthorized)
				return
			}

			hasRole := false
			for _, role := range roles {
				if tc.HasRole(role) {
					hasRole = true
					break
				}
			}

			if !hasRole {
				http.Error(w, "Forbidden", http.StatusForbidden)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// LoggingMiddleware logs request details.
func LoggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := middleware.GetReqID(r.Context())
		ww := middleware.NewWrapResponseWriter(w, r.ProtoMajor)

		defer func() {
			tc := GetTenantContext(r.Context())
			tenantStr := "unknown"
			if tc != nil {
				tenantStr = tc.TenantID.String()
			}

			log.Info().
				Str("method", r.Method).
				Str("path", r.URL.Path).
				Int("status", ww.Status()).
				Int("bytes", ww.BytesWritten()).
				Str("tenant", tenantStr).
				Str("request_id", start).
				Msg("Request completed")
		}()

		next.ServeHTTP(ww, r)
	})
}

// CORSMiddleware handles CORS headers.
func CORSMiddleware(allowedOrigins []string) func(next http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			origin := r.Header.Get("Origin")

			// Check if origin is allowed
			allowed := false
			for _, o := range allowedOrigins {
				if o == "*" || o == origin {
					allowed = true
					break
				}
			}

			if allowed {
				w.Header().Set("Access-Control-Allow-Origin", origin)
				w.Header().Set("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS")
				w.Header().Set("Access-Control-Allow-Headers", "Accept, Authorization, Content-Type, X-Tenant-ID, X-Request-ID")
				w.Header().Set("Access-Control-Allow-Credentials", "true")
				w.Header().Set("Access-Control-Max-Age", "86400")
			}

			if r.Method == "OPTIONS" {
				w.WriteHeader(http.StatusOK)
				return
			}

			next.ServeHTTP(w, r)
		})
	}
}

// RecoveryMiddleware recovers from panics.
func RecoveryMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if err := recover(); err != nil {
				reqID := GetRequestID(r.Context())
				log.Error().
					Interface("error", err).
					Str("request_id", reqID).
					Str("path", r.URL.Path).
					Msg("Panic recovered")

				http.Error(w, "Internal Server Error", http.StatusInternalServerError)
			}
		}()

		next.ServeHTTP(w, r)
	})
}
