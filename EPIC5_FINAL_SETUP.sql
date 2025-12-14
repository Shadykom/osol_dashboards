-- =============================================================================
-- EPIC 5: Final Setup Script (Validated Against Existing Schema)
-- =============================================================================
-- This script is validated against the actual platform.tenants schema
-- Run this in Supabase SQL Editor
-- =============================================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- PREREQUISITE CHECK: Verify platform.tenants exists and has data
-- =============================================================================

DO $$
DECLARE
    v_tenant_count INTEGER;
    v_tenant_id UUID;
BEGIN
    -- Check if platform.tenants exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'platform' AND table_name = 'tenants'
    ) THEN
        RAISE EXCEPTION 'ERROR: platform.tenants table does not exist. Please run EPIC 1 migrations first.';
    END IF;
    
    -- Check if there are any tenants
    SELECT COUNT(*) INTO v_tenant_count FROM platform.tenants;
    
    IF v_tenant_count = 0 THEN
        -- Insert a default tenant (matching actual schema: id, name, status, default_language, timezone)
        INSERT INTO platform.tenants (name, status, default_language, timezone)
        VALUES ('Default Tenant', 'active', 'en', 'UTC')
        RETURNING id INTO v_tenant_id;
        RAISE NOTICE '✅ Created default tenant with ID: %', v_tenant_id;
    ELSE
        SELECT id INTO v_tenant_id FROM platform.tenants WHERE status = 'active' LIMIT 1;
        RAISE NOTICE '✅ Found existing tenant with ID: %', v_tenant_id;
    END IF;
END $$;

-- =============================================================================
-- STEP 1: Create MDM Schema and Tables
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
    party_id UUID NOT NULL REFERENCES mdm.party_golden(party_id) ON DELETE CASCADE,
    external_party_ref VARCHAR(255) NOT NULL,
    raw_payload JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    ingestion_run_id UUID,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_source_record_tenant ON mdm.party_source_record(tenant_id);
CREATE INDEX IF NOT EXISTS idx_party_source_record_party ON mdm.party_source_record(party_id);
CREATE INDEX IF NOT EXISTS idx_party_source_record_run ON mdm.party_source_record(ingestion_run_id);

-- Party Contacts
CREATE TABLE IF NOT EXISTS mdm.party_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(party_id) ON DELETE CASCADE,
    contact_type VARCHAR(20) NOT NULL CHECK (contact_type IN ('PHONE', 'MOBILE', 'EMAIL', 'ADDRESS', 'FAX')),
    contact_value VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    source_system_id UUID REFERENCES mdm.source_systems(id),
    extra_json JSONB DEFAULT '{}'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'invalid')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_party_contacts_tenant ON mdm.party_contacts(tenant_id);
CREATE INDEX IF NOT EXISTS idx_party_contacts_party ON mdm.party_contacts(party_id);
CREATE INDEX IF NOT EXISTS idx_party_contacts_type ON mdm.party_contacts(tenant_id, contact_type);

-- Contract Golden Records
CREATE TABLE IF NOT EXISTS mdm.contract_golden (
    contract_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(party_id) ON DELETE CASCADE,
    contract_number VARCHAR(100) NOT NULL,
    product_code VARCHAR(50),
    is_secured BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'closed', 'defaulted', 'written_off')),
    start_date DATE,
    end_date DATE,
    attributes_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    CONSTRAINT unique_contract_number_per_tenant UNIQUE (tenant_id, contract_number)
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
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_contract_source_map UNIQUE (tenant_id, source_system_id, external_contract_ref)
);

