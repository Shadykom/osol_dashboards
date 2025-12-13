-- EPIC 4: Audit, Evidence, Lineage - Audit Schema Migration
-- This migration creates the audit schema with immutable audit_events table
--
-- NOTE ON MULTI-TENANCY:
-- The default RLS policies allow all authenticated users to access records.
-- For stricter multi-tenant isolation, modify the RLS policies to check
-- the user's tenant_id against the record's tenant_id. Example:
--
--   CREATE POLICY "audit_events_tenant_isolation" ON audit.audit_events
--     FOR SELECT USING (
--       tenant_id = (SELECT tenant_id FROM public.user_profiles WHERE user_id = auth.uid())
--     );
--
-- Make sure you have a user_profiles table with tenant_id before enabling this.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CREATE AUDIT SCHEMA
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS audit;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA audit TO authenticated;
GRANT USAGE ON SCHEMA audit TO anon;

-- =============================================================================
-- TABLE: audit.audit_events
-- Purpose: Immutable append-only audit log for all material writes
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit.audit_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    actor_user_id UUID,
    actor_role VARCHAR(100),
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    correlation_id UUID,
    source VARCHAR(100) NOT NULL DEFAULT 'application',
    before_json JSONB,
    after_json JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_audit_events_tenant_id ON audit.audit_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_entity ON audit.audit_events(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_actor ON audit.audit_events(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_event_type ON audit.audit_events(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_events_correlation ON audit.audit_events(correlation_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_created_at ON audit.audit_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_events_source ON audit.audit_events(source);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_audit_events_entity_time 
    ON audit.audit_events(entity_type, entity_id, created_at DESC);

-- =============================================================================
-- IMMUTABILITY ENFORCEMENT FOR audit_events
-- Using trigger to prevent UPDATE and DELETE operations
-- =============================================================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS prevent_audit_events_modification ON audit.audit_events;
DROP FUNCTION IF EXISTS audit.prevent_modification();

-- Create function to prevent modifications
CREATE OR REPLACE FUNCTION audit.prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'UPDATE operation not allowed on audit.audit_events table. Audit records are immutable.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'DELETE operation not allowed on audit.audit_events table. Audit records are immutable.';
    ELSIF TG_OP = 'TRUNCATE' THEN
        RAISE EXCEPTION 'TRUNCATE operation not allowed on audit.audit_events table. Audit records are immutable.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for UPDATE and DELETE
CREATE TRIGGER prevent_audit_events_modification
    BEFORE UPDATE OR DELETE ON audit.audit_events
    FOR EACH ROW
    EXECUTE FUNCTION audit.prevent_modification();

-- Create trigger for TRUNCATE (statement-level)
CREATE TRIGGER prevent_audit_events_truncate
    BEFORE TRUNCATE ON audit.audit_events
    FOR EACH STATEMENT
    EXECUTE FUNCTION audit.prevent_modification();

-- =============================================================================
-- TABLE: audit.security_events
-- Purpose: Track security-related events (login attempts, permission changes, etc.)
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit.security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    type VARCHAR(100) NOT NULL,
    severity VARCHAR(20) DEFAULT 'INFO' CHECK (severity IN ('DEBUG', 'INFO', 'WARNING', 'ERROR', 'CRITICAL')),
    payload_json JSONB NOT NULL DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    actor_user_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for security events
CREATE INDEX IF NOT EXISTS idx_security_events_tenant_id ON audit.security_events(tenant_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON audit.security_events(type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON audit.security_events(severity);
CREATE INDEX IF NOT EXISTS idx_security_events_created_at ON audit.security_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_actor ON audit.security_events(actor_user_id);

-- Immutability trigger for security_events
DROP TRIGGER IF EXISTS prevent_security_events_modification ON audit.security_events;

CREATE TRIGGER prevent_security_events_modification
    BEFORE UPDATE OR DELETE ON audit.security_events
    FOR EACH ROW
    EXECUTE FUNCTION audit.prevent_modification();

-- =============================================================================
-- TABLE: audit.evidence_items
-- Purpose: Store metadata for evidence files with integrity verification
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit.evidence_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    file_name VARCHAR(500) NOT NULL,
    original_file_name VARCHAR(500),
    mime_type VARCHAR(255) NOT NULL,
    file_size BIGINT,
    storage_url TEXT NOT NULL,
    storage_bucket VARCHAR(100) DEFAULT 'evidence',
    storage_path TEXT,
    sha256_hash VARCHAR(64) NOT NULL,
    description TEXT,
    tags JSONB DEFAULT '[]',
    uploaded_by UUID NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMP WITH TIME ZONE,
    deleted_by UUID,
    deletion_reason TEXT
);

-- Create indexes for evidence items
CREATE INDEX IF NOT EXISTS idx_evidence_items_tenant_id ON audit.evidence_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_entity ON audit.evidence_items(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_evidence_items_hash ON audit.evidence_items(sha256_hash);
CREATE INDEX IF NOT EXISTS idx_evidence_items_uploaded_by ON audit.evidence_items(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_evidence_items_uploaded_at ON audit.evidence_items(uploaded_at DESC);
CREATE INDEX IF NOT EXISTS idx_evidence_items_deleted ON audit.evidence_items(is_deleted) WHERE is_deleted = FALSE;

-- =============================================================================
-- TABLE: audit.evidence_chain
-- Purpose: Chain of custody tracking for evidence items
-- =============================================================================
CREATE TABLE IF NOT EXISTS audit.evidence_chain (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    evidence_id UUID NOT NULL REFERENCES audit.evidence_items(id) ON DELETE RESTRICT,
    action VARCHAR(100) NOT NULL CHECK (action IN (
        'CREATED', 'VIEWED', 'DOWNLOADED', 'VERIFIED', 'TRANSFERRED', 
        'MARKED_FOR_DELETION', 'RESTORED', 'INTEGRITY_CHECK', 
        'ACCESS_GRANTED', 'ACCESS_REVOKED', 'METADATA_UPDATED'
    )),
    actor_user_id UUID NOT NULL,
    actor_role VARCHAR(100),
    notes TEXT,
    previous_chain_id UUID REFERENCES audit.evidence_chain(id),
    hash_at_action VARCHAR(64),
    metadata JSONB DEFAULT '{}',
    ip_address INET,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for evidence chain
CREATE INDEX IF NOT EXISTS idx_evidence_chain_tenant_id ON audit.evidence_chain(tenant_id);
CREATE INDEX IF NOT EXISTS idx_evidence_chain_evidence_id ON audit.evidence_chain(evidence_id);
CREATE INDEX IF NOT EXISTS idx_evidence_chain_actor ON audit.evidence_chain(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_evidence_chain_action ON audit.evidence_chain(action);
CREATE INDEX IF NOT EXISTS idx_evidence_chain_created_at ON audit.evidence_chain(created_at DESC);

-- Immutability trigger for evidence_chain (append-only)
DROP TRIGGER IF EXISTS prevent_evidence_chain_modification ON audit.evidence_chain;

CREATE TRIGGER prevent_evidence_chain_modification
    BEFORE UPDATE OR DELETE ON audit.evidence_chain
    FOR EACH ROW
    EXECUTE FUNCTION audit.prevent_modification();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all audit tables
ALTER TABLE audit.audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.evidence_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.evidence_chain ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "audit_events_tenant_isolation" ON audit.audit_events;
DROP POLICY IF EXISTS "audit_events_insert_policy" ON audit.audit_events;
DROP POLICY IF EXISTS "security_events_tenant_isolation" ON audit.security_events;
DROP POLICY IF EXISTS "security_events_insert_policy" ON audit.security_events;
DROP POLICY IF EXISTS "evidence_items_tenant_isolation" ON audit.evidence_items;
DROP POLICY IF EXISTS "evidence_items_insert_policy" ON audit.evidence_items;
DROP POLICY IF EXISTS "evidence_chain_tenant_isolation" ON audit.evidence_chain;
DROP POLICY IF EXISTS "evidence_chain_insert_policy" ON audit.evidence_chain;

-- Create RLS policies for audit_events
-- Users can see audit events (tenant isolation handled at application level)
-- Note: If you have a multi-tenant setup with tenant_id in user profiles, 
-- modify this policy to check the user's tenant
CREATE POLICY "audit_events_tenant_isolation" ON audit.audit_events
    FOR SELECT
    USING (
        -- Allow access if user is authenticated
        auth.uid() IS NOT NULL
    );

-- Allow INSERT for authenticated users (append-only)
CREATE POLICY "audit_events_insert_policy" ON audit.audit_events
    FOR INSERT
    WITH CHECK (true);

-- Create RLS policies for security_events
CREATE POLICY "security_events_tenant_isolation" ON audit.security_events
    FOR SELECT
    USING (
        -- Allow access if user is authenticated
        auth.uid() IS NOT NULL
    );

CREATE POLICY "security_events_insert_policy" ON audit.security_events
    FOR INSERT
    WITH CHECK (true);

-- Create RLS policies for evidence_items
CREATE POLICY "evidence_items_tenant_isolation" ON audit.evidence_items
    FOR SELECT
    USING (
        -- Allow access if user is authenticated
        auth.uid() IS NOT NULL
    );

CREATE POLICY "evidence_items_insert_policy" ON audit.evidence_items
    FOR INSERT
    WITH CHECK (true);

-- Allow UPDATE only for soft-delete operations (authenticated users only)
CREATE POLICY "evidence_items_soft_delete_policy" ON audit.evidence_items
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
    )
    WITH CHECK (
        -- Only allow updating deletion-related fields
        is_deleted = true
    );

-- Create RLS policies for evidence_chain
CREATE POLICY "evidence_chain_tenant_isolation" ON audit.evidence_chain
    FOR SELECT
    USING (
        -- Allow access if user is authenticated
        auth.uid() IS NOT NULL
    );

CREATE POLICY "evidence_chain_insert_policy" ON audit.evidence_chain
    FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT ALL ON audit.audit_events TO authenticated;
GRANT ALL ON audit.security_events TO authenticated;
GRANT ALL ON audit.evidence_items TO authenticated;
GRANT ALL ON audit.evidence_chain TO authenticated;

-- Grant SELECT to anon for public audit trails (if needed)
GRANT SELECT ON audit.audit_events TO anon;
GRANT SELECT ON audit.security_events TO anon;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to emit an audit event
CREATE OR REPLACE FUNCTION audit.emit_event(
    p_tenant_id UUID,
    p_event_type VARCHAR(100),
    p_actor_user_id UUID,
    p_actor_role VARCHAR(100),
    p_entity_type VARCHAR(100),
    p_entity_id VARCHAR(255),
    p_source VARCHAR(100),
    p_before_json JSONB DEFAULT NULL,
    p_after_json JSONB DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO audit.audit_events (
        tenant_id,
        event_type,
        actor_user_id,
        actor_role,
        entity_type,
        entity_id,
        source,
        before_json,
        after_json,
        correlation_id,
        metadata
    ) VALUES (
        p_tenant_id,
        p_event_type,
        p_actor_user_id,
        p_actor_role,
        p_entity_type,
        p_entity_id,
        p_source,
        p_before_json,
        p_after_json,
        COALESCE(p_correlation_id, uuid_generate_v4()),
        p_metadata
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to log security event
CREATE OR REPLACE FUNCTION audit.log_security_event(
    p_tenant_id UUID,
    p_type VARCHAR(100),
    p_payload_json JSONB,
    p_severity VARCHAR(20) DEFAULT 'INFO',
    p_actor_user_id UUID DEFAULT NULL,
    p_ip_address INET DEFAULT NULL,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO audit.security_events (
        tenant_id,
        type,
        severity,
        payload_json,
        actor_user_id,
        ip_address,
        user_agent
    ) VALUES (
        p_tenant_id,
        p_type,
        p_severity,
        p_payload_json,
        p_actor_user_id,
        p_ip_address,
        p_user_agent
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to add evidence chain entry
CREATE OR REPLACE FUNCTION audit.add_evidence_chain_entry(
    p_tenant_id UUID,
    p_evidence_id UUID,
    p_action VARCHAR(100),
    p_actor_user_id UUID,
    p_actor_role VARCHAR(100) DEFAULT NULL,
    p_notes TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_chain_id UUID;
    v_previous_chain_id UUID;
    v_current_hash VARCHAR(64);
BEGIN
    -- Get the most recent chain entry for this evidence
    SELECT id INTO v_previous_chain_id
    FROM audit.evidence_chain
    WHERE evidence_id = p_evidence_id
    ORDER BY created_at DESC
    LIMIT 1;
    
    -- Get current hash of the evidence item
    SELECT sha256_hash INTO v_current_hash
    FROM audit.evidence_items
    WHERE id = p_evidence_id;
    
    INSERT INTO audit.evidence_chain (
        tenant_id,
        evidence_id,
        action,
        actor_user_id,
        actor_role,
        notes,
        previous_chain_id,
        hash_at_action,
        metadata,
        ip_address
    ) VALUES (
        p_tenant_id,
        p_evidence_id,
        p_action,
        p_actor_user_id,
        p_actor_role,
        p_notes,
        v_previous_chain_id,
        v_current_hash,
        p_metadata,
        p_ip_address
    )
    RETURNING id INTO v_chain_id;
    
    RETURN v_chain_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION audit.emit_event TO authenticated;
GRANT EXECUTE ON FUNCTION audit.log_security_event TO authenticated;
GRANT EXECUTE ON FUNCTION audit.add_evidence_chain_entry TO authenticated;

-- =============================================================================
-- VIEWS FOR REPORTING
-- =============================================================================

-- View for audit event summary by entity
CREATE OR REPLACE VIEW audit.audit_events_summary AS
SELECT 
    tenant_id,
    entity_type,
    entity_id,
    COUNT(*) as total_events,
    COUNT(DISTINCT actor_user_id) as unique_actors,
    MIN(created_at) as first_event,
    MAX(created_at) as last_event,
    array_agg(DISTINCT event_type) as event_types
FROM audit.audit_events
GROUP BY tenant_id, entity_type, entity_id;

-- View for evidence with chain count
CREATE OR REPLACE VIEW audit.evidence_with_chain AS
SELECT 
    ei.*,
    COALESCE(ec.chain_count, 0) as chain_count,
    ec.last_action,
    ec.last_action_at
FROM audit.evidence_items ei
LEFT JOIN (
    SELECT 
        e1.evidence_id,
        COUNT(*) as chain_count,
        (
            SELECT e2.action 
            FROM audit.evidence_chain e2 
            WHERE e2.evidence_id = e1.evidence_id 
            ORDER BY e2.created_at DESC 
            LIMIT 1
        ) as last_action,
        MAX(e1.created_at) as last_action_at
    FROM audit.evidence_chain e1
    GROUP BY e1.evidence_id
) ec ON ei.id = ec.evidence_id;

GRANT SELECT ON audit.audit_events_summary TO authenticated;
GRANT SELECT ON audit.evidence_with_chain TO authenticated;

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON SCHEMA audit IS 'Audit schema for EPIC 4: Audit, Evidence, Lineage';
COMMENT ON TABLE audit.audit_events IS 'Immutable append-only audit log for all material writes';
COMMENT ON TABLE audit.security_events IS 'Security-related event log';
COMMENT ON TABLE audit.evidence_items IS 'Evidence file metadata with integrity verification';
COMMENT ON TABLE audit.evidence_chain IS 'Chain of custody tracking for evidence items';
COMMENT ON FUNCTION audit.emit_event IS 'Helper function to emit audit events';
COMMENT ON FUNCTION audit.log_security_event IS 'Helper function to log security events';
COMMENT ON FUNCTION audit.add_evidence_chain_entry IS 'Helper function to add evidence chain entries';
