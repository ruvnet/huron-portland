// Package middleware provides HTTP middleware for the grants management API.
package middleware

import (
	"encoding/json"
	"io"
	"net/http"
	"regexp"
	"strings"

	"github.com/rs/zerolog/log"
)

// SecurityConfig contains security middleware configuration.
type SecurityConfig struct {
	// EnablePromptInjectionCheck enables prompt injection detection
	EnablePromptInjectionCheck bool

	// EnableSQLInjectionCheck enables SQL injection detection
	EnableSQLInjectionCheck bool

	// EnableXSSCheck enables XSS detection
	EnableXSSCheck bool

	// MaxRequestBodySize limits request body size (default 1MB)
	MaxRequestBodySize int64

	// SanitizeOnThreat sanitizes input instead of rejecting
	SanitizeOnThreat bool

	// BypassPaths are paths that skip security checks
	BypassPaths []string
}

// DefaultSecurityConfig returns default security configuration.
func DefaultSecurityConfig() SecurityConfig {
	return SecurityConfig{
		EnablePromptInjectionCheck: true,
		EnableSQLInjectionCheck:    true,
		EnableXSSCheck:             true,
		MaxRequestBodySize:         1 << 20, // 1MB
		SanitizeOnThreat:           false,
		BypassPaths:                []string{"/health", "/ready", "/metrics"},
	}
}

// ThreatType represents a type of security threat.
type ThreatType string

const (
	ThreatPromptInjection ThreatType = "prompt_injection"
	ThreatSQLInjection    ThreatType = "sql_injection"
	ThreatXSS             ThreatType = "xss"
)

// ThreatDetectionResult contains the result of threat detection.
type ThreatDetectionResult struct {
	IsSafe   bool       `json:"is_safe"`
	Threats  []Threat   `json:"threats,omitempty"`
	Score    int        `json:"score"`
}

// Threat represents a detected threat.
type Threat struct {
	Type        ThreatType `json:"type"`
	Pattern     string     `json:"pattern"`
	Severity    string     `json:"severity"`
	Description string     `json:"description"`
}

// Compiled regex patterns for threat detection
var (
	// Prompt injection patterns
	promptInjectionPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)ignore\s+(previous|above|all)\s+(instructions?|prompts?)`),
		regexp.MustCompile(`(?i)disregard\s+(all|any)\s+(prior|previous)`),
		regexp.MustCompile(`(?i)forget\s+(everything|all|your)\s+(you|know|instructions?)`),
		regexp.MustCompile(`(?i)you\s+are\s+now\s+(a|an)\s+`),
		regexp.MustCompile(`(?i)new\s+instructions?:`),
		regexp.MustCompile(`(?i)system\s*:\s*`),
		regexp.MustCompile(`\[INST\]`),
		regexp.MustCompile(`<<SYS>>`),
		regexp.MustCompile(`(?i)dan\s*(mode)?`),
		regexp.MustCompile(`(?i)developer\s+mode`),
		regexp.MustCompile(`(?i)bypass\s+(safety|filter|content)`),
		regexp.MustCompile(`(?i)pretend\s+to\s+be`),
		regexp.MustCompile(`(?i)roleplay\s+as`),
		regexp.MustCompile(`(?i)act\s+as\s+(if|though)`),
	}

	// SQL injection patterns
	sqlInjectionPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)'\s*(or|and)\s*['"]?\d*['"]?\s*=\s*['"]?\d*`),
		regexp.MustCompile(`(?i)'\s*(or|and)\s*['"]?[a-z]+['"]?\s*=\s*['"]?[a-z]+`),
		regexp.MustCompile(`(?i);\s*(drop|delete|truncate|insert|update|alter)\s+`),
		regexp.MustCompile(`(?i)union\s+(all\s+)?select`),
		regexp.MustCompile(`(?i)select\s+.*\s+from\s+.*\s+where`),
		regexp.MustCompile(`--\s*$`),
		regexp.MustCompile(`/\*.*\*/`),
	}

	// XSS patterns
	xssPatterns = []*regexp.Regexp{
		regexp.MustCompile(`(?i)<script[^>]*>`),
		regexp.MustCompile(`(?i)</script>`),
		regexp.MustCompile(`(?i)javascript\s*:`),
		regexp.MustCompile(`(?i)on(click|load|error|mouseover|focus|blur|change|submit)\s*=`),
		regexp.MustCompile(`(?i)<img[^>]+onerror`),
		regexp.MustCompile(`(?i)<svg[^>]+onload`),
		regexp.MustCompile(`(?i)<iframe`),
		regexp.MustCompile(`(?i)<embed`),
		regexp.MustCompile(`(?i)<object`),
	}
)

