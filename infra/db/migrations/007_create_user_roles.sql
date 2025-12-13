-- =============================================================================
-- Migration 007: Create user_roles table
-- Description: Maps users to roles with optional org unit scope
-- EPIC 1 - Database Layer for CMS
-- =============================================================================

-- =============================================================================
-- Table: platform.user_roles
-- Description: Junction table mapping users to roles, with optional scope
--              The scope_org_unit_id allows limiting a role to a specific org unit
--              (e.g., user is SUPERVISOR only for BRANCH-001)
-- =============================================================================
CREATE TABLE platform.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES platform.users(id) ON DELETE CASCADE,
    role_id UUID NOT NULL REFERENCES platform.roles(id) ON DELETE CASCADE,
    scope_org_unit_id UUID REFERENCES platform.org_units(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Ensure each user-role-scope combination is unique within a tenant
    -- Note: COALESCE handles NULL scope_org_unit_id for uniqueness
    CONSTRAINT uq_user_roles_tenant_user_role_scope UNIQUE (tenant_id, user_id, role_id, scope_org_unit_id)
);

-- =============================================================================
-- Indexes
-- =============================================================================
-- Primary index for user permission lookups
CREATE INDEX idx_user_roles_tenant_user ON platform.user_roles(tenant_id, user_id);

-- Index for role-based user lookups
CREATE INDEX idx_user_roles_tenant_role ON platform.user_roles(tenant_id, role_id);

-- Index for scope-based queries
CREATE INDEX idx_user_roles_scope_org_unit ON platform.user_roles(scope_org_unit_id) 
    WHERE scope_org_unit_id IS NOT NULL;

-- Composite index for efficient permission checks
CREATE INDEX idx_user_roles_user_role_scope ON platform.user_roles(user_id, role_id, scope_org_unit_id);

-- =============================================================================
-- Trigger: Auto-update updated_at timestamp
-- =============================================================================
CREATE TRIGGER trg_user_roles_updated_at
    BEFORE UPDATE ON platform.user_roles
    FOR EACH ROW
    EXECUTE FUNCTION platform.update_updated_at_column();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE platform.user_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant isolation - users can only see user_roles belonging to their tenant
CREATE POLICY tenant_isolation_policy ON platform.user_roles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE platform.user_roles IS 'Junction table mapping users to roles with optional scope';
COMMENT ON COLUMN platform.user_roles.id IS 'Primary key - UUID';
COMMENT ON COLUMN platform.user_roles.tenant_id IS 'Foreign key to tenants table - required for multi-tenancy';
COMMENT ON COLUMN platform.user_roles.user_id IS 'Foreign key to users table';
COMMENT ON COLUMN platform.user_roles.role_id IS 'Foreign key to roles table';
COMMENT ON COLUMN platform.user_roles.scope_org_unit_id IS 'Optional: limits role to specific org unit and its children';
COMMENT ON COLUMN platform.user_roles.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN platform.user_roles.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN platform.user_roles.created_by IS 'UUID of user who created the record';
COMMENT ON COLUMN platform.user_roles.updated_by IS 'UUID of user who last updated the record';
