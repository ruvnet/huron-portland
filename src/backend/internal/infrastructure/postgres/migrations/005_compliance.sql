-- Migration: 005_compliance.sql
-- Description: Compliance tracking, certifications, and regulatory requirements
-- Author: System
-- Created: 2026-01-25

-- ============================================================================
-- Compliance Templates
-- Define compliance requirements by sponsor/type
-- ============================================================================
CREATE TABLE compliance_templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,

    -- Template identification
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50) NOT NULL,
    description TEXT,

    -- Applicability
    sponsor_id UUID REFERENCES sponsors(id),
    proposal_types TEXT[] DEFAULT '{}',

    -- Requirements
    requirements JSONB NOT NULL DEFAULT '[]',

    -- Metadata
    version INT DEFAULT 1,
    is_active BOOLEAN DEFAULT TRUE,
    effective_date DATE,
    expiration_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_template_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_compliance_templates_tenant ON compliance_templates(tenant_id);
CREATE INDEX idx_compliance_templates_sponsor ON compliance_templates(sponsor_id);

-- Enable RLS
ALTER TABLE compliance_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_templates ON compliance_templates
    FOR ALL USING (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- ============================================================================
-- Proposal Compliance Records
-- Track compliance status for each proposal
-- ============================================================================
CREATE TABLE proposal_compliance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Compliance item
    requirement_code VARCHAR(100) NOT NULL,
    requirement_name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    is_required BOOLEAN DEFAULT TRUE,
    is_complete BOOLEAN DEFAULT FALSE,

    -- Determination
    determination VARCHAR(50),
    determination_date TIMESTAMPTZ,
    determined_by UUID REFERENCES users(id),
    determination_notes TEXT,

    -- Documentation
    document_required BOOLEAN DEFAULT FALSE,
    document_attached BOOLEAN DEFAULT FALSE,
    document_id UUID REFERENCES proposal_attachments(id),

    -- Expiration
    expires_at TIMESTAMPTZ,
    renewal_required BOOLEAN DEFAULT FALSE,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_compliance_status CHECK (status IN (
        'pending', 'in_progress', 'under_review', 'approved',
        'rejected', 'not_applicable', 'expired'
    )),
    CONSTRAINT valid_determination CHECK (determination IS NULL OR determination IN (
        'compliant', 'non_compliant', 'conditionally_compliant',
        'not_applicable', 'pending_verification'
    )),
    CONSTRAINT valid_category CHECK (category IN (
        'human_subjects', 'animal_subjects', 'biosafety', 'radiation',
        'export_control', 'conflict_of_interest', 'responsible_conduct',
        'data_management', 'environmental', 'security', 'other'
    ))
);

CREATE INDEX idx_proposal_compliance_proposal ON proposal_compliance(proposal_id);
CREATE INDEX idx_proposal_compliance_tenant ON proposal_compliance(tenant_id);
CREATE INDEX idx_proposal_compliance_status ON proposal_compliance(status);
CREATE INDEX idx_proposal_compliance_category ON proposal_compliance(category);

-- Enable RLS
ALTER TABLE proposal_compliance ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_compliance ON proposal_compliance
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- IRB (Institutional Review Board) Protocols
-- Human subjects research tracking
-- ============================================================================
CREATE TABLE irb_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Protocol identification
    protocol_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,

    -- People
    pi_id UUID NOT NULL REFERENCES users(id),

    -- Classification
    review_type VARCHAR(50) NOT NULL,
    risk_level VARCHAR(50) NOT NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft',

    -- Dates
    submission_date DATE,
    approval_date DATE,
    expiration_date DATE,

    -- Details
    description TEXT,
    population_description TEXT,
    vulnerable_populations TEXT[],

    -- Approvals
    approval_letter_url VARCHAR(500),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_protocol_number UNIQUE (tenant_id, protocol_number),
    CONSTRAINT valid_review_type CHECK (review_type IN (
        'exempt', 'expedited', 'full_board', 'not_human_subjects'
    )),
    CONSTRAINT valid_risk_level CHECK (risk_level IN (
        'minimal', 'greater_than_minimal', 'not_applicable'
    )),
    CONSTRAINT valid_irb_status CHECK (status IN (
        'draft', 'submitted', 'under_review', 'approved',
        'conditionally_approved', 'deferred', 'disapproved',
        'suspended', 'terminated', 'closed', 'expired'
    ))
);

CREATE INDEX idx_irb_protocols_tenant ON irb_protocols(tenant_id);
CREATE INDEX idx_irb_protocols_pi ON irb_protocols(pi_id);
CREATE INDEX idx_irb_protocols_status ON irb_protocols(status);
CREATE INDEX idx_irb_protocols_expiration ON irb_protocols(expiration_date);

