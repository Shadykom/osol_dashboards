-- =============================================================================
-- Migration 001: Create platform schema and tenants table
-- Description: Creates the platform schema and the tenants base table
-- EPIC 1 - Database Layer for CMS
-- =============================================================================

-- Create the platform schema
CREATE SCHEMA IF NOT EXISTS platform;

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- Table: platform.tenants
-- Description: Multi-tenant base table. Each tenant represents an organization.
-- Note: This table does NOT have tenant_id as it IS the tenant reference table.
-- =============================================================================
CREATE TABLE platform.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    default_language VARCHAR(10) NOT NULL DEFAULT 'en',
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Create index on status for filtering active tenants
CREATE INDEX idx_tenants_status ON platform.tenants(status);

-- Create index on name for lookups
CREATE INDEX idx_tenants_name ON platform.tenants(name);

-- =============================================================================
-- Trigger: Auto-update updated_at timestamp
-- =============================================================================
CREATE OR REPLACE FUNCTION platform.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_tenants_updated_at
    BEFORE UPDATE ON platform.tenants
    FOR EACH ROW
    EXECUTE FUNCTION platform.update_updated_at_column();

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON TABLE platform.tenants IS 'Multi-tenant base table - each row represents an organization';
COMMENT ON COLUMN platform.tenants.id IS 'Primary key - UUID';
COMMENT ON COLUMN platform.tenants.name IS 'Display name of the tenant/organization';
COMMENT ON COLUMN platform.tenants.status IS 'Tenant status: active, inactive, or suspended';
COMMENT ON COLUMN platform.tenants.default_language IS 'Default language code (e.g., en, ar)';
COMMENT ON COLUMN platform.tenants.timezone IS 'Default timezone for the tenant';
COMMENT ON COLUMN platform.tenants.created_at IS 'Timestamp when record was created';
COMMENT ON COLUMN platform.tenants.updated_at IS 'Timestamp when record was last updated';
COMMENT ON COLUMN platform.tenants.created_by IS 'UUID of user who created the record';
COMMENT ON COLUMN platform.tenants.updated_by IS 'UUID of user who last updated the record';
