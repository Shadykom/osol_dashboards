-- ============================================================================
-- EPIC 2: Configuration & Maker-Checker Schema Migration
-- ============================================================================
-- This migration creates the config and workflow schemas for:
-- - Versioned, auditable configuration management
-- - Maker-checker workflow with approval steps
-- - Effective dating for published versions
-- - Tenant isolation via tenant_id and RLS
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- SCHEMA: config
-- Purpose: Store versioned configuration packages with items
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS config;

-- ----------------------------------------------------------------------------
-- Table: config.config_packages
-- Purpose: Top-level grouping of related configuration items
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config.config_packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'archived')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(tenant_id, name)
);

COMMENT ON TABLE config.config_packages IS 'Top-level grouping of related configuration items per tenant';
COMMENT ON COLUMN config.config_packages.tenant_id IS 'Tenant identifier for multi-tenant isolation';
COMMENT ON COLUMN config.config_packages.name IS 'Unique package name within tenant (e.g., core, collections, scoring)';
COMMENT ON COLUMN config.config_packages.status IS 'Package status: active, inactive, archived';

-- ----------------------------------------------------------------------------
-- Table: config.config_versions
-- Purpose: Version tracking for configuration packages with maker-checker states
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config.config_versions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    package_id UUID NOT NULL REFERENCES config.config_packages(id) ON DELETE CASCADE,
    version_no INTEGER NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'SUBMITTED', 'APPROVED', 'PUBLISHED', 'REJECTED', 'SUPERSEDED')),
    effective_from TIMESTAMP WITH TIME ZONE,
    effective_to TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    submitted_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID,
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID,
    rejection_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(tenant_id, package_id, version_no)
);

COMMENT ON TABLE config.config_versions IS 'Versioned configurations with maker-checker workflow states';
COMMENT ON COLUMN config.config_versions.status IS 'Workflow status: DRAFT -> SUBMITTED -> APPROVED -> PUBLISHED';
COMMENT ON COLUMN config.config_versions.effective_from IS 'When this version becomes active (for future-dated configs)';
COMMENT ON COLUMN config.config_versions.effective_to IS 'When this version is superseded (set when new version is published)';

-- ----------------------------------------------------------------------------
-- Table: config.config_items
-- Purpose: Individual configuration key-value pairs within a version
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS config.config_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    version_id UUID NOT NULL REFERENCES config.config_versions(id) ON DELETE CASCADE,
    key VARCHAR(255) NOT NULL,
    value_json JSONB NOT NULL,
    value_type VARCHAR(50) NOT NULL DEFAULT 'string' CHECK (value_type IN ('string', 'number', 'boolean', 'object', 'array')),
    scope_json JSONB,
    description TEXT,
    validation_rules JSONB,
    is_sensitive BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    updated_by UUID,
    UNIQUE(tenant_id, version_id, key)
);

COMMENT ON TABLE config.config_items IS 'Individual configuration key-value pairs within a version';
COMMENT ON COLUMN config.config_items.key IS 'Namespaced config key (e.g., policy.retail.max_contact_attempts)';
COMMENT ON COLUMN config.config_items.value_json IS 'Configuration value stored as JSON';
COMMENT ON COLUMN config.config_items.value_type IS 'Type hint for the value: string, number, boolean, object, array';
COMMENT ON COLUMN config.config_items.scope_json IS 'Optional scope filter (e.g., {"portfolio": "retail", "product": "personal_loan"})';
COMMENT ON COLUMN config.config_items.validation_rules IS 'Optional validation rules for the value';
COMMENT ON COLUMN config.config_items.is_sensitive IS 'Whether this config contains sensitive data (affects audit logging)';

-- ============================================================================
-- SCHEMA: workflow
-- Purpose: Approval workflow management for maker-checker pattern
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS workflow;

-- ----------------------------------------------------------------------------
-- Table: workflow.approvals
-- Purpose: Track approval requests for various object types
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow.approvals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    object_type VARCHAR(100) NOT NULL,
    object_id UUID NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'IN_PROGRESS', 'APPROVED', 'REJECTED', 'CANCELLED', 'EXPIRED')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
    requested_by UUID NOT NULL,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    approved_by UUID,
    approved_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE workflow.approvals IS 'Approval requests for maker-checker workflow';
