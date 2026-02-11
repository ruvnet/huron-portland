-- Migration: 004_budgets.sql
-- Description: Budget tables with periods, categories, and line items
-- Author: System
-- Created: 2026-01-25

-- ============================================================================
-- Budget Categories (Template)
-- Standard budget categories that can be customized per tenant
-- ============================================================================
CREATE TABLE budget_categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    code VARCHAR(20) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES budget_categories(id),
    sort_order INT DEFAULT 0,
    is_direct_cost BOOLEAN DEFAULT TRUE,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_category_code UNIQUE (tenant_id, code)
);

CREATE INDEX idx_budget_categories_tenant ON budget_categories(tenant_id);
CREATE INDEX idx_budget_categories_parent ON budget_categories(parent_id);

-- Enable RLS
ALTER TABLE budget_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_categories ON budget_categories
    FOR ALL USING (tenant_id IS NULL OR tenant_id = current_tenant_id());

-- ============================================================================
-- Proposal Budgets
-- Top-level budget container for a proposal
-- ============================================================================
CREATE TABLE proposal_budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    proposal_id UUID NOT NULL REFERENCES proposals(id) ON DELETE CASCADE,
    tenant_id UUID NOT NULL REFERENCES tenants(id),

    -- Budget metadata
    name VARCHAR(100) DEFAULT 'Primary Budget',
    currency VARCHAR(3) DEFAULT 'USD',

    -- Calculated totals (denormalized for performance)
    total_direct_costs DECIMAL(15,2) DEFAULT 0,
    total_indirect_costs DECIMAL(15,2) DEFAULT 0,
    total_cost_sharing DECIMAL(15,2) DEFAULT 0,
    total_budget DECIMAL(15,2) DEFAULT 0,

    -- Indirect cost settings
    indirect_cost_rate DECIMAL(5,4),
    indirect_cost_base VARCHAR(50) DEFAULT 'mtdc',
    mtdc_exclusions JSONB DEFAULT '[]',

    -- Status
    status VARCHAR(50) DEFAULT 'draft',
    is_modular BOOLEAN DEFAULT FALSE,
    modular_increment DECIMAL(15,2),

    -- Approval
    approved_at TIMESTAMPTZ,
    approved_by UUID REFERENCES users(id),

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_budget_status CHECK (status IN (
        'draft', 'pending_review', 'approved', 'rejected', 'archived'
    )),
    CONSTRAINT valid_indirect_base CHECK (indirect_cost_base IN (
        'mtdc', 'tdc', 'salaries', 'custom'
    ))
);

CREATE INDEX idx_proposal_budgets_proposal ON proposal_budgets(proposal_id);
CREATE INDEX idx_proposal_budgets_tenant ON proposal_budgets(tenant_id);

-- Enable RLS
ALTER TABLE proposal_budgets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_budgets ON proposal_budgets
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- Budget Periods
-- Time-based breakdown of budget (typically annual)
-- ============================================================================
CREATE TABLE budget_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES proposal_budgets(id) ON DELETE CASCADE,

    -- Period definition
    period_number INT NOT NULL,
    name VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    duration_months INT GENERATED ALWAYS AS (
        EXTRACT(YEAR FROM age(end_date, start_date)) * 12 +
        EXTRACT(MONTH FROM age(end_date, start_date)) + 1
    ) STORED,

    -- Period totals (denormalized)
    direct_costs DECIMAL(15,2) DEFAULT 0,
    indirect_costs DECIMAL(15,2) DEFAULT 0,
    cost_sharing DECIMAL(15,2) DEFAULT 0,
    total DECIMAL(15,2) DEFAULT 0,

    -- Metadata
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_period_number UNIQUE (budget_id, period_number),
    CONSTRAINT valid_period_dates CHECK (end_date >= start_date)
);

CREATE INDEX idx_budget_periods_budget ON budget_periods(budget_id);

