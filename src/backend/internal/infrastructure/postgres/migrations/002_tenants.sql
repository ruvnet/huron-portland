-- Migration: 002_tenants.sql
-- Description: Multi-tenant foundation with RLS support
-- Author: System
-- Created: 2026-01-25

-- ============================================================================
-- Tenants Table
-- Core multi-tenancy table storing organization/institution information
-- ============================================================================
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    subdomain VARCHAR(63) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    logo_url VARCHAR(500),
    primary_color VARCHAR(7) DEFAULT '#1976D2',
    settings JSONB DEFAULT '{}',
    feature_flags JSONB DEFAULT '{}',
    subscription_tier VARCHAR(50) DEFAULT 'standard',
    subscription_expires_at TIMESTAMPTZ,
    max_users INT DEFAULT 100,
    max_proposals INT DEFAULT 1000,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraints
    CONSTRAINT valid_subdomain CHECK (subdomain ~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?$'),
    CONSTRAINT valid_primary_color CHECK (primary_color ~ '^#[0-9A-Fa-f]{6}$')
);

-- Index for subdomain lookups (common in request routing)
CREATE UNIQUE INDEX idx_tenants_subdomain ON tenants(subdomain);
CREATE INDEX idx_tenants_is_active ON tenants(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- RLS Helper Function
-- Returns the current tenant ID from the session context
-- Set via: SET app.tenant_id = 'uuid-here';
-- ============================================================================
CREATE OR REPLACE FUNCTION current_tenant_id() RETURNS UUID AS $$
    SELECT NULLIF(current_setting('app.tenant_id', true), '')::UUID;
$$ LANGUAGE SQL STABLE;

-- ============================================================================
-- Updated At Trigger Function
-- Automatically updates the updated_at timestamp on row modification
-- ============================================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at trigger to tenants
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Tenant Domains Table
-- Allows multiple custom domains per tenant
-- ============================================================================
CREATE TABLE tenant_domains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    domain VARCHAR(255) NOT NULL,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(64),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),

    CONSTRAINT unique_domain UNIQUE (domain)
);

CREATE INDEX idx_tenant_domains_tenant ON tenant_domains(tenant_id);
CREATE INDEX idx_tenant_domains_domain ON tenant_domains(domain);

-- ============================================================================
-- Comments for documentation
-- ============================================================================
COMMENT ON TABLE tenants IS 'Multi-tenant organizations/institutions';
COMMENT ON COLUMN tenants.subdomain IS 'URL subdomain for tenant access (e.g., demo.app.com)';
COMMENT ON COLUMN tenants.settings IS 'Tenant-specific configuration as JSON';
COMMENT ON COLUMN tenants.feature_flags IS 'Feature toggles for gradual rollout';
COMMENT ON FUNCTION current_tenant_id() IS 'Returns the tenant ID from session context for RLS';
