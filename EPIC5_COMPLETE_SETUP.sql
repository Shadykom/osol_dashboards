-- =============================================================================
-- EPIC 5: Complete Setup Script with Prerequisites Check
-- =============================================================================
-- This is a comprehensive script that:
-- 1. Checks prerequisites
-- 2. Creates platform schema/tenants if missing
-- 3. Creates MDM schema and tables
-- 4. Creates Integration schema and tables
-- 5. Enables RLS
-- 6. Seeds reference data
-- =============================================================================

-- =============================================================================
-- STEP 1: Check and Create Prerequisites
-- =============================================================================

-- Ensure pgcrypto is available
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create platform schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS platform;

-- Create tenants table if it doesn't exist
CREATE TABLE IF NOT EXISTS platform.tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) UNIQUE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    settings_json JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Insert a default tenant if none exists
INSERT INTO platform.tenants (id, name, code, status)
SELECT 
    gen_random_uuid(),
    'Default Tenant',
    'DEFAULT',
    'active'
WHERE NOT EXISTS (SELECT 1 FROM platform.tenants LIMIT 1);

-- =============================================================================
-- STEP 2: Create MDM Schema
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

-- Match Candidates (for manual review)
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

-- User Profiles (extends platform.users with MDM-specific data)
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
-- STEP 3: Create Integration Schema
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

-- Ingestion Items (Individual record processing)
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

-- Data Freshness Tracking
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
-- STEP 4: Enable Row Level Security
-- =============================================================================

-- Enable RLS on all MDM tables
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

-- Enable RLS on all Integration tables
ALTER TABLE integration.ingestion_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.ingestion_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.reconciliation_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.data_freshness ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.mapping_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.webhook_endpoints ENABLE ROW LEVEL SECURITY;
ALTER TABLE integration.scheduled_jobs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for MDM tables
DO $$
DECLARE
    table_record RECORD;
    policy_name TEXT;
BEGIN
    FOR table_record IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'mdm'
    LOOP
        policy_name := 'tenant_isolation_' || table_record.tablename;
        EXECUTE format('DROP POLICY IF EXISTS %I ON mdm.%I', policy_name, table_record.tablename);
        EXECUTE format(
            'CREATE POLICY %I ON mdm.%I FOR ALL USING (tenant_id = current_setting(''app.current_tenant'')::uuid)',
            policy_name, table_record.tablename
        );
    END LOOP;
END $$;

-- Create RLS policies for Integration tables
DO $$
DECLARE
    table_record RECORD;
    policy_name TEXT;
BEGIN
    FOR table_record IN 
        SELECT tablename FROM pg_tables WHERE schemaname = 'integration'
    LOOP
        policy_name := 'tenant_isolation_' || table_record.tablename;
        EXECUTE format('DROP POLICY IF EXISTS %I ON integration.%I', policy_name, table_record.tablename);
        EXECUTE format(
            'CREATE POLICY %I ON integration.%I FOR ALL USING (tenant_id = current_setting(''app.current_tenant'')::uuid)',
            policy_name, table_record.tablename
        );
    END LOOP;
END $$;

-- =============================================================================
-- STEP 5: Create Update Triggers
-- =============================================================================

-- Create updated_at trigger function if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to MDM tables
DO $$
DECLARE
    tbl_name TEXT;
    trigger_name TEXT;
BEGIN
    FOR tbl_name IN SELECT unnest(ARRAY['source_systems', 'reference_data', 'party_golden', 'party_contacts', 'contract_golden', 'contract_charges', 'user_profiles'])
    LOOP
        trigger_name := 'update_' || tbl_name || '_updated_at';
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON mdm.%I', trigger_name, tbl_name);
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE ON mdm.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            trigger_name, tbl_name
        );
    END LOOP;
END $$;

-- Apply triggers to Integration tables
DO $$
DECLARE
    tbl_name TEXT;
    trigger_name TEXT;
BEGIN
    FOR tbl_name IN SELECT unnest(ARRAY['data_freshness', 'mapping_templates', 'webhook_endpoints', 'scheduled_jobs'])
    LOOP
        trigger_name := 'update_' || tbl_name || '_updated_at';
        EXECUTE format('DROP TRIGGER IF EXISTS %I ON integration.%I', trigger_name, tbl_name);
        EXECUTE format(
            'CREATE TRIGGER %I BEFORE UPDATE ON integration.%I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column()',
            trigger_name, tbl_name
        );
    END LOOP;
