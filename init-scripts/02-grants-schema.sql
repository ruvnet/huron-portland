-- =============================================================================
-- Huron Grants Schema - Core Tables
-- =============================================================================
-- This script creates the grants management tables

-- =============================================================================
-- Grants Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS grants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    -- Basic Information
    title VARCHAR(500) NOT NULL,
    description TEXT,
    abstract TEXT,

    -- Status and Workflow
    status VARCHAR(50) DEFAULT 'draft' CHECK (status IN (
        'draft', 'submitted', 'under_review', 'approved',
        'rejected', 'active', 'completed', 'cancelled'
    )),
    workflow_state JSONB DEFAULT '{}',

    -- Funding Information
    funding_amount DECIMAL(15,2),
    funding_currency VARCHAR(3) DEFAULT 'USD',
    indirect_cost_rate DECIMAL(5,2),

    -- Sponsor Information
    sponsor_id UUID,
    sponsor_name VARCHAR(255),
    funding_opportunity_number VARCHAR(100),

    -- Timeline
    submission_deadline TIMESTAMP WITH TIME ZONE,
    project_start_date DATE,
    project_end_date DATE,

    -- Principal Investigator
    pi_user_id UUID,
    pi_name VARCHAR(255),
    pi_email VARCHAR(255),
    pi_department VARCHAR(255),

    -- Co-Investigators (stored as JSONB array)
    co_investigators JSONB DEFAULT '[]',

    -- Documents and Attachments
    documents JSONB DEFAULT '[]',

    -- AI/ML Fields
    ai_summary TEXT,
    ai_recommendations JSONB DEFAULT '{}',
    categorization_confidence DECIMAL(5,4),

    -- Embeddings for semantic search
    title_embedding vector(1536),
    content_embedding vector(1536),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    tags TEXT[] DEFAULT '{}',

    -- Audit Fields
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- Indexes for Grants Table
-- =============================================================================

