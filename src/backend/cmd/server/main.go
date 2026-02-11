// Package main provides the entry point for the Huron Grants Management API server.
package main

import (
	"context"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
	"github.com/rs/zerolog/log"

	appproposal "github.com/huron-bangalore/grants-management/internal/application/proposal"
	"github.com/huron-bangalore/grants-management/internal/infrastructure/postgres"
	"github.com/huron-bangalore/grants-management/internal/infrastructure/ruvector"
	httpapi "github.com/huron-bangalore/grants-management/internal/interfaces/http"
	"github.com/huron-bangalore/grants-management/internal/interfaces/http/handlers"
	"github.com/huron-bangalore/grants-management/internal/interfaces/http/middleware"
)

// Config holds the application configuration.
type Config struct {
	// Server settings
	ServerHost string
	ServerPort int

	// Database settings
	DBHost     string
	DBPort     int
	DBName     string
	DBUser     string
	DBPassword string
	DBSSLMode  string

	// RuVector settings
	RuVectorURL    string
	RuVectorAPIKey string
	RuVectorModel  string

	// Auth settings
	JWTSecret string

	// Feature flags
	EnableProfiling bool
	LogLevel        string
}

// LoadConfig loads configuration from environment variables.
func LoadConfig() Config {
	// Load .env file if it exists
	_ = godotenv.Load()

	return Config{
		// Server
		ServerHost: getEnv("SERVER_HOST", "0.0.0.0"),
		ServerPort: getEnvInt("SERVER_PORT", 8080),

		// Database
		DBHost:     getEnv("DB_HOST", "localhost"),
		DBPort:     getEnvInt("DB_PORT", 5432),
		DBName:     getEnv("DB_NAME", "grants"),
		DBUser:     getEnv("DB_USER", "grants_user"),
		DBPassword: getEnv("DB_PASSWORD", "grants_pass"),
		DBSSLMode:  getEnv("DB_SSL_MODE", "disable"),

		// RuVector
		RuVectorURL:    getEnv("RUVECTOR_URL", "http://localhost:8081"),
		RuVectorAPIKey: getEnv("RUVECTOR_API_KEY", ""),
		RuVectorModel:  getEnv("RUVECTOR_MODEL", "text-embedding-3-small"),

		// Auth
		JWTSecret: getEnv("JWT_SECRET", "development-secret-change-in-production"),

		// Features
		EnableProfiling: getEnv("ENABLE_PROFILING", "false") == "true",
		LogLevel:        getEnv("LOG_LEVEL", "info"),
	}
}