END $$;

-- =============================================================================
-- STEP 6: Seed Reference Data
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
        RAISE EXCEPTION 'No active tenant found. Please check platform.tenants table.';
    END IF;
    
    RAISE NOTICE '✅ Using tenant ID: %', v_tenant_id;
    
    -- Set tenant context for RLS
    PERFORM set_config('app.current_tenant', v_tenant_id::text, true);
    
    -- Seed Source Systems
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (
        v_tenant_id, 'LMS', 'Loan Management System',
        'Primary source for loan and contract data', 'active',
        '{"priority": 1, "trustLevel": "high", "dataTypes": ["PARTY", "CONTRACT", "CHARGE"]}'::jsonb
    )
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_lms_source_id;
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (
        v_tenant_id, 'MANUAL', 'Manual Entry',
        'Manual data entry by staff through UI', 'active',
        '{"priority": 2, "trustLevel": "medium", "dataTypes": ["PARTY", "CONTRACT"]}'::jsonb
    )
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_manual_source_id;
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, description, status, config_json)
    VALUES (
        v_tenant_id, 'API', 'External API Integration',
        'External system API integrations', 'active',
        '{"priority": 3, "trustLevel": "medium", "dataTypes": ["PARTY", "CONTRACT"]}'::jsonb
    )
    ON CONFLICT (tenant_id, code) DO UPDATE SET name = EXCLUDED.name
    RETURNING id INTO v_api_source_id;
    
    RAISE NOTICE '✅ Created source systems: LMS=%, MANUAL=%, API=%', v_lms_source_id, v_manual_source_id, v_api_source_id;
    
    -- Seed Reference Data: COUNTRY
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'COUNTRY', 'SA', 'المملكة العربية السعودية', 'Saudi Arabia', '{"iso3": "SAU", "phoneCode": "+966"}'::jsonb, 1),
    (v_tenant_id, 'COUNTRY', 'AE', 'الإمارات العربية المتحدة', 'United Arab Emirates', '{"iso3": "ARE", "phoneCode": "+971"}'::jsonb, 2),
    (v_tenant_id, 'COUNTRY', 'EG', 'مصر', 'Egypt', '{"iso3": "EGY", "phoneCode": "+20"}'::jsonb, 3),
    (v_tenant_id, 'COUNTRY', 'JO', 'الأردن', 'Jordan', '{"iso3": "JOR", "phoneCode": "+962"}'::jsonb, 4),
    (v_tenant_id, 'COUNTRY', 'KW', 'الكويت', 'Kuwait', '{"iso3": "KWT", "phoneCode": "+965"}'::jsonb, 5),
    (v_tenant_id, 'COUNTRY', 'BH', 'البحرين', 'Bahrain', '{"iso3": "BHR", "phoneCode": "+973"}'::jsonb, 6),
    (v_tenant_id, 'COUNTRY', 'QA', 'قطر', 'Qatar', '{"iso3": "QAT", "phoneCode": "+974"}'::jsonb, 7),
    (v_tenant_id, 'COUNTRY', 'OM', 'عمان', 'Oman', '{"iso3": "OMN", "phoneCode": "+968"}'::jsonb, 8)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    -- Seed Reference Data: NATIONALITY
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'NATIONALITY', 'SAUDI', 'سعودي', 'Saudi', '{"countryCode": "SA"}'::jsonb, 1),
    (v_tenant_id, 'NATIONALITY', 'EMIRATI', 'إماراتي', 'Emirati', '{"countryCode": "AE"}'::jsonb, 2),
    (v_tenant_id, 'NATIONALITY', 'EGYPTIAN', 'مصري', 'Egyptian', '{"countryCode": "EG"}'::jsonb, 3),
    (v_tenant_id, 'NATIONALITY', 'JORDANIAN', 'أردني', 'Jordanian', '{"countryCode": "JO"}'::jsonb, 4),
    (v_tenant_id, 'NATIONALITY', 'KUWAITI', 'كويتي', 'Kuwaiti', '{"countryCode": "KW"}'::jsonb, 5)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    -- Seed Reference Data: FEE_TYPE
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'FEE_TYPE', 'LATE_FEE', 'رسوم التأخير', 'Late Payment Fee', '{"category": "penalty"}'::jsonb, 1),
    (v_tenant_id, 'FEE_TYPE', 'ADMIN_FEE', 'رسوم إدارية', 'Administrative Fee', '{"category": "service"}'::jsonb, 2),
    (v_tenant_id, 'FEE_TYPE', 'PROCESSING_FEE', 'رسوم المعالجة', 'Processing Fee', '{"category": "service"}'::jsonb, 3),
    (v_tenant_id, 'FEE_TYPE', 'EARLY_SETTLEMENT', 'رسوم التسوية المبكرة', 'Early Settlement Fee', '{"category": "contract"}'::jsonb, 4),
    (v_tenant_id, 'FEE_TYPE', 'COLLECTION_FEE', 'رسوم التحصيل', 'Collection Fee', '{"category": "penalty"}'::jsonb, 5)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    -- Seed Reference Data: CHARGE_TYPE
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'CHARGE_TYPE', 'PENALTY', 'غرامة', 'Penalty', '{"affectsCredit": true}'::jsonb, 1),
    (v_tenant_id, 'CHARGE_TYPE', 'SERVICE_CHARGE', 'رسوم خدمة', 'Service Charge', '{"affectsCredit": false}'::jsonb, 2),
    (v_tenant_id, 'CHARGE_TYPE', 'INTEREST', 'فائدة', 'Interest', '{"affectsCredit": true}'::jsonb, 3),
    (v_tenant_id, 'CHARGE_TYPE', 'PRINCIPAL', 'أصل القرض', 'Principal', '{"affectsCredit": true}'::jsonb, 4)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    -- Seed Reference Data: PARTY_TYPE
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'PARTY_TYPE', 'INDIVIDUAL', 'فرد', 'Individual', '{"requiresNationalId": true}'::jsonb, 1),
    (v_tenant_id, 'PARTY_TYPE', 'CORPORATE', 'شركة', 'Corporate', '{"requiresCR": true}'::jsonb, 2),
    (v_tenant_id, 'PARTY_TYPE', 'SME', 'منشأة صغيرة ومتوسطة', 'Small & Medium Enterprise', '{"requiresCR": true}'::jsonb, 3)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    -- Seed Reference Data: CONTRACT_STATUS
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'CONTRACT_STATUS', 'ACTIVE', 'نشط', 'Active', '{"allowCollection": true}'::jsonb, 1),
    (v_tenant_id, 'CONTRACT_STATUS', 'CLOSED', 'مغلق', 'Closed', '{"allowCollection": false}'::jsonb, 2),
    (v_tenant_id, 'CONTRACT_STATUS', 'DEFAULTED', 'متعثر', 'Defaulted', '{"allowCollection": true}'::jsonb, 3),
    (v_tenant_id, 'CONTRACT_STATUS', 'WRITTEN_OFF', 'شطب', 'Written Off', '{"allowCollection": true}'::jsonb, 4)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    -- Seed Reference Data: ID_TYPE
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'ID_TYPE', 'NATIONAL_ID', 'الهوية الوطنية', 'National ID', '{"format": "^[0-9]{10}$"}'::jsonb, 1),
    (v_tenant_id, 'ID_TYPE', 'IQAMA', 'الإقامة', 'Iqama (Residency)', '{"format": "^[0-9]{10}$"}'::jsonb, 2),
    (v_tenant_id, 'ID_TYPE', 'PASSPORT', 'جواز السفر', 'Passport', '{}'::jsonb, 3),
    (v_tenant_id, 'ID_TYPE', 'CR_NUMBER', 'السجل التجاري', 'Commercial Registration', '{}'::jsonb, 4)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    -- Seed Reference Data: DQ_RULE
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_ar, name_en, extra_json, sort_order) VALUES
    (v_tenant_id, 'DQ_RULE', 'MISSING_PRIMARY_ID', 'معرف رئيسي مفقود', 'Missing Primary Identifier', '{"severity": "critical", "entity": "PARTY"}'::jsonb, 1),
    (v_tenant_id, 'DQ_RULE', 'MISSING_NAME', 'الاسم مفقود', 'Missing Name', '{"severity": "critical", "entity": "PARTY"}'::jsonb, 2),
    (v_tenant_id, 'DQ_RULE', 'INVALID_PHONE', 'رقم هاتف غير صالح', 'Invalid Phone Format', '{"severity": "medium", "entity": "PARTY"}'::jsonb, 3),
    (v_tenant_id, 'DQ_RULE', 'INVALID_EMAIL', 'بريد إلكتروني غير صالح', 'Invalid Email Format', '{"severity": "medium", "entity": "PARTY"}'::jsonb, 4)
    ON CONFLICT (tenant_id, domain, code) DO UPDATE SET name_ar = EXCLUDED.name_ar, name_en = EXCLUDED.name_en;
    
    -- Seed Mapping Templates
    INSERT INTO integration.mapping_templates (
        tenant_id, source_system_id, dataset, name, description, is_default, mapping_json
    ) VALUES (
        v_tenant_id, v_lms_source_id, 'PARTY', 'LMS Party Default Mapping',
        'Default mapping template for party data from LMS', true,
        '{
            "externalRefField": "customer_id",
            "partyTypeField": "customer_type",
            "partyTypeMapping": {"I": "PERSON", "C": "ORGANIZATION"},
            "nameFields": {"primary": "full_name", "primaryAr": "full_name_ar"},
            "identifierFields": [{"field": "national_id", "type": "NATIONAL_ID"}],
            "contactFields": [{"field": "mobile", "type": "MOBILE"}]
        }'::jsonb
    )
    ON CONFLICT (tenant_id, source_system_id, dataset, name, version) DO UPDATE 
    SET mapping_json = EXCLUDED.mapping_json;
    
    INSERT INTO integration.mapping_templates (
        tenant_id, source_system_id, dataset, name, description, is_default, mapping_json
    ) VALUES (
        v_tenant_id, v_lms_source_id, 'CONTRACT', 'LMS Contract Default Mapping',
        'Default mapping template for contract data from LMS', true,
        '{
            "externalRefField": "loan_account_number",
            "partyRefField": "customer_id",
            "contractNumberField": "loan_account_number",
            "statusField": "status"
        }'::jsonb
    )
    ON CONFLICT (tenant_id, source_system_id, dataset, name, version) DO UPDATE 
    SET mapping_json = EXCLUDED.mapping_json;
    
    INSERT INTO integration.mapping_templates (
        tenant_id, source_system_id, dataset, name, description, is_default, mapping_json
    ) VALUES (
        v_tenant_id, v_manual_source_id, 'PARTY', 'Manual Party Entry Mapping',
        'Mapping template for manual party data entry', true,
        '{
            "externalRefField": "external_ref",
            "partyTypeField": "party_type",
            "nameFields": {"primary": "name"}
        }'::jsonb
    )
    ON CONFLICT (tenant_id, source_system_id, dataset, name, version) DO UPDATE 
    SET mapping_json = EXCLUDED.mapping_json;
    
    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ EPIC 5 Setup Completed Successfully!';
    RAISE NOTICE '========================================';
    
END $$;

-- =============================================================================
-- VERIFICATION: Show what was created
-- =============================================================================

SELECT '========== VERIFICATION RESULTS ==========' as info;

SELECT 'Schemas Created:' as info;
SELECT schema_name FROM information_schema.schemata WHERE schema_name IN ('platform', 'mdm', 'integration');

SELECT 'MDM Tables:' as info;
SELECT COUNT(*) as mdm_table_count FROM information_schema.tables WHERE table_schema = 'mdm';

SELECT 'Integration Tables:' as info;
SELECT COUNT(*) as integration_table_count FROM information_schema.tables WHERE table_schema = 'integration';

SELECT 'Tenants:' as info;
SELECT id, name, code, status FROM platform.tenants;

SELECT 'Source Systems:' as info;
SELECT id, code, name, status FROM mdm.source_systems;

SELECT 'Reference Data by Domain:' as info;
SELECT domain, COUNT(*) as count FROM mdm.reference_data GROUP BY domain ORDER BY domain;

SELECT 'Mapping Templates:' as info;
SELECT id, dataset, name FROM integration.mapping_templates;
