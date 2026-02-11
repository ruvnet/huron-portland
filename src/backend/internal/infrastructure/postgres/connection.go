// Package postgres provides PostgreSQL database infrastructure.
package postgres

import (
	"context"
	"fmt"
	"time"

	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgxpool"
	"github.com/rs/zerolog/log"
)

// Config contains database connection configuration.
type Config struct {
	Host            string        `json:"host"`
	Port            int           `json:"port"`
	Database        string        `json:"database"`
	Username        string        `json:"username"`
	Password        string        `json:"password"`
	SSLMode         string        `json:"ssl_mode"`
	MaxConns        int32         `json:"max_conns"`
	MinConns        int32         `json:"min_conns"`
	MaxConnLifetime time.Duration `json:"max_conn_lifetime"`
	MaxConnIdleTime time.Duration `json:"max_conn_idle_time"`
	HealthCheckPeriod time.Duration `json:"health_check_period"`
}

// DefaultConfig returns default database configuration.
func DefaultConfig() Config {
	return Config{
		Host:              "localhost",
		Port:              5432,
		Database:          "grants",
		Username:          "grants_user",
		Password:          "grants_pass",
		SSLMode:           "prefer",
		MaxConns:          25,
		MinConns:          5,
		MaxConnLifetime:   time.Hour,
		MaxConnIdleTime:   30 * time.Minute,
		HealthCheckPeriod: time.Minute,
	}
}

// ConnectionString returns the PostgreSQL connection string.
func (c Config) ConnectionString() string {
	return fmt.Sprintf(
		"host=%s port=%d dbname=%s user=%s password=%s sslmode=%s",
		c.Host, c.Port, c.Database, c.Username, c.Password, c.SSLMode,
	)
}

// Pool wraps a pgxpool.Pool with additional functionality.
type Pool struct {
	*pgxpool.Pool
	config Config
}

// NewPool creates a new database connection pool.
func NewPool(ctx context.Context, cfg Config) (*Pool, error) {
	poolConfig, err := pgxpool.ParseConfig(cfg.ConnectionString())
	if err != nil {
		return nil, fmt.Errorf("failed to parse pool config: %w", err)
	}

	// Configure pool settings
	poolConfig.MaxConns = cfg.MaxConns
	poolConfig.MinConns = cfg.MinConns
	poolConfig.MaxConnLifetime = cfg.MaxConnLifetime
	poolConfig.MaxConnIdleTime = cfg.MaxConnIdleTime
	poolConfig.HealthCheckPeriod = cfg.HealthCheckPeriod

	// Configure connection settings
	poolConfig.ConnConfig.DefaultQueryExecMode = pgx.QueryExecModeSimpleProtocol

	// Add custom type registrations for pgvector
	poolConfig.AfterConnect = func(ctx context.Context, conn *pgx.Conn) error {
		// Register pgvector types
		_, err := conn.Exec(ctx, "SELECT 1") // Warm up connection
		return err
	}

	// Create the pool
	pool, err := pgxpool.NewWithConfig(ctx, poolConfig)
	if err != nil {
		return nil, fmt.Errorf("failed to create pool: %w", err)
	}

	// Verify connection
	if err := pool.Ping(ctx); err != nil {
		pool.Close()
		return nil, fmt.Errorf("failed to ping database: %w", err)
	}

	log.Info().
		Str("host", cfg.Host).
		Int("port", cfg.Port).
		Str("database", cfg.Database).
		Int32("max_conns", cfg.MaxConns).
		Msg("Database connection pool established")

	return &Pool{Pool: pool, config: cfg}, nil
}

// Config returns the pool configuration.
func (p *Pool) Config() Config {
	return p.config
}

