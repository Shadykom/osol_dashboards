-- ============================================================================
-- CMS EPIC 1: Platform Foundation - Supabase Setup
-- ============================================================================
-- 
-- Run this script in Supabase SQL Editor:
-- https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/sql/new
--
-- This creates the multi-tenant foundation with RLS policies.
-- ============================================================================

-- ============================================================================
-- 1. Enable UUID Extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 2. Create Tenants Table (Foundation for Multi-Tenancy)
-- ============================================================================

CREATE TABLE IF NOT EXISTS tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('active', 'suspended', 'pending', 'inactive')),
    config JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

COMMENT ON TABLE tenants IS 'Multi-tenant configuration - every tenant table references this';

-- ============================================================================
-- 3. Updated At Trigger Function
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_tenants_updated_at ON tenants;
CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 4. Create CMS Users Table (with RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS cms_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'readonly'
        CHECK (role IN ('super_admin', 'tenant_admin', 'manager', 'supervisor', 'officer', 'readonly')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('active', 'inactive', 'pending', 'locked')),
    permissions TEXT[] NOT NULL DEFAULT '{}',
    password_hash VARCHAR(255),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES cms_users(id),
    updated_by UUID REFERENCES cms_users(id),
    
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

CREATE INDEX IF NOT EXISTS idx_cms_users_tenant_id ON cms_users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_cms_users_email ON cms_users(email);
CREATE INDEX IF NOT EXISTS idx_cms_users_role ON cms_users(role);
CREATE INDEX IF NOT EXISTS idx_cms_users_status ON cms_users(status);

DROP TRIGGER IF EXISTS update_cms_users_updated_at ON cms_users;
CREATE TRIGGER update_cms_users_updated_at
    BEFORE UPDATE ON cms_users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE cms_users ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Tenant isolation
DROP POLICY IF EXISTS cms_users_tenant_isolation ON cms_users;
CREATE POLICY cms_users_tenant_isolation ON cms_users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

COMMENT ON TABLE cms_users IS 'CMS User accounts - multi-tenant with RLS';

-- ============================================================================
-- 5. Create Audit Log Table (with RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES cms_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL,
    resource_id UUID,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    request_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);

-- Enable RLS
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS audit_log_tenant_isolation ON audit_log;
CREATE POLICY audit_log_tenant_isolation ON audit_log
    FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS audit_log_insert ON audit_log;
CREATE POLICY audit_log_insert ON audit_log
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

COMMENT ON TABLE audit_log IS 'Immutable audit trail for compliance - multi-tenant with RLS';

-- ============================================================================
-- 6. Create System Config Table (Global - No RLS)
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

DROP TRIGGER IF EXISTS update_system_config_updated_at ON system_config;
CREATE TRIGGER update_system_config_updated_at
    BEFORE UPDATE ON system_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE system_config IS 'Global system configuration (no tenant isolation)';

-- ============================================================================
-- 7. Create Tenant Config Table (with RLS)
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

DROP TRIGGER IF EXISTS update_tenant_config_updated_at ON tenant_config;
CREATE TRIGGER update_tenant_config_updated_at
    BEFORE UPDATE ON tenant_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE tenant_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS tenant_config_tenant_isolation ON tenant_config;
CREATE POLICY tenant_config_tenant_isolation ON tenant_config
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

COMMENT ON TABLE tenant_config IS 'Per-tenant configuration - multi-tenant with RLS';

-- ============================================================================
-- 8. Create Feature Flags Table (with RLS)
-- ============================================================================

CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID REFERENCES tenants(id) ON DELETE CASCADE,
    feature_key VARCHAR(100) NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT FALSE,
    config JSONB DEFAULT '{}'::jsonb,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_feature_flag UNIQUE (tenant_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_feature_flags_tenant_id ON feature_flags(tenant_id);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(feature_key);

DROP TRIGGER IF EXISTS update_feature_flags_updated_at ON feature_flags;
CREATE TRIGGER update_feature_flags_updated_at
    BEFORE UPDATE ON feature_flags
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- See global flags OR tenant-specific flags
DROP POLICY IF EXISTS feature_flags_access ON feature_flags;
CREATE POLICY feature_flags_access ON feature_flags
    FOR SELECT
    USING (
        tenant_id IS NULL OR
        tenant_id = current_setting('app.current_tenant', true)::uuid
    );

-- Can only modify tenant-specific flags
DROP POLICY IF EXISTS feature_flags_modify ON feature_flags;
CREATE POLICY feature_flags_modify ON feature_flags
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

COMMENT ON TABLE feature_flags IS 'Feature toggles - global or per-tenant';

-- ============================================================================
-- 9. Helper Functions
-- ============================================================================

-- Get config value with tenant override
CREATE OR REPLACE FUNCTION get_config(
    p_key VARCHAR(100),
    p_tenant_id UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_value JSONB;
BEGIN
    IF p_tenant_id IS NOT NULL THEN
        SELECT value INTO v_value
        FROM tenant_config
        WHERE tenant_id = p_tenant_id AND key = p_key;
        
        IF v_value IS NOT NULL THEN
            RETURN v_value;
        END IF;
    END IF;
    
    SELECT value INTO v_value
    FROM system_config
    WHERE key = p_key;
    
    RETURN v_value;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check feature flag
CREATE OR REPLACE FUNCTION is_feature_enabled(
    p_feature_key VARCHAR(100),
    p_tenant_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_enabled BOOLEAN;
BEGIN
    IF p_tenant_id IS NOT NULL THEN
        SELECT enabled INTO v_enabled
        FROM feature_flags
        WHERE tenant_id = p_tenant_id AND feature_key = p_feature_key;
        
        IF v_enabled IS NOT NULL THEN
            RETURN v_enabled;
        END IF;
    END IF;
    
    SELECT enabled INTO v_enabled
    FROM feature_flags
    WHERE tenant_id IS NULL AND feature_key = p_feature_key;
    
    RETURN COALESCE(v_enabled, FALSE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Log audit event
CREATE OR REPLACE FUNCTION log_audit_event(
    p_tenant_id UUID,
    p_user_id UUID,
    p_action VARCHAR(100),
    p_resource_type VARCHAR(100),
    p_resource_id UUID DEFAULT NULL,
    p_old_values JSONB DEFAULT NULL,
    p_new_values JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb,
    p_request_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit_log (
        tenant_id, user_id, action, resource_type, resource_id,
        old_values, new_values, metadata, request_id
    ) VALUES (
        p_tenant_id, p_user_id, p_action, p_resource_type, p_resource_id,
        p_old_values, p_new_values, p_metadata, p_request_id
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- 10. Verify Setup
-- ============================================================================

SELECT 'EPIC 1 Schema Setup Complete!' AS status;

-- Show tables created
SELECT 
    tablename,
    CASE WHEN rowsecurity THEN 'Enabled' ELSE 'Disabled' END AS rls_status
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('tenants', 'cms_users', 'audit_log', 'system_config', 'tenant_config', 'feature_flags')
ORDER BY tablename;
