-- Migration: 001_create_tenants
-- Description: Create tenants table (foundation for multi-tenancy)
-- 
-- IMPORTANT: The tenants table is the foundation for multi-tenant RLS.
-- Every tenant table must reference tenants(id) for data isolation.

-- ============================================================================
-- Enable UUID Extension
-- ============================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- Tenants Table
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

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_tenants_slug ON tenants(slug);
CREATE INDEX IF NOT EXISTS idx_tenants_status ON tenants(status);

-- ============================================================================
-- Updated At Trigger
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_tenants_updated_at
    BEFORE UPDATE ON tenants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE tenants IS 'Multi-tenant configuration - every tenant table references this';
COMMENT ON COLUMN tenants.id IS 'Unique tenant identifier (UUID)';
COMMENT ON COLUMN tenants.slug IS 'URL-friendly unique identifier for the tenant';
COMMENT ON COLUMN tenants.status IS 'Tenant lifecycle status: active, suspended, pending, inactive';
COMMENT ON COLUMN tenants.config IS 'Tenant-specific configuration (features, branding, limits, locale)';
