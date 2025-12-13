-- EPIC 4: Audit, Evidence, Lineage - Lineage Schema Migration
-- This migration creates the lineage schema for decision tracing
--
-- NOTE: Run 001_create_audit_schema.sql BEFORE this migration.
--
-- NOTE ON MULTI-TENANCY:
-- The default RLS policies allow all authenticated users to access records.
-- For stricter multi-tenant isolation, modify the RLS policies to check
-- the user's tenant_id against the record's tenant_id.

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================================================
-- CREATE LINEAGE SCHEMA
-- =============================================================================
CREATE SCHEMA IF NOT EXISTS lineage;

-- Grant usage to authenticated users
GRANT USAGE ON SCHEMA lineage TO authenticated;
GRANT USAGE ON SCHEMA lineage TO anon;

-- =============================================================================
-- TABLE: lineage.decision_traces
-- Purpose: Track decisions from PDP, allocation systems, AI components
-- =============================================================================
CREATE TABLE IF NOT EXISTS lineage.decision_traces (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    trace_type VARCHAR(50) NOT NULL CHECK (trace_type IN ('POLICY', 'ALLOCATION', 'AI', 'WORKFLOW', 'APPROVAL', 'CALCULATION')),
    trace_ref_id VARCHAR(255),  -- Reference ID from the originating system
    request_id UUID,  -- Optional: ID of the original request
    
    -- Input/Output data
    input_json JSONB NOT NULL DEFAULT '{}',
    output_json JSONB NOT NULL DEFAULT '{}',
    
    -- Decision details
    decision_result VARCHAR(100),  -- e.g., 'APPROVED', 'DENIED', 'PENDING'
    confidence_score DECIMAL(5, 4),  -- For AI decisions (0.0000 to 1.0000)
    
    -- Explanation and reasoning
    explanation TEXT,
    reasoning_json JSONB DEFAULT '{}',  -- Structured reasoning data
    factors_json JSONB DEFAULT '[]',  -- List of factors that influenced the decision
    
    -- Actor information
    actor_user_id UUID,
    actor_role VARCHAR(100),
    actor_system VARCHAR(100),  -- System that made the decision (e.g., 'PDP', 'ALLOCATION_ENGINE')
    
    -- Timing
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    duration_ms INTEGER,
    
    -- Metadata
    version VARCHAR(50),  -- Version of the decision logic
    model_version VARCHAR(100),  -- For AI: model version used
    policy_version VARCHAR(100),  -- For Policy: policy version used
    metadata JSONB DEFAULT '{}',
    tags JSONB DEFAULT '[]',
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'COMPLETED' CHECK (status IN ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'SUPERSEDED')),
    error_message TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for decision traces
