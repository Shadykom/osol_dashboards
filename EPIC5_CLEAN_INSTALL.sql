-- =============================================================================
-- EPIC 5: Clean Install (Drops existing and recreates)
-- =============================================================================
-- Run this in Supabase SQL Editor
-- =============================================================================

-- =============================================================================
-- STEP 0: Clean up any existing EPIC 5 objects
-- =============================================================================

-- Drop integration schema completely (cascades to all tables)
DROP SCHEMA IF EXISTS integration CASCADE;

-- Drop mdm schema completely (cascades to all tables)
DROP SCHEMA IF EXISTS mdm CASCADE;

-- =============================================================================
-- STEP 1: Create MDM Schema
-- =============================================================================

CREATE SCHEMA mdm;

-- 1. Source Systems (no FK dependencies)
CREATE TABLE mdm.source_systems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    config_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (tenant_id, code)
);

-- 2. Reference Data (no FK dependencies except tenant)
CREATE TABLE mdm.reference_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    domain VARCHAR(50) NOT NULL,
    code VARCHAR(50) NOT NULL,
    name_ar VARCHAR(255),
    name_en VARCHAR(255),
    extra_json JSONB DEFAULT '{}',
    sort_order INTEGER DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (tenant_id, domain, code)
);

-- 3. Party Golden (no FK dependencies except tenant)
CREATE TABLE mdm.party_golden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    party_type VARCHAR(20) NOT NULL,
    primary_name VARCHAR(500) NOT NULL,
    primary_name_ar VARCHAR(500),
    identifiers_json JSONB DEFAULT '[]',
    attributes_json JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    merge_target_id UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- 4. Party Source Map (depends on source_systems, party_golden)
CREATE TABLE mdm.party_source_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    external_party_ref VARCHAR(255) NOT NULL,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(id) ON DELETE CASCADE,
    payload_hash VARCHAR(64),
    confidence_score DECIMAL(5,4) DEFAULT 1.0,
    match_method VARCHAR(50),
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, source_system_id, external_party_ref)
);

-- 5. Party Source Record (depends on source_systems, party_golden)
CREATE TABLE mdm.party_source_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(id) ON DELETE CASCADE,
    external_party_ref VARCHAR(255) NOT NULL,
    raw_payload JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    ingestion_run_id UUID,
    received_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. Party Contacts (depends on party_golden, source_systems)
CREATE TABLE mdm.party_contacts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(id) ON DELETE CASCADE,
    contact_type VARCHAR(20) NOT NULL,
    contact_value VARCHAR(500) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    source_system_id UUID REFERENCES mdm.source_systems(id),
    extra_json JSONB DEFAULT '{}',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. Contract Golden (depends on party_golden)
CREATE TABLE mdm.contract_golden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    party_id UUID NOT NULL REFERENCES mdm.party_golden(id) ON DELETE CASCADE,
    contract_number VARCHAR(100) NOT NULL,
    product_code VARCHAR(50),
    is_secured BOOLEAN DEFAULT false,
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    start_date DATE,
    end_date DATE,
    attributes_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (tenant_id, contract_number)
);

-- 8. Contract Source Map (depends on source_systems, contract_golden)
CREATE TABLE mdm.contract_source_map (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    external_contract_ref VARCHAR(255) NOT NULL,
    contract_id UUID NOT NULL REFERENCES mdm.contract_golden(id) ON DELETE CASCADE,
    payload_hash VARCHAR(64),
    effective_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, source_system_id, external_contract_ref)
);

-- 9. Contract Charges (depends on contract_golden, source_systems)
CREATE TABLE mdm.contract_charges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    contract_id UUID NOT NULL REFERENCES mdm.contract_golden(id) ON DELETE CASCADE,
    charge_type VARCHAR(50) NOT NULL,
    charge_code VARCHAR(50),
    amount DECIMAL(18,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'SAR',
    due_date DATE,
    paid_amount DECIMAL(18,2) DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'due',
    source_system_id UUID REFERENCES mdm.source_systems(id),
    external_charge_ref VARCHAR(255),
    attributes_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 10. Data Quality Issues
CREATE TABLE mdm.data_quality_issues (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    rule_code VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    field_name VARCHAR(100),
    issue_description TEXT NOT NULL,
    suggested_fix TEXT,
    source_system_id UUID REFERENCES mdm.source_systems(id),
    ingestion_run_id UUID,
    status VARCHAR(20) NOT NULL DEFAULT 'open',
    resolved_at TIMESTAMPTZ,
    resolved_by UUID,
    resolution_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 11. Match Candidates
CREATE TABLE mdm.match_candidates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL,
    entity_id_1 UUID NOT NULL,
    entity_id_2 UUID NOT NULL,
    similarity_score DECIMAL(5,4) NOT NULL,
    match_fields JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    reviewed_by UUID,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 12. User Profiles
CREATE TABLE mdm.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL,
    party_id UUID REFERENCES mdm.party_golden(id),
    preferences_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, user_id)
);