-- Enable RLS
ALTER TABLE irb_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_irb ON irb_protocols
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- IACUC (Institutional Animal Care and Use Committee) Protocols
-- Animal subjects research tracking
-- ============================================================================
CREATE TABLE iacuc_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Protocol identification
    protocol_number VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,

    -- People
    pi_id UUID NOT NULL REFERENCES users(id),

    -- Classification
    pain_category VARCHAR(10) NOT NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'draft',

    -- Dates
    submission_date DATE,
    approval_date DATE,
    expiration_date DATE,

    -- Animals
    species TEXT[] NOT NULL,
    animal_count_approved INT,

    -- Details
    description TEXT,
    procedures_description TEXT,

    -- Approvals
    approval_letter_url VARCHAR(500),

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_iacuc_protocol UNIQUE (tenant_id, protocol_number),
    CONSTRAINT valid_pain_category CHECK (pain_category IN ('A', 'B', 'C', 'D', 'E')),
    CONSTRAINT valid_iacuc_status CHECK (status IN (
        'draft', 'submitted', 'under_review', 'approved',
        'conditionally_approved', 'deferred', 'disapproved',
        'suspended', 'terminated', 'closed', 'expired'
    ))
);

CREATE INDEX idx_iacuc_protocols_tenant ON iacuc_protocols(tenant_id);
CREATE INDEX idx_iacuc_protocols_pi ON iacuc_protocols(pi_id);
CREATE INDEX idx_iacuc_protocols_status ON iacuc_protocols(status);
CREATE INDEX idx_iacuc_protocols_expiration ON iacuc_protocols(expiration_date);

-- Enable RLS
ALTER TABLE iacuc_protocols ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_iacuc ON iacuc_protocols
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Conflict of Interest Disclosures
-- ============================================================================
CREATE TABLE coi_disclosures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Disclosure period
    disclosure_year INT NOT NULL,

    -- Status
    status VARCHAR(50) NOT NULL DEFAULT 'pending',

    -- Financial interests
    has_significant_financial_interest BOOLEAN DEFAULT FALSE,
    financial_interests JSONB DEFAULT '[]',

    -- Related entities
    related_entities JSONB DEFAULT '[]',

    -- Determination
    management_plan_required BOOLEAN DEFAULT FALSE,
    management_plan TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,

    -- Certification
    certified_at TIMESTAMPTZ,
    certification_statement TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_coi_disclosure UNIQUE (tenant_id, user_id, disclosure_year),
    CONSTRAINT valid_coi_status CHECK (status IN (
        'pending', 'submitted', 'under_review', 'approved',
        'requires_management', 'non_compliant', 'expired'
    ))
);

CREATE INDEX idx_coi_disclosures_tenant ON coi_disclosures(tenant_id);
CREATE INDEX idx_coi_disclosures_user ON coi_disclosures(user_id);
CREATE INDEX idx_coi_disclosures_year ON coi_disclosures(disclosure_year);
CREATE INDEX idx_coi_disclosures_status ON coi_disclosures(status);

-- Enable RLS
ALTER TABLE coi_disclosures ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_coi ON coi_disclosures
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Export Control Assessments
-- ============================================================================
CREATE TABLE export_control_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Assessment questions
    involves_foreign_nationals BOOLEAN DEFAULT FALSE,
    involves_foreign_travel BOOLEAN DEFAULT FALSE,
    involves_foreign_collaboration BOOLEAN DEFAULT FALSE,
    involves_controlled_technology BOOLEAN DEFAULT FALSE,
    involves_encryption BOOLEAN DEFAULT FALSE,
    involves_space_related BOOLEAN DEFAULT FALSE,

    -- Classification
    ear_classification VARCHAR(50),
    itar_classification VARCHAR(50),

    -- Determination
    requires_license BOOLEAN DEFAULT FALSE,
    license_type VARCHAR(100),
    license_number VARCHAR(100),

    -- Review
    status VARCHAR(50) NOT NULL DEFAULT 'pending',
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    determination_notes TEXT,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_export_status CHECK (status IN (
        'pending', 'under_review', 'approved', 'restricted',
        'prohibited', 'not_applicable'
    ))
);

CREATE INDEX idx_export_control_proposal ON export_control_assessments(proposal_id);
CREATE INDEX idx_export_control_tenant ON export_control_assessments(tenant_id);
CREATE INDEX idx_export_control_status ON export_control_assessments(status);