CREATE INDEX IF NOT EXISTS idx_decision_traces_tenant_id ON lineage.decision_traces(tenant_id);
CREATE INDEX IF NOT EXISTS idx_decision_traces_trace_type ON lineage.decision_traces(trace_type);
CREATE INDEX IF NOT EXISTS idx_decision_traces_trace_ref_id ON lineage.decision_traces(trace_ref_id);
CREATE INDEX IF NOT EXISTS idx_decision_traces_request_id ON lineage.decision_traces(request_id);
CREATE INDEX IF NOT EXISTS idx_decision_traces_decision_result ON lineage.decision_traces(decision_result);
CREATE INDEX IF NOT EXISTS idx_decision_traces_actor ON lineage.decision_traces(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_decision_traces_actor_system ON lineage.decision_traces(actor_system);
CREATE INDEX IF NOT EXISTS idx_decision_traces_created_at ON lineage.decision_traces(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_decision_traces_status ON lineage.decision_traces(status);

-- GIN index for JSON searching
CREATE INDEX IF NOT EXISTS idx_decision_traces_input_json ON lineage.decision_traces USING GIN (input_json);
CREATE INDEX IF NOT EXISTS idx_decision_traces_output_json ON lineage.decision_traces USING GIN (output_json);
CREATE INDEX IF NOT EXISTS idx_decision_traces_tags ON lineage.decision_traces USING GIN (tags);

-- =============================================================================
-- TABLE: lineage.trace_links
-- Purpose: Link decision traces to entities they affect
-- =============================================================================
CREATE TABLE IF NOT EXISTS lineage.trace_links (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    trace_id UUID NOT NULL REFERENCES lineage.decision_traces(id) ON DELETE CASCADE,
    
    -- Linked entity
    entity_type VARCHAR(100) NOT NULL,
    entity_id VARCHAR(255) NOT NULL,
    
    -- Link type
    link_type VARCHAR(50) DEFAULT 'AFFECTS' CHECK (link_type IN (
        'AFFECTS',      -- The decision affects this entity
        'TRIGGERED_BY', -- The decision was triggered by this entity
        'REFERENCES',   -- The decision references this entity
        'DEPENDS_ON',   -- The decision depends on this entity
        'SUPERSEDES',   -- This decision supersedes another decision
        'RELATED_TO'    -- General relationship
    )),
    
    -- Relationship details
    relationship_metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Create indexes for trace links
CREATE INDEX IF NOT EXISTS idx_trace_links_tenant_id ON lineage.trace_links(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_links_trace_id ON lineage.trace_links(trace_id);
CREATE INDEX IF NOT EXISTS idx_trace_links_entity ON lineage.trace_links(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_trace_links_link_type ON lineage.trace_links(link_type);
CREATE INDEX IF NOT EXISTS idx_trace_links_created_at ON lineage.trace_links(created_at DESC);

-- Composite index for common query pattern
CREATE INDEX IF NOT EXISTS idx_trace_links_entity_trace 
    ON lineage.trace_links(entity_type, entity_id, trace_id);

-- =============================================================================
-- TABLE: lineage.trace_dependencies
-- Purpose: Track dependencies between decision traces
-- =============================================================================
CREATE TABLE IF NOT EXISTS lineage.trace_dependencies (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    parent_trace_id UUID NOT NULL REFERENCES lineage.decision_traces(id) ON DELETE CASCADE,
    child_trace_id UUID NOT NULL REFERENCES lineage.decision_traces(id) ON DELETE CASCADE,
    dependency_type VARCHAR(50) DEFAULT 'SEQUENTIAL' CHECK (dependency_type IN (
        'SEQUENTIAL',   -- Child follows parent
        'PARALLEL',     -- Child runs in parallel with parent
        'CONDITIONAL',  -- Child depends on parent's outcome
        'OVERRIDES'     -- Child overrides parent's decision
    )),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    
    CONSTRAINT unique_trace_dependency UNIQUE (parent_trace_id, child_trace_id)
);

-- Create indexes for trace dependencies
CREATE INDEX IF NOT EXISTS idx_trace_dependencies_tenant_id ON lineage.trace_dependencies(tenant_id);
CREATE INDEX IF NOT EXISTS idx_trace_dependencies_parent ON lineage.trace_dependencies(parent_trace_id);
CREATE INDEX IF NOT EXISTS idx_trace_dependencies_child ON lineage.trace_dependencies(child_trace_id);

-- =============================================================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================================================

-- Enable RLS on all lineage tables
ALTER TABLE lineage.decision_traces ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineage.trace_links ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineage.trace_dependencies ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "decision_traces_tenant_isolation" ON lineage.decision_traces;
DROP POLICY IF EXISTS "decision_traces_insert_policy" ON lineage.decision_traces;
DROP POLICY IF EXISTS "decision_traces_update_policy" ON lineage.decision_traces;
DROP POLICY IF EXISTS "trace_links_tenant_isolation" ON lineage.trace_links;
DROP POLICY IF EXISTS "trace_links_insert_policy" ON lineage.trace_links;
DROP POLICY IF EXISTS "trace_dependencies_tenant_isolation" ON lineage.trace_dependencies;
DROP POLICY IF EXISTS "trace_dependencies_insert_policy" ON lineage.trace_dependencies;

-- Create RLS policies for decision_traces
CREATE POLICY "decision_traces_tenant_isolation" ON lineage.decision_traces
    FOR SELECT
    USING (
        -- Allow access if user is authenticated
        auth.uid() IS NOT NULL
    );

CREATE POLICY "decision_traces_insert_policy" ON lineage.decision_traces
    FOR INSERT
    WITH CHECK (true);

CREATE POLICY "decision_traces_update_policy" ON lineage.decision_traces
    FOR UPDATE
    USING (
        auth.uid() IS NOT NULL
    )
    WITH CHECK (
        -- Only allow updating status and error fields
        status IS NOT NULL
    );

-- Create RLS policies for trace_links
CREATE POLICY "trace_links_tenant_isolation" ON lineage.trace_links
    FOR SELECT
    USING (
        -- Allow access if user is authenticated
        auth.uid() IS NOT NULL
    );

CREATE POLICY "trace_links_insert_policy" ON lineage.trace_links
    FOR INSERT
    WITH CHECK (true);

-- Create RLS policies for trace_dependencies
CREATE POLICY "trace_dependencies_tenant_isolation" ON lineage.trace_dependencies
    FOR SELECT
    USING (
        -- Allow access if user is authenticated
        auth.uid() IS NOT NULL
    );

CREATE POLICY "trace_dependencies_insert_policy" ON lineage.trace_dependencies
    FOR INSERT
    WITH CHECK (true);

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================
GRANT ALL ON lineage.decision_traces TO authenticated;
GRANT ALL ON lineage.trace_links TO authenticated;
GRANT ALL ON lineage.trace_dependencies TO authenticated;

-- Grant SELECT to anon for public lineage (if needed)
GRANT SELECT ON lineage.decision_traces TO anon;
GRANT SELECT ON lineage.trace_links TO anon;

-- =============================================================================
-- HELPER FUNCTIONS
-- =============================================================================

-- Function to create a decision trace
CREATE OR REPLACE FUNCTION lineage.create_trace(
    p_tenant_id UUID,
    p_trace_type VARCHAR(50),
    p_input_json JSONB,
    p_output_json JSONB DEFAULT '{}',
    p_explanation TEXT DEFAULT NULL,
    p_decision_result VARCHAR(100) DEFAULT NULL,
    p_actor_user_id UUID DEFAULT NULL,
    p_actor_system VARCHAR(100) DEFAULT NULL,
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

-- Function to link a trace to an entity
CREATE OR REPLACE FUNCTION lineage.link_trace_to_entity(
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

-- Function to create trace with linked entities
CREATE OR REPLACE FUNCTION lineage.create_trace_with_links(
    p_tenant_id UUID,
    p_trace_type VARCHAR(50),
    p_input_json JSONB,
    p_output_json JSONB,
    p_explanation TEXT,
    p_entity_links JSONB,  -- Array of {entity_type, entity_id, link_type}
    p_decision_result VARCHAR(100) DEFAULT NULL,
    p_actor_user_id UUID DEFAULT NULL,
    p_actor_system VARCHAR(100) DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS UUID AS $$
DECLARE
    v_trace_id UUID;
    v_link JSONB;
BEGIN
    -- Create the trace
    v_trace_id := lineage.create_trace(
        p_tenant_id,
        p_trace_type,
        p_input_json,
        p_output_json,
        p_explanation,
        p_decision_result,
        p_actor_user_id,
        p_actor_system,
        NULL,
        NULL,
        '{}',
        '[]',
        NULL,
        p_metadata
    );
    
    -- Create entity links
    IF p_entity_links IS NOT NULL AND jsonb_array_length(p_entity_links) > 0 THEN
        FOR v_link IN SELECT * FROM jsonb_array_elements(p_entity_links)
        LOOP
            PERFORM lineage.link_trace_to_entity(
                p_tenant_id,
                v_trace_id,
                v_link->>'entity_type',
                v_link->>'entity_id',
                COALESCE(v_link->>'link_type', 'AFFECTS'),
                COALESCE(v_link->'metadata', '{}')
            );
        END LOOP;
    END IF;
    
    RETURN v_trace_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get full trace lineage (including linked entities and dependencies)
CREATE OR REPLACE FUNCTION lineage.get_full_trace(p_trace_id UUID)
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
CREATE OR REPLACE FUNCTION lineage.get_entity_traces(
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

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION lineage.create_trace TO authenticated;
GRANT EXECUTE ON FUNCTION lineage.link_trace_to_entity TO authenticated;
GRANT EXECUTE ON FUNCTION lineage.create_trace_with_links TO authenticated;
GRANT EXECUTE ON FUNCTION lineage.get_full_trace TO authenticated;
GRANT EXECUTE ON FUNCTION lineage.get_entity_traces TO authenticated;

-- =============================================================================
-- VIEWS FOR REPORTING
-- =============================================================================

-- View for decision traces with linked entity count
CREATE OR REPLACE VIEW lineage.decision_traces_summary AS
SELECT 
    dt.id,
    dt.tenant_id,
    dt.trace_type,
    dt.trace_ref_id,
    dt.decision_result,
    dt.actor_system,
    dt.status,
    dt.created_at,
    COUNT(DISTINCT tl.id) as linked_entity_count,
    COUNT(DISTINCT td_parent.parent_trace_id) as parent_trace_count,
    COUNT(DISTINCT td_child.child_trace_id) as child_trace_count
FROM lineage.decision_traces dt
LEFT JOIN lineage.trace_links tl ON dt.id = tl.trace_id
LEFT JOIN lineage.trace_dependencies td_parent ON dt.id = td_parent.child_trace_id
LEFT JOIN lineage.trace_dependencies td_child ON dt.id = td_child.parent_trace_id
GROUP BY dt.id, dt.tenant_id, dt.trace_type, dt.trace_ref_id, 
         dt.decision_result, dt.actor_system, dt.status, dt.created_at;

-- View for entity lineage summary
CREATE OR REPLACE VIEW lineage.entity_lineage_summary AS
SELECT 
    tenant_id,
    entity_type,
    entity_id,
    COUNT(*) as total_traces,
    COUNT(DISTINCT trace_id) as unique_traces,
    COUNT(*) FILTER (WHERE link_type = 'AFFECTS') as affecting_traces,
    COUNT(*) FILTER (WHERE link_type = 'TRIGGERED_BY') as triggering_traces,
    MIN(created_at) as first_trace,
    MAX(created_at) as last_trace
FROM lineage.trace_links
GROUP BY tenant_id, entity_type, entity_id;

GRANT SELECT ON lineage.decision_traces_summary TO authenticated;
GRANT SELECT ON lineage.entity_lineage_summary TO authenticated;

-- =============================================================================
-- TRIGGER FOR UPDATED_AT
-- =============================================================================

CREATE OR REPLACE FUNCTION lineage.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS decision_traces_updated_at ON lineage.decision_traces;
CREATE TRIGGER decision_traces_updated_at
    BEFORE UPDATE ON lineage.decision_traces
    FOR EACH ROW
    EXECUTE FUNCTION lineage.update_updated_at();

-- =============================================================================
-- COMMENTS
-- =============================================================================
COMMENT ON SCHEMA lineage IS 'Lineage schema for EPIC 4: Decision tracing and entity lineage';
COMMENT ON TABLE lineage.decision_traces IS 'Decision traces from PDP, allocation systems, and AI components';
COMMENT ON TABLE lineage.trace_links IS 'Links between decision traces and affected entities';
COMMENT ON TABLE lineage.trace_dependencies IS 'Dependencies between decision traces';
COMMENT ON FUNCTION lineage.create_trace IS 'Create a new decision trace';
COMMENT ON FUNCTION lineage.link_trace_to_entity IS 'Link a trace to an entity';
COMMENT ON FUNCTION lineage.create_trace_with_links IS 'Create a trace with entity links in one transaction';
COMMENT ON FUNCTION lineage.get_full_trace IS 'Get complete trace with links and dependencies';
COMMENT ON FUNCTION lineage.get_entity_traces IS 'Get all traces for an entity';