-- ============================================================================
-- Budget Line Items
-- Individual line items within a budget period
-- ============================================================================
CREATE TABLE budget_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    period_id UUID NOT NULL REFERENCES budget_periods(id) ON DELETE CASCADE,
    category_id UUID REFERENCES budget_categories(id),

    -- Item details
    description VARCHAR(500) NOT NULL,
    quantity DECIMAL(10,2) DEFAULT 1,
    unit VARCHAR(50),
    unit_cost DECIMAL(15,2) NOT NULL,
    total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * unit_cost) STORED,

    -- Cost sharing
    sponsor_amount DECIMAL(15,2),
    cost_share_amount DECIMAL(15,2) DEFAULT 0,
    cost_share_type VARCHAR(50),
    cost_share_source VARCHAR(255),

    -- Justification
    justification TEXT,

    -- Personnel-specific fields
    person_id UUID REFERENCES users(id),
    person_months DECIMAL(4,2),
    base_salary DECIMAL(15,2),
    fringe_rate DECIMAL(5,4),
    fringe_amount DECIMAL(15,2),

    -- Subcontract/subaward fields
    subaward_organization VARCHAR(255),
    subaward_pi VARCHAR(255),
    is_foreign BOOLEAN DEFAULT FALSE,

    -- Metadata
    sort_order INT DEFAULT 0,
    is_excluded_from_idc BOOLEAN DEFAULT FALSE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_cost_share_type CHECK (cost_share_type IS NULL OR cost_share_type IN (
        'cash', 'in_kind', 'third_party', 'unrecovered_idc'
    ))
);

CREATE INDEX idx_budget_line_items_period ON budget_line_items(period_id);
CREATE INDEX idx_budget_line_items_category ON budget_line_items(category_id);
CREATE INDEX idx_budget_line_items_person ON budget_line_items(person_id)
    WHERE person_id IS NOT NULL;

-- ============================================================================
-- Budget Justifications
-- Detailed justifications for budget categories
-- ============================================================================
CREATE TABLE budget_justifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES proposal_budgets(id) ON DELETE CASCADE,
    category_id UUID REFERENCES budget_categories(id),

    -- Content
    content TEXT NOT NULL,
    is_complete BOOLEAN DEFAULT FALSE,

    -- AI assistance
    ai_generated_draft TEXT,
    ai_suggestions JSONB,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_justification UNIQUE (budget_id, category_id)
);

CREATE INDEX idx_budget_justifications_budget ON budget_justifications(budget_id);

-- ============================================================================
-- Subcontracts/Subawards
-- Detailed subaward tracking
-- ============================================================================
CREATE TABLE subawards (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    budget_id UUID NOT NULL REFERENCES proposal_budgets(id) ON DELETE CASCADE,

    -- Organization
    organization_name VARCHAR(255) NOT NULL,
    organization_type VARCHAR(50),
    duns_number VARCHAR(13),
    cage_code VARCHAR(10),
    address JSONB,

    -- Contact
    pi_name VARCHAR(200) NOT NULL,
    pi_email VARCHAR(255),
    pi_phone VARCHAR(20),
    admin_contact JSONB,

    -- Financial
    total_amount DECIMAL(15,2) NOT NULL,
    first_year_amount DECIMAL(15,2),
    is_foreign BOOLEAN DEFAULT FALSE,

    -- Scope
    scope_of_work TEXT,
    performance_period_start DATE,
    performance_period_end DATE,

    -- Status
    status VARCHAR(50) DEFAULT 'pending',
    commitment_letter_received BOOLEAN DEFAULT FALSE,
    budget_received BOOLEAN DEFAULT FALSE,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT valid_subaward_status CHECK (status IN (
        'pending', 'in_review', 'approved', 'rejected', 'executed'
    ))
);

CREATE INDEX idx_subawards_budget ON subawards(budget_id);

-- ============================================================================
-- Triggers for Totals Calculation
-- ============================================================================

-- Function to recalculate period totals
CREATE OR REPLACE FUNCTION recalculate_period_totals()
RETURNS TRIGGER AS $$
DECLARE
    v_period_id UUID;
    v_budget_id UUID;
