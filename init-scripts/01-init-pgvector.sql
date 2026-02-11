-- =============================================================================
-- Huron Grants PostgreSQL Initialization with pgvector
-- =============================================================================
-- This script runs automatically when the Docker container starts

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- Multi-Tenant Support Tables
-- =============================================================================

-- Tenants table for multi-tenancy
CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- =============================================================================
-- Document Embeddings Table (Core RuVector Storage)
-- =============================================================================

CREATE TABLE IF NOT EXISTS document_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL,
    document_type VARCHAR(100),
    chunk_index INTEGER DEFAULT 0,
    content TEXT,
    embedding vector(1536),
    metadata JSONB DEFAULT '{}',
    confidence_score DECIMAL(5,4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, document_id, chunk_index)
);

-- HNSW index for fast similarity search
CREATE INDEX IF NOT EXISTS idx_document_embeddings_hnsw
ON document_embeddings
USING hnsw (embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- Index for filtering by tenant
CREATE INDEX IF NOT EXISTS idx_document_embeddings_tenant
ON document_embeddings(tenant_id);

-- Index for document type filtering
CREATE INDEX IF NOT EXISTS idx_document_embeddings_type
ON document_embeddings(document_type);

-- =============================================================================
-- Self-Learning Pattern Storage
-- =============================================================================

CREATE TABLE IF NOT EXISTS learning_patterns (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    pattern_type VARCHAR(100) NOT NULL,
    pattern_key VARCHAR(255) NOT NULL,
    pattern_embedding vector(1536),
    pattern_data JSONB NOT NULL,
    success_count INTEGER DEFAULT 0,
    failure_count INTEGER DEFAULT 0,
    confidence DECIMAL(5,4) DEFAULT 0.5,
    last_used_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, pattern_type, pattern_key)
);

-- HNSW index for pattern similarity search
CREATE INDEX IF NOT EXISTS idx_learning_patterns_hnsw
ON learning_patterns
USING hnsw (pattern_embedding vector_cosine_ops)
WITH (m = 16, ef_construction = 200);

-- =============================================================================
-- Trajectory Tracking (Decision Path History)
-- =============================================================================

CREATE TABLE IF NOT EXISTS trajectories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    session_id VARCHAR(255) NOT NULL,
    step_index INTEGER NOT NULL,
    action_type VARCHAR(100) NOT NULL,
    input_data JSONB,
    output_data JSONB,
    decision_embedding vector(1536),
    confidence DECIMAL(5,4),
    duration_ms INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for session lookups
CREATE INDEX IF NOT EXISTS idx_trajectories_session
ON trajectories(tenant_id, session_id, step_index);

-- =============================================================================
-- Categorization History (For Learning From Corrections)
-- =============================================================================

CREATE TABLE IF NOT EXISTS categorization_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL,
    predicted_category VARCHAR(255),
    predicted_confidence DECIMAL(5,4),
    actual_category VARCHAR(255),
    was_corrected BOOLEAN DEFAULT FALSE,
    correction_embedding vector(1536),
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for correction analysis
CREATE INDEX IF NOT EXISTS idx_categorization_history_corrections
ON categorization_history(tenant_id, was_corrected, predicted_category);

-- =============================================================================
-- Field Extraction History (For Form Auto-Population Learning)
-- =============================================================================

CREATE TABLE IF NOT EXISTS extraction_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    document_id VARCHAR(255) NOT NULL,
    field_name VARCHAR(255) NOT NULL,
    extracted_value TEXT,
    corrected_value TEXT,
    field_embedding vector(1536),
    confidence DECIMAL(5,4),
    was_corrected BOOLEAN DEFAULT FALSE,
    user_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for field-level learning
CREATE INDEX IF NOT EXISTS idx_extraction_history_field
ON extraction_history(tenant_id, field_name, was_corrected);

-- =============================================================================
-- Row Level Security (RLS) Policies
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE document_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE trajectories ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorization_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_history ENABLE ROW LEVEL SECURITY;

-- Create policy function for tenant isolation
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULLIF(current_setting('app.current_tenant_id', TRUE), '')::UUID;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS Policies for document_embeddings
CREATE POLICY tenant_isolation_document_embeddings ON document_embeddings
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policies for learning_patterns
CREATE POLICY tenant_isolation_learning_patterns ON learning_patterns
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policies for trajectories
CREATE POLICY tenant_isolation_trajectories ON trajectories
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policies for categorization_history
CREATE POLICY tenant_isolation_categorization_history ON categorization_history
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- RLS Policies for extraction_history
CREATE POLICY tenant_isolation_extraction_history ON extraction_history
    FOR ALL
    USING (tenant_id = current_tenant_id())
    WITH CHECK (tenant_id = current_tenant_id());

-- =============================================================================
-- Helper Functions for Vector Search
-- =============================================================================

-- Semantic search function
CREATE OR REPLACE FUNCTION semantic_search(
    query_embedding vector(1536),
    match_count INTEGER DEFAULT 10,
    filter_type VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id VARCHAR,
    document_type VARCHAR,
    content TEXT,
    metadata JSONB,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        de.id,
        de.document_id,
        de.document_type,
        de.content,
        de.metadata,
        1 - (de.embedding <=> query_embedding) AS similarity
    FROM document_embeddings de
    WHERE (filter_type IS NULL OR de.document_type = filter_type)
    ORDER BY de.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- Pattern matching function
CREATE OR REPLACE FUNCTION find_similar_patterns(
    query_embedding vector(1536),
    pattern_type_filter VARCHAR DEFAULT NULL,
    match_count INTEGER DEFAULT 5,
    min_confidence DECIMAL DEFAULT 0.5
)
RETURNS TABLE (
    id UUID,
    pattern_type VARCHAR,
    pattern_key VARCHAR,
    pattern_data JSONB,
    confidence DECIMAL,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        lp.id,
        lp.pattern_type,
        lp.pattern_key,
        lp.pattern_data,
        lp.confidence,
        1 - (lp.pattern_embedding <=> query_embedding) AS similarity
    FROM learning_patterns lp
    WHERE (pattern_type_filter IS NULL OR lp.pattern_type = pattern_type_filter)
      AND lp.confidence >= min_confidence
    ORDER BY lp.pattern_embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Insert Default Development Tenant
-- =============================================================================

INSERT INTO tenants (id, name, slug, settings)
VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'Development Tenant',
    'dev-tenant',
    '{"features": {"self_learning": true, "trajectory_tracking": true}}'
)
ON CONFLICT (slug) DO NOTHING;

-- =============================================================================
-- Grant Permissions
-- =============================================================================

-- Create application role
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'huron_app') THEN
        CREATE ROLE huron_app WITH LOGIN PASSWORD 'app_password';
    END IF;
END
$$;

GRANT USAGE ON SCHEMA public TO huron_app;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO huron_app;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO huron_app;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO huron_app;

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Huron Grants database initialized successfully with pgvector support';
END
$$;
