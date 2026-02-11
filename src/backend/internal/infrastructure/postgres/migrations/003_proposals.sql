-- Migration: 003_proposals.sql
-- Description: Proposals with vector embeddings for semantic search
-- Author: System
-- Created: 2026-01-25

-- ============================================================================
-- Users Table (referenced by proposals)
-- Basic user information for PIs and collaborators
-- ============================================================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    title VARCHAR(100),
    department VARCHAR(200),
    institution VARCHAR(255),
    orcid VARCHAR(19),
    phone VARCHAR(20),
    avatar_url VARCHAR(500),
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email),
    CONSTRAINT valid_orcid CHECK (orcid IS NULL OR orcid ~ '^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$')
);

CREATE INDEX idx_users_tenant ON users(tenant_id);
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_name_trgm ON users USING gin ((first_name || ' ' || last_name) gin_trgm_ops);

-- Enable RLS on users
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_users ON users
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Sponsors Table
-- Funding agencies and sponsors
-- ============================================================================
CREATE TABLE sponsors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    abbreviation VARCHAR(50),
    sponsor_type VARCHAR(50) NOT NULL DEFAULT 'federal',
    website VARCHAR(500),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address JSONB,
    requirements JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_sponsor_type CHECK (sponsor_type IN ('federal', 'state', 'private', 'foundation', 'industry', 'internal', 'other'))
);

CREATE INDEX idx_sponsors_tenant ON sponsors(tenant_id);
CREATE INDEX idx_sponsors_type ON sponsors(sponsor_type);
CREATE INDEX idx_sponsors_name_trgm ON sponsors USING gin (name gin_trgm_ops);

-- Enable RLS on sponsors
ALTER TABLE sponsors ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sponsors ON sponsors
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Proposals Table
-- Core proposal data with vector embeddings for AI-powered search
-- ============================================================================
CREATE TABLE proposals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Basic information
    title VARCHAR(500) NOT NULL,
    abstract TEXT,
    narrative TEXT,
    keywords TEXT[],

    -- Status and type
    status VARCHAR(50) NOT NULL DEFAULT 'draft',
    proposal_type VARCHAR(50) NOT NULL,

    -- People
    pi_id UUID NOT NULL REFERENCES users(id),
    created_by UUID NOT NULL REFERENCES users(id),

    -- Sponsor information
    sponsor_id UUID REFERENCES sponsors(id),
    opportunity_id VARCHAR(100),
    opportunity_title VARCHAR(500),
    funding_mechanism VARCHAR(100),

    -- Dates
    submission_deadline TIMESTAMPTZ,
    submitted_at TIMESTAMPTZ,
    project_start_date DATE,
    project_end_date DATE,

    -- AI/ML features
    embedding vector(384),  -- MiniLM-L6 dimensions (384-dim embeddings)
    ai_summary TEXT,
    ai_keywords TEXT[],
    similarity_score FLOAT,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    external_ids JSONB DEFAULT '{}',

    -- Versioning
    version INT DEFAULT 1,
    parent_version_id UUID REFERENCES proposals(id),
    is_latest_version BOOLEAN DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_status CHECK (status IN (
        'draft', 'in_review', 'routing', 'pending_approval',
        'approved', 'submitted', 'awarded', 'declined',
        'withdrawn', 'archived'
    )),
    CONSTRAINT valid_proposal_type CHECK (proposal_type IN (
        'new', 'renewal', 'continuation', 'supplement',
        'resubmission', 'transfer', 'pre_proposal'
    )),
    CONSTRAINT valid_project_dates CHECK (
        project_end_date IS NULL OR project_start_date IS NULL
        OR project_end_date >= project_start_date
    )
);

-- ============================================================================
-- Indexes for Proposals
-- ============================================================================

-- Tenant isolation (most common filter)
CREATE INDEX idx_proposals_tenant ON proposals(tenant_id);

-- Status-based queries
CREATE INDEX idx_proposals_status ON proposals(tenant_id, status);
CREATE INDEX idx_proposals_type ON proposals(tenant_id, proposal_type);

-- PI and creator lookups
CREATE INDEX idx_proposals_pi ON proposals(pi_id);
CREATE INDEX idx_proposals_created_by ON proposals(created_by);

-- Sponsor and opportunity lookups
CREATE INDEX idx_proposals_sponsor ON proposals(sponsor_id);
CREATE INDEX idx_proposals_opportunity ON proposals(opportunity_id);

-- Date-based queries
CREATE INDEX idx_proposals_deadline ON proposals(submission_deadline)
    WHERE submission_deadline IS NOT NULL;
