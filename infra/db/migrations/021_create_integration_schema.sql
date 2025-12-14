-- =============================================================================
-- Migration 021: Create Integration Schema
-- Description: Creates the integration schema for ingestion runs, items,
--              reconciliation, and data freshness tracking
-- EPIC 5 - Integration & Comprehensive MDM
-- =============================================================================

-- Create the Integration schema
CREATE SCHEMA IF NOT EXISTS integration;

-- =============================================================================
-- Table: integration.ingestion_runs
-- Description: Tracks each ingestion run
-- =============================================================================
CREATE TABLE integration.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    mode VARCHAR(20) NOT NULL CHECK (mode IN ('FILE', 'MANUAL', 'API', 'DB')),
    dataset VARCHAR(50) NOT NULL,
    file_name VARCHAR(255),
    file_size_bytes BIGINT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'success', 'partial', 'failed', 'cancelled')),
    stats_json JSONB DEFAULT '{
        "total_received": 0,
        "total_processed": 0,
        "total_inserted": 0,
        "total_updated": 0,
        "total_skipped": 0,
        "total_failed": 0
    }'::jsonb,
    checksum VARCHAR(64),
    error_message TEXT,
    triggered_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingestion_runs_tenant ON integration.ingestion_runs(tenant_id);
CREATE INDEX idx_ingestion_runs_source ON integration.ingestion_runs(source_system_id);
CREATE INDEX idx_ingestion_runs_status ON integration.ingestion_runs(tenant_id, status);
CREATE INDEX idx_ingestion_runs_dataset ON integration.ingestion_runs(tenant_id, dataset);
CREATE INDEX idx_ingestion_runs_started ON integration.ingestion_runs(tenant_id, started_at DESC);

-- =============================================================================
-- Table: integration.ingestion_items
-- Description: Individual items processed in each ingestion run
-- =============================================================================
CREATE TABLE integration.ingestion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES integration.ingestion_runs(id) ON DELETE CASCADE,
    external_ref VARCHAR(255) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('INSERTED', 'UPDATED', 'SKIPPED', 'FAILED')),
    payload_hash VARCHAR(64),
    error_message TEXT,
    error_details_json JSONB,
    dq_issues_json JSONB DEFAULT '[]'::jsonb,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ingestion_items_tenant ON integration.ingestion_items(tenant_id);
CREATE INDEX idx_ingestion_items_run ON integration.ingestion_items(run_id);
CREATE INDEX idx_ingestion_items_outcome ON integration.ingestion_items(run_id, outcome);
CREATE INDEX idx_ingestion_items_ref ON integration.ingestion_items(tenant_id, external_ref);
CREATE INDEX idx_ingestion_items_entity ON integration.ingestion_items(entity_id);

-- =============================================================================
-- Table: integration.reconciliation_summary
-- Description: Reconciliation summary for each ingestion run
-- =============================================================================
CREATE TABLE integration.reconciliation_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    run_id UUID NOT NULL REFERENCES integration.ingestion_runs(id) ON DELETE CASCADE,
    total_received INTEGER NOT NULL DEFAULT 0,
    total_inserted INTEGER NOT NULL DEFAULT 0,
    total_updated INTEGER NOT NULL DEFAULT 0,
    total_skipped INTEGER NOT NULL DEFAULT 0,
    total_failed INTEGER NOT NULL DEFAULT 0,
    dq_issues_count INTEGER NOT NULL DEFAULT 0,
    reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_reconciliation_per_run UNIQUE (tenant_id, run_id)
);

CREATE INDEX idx_reconciliation_summary_tenant ON integration.reconciliation_summary(tenant_id);
CREATE INDEX idx_reconciliation_summary_run ON integration.reconciliation_summary(run_id);

-- =============================================================================
-- Table: integration.data_freshness
-- Description: Tracks data freshness per source system and dataset
-- =============================================================================
CREATE TABLE integration.data_freshness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    last_success_at TIMESTAMPTZ,
    last_run_id UUID REFERENCES integration.ingestion_runs(id),
    last_status VARCHAR(20),
    record_count INTEGER DEFAULT 0,
    average_run_duration_ms INTEGER,
    notes TEXT,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_data_freshness UNIQUE (tenant_id, source_system_id, dataset)
);

