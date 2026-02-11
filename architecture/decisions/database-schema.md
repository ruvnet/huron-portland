# Database Schema Design

## Overview

This document defines the PostgreSQL database schema for the HRS Grants Module, implementing the domain models defined in the DDD bounded contexts.

## Schema Conventions

### Naming
- Tables: lowercase, plural, snake_case (e.g., `proposals`, `budget_periods`)
- Columns: lowercase, snake_case (e.g., `created_at`, `sponsor_id`)
- Indexes: `idx_{table}_{columns}` (e.g., `idx_proposals_tenant_status`)
- Foreign keys: `fk_{table}_{referenced_table}` (e.g., `fk_proposals_sponsors`)
- Constraints: `chk_{table}_{description}` (e.g., `chk_proposals_dates`)

### Standard Columns
Every table includes:
```sql
-- Identity
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
tenant_id UUID NOT NULL REFERENCES tenants(id),

-- Audit
created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
created_by UUID REFERENCES persons(id),
updated_by UUID REFERENCES persons(id),
version INTEGER NOT NULL DEFAULT 1,

-- Soft delete
deleted_at TIMESTAMPTZ
```

### Row-Level Security
```sql
-- Enable RLS on all tenant-scoped tables
ALTER TABLE {table_name} ENABLE ROW LEVEL SECURITY;
ALTER TABLE {table_name} FORCE ROW LEVEL SECURITY;

-- Standard tenant isolation policy
CREATE POLICY tenant_isolation ON {table_name}
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## Core Tables

### Tenants

```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- UNIVERSITY, HOSPITAL, etc.
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- Settings
    settings JSONB NOT NULL DEFAULT '{}',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_tenants_code ON tenants(code);
CREATE INDEX idx_tenants_status ON tenants(status);
```

### Persons

```sql
CREATE TABLE persons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    external_id VARCHAR(100),

    -- Name
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    suffix VARCHAR(20),

    -- Contact
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),

    -- Institutional
    department_id UUID REFERENCES departments(id),
    title VARCHAR(200),
    position VARCHAR(200),

    -- Identifiers
    orcid VARCHAR(50),
    era_commons_id VARCHAR(50),

    -- Extended profile (for researchers)
    extended_profile JSONB,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES persons(id),
    updated_by UUID REFERENCES persons(id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_persons_tenant_email UNIQUE (tenant_id, email)
);

CREATE INDEX idx_persons_tenant ON persons(tenant_id);
CREATE INDEX idx_persons_department ON persons(tenant_id, department_id);
CREATE INDEX idx_persons_email ON persons(tenant_id, email);
CREATE INDEX idx_persons_external ON persons(tenant_id, external_id);
```

### Organizations

```sql
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    external_id VARCHAR(100),

    -- Identifiers
    duns VARCHAR(9),
    ein VARCHAR(10),
    uei VARCHAR(12),

    -- Details
    legal_name VARCHAR(300) NOT NULL,
    dba VARCHAR(300),
    type VARCHAR(50) NOT NULL,

    -- Address
    street1 VARCHAR(200),
    street2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(2),

    -- Sponsor info
    is_sponsor BOOLEAN NOT NULL DEFAULT FALSE,
    sponsor_code VARCHAR(20),

    -- Signatory
    authorized_signatory_id UUID REFERENCES persons(id),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ
);

CREATE INDEX idx_organizations_tenant ON organizations(tenant_id);
CREATE INDEX idx_organizations_sponsor ON organizations(tenant_id, is_sponsor) WHERE is_sponsor = TRUE;
CREATE INDEX idx_organizations_duns ON organizations(duns) WHERE duns IS NOT NULL;
```

### Departments

```sql
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),

    parent_id UUID REFERENCES departments(id),
    organization_id UUID REFERENCES organizations(id),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_departments_tenant_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_departments_tenant ON departments(tenant_id);
CREATE INDEX idx_departments_parent ON departments(parent_id);
```

---

## Proposal Tables

### Proposals

```sql
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Core attributes
    title VARCHAR(200) NOT NULL,
    abstract TEXT,
    state VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    type VARCHAR(20) NOT NULL DEFAULT 'NEW',

    -- Relationships
    principal_investigator_id UUID NOT NULL REFERENCES persons(id),
    sponsor_id UUID NOT NULL REFERENCES organizations(id),
    opportunity_id UUID REFERENCES funding_opportunities(id),
    department_id UUID NOT NULL REFERENCES departments(id),
    parent_proposal_id UUID REFERENCES proposals(id),

    -- Timeline
    project_start_date DATE NOT NULL,
    project_end_date DATE NOT NULL,
    submission_deadline TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES persons(id),
    updated_by UUID NOT NULL REFERENCES persons(id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT chk_proposals_dates CHECK (project_end_date > project_start_date)
);

