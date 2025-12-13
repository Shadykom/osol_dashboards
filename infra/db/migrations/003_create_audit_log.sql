-- Migration: 003_create_audit_log
-- Description: Create audit log table for compliance and debugging
-- 
-- IMPORTANT: Audit logs are append-only and should never be deleted.
-- This table supports the regulator-first principle with evidence tracking.

-- ============================================================================
-- Audit Log Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
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

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_audit_log_tenant_id ON audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_action ON audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_log_resource ON audit_log(resource_type, resource_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_created_at ON audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_request_id ON audit_log(request_id);

-- ============================================================================
-- Enable RLS
-- ============================================================================

ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Policy: Users can only see audit logs in their own tenant
CREATE POLICY audit_log_tenant_isolation ON audit_log
    FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Policy: Allow inserts from the application (with tenant context)
CREATE POLICY audit_log_insert ON audit_log
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE audit_log IS 'Immutable audit trail for compliance - multi-tenant with RLS';
COMMENT ON COLUMN audit_log.action IS 'Action performed: create, read, update, delete, login, logout, etc.';
COMMENT ON COLUMN audit_log.resource_type IS 'Type of resource affected: user, case, customer, etc.';
COMMENT ON COLUMN audit_log.old_values IS 'Previous state of the resource (for updates)';
COMMENT ON COLUMN audit_log.new_values IS 'New state of the resource';
COMMENT ON COLUMN audit_log.request_id IS 'Request ID for correlating with API logs';

-- ============================================================================
-- Helper Function: Log Audit Event
-- ============================================================================

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
        tenant_id,
        user_id,
        action,
        resource_type,
        resource_id,
        old_values,
        new_values,
        metadata,
        request_id
    ) VALUES (
        p_tenant_id,
        p_user_id,
        p_action,
        p_resource_type,
        p_resource_id,
        p_old_values,
        p_new_values,
        p_metadata,
        p_request_id
    )
    RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION log_audit_event IS 'Helper function to insert audit log entries';
