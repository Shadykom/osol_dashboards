-- =============================================================================
-- Migration 002: Create org_units table
-- Description: Organizational hierarchy (HO -> CENTER -> BRANCH -> TEAM)
-- EPIC 1 - Database Layer for CMS
-- =============================================================================

-- =============================================================================
-- Table: platform.org_units
-- Description: Hierarchical organizational units within a tenant
-- =============================================================================
CREATE TABLE platform.org_units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES platform.org_units(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('HO', 'CENTER', 'BRANCH', 'TEAM')),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(100) NOT NULL,
    path TEXT, -- Materialized path for hierarchy (e.g., "HO001/CENTER001/BRANCH001")
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    -- Ensure code is unique within a tenant
    CONSTRAINT uq_org_units_tenant_code UNIQUE (tenant_id, code)
);

-- =============================================================================
-- Indexes
-- =============================================================================
-- Primary index for tenant filtering and parent lookups
CREATE INDEX idx_org_units_tenant_parent ON platform.org_units(tenant_id, parent_id);

-- Index for type-based queries
CREATE INDEX idx_org_units_tenant_type ON platform.org_units(tenant_id, type);

-- Index for path-based queries (for hierarchy traversal)
CREATE INDEX idx_org_units_path ON platform.org_units(path);

-- Index for code lookups
CREATE INDEX idx_org_units_tenant_code ON platform.org_units(tenant_id, code);

-- =============================================================================
-- Trigger: Auto-update updated_at timestamp
-- =============================================================================
CREATE TRIGGER trg_org_units_updated_at
    BEFORE UPDATE ON platform.org_units
    FOR EACH ROW
    EXECUTE FUNCTION platform.update_updated_at_column();

-- =============================================================================
-- Row Level Security (RLS)
-- =============================================================================
ALTER TABLE platform.org_units ENABLE ROW LEVEL SECURITY;

-- Policy: Tenant isolation - users can only see org_units belonging to their tenant
CREATE POLICY tenant_isolation_policy ON platform.org_units
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE platform.org_units IS 'Hierarchical organizational units within a tenant';
COMMENT ON COLUMN platform.org_units.id IS 'Primary key - UUID';
COMMENT ON COLUMN platform.org_units.tenant_id IS 'Foreign key to tenants table - required for multi-tenancy';
COMMENT ON COLUMN platform.org_units.parent_id IS 'Self-referencing FK for hierarchy; NULL for root (HO)';
COMMENT ON COLUMN platform.org_units.type IS 'Organization unit type: HO, CENTER, BRANCH, or TEAM';
COMMENT ON COLUMN platform.org_units.name IS 'Display name of the organizational unit';
COMMENT ON COLUMN platform.org_units.code IS 'Unique code within tenant for the org unit';
COMMENT ON COLUMN platform.org_units.path IS 'Materialized path for efficient hierarchy queries';
COMMENT ON COLUMN platform.org_units.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN platform.org_units.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN platform.org_units.created_by IS 'UUID of user who created the record';
COMMENT ON COLUMN platform.org_units.updated_by IS 'UUID of user who last updated the record';
