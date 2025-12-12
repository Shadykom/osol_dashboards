-- =============================================================================
-- Migration 006: Create role_permissions table
-- Description: Maps roles to permissions within a tenant
-- EPIC 1 - Database Layer for CMS
-- =============================================================================

-- =============================================================================
-- Table: platform.role_permissions
-- Description: Junction table mapping roles to permissions
-- =============================================================================
CREATE TABLE platform.role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES platform.roles(id) ON DELETE CASCADE,
    permission_id UUID NOT NULL REFERENCES platform.permissions(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Ensure each role-permission combination is unique within a tenant
    CONSTRAINT uq_role_permissions_tenant_role_permission UNIQUE (tenant_id, role_id, permission_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================
-- Index for role-based permission lookups
CREATE INDEX idx_role_permissions_tenant_role ON platform.role_permissions(tenant_id, role_id);

-- Index for permission-based lookups (which roles have this permission)
CREATE INDEX idx_role_permissions_permission ON platform.role_permissions(permission_id);

-- =============================================================================
-- Trigger: Auto-update updated_at timestamp
-- =============================================================================
CREATE TRIGGER trg_role_permissions_updated_at
    BEFORE UPDATE ON platform.role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION platform.update_updated_at_column();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE platform.role_permissions ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant isolation - users can only see role_permissions belonging to their tenant
CREATE POLICY tenant_isolation_policy ON platform.role_permissions
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE platform.role_permissions IS 'Junction table mapping roles to permissions';
COMMENT ON COLUMN platform.role_permissions.id IS 'Primary key - UUID';
COMMENT ON COLUMN platform.role_permissions.tenant_id IS 'Foreign key to tenants table - required for multi-tenancy';
COMMENT ON COLUMN platform.role_permissions.role_id IS 'Foreign key to roles table';
COMMENT ON COLUMN platform.role_permissions.permission_id IS 'Foreign key to permissions table';
COMMENT ON COLUMN platform.role_permissions.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN platform.role_permissions.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN platform.role_permissions.created_by IS 'UUID of user who created the record';
COMMENT ON COLUMN platform.role_permissions.updated_by IS 'UUID of user who last updated the record';
