-- ============================================================================
-- EPIC 2: Configuration & Maker-Checker Seed Data
-- ============================================================================
-- This script creates default seed data for the configuration system:
-- - Default tenant
-- - Core configuration package with published version
-- - Sample configuration items
-- ============================================================================

-- Default tenant ID for single-tenant deployments (can be overridden)
-- In multi-tenant deployments, each tenant would have their own UUID
DO $$
DECLARE
    v_default_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    v_system_user_id UUID := '00000000-0000-0000-0000-000000000000';
    v_core_package_id UUID;
    v_core_version_id UUID;
BEGIN
    -- ========================================================================
    -- Create default "core" package
    -- ========================================================================
    INSERT INTO config.config_packages (
        id,
        tenant_id,
        name,
        description,
        status,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        v_default_tenant_id,
        'core',
        'Core system configuration package containing fundamental settings',
        'active',
        v_system_user_id
    )
    ON CONFLICT (tenant_id, name) DO UPDATE
        SET description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_core_package_id;

    -- ========================================================================
    -- Create version 1 of core package (PUBLISHED)
    -- ========================================================================
    INSERT INTO config.config_versions (
        id,
        tenant_id,
        package_id,
        version_no,
        status,
        effective_from,
        published_at,
        published_by,
        created_by
    ) VALUES (
        uuid_generate_v4(),
        v_default_tenant_id,
        v_core_package_id,
        1,
        'PUBLISHED',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        v_system_user_id,
        v_system_user_id
    )
    ON CONFLICT (tenant_id, package_id, version_no) DO UPDATE
        SET status = 'PUBLISHED',
            published_at = COALESCE(config.config_versions.published_at, CURRENT_TIMESTAMP),
            updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_core_version_id;

    -- ========================================================================
    -- Create default configuration items for core package
    -- ========================================================================

    -- System Settings
    INSERT INTO config.config_items (tenant_id, version_id, key, value_json, value_type, description, created_by)
    VALUES 
        (v_default_tenant_id, v_core_version_id, 'system.name', '"OSOL Collection System"', 'string', 'System display name', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'system.version', '"1.0.0"', 'string', 'System version', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'system.timezone', '"Asia/Riyadh"', 'string', 'Default system timezone', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'system.language', '"ar"', 'string', 'Default system language', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'system.currency', '"SAR"', 'string', 'Default currency code', v_system_user_id)
    ON CONFLICT (tenant_id, version_id, key) DO UPDATE
        SET value_json = EXCLUDED.value_json,
            updated_at = CURRENT_TIMESTAMP;

    -- Collection Policy Settings
    INSERT INTO config.config_items (tenant_id, version_id, key, value_json, value_type, scope_json, description, created_by)
    VALUES 
        -- Contact attempt limits
        (v_default_tenant_id, v_core_version_id, 'policy.collection.max_contact_attempts_daily', '5', 'number', NULL, 'Maximum contact attempts per customer per day', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'policy.collection.max_contact_attempts_weekly', '15', 'number', NULL, 'Maximum contact attempts per customer per week', v_system_user_id),
        
        -- Retail-specific policies
        (v_default_tenant_id, v_core_version_id, 'policy.retail.max_contact_attempts', '3', 'number', '{"portfolio": "retail"}', 'Max daily contacts for retail customers', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'policy.retail.escalation_threshold_days', '30', 'number', '{"portfolio": "retail"}', 'Days past due before escalation for retail', v_system_user_id),
        
        -- Corporate-specific policies
        (v_default_tenant_id, v_core_version_id, 'policy.corporate.max_contact_attempts', '5', 'number', '{"portfolio": "corporate"}', 'Max daily contacts for corporate customers', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'policy.corporate.escalation_threshold_days', '45', 'number', '{"portfolio": "corporate"}', 'Days past due before escalation for corporate', v_system_user_id),
        
        -- Promise to Pay settings
        (v_default_tenant_id, v_core_version_id, 'policy.ptp.max_extensions', '2', 'number', NULL, 'Maximum PTP extensions allowed', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'policy.ptp.default_duration_days', '14', 'number', NULL, 'Default PTP duration in days', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'policy.ptp.max_duration_days', '30', 'number', NULL, 'Maximum PTP duration in days', v_system_user_id),
        
        -- Legal action thresholds
        (v_default_tenant_id, v_core_version_id, 'policy.legal.minimum_amount', '10000', 'number', NULL, 'Minimum outstanding amount for legal action', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'policy.legal.minimum_dpd', '90', 'number', NULL, 'Minimum days past due for legal action', v_system_user_id)
    ON CONFLICT (tenant_id, version_id, key) DO UPDATE
        SET value_json = EXCLUDED.value_json,
            scope_json = EXCLUDED.scope_json,
            updated_at = CURRENT_TIMESTAMP;

    -- Scoring Configuration
    INSERT INTO config.config_items (tenant_id, version_id, key, value_json, value_type, description, created_by)
    VALUES 
        (v_default_tenant_id, v_core_version_id, 'scoring.collection.weights', '{"payment_history": 0.35, "outstanding_balance": 0.25, "dpd": 0.20, "customer_segment": 0.10, "collateral": 0.10}', 'object', 'Collection score weight factors', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'scoring.collection.thresholds', '{"high_risk": 30, "medium_risk": 60, "low_risk": 80}', 'object', 'Risk threshold scores', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'scoring.collection.recalculation_frequency_hours', '24', 'number', 'Hours between score recalculations', v_system_user_id)
    ON CONFLICT (tenant_id, version_id, key) DO UPDATE
        SET value_json = EXCLUDED.value_json,
            updated_at = CURRENT_TIMESTAMP;

    -- Bucket Configuration
    INSERT INTO config.config_items (tenant_id, version_id, key, value_json, value_type, description, created_by)
    VALUES 
        (v_default_tenant_id, v_core_version_id, 'buckets.definitions', '[
            {"code": "CURRENT", "name": "Current", "min_dpd": 0, "max_dpd": 0, "strategy": "preventive"},
            {"code": "B1", "name": "Bucket 1", "min_dpd": 1, "max_dpd": 30, "strategy": "soft_collection"},
            {"code": "B2", "name": "Bucket 2", "min_dpd": 31, "max_dpd": 60, "strategy": "medium_collection"},
            {"code": "B3", "name": "Bucket 3", "min_dpd": 61, "max_dpd": 90, "strategy": "hard_collection"},
            {"code": "B4", "name": "Bucket 4", "min_dpd": 91, "max_dpd": 180, "strategy": "pre_legal"},
            {"code": "WRITEOFF", "name": "Write-off", "min_dpd": 181, "max_dpd": null, "strategy": "legal"}
        ]', 'array', 'Delinquency bucket definitions', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'buckets.auto_transition', 'true', 'boolean', 'Enable automatic bucket transitions based on DPD', v_system_user_id)
    ON CONFLICT (tenant_id, version_id, key) DO UPDATE
        SET value_json = EXCLUDED.value_json,
            updated_at = CURRENT_TIMESTAMP;

    -- Notification Settings
    INSERT INTO config.config_items (tenant_id, version_id, key, value_json, value_type, description, created_by)
    VALUES 
        (v_default_tenant_id, v_core_version_id, 'notification.channels', '["sms", "email", "push", "whatsapp"]', 'array', 'Available notification channels', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'notification.quiet_hours', '{"start": "22:00", "end": "08:00"}', 'object', 'Hours when notifications should not be sent', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'notification.weekend_enabled', 'false', 'boolean', 'Allow notifications on weekends', v_system_user_id)
    ON CONFLICT (tenant_id, version_id, key) DO UPDATE
        SET value_json = EXCLUDED.value_json,
            updated_at = CURRENT_TIMESTAMP;

    -- Workflow Settings
    INSERT INTO config.config_items (tenant_id, version_id, key, value_json, value_type, description, created_by)
    VALUES 
        (v_default_tenant_id, v_core_version_id, 'workflow.approval.config_change_roles', '["config_checker", "config_admin"]', 'array', 'Roles required to approve config changes', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'workflow.approval.policy_change_roles', '["policy_checker", "compliance_officer"]', 'array', 'Roles required to approve policy changes', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'workflow.approval.expiry_hours', '72', 'number', 'Hours before pending approval expires', v_system_user_id)
    ON CONFLICT (tenant_id, version_id, key) DO UPDATE
        SET value_json = EXCLUDED.value_json,
            updated_at = CURRENT_TIMESTAMP;

    -- Audit Settings
    INSERT INTO config.config_items (tenant_id, version_id, key, value_json, value_type, description, created_by)
    VALUES 
        (v_default_tenant_id, v_core_version_id, 'audit.retention_days', '2555', 'number', 'Days to retain audit logs (7 years)', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'audit.sensitive_fields', '["password", "ssn", "national_id", "credit_card"]', 'array', 'Fields to mask in audit logs', v_system_user_id),
        (v_default_tenant_id, v_core_version_id, 'audit.log_read_access', 'false', 'boolean', 'Log read/select operations', v_system_user_id)
    ON CONFLICT (tenant_id, version_id, key) DO UPDATE
        SET value_json = EXCLUDED.value_json,
            updated_at = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Seed data created successfully for tenant %', v_default_tenant_id;