-- =============================================================================
-- STEP 2: Create Integration Schema
-- =============================================================================

CREATE SCHEMA integration;

-- 1. Ingestion Runs
CREATE TABLE integration.ingestion_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    method VARCHAR(20) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'running',
    file_name VARCHAR(500),
    file_size_bytes BIGINT,
    total_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    created_records INTEGER DEFAULT 0,
    updated_records INTEGER DEFAULT 0,
    skipped_records INTEGER DEFAULT 0,
    error_records INTEGER DEFAULT 0,
    stats_json JSONB DEFAULT '{}',
    error_message TEXT,
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    triggered_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Ingestion Items
CREATE TABLE integration.ingestion_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    ingestion_run_id UUID NOT NULL REFERENCES integration.ingestion_runs(id) ON DELETE CASCADE,
    row_number INTEGER NOT NULL,
    external_ref VARCHAR(255),
    outcome VARCHAR(20) NOT NULL,
    entity_type VARCHAR(50),
    entity_id UUID,
    payload_hash VARCHAR(64),
    error_message TEXT,
    raw_data JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Reconciliation Summary
CREATE TABLE integration.reconciliation_summary (
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

-- 4. Data Freshness
CREATE TABLE integration.data_freshness (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    last_success_at TIMESTAMPTZ,
    last_failure_at TIMESTAMPTZ,
    last_run_id UUID REFERENCES integration.ingestion_runs(id),
    record_count INTEGER DEFAULT 0,
    average_run_duration_ms INTEGER,
    status VARCHAR(20) NOT NULL DEFAULT 'unknown',
    freshness_threshold_hours INTEGER DEFAULT 24,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, source_system_id, dataset)
);

-- 5. Mapping Templates
CREATE TABLE integration.mapping_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    version INTEGER DEFAULT 1,
    is_default BOOLEAN DEFAULT false,
    mapping_json JSONB NOT NULL,
    validation_rules_json JSONB DEFAULT '[]',
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID,
    updated_by UUID,
    UNIQUE (tenant_id, source_system_id, dataset, name, version)
);

-- 6. Webhook Endpoints
CREATE TABLE integration.webhook_endpoints (
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
    UNIQUE (tenant_id, endpoint_path)
);

-- 7. Scheduled Jobs
CREATE TABLE integration.scheduled_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    dataset VARCHAR(50) NOT NULL,
    job_name VARCHAR(255) NOT NULL,
    cron_expression VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    config_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (tenant_id, job_name)
);

-- =============================================================================
-- STEP 3: Create Indexes
-- =============================================================================

CREATE INDEX idx_source_systems_tenant ON mdm.source_systems(tenant_id);
CREATE INDEX idx_reference_data_tenant ON mdm.reference_data(tenant_id);
CREATE INDEX idx_reference_data_domain ON mdm.reference_data(tenant_id, domain);
CREATE INDEX idx_party_golden_tenant ON mdm.party_golden(tenant_id);
CREATE INDEX idx_party_golden_name ON mdm.party_golden(tenant_id, primary_name);
CREATE INDEX idx_party_source_map_tenant ON mdm.party_source_map(tenant_id);
CREATE INDEX idx_party_source_map_party ON mdm.party_source_map(party_id);
CREATE INDEX idx_party_contacts_tenant ON mdm.party_contacts(tenant_id);
CREATE INDEX idx_party_contacts_party ON mdm.party_contacts(party_id);
CREATE INDEX idx_contract_golden_tenant ON mdm.contract_golden(tenant_id);
CREATE INDEX idx_contract_golden_party ON mdm.contract_golden(party_id);
CREATE INDEX idx_contract_source_map_tenant ON mdm.contract_source_map(tenant_id);
CREATE INDEX idx_contract_charges_tenant ON mdm.contract_charges(tenant_id);
CREATE INDEX idx_contract_charges_contract ON mdm.contract_charges(contract_id);
CREATE INDEX idx_dq_issues_tenant ON mdm.data_quality_issues(tenant_id);
CREATE INDEX idx_match_candidates_tenant ON mdm.match_candidates(tenant_id);
CREATE INDEX idx_user_profiles_tenant ON mdm.user_profiles(tenant_id);
CREATE INDEX idx_ingestion_runs_tenant ON integration.ingestion_runs(tenant_id);
CREATE INDEX idx_ingestion_items_run ON integration.ingestion_items(ingestion_run_id);
CREATE INDEX idx_data_freshness_tenant ON integration.data_freshness(tenant_id);
CREATE INDEX idx_mapping_templates_tenant ON integration.mapping_templates(tenant_id);

-- =============================================================================
-- STEP 4: Enable RLS
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
-- STEP 5: Create RLS Policies (permissive for now)
-- =============================================================================