// WithTx executes a function within a transaction.
func (p *Pool) WithTx(ctx context.Context, fn func(tx pgx.Tx) error) error {
	tx, err := p.Begin(ctx)
	if err != nil {
		return fmt.Errorf("failed to begin transaction: %w", err)
	}

	defer func() {
		if r := recover(); r != nil {
			_ = tx.Rollback(ctx)
			panic(r)
		}
	}()

	if err := fn(tx); err != nil {
		if rbErr := tx.Rollback(ctx); rbErr != nil {
			return fmt.Errorf("tx failed: %w, rollback failed: %v", err, rbErr)
		}
		return err
	}

	if err := tx.Commit(ctx); err != nil {
		return fmt.Errorf("failed to commit transaction: %w", err)
	}

	return nil
}

// SetTenantContext sets the current tenant in the session for RLS.
func (p *Pool) SetTenantContext(ctx context.Context, conn *pgxpool.Conn, tenantID string) error {
	_, err := conn.Exec(ctx, "SET app.current_tenant = $1", tenantID)
	return err
}

// AcquireWithTenant acquires a connection and sets the tenant context.
func (p *Pool) AcquireWithTenant(ctx context.Context, tenantID string) (*pgxpool.Conn, error) {
	conn, err := p.Acquire(ctx)
	if err != nil {
		return nil, err
	}

	if err := p.SetTenantContext(ctx, conn, tenantID); err != nil {
		conn.Release()
		return nil, fmt.Errorf("failed to set tenant context: %w", err)
	}

	return conn, nil
}

// HealthCheck performs a health check on the database.
func (p *Pool) HealthCheck(ctx context.Context) error {
	var result int
	err := p.QueryRow(ctx, "SELECT 1").Scan(&result)
	if err != nil {
		return fmt.Errorf("health check failed: %w", err)
	}
	return nil
}

// Stats returns pool statistics.
func (p *Pool) Stats() *PoolStats {
	s := p.Stat()
	return &PoolStats{
		AcquireCount:         s.AcquireCount(),
		AcquireDuration:      s.AcquireDuration(),
		AcquiredConns:        s.AcquiredConns(),
		CanceledAcquireCount: s.CanceledAcquireCount(),
		ConstructingConns:    s.ConstructingConns(),
		EmptyAcquireCount:    s.EmptyAcquireCount(),
		IdleConns:            s.IdleConns(),
		MaxConns:             s.MaxConns(),
		TotalConns:           s.TotalConns(),
		NewConnsCount:        s.NewConnsCount(),
		MaxLifetimeDestroy:   s.MaxLifetimeDestroyCount(),
		MaxIdleDestroy:       s.MaxIdleDestroyCount(),
	}
}

// PoolStats contains pool statistics.
type PoolStats struct {
	AcquireCount         int64         `json:"acquire_count"`
	AcquireDuration      time.Duration `json:"acquire_duration"`
	AcquiredConns        int32         `json:"acquired_conns"`
	CanceledAcquireCount int64         `json:"canceled_acquire_count"`
	ConstructingConns    int32         `json:"constructing_conns"`
	EmptyAcquireCount    int64         `json:"empty_acquire_count"`
	IdleConns            int32         `json:"idle_conns"`
	MaxConns             int32         `json:"max_conns"`
	TotalConns           int32         `json:"total_conns"`
	NewConnsCount        int64         `json:"new_conns_count"`
	MaxLifetimeDestroy   int64         `json:"max_lifetime_destroy"`
	MaxIdleDestroy       int64         `json:"max_idle_destroy"`
}

// Close closes the pool.
func (p *Pool) Close() {
	log.Info().Msg("Closing database connection pool")
	p.Pool.Close()
}

// InitializePgVector ensures pgvector extension is installed.
func (p *Pool) InitializePgVector(ctx context.Context) error {
	_, err := p.Exec(ctx, "CREATE EXTENSION IF NOT EXISTS vector")
	if err != nil {
		return fmt.Errorf("failed to create vector extension: %w", err)
	}
	log.Info().Msg("pgvector extension initialized")
	return nil
}
