-- =============================================================================
-- Migration 022: Create RLS Policies for MDM and Integration Schemas
-- Description: Enables Row Level Security and creates tenant isolation policies
-- EPIC 5 - Integration & Comprehensive MDM
-- =============================================================================

-- =============================================================================
-- MDM Schema RLS Policies
-- =============================================================================

-- source_systems
ALTER TABLE mdm.source_systems ENABLE ROW LEVEL SECURITY;

CREATE POLICY source_systems_tenant_isolation ON mdm.source_systems
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- reference_data
ALTER TABLE mdm.reference_data ENABLE ROW LEVEL SECURITY;

CREATE POLICY reference_data_tenant_isolation ON mdm.reference_data
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- party_golden
ALTER TABLE mdm.party_golden ENABLE ROW LEVEL SECURITY;

CREATE POLICY party_golden_tenant_isolation ON mdm.party_golden
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- party_source_map
ALTER TABLE mdm.party_source_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY party_source_map_tenant_isolation ON mdm.party_source_map
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- party_source_record
ALTER TABLE mdm.party_source_record ENABLE ROW LEVEL SECURITY;

CREATE POLICY party_source_record_tenant_isolation ON mdm.party_source_record
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- party_contacts
ALTER TABLE mdm.party_contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY party_contacts_tenant_isolation ON mdm.party_contacts
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- contract_golden
ALTER TABLE mdm.contract_golden ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_golden_tenant_isolation ON mdm.contract_golden
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- contract_source_map
ALTER TABLE mdm.contract_source_map ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_source_map_tenant_isolation ON mdm.contract_source_map
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- data_quality_issues
ALTER TABLE mdm.data_quality_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY dq_issues_tenant_isolation ON mdm.data_quality_issues
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- match_candidates
ALTER TABLE mdm.match_candidates ENABLE ROW LEVEL SECURITY;

CREATE POLICY match_candidates_tenant_isolation ON mdm.match_candidates
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- user_profiles
ALTER TABLE mdm.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY user_profiles_tenant_isolation ON mdm.user_profiles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- contract_charges
ALTER TABLE mdm.contract_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY contract_charges_tenant_isolation ON mdm.contract_charges
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- =============================================================================
-- Integration Schema RLS Policies
-- =============================================================================

-- ingestion_runs
ALTER TABLE integration.ingestion_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY ingestion_runs_tenant_isolation ON integration.ingestion_runs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- ingestion_items
ALTER TABLE integration.ingestion_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY ingestion_items_tenant_isolation ON integration.ingestion_items
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- reconciliation_summary
ALTER TABLE integration.reconciliation_summary ENABLE ROW LEVEL SECURITY;

CREATE POLICY reconciliation_summary_tenant_isolation ON integration.reconciliation_summary
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- data_freshness
ALTER TABLE integration.data_freshness ENABLE ROW LEVEL SECURITY;

CREATE POLICY data_freshness_tenant_isolation ON integration.data_freshness
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- mapping_templates
ALTER TABLE integration.mapping_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY mapping_templates_tenant_isolation ON integration.mapping_templates
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- webhook_endpoints
ALTER TABLE integration.webhook_endpoints ENABLE ROW LEVEL SECURITY;

CREATE POLICY webhook_endpoints_tenant_isolation ON integration.webhook_endpoints
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- scheduled_jobs
ALTER TABLE integration.scheduled_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY scheduled_jobs_tenant_isolation ON integration.scheduled_jobs
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- =============================================================================
-- Service Account Bypass Policies (for background jobs/system operations)
-- =============================================================================

-- Create a role for service accounts that can bypass RLS
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'cms_service_role') THEN
        CREATE ROLE cms_service_role NOLOGIN;
    END IF;
END
$$;

-- Grant the service role bypass on MDM tables
ALTER TABLE mdm.source_systems FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.reference_data FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_golden FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_source_map FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_source_record FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.party_contacts FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_golden FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_source_map FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.data_quality_issues FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.match_candidates FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.user_profiles FORCE ROW LEVEL SECURITY;
ALTER TABLE mdm.contract_charges FORCE ROW LEVEL SECURITY;

-- Grant the service role bypass on Integration tables
ALTER TABLE integration.ingestion_runs FORCE ROW LEVEL SECURITY;
ALTER TABLE integration.ingestion_items FORCE ROW LEVEL SECURITY;
ALTER TABLE integration.reconciliation_summary FORCE ROW LEVEL SECURITY;
ALTER TABLE integration.data_freshness FORCE ROW LEVEL SECURITY;
ALTER TABLE integration.mapping_templates FORCE ROW LEVEL SECURITY;
ALTER TABLE integration.webhook_endpoints FORCE ROW LEVEL SECURITY;
ALTER TABLE integration.scheduled_jobs FORCE ROW LEVEL SECURITY;

-- Create service role policies (uses BYPASSRLS or specific role check)
-- These allow system operations when using service account
CREATE POLICY source_systems_service_bypass ON mdm.source_systems
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY reference_data_service_bypass ON mdm.reference_data
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY party_golden_service_bypass ON mdm.party_golden
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY party_source_map_service_bypass ON mdm.party_source_map
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY party_source_record_service_bypass ON mdm.party_source_record
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY party_contacts_service_bypass ON mdm.party_contacts
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY contract_golden_service_bypass ON mdm.contract_golden
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY contract_source_map_service_bypass ON mdm.contract_source_map
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY dq_issues_service_bypass ON mdm.data_quality_issues
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY match_candidates_service_bypass ON mdm.match_candidates
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY user_profiles_service_bypass ON mdm.user_profiles
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY contract_charges_service_bypass ON mdm.contract_charges
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY ingestion_runs_service_bypass ON integration.ingestion_runs
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY ingestion_items_service_bypass ON integration.ingestion_items
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY reconciliation_summary_service_bypass ON integration.reconciliation_summary
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY data_freshness_service_bypass ON integration.data_freshness
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY mapping_templates_service_bypass ON integration.mapping_templates
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY webhook_endpoints_service_bypass ON integration.webhook_endpoints
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

CREATE POLICY scheduled_jobs_service_bypass ON integration.scheduled_jobs
    FOR ALL TO cms_service_role
    USING (true)
    WITH CHECK (true);

-- =============================================================================
-- Comments
-- =============================================================================
COMMENT ON POLICY source_systems_tenant_isolation ON mdm.source_systems IS 'Tenant isolation policy for source_systems';
COMMENT ON POLICY reference_data_tenant_isolation ON mdm.reference_data IS 'Tenant isolation policy for reference_data';
COMMENT ON POLICY party_golden_tenant_isolation ON mdm.party_golden IS 'Tenant isolation policy for party_golden';
COMMENT ON POLICY ingestion_runs_tenant_isolation ON integration.ingestion_runs IS 'Tenant isolation policy for ingestion_runs';
