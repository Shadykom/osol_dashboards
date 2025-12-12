-- =============================================================================
-- Migration 005: Create permissions table
-- Description: Global permission catalog (no tenant_id - shared across all tenants)
-- EPIC 1 - Database Layer for CMS
-- =============================================================================

-- =============================================================================
-- Table: platform.permissions
-- Description: Global permission catalog - these are system-defined permissions
--              that all tenants can use. No tenant_id as this is a global catalog.
-- =============================================================================
CREATE TABLE platform.permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    description TEXT,
    category VARCHAR(100), -- For grouping permissions (e.g., 'users', 'reports', 'settings')
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================================
-- Indexes
-- =============================================================================
-- Index for code lookups
CREATE INDEX idx_permissions_code ON platform.permissions(code);

-- Index for category-based grouping
CREATE INDEX idx_permissions_category ON platform.permissions(category);

-- =============================================================================
-- Trigger: Auto-update updated_at timestamp
-- =============================================================================
CREATE TRIGGER trg_permissions_updated_at
    BEFORE UPDATE ON platform.permissions
    FOR EACH ROW
    EXECUTE FUNCTION platform.update_updated_at_column();

-- =============================================================================
-- NOTE: No RLS on this table - permissions are global and readable by all
-- =============================================================================

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE platform.permissions IS 'Global permission catalog - shared across all tenants';
COMMENT ON COLUMN platform.permissions.id IS 'Primary key - UUID';
COMMENT ON COLUMN platform.permissions.code IS 'Unique permission code (e.g., users.create, reports.view)';
COMMENT ON COLUMN platform.permissions.description IS 'Human-readable description of the permission';
COMMENT ON COLUMN platform.permissions.category IS 'Category for grouping permissions';
COMMENT ON COLUMN platform.permissions.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN platform.permissions.updated_at IS 'Timestamp when record was last updated';