CREATE INDEX idx_proposals_tenant_state ON proposals(tenant_id, state);
CREATE INDEX idx_proposals_tenant_pi ON proposals(tenant_id, principal_investigator_id);
CREATE INDEX idx_proposals_tenant_dept ON proposals(tenant_id, department_id);
CREATE INDEX idx_proposals_tenant_sponsor ON proposals(tenant_id, sponsor_id);
CREATE INDEX idx_proposals_created ON proposals(tenant_id, created_at DESC);

ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON proposals
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Proposal Team Members

```sql
CREATE TABLE proposal_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    person_id UUID NOT NULL REFERENCES persons(id),

    role VARCHAR(50) NOT NULL,
    effort_percent DECIMAL(5,2) CHECK (effort_percent >= 0 AND effort_percent <= 100),
    is_pi_surrogate BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by UUID NOT NULL REFERENCES persons(id),

    CONSTRAINT uq_team_proposal_person UNIQUE (proposal_id, person_id)
);

CREATE INDEX idx_team_proposal ON proposal_team_members(proposal_id);
CREATE INDEX idx_team_person ON proposal_team_members(person_id);

ALTER TABLE proposal_team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON proposal_team_members
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### State Transitions

```sql
CREATE TABLE proposal_state_transitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),

    from_state VARCHAR(50) NOT NULL,
    to_state VARCHAR(50) NOT NULL,
    action VARCHAR(50) NOT NULL,

    actor_id UUID NOT NULL REFERENCES persons(id),
    actor_role VARCHAR(50) NOT NULL,
    reason TEXT,
    metadata JSONB,

    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_transitions_proposal ON proposal_state_transitions(proposal_id);
CREATE INDEX idx_transitions_timestamp ON proposal_state_transitions(proposal_id, timestamp DESC);

ALTER TABLE proposal_state_transitions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON proposal_state_transitions
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## Budget Tables

### Budgets

```sql
CREATE TABLE budgets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),

    -- F&A Configuration
    fa_rate DECIMAL(5,4),
    fa_rate_type VARCHAR(20),
    fa_base VARCHAR(50),
    fa_agreement_id VARCHAR(100),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    is_locked BOOLEAN NOT NULL DEFAULT FALSE,

    -- Totals (cents)
    total_direct_costs BIGINT NOT NULL DEFAULT 0,
    total_indirect_costs BIGINT NOT NULL DEFAULT 0,
    total_cost_sharing BIGINT NOT NULL DEFAULT 0,
    total_project_cost BIGINT NOT NULL DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID REFERENCES persons(id),
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT uq_budgets_proposal UNIQUE (proposal_id)
);

CREATE INDEX idx_budgets_proposal ON budgets(proposal_id);

ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON budgets
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Budget Periods

```sql
CREATE TABLE budget_periods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    budget_id UUID NOT NULL REFERENCES budgets(id) ON DELETE CASCADE,

    period_number INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,

    -- Totals (cents)
    direct_costs_subtotal BIGINT NOT NULL DEFAULT 0,
    indirect_costs_subtotal BIGINT NOT NULL DEFAULT 0,
    cost_sharing_subtotal BIGINT NOT NULL DEFAULT 0,
    period_total BIGINT NOT NULL DEFAULT 0,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT uq_budget_period_num UNIQUE (budget_id, period_number),
    CONSTRAINT chk_period_dates CHECK (end_date > start_date)
);

CREATE INDEX idx_periods_budget ON budget_periods(budget_id);

ALTER TABLE budget_periods ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON budget_periods
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Personnel Costs

```sql
CREATE TABLE budget_personnel_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    budget_period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
    person_id UUID REFERENCES persons(id),

    role VARCHAR(50) NOT NULL,
    name VARCHAR(200) NOT NULL, -- Denormalized

    -- Amounts (cents)
    base_salary BIGINT NOT NULL,
    effort_percent DECIMAL(5,2) NOT NULL,
    requested_salary BIGINT NOT NULL,
    fringe_benefits BIGINT NOT NULL,
    fringe_rate DECIMAL(5,4) NOT NULL,
    total_cost BIGINT NOT NULL,
    cost_sharing BIGINT NOT NULL DEFAULT 0,

    justification TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_personnel_period ON budget_personnel_costs(budget_period_id);

ALTER TABLE budget_personnel_costs ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON budget_personnel_costs
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Other Cost Categories

```sql
-- Equipment costs
CREATE TABLE budget_equipment_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    budget_period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,

    description VARCHAR(500) NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_cost BIGINT NOT NULL,
    total_cost BIGINT NOT NULL,
    justification TEXT
);

