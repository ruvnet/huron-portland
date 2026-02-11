-- Huron Grants Management System - Initial Schema
-- Multi-tenant with Row-Level Security and pgvector support

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Set up application configuration for RLS
CREATE OR REPLACE FUNCTION set_current_tenant(tenant_id UUID) RETURNS VOID AS $$
BEGIN
    PERFORM set_config('app.current_tenant', tenant_id::TEXT, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get current tenant
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
BEGIN
    RETURN COALESCE(
        NULLIF(current_setting('app.current_tenant', TRUE), '')::UUID,
        '00000000-0000-0000-0000-000000000000'::UUID
    );
EXCEPTION
    WHEN OTHERS THEN
        RETURN '00000000-0000-0000-0000-000000000000'::UUID;
END;
$$ LANGUAGE plpgsql STABLE;

-- Tenants table
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users/Persons table
CREATE TABLE IF NOT EXISTS persons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(255),
    institution VARCHAR(255),
    phone VARCHAR(50),
    orcid VARCHAR(50),
    roles TEXT[] DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, email)
);

-- Sponsors table
CREATE TABLE IF NOT EXISTS sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(50),
    type VARCHAR(50) CHECK (type IN ('federal', 'state', 'foundation', 'industry', 'nonprofit', 'internal', 'other')),
    website VARCHAR(500),
    contact_info JSONB DEFAULT '{}',
    fa_rate_agreement JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(tenant_id, name)
);

-- Funding Opportunities table
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    sponsor_id UUID NOT NULL REFERENCES sponsors(id),
    title VARCHAR(500) NOT NULL,
    number VARCHAR(100),
    description TEXT,
    deadline TIMESTAMPTZ,
    max_award BIGINT,
    url VARCHAR(1000),
    requirements JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Proposals table (main entity)
CREATE TABLE IF NOT EXISTS proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Core Information
    title VARCHAR(500) NOT NULL,
    short_title VARCHAR(100),
    abstract TEXT,
    state VARCHAR(50) NOT NULL DEFAULT 'DRAFT',
    proposal_number VARCHAR(50) NOT NULL,
    external_id VARCHAR(100),

    -- Personnel
    principal_investigator_id UUID NOT NULL REFERENCES persons(id),
    co_investigators JSONB DEFAULT '[]',
    key_personnel JSONB DEFAULT '[]',

    -- Sponsor Information
    sponsor_id UUID NOT NULL REFERENCES sponsors(id),
    opportunity_id UUID REFERENCES opportunities(id),
    sponsor_deadline TIMESTAMPTZ,
    internal_deadline TIMESTAMPTZ,

    -- Project Details
    project_start_date DATE NOT NULL,
    project_end_date DATE NOT NULL,
    department VARCHAR(255) NOT NULL,
    research_area VARCHAR(255),
    keywords JSONB DEFAULT '[]',

    -- Budget Reference
    budget_id UUID,

    -- Compliance
    irb_required BOOLEAN DEFAULT FALSE,
    iacuc_required BOOLEAN DEFAULT FALSE,
    ibc_required BOOLEAN DEFAULT FALSE,
    export_control BOOLEAN DEFAULT FALSE,
    conflict_of_interest BOOLEAN DEFAULT FALSE,

    -- Semantic Search (pgvector)
    embedding vector(1536),

    -- State History
    state_history JSONB DEFAULT '[]',

    -- Attachments
    attachments JSONB DEFAULT '[]',

    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES persons(id),
    updated_by UUID NOT NULL REFERENCES persons(id),
    deleted_at TIMESTAMPTZ,
    version INTEGER DEFAULT 1,

    UNIQUE(tenant_id, proposal_number),
    CONSTRAINT valid_project_dates CHECK (project_end_date > project_start_date),
    CONSTRAINT valid_state CHECK (state IN (
        'DRAFT', 'IN_PROGRESS', 'INTERNAL_REVIEW', 'DEPT_REVIEW', 'OSP_REVIEW',
        'COMPLIANCE_REVIEW', 'BUDGET_REVIEW', 'PENDING_APPROVAL', 'APPROVED',
        'REJECTED', 'REVISIONS_REQUESTED', 'READY_TO_SUBMIT', 'SUBMITTED',
        'UNDER_SPONSOR_REVIEW', 'AWARDED', 'NEGOTIATION', 'DECLINED', 'NOT_FUNDED',
        'ACTIVE', 'CLOSEOUT', 'CLOSED', 'WITHDRAWN'
    ))
);