COMMENT ON COLUMN workflow.approvals.object_type IS 'Type of object being approved (e.g., config_version, policy_change)';
COMMENT ON COLUMN workflow.approvals.object_id IS 'ID of the object being approved';
COMMENT ON COLUMN workflow.approvals.status IS 'Approval status: PENDING, IN_PROGRESS, APPROVED, REJECTED, CANCELLED, EXPIRED';

-- ----------------------------------------------------------------------------
-- Table: workflow.approval_steps
-- Purpose: Track individual approval steps for multi-level approvals
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS workflow.approval_steps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    approval_id UUID NOT NULL REFERENCES workflow.approvals(id) ON DELETE CASCADE,
    step_no INTEGER NOT NULL,
    role_required VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'SKIPPED')),
    acted_by UUID,
    acted_at TIMESTAMP WITH TIME ZONE,
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(tenant_id, approval_id, step_no)
);

COMMENT ON TABLE workflow.approval_steps IS 'Individual steps in multi-level approval workflows';
COMMENT ON COLUMN workflow.approval_steps.step_no IS 'Sequence number of this step in the approval chain';
COMMENT ON COLUMN workflow.approval_steps.role_required IS 'Role required to approve this step (e.g., config_checker, config_admin)';

-- ============================================================================
-- SCHEMA: audit
-- Purpose: Audit trail for all configuration and workflow changes
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS audit;

-- ----------------------------------------------------------------------------
-- Table: audit.config_audit_log
-- Purpose: Immutable audit log for configuration changes
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS audit.config_audit_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL,
    event_type VARCHAR(50) NOT NULL,
    event_subtype VARCHAR(50),
    object_type VARCHAR(100) NOT NULL,
    object_id UUID NOT NULL,
    old_value JSONB,
    new_value JSONB,
    changed_fields TEXT[],
    user_id UUID,
    user_email VARCHAR(255),
    user_role VARCHAR(100),
    ip_address INET,
    user_agent TEXT,
    correlation_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE audit.config_audit_log IS 'Immutable audit trail for configuration and workflow events';
COMMENT ON COLUMN audit.config_audit_log.event_type IS 'Type of event (CREATE, UPDATE, DELETE, STATE_CHANGE, etc.)';
COMMENT ON COLUMN audit.config_audit_log.event_subtype IS 'Subtype for state changes (e.g., DRAFT_TO_SUBMITTED)';
COMMENT ON COLUMN audit.config_audit_log.correlation_id IS 'Links related audit entries together';

-- ============================================================================
-- INDEXES
-- ============================================================================

