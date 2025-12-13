-- =============================================================================
-- Migration 004: Create roles table
-- Description: Role definitions per tenant
-- EPIC 1 - Database Layer for CMS
-- =============================================================================

-- =============================================================================
-- Table: platform.roles
-- Description: Role definitions - each tenant can define their own roles
-- =============================================================================
CREATE TABLE platform.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Role name must be unique within a tenant
    CONSTRAINT uq_roles_tenant_name UNIQUE (tenant_id, name)
);

-- =============================================================================
-- Indexes
-- =============================================================================
-- Index for tenant-based role lookups
CREATE INDEX idx_roles_tenant_id ON platform.roles(tenant_id);

-- Index for role name searches
CREATE INDEX idx_roles_tenant_name ON platform.roles(tenant_id, name);

-- =============================================================================
-- Trigger: Auto-update updated_at timestamp
-- =============================================================================
CREATE TRIGGER trg_roles_updated_at
    BEFORE UPDATE ON platform.roles
    FOR EACH ROW
    EXECUTE FUNCTION platform.update_updated_at_column();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE platform.roles ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant isolation - users can only see roles belonging to their tenant
CREATE POLICY tenant_isolation_policy ON platform.roles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE platform.roles IS 'Role definitions per tenant';
COMMENT ON COLUMN platform.roles.id IS 'Primary key - UUID';
COMMENT ON COLUMN platform.roles.tenant_id IS 'Foreign key to tenants table - required for multi-tenancy';
COMMENT ON COLUMN platform.roles.name IS 'Role name - unique within tenant';
COMMENT ON COLUMN platform.roles.description IS 'Optional description of the role';
COMMENT ON COLUMN platform.roles.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN platform.roles.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN platform.roles.created_by IS 'UUID of user who created the record';
COMMENT ON COLUMN platform.roles.updated_by IS 'UUID of user who last updated the record';