BEGIN
    -- Determine which period to update
    IF TG_OP = 'DELETE' THEN
        v_period_id := OLD.period_id;
    ELSE
        v_period_id := NEW.period_id;
    END IF;

    -- Update period totals
    UPDATE budget_periods bp
    SET
        direct_costs = COALESCE((
            SELECT SUM(total_cost)
            FROM budget_line_items bli
            JOIN budget_categories bc ON bli.category_id = bc.id
            WHERE bli.period_id = bp.id
            AND bc.is_direct_cost = TRUE
        ), 0),
        cost_sharing = COALESCE((
            SELECT SUM(cost_share_amount)
            FROM budget_line_items bli
            WHERE bli.period_id = bp.id
        ), 0),
        updated_at = NOW()
    WHERE id = v_period_id
    RETURNING budget_id INTO v_budget_id;

    -- Update budget totals
    UPDATE proposal_budgets pb
    SET
        total_direct_costs = COALESCE((
            SELECT SUM(direct_costs) FROM budget_periods WHERE budget_id = pb.id
        ), 0),
        total_cost_sharing = COALESCE((
            SELECT SUM(cost_sharing) FROM budget_periods WHERE budget_id = pb.id
        ), 0),
        updated_at = NOW()
    WHERE id = v_budget_id;

    -- Recalculate indirect costs and total
    UPDATE proposal_budgets pb
    SET
        total_indirect_costs = total_direct_costs * COALESCE(indirect_cost_rate, 0),
        total_budget = total_direct_costs + (total_direct_costs * COALESCE(indirect_cost_rate, 0)),
        updated_at = NOW()
    WHERE id = v_budget_id;

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_recalculate_period_totals
    AFTER INSERT OR UPDATE OR DELETE ON budget_line_items
    FOR EACH ROW
    EXECUTE FUNCTION recalculate_period_totals();

-- Updated at triggers
CREATE TRIGGER update_proposal_budgets_updated_at
    BEFORE UPDATE ON proposal_budgets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_periods_updated_at
    BEFORE UPDATE ON budget_periods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_line_items_updated_at
    BEFORE UPDATE ON budget_line_items
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_budget_justifications_updated_at
    BEFORE UPDATE ON budget_justifications
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subawards_updated_at
    BEFORE UPDATE ON subawards
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Insert Default Budget Categories (System-wide)
-- ============================================================================
INSERT INTO budget_categories (id, tenant_id, code, name, is_direct_cost, is_system, sort_order) VALUES
    ('a0000001-0001-0001-0001-000000000001', NULL, 'PERSONNEL', 'Personnel', TRUE, TRUE, 1),
    ('a0000001-0001-0001-0001-000000000002', NULL, 'FRINGE', 'Fringe Benefits', TRUE, TRUE, 2),
    ('a0000001-0001-0001-0001-000000000003', NULL, 'EQUIPMENT', 'Equipment', TRUE, TRUE, 3),
    ('a0000001-0001-0001-0001-000000000004', NULL, 'TRAVEL', 'Travel', TRUE, TRUE, 4),
    ('a0000001-0001-0001-0001-000000000005', NULL, 'PARTICIPANT', 'Participant Support', TRUE, TRUE, 5),
    ('a0000001-0001-0001-0001-000000000006', NULL, 'SUPPLIES', 'Supplies', TRUE, TRUE, 6),
    ('a0000001-0001-0001-0001-000000000007', NULL, 'CONTRACTUAL', 'Contractual/Subawards', TRUE, TRUE, 7),
    ('a0000001-0001-0001-0001-000000000008', NULL, 'CONSTRUCTION', 'Construction', TRUE, TRUE, 8),
    ('a0000001-0001-0001-0001-000000000009', NULL, 'OTHER', 'Other Direct Costs', TRUE, TRUE, 9),
    ('a0000001-0001-0001-0001-000000000010', NULL, 'IDC', 'Indirect Costs (F&A)', FALSE, TRUE, 10);

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE proposal_budgets IS 'Top-level budget container for proposals';
COMMENT ON TABLE budget_periods IS 'Time-based budget breakdown (typically annual periods)';
COMMENT ON TABLE budget_line_items IS 'Individual budget line items with cost details';
COMMENT ON TABLE budget_categories IS 'Standard and custom budget categories';
COMMENT ON COLUMN proposal_budgets.indirect_cost_base IS 'Base for IDC calculation: mtdc, tdc, salaries, or custom';
COMMENT ON COLUMN budget_line_items.is_excluded_from_idc IS 'Whether this item is excluded from indirect cost calculation';
