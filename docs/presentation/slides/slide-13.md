# Slide 13: Database & Auth: PostgreSQL + RLS
**Duration**: 4 minutes | **ADR**: PRES-013

---

## Database Architecture

```
┌─────────────────────────────────────────────────────┐
│              POSTGRESQL + PGVECTOR                   │
├─────────────────────────────────────────────────────┤
│                                                     │
│  ┌─────────────────────────────────────────────┐     │
│  │  Row-Level Security (RLS)                    │     │
│  │  Every query auto-filtered by tenant_id      │     │
│  └─────────────────────────────────────────────┘     │
│                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐   │
│  │  proposals   │ │   budgets    │ │   awards   │   │
│  │  + embedding │ │              │ │            │   │
│  │  (vector)    │ │              │ │            │   │
│  └──────────────┘ └──────────────┘ └────────────┘   │
│                                                     │
│  ┌──────────────┐ ┌──────────────┐ ┌────────────┐   │
│  │  users       │ │   tenants    │ │  audit_log │   │
│  └──────────────┘ └──────────────┘ └────────────┘   │
│                                                     │
│  Extensions: pgvector, pgcrypto, uuid-ossp          │
│                                                     │
└─────────────────────────────────────────────────────┘
```

---

## Row-Level Security (RLS)

```sql
-- 1. Enable RLS on all tables
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

-- 2. Create policy: users see only their tenant's data
CREATE POLICY tenant_isolation ON proposals
    USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- 3. Set tenant context on each request (middleware)
SET LOCAL app.tenant_id = 'tenant-uuid-here';

-- 4. Now ALL queries are auto-filtered
SELECT * FROM proposals;
-- Silently becomes:
-- SELECT * FROM proposals WHERE tenant_id = 'tenant-uuid-here';
```

---

## How RLS Works with the App

```
┌──────────┐     ┌────────────────┐     ┌──────────────┐
│  Request  │────→│  Auth          │────→│  RLS          │
│  with JWT │     │  Middleware     │     │  Middleware    │
│           │     │                │     │               │
│  Header:  │     │  Validates     │     │  SET LOCAL     │
│  Bearer   │     │  JWT token     │     │  app.tenant_id │
│  eyJ...   │     │  Extracts      │     │  = tenant-uuid │
│           │     │  tenant_id     │     │               │
└──────────┘     └────────────────┘     └──────┬───────┘
                                               │
                                        ┌──────▼───────┐
                                        │  PostgreSQL   │
                                        │  enforces     │
                                        │  RLS policy   │
                                        │  on EVERY     │
                                        │  query        │
                                        └──────────────┘
```

---

## JWT Authentication + RBAC

```
Token Structure:
┌────────────────────────────────────────┐
│  Header:  { alg: RS256, typ: JWT }     │
│  Payload: {                            │
│    sub: "user-uuid",                   │
│    tenant_id: "tenant-uuid",           │
│    roles: ["grants_admin"],            │
│    departments: ["research"],          │
│    exp: 1704067200                     │
│  }                                     │
│  Signature: RS256(header.payload)      │
└────────────────────────────────────────┘

Role Hierarchy:
┌─────────────────────────────────────┐
│  system_admin                       │
│    └── tenant_admin                 │
│          ├── grants_admin           │
│          ├── financial_officer      │
│          ├── compliance_officer     │
│          └── department_head        │
│                └── researcher       │
│                      └── viewer     │
└─────────────────────────────────────┘
```

---

## Database Migration Pattern

```sql
-- init-scripts/001-schema.sql

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- Tenants table (foundation)
CREATE TABLE tenants (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    settings    JSONB DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals with vector embedding
CREATE TABLE proposals (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id   UUID NOT NULL REFERENCES tenants(id),
    title       TEXT NOT NULL,
    status      TEXT NOT NULL DEFAULT 'draft',
    embedding   vector(384),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- HNSW index for fast vector search
CREATE INDEX proposals_embedding_idx ON proposals
    USING hnsw (embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 64);

-- Enable RLS
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_iso ON proposals
    USING (tenant_id = current_setting('app.tenant_id')::uuid);
```

---

### [ILLUSTRATION: Database security diagram showing a multi-tenant database with three colored tenant zones (red, blue, green). Each zone is isolated by RLS barriers (shown as security shields). A JWT token is being decoded at the top, with an arrow showing the tenant_id flowing down to the RLS policy. Padlock icons on each table. Professional security-focused design.]