-- config.config_packages indexes
CREATE INDEX IF NOT EXISTS idx_config_packages_tenant ON config.config_packages(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_packages_status ON config.config_packages(tenant_id, status);

-- config.config_versions indexes
CREATE INDEX IF NOT EXISTS idx_config_versions_tenant ON config.config_versions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_versions_package ON config.config_versions(package_id);
CREATE INDEX IF NOT EXISTS idx_config_versions_status ON config.config_versions(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_config_versions_effective ON config.config_versions(tenant_id, effective_from, effective_to);
CREATE INDEX IF NOT EXISTS idx_config_versions_published ON config.config_versions(tenant_id, package_id, status) WHERE status = 'PUBLISHED';

-- config.config_items indexes
CREATE INDEX IF NOT EXISTS idx_config_items_tenant ON config.config_items(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_items_version ON config.config_items(version_id);
CREATE INDEX IF NOT EXISTS idx_config_items_key ON config.config_items(tenant_id, key);
CREATE INDEX IF NOT EXISTS idx_config_items_scope ON config.config_items USING GIN (scope_json);

-- workflow.approvals indexes
CREATE INDEX IF NOT EXISTS idx_approvals_tenant ON workflow.approvals(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approvals_object ON workflow.approvals(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_approvals_status ON workflow.approvals(tenant_id, status);
CREATE INDEX IF NOT EXISTS idx_approvals_requested_by ON workflow.approvals(requested_by);

-- workflow.approval_steps indexes
CREATE INDEX IF NOT EXISTS idx_approval_steps_tenant ON workflow.approval_steps(tenant_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_approval ON workflow.approval_steps(approval_id);
CREATE INDEX IF NOT EXISTS idx_approval_steps_status ON workflow.approval_steps(tenant_id, status);

-- audit.config_audit_log indexes
CREATE INDEX IF NOT EXISTS idx_config_audit_tenant ON audit.config_audit_log(tenant_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_object ON audit.config_audit_log(object_type, object_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_created ON audit.config_audit_log(tenant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_config_audit_user ON audit.config_audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_config_audit_correlation ON audit.config_audit_log(correlation_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at trigger function (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at on all tables
DROP TRIGGER IF EXISTS update_config_packages_updated_at ON config.config_packages;
CREATE TRIGGER update_config_packages_updated_at 
    BEFORE UPDATE ON config.config_packages
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_config_versions_updated_at ON config.config_versions;
CREATE TRIGGER update_config_versions_updated_at 
    BEFORE UPDATE ON config.config_versions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_config_items_updated_at ON config.config_items;
CREATE TRIGGER update_config_items_updated_at 
    BEFORE UPDATE ON config.config_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_approvals_updated_at ON workflow.approvals;
CREATE TRIGGER update_approvals_updated_at 
    BEFORE UPDATE ON workflow.approvals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_approval_steps_updated_at ON workflow.approval_steps;
CREATE TRIGGER update_approval_steps_updated_at 
    BEFORE UPDATE ON workflow.approval_steps
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- AUDIT TRIGGER FUNCTIONS
-- ============================================================================

-- Function to write audit log entries
CREATE OR REPLACE FUNCTION audit.write_config_audit_log(
    p_tenant_id UUID,
    p_event_type VARCHAR(50),
    p_event_subtype VARCHAR(50),
    p_object_type VARCHAR(100),
    p_object_id UUID,
    p_old_value JSONB,
    p_new_value JSONB,
    p_changed_fields TEXT[],
    p_user_id UUID DEFAULT NULL,
    p_user_email VARCHAR(255) DEFAULT NULL,
    p_user_role VARCHAR(100) DEFAULT NULL,
    p_correlation_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_audit_id UUID;
BEGIN
    INSERT INTO audit.config_audit_log (
        tenant_id,
        event_type,
        event_subtype,
        object_type,
        object_id,
        old_value,
        new_value,
        changed_fields,
        user_id,
        user_email,
        user_role,
        correlation_id
    ) VALUES (
        p_tenant_id,
        p_event_type,
        p_event_subtype,
        p_object_type,
        p_object_id,
        p_old_value,
        p_new_value,
        p_changed_fields,
        p_user_id,
        p_user_email,
        p_user_role,
        COALESCE(p_correlation_id, uuid_generate_v4())
    ) RETURNING id INTO v_audit_id;
    
    RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for config_versions state changes
CREATE OR REPLACE FUNCTION audit.trigger_config_version_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_event_subtype VARCHAR(50);
BEGIN
    -- Determine event subtype for state changes
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        v_event_subtype := OLD.status || '_TO_' || NEW.status;
    END IF;

    PERFORM audit.write_config_audit_log(
        NEW.tenant_id,
        CASE TG_OP
            WHEN 'INSERT' THEN 'CREATE'
            WHEN 'UPDATE' THEN CASE WHEN OLD.status != NEW.status THEN 'STATE_CHANGE' ELSE 'UPDATE' END
            WHEN 'DELETE' THEN 'DELETE'
        END,
        v_event_subtype,
        'config_version',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        CASE WHEN TG_OP = 'UPDATE' THEN 
            ARRAY(SELECT key FROM jsonb_each(to_jsonb(NEW)) 
                  WHERE to_jsonb(OLD) -> key IS DISTINCT FROM to_jsonb(NEW) -> key)
        ELSE NULL END,
        COALESCE(NEW.updated_by, NEW.created_by, OLD.updated_by),
        NULL,
        NULL,
        NULL
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger function for workflow approvals
CREATE OR REPLACE FUNCTION audit.trigger_approval_audit()
RETURNS TRIGGER AS $$
DECLARE
    v_event_subtype VARCHAR(50);
BEGIN
    IF TG_OP = 'UPDATE' AND OLD.status != NEW.status THEN
        v_event_subtype := OLD.status || '_TO_' || NEW.status;
    END IF;

    PERFORM audit.write_config_audit_log(
        NEW.tenant_id,
        CASE TG_OP
            WHEN 'INSERT' THEN 'CREATE'
            WHEN 'UPDATE' THEN CASE WHEN OLD.status != NEW.status THEN 'STATE_CHANGE' ELSE 'UPDATE' END
            WHEN 'DELETE' THEN 'DELETE'
        END,
        v_event_subtype,
        'approval',
        COALESCE(NEW.id, OLD.id),
        CASE WHEN TG_OP IN ('UPDATE', 'DELETE') THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
        NULL,
        COALESCE(NEW.approved_by, NEW.requested_by, OLD.approved_by),
        NULL,
        NULL,
        NULL
    );

    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Apply audit triggers
DROP TRIGGER IF EXISTS audit_config_versions ON config.config_versions;
CREATE TRIGGER audit_config_versions
    AFTER INSERT OR UPDATE OR DELETE ON config.config_versions
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_config_version_audit();

DROP TRIGGER IF EXISTS audit_approvals ON workflow.approvals;
CREATE TRIGGER audit_approvals
    AFTER INSERT OR UPDATE OR DELETE ON workflow.approvals
    FOR EACH ROW EXECUTE FUNCTION audit.trigger_approval_audit();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE config.config_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE config.config_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE config.config_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow.approvals ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow.approval_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit.config_audit_log ENABLE ROW LEVEL SECURITY;

-- Helper function to get current tenant from JWT or session
CREATE OR REPLACE FUNCTION get_current_tenant_id()
RETURNS UUID AS $$
BEGIN
    -- Try to get tenant_id from JWT claims first
    RETURN COALESCE(
        (current_setting('request.jwt.claims', true)::jsonb ->> 'tenant_id')::UUID,
        (current_setting('app.current_tenant_id', true))::UUID,
        NULL
    );
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Helper function to check if user has role
CREATE OR REPLACE FUNCTION has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN COALESCE(
        current_setting('request.jwt.claims', true)::jsonb -> 'roles' ? role_name,
        FALSE
    );
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- RLS Policies for config.config_packages
DROP POLICY IF EXISTS config_packages_tenant_isolation ON config.config_packages;
CREATE POLICY config_packages_tenant_isolation ON config.config_packages
    FOR ALL
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- RLS Policies for config.config_versions
DROP POLICY IF EXISTS config_versions_tenant_isolation ON config.config_versions;
CREATE POLICY config_versions_tenant_isolation ON config.config_versions
    FOR ALL
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- RLS Policies for config.config_items
DROP POLICY IF EXISTS config_items_tenant_isolation ON config.config_items;
CREATE POLICY config_items_tenant_isolation ON config.config_items
    FOR ALL
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- RLS Policies for workflow.approvals
DROP POLICY IF EXISTS approvals_tenant_isolation ON workflow.approvals;
CREATE POLICY approvals_tenant_isolation ON workflow.approvals
    FOR ALL
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- RLS Policies for workflow.approval_steps
DROP POLICY IF EXISTS approval_steps_tenant_isolation ON workflow.approval_steps;
CREATE POLICY approval_steps_tenant_isolation ON workflow.approval_steps
    FOR ALL
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL)
    WITH CHECK (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- RLS Policies for audit.config_audit_log (read-only for tenants)
DROP POLICY IF EXISTS config_audit_log_tenant_read ON audit.config_audit_log;
CREATE POLICY config_audit_log_tenant_read ON audit.config_audit_log
    FOR SELECT
    USING (tenant_id = get_current_tenant_id() OR get_current_tenant_id() IS NULL);

-- ============================================================================
-- GRANTS
-- ============================================================================

-- Grant usage on schemas
GRANT USAGE ON SCHEMA config TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA workflow TO authenticated, anon, service_role;
GRANT USAGE ON SCHEMA audit TO authenticated, anon, service_role;

-- Grant permissions on config tables
GRANT SELECT, INSERT, UPDATE, DELETE ON config.config_packages TO authenticated, service_role;
GRANT SELECT ON config.config_packages TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON config.config_versions TO authenticated, service_role;
GRANT SELECT ON config.config_versions TO anon;

GRANT SELECT, INSERT, UPDATE, DELETE ON config.config_items TO authenticated, service_role;
GRANT SELECT ON config.config_items TO anon;

-- Grant permissions on workflow tables
GRANT SELECT, INSERT, UPDATE ON workflow.approvals TO authenticated, service_role;
GRANT SELECT ON workflow.approvals TO anon;

GRANT SELECT, INSERT, UPDATE ON workflow.approval_steps TO authenticated, service_role;
GRANT SELECT ON workflow.approval_steps TO anon;

-- Grant read-only on audit tables (writes only via functions)
GRANT SELECT ON audit.config_audit_log TO authenticated, service_role;
GRANT SELECT ON audit.config_audit_log TO anon;

-- Grant execute on functions
GRANT EXECUTE ON FUNCTION get_current_tenant_id() TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION has_role(TEXT) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION audit.write_config_audit_log(UUID, VARCHAR, VARCHAR, VARCHAR, UUID, JSONB, JSONB, TEXT[], UUID, VARCHAR, VARCHAR, UUID) TO authenticated, service_role;

-- ============================================================================
-- UTILITY FUNCTIONS
-- ============================================================================

-- Function to get next version number for a package
CREATE OR REPLACE FUNCTION config.get_next_version_number(p_package_id UUID)
RETURNS INTEGER AS $$
DECLARE
    v_max_version INTEGER;
BEGIN
    SELECT COALESCE(MAX(version_no), 0) INTO v_max_version
    FROM config.config_versions
    WHERE package_id = p_package_id;
    
    RETURN v_max_version + 1;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to resolve effective config values for a given timestamp
CREATE OR REPLACE FUNCTION config.resolve_config(
    p_tenant_id UUID,
    p_keys TEXT[],
    p_effective_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    p_scope_filter JSONB DEFAULT NULL
)
RETURNS TABLE (
    key VARCHAR(255),
    value_json JSONB,
    value_type VARCHAR(50),
    scope_json JSONB,
    package_name VARCHAR(100),
    version_no INTEGER,
    effective_from TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT ON (ci.key)
        ci.key,
        ci.value_json,
        ci.value_type,
        ci.scope_json,
        cp.name AS package_name,
        cv.version_no,
        cv.effective_from
    FROM config.config_items ci
    JOIN config.config_versions cv ON ci.version_id = cv.id
    JOIN config.config_packages cp ON cv.package_id = cp.id
    WHERE ci.tenant_id = p_tenant_id
        AND cv.status = 'PUBLISHED'
        AND (cv.effective_from IS NULL OR cv.effective_from <= p_effective_at)
        AND (cv.effective_to IS NULL OR cv.effective_to > p_effective_at)
        AND (p_keys IS NULL OR ci.key = ANY(p_keys))
        AND (p_scope_filter IS NULL OR ci.scope_json IS NULL OR ci.scope_json @> p_scope_filter)
    ORDER BY ci.key, cv.effective_from DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Function to validate config key format (must be namespaced)
CREATE OR REPLACE FUNCTION config.validate_config_key(p_key VARCHAR(255))
RETURNS BOOLEAN AS $$
BEGIN
    -- Key must be at least 3 characters and contain at least one dot
    -- Pattern: namespace.category.name or namespace.name
    RETURN p_key ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$';
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Constraint trigger to validate config keys
CREATE OR REPLACE FUNCTION config.check_config_key()
RETURNS TRIGGER AS $$
BEGIN
    IF NOT config.validate_config_key(NEW.key) THEN
        RAISE EXCEPTION 'Invalid config key format: %. Keys must be namespaced (e.g., policy.retail.max_contact_attempts)', NEW.key;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS validate_config_item_key ON config.config_items;
CREATE TRIGGER validate_config_item_key
    BEFORE INSERT OR UPDATE OF key ON config.config_items
    FOR EACH ROW EXECUTE FUNCTION config.check_config_key();

-- Function to copy config items from one version to another
CREATE OR REPLACE FUNCTION config.copy_version_items(
    p_source_version_id UUID,
    p_target_version_id UUID,
    p_user_id UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
    v_tenant_id UUID;
BEGIN
    -- Get tenant_id from source version
    SELECT tenant_id INTO v_tenant_id
    FROM config.config_versions
    WHERE id = p_source_version_id;

    INSERT INTO config.config_items (
        tenant_id,
        version_id,
        key,
        value_json,
        value_type,
        scope_json,
        description,
        validation_rules,
        is_sensitive,
        created_by,
        updated_by
    )
    SELECT
        v_tenant_id,
        p_target_version_id,
        key,
        value_json,
        value_type,
        scope_json,
        description,
        validation_rules,
        is_sensitive,
        p_user_id,
        p_user_id
    FROM config.config_items
    WHERE version_id = p_source_version_id;

    GET DIAGNOSTICS v_count = ROW_COUNT;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on utility functions
GRANT EXECUTE ON FUNCTION config.get_next_version_number(UUID) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION config.resolve_config(UUID, TEXT[], TIMESTAMP WITH TIME ZONE, JSONB) TO authenticated, anon, service_role;
GRANT EXECUTE ON FUNCTION config.validate_config_key(VARCHAR) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION config.copy_version_items(UUID, UUID, UUID) TO authenticated, service_role;

-- ============================================================================
-- WORKFLOW HELPER FUNCTIONS
-- ============================================================================

-- Function to create approval request for config version
CREATE OR REPLACE FUNCTION workflow.create_config_version_approval(
    p_tenant_id UUID,
    p_version_id UUID,
    p_requested_by UUID,
    p_approval_roles TEXT[] DEFAULT ARRAY['config_checker']
)
RETURNS UUID AS $$
DECLARE
    v_approval_id UUID;
    v_step_no INTEGER := 1;
    v_role TEXT;
BEGIN
    -- Create the approval request
    INSERT INTO workflow.approvals (
        tenant_id,
        object_type,
        object_id,
        status,
        requested_by,
        requested_at
    ) VALUES (
        p_tenant_id,
        'config_version',
        p_version_id,
        'PENDING',
        p_requested_by,
        CURRENT_TIMESTAMP
    ) RETURNING id INTO v_approval_id;

    -- Create approval steps for each required role
    FOREACH v_role IN ARRAY p_approval_roles
    LOOP
        INSERT INTO workflow.approval_steps (
            tenant_id,
            approval_id,
            step_no,
            role_required,
            status
        ) VALUES (
            p_tenant_id,
            v_approval_id,
            v_step_no,
            v_role,
            'PENDING'
        );
        v_step_no := v_step_no + 1;
    END LOOP;

    RETURN v_approval_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to approve a pending step
CREATE OR REPLACE FUNCTION workflow.approve_step(
    p_approval_id UUID,
    p_user_id UUID,
    p_user_role TEXT,
    p_comments TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_step_id UUID;
    v_all_approved BOOLEAN;
    v_approval_tenant_id UUID;
    v_object_id UUID;
BEGIN
    -- Get the approval info
    SELECT tenant_id, object_id INTO v_approval_tenant_id, v_object_id
    FROM workflow.approvals
    WHERE id = p_approval_id AND status IN ('PENDING', 'IN_PROGRESS');

    IF v_approval_tenant_id IS NULL THEN
        RAISE EXCEPTION 'Approval not found or already completed';
    END IF;

    -- Find the next pending step that matches the user's role
    SELECT id INTO v_step_id
    FROM workflow.approval_steps
    WHERE approval_id = p_approval_id
        AND status = 'PENDING'
        AND role_required = p_user_role
    ORDER BY step_no
    LIMIT 1;

    IF v_step_id IS NULL THEN
        RAISE EXCEPTION 'No pending approval step found for role %', p_user_role;
    END IF;

    -- Update the step
    UPDATE workflow.approval_steps
    SET status = 'APPROVED',
        acted_by = p_user_id,
        acted_at = CURRENT_TIMESTAMP,
        comments = p_comments
    WHERE id = v_step_id;

    -- Update approval status to IN_PROGRESS if it was PENDING
    UPDATE workflow.approvals
    SET status = 'IN_PROGRESS'
    WHERE id = p_approval_id AND status = 'PENDING';

    -- Check if all steps are approved
    SELECT NOT EXISTS (
        SELECT 1 FROM workflow.approval_steps
        WHERE approval_id = p_approval_id AND status = 'PENDING'
    ) INTO v_all_approved;

    -- If all steps approved, mark the approval as approved
    IF v_all_approved THEN
        UPDATE workflow.approvals
        SET status = 'APPROVED',
            approved_by = p_user_id,
            approved_at = CURRENT_TIMESTAMP
        WHERE id = p_approval_id;

        -- Update the config version status to APPROVED
        UPDATE config.config_versions
        SET status = 'APPROVED',
            approved_at = CURRENT_TIMESTAMP,
            approved_by = p_user_id
        WHERE id = v_object_id;
    END IF;

    RETURN v_all_approved;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reject an approval
CREATE OR REPLACE FUNCTION workflow.reject_approval(
    p_approval_id UUID,
    p_user_id UUID,
    p_reason TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
    v_object_id UUID;
BEGIN
    -- Update all pending steps to rejected
    UPDATE workflow.approval_steps
    SET status = 'REJECTED',
        acted_by = p_user_id,
        acted_at = CURRENT_TIMESTAMP,
        comments = p_reason
    WHERE approval_id = p_approval_id AND status = 'PENDING';

    -- Get object_id and update approval
    UPDATE workflow.approvals
    SET status = 'REJECTED',
        approved_by = p_user_id,
        approved_at = CURRENT_TIMESTAMP,
        rejection_reason = p_reason
    WHERE id = p_approval_id
    RETURNING object_id INTO v_object_id;

    -- Update config version status to REJECTED
    IF v_object_id IS NOT NULL THEN
        UPDATE config.config_versions
        SET status = 'REJECTED',
            rejection_reason = p_reason
        WHERE id = v_object_id;
    END IF;

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute on workflow functions
GRANT EXECUTE ON FUNCTION workflow.create_config_version_approval(UUID, UUID, UUID, TEXT[]) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION workflow.approve_step(UUID, UUID, TEXT, TEXT) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION workflow.reject_approval(UUID, UUID, TEXT) TO authenticated, service_role;

-- ============================================================================
-- VIEWS
-- ============================================================================

-- View for current effective config (cached resolution)
CREATE OR REPLACE VIEW config.effective_config_view AS
SELECT DISTINCT ON (ci.tenant_id, ci.key)
    ci.tenant_id,
    ci.key,
    ci.value_json,
    ci.value_type,
    ci.scope_json,
    cp.name AS package_name,
    cv.version_no,
    cv.effective_from,
    cv.id AS version_id
FROM config.config_items ci
JOIN config.config_versions cv ON ci.version_id = cv.id
JOIN config.config_packages cp ON cv.package_id = cp.id
WHERE cv.status = 'PUBLISHED'
    AND (cv.effective_from IS NULL OR cv.effective_from <= CURRENT_TIMESTAMP)
    AND (cv.effective_to IS NULL OR cv.effective_to > CURRENT_TIMESTAMP)
ORDER BY ci.tenant_id, ci.key, cv.effective_from DESC NULLS LAST;

-- View for pending approvals
CREATE OR REPLACE VIEW workflow.pending_approvals_view AS
SELECT 
    a.id AS approval_id,
    a.tenant_id,
    a.object_type,
    a.object_id,
    a.status AS approval_status,
    a.priority,
    a.requested_by,
    a.requested_at,
    a.expires_at,
    s.id AS step_id,
    s.step_no,
    s.role_required,
    s.status AS step_status
FROM workflow.approvals a
JOIN workflow.approval_steps s ON a.id = s.approval_id
WHERE a.status IN ('PENDING', 'IN_PROGRESS')
    AND s.status = 'PENDING'
ORDER BY a.priority DESC, a.requested_at ASC;

-- Grant select on views
GRANT SELECT ON config.effective_config_view TO authenticated, anon, service_role;
GRANT SELECT ON workflow.pending_approvals_view TO authenticated, service_role;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================