func main() {
	// Load configuration
	cfg := LoadConfig()

	// Setup logging
	setupLogging(cfg.LogLevel)

	log.Info().
		Str("host", cfg.ServerHost).
		Int("port", cfg.ServerPort).
		Msg("Starting Huron Grants Management API")

	// Create context for graceful shutdown
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// Initialize database connection
	dbPool, err := initDatabase(ctx, cfg)
	if err != nil {
		log.Fatal().Err(err).Msg("Failed to initialize database")
	}
	defer dbPool.Close()

	// Initialize pgvector extension
	if err := dbPool.InitializePgVector(ctx); err != nil {
		log.Warn().Err(err).Msg("Failed to initialize pgvector (may already exist)")
	}

	// Initialize RuVector client
	ruVectorClient := ruvector.NewClient(ruvector.Config{
		BaseURL:    cfg.RuVectorURL,
		APIKey:     cfg.RuVectorAPIKey,
		Model:      cfg.RuVectorModel,
		Timeout:    30 * time.Second,
		MaxRetries: 3,
	})

	// Initialize repositories
	proposalRepo := postgres.NewProposalRepository(dbPool)

	// Initialize embedding generator
	embeddingGenerator := ruvector.NewEmbeddingGenerator(ruVectorClient, 1000)

	// Initialize application services
	proposalService := appproposal.NewService(appproposal.ServiceConfig{
		Repo:           proposalRepo,
		EmbedGenerator: embeddingGenerator,
	})

	// Initialize handlers
	proposalHandler := handlers.NewProposalHandler(proposalService)

	// Create router
	routerCfg := httpapi.RouterConfig{
		TenantConfig: middleware.TenantConfig{
			JWTSecret:    []byte(cfg.JWTSecret),
			TenantHeader: "X-Tenant-ID",
			RequireAuth:  false, // Set to true in production
			BypassPaths:  []string{"/health", "/ready", "/metrics"},
		},
		AllowedOrigins:  []string{"*"},
		RateLimitReqs:   100,
		RateLimitWindow: time.Minute,
		EnableProfiling: cfg.EnableProfiling,
	}

	router := httpapi.NewRouter(routerCfg, httpapi.Handlers{
		Proposal: proposalHandler,
	})

	// Create HTTP server
	server := &http.Server{
		Addr:         fmt.Sprintf("%s:%d", cfg.ServerHost, cfg.ServerPort),
		Handler:      router,
		ReadTimeout:  15 * time.Second,
		WriteTimeout: 30 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	// Start server in goroutine
	go func() {
		log.Info().
			Str("addr", server.Addr).
			Msg("HTTP server starting")

		if err := server.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatal().Err(err).Msg("HTTP server error")
		}
	}()

	// Wait for interrupt signal
	quit := make(chan os.Signal, 1)
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	log.Info().Msg("Shutdown signal received, initiating graceful shutdown...")

	// Create shutdown context with timeout
	shutdownCtx, shutdownCancel := context.WithTimeout(context.Background(), 30*time.Second)
	defer shutdownCancel()

	// Shutdown HTTP server
	if err := server.Shutdown(shutdownCtx); err != nil {
		log.Error().Err(err).Msg("HTTP server shutdown error")
	}

	log.Info().Msg("Server shutdown complete")
}

// initDatabase initializes the database connection pool.
func initDatabase(ctx context.Context, cfg Config) (*postgres.Pool, error) {
	dbCfg := postgres.Config{
		Host:              cfg.DBHost,
		Port:              cfg.DBPort,
		Database:          cfg.DBName,
		Username:          cfg.DBUser,
		Password:          cfg.DBPassword,
		SSLMode:           cfg.DBSSLMode,
		MaxConns:          25,
		MinConns:          5,
		MaxConnLifetime:   time.Hour,
		MaxConnIdleTime:   30 * time.Minute,
		HealthCheckPeriod: time.Minute,
	}

	return postgres.NewPool(ctx, dbCfg)
}

// setupLogging configures the zerolog logger.
func setupLogging(level string) {
	// Set time format
	zerolog.TimeFieldFormat = zerolog.TimeFormatUnix

	// Parse log level
	logLevel, err := zerolog.ParseLevel(level)
	if err != nil {
		logLevel = zerolog.InfoLevel
	}
	zerolog.SetGlobalLevel(logLevel)

	// Configure output
	if os.Getenv("LOG_FORMAT") == "json" {
		log.Logger = zerolog.New(os.Stdout).With().Timestamp().Logger()
	} else {
		log.Logger = log.Output(zerolog.ConsoleWriter{
			Out:        os.Stdout,
			TimeFormat: time.RFC3339,
		})
	}

	log.Info().Str("level", level).Msg("Logging configured")
}

// getEnv gets an environment variable with a default value.
func getEnv(key, defaultValue string) string {
	if value := os.Getenv(key); value != "" {
		return value
	}
	return defaultValue
}

// getEnvInt gets an integer environment variable with a default value.
func getEnvInt(key string, defaultValue int) int {
	if value := os.Getenv(key); value != "" {
		if intValue, err := parseInt(value); err == nil {
			return intValue
		}
	}
	return defaultValue
}

// parseInt parses an integer string.
func parseInt(s string) (int, error) {
	var result int
	_, err := fmt.Sscanf(s, "%d", &result)
	return result, err
}