END $$;

-- ============================================================================
-- Create a sample "collections" package for demonstration
-- ============================================================================

DO $$
DECLARE
    v_default_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    v_system_user_id UUID := '00000000-0000-0000-0000-000000000000';
    v_collections_package_id UUID;
    v_collections_version_id UUID;
BEGIN
    -- Create collections package
    INSERT INTO config.config_packages (
        tenant_id,
        name,
        description,
        status,
        created_by
    ) VALUES (
        v_default_tenant_id,
        'collections',
        'Collection-specific configuration settings',
        'active',
        v_system_user_id
    )
    ON CONFLICT (tenant_id, name) DO UPDATE
        SET description = EXCLUDED.description,
            updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_collections_package_id;

    -- Create published version
    INSERT INTO config.config_versions (
        tenant_id,
        package_id,
        version_no,
        status,
        effective_from,
        published_at,
        published_by,
        created_by
    ) VALUES (
        v_default_tenant_id,
        v_collections_package_id,
        1,
        'PUBLISHED',
        CURRENT_TIMESTAMP,
        CURRENT_TIMESTAMP,
        v_system_user_id,
        v_system_user_id
    )
    ON CONFLICT (tenant_id, package_id, version_no) DO UPDATE
        SET status = 'PUBLISHED',
            updated_at = CURRENT_TIMESTAMP
    RETURNING id INTO v_collections_version_id;

    -- Collection-specific config items
    INSERT INTO config.config_items (tenant_id, version_id, key, value_json, value_type, scope_json, description, created_by)
    VALUES 
        -- Auto-dialer settings
        (v_default_tenant_id, v_collections_version_id, 'dialer.max_concurrent_calls', '50', 'number', NULL, 'Maximum concurrent outbound calls', v_system_user_id),
        (v_default_tenant_id, v_collections_version_id, 'dialer.retry_interval_minutes', '60', 'number', NULL, 'Minutes between call retries', v_system_user_id),
        (v_default_tenant_id, v_collections_version_id, 'dialer.max_ring_seconds', '30', 'number', NULL, 'Maximum ring time before hangup', v_system_user_id),
        
        -- Agent workload settings
        (v_default_tenant_id, v_collections_version_id, 'agent.max_cases_per_agent', '100', 'number', NULL, 'Maximum cases assigned per agent', v_system_user_id),
        (v_default_tenant_id, v_collections_version_id, 'agent.case_assignment_strategy', '"round_robin"', 'string', NULL, 'Case assignment strategy: round_robin, skill_based, workload_balanced', v_system_user_id),
        
        -- SMS template IDs
        (v_default_tenant_id, v_collections_version_id, 'templates.sms.payment_reminder', '"SMS_PAYMENT_REMINDER_01"', 'string', NULL, 'SMS template for payment reminders', v_system_user_id),
        (v_default_tenant_id, v_collections_version_id, 'templates.sms.overdue_notice', '"SMS_OVERDUE_NOTICE_01"', 'string', NULL, 'SMS template for overdue notices', v_system_user_id),
        (v_default_tenant_id, v_collections_version_id, 'templates.sms.ptp_confirmation', '"SMS_PTP_CONFIRM_01"', 'string', NULL, 'SMS template for PTP confirmations', v_system_user_id),
        
        -- Product-specific settings
        (v_default_tenant_id, v_collections_version_id, 'product.personal_loan.grace_period_days', '5', 'number', '{"product": "personal_loan"}', 'Grace period for personal loans', v_system_user_id),
        (v_default_tenant_id, v_collections_version_id, 'product.credit_card.grace_period_days', '3', 'number', '{"product": "credit_card"}', 'Grace period for credit cards', v_system_user_id),
        (v_default_tenant_id, v_collections_version_id, 'product.mortgage.grace_period_days', '15', 'number', '{"product": "mortgage"}', 'Grace period for mortgages', v_system_user_id)
    ON CONFLICT (tenant_id, version_id, key) DO UPDATE
        SET value_json = EXCLUDED.value_json,
            scope_json = EXCLUDED.scope_json,
            updated_at = CURRENT_TIMESTAMP;

    RAISE NOTICE 'Collections package seed data created successfully';
END $$;

-- ============================================================================
-- Verify seed data
-- ============================================================================
DO $$
DECLARE
    v_package_count INTEGER;
    v_version_count INTEGER;
    v_item_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_package_count FROM config.config_packages;
    SELECT COUNT(*) INTO v_version_count FROM config.config_versions WHERE status = 'PUBLISHED';
    SELECT COUNT(*) INTO v_item_count FROM config.config_items;
    
    RAISE NOTICE 'Seed data summary:';
    RAISE NOTICE '  - Packages: %', v_package_count;
    RAISE NOTICE '  - Published versions: %', v_version_count;
    RAISE NOTICE '  - Config items: %', v_item_count;
END $$;