CREATE INDEX idx_proposals_submitted ON proposals(submitted_at)
    WHERE submitted_at IS NOT NULL;

-- Full-text search on title and abstract
CREATE INDEX idx_proposals_title_trgm ON proposals USING gin (title gin_trgm_ops);
CREATE INDEX idx_proposals_abstract_trgm ON proposals USING gin (abstract gin_trgm_ops);

-- Keywords array search
CREATE INDEX idx_proposals_keywords ON proposals USING gin (keywords);

-- HNSW index for fast vector similarity search
-- m=16: connections per layer, ef_construction=200: build-time accuracy
CREATE INDEX idx_proposals_embedding_hnsw
ON proposals USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- Version tracking
CREATE INDEX idx_proposals_version ON proposals(parent_version_id)
    WHERE parent_version_id IS NOT NULL;
CREATE INDEX idx_proposals_latest ON proposals(tenant_id, is_latest_version)
    WHERE is_latest_version = TRUE;

-- ============================================================================
-- Row Level Security for Proposals
-- ============================================================================
ALTER TABLE proposals ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON proposals
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Proposal Collaborators (Co-PIs, Key Personnel)
-- ============================================================================
CREATE TABLE proposal_collaborators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL DEFAULT 'co_pi',
    permissions JSONB DEFAULT '{"read": true, "write": false}',
    added_at TIMESTAMPTZ DEFAULT NOW(),
    added_by UUID REFERENCES users(id),

    CONSTRAINT unique_collaborator UNIQUE (proposal_id, user_id),
    CONSTRAINT valid_role CHECK (role IN (
        'co_pi', 'key_personnel', 'consultant', 'collaborator',
        'staff', 'student', 'other'
    ))
);

CREATE INDEX idx_proposal_collaborators_proposal ON proposal_collaborators(proposal_id);
CREATE INDEX idx_proposal_collaborators_user ON proposal_collaborators(user_id);

-- ============================================================================
-- Proposal Attachments
-- ============================================================================
CREATE TABLE proposal_attachments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    content_type VARCHAR(100) NOT NULL,
    size_bytes BIGINT NOT NULL,
    storage_path VARCHAR(500) NOT NULL,
    attachment_type VARCHAR(50) NOT NULL DEFAULT 'supporting',
    description TEXT,
    uploaded_by UUID NOT NULL REFERENCES users(id),
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_attachment_type CHECK (attachment_type IN (
        'narrative', 'budget', 'biosketch', 'facilities',
        'supporting', 'appendix', 'other'
    ))
);

CREATE INDEX idx_proposal_attachments_proposal ON proposal_attachments(proposal_id);
CREATE INDEX idx_proposal_attachments_type ON proposal_attachments(proposal_id, attachment_type);

-- ============================================================================
-- Triggers
-- ============================================================================

-- Update timestamp trigger
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sponsors_updated_at
    BEFORE UPDATE ON sponsors
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposals_updated_at
    BEFORE UPDATE ON proposals
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to find similar proposals by embedding
CREATE OR REPLACE FUNCTION find_similar_proposals(
    p_embedding vector(384),
    p_tenant_id UUID,
    p_limit INT DEFAULT 10,
    p_threshold FLOAT DEFAULT 0.7
)
RETURNS TABLE (
    id UUID,
    title VARCHAR(500),
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.id,
        pr.title,
        1 - (pr.embedding <=> p_embedding) AS similarity
    FROM proposals pr
    WHERE pr.tenant_id = p_tenant_id
      AND pr.embedding IS NOT NULL
      AND pr.is_latest_version = TRUE
      AND 1 - (pr.embedding <=> p_embedding) >= p_threshold
    ORDER BY pr.embedding <=> p_embedding
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get proposal status counts
CREATE OR REPLACE FUNCTION get_proposal_status_counts(p_tenant_id UUID)
RETURNS TABLE (
    status VARCHAR(50),
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        pr.status,
        COUNT(*)::BIGINT
    FROM proposals pr
    WHERE pr.tenant_id = p_tenant_id
      AND pr.is_latest_version = TRUE
    GROUP BY pr.status
    ORDER BY pr.status;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE proposals IS 'Research proposals with AI-powered vector search';
COMMENT ON COLUMN proposals.embedding IS 'MiniLM-L6 384-dimensional embedding for semantic search';
COMMENT ON INDEX idx_proposals_embedding_hnsw IS 'HNSW index for fast approximate nearest neighbor search';
COMMENT ON FUNCTION find_similar_proposals IS 'Find semantically similar proposals using vector similarity';