-- Travel costs
CREATE TABLE budget_travel_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    budget_period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,

    trip_type VARCHAR(50) NOT NULL, -- DOMESTIC, FOREIGN
    purpose VARCHAR(500) NOT NULL,
    destination VARCHAR(200),
    travelers INTEGER NOT NULL DEFAULT 1,
    trips INTEGER NOT NULL DEFAULT 1,
    cost_per_trip BIGINT NOT NULL,
    total_cost BIGINT NOT NULL,
    justification TEXT
);

-- Similar tables for supplies, contractual, other costs...
```

---

## Award Tables

### Awards

```sql
CREATE TABLE awards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),

    -- Sponsor info
    sponsor_award_number VARCHAR(100) NOT NULL,
    sponsor_id UUID NOT NULL REFERENCES organizations(id),
    prime_award_id UUID REFERENCES awards(id),

    -- Details
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',

    -- Timeline
    project_start_date DATE NOT NULL,
    project_end_date DATE NOT NULL,
    budget_start_date DATE NOT NULL,
    budget_end_date DATE NOT NULL,

    -- Financial (cents)
    total_award_amount BIGINT NOT NULL,
    obligated_amount BIGINT NOT NULL DEFAULT 0,
    expended_amount BIGINT NOT NULL DEFAULT 0,
    available_balance BIGINT NOT NULL DEFAULT 0,

    -- Team
    principal_investigator_id UUID NOT NULL REFERENCES persons(id),

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES persons(id),
    updated_by UUID REFERENCES persons(id),
    version INTEGER NOT NULL DEFAULT 1,
    deleted_at TIMESTAMPTZ,

    CONSTRAINT uq_awards_sponsor_num UNIQUE (tenant_id, sponsor_award_number)
);

CREATE INDEX idx_awards_tenant_status ON awards(tenant_id, status);
CREATE INDEX idx_awards_tenant_pi ON awards(tenant_id, principal_investigator_id);
CREATE INDEX idx_awards_proposal ON awards(proposal_id);

ALTER TABLE awards ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON awards
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

### Award Modifications

```sql
CREATE TABLE award_modifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    award_id UUID NOT NULL REFERENCES awards(id),

    modification_number VARCHAR(50) NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    effective_date DATE NOT NULL,
    description TEXT,

    -- Changes (stored as JSON for flexibility)
    changes JSONB NOT NULL DEFAULT '{}',

    -- Workflow
    requested_by UUID NOT NULL REFERENCES persons(id),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_by UUID REFERENCES persons(id),
    approved_at TIMESTAMPTZ,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT uq_modifications_award_num UNIQUE (award_id, modification_number)
);

CREATE INDEX idx_modifications_award ON award_modifications(award_id);

ALTER TABLE award_modifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON award_modifications
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## SF424 Tables

### Form Packages

```sql
CREATE TABLE sf424_form_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    validation_status VARCHAR(20) NOT NULL DEFAULT 'NOT_VALIDATED',
    validation_errors JSONB,

    -- Generated XML
    xml_content BYTEA,
    xml_hash VARCHAR(64),

    -- Grants.gov tracking
    tracking_number VARCHAR(100),
    grants_gov_status VARCHAR(50),
    agency_tracking_number VARCHAR(100),
    received_at TIMESTAMPTZ,
    status_history JSONB DEFAULT '[]',

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_forms_proposal ON sf424_form_packages(proposal_id);
CREATE INDEX idx_forms_tracking ON sf424_form_packages(tracking_number) WHERE tracking_number IS NOT NULL;

ALTER TABLE sf424_form_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sf424_form_packages
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## Compliance Tables

### Compliance Items