CREATE INDEX idx_data_freshness_tenant ON integration.data_freshness(tenant_id);
CREATE INDEX idx_data_freshness_source ON integration.data_freshness(source_system_id);
CREATE INDEX idx_data_freshness_dataset ON integration.data_freshness(tenant_id, dataset);

-- =============================================================================
-- Table: integration.mapping_templates
-- Description: Configurable mapping templates for data ingestion
-- =============================================================================
CREATE TABLE integration.mapping_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    mapping_json JSONB NOT NULL,
    is_default BOOLEAN DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
    version INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    
    CONSTRAINT unique_mapping_template UNIQUE (tenant_id, source_system_id, dataset, name, version)
);

CREATE INDEX idx_mapping_templates_tenant ON integration.mapping_templates(tenant_id);
CREATE INDEX idx_mapping_templates_source ON integration.mapping_templates(source_system_id);
CREATE INDEX idx_mapping_templates_dataset ON integration.mapping_templates(tenant_id, dataset);
CREATE INDEX idx_mapping_templates_default ON integration.mapping_templates(tenant_id, source_system_id, dataset, is_default) WHERE is_default = TRUE;

-- =============================================================================
-- Table: integration.webhook_endpoints
-- Description: Registered webhook endpoints for API ingestion
-- =============================================================================
CREATE TABLE integration.webhook_endpoints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    endpoint_key VARCHAR(64) NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
    secret_hash VARCHAR(128),
    ip_whitelist TEXT[],
    rate_limit_per_minute INTEGER DEFAULT 100,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_called_at TIMESTAMPTZ,
    call_count BIGINT DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT unique_webhook_endpoint UNIQUE (tenant_id, endpoint_key)
);

CREATE INDEX idx_webhook_endpoints_tenant ON integration.webhook_endpoints(tenant_id);
CREATE INDEX idx_webhook_endpoints_key ON integration.webhook_endpoints(endpoint_key);
CREATE INDEX idx_webhook_endpoints_source ON integration.webhook_endpoints(source_system_id);

-- =============================================================================
-- Table: integration.scheduled_jobs
-- Description: Scheduled integration jobs (for DB mode)
-- =============================================================================
CREATE TABLE integration.scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(100),
    query_or_view TEXT,
    connection_config_json JSONB,
    mapping_template_id UUID REFERENCES integration.mapping_templates(id),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'paused')),
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX idx_scheduled_jobs_tenant ON integration.scheduled_jobs(tenant_id);
CREATE INDEX idx_scheduled_jobs_status ON integration.scheduled_jobs(status);
CREATE INDEX idx_scheduled_jobs_next_run ON integration.scheduled_jobs(next_run_at) WHERE status = 'active';

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION integration.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_data_freshness_updated_at
    BEFORE UPDATE ON integration.data_freshness
    FOR EACH ROW EXECUTE FUNCTION integration.update_updated_at_column();

CREATE TRIGGER trg_mapping_templates_updated_at
    BEFORE UPDATE ON integration.mapping_templates
    FOR EACH ROW EXECUTE FUNCTION integration.update_updated_at_column();

CREATE TRIGGER trg_webhook_endpoints_updated_at
    BEFORE UPDATE ON integration.webhook_endpoints
    FOR EACH ROW EXECUTE FUNCTION integration.update_updated_at_column();

CREATE TRIGGER trg_scheduled_jobs_updated_at
    BEFORE UPDATE ON integration.scheduled_jobs
    FOR EACH ROW EXECUTE FUNCTION integration.update_updated_at_column();

-- =============================================================================
-- Function: Create reconciliation summary from ingestion items
-- =============================================================================
CREATE OR REPLACE FUNCTION integration.create_reconciliation_summary(p_run_id UUID)
RETURNS UUID AS $$
DECLARE
    v_summary_id UUID;
    v_tenant_id UUID;
    v_stats RECORD;