CREATE INDEX IF NOT EXISTS idx_contract_source_map_tenant ON mdm.contract_source_map(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_source_map_contract ON mdm.contract_source_map(contract_id);

-- Contract Charges
CREATE TABLE IF NOT EXISTS mdm.contract_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES mdm.contract_golden(contract_id) ON DELETE CASCADE,
    charge_type VARCHAR(50) NOT NULL,
    charge_code VARCHAR(50),
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    due_date DATE,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'due' CHECK (status IN ('due', 'partial', 'paid', 'waived', 'written_off')),
    source_system_id UUID REFERENCES mdm.source_systems(id),
    external_charge_ref VARCHAR(255),
    attributes_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_contract_charges_tenant ON mdm.contract_charges(tenant_id);
CREATE INDEX IF NOT EXISTS idx_contract_charges_contract ON mdm.contract_charges(contract_id);
CREATE INDEX IF NOT EXISTS idx_contract_charges_status ON mdm.contract_charges(tenant_id, status);

-- Data Quality Issues
CREATE TABLE IF NOT EXISTS mdm.data_quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('critical', 'high', 'medium', 'low', 'info')),
    field_name VARCHAR(100),
    issue_description TEXT NOT NULL,
    suggested_fix TEXT,
    source_system_id UUID REFERENCES mdm.source_systems(id),
    ingestion_run_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'acknowledged', 'resolved', 'ignored')),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dq_issues_tenant ON mdm.data_quality_issues(tenant_id);
