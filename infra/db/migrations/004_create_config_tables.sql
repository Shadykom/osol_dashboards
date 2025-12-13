-- Migration: 004_create_config_tables
-- Description: Configuration tables for config-driven architecture
-- 
-- IMPORTANT: These tables support the config-driven principle.
-- No hard-coded rules/limits/flows - everything is tenant configurable.

-- ============================================================================
-- System Config Table (Global settings - no tenant isolation)
-- ============================================================================

CREATE TABLE IF NOT EXISTS system_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    key VARCHAR(100) NOT NULL UNIQUE,
    value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE system_config IS 'Global system configuration (no tenant isolation)';
COMMENT ON COLUMN system_config.is_sensitive IS 'If true, value should be masked in API responses';

-- ============================================================================
-- Tenant Config Table (Per-tenant settings)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenant_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    key VARCHAR(100) NOT NULL,
    value JSONB NOT NULL,
    description TEXT,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_tenant_config_key UNIQUE (tenant_id, key)
);

CREATE INDEX IF NOT EXISTS idx_tenant_config_tenant_id ON tenant_config(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_config_key ON tenant_config(key);

CREATE TRIGGER update_tenant_config_updated_at
    BEFORE UPDATE ON tenant_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_config_tenant_isolation ON tenant_config
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

COMMENT ON TABLE tenant_config IS 'Per-tenant configuration - multi-tenant with RLS';

-- ============================================================================
-- Feature Flags Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE, -- NULL = global flag
    feature_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    config JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique per tenant (or global if tenant_id is NULL)
    CONSTRAINT unique_feature_flag UNIQUE (tenant_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant_id ON feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);

CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Policy: See global flags OR tenant-specific flags
CREATE POLICY feature_flags_access ON feature_flags
    FOR SELECT
    USING (
        tenant_id IS NULL OR
        tenant_id = current_setting('app.current_tenant', true)::uuid
    );

-- Policy: Can only modify tenant-specific flags
CREATE POLICY feature_flags_modify ON feature_flags
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

COMMENT ON TABLE feature_flags IS 'Feature toggles - global or per-tenant';
COMMENT ON COLUMN feature_flags.tenant_id IS 'NULL = global flag, UUID = tenant-specific override';

-- ============================================================================
-- Helper Function: Get Config Value
-- ============================================================================

CREATE OR REPLACE FUNCTION get_config(
    p_key VARCHAR(100),
    p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    -- First try tenant-specific config
    IF p_tenant_id IS NOT NULL THEN
        SELECT value INTO v_value
        FROM tenant_config
        WHERE tenant_id = p_tenant_id AND key = p_key;
        
        IF v_value IS NOT NULL THEN
            RETURN v_value;
        END IF;
    END IF;
    
    -- Fall back to system config
    SELECT value INTO v_value
    FROM system_config
    WHERE key = p_key;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_config IS 'Get configuration value with tenant override support';

-- ============================================================================
-- Helper Function: Check Feature Flag
-- ============================================================================

CREATE OR REPLACE FUNCTION is_feature_enabled(
    p_feature_key VARCHAR(100),
    p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_enabled BOOLEAN;
BEGIN
    -- First check tenant-specific flag
    IF p_tenant_id IS NOT NULL THEN
        SELECT enabled INTO v_enabled
        FROM feature_flags
        WHERE tenant_id = p_tenant_id AND feature_key = p_feature_key;
        
        IF v_enabled IS NOT NULL THEN
            RETURN v_enabled;
        END IF;
    END IF;
    
    -- Fall back to global flag
    SELECT enabled INTO v_enabled
    FROM feature_flags
    WHERE tenant_id IS NULL AND feature_key = p_feature_key;
    
    RETURN COALESCE(v_enabled, FALSE);
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION is_feature_enabled IS 'Check if a feature is enabled (with tenant override)';