-- Enable RLS
ALTER TABLE export_control_assessments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_export ON export_control_assessments
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Proposal-Protocol Linkages
-- Link proposals to their compliance protocols
-- ============================================================================
CREATE TABLE proposal_protocols (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,

    -- Link to protocol (polymorphic)
    protocol_type VARCHAR(50) NOT NULL,
    irb_protocol_id UUID REFERENCES irb_protocols(id),
    iacuc_protocol_id UUID REFERENCES iacuc_protocols(id),

    -- Relationship
    relationship_type VARCHAR(50) DEFAULT 'primary',
    notes TEXT,

    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_protocol_type CHECK (protocol_type IN ('irb', 'iacuc', 'ibc', 'rsc')),
    CONSTRAINT valid_relationship CHECK (relationship_type IN ('primary', 'secondary', 'referenced')),
    CONSTRAINT one_protocol_reference CHECK (
        (irb_protocol_id IS NOT NULL AND iacuc_protocol_id IS NULL) OR
        (irb_protocol_id IS NULL AND iacuc_protocol_id IS NOT NULL)
    )
);

CREATE INDEX idx_proposal_protocols_proposal ON proposal_protocols(proposal_id);
CREATE INDEX idx_proposal_protocols_irb ON proposal_protocols(irb_protocol_id);
CREATE INDEX idx_proposal_protocols_iacuc ON proposal_protocols(iacuc_protocol_id);

-- ============================================================================
-- Training Records
-- Track required compliance training
-- ============================================================================
CREATE TABLE training_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Training details
    training_type VARCHAR(100) NOT NULL,
    training_name VARCHAR(255) NOT NULL,
    provider VARCHAR(200),

    -- Completion
    completed_at TIMESTAMPTZ NOT NULL,
    expires_at TIMESTAMPTZ,

    -- Verification
    certificate_number VARCHAR(100),
    certificate_url VARCHAR(500),
    verified BOOLEAN DEFAULT FALSE,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,

    -- Metadata
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_training_type CHECK (training_type IN (
        'rcr', 'human_subjects', 'animal_subjects', 'biosafety',
        'radiation', 'export_control', 'financial_coi',
        'data_security', 'lab_safety', 'other'
    ))
);

CREATE INDEX idx_training_records_tenant ON training_records(tenant_id);
CREATE INDEX idx_training_records_user ON training_records(user_id);
CREATE INDEX idx_training_records_type ON training_records(training_type);
CREATE INDEX idx_training_records_expiration ON training_records(expires_at);

-- Enable RLS
ALTER TABLE training_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_training ON training_records
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Triggers
-- ============================================================================
CREATE TRIGGER update_compliance_templates_updated_at
    BEFORE UPDATE ON compliance_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_proposal_compliance_updated_at
    BEFORE UPDATE ON proposal_compliance
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_irb_protocols_updated_at
    BEFORE UPDATE ON irb_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_iacuc_protocols_updated_at
    BEFORE UPDATE ON iacuc_protocols
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coi_disclosures_updated_at
    BEFORE UPDATE ON coi_disclosures
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_export_control_updated_at
    BEFORE UPDATE ON export_control_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Function to check compliance status for a proposal
CREATE OR REPLACE FUNCTION check_proposal_compliance_status(p_proposal_id UUID)
RETURNS TABLE (
    is_compliant BOOLEAN,
    pending_count INT,
    incomplete_count INT,
    expired_count INT,
    issues JSONB
) AS $$
DECLARE
    v_pending INT;
    v_incomplete INT;
    v_expired INT;
    v_issues JSONB;
BEGIN
    SELECT
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE is_required AND NOT is_complete),
        COUNT(*) FILTER (WHERE expires_at IS NOT NULL AND expires_at < NOW())
    INTO v_pending, v_incomplete, v_expired
    FROM proposal_compliance
    WHERE proposal_id = p_proposal_id;

    SELECT jsonb_agg(jsonb_build_object(
        'code', requirement_code,
        'name', requirement_name,
        'status', status,
        'category', category
    ))
    INTO v_issues
    FROM proposal_compliance
    WHERE proposal_id = p_proposal_id
    AND (
        (is_required AND NOT is_complete) OR
        status IN ('pending', 'rejected', 'expired')
    );

    RETURN QUERY SELECT
        (v_incomplete = 0 AND v_expired = 0) AS is_compliant,
        v_pending,
        v_incomplete,
        v_expired,
        COALESCE(v_issues, '[]'::JSONB);
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE proposal_compliance IS 'Compliance requirements and status for proposals';
COMMENT ON TABLE irb_protocols IS 'IRB protocols for human subjects research';
COMMENT ON TABLE iacuc_protocols IS 'IACUC protocols for animal research';
COMMENT ON TABLE coi_disclosures IS 'Conflict of interest disclosures by personnel';
COMMENT ON TABLE export_control_assessments IS 'Export control assessments for proposals';
COMMENT ON TABLE training_records IS 'Required compliance training completion records';
COMMENT ON FUNCTION check_proposal_compliance_status IS 'Check overall compliance status for a proposal';
