-- =============================================================================
-- EPIC 5: MDM & Integration Schema Migration for Supabase
-- =============================================================================
-- Run this script in Supabase SQL Editor to create all EPIC 5 tables
-- Execute in ORDER: 1) MDM Schema, 2) Integration Schema, 3) RLS, 4) Seed Data
-- =============================================================================

-- =============================================================================
-- STEP 1: Create MDM Schema (Migration 020)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS mdm;

-- Source Systems
CREATE TABLE IF NOT EXISTS mdm.source_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'deprecated')),
    config_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT unique_source_system_code_per_tenant UNIQUE (tenant_id, code)
);

CREATE INDEX IF NOT EXISTS idx_source_systems_tenant ON mdm.source_systems(tenant_id);
CREATE INDEX IF NOT EXISTS idx_source_systems_status ON mdm.source_systems(tenant_id, status);

-- Reference Data
CREATE TABLE IF NOT EXISTS mdm.reference_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    domain VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255),
    name_en VARCHAR(255),
    extra_json JSONB DEFAULT '{}'::jsonb,
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT unique_reference_data_per_tenant UNIQUE (tenant_id, domain, code)
);

CREATE INDEX IF NOT EXISTS idx_reference_data_tenant ON mdm.reference_data(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reference_data_domain ON mdm.reference_data(tenant_id, domain);

-- Party Golden Records
CREATE TABLE IF NOT EXISTS mdm.party_golden (
    party_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    party_type VARCHAR(20) NOT NULL CHECK (party_type IN ('PERSON', 'ORGANIZATION')),
    primary_name VARCHAR(500) NOT NULL,
    primary_name_ar VARCHAR(500),
    identifiers_json JSONB DEFAULT '[]'::jsonb,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'merged', 'deleted')),
    merge_target_id UUID REFERENCES mdm.party_golden(party_id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_party_golden_tenant ON mdm.party_golden(tenant_id);
CREATE INDEX IF NOT EXISTS idx_party_golden_type ON mdm.party_golden(tenant_id, party_type);
CREATE INDEX IF NOT EXISTS idx_party_golden_status ON mdm.party_golden(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_party_golden_name ON mdm.party_golden(tenant_id, primary_name);

-- Party Source Map (Idempotency Key)
CREATE TABLE IF NOT EXISTS mdm.party_source_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    external_party_ref VARCHAR(255) NOT NULL,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(party_id) ON DELETE CASCADE,
    payload_hash VARCHAR(64),
    confidence_score DECIMAL(5,4) DEFAULT 1.0,
    match_method VARCHAR(50),
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_party_source_map UNIQUE (tenant_id, source_system_id, external_party_ref)
);

CREATE INDEX IF NOT EXISTS idx_party_source_map_tenant ON mdm.party_source_map(tenant_id);
CREATE INDEX IF NOT EXISTS idx_party_source_map_party ON mdm.party_source_map(party_id);
CREATE INDEX IF NOT EXISTS idx_party_source_map_hash ON mdm.party_source_map(payload_hash);

-- Party Source Record (Audit/Lineage)
CREATE TABLE IF NOT EXISTS mdm.party_source_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    external_party_ref VARCHAR(255) NOT NULL,
    payload_json JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    ingestion_run_id UUID,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_source_record_tenant ON mdm.party_source_record(tenant_id);

-- Party Contacts
CREATE TABLE IF NOT EXISTS mdm.party_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(party_id) ON DELETE CASCADE,
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('PHONE', 'EMAIL', 'ADDRESS', 'FAX', 'MOBILE', 'OTHER')),
    value TEXT NOT NULL,
    value_normalized TEXT,
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    source_system_id UUID REFERENCES mdm.source_systems(id),
    extra_json JSONB DEFAULT '{}'::jsonb,
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_contacts_tenant ON mdm.party_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_party_contacts_party ON mdm.party_contacts(party_id);

-- Contract Golden Records
CREATE TABLE IF NOT EXISTS mdm.contract_golden (
    contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(party_id) ON DELETE CASCADE,
    product_code VARCHAR(50),
    contract_number VARCHAR(100),
    secured_flag BOOLEAN DEFAULT FALSE,
    status VARCHAR(30) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'suspended', 'defaulted', 'written_off')),
    contract_keys_json JSONB DEFAULT '{}'::jsonb,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    start_date DATE,
    end_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