```sql
CREATE TABLE compliance_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),
    award_id UUID REFERENCES awards(id),

    -- Type and protocol
    type VARCHAR(20) NOT NULL,
    protocol_number VARCHAR(100) NOT NULL,
    external_system_id VARCHAR(100),
    title VARCHAR(500),
    description TEXT,

    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    expiration_date DATE,

    -- Approval
    approved_by UUID REFERENCES persons(id),
    approved_at TIMESTAMPTZ,
    approval_notes TEXT,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    version INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT uq_compliance_proposal_type_protocol
        UNIQUE (proposal_id, type, protocol_number)
);

CREATE INDEX idx_compliance_proposal ON compliance_items(proposal_id);
CREATE INDEX idx_compliance_award ON compliance_items(award_id) WHERE award_id IS NOT NULL;
CREATE INDEX idx_compliance_expiring ON compliance_items(expiration_date)
    WHERE status = 'APPROVED' AND expiration_date IS NOT NULL;

ALTER TABLE compliance_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON compliance_items
    USING (tenant_id = current_setting('app.current_tenant_id')::uuid);
```

---

## Event Outbox

```sql
CREATE TABLE event_outbox (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    event_type VARCHAR(100) NOT NULL,
    aggregate_type VARCHAR(50) NOT NULL,
    aggregate_id UUID NOT NULL,
    tenant_id UUID NOT NULL,

    payload JSONB NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    processed_at TIMESTAMPTZ,

    -- For ordering and idempotency
    sequence_number BIGSERIAL,

    CONSTRAINT uq_outbox_sequence UNIQUE (sequence_number)
);

CREATE INDEX idx_outbox_pending ON event_outbox(created_at)
    WHERE processed_at IS NULL;
CREATE INDEX idx_outbox_aggregate ON event_outbox(aggregate_type, aggregate_id);
```

---

## Audit Log

```sql
CREATE TABLE audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,

    -- What changed
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL, -- CREATE, UPDATE, DELETE

    -- Changes
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Who/when
    actor_id UUID,
    actor_type VARCHAR(20) NOT NULL, -- USER, SYSTEM, INTEGRATION
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Context
    request_id VARCHAR(100),
    ip_address INET,
    user_agent TEXT
);

CREATE INDEX idx_audit_entity ON audit_log(entity_type, entity_id);
CREATE INDEX idx_audit_tenant_time ON audit_log(tenant_id, timestamp DESC);
CREATE INDEX idx_audit_actor ON audit_log(actor_id) WHERE actor_id IS NOT NULL;

-- Partitioned by month for performance
CREATE TABLE audit_log_partitioned (
    LIKE audit_log INCLUDING ALL
) PARTITION BY RANGE (timestamp);

-- Create partitions for each month
CREATE TABLE audit_log_2026_01 PARTITION OF audit_log_partitioned
    FOR VALUES FROM ('2026-01-01') TO ('2026-02-01');
```

---

## Functions and Triggers

### Updated At Trigger

```sql
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables
CREATE TRIGGER trg_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

-- Repeat for other tables...
```

### Audit Trigger

```sql
CREATE OR REPLACE FUNCTION audit_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO audit_log (tenant_id, entity_type, entity_id, action, new_values, actor_id, actor_type)
        VALUES (NEW.tenant_id, TG_TABLE_NAME, NEW.id, 'CREATE', to_jsonb(NEW),
                current_setting('app.current_user_id', true)::uuid, 'USER');
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO audit_log (tenant_id, entity_type, entity_id, action, old_values, new_values, actor_id, actor_type)
        VALUES (NEW.tenant_id, TG_TABLE_NAME, NEW.id, 'UPDATE', to_jsonb(OLD), to_jsonb(NEW),
                current_setting('app.current_user_id', true)::uuid, 'USER');
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO audit_log (tenant_id, entity_type, entity_id, action, old_values, actor_id, actor_type)
        VALUES (OLD.tenant_id, TG_TABLE_NAME, OLD.id, 'DELETE', to_jsonb(OLD),
                current_setting('app.current_user_id', true)::uuid, 'USER');
    END IF;
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Apply to audited tables
CREATE TRIGGER trg_proposals_audit
    AFTER INSERT OR UPDATE OR DELETE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION audit_changes();
```

---

## Migration Order

1. `tenants` (no dependencies)
2. `persons` (depends on tenants)
3. `departments` (depends on tenants, persons)
4. `organizations` (depends on tenants, persons)
5. `funding_opportunities` (depends on tenants, organizations)
6. `proposals` (depends on all above)
7. `proposal_team_members` (depends on proposals)
8. `proposal_state_transitions` (depends on proposals)
9. `budgets` (depends on proposals)
10. `budget_periods` (depends on budgets)
11. `budget_*_costs` (depends on budget_periods)
12. `awards` (depends on proposals)
13. `award_modifications` (depends on awards)
14. `sf424_form_packages` (depends on proposals)
15. `compliance_items` (depends on proposals, awards)
16. `event_outbox` (no dependencies)
17. `audit_log` (no dependencies)
