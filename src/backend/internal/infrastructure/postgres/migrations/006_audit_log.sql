-- Migration: 006_audit_log.sql
-- Description: Comprehensive audit trail for all system changes
-- Author: System
-- Created: 2026-01-25

-- ============================================================================
-- Audit Log Table
-- Immutable log of all data changes for compliance and debugging
-- ============================================================================
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

    -- Tenant context
    tenant_id UUID REFERENCES tenants(id),

    -- What changed
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID NOT NULL,
    entity_name VARCHAR(500),

    -- Action details
    action VARCHAR(50) NOT NULL,
    action_category VARCHAR(50) NOT NULL DEFAULT 'data',

    -- Change details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],

    -- Who made the change
    actor_id UUID REFERENCES users(id),
    actor_email VARCHAR(255),
    actor_name VARCHAR(200),
    actor_type VARCHAR(50) DEFAULT 'user',

    -- Request context
    request_id UUID,
    session_id UUID,
    ip_address INET,
    user_agent TEXT,

    -- Additional context
    reason TEXT,
    metadata JSONB DEFAULT '{}',

    -- Timestamp (immutable)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,

    -- Constraints
    CONSTRAINT valid_action CHECK (action IN (
        'create', 'read', 'update', 'delete',
        'approve', 'reject', 'submit', 'withdraw',
        'login', 'logout', 'password_change', 'permission_change',
        'export', 'import', 'archive', 'restore'
    )),
    CONSTRAINT valid_action_category CHECK (action_category IN (
        'data', 'auth', 'security', 'system', 'compliance', 'workflow'
    )),
    CONSTRAINT valid_actor_type CHECK (actor_type IN (
        'user', 'system', 'api', 'scheduled_job', 'integration'
    ))
);

-- ============================================================================
-- Indexes for Audit Logs
-- Optimized for common query patterns
-- ============================================================================

-- Tenant-based queries
CREATE INDEX idx_audit_logs_tenant ON audit_logs(tenant_id);

-- Entity lookups (find all changes to a specific record)
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Action filtering
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_category ON audit_logs(action_category);

-- Actor lookups (find all changes by a user)
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_id);

-- Time-based queries (most important for audit retrieval)
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_logs_tenant_time ON audit_logs(tenant_id, created_at DESC);
CREATE INDEX idx_audit_logs_entity_time ON audit_logs(entity_type, entity_id, created_at DESC);

-- Request correlation
CREATE INDEX idx_audit_logs_request ON audit_logs(request_id) WHERE request_id IS NOT NULL;
CREATE INDEX idx_audit_logs_session ON audit_logs(session_id) WHERE session_id IS NOT NULL;

-- IP address for security investigations
CREATE INDEX idx_audit_logs_ip ON audit_logs(ip_address) WHERE ip_address IS NOT NULL;

-- ============================================================================
-- Partitioning for Large Scale
-- Partition by month for efficient data management
-- ============================================================================

-- Note: In production, consider table partitioning:
-- CREATE TABLE audit_logs (...) PARTITION BY RANGE (created_at);
-- CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs
--     FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

-- ============================================================================
-- Audit Log Views
-- Convenient views for common queries
-- ============================================================================

-- Recent activity view
CREATE OR REPLACE VIEW recent_audit_activity AS
SELECT
    al.id,
    al.entity_type,
    al.entity_id,
    al.entity_name,
    al.action,
    al.action_category,
    al.actor_name,
    al.actor_email,
    al.changed_fields,
    al.reason,
    al.created_at
FROM audit_logs al
WHERE al.created_at >= NOW() - INTERVAL '7 days'
ORDER BY al.created_at DESC;

-- Security events view
CREATE OR REPLACE VIEW security_audit_events AS
SELECT
    al.id,
    al.tenant_id,
    al.entity_type,
    al.entity_id,
    al.action,
    al.actor_id,
    al.actor_email,
    al.ip_address,
    al.user_agent,
    al.metadata,
    al.created_at
FROM audit_logs al
WHERE al.action_category = 'security'
   OR al.action IN ('login', 'logout', 'password_change', 'permission_change')
ORDER BY al.created_at DESC;