-- Budgets table
CREATE TABLE IF NOT EXISTS budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    proposal_id UUID NOT NULL REFERENCES proposals(id),

    -- Budget Periods (as JSONB array)
    periods JSONB DEFAULT '[]',

    -- F&A Rate Configuration
    fa_rate JSONB NOT NULL DEFAULT '{
        "rate_type": "MTDC",
        "on_campus_rate": 0.55,
        "off_campus_rate": 0.26,
        "is_on_campus": true,
        "equipment_cap": 0,
        "subaward_cap": 25000,
        "excluded_items": ["equipment", "tuition", "patient_care", "subaward_excess"]
    }',

    currency VARCHAR(3) DEFAULT 'USD',
    status VARCHAR(50) DEFAULT 'DRAFT' CHECK (status IN (
        'DRAFT', 'SUBMITTED', 'IN_REVIEW', 'APPROVED', 'REJECTED', 'REVISION_REQUESTED'
    )),

    submitted_at TIMESTAMPTZ,
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES persons(id),
    notes TEXT,

    -- Audit Fields
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES persons(id),
    updated_by UUID NOT NULL REFERENCES persons(id),
    version INTEGER DEFAULT 1
);

-- Add foreign key from proposals to budgets
ALTER TABLE proposals ADD CONSTRAINT fk_budget
    FOREIGN KEY (budget_id) REFERENCES budgets(id);

-- Audit Log table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(50) NOT NULL,
    performed_by UUID NOT NULL REFERENCES persons(id),
    performed_at TIMESTAMPTZ DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB
);

-- Domain Events table (for event sourcing)
CREATE TABLE IF NOT EXISTS domain_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    aggregate_type VARCHAR(100) NOT NULL,
    aggregate_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    event_data JSONB NOT NULL,
    version INTEGER NOT NULL,
    occurred_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(aggregate_id, version)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_proposals_tenant ON proposals(tenant_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_state ON proposals(tenant_id, state) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_pi ON proposals(tenant_id, principal_investigator_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_sponsor ON proposals(tenant_id, sponsor_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_deadline ON proposals(tenant_id, sponsor_deadline) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_department ON proposals(tenant_id, department) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_proposals_number ON proposals(tenant_id, proposal_number);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_proposals_search ON proposals
    USING gin(to_tsvector('english', title || ' ' || COALESCE(abstract, '') || ' ' || COALESCE(research_area, '')));

-- Vector similarity search index (IVFFlat for approximate nearest neighbor)
CREATE INDEX IF NOT EXISTS idx_proposals_embedding ON proposals
    USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100)
    WHERE embedding IS NOT NULL;

-- Indexes for other tables
CREATE INDEX IF NOT EXISTS idx_persons_tenant ON persons(tenant_id);
CREATE INDEX IF NOT EXISTS idx_persons_email ON persons(tenant_id, email);
CREATE INDEX IF NOT EXISTS idx_sponsors_tenant ON sponsors(tenant_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_sponsor ON opportunities(sponsor_id);
CREATE INDEX IF NOT EXISTS idx_budgets_proposal ON budgets(proposal_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate ON domain_events(aggregate_id, version);

-- Row-Level Security Policies
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;
ALTER TABLE budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE persons ENABLE ROW LEVEL SECURITY;
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for proposals
CREATE POLICY tenant_isolation_proposals ON proposals
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policy for budgets
CREATE POLICY tenant_isolation_budgets ON budgets
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policy for persons
CREATE POLICY tenant_isolation_persons ON persons
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policy for sponsors
CREATE POLICY tenant_isolation_sponsors ON sponsors
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policy for opportunities
CREATE POLICY tenant_isolation_opportunities ON opportunities
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policy for audit_logs
CREATE POLICY tenant_isolation_audit_logs ON audit_logs
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budgets_updated_at
    BEFORE UPDATE ON budgets
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_persons_updated_at
    BEFORE UPDATE ON persons
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at
    BEFORE UPDATE ON sponsors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Proposal number generation function
CREATE OR REPLACE FUNCTION generate_proposal_number(p_tenant_id UUID)
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year INTEGER;
    v_seq INTEGER;
    v_number VARCHAR(50);
BEGIN
    v_year := EXTRACT(YEAR FROM CURRENT_DATE);

    -- Get next sequence number for this tenant and year
    SELECT COALESCE(MAX(
        CAST(SPLIT_PART(proposal_number, '-', 3) AS INTEGER)
    ), 0) + 1
    INTO v_seq
    FROM proposals
    WHERE tenant_id = p_tenant_id
    AND proposal_number LIKE 'PROP-' || v_year || '-%';

    v_number := 'PROP-' || v_year || '-' || LPAD(v_seq::TEXT, 6, '0');

    RETURN v_number;
END;
$$ LANGUAGE plpgsql;

-- Comments for documentation
COMMENT ON TABLE proposals IS 'Grant proposals with 21-state lifecycle management';
COMMENT ON COLUMN proposals.embedding IS 'pgvector embedding for semantic search (1536 dimensions)';
COMMENT ON COLUMN proposals.state_history IS 'JSON array of state transitions with timestamps and users';
COMMENT ON COLUMN proposals.version IS 'Optimistic locking version number';
COMMENT ON FUNCTION current_tenant_id() IS 'Returns the current tenant ID from session context for RLS';
