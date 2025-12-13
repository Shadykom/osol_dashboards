-- EPIC 4: Audit, Evidence, Lineage - RPC Functions Migration
-- This migration creates RPC functions for API access to audit and lineage
--
-- NOTE: Run these migrations IN ORDER:
--   1. 001_create_audit_schema.sql
--   2. 002_create_lineage_schema.sql
--   3. 003_create_rpc_functions.sql (this file)

-- =============================================================================
-- AUDIT SCHEMA RPC FUNCTIONS
-- =============================================================================

-- Function to get audit events with filters
CREATE OR REPLACE FUNCTION public.get_audit_events(
    p_entity_type VARCHAR(100) DEFAULT NULL,
    p_entity_id VARCHAR(255) DEFAULT NULL,
    p_event_type VARCHAR(100) DEFAULT NULL,
    p_actor_user_id UUID DEFAULT NULL,
    p_tenant_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    tenant_id UUID,
    event_type VARCHAR(100),
    actor_user_id UUID,
    actor_role VARCHAR(100),
    entity_type VARCHAR(100),
    entity_id VARCHAR(255),
    correlation_id UUID,
    source VARCHAR(100),
    before_json JSONB,
    after_json JSONB,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ae.id,
        ae.tenant_id,
        ae.event_type,
        ae.actor_user_id,
        ae.actor_role,
        ae.entity_type,
        ae.entity_id,
        ae.correlation_id,
        ae.source,
        ae.before_json,
        ae.after_json,
        ae.metadata,
        ae.created_at
    FROM audit.audit_events ae
    WHERE (p_entity_type IS NULL OR ae.entity_type = p_entity_type)
      AND (p_entity_id IS NULL OR ae.entity_id = p_entity_id)
      AND (p_event_type IS NULL OR ae.event_type = p_event_type)
      AND (p_actor_user_id IS NULL OR ae.actor_user_id = p_actor_user_id)
      AND (p_tenant_id IS NULL OR ae.tenant_id = p_tenant_id)
    ORDER BY ae.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to emit audit event via RPC
CREATE OR REPLACE FUNCTION public.audit_emit_event(
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
        COALESCE(p_source, 'application'),
        p_before_json,
        p_after_json,
        COALESCE(p_correlation_id, uuid_generate_v4()),
        p_metadata
    )
    RETURNING id INTO v_event_id;
    
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- EVIDENCE RPC FUNCTIONS
-- =============================================================================

-- Function to create evidence item
CREATE OR REPLACE FUNCTION public.create_evidence_item(
    p_tenant_id UUID,
    p_entity_type VARCHAR(100),
    p_entity_id VARCHAR(255),
    p_file_name VARCHAR(500),
    p_original_file_name VARCHAR(500),
    p_mime_type VARCHAR(255),
    p_file_size BIGINT,
    p_storage_url TEXT,
    p_storage_bucket VARCHAR(100),
    p_storage_path TEXT,
    p_sha256_hash VARCHAR(64),
    p_uploaded_by UUID,
    p_description TEXT DEFAULT NULL,
    p_tags TEXT DEFAULT '[]'
)
RETURNS UUID AS $$
DECLARE
    v_evidence_id UUID;
BEGIN
    INSERT INTO audit.evidence_items (
        tenant_id,
        entity_type,
        entity_id,
        file_name,
        original_file_name,
        mime_type,
        file_size,
        storage_url,
        storage_bucket,
        storage_path,
        sha256_hash,
        description,
        tags,
        uploaded_by
    ) VALUES (
        p_tenant_id,
        p_entity_type,
        p_entity_id,
        p_file_name,
        p_original_file_name,
        p_mime_type,
        p_file_size,
        p_storage_url,
        p_storage_bucket,
        p_storage_path,
        p_sha256_hash,
        p_description,
        p_tags::jsonb,
        p_uploaded_by
    )
    RETURNING id INTO v_evidence_id;
    
    -- Create initial chain entry
    INSERT INTO audit.evidence_chain (
        tenant_id,
        evidence_id,
        action,
        actor_user_id,
        notes,
        hash_at_action
    ) VALUES (
        p_tenant_id,
        v_evidence_id,
        'CREATED',
        p_uploaded_by,
        'Evidence file uploaded',
        p_sha256_hash
    );
    
    RETURN v_evidence_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to create evidence chain entry
CREATE OR REPLACE FUNCTION public.create_evidence_chain_entry(
    p_tenant_id UUID,
    p_evidence_id UUID,
    p_action VARCHAR(100),
    p_actor_user_id UUID,
    p_notes TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
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
        notes,
        previous_chain_id,
        hash_at_action,
        metadata
    ) VALUES (
        p_tenant_id,
        p_evidence_id,
        p_action,
        p_actor_user_id,
        p_notes,
        v_previous_chain_id,
        v_current_hash,
        p_metadata
    )
    RETURNING id INTO v_chain_id;
    
    RETURN v_chain_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- LINEAGE RPC FUNCTIONS
-- =============================================================================

-- Function to create decision trace
CREATE OR REPLACE FUNCTION public.lineage_create_trace(
    p_tenant_id UUID,
    p_trace_type VARCHAR(50),
    p_input_json JSONB,
    p_output_json JSONB DEFAULT '{}',
    p_explanation TEXT DEFAULT NULL,
    p_decision_result VARCHAR(100) DEFAULT NULL,
    p_actor_user_id UUID DEFAULT NULL,
    p_actor_system VARCHAR(100) DEFAULT 'application',
    p_trace_ref_id VARCHAR(255) DEFAULT NULL,
    p_confidence_score DECIMAL DEFAULT NULL,
    p_reasoning_json JSONB DEFAULT '{}',
    p_factors_json JSONB DEFAULT '[]',
    p_version VARCHAR(50) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_trace_id UUID;
BEGIN
    INSERT INTO lineage.decision_traces (
        tenant_id,
        trace_type,
        trace_ref_id,
        input_json,
        output_json,
        decision_result,
        confidence_score,
        explanation,
        reasoning_json,
        factors_json,
        actor_user_id,
        actor_system,
        version,
        metadata,
        started_at,
        completed_at
    ) VALUES (
        p_tenant_id,
        p_trace_type,
        p_trace_ref_id,
        p_input_json,
        p_output_json,
        p_decision_result,
        p_confidence_score,
        p_explanation,
        p_reasoning_json,
        p_factors_json,
        p_actor_user_id,
        p_actor_system,
        p_version,
        p_metadata,
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP
    )
    RETURNING id INTO v_trace_id;
    
    RETURN v_trace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link trace to entity
CREATE OR REPLACE FUNCTION public.lineage_link_trace(
    p_tenant_id UUID,
    p_trace_id UUID,
    p_entity_type VARCHAR(100),
    p_entity_id VARCHAR(255),
    p_link_type VARCHAR(50) DEFAULT 'AFFECTS',
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_link_id UUID;
BEGIN
    INSERT INTO lineage.trace_links (
        tenant_id,
        trace_id,
        entity_type,
        entity_id,
        link_type,
        relationship_metadata
    ) VALUES (
        p_tenant_id,
        p_trace_id,
        p_entity_type,
        p_entity_id,
        p_link_type,
        p_metadata
    )
    RETURNING id INTO v_link_id;
    
    RETURN v_link_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get full trace with links
CREATE OR REPLACE FUNCTION public.lineage_get_full_trace(p_trace_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT jsonb_build_object(
        'trace', to_jsonb(dt.*),
        'linked_entities', COALESCE((
            SELECT jsonb_agg(jsonb_build_object(
                'entity_type', tl.entity_type,
                'entity_id', tl.entity_id,
                'link_type', tl.link_type,
                'metadata', tl.relationship_metadata
            ))
            FROM lineage.trace_links tl
            WHERE tl.trace_id = dt.id
        ), '[]'::jsonb),
        'parent_traces', COALESCE((
            SELECT jsonb_agg(td.parent_trace_id)
            FROM lineage.trace_dependencies td
            WHERE td.child_trace_id = dt.id
        ), '[]'::jsonb),
        'child_traces', COALESCE((
            SELECT jsonb_agg(td.child_trace_id)
            FROM lineage.trace_dependencies td
            WHERE td.parent_trace_id = dt.id
        ), '[]'::jsonb)
    ) INTO v_result
    FROM lineage.decision_traces dt
    WHERE dt.id = p_trace_id;
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get traces for an entity
CREATE OR REPLACE FUNCTION public.lineage_get_entity_traces(
    p_entity_type VARCHAR(100),
    p_entity_id VARCHAR(255),
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    trace_id UUID,
    trace_type VARCHAR(50),
    trace_ref_id VARCHAR(255),
    decision_result VARCHAR(100),
    explanation TEXT,
    link_type VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        dt.id as trace_id,
        dt.trace_type,
        dt.trace_ref_id,
        dt.decision_result,
        dt.explanation,
        tl.link_type,
        dt.created_at
    FROM lineage.decision_traces dt
    JOIN lineage.trace_links tl ON dt.id = tl.trace_id
    WHERE tl.entity_type = p_entity_type
      AND tl.entity_id = p_entity_id
    ORDER BY dt.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- GRANT EXECUTE PERMISSIONS
-- =============================================================================

GRANT EXECUTE ON FUNCTION public.get_audit_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_audit_events TO anon;
GRANT EXECUTE ON FUNCTION public.audit_emit_event TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_evidence_item TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_evidence_chain_entry TO authenticated;
GRANT EXECUTE ON FUNCTION public.lineage_create_trace TO authenticated;
GRANT EXECUTE ON FUNCTION public.lineage_link_trace TO authenticated;
GRANT EXECUTE ON FUNCTION public.lineage_get_full_trace TO authenticated;
GRANT EXECUTE ON FUNCTION public.lineage_get_full_trace TO anon;
GRANT EXECUTE ON FUNCTION public.lineage_get_entity_traces TO authenticated;
GRANT EXECUTE ON FUNCTION public.lineage_get_entity_traces TO anon;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.get_audit_events IS 'Get audit events with optional filters';
COMMENT ON FUNCTION public.audit_emit_event IS 'Emit a new audit event';
COMMENT ON FUNCTION public.create_evidence_item IS 'Create a new evidence item with initial chain entry';
COMMENT ON FUNCTION public.create_evidence_chain_entry IS 'Add a chain of custody entry for evidence';
COMMENT ON FUNCTION public.lineage_create_trace IS 'Create a new decision trace';
COMMENT ON FUNCTION public.lineage_link_trace IS 'Link a trace to an entity';
COMMENT ON FUNCTION public.lineage_get_full_trace IS 'Get complete trace with links and dependencies';
COMMENT ON FUNCTION public.lineage_get_entity_traces IS 'Get all traces for an entity';
