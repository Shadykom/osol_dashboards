-- =====================================================
-- EPIC 3: Regulatory Policy Engine (PDP) - Schema Migration
-- Version: 1.0.0
-- Description: Creates policy schema with maker-checker workflow
-- =====================================================

-- Create the policy schema
CREATE SCHEMA IF NOT EXISTS policy;

-- Grant usage on policy schema
GRANT USAGE ON SCHEMA policy TO postgres, anon, authenticated, service_role;

-- =====================================================
-- Table: policy.policy_profiles
-- Description: Stores policy profile definitions per tenant/customer type
-- =====================================================
CREATE TABLE IF NOT EXISTS policy.policy_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    customer_type VARCHAR(20) NOT NULL CHECK (customer_type IN ('RETAIL', 'SME', 'CORP')),
    secured_flag BOOLEAN,  -- nullable, true=secured, false=unsecured, null=both
    status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'INACTIVE', 'ARCHIVED')),
    priority INTEGER NOT NULL DEFAULT 100,  -- lower = higher priority for matching
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Unique constraint per tenant + customer_type + secured_flag combination
    CONSTRAINT unique_profile_per_tenant_type UNIQUE (tenant_id, customer_type, secured_flag)
);

-- =====================================================
-- Table: policy.policy_versions
-- Description: Versioned policy rules with maker-checker workflow
-- =====================================================
CREATE TABLE IF NOT EXISTS policy.policy_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    profile_id UUID NOT NULL REFERENCES policy.policy_profiles(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'ARCHIVED')),
    effective_from TIMESTAMPTZ,
    effective_to TIMESTAMPTZ,
    rules_json JSONB NOT NULL,
    change_reason TEXT,
    
    -- Maker-Checker fields
    created_by UUID,  -- maker
    submitted_by UUID,
    submitted_at TIMESTAMPTZ,
    reviewed_by UUID,  -- checker
    reviewed_at TIMESTAMPTZ,
    review_comments TEXT,
    approved_by UUID,
    approved_at TIMESTAMPTZ,
    published_by UUID,
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Only one published version per profile at a time
    CONSTRAINT unique_version_per_profile UNIQUE (profile_id, version_no)
);

-- =====================================================
-- Table: policy.pdp_decision_log
-- Description: Audit trail for all PDP decisions
-- =====================================================
CREATE TABLE IF NOT EXISTS policy.pdp_decision_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    
    -- Request context
    customer_type VARCHAR(20) NOT NULL,
    secured_flag BOOLEAN,
    action_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50),
    customer_id VARCHAR(100),
    contract_id VARCHAR(100),
    portfolio_id VARCHAR(100),
    bucket VARCHAR(50),
    consent_status VARCHAR(50),
    request_timestamp TIMESTAMPTZ NOT NULL,
    contact_history JSONB,
    additional_context JSONB,
    
    -- Decision result
    decision VARCHAR(30) NOT NULL CHECK (decision IN ('ALLOW', 'BLOCK', 'APPROVAL_REQUIRED')),
    reason_code VARCHAR(100) NOT NULL,
    reason_details JSONB,
    policy_profile_id UUID REFERENCES policy.policy_profiles(id),
    policy_version_id UUID REFERENCES policy.policy_versions(id),
    required_evidence JSONB,
    cooling_period_until TIMESTAMPTZ,
    max_attempts INTEGER,
    window VARCHAR(20),
    
    -- Metadata
    rules_evaluated JSONB,  -- which rules were checked and their results
    evaluation_time_ms INTEGER,  -- performance tracking
    request_ip VARCHAR(45),
    user_agent TEXT,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Index for common queries
    CONSTRAINT check_decision_valid CHECK (decision IN ('ALLOW', 'BLOCK', 'APPROVAL_REQUIRED'))
);