-- ============================================================================
-- Session Tracking Table
-- Track user sessions for security and audit correlation
-- ============================================================================
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    user_id UUID NOT NULL REFERENCES users(id),

    -- Session info
    token_hash VARCHAR(64) NOT NULL,

    -- Device/location
    ip_address INET,
    user_agent TEXT,
    device_type VARCHAR(50),
    device_info JSONB,

    -- Location (from IP)
    country_code VARCHAR(2),
    region VARCHAR(100),
    city VARCHAR(100),

    -- Timestamps
    started_at TIMESTAMPTZ DEFAULT NOW(),
    last_activity_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,

    -- Status
    is_active BOOLEAN DEFAULT TRUE,
    ended_reason VARCHAR(50),

    CONSTRAINT valid_ended_reason CHECK (ended_reason IS NULL OR ended_reason IN (
        'logout', 'timeout', 'revoked', 'password_change', 'security_event'
    ))
);

CREATE INDEX idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_tenant ON user_sessions(tenant_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(token_hash);
CREATE INDEX idx_user_sessions_active ON user_sessions(user_id, is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at) WHERE is_active = TRUE;

-- Enable RLS
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation_sessions ON user_sessions
    FOR ALL USING (tenant_id = current_tenant_id());

-- ============================================================================
-- API Request Log
-- Track API requests for debugging and rate limiting
-- ============================================================================
CREATE TABLE api_request_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID NOT NULL,
    tenant_id UUID REFERENCES tenants(id),
    user_id UUID REFERENCES users(id),

    -- Request details
    method VARCHAR(10) NOT NULL,
    path VARCHAR(500) NOT NULL,
    query_params JSONB,

    -- Response
    status_code INT NOT NULL,
    response_time_ms INT,

    -- Context
    ip_address INET,
    user_agent TEXT,

    -- Error details (if applicable)
    error_code VARCHAR(50),
    error_message TEXT,

    -- Timestamp
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Partition consideration: partition by day for high-volume systems
CREATE INDEX idx_api_request_logs_request ON api_request_logs(request_id);
CREATE INDEX idx_api_request_logs_tenant ON api_request_logs(tenant_id);
CREATE INDEX idx_api_request_logs_user ON api_request_logs(user_id);
CREATE INDEX idx_api_request_logs_path ON api_request_logs(path);
CREATE INDEX idx_api_request_logs_status ON api_request_logs(status_code);
CREATE INDEX idx_api_request_logs_time ON api_request_logs(created_at DESC);
CREATE INDEX idx_api_request_logs_errors ON api_request_logs(created_at DESC)
    WHERE status_code >= 400;

-- ============================================================================
-- Automatic Audit Logging Function
-- Generic function to automatically log changes
-- ============================================================================
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_changed_fields TEXT[];
    v_action VARCHAR(50);
    v_entity_name VARCHAR(500);
    v_actor_id UUID;
    v_tenant_id UUID;
BEGIN
    -- Determine action
    IF TG_OP = 'INSERT' THEN
        v_action := 'create';
        v_new_values := to_jsonb(NEW);
        v_old_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'update';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
        -- Get changed fields
        SELECT array_agg(key)
        INTO v_changed_fields
        FROM jsonb_each(v_new_values) n
        LEFT JOIN jsonb_each(v_old_values) o USING (key)
        WHERE n.value IS DISTINCT FROM o.value;
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'delete';
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;

    -- Try to get tenant_id from the record
    IF TG_OP = 'DELETE' THEN
        v_tenant_id := OLD.tenant_id;
    ELSE
        v_tenant_id := NEW.tenant_id;
    END IF;

    -- Try to get entity name (common patterns)
    IF TG_OP = 'DELETE' THEN
        v_entity_name := COALESCE(OLD.title, OLD.name, OLD.id::TEXT);
    ELSE
        v_entity_name := COALESCE(NEW.title, NEW.name, NEW.id::TEXT);
    END IF;

    -- Get actor from session context
    v_actor_id := NULLIF(current_setting('app.user_id', true), '')::UUID;

    -- Insert audit log
    INSERT INTO audit_logs (
        tenant_id,
        entity_type,
        entity_id,
        entity_name,
        action,
        old_values,
        new_values,
        changed_fields,
        actor_id,
        request_id,
        session_id,
        ip_address
    ) VALUES (
        v_tenant_id,
        TG_TABLE_NAME,
        COALESCE(NEW.id, OLD.id),
        v_entity_name,
        v_action,
        v_old_values,
        v_new_values,
        v_changed_fields,
        v_actor_id,
        NULLIF(current_setting('app.request_id', true), '')::UUID,
        NULLIF(current_setting('app.session_id', true), '')::UUID,
        NULLIF(current_setting('app.ip_address', true), '')::INET
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Apply Audit Triggers to Key Tables
-- ============================================================================

-- Proposals
CREATE TRIGGER audit_proposals
    AFTER INSERT OR UPDATE OR DELETE ON proposals
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Users
CREATE TRIGGER audit_users
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Budgets
CREATE TRIGGER audit_proposal_budgets
    AFTER INSERT OR UPDATE OR DELETE ON proposal_budgets
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Compliance
CREATE TRIGGER audit_proposal_compliance
    AFTER INSERT OR UPDATE OR DELETE ON proposal_compliance
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- IRB Protocols
CREATE TRIGGER audit_irb_protocols
    AFTER INSERT OR UPDATE OR DELETE ON irb_protocols
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- IACUC Protocols
CREATE TRIGGER audit_iacuc_protocols
    AFTER INSERT OR UPDATE OR DELETE ON iacuc_protocols
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- Tenants
CREATE TRIGGER audit_tenants
    AFTER INSERT OR UPDATE OR DELETE ON tenants
    FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();

-- ============================================================================
-- Audit Log Retention Function
-- Automatically archive/delete old audit logs
-- ============================================================================
CREATE OR REPLACE FUNCTION archive_old_audit_logs(
    p_retention_days INT DEFAULT 365,
    p_batch_size INT DEFAULT 10000
)
RETURNS INT AS $$
DECLARE
    v_deleted_count INT := 0;
    v_cutoff_date TIMESTAMPTZ;
BEGIN
    v_cutoff_date := NOW() - (p_retention_days || ' days')::INTERVAL;

    -- Delete in batches to avoid long locks
    LOOP
        WITH deleted AS (
            DELETE FROM audit_logs
            WHERE id IN (
                SELECT id FROM audit_logs
                WHERE created_at < v_cutoff_date
                ORDER BY created_at
                LIMIT p_batch_size
            )
            RETURNING id
        )
        SELECT COUNT(*) INTO v_deleted_count FROM deleted;

        EXIT WHEN v_deleted_count = 0;

        -- Commit between batches (requires autonomous transaction in practice)
        COMMIT;
    END LOOP;

    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Get audit history for an entity
CREATE OR REPLACE FUNCTION get_entity_audit_history(
    p_entity_type VARCHAR(100),
    p_entity_id UUID,
    p_limit INT DEFAULT 50
)
RETURNS TABLE (
    id UUID,
    action VARCHAR(50),
    actor_name VARCHAR(200),
    changed_fields TEXT[],
    old_values JSONB,
    new_values JSONB,
    reason TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.id,
        al.action,
        al.actor_name,
        al.changed_fields,
        al.old_values,
        al.new_values,
        al.reason,
        al.created_at
    FROM audit_logs al
    WHERE al.entity_type = p_entity_type
      AND al.entity_id = p_entity_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql STABLE;

-- Get user activity summary
CREATE OR REPLACE FUNCTION get_user_activity_summary(
    p_user_id UUID,
    p_days INT DEFAULT 30
)
RETURNS TABLE (
    action VARCHAR(50),
    entity_type VARCHAR(100),
    count BIGINT,
    last_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        al.action,
        al.entity_type,
        COUNT(*)::BIGINT,
        MAX(al.created_at)
    FROM audit_logs al
    WHERE al.actor_id = p_user_id
      AND al.created_at >= NOW() - (p_days || ' days')::INTERVAL
    GROUP BY al.action, al.entity_type
    ORDER BY COUNT(*) DESC;
END;
$$ LANGUAGE plpgsql STABLE;

-- ============================================================================
-- Comments
-- ============================================================================
COMMENT ON TABLE audit_logs IS 'Immutable audit trail for all system changes';
COMMENT ON TABLE user_sessions IS 'Active and historical user sessions';
COMMENT ON TABLE api_request_logs IS 'API request tracking for debugging and monitoring';
COMMENT ON FUNCTION audit_trigger_function IS 'Generic trigger function for automatic audit logging';
COMMENT ON FUNCTION get_entity_audit_history IS 'Retrieve audit history for a specific entity';
COMMENT ON FUNCTION get_user_activity_summary IS 'Get summary of user activity over time';
