-- =====================================================
-- EPIC 3: PDP Enforcement Updates
-- Version: 1.0.0
-- Description: Adds metadata column and updates for PEP pattern support
-- =====================================================

-- =====================================================
-- 1. Add metadata column to workflow_approvals
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'policy' 
        AND table_name = 'workflow_approvals' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE policy.workflow_approvals ADD COLUMN metadata JSONB DEFAULT '{}';
        RAISE NOTICE 'Added metadata column to workflow_approvals';
    ELSE
        RAISE NOTICE 'metadata column already exists';
    END IF;
END $$;

-- =====================================================
-- 2. Update entity_type check constraint to allow CONTACT_ACTION
-- =====================================================
DO $$
BEGIN
    -- Drop existing check constraint if it exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'workflow_approvals_entity_type_check'
        AND table_schema = 'policy'
    ) THEN
        ALTER TABLE policy.workflow_approvals DROP CONSTRAINT workflow_approvals_entity_type_check;
    END IF;
    
    -- Add updated constraint with new entity types
    ALTER TABLE policy.workflow_approvals 
    ADD CONSTRAINT workflow_approvals_entity_type_check 
    CHECK (entity_type IN ('POLICY_VERSION', 'CONTACT_ACTION', 'CASE_ACTION', 'CONFIG_CHANGE'));
    
    RAISE NOTICE 'Updated entity_type check constraint';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Could not update entity_type constraint: %', SQLERRM;
END $$;

-- =====================================================
-- 3. Create index on metadata for faster queries
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_workflow_approvals_metadata 
ON policy.workflow_approvals USING GIN (metadata);

CREATE INDEX IF NOT EXISTS idx_workflow_approvals_entity_type_status 
ON policy.workflow_approvals(entity_type, workflow_status);