CREATE INDEX IF NOT EXISTS idx_contract_golden_tenant ON mdm.contract_golden(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_golden_party ON mdm.contract_golden(party_id);
CREATE INDEX IF NOT EXISTS idx_contract_golden_status ON mdm.contract_golden(tenant_id, status);

-- Contract Source Map
CREATE TABLE IF NOT EXISTS mdm.contract_source_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    external_contract_ref VARCHAR(255) NOT NULL,
    contract_id UUID NOT NULL REFERENCES mdm.contract_golden(contract_id) ON DELETE CASCADE,
    payload_hash VARCHAR(64),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contract_source_map UNIQUE (tenant_id, source_system_id, external_contract_ref)
);

CREATE INDEX IF NOT EXISTS idx_contract_source_map_tenant ON mdm.contract_source_map(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_source_map_contract ON mdm.contract_source_map(contract_id);

-- Data Quality Issues
CREATE TABLE IF NOT EXISTS mdm.data_quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    rule_code VARCHAR(50) NOT NULL,
    rule_name VARCHAR(255),
    message TEXT NOT NULL,
    details_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'ignored', 'in_progress')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dq_issues_tenant ON mdm.data_quality_issues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dq_issues_entity ON mdm.data_quality_issues(tenant_id, entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_dq_issues_severity ON mdm.data_quality_issues(tenant_id, severity);
CREATE INDEX IF NOT EXISTS idx_dq_issues_status ON mdm.data_quality_issues(tenant_id, status);

-- Match Candidates
CREATE TABLE IF NOT EXISTS mdm.match_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    candidate_party_id UUID NOT NULL REFERENCES mdm.party_golden(party_id) ON DELETE CASCADE,
    matched_party_id UUID NOT NULL REFERENCES mdm.party_golden(party_id) ON DELETE CASCADE,
    match_score DECIMAL(5,4) NOT NULL,
    match_reason_json JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rejected', 'auto_merged')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_match_candidates UNIQUE (tenant_id, candidate_party_id, matched_party_id)
);

CREATE INDEX IF NOT EXISTS idx_match_candidates_tenant ON mdm.match_candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_status ON mdm.match_candidates(tenant_id, status);

-- User Profiles
CREATE TABLE IF NOT EXISTS mdm.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES platform.users(id) ON DELETE CASCADE,
    home_org_unit_id UUID REFERENCES platform.org_units(id),
    nationality_code VARCHAR(50),
    languages_json JSONB DEFAULT '[]'::jsonb,
    skills_json JSONB DEFAULT '[]'::jsonb,
    preferences_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_profile UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON mdm.user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user ON mdm.user_profiles(user_id);

-- Contract Charges
CREATE TABLE IF NOT EXISTS mdm.contract_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES mdm.contract_golden(contract_id) ON DELETE CASCADE,
    charge_type_code VARCHAR(50) NOT NULL,
    amount DECIMAL(18,4) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'SAR',
    applied_date DATE,
    description TEXT,
    source_system_id UUID REFERENCES mdm.source_systems(id),
    external_ref VARCHAR(255),
    payload_hash VARCHAR(64),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'reversed', 'waived')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contract_charge UNIQUE (tenant_id, source_system_id, external_ref)
);

CREATE INDEX IF NOT EXISTS idx_contract_charges_tenant ON mdm.contract_charges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_charges_contract ON mdm.contract_charges(contract_id);

-- Updated_at trigger function for MDM
CREATE OR REPLACE FUNCTION mdm.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers
DROP TRIGGER IF EXISTS trg_source_systems_updated_at ON mdm.source_systems;
CREATE TRIGGER trg_source_systems_updated_at BEFORE UPDATE ON mdm.source_systems FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_reference_data_updated_at ON mdm.reference_data;
CREATE TRIGGER trg_reference_data_updated_at BEFORE UPDATE ON mdm.reference_data FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_party_golden_updated_at ON mdm.party_golden;
CREATE TRIGGER trg_party_golden_updated_at BEFORE UPDATE ON mdm.party_golden FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_party_contacts_updated_at ON mdm.party_contacts;
CREATE TRIGGER trg_party_contacts_updated_at BEFORE UPDATE ON mdm.party_contacts FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contract_golden_updated_at ON mdm.contract_golden;
CREATE TRIGGER trg_contract_golden_updated_at BEFORE UPDATE ON mdm.contract_golden FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_dq_issues_updated_at ON mdm.data_quality_issues;
CREATE TRIGGER trg_dq_issues_updated_at BEFORE UPDATE ON mdm.data_quality_issues FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_user_profiles_updated_at ON mdm.user_profiles;
CREATE TRIGGER trg_user_profiles_updated_at BEFORE UPDATE ON mdm.user_profiles FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_contract_charges_updated_at ON mdm.contract_charges;
CREATE TRIGGER trg_contract_charges_updated_at BEFORE UPDATE ON mdm.contract_charges FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