CREATE POLICY rls_source_systems ON mdm.source_systems FOR ALL USING (true);
CREATE POLICY rls_reference_data ON mdm.reference_data FOR ALL USING (true);
CREATE POLICY rls_party_golden ON mdm.party_golden FOR ALL USING (true);
CREATE POLICY rls_party_source_map ON mdm.party_source_map FOR ALL USING (true);
CREATE POLICY rls_party_source_record ON mdm.party_source_record FOR ALL USING (true);
CREATE POLICY rls_party_contacts ON mdm.party_contacts FOR ALL USING (true);
CREATE POLICY rls_contract_golden ON mdm.contract_golden FOR ALL USING (true);
CREATE POLICY rls_contract_source_map ON mdm.contract_source_map FOR ALL USING (true);
CREATE POLICY rls_contract_charges ON mdm.contract_charges FOR ALL USING (true);
CREATE POLICY rls_data_quality_issues ON mdm.data_quality_issues FOR ALL USING (true);
CREATE POLICY rls_match_candidates ON mdm.match_candidates FOR ALL USING (true);
CREATE POLICY rls_user_profiles ON mdm.user_profiles FOR ALL USING (true);
CREATE POLICY rls_ingestion_runs ON integration.ingestion_runs FOR ALL USING (true);
CREATE POLICY rls_ingestion_items ON integration.ingestion_items FOR ALL USING (true);
CREATE POLICY rls_reconciliation_summary ON integration.reconciliation_summary FOR ALL USING (true);
CREATE POLICY rls_data_freshness ON integration.data_freshness FOR ALL USING (true);
CREATE POLICY rls_mapping_templates ON integration.mapping_templates FOR ALL USING (true);
CREATE POLICY rls_webhook_endpoints ON integration.webhook_endpoints FOR ALL USING (true);
CREATE POLICY rls_scheduled_jobs ON integration.scheduled_jobs FOR ALL USING (true);

-- =============================================================================
-- STEP 6: Seed Data
-- =============================================================================

DO $$
DECLARE
    v_tenant_id UUID;
    v_lms_id UUID;
    v_manual_id UUID;
BEGIN
    -- Get tenant
    SELECT id INTO v_tenant_id FROM platform.tenants WHERE status = 'active' LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
        INSERT INTO platform.tenants (name, status) VALUES ('Default', 'active')
        RETURNING id INTO v_tenant_id;
    END IF;
    
    RAISE NOTICE 'Tenant: %', v_tenant_id;
    
    -- Source Systems
    INSERT INTO mdm.source_systems (tenant_id, code, name, status) 
    VALUES (v_tenant_id, 'LMS', 'Loan Management System', 'active')
    RETURNING id INTO v_lms_id;
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, status) 
    VALUES (v_tenant_id, 'MANUAL', 'Manual Entry', 'active')
    RETURNING id INTO v_manual_id;
    
    INSERT INTO mdm.source_systems (tenant_id, code, name, status) 
    VALUES (v_tenant_id, 'API', 'External API', 'active');
    
    -- Reference Data
    INSERT INTO mdm.reference_data (tenant_id, domain, code, name_en, name_ar) VALUES
    (v_tenant_id, 'COUNTRY', 'SA', 'Saudi Arabia', 'السعودية'),
    (v_tenant_id, 'COUNTRY', 'AE', 'UAE', 'الإمارات'),
    (v_tenant_id, 'PARTY_TYPE', 'INDIVIDUAL', 'Individual', 'فرد'),
    (v_tenant_id, 'PARTY_TYPE', 'CORPORATE', 'Corporate', 'شركة'),
    (v_tenant_id, 'CONTRACT_STATUS', 'ACTIVE', 'Active', 'نشط'),
    (v_tenant_id, 'CONTRACT_STATUS', 'CLOSED', 'Closed', 'مغلق'),
    (v_tenant_id, 'ID_TYPE', 'NATIONAL_ID', 'National ID', 'الهوية');
    
    -- Mapping Templates
    INSERT INTO integration.mapping_templates (tenant_id, source_system_id, dataset, name, is_default, mapping_json)
    VALUES (v_tenant_id, v_lms_id, 'PARTY', 'Default Party Mapping', true, '{"externalRefField":"customer_id"}');
    
    INSERT INTO integration.mapping_templates (tenant_id, source_system_id, dataset, name, is_default, mapping_json)
    VALUES (v_tenant_id, v_lms_id, 'CONTRACT', 'Default Contract Mapping', true, '{"externalRefField":"loan_id"}');
    
    RAISE NOTICE '✅ Seed data created';
END $$;

-- =============================================================================
-- VERIFICATION
-- =============================================================================

SELECT '✅ EPIC 5 INSTALLATION COMPLETE' as status;

SELECT 'MDM Tables' as type, COUNT(*) as count FROM information_schema.tables WHERE table_schema = 'mdm'
UNION ALL
SELECT 'Integration Tables', COUNT(*) FROM information_schema.tables WHERE table_schema = 'integration'
UNION ALL
SELECT 'Source Systems', COUNT(*) FROM mdm.source_systems
UNION ALL
SELECT 'Reference Data', COUNT(*) FROM mdm.reference_data
UNION ALL
SELECT 'Mapping Templates', COUNT(*) FROM integration.mapping_templates;