BEGIN
    -- Get tenant_id from run
    SELECT tenant_id INTO v_tenant_id FROM integration.ingestion_runs WHERE id = p_run_id;
    
    -- Calculate stats from items
    SELECT
        COUNT(*) as total_received,
        COUNT(*) FILTER (WHERE outcome = 'INSERTED') as total_inserted,
        COUNT(*) FILTER (WHERE outcome = 'UPDATED') as total_updated,
        COUNT(*) FILTER (WHERE outcome = 'SKIPPED') as total_skipped,
        COUNT(*) FILTER (WHERE outcome = 'FAILED') as total_failed,
        COALESCE(SUM(jsonb_array_length(dq_issues_json)), 0)::INTEGER as dq_issues_count
    INTO v_stats
    FROM integration.ingestion_items
    WHERE run_id = p_run_id;
    
    -- Upsert reconciliation summary
    INSERT INTO integration.reconciliation_summary (
        tenant_id, run_id, total_received, total_inserted, total_updated, 
        total_skipped, total_failed, dq_issues_count
    ) VALUES (
        v_tenant_id, p_run_id, v_stats.total_received, v_stats.total_inserted,
        v_stats.total_updated, v_stats.total_skipped, v_stats.total_failed,
        v_stats.dq_issues_count
    )
    ON CONFLICT (tenant_id, run_id) 
    DO UPDATE SET
        total_received = EXCLUDED.total_received,
        total_inserted = EXCLUDED.total_inserted,
        total_updated = EXCLUDED.total_updated,
        total_skipped = EXCLUDED.total_skipped,
        total_failed = EXCLUDED.total_failed,
        dq_issues_count = EXCLUDED.dq_issues_count,
        reconciled_at = NOW()
    RETURNING id INTO v_summary_id;
    
    -- Update run stats
    UPDATE integration.ingestion_runs
    SET stats_json = jsonb_build_object(
        'total_received', v_stats.total_received,
        'total_processed', v_stats.total_received,
        'total_inserted', v_stats.total_inserted,
        'total_updated', v_stats.total_updated,
        'total_skipped', v_stats.total_skipped,
        'total_failed', v_stats.total_failed
    )
    WHERE id = p_run_id;
    
    RETURN v_summary_id;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Function: Update data freshness after successful run
-- =============================================================================
CREATE OR REPLACE FUNCTION integration.update_data_freshness(
    p_run_id UUID,
    p_record_count INTEGER DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
    v_run RECORD;
    v_duration_ms INTEGER;
BEGIN
    -- Get run details
    SELECT * INTO v_run FROM integration.ingestion_runs WHERE id = p_run_id;
    
    -- Calculate duration
    IF v_run.ended_at IS NOT NULL THEN
        v_duration_ms := EXTRACT(EPOCH FROM (v_run.ended_at - v_run.started_at)) * 1000;
    END IF;
    
    -- Upsert data freshness
    INSERT INTO integration.data_freshness (
        tenant_id, source_system_id, dataset, last_success_at, last_run_id,
        last_status, record_count, average_run_duration_ms
    ) VALUES (
        v_run.tenant_id, v_run.source_system_id, v_run.dataset,
        CASE WHEN v_run.status = 'success' THEN v_run.ended_at ELSE NULL END,
        p_run_id, v_run.status,
        COALESCE(p_record_count, (v_run.stats_json->>'total_received')::INTEGER),
        v_duration_ms
    )
    ON CONFLICT (tenant_id, source_system_id, dataset)
    DO UPDATE SET
        last_success_at = CASE 
            WHEN v_run.status = 'success' THEN v_run.ended_at 
            ELSE integration.data_freshness.last_success_at 
        END,
        last_run_id = p_run_id,
        last_status = v_run.status,
        record_count = COALESCE(p_record_count, (v_run.stats_json->>'total_received')::INTEGER),
        average_run_duration_ms = COALESCE(
            (integration.data_freshness.average_run_duration_ms + v_duration_ms) / 2,
            v_duration_ms
        ),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON SCHEMA integration IS 'Integration schema for EPIC 5 - ingestion, reconciliation, freshness';
COMMENT ON TABLE integration.ingestion_runs IS 'Tracks each ingestion run';
COMMENT ON TABLE integration.ingestion_items IS 'Individual items processed in each ingestion run';
COMMENT ON TABLE integration.reconciliation_summary IS 'Reconciliation summary for each ingestion run';
COMMENT ON TABLE integration.data_freshness IS 'Tracks data freshness per source system and dataset';
COMMENT ON TABLE integration.mapping_templates IS 'Configurable mapping templates for data ingestion';
COMMENT ON TABLE integration.webhook_endpoints IS 'Registered webhook endpoints for API ingestion';
COMMENT ON TABLE integration.scheduled_jobs IS 'Scheduled integration jobs (for DB mode)';
COMMENT ON FUNCTION integration.create_reconciliation_summary IS 'Creates reconciliation summary from ingestion items';
COMMENT ON FUNCTION integration.update_data_freshness IS 'Updates data freshness after run completion';