-- =====================================================
-- 4. Create views in public schema for easier access
-- (Optional: if you don't want to create a separate client)
-- =====================================================

-- Policy profiles view
CREATE OR REPLACE VIEW public.pdp_policy_profiles AS
SELECT * FROM policy.policy_profiles;

-- Policy versions view
CREATE OR REPLACE VIEW public.pdp_policy_versions AS
SELECT * FROM policy.policy_versions;

-- Decision log view
CREATE OR REPLACE VIEW public.pdp_decision_log AS
SELECT * FROM policy.pdp_decision_log;

-- Workflow approvals view
CREATE OR REPLACE VIEW public.pdp_workflow_approvals AS
SELECT * FROM policy.workflow_approvals;

-- Contact attempt cache view
CREATE OR REPLACE VIEW public.pdp_contact_attempt_cache AS
SELECT * FROM policy.contact_attempt_cache;

-- Grant permissions on views
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdp_policy_profiles TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdp_policy_versions TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdp_decision_log TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdp_workflow_approvals TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pdp_contact_attempt_cache TO anon, authenticated, service_role;

-- =====================================================
-- 5. Create trigger rules for views (to enable INSERT/UPDATE/DELETE)
-- =====================================================

-- Trigger function for policy_profiles
CREATE OR REPLACE FUNCTION public.pdp_policy_profiles_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO policy.policy_profiles 
        SELECT NEW.*;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE policy.policy_profiles 
        SET tenant_id = NEW.tenant_id,
            name = NEW.name,
            description = NEW.description,
            customer_type = NEW.customer_type,
            secured_flag = NEW.secured_flag,
            status = NEW.status,
            priority = NEW.priority,
            metadata = NEW.metadata,
            created_by = NEW.created_by,
            updated_by = NEW.updated_by,
            updated_at = NOW()
        WHERE id = OLD.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM policy.policy_profiles WHERE id = OLD.id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pdp_policy_profiles_trigger ON public.pdp_policy_profiles;
CREATE TRIGGER pdp_policy_profiles_trigger
    INSTEAD OF INSERT OR UPDATE OR DELETE ON public.pdp_policy_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.pdp_policy_profiles_trigger_fn();

-- Trigger function for policy_versions
CREATE OR REPLACE FUNCTION public.pdp_policy_versions_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO policy.policy_versions 
        SELECT NEW.*;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE policy.policy_versions 
        SET tenant_id = NEW.tenant_id,
            profile_id = NEW.profile_id,
            version_no = NEW.version_no,
            status = NEW.status,
            effective_from = NEW.effective_from,
            effective_to = NEW.effective_to,
            rules_json = NEW.rules_json,
            change_reason = NEW.change_reason,
            created_by = NEW.created_by,
            submitted_by = NEW.submitted_by,
            submitted_at = NEW.submitted_at,
            reviewed_by = NEW.reviewed_by,
            reviewed_at = NEW.reviewed_at,
            review_comments = NEW.review_comments,
            approved_by = NEW.approved_by,
            approved_at = NEW.approved_at,
            published_by = NEW.published_by,
            published_at = NEW.published_at,
            updated_at = NOW()
        WHERE id = OLD.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM policy.policy_versions WHERE id = OLD.id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pdp_policy_versions_trigger ON public.pdp_policy_versions;
CREATE TRIGGER pdp_policy_versions_trigger
    INSTEAD OF INSERT OR UPDATE OR DELETE ON public.pdp_policy_versions
    FOR EACH ROW
    EXECUTE FUNCTION public.pdp_policy_versions_trigger_fn();

-- Trigger function for decision_log
CREATE OR REPLACE FUNCTION public.pdp_decision_log_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO policy.pdp_decision_log 
        SELECT NEW.*;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM policy.pdp_decision_log WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pdp_decision_log_trigger ON public.pdp_decision_log;
CREATE TRIGGER pdp_decision_log_trigger
    INSTEAD OF INSERT OR DELETE ON public.pdp_decision_log
    FOR EACH ROW
    EXECUTE FUNCTION public.pdp_decision_log_trigger_fn();

-- Trigger function for workflow_approvals
CREATE OR REPLACE FUNCTION public.pdp_workflow_approvals_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO policy.workflow_approvals 
        SELECT NEW.*;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE policy.workflow_approvals 
        SET tenant_id = NEW.tenant_id,
            entity_type = NEW.entity_type,
            entity_id = NEW.entity_id,
            workflow_status = NEW.workflow_status,
            maker_id = NEW.maker_id,
            maker_comments = NEW.maker_comments,
            made_at = NEW.made_at,
            checker_id = NEW.checker_id,
            checker_comments = NEW.checker_comments,
            checked_at = NEW.checked_at,
            approval_level = NEW.approval_level,
            required_approvals = NEW.required_approvals,
            current_approvals = NEW.current_approvals,
            metadata = NEW.metadata,
            updated_at = NOW()
        WHERE id = OLD.id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM policy.workflow_approvals WHERE id = OLD.id;
        RETURN OLD;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pdp_workflow_approvals_trigger ON public.pdp_workflow_approvals;
CREATE TRIGGER pdp_workflow_approvals_trigger
    INSTEAD OF INSERT OR UPDATE OR DELETE ON public.pdp_workflow_approvals
    FOR EACH ROW
    EXECUTE FUNCTION public.pdp_workflow_approvals_trigger_fn();

-- Trigger function for contact_attempt_cache
CREATE OR REPLACE FUNCTION public.pdp_contact_attempt_cache_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO policy.contact_attempt_cache 
        SELECT NEW.*;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        DELETE FROM policy.contact_attempt_cache WHERE id = OLD.id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS pdp_contact_attempt_cache_trigger ON public.pdp_contact_attempt_cache;
CREATE TRIGGER pdp_contact_attempt_cache_trigger
    INSTEAD OF INSERT OR DELETE ON public.pdp_contact_attempt_cache
    FOR EACH ROW
    EXECUTE FUNCTION public.pdp_contact_attempt_cache_trigger_fn();

-- =====================================================
-- 6. Wrap RPC functions for public schema access
-- =====================================================

CREATE OR REPLACE FUNCTION public.pdp_get_active_policy_version(
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
    SELECT * FROM policy.get_active_policy_version(p_tenant_id, p_customer_type, p_secured_flag);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.pdp_count_contact_attempts(
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
    SELECT * FROM policy.count_contact_attempts(p_tenant_id, p_customer_id, p_action_type, p_window_interval);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.pdp_get_active_policy_version TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.pdp_count_contact_attempts TO anon, authenticated, service_role;

-- =====================================================
-- 7. Verification
-- =====================================================
DO $$
DECLARE
    v_metadata_exists BOOLEAN;
    v_views_count INTEGER;
BEGIN
    -- Check metadata column
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'policy' 
        AND table_name = 'workflow_approvals' 
        AND column_name = 'metadata'
    ) INTO v_metadata_exists;
    
    -- Count views
    SELECT COUNT(*) INTO v_views_count
    FROM information_schema.views
    WHERE table_schema = 'public'
    AND table_name LIKE 'pdp_%';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'PDP Enforcement Updates Complete!';
    RAISE NOTICE '  metadata column: %', v_metadata_exists;
    RAISE NOTICE '  public views created: %', v_views_count;
    RAISE NOTICE '========================================';
END $$;