COMMENT ON SCHEMA mdm IS 'Master Data Management schema for EPIC 5';

-- =============================================================================
-- STEP 2: Create Integration Schema (Migration 021)
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS integration;

-- Ingestion Runs
CREATE TABLE IF NOT EXISTS integration.ingestion_runs (
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
    stats_json JSONB DEFAULT '{"total_received": 0, "total_processed": 0, "total_inserted": 0, "total_updated": 0, "total_skipped": 0, "total_failed": 0}'::jsonb,
    checksum VARCHAR(64),
    error_message TEXT,
    triggered_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_tenant ON integration.ingestion_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source ON integration.ingestion_runs(source_system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON integration.ingestion_runs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_dataset ON integration.ingestion_runs(tenant_id, dataset);

-- Ingestion Items
CREATE TABLE IF NOT EXISTS integration.ingestion_items (
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

CREATE INDEX IF NOT EXISTS idx_ingestion_items_tenant ON integration.ingestion_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_items_run ON integration.ingestion_items(run_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_items_outcome ON integration.ingestion_items(run_id, outcome);

-- Reconciliation Summary
CREATE TABLE IF NOT EXISTS integration.reconciliation_summary (
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

CREATE INDEX IF NOT EXISTS idx_reconciliation_summary_tenant ON integration.reconciliation_summary(tenant_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_summary_run ON integration.reconciliation_summary(run_id);

-- Data Freshness
CREATE TABLE IF NOT EXISTS integration.data_freshness (
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

CREATE INDEX IF NOT EXISTS idx_data_freshness_tenant ON integration.data_freshness(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_freshness_source ON integration.data_freshness(source_system_id);

-- Mapping Templates
CREATE TABLE IF NOT EXISTS integration.mapping_templates (
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

CREATE INDEX IF NOT EXISTS idx_mapping_templates_tenant ON integration.mapping_templates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_mapping_templates_source ON integration.mapping_templates(source_system_id);

-- Webhook Endpoints
CREATE TABLE IF NOT EXISTS integration.webhook_endpoints (
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

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant ON integration.webhook_endpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_key ON integration.webhook_endpoints(endpoint_key);

-- Scheduled Jobs
CREATE TABLE IF NOT EXISTS integration.scheduled_jobs (
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

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_tenant ON integration.scheduled_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_status ON integration.scheduled_jobs(status);

-- Updated_at trigger function for Integration
CREATE OR REPLACE FUNCTION integration.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_data_freshness_updated_at ON integration.data_freshness;
CREATE TRIGGER trg_data_freshness_updated_at BEFORE UPDATE ON integration.data_freshness FOR EACH ROW EXECUTE FUNCTION integration.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_mapping_templates_updated_at ON integration.mapping_templates;
CREATE TRIGGER trg_mapping_templates_updated_at BEFORE UPDATE ON integration.mapping_templates FOR EACH ROW EXECUTE FUNCTION integration.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_webhook_endpoints_updated_at ON integration.webhook_endpoints;
CREATE TRIGGER trg_webhook_endpoints_updated_at BEFORE UPDATE ON integration.webhook_endpoints FOR EACH ROW EXECUTE FUNCTION integration.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_scheduled_jobs_updated_at ON integration.scheduled_jobs;
CREATE TRIGGER trg_scheduled_jobs_updated_at BEFORE UPDATE ON integration.scheduled_jobs FOR EACH ROW EXECUTE FUNCTION integration.update_updated_at_column();

-- Helper Functions
CREATE OR REPLACE FUNCTION integration.create_reconciliation_summary(p_run_id UUID)
RETURNS UUID AS $$
DECLARE
    v_summary_id UUID;
    v_tenant_id UUID;
    v_stats RECORD;
BEGIN
    SELECT tenant_id INTO v_tenant_id FROM integration.ingestion_runs WHERE id = p_run_id;
    
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

CREATE OR REPLACE FUNCTION integration.update_data_freshness(p_run_id UUID, p_record_count INTEGER DEFAULT NULL)
RETURNS VOID AS $$
DECLARE
    v_run RECORD;
    v_duration_ms INTEGER;
BEGIN
    SELECT * INTO v_run FROM integration.ingestion_runs WHERE id = p_run_id;
    
    IF v_run.ended_at IS NOT NULL THEN
        v_duration_ms := EXTRACT(EPOCH FROM (v_run.ended_at - v_run.started_at)) * 1000;
    END IF;
    
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

COMMENT ON SCHEMA integration IS 'Integration schema for EPIC 5 - ingestion, reconciliation, freshness';

-- =============================================================================
-- STEP 3: Enable Row Level Security (Migration 022)
-- =============================================================================

-- MDM Schema RLS
ALTER TABLE mdm.source_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.reference_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_golden ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_source_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_source_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_golden ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_source_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.data_quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.match_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_charges ENABLE ROW LEVEL SECURITY;

-- Integration Schema RLS
ALTER TABLE integration.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.ingestion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.reconciliation_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.data_freshness ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policies (drop if exists first)
DROP POLICY IF EXISTS source_systems_tenant_isolation ON mdm.source_systems;
CREATE POLICY source_systems_tenant_isolation ON mdm.source_systems FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS reference_data_tenant_isolation ON mdm.reference_data;
CREATE POLICY reference_data_tenant_isolation ON mdm.reference_data FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS party_golden_tenant_isolation ON mdm.party_golden;
CREATE POLICY party_golden_tenant_isolation ON mdm.party_golden FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS party_source_map_tenant_isolation ON mdm.party_source_map;
CREATE POLICY party_source_map_tenant_isolation ON mdm.party_source_map FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS party_source_record_tenant_isolation ON mdm.party_source_record;
CREATE POLICY party_source_record_tenant_isolation ON mdm.party_source_record FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS party_contacts_tenant_isolation ON mdm.party_contacts;
CREATE POLICY party_contacts_tenant_isolation ON mdm.party_contacts FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS contract_golden_tenant_isolation ON mdm.contract_golden;
CREATE POLICY contract_golden_tenant_isolation ON mdm.contract_golden FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS contract_source_map_tenant_isolation ON mdm.contract_source_map;
CREATE POLICY contract_source_map_tenant_isolation ON mdm.contract_source_map FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS dq_issues_tenant_isolation ON mdm.data_quality_issues;
CREATE POLICY dq_issues_tenant_isolation ON mdm.data_quality_issues FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS match_candidates_tenant_isolation ON mdm.match_candidates;
CREATE POLICY match_candidates_tenant_isolation ON mdm.match_candidates FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS user_profiles_tenant_isolation ON mdm.user_profiles;
CREATE POLICY user_profiles_tenant_isolation ON mdm.user_profiles FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS contract_charges_tenant_isolation ON mdm.contract_charges;
CREATE POLICY contract_charges_tenant_isolation ON mdm.contract_charges FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS ingestion_runs_tenant_isolation ON integration.ingestion_runs;
CREATE POLICY ingestion_runs_tenant_isolation ON integration.ingestion_runs FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS ingestion_items_tenant_isolation ON integration.ingestion_items;
CREATE POLICY ingestion_items_tenant_isolation ON integration.ingestion_items FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS reconciliation_summary_tenant_isolation ON integration.reconciliation_summary;
CREATE POLICY reconciliation_summary_tenant_isolation ON integration.reconciliation_summary FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS data_freshness_tenant_isolation ON integration.data_freshness;
CREATE POLICY data_freshness_tenant_isolation ON integration.data_freshness FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS mapping_templates_tenant_isolation ON integration.mapping_templates;
CREATE POLICY mapping_templates_tenant_isolation ON integration.mapping_templates FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS webhook_endpoints_tenant_isolation ON integration.webhook_endpoints;
CREATE POLICY webhook_endpoints_tenant_isolation ON integration.webhook_endpoints FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

DROP POLICY IF EXISTS scheduled_jobs_tenant_isolation ON integration.scheduled_jobs;
CREATE POLICY scheduled_jobs_tenant_isolation ON integration.scheduled_jobs FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- =============================================================================
-- VERIFICATION: Check tables were created
-- =============================================================================
DO $$
DECLARE
    v_mdm_count INTEGER;
    v_int_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_mdm_count FROM information_schema.tables WHERE table_schema = 'mdm';
    SELECT COUNT(*) INTO v_int_count FROM information_schema.tables WHERE table_schema = 'integration';
    
    RAISE NOTICE '✅ MDM schema created with % tables', v_mdm_count;
    RAISE NOTICE '✅ Integration schema created with % tables', v_int_count;
END $$;