CREATE INDEX IF NOT EXISTS idx_dq_issues_entity ON mdm.data_quality_issues(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_dq_issues_status ON mdm.data_quality_issues(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_dq_issues_severity ON mdm.data_quality_issues(tenant_id, severity);

-- Match Candidates
CREATE TABLE IF NOT EXISTS mdm.match_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id_1 UUID NOT NULL,
    entity_id_2 UUID NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL,
    match_fields JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_merged')),
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_candidates_tenant ON mdm.match_candidates(tenant_id);
CREATE INDEX IF NOT EXISTS idx_match_candidates_status ON mdm.match_candidates(tenant_id, status);

-- User Profiles
CREATE TABLE IF NOT EXISTS mdm.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    party_id UUID REFERENCES mdm.party_golden(party_id),
    preferences_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_user_profile_per_tenant UNIQUE (tenant_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_user_profiles_tenant ON mdm.user_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_party ON mdm.user_profiles(party_id);

-- =============================================================================
-- STEP 2: Create Integration Schema and Tables
-- =============================================================================

CREATE SCHEMA IF NOT EXISTS integration;

-- Ingestion Runs
CREATE TABLE IF NOT EXISTS integration.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('FILE', 'MANUAL', 'API', 'DB')),
    status VARCHAR(20) NOT NULL DEFAULT 'running' CHECK (status IN ('running', 'completed', 'failed', 'partial')),
    file_name VARCHAR(500),
    file_size_bytes BIGINT,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    created_records INTEGER DEFAULT 0,
    updated_records INTEGER DEFAULT 0,
    skipped_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    stats_json JSONB DEFAULT '{}'::jsonb,
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    triggered_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_runs_tenant ON integration.ingestion_runs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_source ON integration.ingestion_runs(source_system_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_status ON integration.ingestion_runs(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_ingestion_runs_started ON integration.ingestion_runs(tenant_id, started_at DESC);

-- Ingestion Items
CREATE TABLE IF NOT EXISTS integration.ingestion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    ingestion_run_id UUID NOT NULL REFERENCES integration.ingestion_runs(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    external_ref VARCHAR(255),
    outcome VARCHAR(20) NOT NULL CHECK (outcome IN ('CREATED', 'UPDATED', 'SKIPPED', 'ERROR')),
    entity_type VARCHAR(50),
    entity_id UUID,
    payload_hash VARCHAR(64),
    error_message TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ingestion_items_run ON integration.ingestion_items(ingestion_run_id);
CREATE INDEX IF NOT EXISTS idx_ingestion_items_outcome ON integration.ingestion_items(ingestion_run_id, outcome);
CREATE INDEX IF NOT EXISTS idx_ingestion_items_ref ON integration.ingestion_items(tenant_id, external_ref);

-- Reconciliation Summary
CREATE TABLE IF NOT EXISTS integration.reconciliation_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    ingestion_run_id UUID NOT NULL REFERENCES integration.ingestion_runs(id) ON DELETE CASCADE,
    source_total INTEGER NOT NULL,
    matched_count INTEGER NOT NULL DEFAULT 0,
    created_count INTEGER NOT NULL DEFAULT 0,
    updated_count INTEGER NOT NULL DEFAULT 0,
    error_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,
    discrepancy_notes TEXT,
    reconciled_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reconciliation_run ON integration.reconciliation_summary(ingestion_run_id);

-- Data Freshness
CREATE TABLE IF NOT EXISTS integration.data_freshness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    last_run_id UUID REFERENCES integration.ingestion_runs(id),
    record_count INTEGER DEFAULT 0,
    average_run_duration_ms INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'unknown' CHECK (status IN ('fresh', 'stale', 'critical', 'unknown')),
    freshness_threshold_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_freshness_per_source_dataset UNIQUE (tenant_id, source_system_id, dataset)
);

CREATE INDEX IF NOT EXISTS idx_data_freshness_tenant ON integration.data_freshness(tenant_id);
CREATE INDEX IF NOT EXISTS idx_data_freshness_status ON integration.data_freshness(tenant_id, status);

-- Mapping Templates
CREATE TABLE IF NOT EXISTS integration.mapping_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_default BOOLEAN DEFAULT false,
    mapping_json JSONB NOT NULL,
    validation_rules_json JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft')),
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
    endpoint_path VARCHAR(255) NOT NULL,
    secret_hash VARCHAR(128),
    is_active BOOLEAN DEFAULT true,
    last_called_at TIMESTAMPTZ,
    total_calls INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_webhook_endpoint UNIQUE (tenant_id, endpoint_path)
);

CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_tenant ON integration.webhook_endpoints(tenant_id);
CREATE INDEX IF NOT EXISTS idx_webhook_endpoints_active ON integration.webhook_endpoints(tenant_id, is_active);

-- Scheduled Jobs
CREATE TABLE IF NOT EXISTS integration.scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    job_name VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    config_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT unique_scheduled_job UNIQUE (tenant_id, job_name)
);

CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_tenant ON integration.scheduled_jobs(tenant_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_jobs_next ON integration.scheduled_jobs(next_run_at) WHERE is_active = true;

-- =============================================================================
-- STEP 3: Enable Row Level Security
-- =============================================================================

ALTER TABLE mdm.source_systems ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.reference_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_golden ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_source_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_source_record ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_golden ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_source_map ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.data_quality_issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.match_candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE mdm.user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.ingestion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.reconciliation_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.data_freshness ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- STEP 4: Create RLS Policies
-- =============================================================================

-- MDM Policies
DROP POLICY IF EXISTS tenant_isolation_source_systems ON mdm.source_systems;
CREATE POLICY tenant_isolation_source_systems ON mdm.source_systems FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_reference_data ON mdm.reference_data;
CREATE POLICY tenant_isolation_reference_data ON mdm.reference_data FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_party_golden ON mdm.party_golden;
CREATE POLICY tenant_isolation_party_golden ON mdm.party_golden FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_party_source_map ON mdm.party_source_map;
CREATE POLICY tenant_isolation_party_source_map ON mdm.party_source_map FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_party_source_record ON mdm.party_source_record;
CREATE POLICY tenant_isolation_party_source_record ON mdm.party_source_record FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_party_contacts ON mdm.party_contacts;
CREATE POLICY tenant_isolation_party_contacts ON mdm.party_contacts FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_contract_golden ON mdm.contract_golden;
CREATE POLICY tenant_isolation_contract_golden ON mdm.contract_golden FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_contract_source_map ON mdm.contract_source_map;
CREATE POLICY tenant_isolation_contract_source_map ON mdm.contract_source_map FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_contract_charges ON mdm.contract_charges;
CREATE POLICY tenant_isolation_contract_charges ON mdm.contract_charges FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_data_quality_issues ON mdm.data_quality_issues;
CREATE POLICY tenant_isolation_data_quality_issues ON mdm.data_quality_issues FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_match_candidates ON mdm.match_candidates;
CREATE POLICY tenant_isolation_match_candidates ON mdm.match_candidates FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_user_profiles ON mdm.user_profiles;
CREATE POLICY tenant_isolation_user_profiles ON mdm.user_profiles FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

-- Integration Policies
DROP POLICY IF EXISTS tenant_isolation_ingestion_runs ON integration.ingestion_runs;
CREATE POLICY tenant_isolation_ingestion_runs ON integration.ingestion_runs FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_ingestion_items ON integration.ingestion_items;
CREATE POLICY tenant_isolation_ingestion_items ON integration.ingestion_items FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_reconciliation_summary ON integration.reconciliation_summary;
CREATE POLICY tenant_isolation_reconciliation_summary ON integration.reconciliation_summary FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_data_freshness ON integration.data_freshness;
CREATE POLICY tenant_isolation_data_freshness ON integration.data_freshness FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_mapping_templates ON integration.mapping_templates;
CREATE POLICY tenant_isolation_mapping_templates ON integration.mapping_templates FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_webhook_endpoints ON integration.webhook_endpoints;
CREATE POLICY tenant_isolation_webhook_endpoints ON integration.webhook_endpoints FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

DROP POLICY IF EXISTS tenant_isolation_scheduled_jobs ON integration.scheduled_jobs;
CREATE POLICY tenant_isolation_scheduled_jobs ON integration.scheduled_jobs FOR ALL 
    USING (tenant_id = COALESCE(current_setting('app.current_tenant', true)::uuid, tenant_id));

-- =============================================================================
-- STEP 5: Create Triggers
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- MDM triggers
DROP TRIGGER IF EXISTS update_source_systems_updated_at ON mdm.source_systems;
CREATE TRIGGER update_source_systems_updated_at BEFORE UPDATE ON mdm.source_systems 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_reference_data_updated_at ON mdm.reference_data;
CREATE TRIGGER update_reference_data_updated_at BEFORE UPDATE ON mdm.reference_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_party_golden_updated_at ON mdm.party_golden;
CREATE TRIGGER update_party_golden_updated_at BEFORE UPDATE ON mdm.party_golden 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_party_contacts_updated_at ON mdm.party_contacts;
CREATE TRIGGER update_party_contacts_updated_at BEFORE UPDATE ON mdm.party_contacts 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_golden_updated_at ON mdm.contract_golden;
CREATE TRIGGER update_contract_golden_updated_at BEFORE UPDATE ON mdm.contract_golden 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contract_charges_updated_at ON mdm.contract_charges;
CREATE TRIGGER update_contract_charges_updated_at BEFORE UPDATE ON mdm.contract_charges 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON mdm.user_profiles;
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON mdm.user_profiles 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Integration triggers
DROP TRIGGER IF EXISTS update_data_freshness_updated_at ON integration.data_freshness;
CREATE TRIGGER update_data_freshness_updated_at BEFORE UPDATE ON integration.data_freshness 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_mapping_templates_updated_at ON integration.mapping_templates;
CREATE TRIGGER update_mapping_templates_updated_at BEFORE UPDATE ON integration.mapping_templates 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_webhook_endpoints_updated_at ON integration.webhook_endpoints;
CREATE TRIGGER update_webhook_endpoints_updated_at BEFORE UPDATE ON integration.webhook_endpoints 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_scheduled_jobs_updated_at ON integration.scheduled_jobs;
CREATE TRIGGER update_scheduled_jobs_updated_at BEFORE UPDATE ON integration.scheduled_jobs 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- STEP 6: Seed Data
-- =============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_lms_source_id UUID;
    v_manual_source_id UUID;
    v_api_source_id UUID;
BEGIN
    -- Get first active tenant
    SELECT id INTO v_tenant_id FROM platform.tenants WHERE status = 'active' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        RAISE EXCEPTION 'No active tenant found in platform.tenants';
    END IF;
    
    RAISE NOTICE '✅ Using tenant: %', v_tenant_id;
    
    -- Set tenant context
    PERFORM set_config('app.current_tenant', v_tenant_id::text, true);
    
    -- Source Systems
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (v_tenant_id, 'LMS', 'Loan Management System', 'Primary LMS source', 'active', '{"priority":1}'::jsonb)
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_lms_source_id;
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (v_tenant_id, 'MANUAL', 'Manual Entry', 'Manual data entry', 'active', '{"priority":2}'::jsonb)
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_manual_source_id;
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (v_tenant_id, 'API', 'External API', 'API integrations', 'active', '{"priority":3}'::jsonb)
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_api_source_id;
    
    RAISE NOTICE '✅ Source systems created';
    
    -- Reference Data: COUNTRY
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, sort_order) VALUES
    (v_tenant_id, 'COUNTRY', 'SA', 'السعودية', 'Saudi Arabia', 1),
    (v_tenant_id, 'COUNTRY', 'AE', 'الإمارات', 'UAE', 2),
    (v_tenant_id, 'COUNTRY', 'EG', 'مصر', 'Egypt', 3)
    ON CONFLICT (tenant_id, domain, code) DO NOTHING;
    
    -- Reference Data: PARTY_TYPE
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, sort_order) VALUES
    (v_tenant_id, 'PARTY_TYPE', 'INDIVIDUAL', 'فرد', 'Individual', 1),
    (v_tenant_id, 'PARTY_TYPE', 'CORPORATE', 'شركة', 'Corporate', 2)
    ON CONFLICT (tenant_id, domain, code) DO NOTHING;
    
    -- Reference Data: CONTRACT_STATUS
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, sort_order) VALUES
    (v_tenant_id, 'CONTRACT_STATUS', 'ACTIVE', 'نشط', 'Active', 1),
    (v_tenant_id, 'CONTRACT_STATUS', 'CLOSED', 'مغلق', 'Closed', 2),
    (v_tenant_id, 'CONTRACT_STATUS', 'DEFAULTED', 'متعثر', 'Defaulted', 3)
    ON CONFLICT (tenant_id, domain, code) DO NOTHING;
    
    -- Reference Data: ID_TYPE
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, sort_order) VALUES
    (v_tenant_id, 'ID_TYPE', 'NATIONAL_ID', 'الهوية', 'National ID', 1),
    (v_tenant_id, 'ID_TYPE', 'PASSPORT', 'جواز السفر', 'Passport', 2)
    ON CONFLICT (tenant_id, domain, code) DO NOTHING;
    
    RAISE NOTICE '✅ Reference data created';
    
    -- Mapping Templates
    INSERT INTO integration.mapping_templates (tenant_id, source_system_id, dataset, name, is_default, mapping_json)
    VALUES (v_tenant_id, v_lms_source_id, 'PARTY', 'LMS Party Mapping', true, 
        '{"externalRefField":"customer_id","nameFields":{"primary":"full_name"}}'::jsonb)
    ON CONFLICT (tenant_id, source_system_id, dataset, name, version) DO NOTHING;
    
    INSERT INTO integration.mapping_templates (tenant_id, source_system_id, dataset, name, is_default, mapping_json)
    VALUES (v_tenant_id, v_lms_source_id, 'CONTRACT', 'LMS Contract Mapping', true,
        '{"externalRefField":"loan_account_number","contractNumberField":"loan_account_number"}'::jsonb)
    ON CONFLICT (tenant_id, source_system_id, dataset, name, version) DO NOTHING;
    
    RAISE NOTICE '✅ Mapping templates created';
    
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE '✅ EPIC 5 SETUP COMPLETED SUCCESSFULLY!';
    RAISE NOTICE '==========================================';
END $$;

-- =============================================================================
-- FINAL VERIFICATION
-- =============================================================================

SELECT '=== VERIFICATION ===' as status;

SELECT 'Schemas' as check_type, schema_name as name 
FROM information_schema.schemata 
WHERE schema_name IN ('platform', 'mdm', 'integration');

SELECT 'MDM Tables' as check_type, COUNT(*)::text as count 
FROM information_schema.tables WHERE table_schema = 'mdm';

SELECT 'Integration Tables' as check_type, COUNT(*)::text as count 
FROM information_schema.tables WHERE table_schema = 'integration';

SELECT 'Tenants' as check_type, COUNT(*)::text as count FROM platform.tenants;

SELECT 'Source Systems' as check_type, COUNT(*)::text as count FROM mdm.source_systems;

SELECT 'Reference Data' as check_type, COUNT(*)::text as count FROM mdm.reference_data;

SELECT 'Mapping Templates' as check_type, COUNT(*)::text as count FROM integration.mapping_templates;