-- Standard indexes
CREATE INDEX IF NOT EXISTS idx_grants_tenant ON grants(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grants_status ON grants(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_grants_sponsor ON grants(sponsor_name);
CREATE INDEX IF NOT EXISTS idx_grants_pi ON grants(pi_user_id);
CREATE INDEX IF NOT EXISTS idx_grants_deadline ON grants(submission_deadline);
CREATE INDEX IF NOT EXISTS idx_grants_dates ON grants(project_start_date, project_end_date);
CREATE INDEX IF NOT EXISTS idx_grants_tags ON grants USING gin(tags);

-- Vector indexes for semantic search
CREATE INDEX IF NOT EXISTS idx_grants_title_hnsw ON grants
    USING hnsw (title_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

CREATE INDEX IF NOT EXISTS idx_grants_content_hnsw ON grants
    USING hnsw (content_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_grants_fulltext ON grants
    USING gin(to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, '') || ' ' || coalesce(abstract, '')));

-- =============================================================================
-- Grant Documents Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS grant_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,

    -- Document Information
    document_type VARCHAR(100) NOT NULL,
    filename VARCHAR(500) NOT NULL,
    original_filename VARCHAR(500),
    mime_type VARCHAR(100),
    file_size BIGINT,
    storage_path VARCHAR(1000),

    -- Processing Status
    processing_status VARCHAR(50) DEFAULT 'pending' CHECK (processing_status IN (
        'pending', 'processing', 'completed', 'failed'
    )),
    processing_error TEXT,

    -- Extracted Content
    extracted_text TEXT,
    extracted_fields JSONB DEFAULT '{}',

    -- AI/ML Fields
    ai_category VARCHAR(100),
    ai_summary TEXT,
    confidence_score DECIMAL(5,4),

    -- Embeddings
    content_embedding vector(1536),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit Fields
    uploaded_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Grant Documents
CREATE INDEX IF NOT EXISTS idx_grant_docs_tenant ON grant_documents(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grant_docs_grant ON grant_documents(grant_id);
CREATE INDEX IF NOT EXISTS idx_grant_docs_type ON grant_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_grant_docs_status ON grant_documents(processing_status);

CREATE INDEX IF NOT EXISTS idx_grant_docs_embedding_hnsw ON grant_documents
    USING hnsw (content_embedding vector_cosine_ops)
    WITH (m = 16, ef_construction = 200);

-- =============================================================================
-- Grant Comments/Notes Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS grant_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,

    -- Comment Content
    content TEXT NOT NULL,
    comment_type VARCHAR(50) DEFAULT 'general' CHECK (comment_type IN (
        'general', 'review', 'feedback', 'internal', 'system'
    )),

    -- Visibility
    is_internal BOOLEAN DEFAULT false,

    -- Author
    author_id UUID,
    author_name VARCHAR(255),

    -- Metadata
    metadata JSONB DEFAULT '{}',

    -- Audit Fields
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Grant Comments
CREATE INDEX IF NOT EXISTS idx_grant_comments_tenant ON grant_comments(tenant_id);
CREATE INDEX IF NOT EXISTS idx_grant_comments_grant ON grant_comments(grant_id);
CREATE INDEX IF NOT EXISTS idx_grant_comments_type ON grant_comments(comment_type);

-- =============================================================================
-- Grant Workflow History Table
-- =============================================================================

CREATE TABLE IF NOT EXISTS grant_workflow_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    grant_id UUID NOT NULL REFERENCES grants(id) ON DELETE CASCADE,

    -- Workflow Transition
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    action VARCHAR(100) NOT NULL,

    -- Actor
    actor_id UUID,
    actor_name VARCHAR(255),
    actor_role VARCHAR(100),

    -- Details
    reason TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamp
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Workflow History
CREATE INDEX IF NOT EXISTS idx_workflow_history_tenant ON grant_workflow_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_grant ON grant_workflow_history(grant_id);
CREATE INDEX IF NOT EXISTS idx_workflow_history_status ON grant_workflow_history(from_status, to_status);

-- =============================================================================
-- Row Level Security for New Tables
-- =============================================================================

ALTER TABLE grants ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE grant_workflow_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY tenant_isolation_grants ON grants
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_grant_documents ON grant_documents
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_grant_comments ON grant_comments
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY tenant_isolation_grant_workflow_history ON grant_workflow_history
    FOR ALL USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- =============================================================================
-- Helper Functions
-- =============================================================================

-- Function to search grants by semantic similarity
CREATE OR REPLACE FUNCTION search_grants_semantic(
    query_embedding vector(1536),
    match_count INTEGER DEFAULT 10,
    status_filter VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    title VARCHAR,
    description TEXT,
    status VARCHAR,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        g.id,
        g.title,
        g.description,
        g.status,
        1 - (g.content_embedding <=> query_embedding) AS similarity
    FROM grants g
    WHERE (status_filter IS NULL OR g.status = status_filter)
      AND g.content_embedding IS NOT NULL
    ORDER BY g.content_embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Function to get grant statistics
CREATE OR REPLACE FUNCTION get_grant_statistics()
RETURNS TABLE (
    total_grants BIGINT,
    draft_count BIGINT,
    submitted_count BIGINT,
    active_count BIGINT,
    total_funding DECIMAL,
    avg_funding DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT AS total_grants,
        COUNT(*) FILTER (WHERE status = 'draft')::BIGINT AS draft_count,
        COUNT(*) FILTER (WHERE status = 'submitted')::BIGINT AS submitted_count,
        COUNT(*) FILTER (WHERE status = 'active')::BIGINT AS active_count,
        COALESCE(SUM(funding_amount), 0) AS total_funding,
        COALESCE(AVG(funding_amount), 0) AS avg_funding
    FROM grants;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Grant Permissions
-- =============================================================================

GRANT ALL PRIVILEGES ON grants TO huron_app;
GRANT ALL PRIVILEGES ON grant_documents TO huron_app;
GRANT ALL PRIVILEGES ON grant_comments TO huron_app;
GRANT ALL PRIVILEGES ON grant_workflow_history TO huron_app;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Grants schema initialized successfully';
END
$$;
