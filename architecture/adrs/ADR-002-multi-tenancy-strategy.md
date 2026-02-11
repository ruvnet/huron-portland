# ADR-002: Multi-Tenancy with Row-Level Security

## Status
Accepted

## Date
2026-01-25

## Context

The HRS Grants Module must support:
- 5000+ SaaS tenants
- Complete data isolation between tenants
- 500 concurrent users per tenant at peak
- Compliance with FedRamp and SOC2 data isolation requirements
- Efficient resource utilization

## Decision

We will implement **Shared Database with Row-Level Security (RLS)** using PostgreSQL's native RLS capabilities.

### Multi-Tenancy Model

```
┌─────────────────────────────────────────────────────────────┐
│                      APPLICATION                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Tenant Context Middleware                 │   │
│  │     (Extracts tenant_id from JWT, sets context)     │   │
│  └─────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────┤
│                      DATABASE                               │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Row-Level Security Policies             │   │
│  │      (Automatic filtering by current_tenant_id)     │   │
│  └─────────────────────────────────────────────────────┘   │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                   Shared Tables                      │   │
│  │  proposals | budgets | awards | compliance | ...    │   │
│  │         (All rows include tenant_id column)         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### Implementation Details

#### 1. Tenant ID Column Convention
Every tenant-scoped table includes:
```sql
tenant_id UUID NOT NULL REFERENCES tenants(id),
```

#### 2. PostgreSQL RLS Policies
```sql
-- Enable RLS on table
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation
CREATE POLICY tenant_isolation_policy ON proposals
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);

-- Force RLS for all users except superuser
ALTER TABLE proposals FORCE ROW LEVEL SECURITY;
```

#### 3. Tenant Context Setting (Golang)
```go
// Middleware sets tenant context
func TenantContextMiddleware(next http.Handler) http.Handler {
    return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
        tenantID := extractTenantFromJWT(r)
        ctx := context.WithValue(r.Context(), TenantIDKey, tenantID)
        next.ServeHTTP(w, r.WithContext(ctx))
    })
}

// Repository sets PostgreSQL session variable
func (r *ProposalRepository) setTenantContext(ctx context.Context, tx *sql.Tx) error {
    tenantID := ctx.Value(TenantIDKey).(uuid.UUID)
    _, err := tx.ExecContext(ctx,
        "SET LOCAL app.current_tenant_id = $1",
        tenantID.String())
    return err
}
```

#### 4. Cross-Tenant Query Prevention
```go
// All repository methods MUST use tenant-scoped connections
type TenantScopedDB struct {
    db       *sql.DB
    tenantID uuid.UUID
}

func (t *TenantScopedDB) Query(ctx context.Context, query string, args ...interface{}) (*sql.Rows, error) {
    // Automatically sets tenant context before every query
    conn, err := t.db.Conn(ctx)
    if err != nil {
        return nil, err
    }
    defer conn.Close()

    _, err = conn.ExecContext(ctx, "SET LOCAL app.current_tenant_id = $1", t.tenantID)
    if err != nil {
        return nil, err
    }

    return conn.QueryContext(ctx, query, args...)
}
```

### Tenant Hierarchy

```
┌──────────────────────────────────────────────────────────┐
│                     TENANT (Institution)                  │
│  ┌────────────────────────────────────────────────────┐  │
│  │                    DEPARTMENTS                      │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐         │  │
│  │  │  Dept A  │  │  Dept B  │  │  Dept C  │         │  │
│  │  └──────────┘  └──────────┘  └──────────┘         │  │
│  └────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────┐  │
│  │                      USERS                          │  │
│  │  (PI, PC, Grants Admin, Grants Specialist, etc.)   │  │
│  └────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────┘
```

## Rationale

1. **Cost Efficiency**: Single database reduces infrastructure costs
2. **Simplicity**: Standard PostgreSQL features, no custom sharding
3. **Compliance**: RLS provides defense-in-depth for data isolation
4. **Scalability**: PostgreSQL handles 5000+ tenants efficiently with proper indexing
5. **Audit Trail**: All tenant access is trackable

## Consequences

### Positive
- Guaranteed data isolation at database level
- No application-level tenant filtering bugs possible
- Efficient resource sharing
- Simplified backup and maintenance

### Negative
- Single database is a potential bottleneck (mitigated by read replicas)
- "Noisy neighbor" potential (mitigated by connection pooling limits)
- Schema migrations affect all tenants

## Performance Considerations

1. **Indexing Strategy**: Composite indexes starting with tenant_id
   ```sql
   CREATE INDEX idx_proposals_tenant_status ON proposals(tenant_id, status);
   CREATE INDEX idx_proposals_tenant_pi ON proposals(tenant_id, principal_investigator_id);
   ```

2. **Connection Pooling**: PgBouncer with per-tenant limits
   ```
   max_client_conn = 10000
   default_pool_size = 20
   max_pool_size = 100
   ```

3. **Query Optimization**: Partition large tables by tenant_id for very large tenants

## Security Audit Points

- [ ] RLS policies verified on all tenant-scoped tables
- [ ] Tenant context extraction from JWT validated
- [ ] Cross-tenant access attempts logged and alerted
- [ ] Superuser access restricted and audited

## References
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- FR-001: Multi-tenant Architecture with RLS
- HRS Grants Module Requirements Specifications v1.1
