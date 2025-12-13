-- Migration: 002_create_users
-- Description: Create users table with tenant isolation
-- 
-- IMPORTANT: This is a multi-tenant table with RLS enabled.
-- All queries MUST set app.current_tenant before accessing.

-- ============================================================================
-- Users Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'readonly'
        CHECK (role IN ('super_admin', 'tenant_admin', 'manager', 'supervisor', 'officer', 'readonly')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending'
        CHECK (status IN ('active', 'inactive', 'pending', 'locked')),
    permissions TEXT[] NOT NULL DEFAULT '{}',
    password_hash VARCHAR(255), -- NULL for SSO users
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID REFERENCES users(id),
    updated_by UUID REFERENCES users(id),
    
    -- Unique email per tenant
    CONSTRAINT unique_email_per_tenant UNIQUE (tenant_id, email)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_tenant_id ON users(tenant_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

-- ============================================================================
-- Updated At Trigger
-- ============================================================================

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can only see users in their own tenant
CREATE POLICY users_tenant_isolation ON users
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE users IS 'User accounts - multi-tenant with RLS';
COMMENT ON COLUMN users.tenant_id IS 'Tenant this user belongs to - REQUIRED for RLS';
COMMENT ON COLUMN users.role IS 'User role for RBAC: super_admin, tenant_admin, manager, supervisor, officer, readonly';
COMMENT ON COLUMN users.permissions IS 'Array of permission strings (format: action:resource)';