-- =====================================================
-- Table: policy.workflow_approvals
-- Description: Tracks approval workflow for policy changes (EPIC 2 integration)
-- =====================================================
CREATE TABLE IF NOT EXISTS policy.workflow_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    entity_type VARCHAR(50) NOT NULL DEFAULT 'POLICY_VERSION',
    entity_id UUID NOT NULL,  -- references policy_versions.id
    workflow_status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (workflow_status IN ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED')),
    
    -- Maker info
    maker_id UUID NOT NULL,
    maker_comments TEXT,
    made_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Checker info
    checker_id UUID,
    checker_comments TEXT,
    checked_at TIMESTAMPTZ,
    
    -- Approval chain (for multi-level approval)
    approval_level INTEGER NOT NULL DEFAULT 1,
    required_approvals INTEGER NOT NULL DEFAULT 1,
    current_approvals INTEGER NOT NULL DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Table: policy.contact_attempt_cache
-- Description: Cached contact attempts for fast window calculations
-- =====================================================
CREATE TABLE IF NOT EXISTS policy.contact_attempt_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    customer_id VARCHAR(100) NOT NULL,
    contract_id VARCHAR(100),
    action_type VARCHAR(50) NOT NULL,
    channel VARCHAR(50),
    attempt_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    outcome VARCHAR(50),
    metadata JSONB,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- Indexes for performance
-- =====================================================

-- Policy profiles indexes
CREATE INDEX IF NOT EXISTS idx_policy_profiles_tenant ON policy.policy_profiles(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_profiles_customer_type ON policy.policy_profiles(tenant_id, customer_type);
CREATE INDEX IF NOT EXISTS idx_policy_profiles_status ON policy.policy_profiles(status);
CREATE INDEX IF NOT EXISTS idx_policy_profiles_lookup ON policy.policy_profiles(tenant_id, customer_type, secured_flag, status);

-- Policy versions indexes
CREATE INDEX IF NOT EXISTS idx_policy_versions_tenant ON policy.policy_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_policy_versions_profile ON policy.policy_versions(profile_id);
CREATE INDEX IF NOT EXISTS idx_policy_versions_status ON policy.policy_versions(status);
CREATE INDEX IF NOT EXISTS idx_policy_versions_effective ON policy.policy_versions(profile_id, status, effective_from);
CREATE INDEX IF NOT EXISTS idx_policy_versions_published ON policy.policy_versions(profile_id, status) WHERE status = 'PUBLISHED';

-- Decision log indexes (optimized for audit queries)
CREATE INDEX IF NOT EXISTS idx_pdp_decision_log_tenant ON policy.pdp_decision_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_pdp_decision_log_customer ON policy.pdp_decision_log(tenant_id, customer_id);
CREATE INDEX IF NOT EXISTS idx_pdp_decision_log_contract ON policy.pdp_decision_log(tenant_id, contract_id);
CREATE INDEX IF NOT EXISTS idx_pdp_decision_log_timestamp ON policy.pdp_decision_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_pdp_decision_log_decision ON policy.pdp_decision_log(tenant_id, decision);

-- Workflow approvals indexes
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_entity ON policy.workflow_approvals(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_status ON policy.workflow_approvals(tenant_id, workflow_status);

-- Contact attempt cache indexes
CREATE INDEX IF NOT EXISTS idx_contact_cache_customer ON policy.contact_attempt_cache(tenant_id, customer_id, action_type, attempt_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_contact_cache_contract ON policy.contact_attempt_cache(tenant_id, contract_id, action_type, attempt_timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_contact_cache_window ON policy.contact_attempt_cache(tenant_id, customer_id, attempt_timestamp DESC);

-- =====================================================
-- Enable Row Level Security (RLS) for tenant isolation
-- =====================================================

ALTER TABLE policy.policy_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy.policy_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy.pdp_decision_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy.workflow_approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE policy.contact_attempt_cache ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS Policies - Tenant Isolation
-- =====================================================

-- Policy Profiles RLS
DROP POLICY IF EXISTS policy_profiles_tenant_isolation ON policy.policy_profiles;
CREATE POLICY policy_profiles_tenant_isolation ON policy.policy_profiles
    FOR ALL
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    )
    WITH CHECK (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    );

-- Policy Versions RLS
DROP POLICY IF EXISTS policy_versions_tenant_isolation ON policy.policy_versions;
CREATE POLICY policy_versions_tenant_isolation ON policy.policy_versions
    FOR ALL
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    )
    WITH CHECK (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    );

-- Decision Log RLS
DROP POLICY IF EXISTS pdp_decision_log_tenant_isolation ON policy.pdp_decision_log;
CREATE POLICY pdp_decision_log_tenant_isolation ON policy.pdp_decision_log
    FOR ALL
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    )
    WITH CHECK (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    );

-- Workflow Approvals RLS
DROP POLICY IF EXISTS workflow_approvals_tenant_isolation ON policy.workflow_approvals;
CREATE POLICY workflow_approvals_tenant_isolation ON policy.workflow_approvals
    FOR ALL
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    )
    WITH CHECK (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    );

-- Contact Attempt Cache RLS
DROP POLICY IF EXISTS contact_cache_tenant_isolation ON policy.contact_attempt_cache;
CREATE POLICY contact_cache_tenant_isolation ON policy.contact_attempt_cache
    FOR ALL
    USING (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    )
    WITH CHECK (
        tenant_id = COALESCE(
            current_setting('app.current_tenant_id', true)::UUID,
            '00000000-0000-0000-0000-000000000000'::UUID
        )
    );

-- Service role bypass (for internal operations)
DROP POLICY IF EXISTS policy_profiles_service_bypass ON policy.policy_profiles;
CREATE POLICY policy_profiles_service_bypass ON policy.policy_profiles
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS policy_versions_service_bypass ON policy.policy_versions;
CREATE POLICY policy_versions_service_bypass ON policy.policy_versions
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS pdp_decision_log_service_bypass ON policy.pdp_decision_log;
CREATE POLICY pdp_decision_log_service_bypass ON policy.pdp_decision_log
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS workflow_approvals_service_bypass ON policy.workflow_approvals;
CREATE POLICY workflow_approvals_service_bypass ON policy.workflow_approvals
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS contact_cache_service_bypass ON policy.contact_attempt_cache;
CREATE POLICY contact_cache_service_bypass ON policy.contact_attempt_cache
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================
-- Triggers for updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION policy.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_policy_profiles_updated_at ON policy.policy_profiles;
CREATE TRIGGER update_policy_profiles_updated_at
    BEFORE UPDATE ON policy.policy_profiles
    FOR EACH ROW
    EXECUTE FUNCTION policy.update_updated_at_column();

DROP TRIGGER IF EXISTS update_policy_versions_updated_at ON policy.policy_versions;
CREATE TRIGGER update_policy_versions_updated_at
    BEFORE UPDATE ON policy.policy_versions
    FOR EACH ROW
    EXECUTE FUNCTION policy.update_updated_at_column();

DROP TRIGGER IF EXISTS update_workflow_approvals_updated_at ON policy.workflow_approvals;
CREATE TRIGGER update_workflow_approvals_updated_at
    BEFORE UPDATE ON policy.workflow_approvals
    FOR EACH ROW
    EXECUTE FUNCTION policy.update_updated_at_column();

-- =====================================================
-- Function to get active published policy version
-- =====================================================

CREATE OR REPLACE FUNCTION policy.get_active_policy_version(
    p_tenant_id UUID,
    p_customer_type VARCHAR(20),
    p_secured_flag BOOLEAN DEFAULT NULL
)
RETURNS TABLE (
    profile_id UUID,
    profile_name VARCHAR(255),
    version_id UUID,
    version_no INTEGER,
    rules_json JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pp.id AS profile_id,
        pp.name AS profile_name,
        pv.id AS version_id,
        pv.version_no,
        pv.rules_json
    FROM policy.policy_profiles pp
    INNER JOIN policy.policy_versions pv ON pv.profile_id = pp.id
    WHERE pp.tenant_id = p_tenant_id
      AND pp.customer_type = p_customer_type
      AND (pp.secured_flag IS NULL OR pp.secured_flag = p_secured_flag OR p_secured_flag IS NULL)
      AND pp.status = 'ACTIVE'
      AND pv.status = 'PUBLISHED'
      AND (pv.effective_from IS NULL OR pv.effective_from <= NOW())
      AND (pv.effective_to IS NULL OR pv.effective_to > NOW())
    ORDER BY pp.priority ASC, pv.effective_from DESC NULLS LAST
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Function to count contact attempts within window
-- =====================================================

CREATE OR REPLACE FUNCTION policy.count_contact_attempts(
    p_tenant_id UUID,
    p_customer_id VARCHAR(100),
    p_action_type VARCHAR(50),
    p_window_interval INTERVAL
)
RETURNS TABLE (
    attempt_count BIGINT,
    last_attempt_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*)::BIGINT AS attempt_count,
        MAX(attempt_timestamp) AS last_attempt_at
    FROM policy.contact_attempt_cache
    WHERE tenant_id = p_tenant_id
      AND customer_id = p_customer_id
      AND action_type = p_action_type
      AND attempt_timestamp >= NOW() - p_window_interval;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- Grant permissions
-- =====================================================

GRANT ALL ON SCHEMA policy TO postgres;
GRANT USAGE ON SCHEMA policy TO anon, authenticated, service_role;

GRANT ALL ON ALL TABLES IN SCHEMA policy TO postgres;
GRANT SELECT ON ALL TABLES IN SCHEMA policy TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA policy TO authenticated, service_role;

GRANT ALL ON ALL SEQUENCES IN SCHEMA policy TO postgres;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA policy TO anon, authenticated, service_role;

GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA policy TO postgres, anon, authenticated, service_role;

-- =====================================================
-- Comments
-- =====================================================

COMMENT ON SCHEMA policy IS 'Regulatory Policy Engine (PDP) schema for EPIC 3';
COMMENT ON TABLE policy.policy_profiles IS 'Policy profile definitions per tenant/customer type';
COMMENT ON TABLE policy.policy_versions IS 'Versioned policy rules with maker-checker workflow';
COMMENT ON TABLE policy.pdp_decision_log IS 'Audit trail for all PDP decisions';
COMMENT ON TABLE policy.workflow_approvals IS 'Tracks approval workflow for policy changes';
COMMENT ON TABLE policy.contact_attempt_cache IS 'Cached contact attempts for fast window calculations';

COMMENT ON COLUMN policy.policy_profiles.secured_flag IS 'true=secured loans, false=unsecured, null=applies to both';
COMMENT ON COLUMN policy.policy_profiles.priority IS 'Lower number = higher priority for profile matching';
COMMENT ON COLUMN policy.policy_versions.rules_json IS 'JSON object containing all policy rules';
COMMENT ON COLUMN policy.pdp_decision_log.evaluation_time_ms IS 'Time taken to evaluate rules in milliseconds';

-- Log completion
DO $$
BEGIN
    RAISE NOTICE 'Policy schema migration completed successfully';
END $$;