// SecurityMiddleware creates a middleware that detects security threats.
func SecurityMiddleware(cfg SecurityConfig) func(http.Handler) http.Handler {
	return func(next http.Handler) http.Handler {
		return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
			// Check bypass paths
			for _, path := range cfg.BypassPaths {
				if strings.HasPrefix(r.URL.Path, path) {
					next.ServeHTTP(w, r)
					return
				}
			}

			// Check query parameters
			for key, values := range r.URL.Query() {
				for _, value := range values {
					result := scanInput(value, cfg)
					if !result.IsSafe {
						logThreat(r, "query_param", key, result)
						if !cfg.SanitizeOnThreat {
							respondWithThreat(w, result)
							return
						}
					}
				}
			}

			// Check request body for POST/PUT/PATCH
			if r.Method == http.MethodPost || r.Method == http.MethodPut || r.Method == http.MethodPatch {
				if r.Body != nil && r.ContentLength > 0 && r.ContentLength <= cfg.MaxRequestBodySize {
					// Read body
					body, err := io.ReadAll(io.LimitReader(r.Body, cfg.MaxRequestBodySize))
					if err != nil {
						http.Error(w, "Failed to read request body", http.StatusBadRequest)
						return
					}
					r.Body.Close()

					// Scan body content
					result := scanInput(string(body), cfg)
					if !result.IsSafe {
						logThreat(r, "body", "", result)
						if !cfg.SanitizeOnThreat {
							respondWithThreat(w, result)
							return
						}
					}

					// Restore body for downstream handlers
					r.Body = io.NopCloser(strings.NewReader(string(body)))
				}
			}

			next.ServeHTTP(w, r)
		})
	}
}

// scanInput checks input for security threats.
func scanInput(input string, cfg SecurityConfig) ThreatDetectionResult {
	result := ThreatDetectionResult{
		IsSafe:  true,
		Threats: []Threat{},
		Score:   0,
	}

	if input == "" {
		return result
	}

	// Check prompt injection
	if cfg.EnablePromptInjectionCheck {
		for _, pattern := range promptInjectionPatterns {
			if pattern.MatchString(input) {
				result.IsSafe = false
				result.Score += 100
				result.Threats = append(result.Threats, Threat{
					Type:        ThreatPromptInjection,
					Pattern:     pattern.String(),
					Severity:    "critical",
					Description: "Potential prompt injection detected",
				})
				break // One match is enough
			}
		}
	}

	// Check SQL injection
	if cfg.EnableSQLInjectionCheck {
		for _, pattern := range sqlInjectionPatterns {
			if pattern.MatchString(input) {
				result.IsSafe = false
				result.Score += 100
				result.Threats = append(result.Threats, Threat{
					Type:        ThreatSQLInjection,
					Pattern:     pattern.String(),
					Severity:    "critical",
					Description: "Potential SQL injection detected",
				})
				break
			}
		}
	}

	// Check XSS
	if cfg.EnableXSSCheck {
		for _, pattern := range xssPatterns {
			if pattern.MatchString(input) {
				result.IsSafe = false
				result.Score += 50
				result.Threats = append(result.Threats, Threat{
					Type:        ThreatXSS,
					Pattern:     pattern.String(),
					Severity:    "high",
					Description: "Potential XSS detected",
				})
				break
			}
		}
	}

	// Cap score at 100
	if result.Score > 100 {
		result.Score = 100
	}

	return result
}

// logThreat logs a detected threat.
func logThreat(r *http.Request, source, key string, result ThreatDetectionResult) {
	threatTypes := make([]string, len(result.Threats))
	for i, t := range result.Threats {
		threatTypes[i] = string(t.Type)
	}

	log.Warn().
		Str("ip", r.RemoteAddr).
		Str("method", r.Method).
		Str("path", r.URL.Path).
		Str("source", source).
		Str("param", key).
		Strs("threats", threatTypes).
		Int("score", result.Score).
		Msg("Security threat detected")
}

// respondWithThreat sends a threat detection response.
func respondWithThreat(w http.ResponseWriter, result ThreatDetectionResult) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusBadRequest)

	response := map[string]interface{}{
		"success": false,
		"error": map[string]interface{}{
			"code":    "SECURITY_THREAT_DETECTED",
			"message": "Request contains potentially malicious content",
			"details": map[string]interface{}{
				"threat_count": len(result.Threats),
				"score":        result.Score,
			},
		},
	}

	json.NewEncoder(w).Encode(response)
}

// ScanInput is a public function for scanning input from handlers.
func ScanInput(input string) ThreatDetectionResult {
	return scanInput(input, DefaultSecurityConfig())
}

// IsSafeForSearch checks if input is safe for search queries.
func IsSafeForSearch(input string) bool {
	cfg := SecurityConfig{
		EnablePromptInjectionCheck: true,
		EnableSQLInjectionCheck:    true,
		EnableXSSCheck:             true,
	}
	return scanInput(input, cfg).IsSafe
}

// IsSafeForAI checks if input is safe for AI queries.
func IsSafeForAI(input string) bool {
	cfg := SecurityConfig{
		EnablePromptInjectionCheck: true,
		EnableSQLInjectionCheck:    true,
		EnableXSSCheck:             false, // Less relevant for AI
	}
	return scanInput(input, cfg).IsSafe
}
