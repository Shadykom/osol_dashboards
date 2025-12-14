-- =============================================================================
-- Migration 020: Create MDM (Master Data Management) Schema
-- Description: Creates the MDM schema with golden records, source mapping, 
--              reference data, and data quality tables
-- EPIC 5 - Integration & Comprehensive MDM
-- =============================================================================

-- Create the MDM schema
CREATE SCHEMA IF NOT EXISTS mdm;

-- =============================================================================
-- Table: mdm.source_systems
-- Description: Registered source systems for data ingestion
-- =============================================================================
CREATE TABLE mdm.source_systems (
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

CREATE INDEX idx_source_systems_tenant ON mdm.source_systems(tenant_id);
CREATE INDEX idx_source_systems_status ON mdm.source_systems(tenant_id, status);

-- =============================================================================
-- Table: mdm.reference_data
-- Description: Universal reference data (countries, nationalities, fee types, etc.)
-- =============================================================================
CREATE TABLE mdm.reference_data (
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

CREATE INDEX idx_reference_data_tenant ON mdm.reference_data(tenant_id);
CREATE INDEX idx_reference_data_domain ON mdm.reference_data(tenant_id, domain);
CREATE INDEX idx_reference_data_status ON mdm.reference_data(tenant_id, status);

-- =============================================================================
-- Table: mdm.party_golden
-- Description: Golden records for parties (persons and organizations)
-- =============================================================================
CREATE TABLE mdm.party_golden (
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

CREATE INDEX idx_party_golden_tenant ON mdm.party_golden(tenant_id);
CREATE INDEX idx_party_golden_type ON mdm.party_golden(tenant_id, party_type);
CREATE INDEX idx_party_golden_status ON mdm.party_golden(tenant_id, status);
CREATE INDEX idx_party_golden_name ON mdm.party_golden(tenant_id, primary_name);
CREATE INDEX idx_party_golden_identifiers ON mdm.party_golden USING GIN (identifiers_json);

-- =============================================================================
-- Table: mdm.party_source_map
-- Description: Maps external party references to golden records
-- =============================================================================
CREATE TABLE mdm.party_source_map (
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

CREATE INDEX idx_party_source_map_tenant ON mdm.party_source_map(tenant_id);
CREATE INDEX idx_party_source_map_party ON mdm.party_source_map(party_id);
CREATE INDEX idx_party_source_map_hash ON mdm.party_source_map(payload_hash);

-- =============================================================================
-- Table: mdm.party_source_record
-- Description: Raw source records for parties (audit/lineage)
-- =============================================================================
CREATE TABLE mdm.party_source_record (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES platform.tenants(id) ON DELETE CASCADE,
    source_system_id UUID NOT NULL REFERENCES mdm.source_systems(id) ON DELETE CASCADE,
    external_party_ref VARCHAR(255) NOT NULL,
    payload_json JSONB NOT NULL,
    payload_hash VARCHAR(64) NOT NULL,
    ingestion_run_id UUID,
    ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_party_source_record_tenant ON mdm.party_source_record(tenant_id);
CREATE INDEX idx_party_source_record_ref ON mdm.party_source_record(tenant_id, source_system_id, external_party_ref);
CREATE INDEX idx_party_source_record_run ON mdm.party_source_record(ingestion_run_id);

-- =============================================================================
-- Table: mdm.party_contacts
-- Description: Contact information for parties
-- =============================================================================
CREATE TABLE mdm.party_contacts (
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

CREATE INDEX idx_party_contacts_tenant ON mdm.party_contacts(tenant_id);
CREATE INDEX idx_party_contacts_party ON mdm.party_contacts(party_id);
CREATE INDEX idx_party_contacts_type ON mdm.party_contacts(tenant_id, contact_type);
CREATE INDEX idx_party_contacts_primary ON mdm.party_contacts(party_id, is_primary) WHERE is_primary = TRUE;

-- =============================================================================
-- Table: mdm.contract_golden
-- Description: Golden records for contracts
-- =============================================================================
CREATE TABLE mdm.contract_golden (
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

CREATE INDEX idx_contract_golden_tenant ON mdm.contract_golden(tenant_id);
CREATE INDEX idx_contract_golden_party ON mdm.contract_golden(party_id);
CREATE INDEX idx_contract_golden_status ON mdm.contract_golden(tenant_id, status);
CREATE INDEX idx_contract_golden_number ON mdm.contract_golden(tenant_id, contract_number);
CREATE INDEX idx_contract_golden_keys ON mdm.contract_golden USING GIN (contract_keys_json);

-- =============================================================================
-- Table: mdm.contract_source_map
-- Description: Maps external contract references to golden records
-- =============================================================================
CREATE TABLE mdm.contract_source_map (
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

CREATE INDEX idx_contract_source_map_tenant ON mdm.contract_source_map(tenant_id);
CREATE INDEX idx_contract_source_map_contract ON mdm.contract_source_map(contract_id);
CREATE INDEX idx_contract_source_map_hash ON mdm.contract_source_map(payload_hash);

-- =============================================================================
-- Table: mdm.data_quality_issues
-- Description: Data quality issues detected during ingestion or validation
-- =============================================================================
CREATE TABLE mdm.data_quality_issues (
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

CREATE INDEX idx_dq_issues_tenant ON mdm.data_quality_issues(tenant_id);
CREATE INDEX idx_dq_issues_entity ON mdm.data_quality_issues(tenant_id, entity_type, entity_id);
CREATE INDEX idx_dq_issues_severity ON mdm.data_quality_issues(tenant_id, severity);
CREATE INDEX idx_dq_issues_status ON mdm.data_quality_issues(tenant_id, status);
CREATE INDEX idx_dq_issues_rule ON mdm.data_quality_issues(tenant_id, rule_code);

-- =============================================================================
-- Table: mdm.match_candidates
-- Description: Potential duplicate matches for review
-- =============================================================================
CREATE TABLE mdm.match_candidates (
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

CREATE INDEX idx_match_candidates_tenant ON mdm.match_candidates(tenant_id);
CREATE INDEX idx_match_candidates_status ON mdm.match_candidates(tenant_id, status);
CREATE INDEX idx_match_candidates_score ON mdm.match_candidates(tenant_id, match_score);

-- =============================================================================
-- Table: mdm.user_profiles
-- Description: Operational user profiles (NOT auth - just MDM operational data)
-- =============================================================================
CREATE TABLE mdm.user_profiles (
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

CREATE INDEX idx_user_profiles_tenant ON mdm.user_profiles(tenant_id);
CREATE INDEX idx_user_profiles_user ON mdm.user_profiles(user_id);
CREATE INDEX idx_user_profiles_org_unit ON mdm.user_profiles(home_org_unit_id);

-- =============================================================================
-- Table: mdm.contract_charges (optional - for charges dataset ingestion)
-- Description: Contract charges from LMS/external systems
-- =============================================================================
CREATE TABLE mdm.contract_charges (
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

CREATE INDEX idx_contract_charges_tenant ON mdm.contract_charges(tenant_id);
CREATE INDEX idx_contract_charges_contract ON mdm.contract_charges(contract_id);
CREATE INDEX idx_contract_charges_type ON mdm.contract_charges(tenant_id, charge_type_code);
CREATE INDEX idx_contract_charges_hash ON mdm.contract_charges(payload_hash);

-- =============================================================================
-- Triggers for updated_at
-- =============================================================================
CREATE OR REPLACE FUNCTION mdm.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_source_systems_updated_at
    BEFORE UPDATE ON mdm.source_systems
    FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

CREATE TRIGGER trg_reference_data_updated_at
    BEFORE UPDATE ON mdm.reference_data
    FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

CREATE TRIGGER trg_party_golden_updated_at
    BEFORE UPDATE ON mdm.party_golden
    FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

CREATE TRIGGER trg_party_contacts_updated_at
    BEFORE UPDATE ON mdm.party_contacts
    FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

CREATE TRIGGER trg_contract_golden_updated_at
    BEFORE UPDATE ON mdm.contract_golden
    FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

CREATE TRIGGER trg_dq_issues_updated_at
    BEFORE UPDATE ON mdm.data_quality_issues
    FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

CREATE TRIGGER trg_user_profiles_updated_at
    BEFORE UPDATE ON mdm.user_profiles
    FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

CREATE TRIGGER trg_contract_charges_updated_at
    BEFORE UPDATE ON mdm.contract_charges
    FOR EACH ROW EXECUTE FUNCTION mdm.update_updated_at_column();

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON SCHEMA mdm IS 'Master Data Management schema for EPIC 5';
COMMENT ON TABLE mdm.source_systems IS 'Registered source systems for data ingestion';
COMMENT ON TABLE mdm.reference_data IS 'Universal reference data (countries, nationalities, fee types, etc.)';
COMMENT ON TABLE mdm.party_golden IS 'Golden records for parties (persons and organizations)';
COMMENT ON TABLE mdm.party_source_map IS 'Maps external party references to golden records - idempotency key';
COMMENT ON TABLE mdm.party_source_record IS 'Raw source records for parties (audit/lineage)';
COMMENT ON TABLE mdm.party_contacts IS 'Contact information for parties';
COMMENT ON TABLE mdm.contract_golden IS 'Golden records for contracts';
COMMENT ON TABLE mdm.contract_source_map IS 'Maps external contract references to golden records - idempotency key';
COMMENT ON TABLE mdm.data_quality_issues IS 'Data quality issues detected during ingestion or validation';
COMMENT ON TABLE mdm.match_candidates IS 'Potential duplicate matches for review';
COMMENT ON TABLE mdm.user_profiles IS 'Operational user profiles (NOT auth - just MDM operational data)';
COMMENT ON TABLE mdm.contract_charges IS 'Contract charges from LMS/external systems';
