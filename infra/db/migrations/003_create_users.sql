-- =============================================================================
-- Migration 003: Create users table
-- Description: User accounts within tenants
-- EPIC 1 - Database Layer for CMS
-- =============================================================================

-- =============================================================================
-- Table: platform.users
-- Description: User accounts - one user belongs to one tenant
-- =============================================================================
CREATE TABLE platform.users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    external_id VARCHAR(255), -- External identity provider ID (e.g., Auth0, Supabase Auth)
    email VARCHAR(255) NOT NULL,
    display_name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'pending')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Email must be unique within a tenant
    CONSTRAINT uq_users_tenant_email UNIQUE (tenant_id, email)
);

-- =============================================================================
-- Indexes
-- =============================================================================
-- Primary index for tenant filtering and email lookups
CREATE INDEX idx_users_tenant_email ON platform.users(tenant_id, email);

-- Index for external_id lookups (for SSO/Auth provider integration)
CREATE INDEX idx_users_external_id ON platform.users(external_id) WHERE external_id IS NOT NULL;

-- Index for status-based queries
CREATE INDEX idx_users_tenant_status ON platform.users(tenant_id, status);

-- =============================================================================
-- Trigger: Auto-update updated_at timestamp
-- =============================================================================
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON platform.users
    FOR EACH ROW
    EXECUTE FUNCTION platform.update_updated_at_column();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE platform.users ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant isolation - users can only see users belonging to their tenant
CREATE POLICY tenant_isolation_policy ON platform.users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE platform.users IS 'User accounts within a tenant';
COMMENT ON COLUMN platform.users.id IS 'Primary key - UUID';
COMMENT ON COLUMN platform.users.tenant_id IS 'Foreign key to tenants table - required for multi-tenancy';
COMMENT ON COLUMN platform.users.external_id IS 'External identity provider ID (nullable)';
COMMENT ON COLUMN platform.users.email IS 'User email address - unique within tenant';
COMMENT ON COLUMN platform.users.display_name IS 'User display name';
COMMENT ON COLUMN platform.users.status IS 'User status: active, inactive, suspended, or pending';
COMMENT ON COLUMN platform.users.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN platform.users.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN platform.users.created_by IS 'UUID of user who created the record';
COMMENT ON COLUMN platform.users.updated_by IS 'UUID of user who last updated the record';
