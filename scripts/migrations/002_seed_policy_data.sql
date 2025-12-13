-- =====================================================
-- EPIC 3: Regulatory Policy Engine (PDP) - Seed Data
-- Version: 1.0.0
-- Description: Seeds default policy profiles and rules
-- =====================================================

-- Use a default tenant ID for demo purposes
-- In production, this would be replaced with actual tenant IDs
DO $$
DECLARE
    demo_tenant_id UUID := '00000000-0000-0000-0000-000000000001';
    demo_user_id UUID := '00000000-0000-0000-0000-000000000099';
    retail_profile_id UUID;
    sme_profile_id UUID;
    corp_profile_id UUID;
    retail_version_id UUID;
    sme_version_id UUID;
    corp_version_id UUID;
BEGIN
    -- =====================================================
    -- 1. RETAIL Customer Policy Profile
    -- =====================================================
    
    INSERT INTO policy.policy_profiles (
        id,
        tenant_id,
        name,
        description,
        customer_type,
        secured_flag,
        status,
        priority,
        metadata,
        created_by
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'Retail Collection Policy - Standard',
        'Standard collection policy for retail customers with contact limits and time windows',
        'RETAIL',
        NULL,  -- Applies to both secured and unsecured
        'ACTIVE',
        100,
        '{"department": "Retail Collections", "regulatory_reference": "REG-2024-001"}'::jsonb,
        demo_user_id
    )
    ON CONFLICT (tenant_id, customer_type, secured_flag) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO retail_profile_id;

    -- Create PUBLISHED version for RETAIL
    INSERT INTO policy.policy_versions (
        id,
        tenant_id,
        profile_id,
        version_no,
        status,
        effective_from,
        rules_json,
        change_reason,
        created_by,
        approved_by,
        approved_at,
        published_by,
        published_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        retail_profile_id,
        1,
        'PUBLISHED',
        NOW(),
        '{
            "version": "1.0.0",
            "description": "Retail Collection Policy Rules",
            "rules": [
                {
                    "id": "retail_max_attempts",
                    "type": "max_attempts",
                    "name": "Maximum Contact Attempts",
                    "description": "Limit contact attempts to 10 per 7-day window",
                    "max_attempts": 10,
                    "window": "7d",
                    "action_types": ["CALL", "WHATSAPP", "SMS", "EMAIL", "IVR"],
                    "on_violation": "BLOCK",
                    "enabled": true
                },
                {
                    "id": "retail_time_window",
                    "type": "time_window",
                    "name": "Allowed Contact Hours",
                    "description": "Contact allowed only during business hours",
                    "allowed_windows": [
                        {
                            "days": [0, 1, 2, 3, 4],
                            "start_time": "09:00",
                            "end_time": "18:00",
                            "description": "Weekdays 9 AM - 6 PM"
                        },
                        {
                            "days": [5],
                            "start_time": "09:00",
                            "end_time": "14:00",
                            "description": "Saturday 9 AM - 2 PM"
                        }
                    ],
                    "timezone": "Asia/Riyadh",
                    "on_violation": "BLOCK",
                    "enabled": true
                },
                {
                    "id": "retail_cooling_period",
                    "type": "cooling_period",
                    "name": "Cooling Period After Contact",
                    "description": "Wait 24 hours between contact attempts",
                    "cooling_period": "24h",
                    "trigger_condition": "after_any_contact",
                    "on_violation": "BLOCK",
                    "enabled": true
                },
                {
                    "id": "retail_consent_check",
                    "type": "consent_check",
                    "name": "Channel Consent Requirement",
                    "description": "Require consent for WhatsApp and Email",
                    "channels_requiring_consent": ["WHATSAPP", "EMAIL"],
                    "required_consent_types": ["MARKETING", "COMMUNICATION"],
                    "on_violation": "BLOCK",
                    "enabled": true
                },
                {
                    "id": "retail_bucket_rules",
                    "type": "bucket_rule",
                    "name": "Bucket-Specific Rules",
                    "description": "Different rules based on delinquency bucket",
                    "bucket_restrictions": {
                        "CURRENT": {
                            "blocked": true,
                            "reason": "No collection activity for current accounts"
                        },
                        "1-30": {
                            "allowed_actions": ["SMS", "EMAIL", "IVR"],
                            "description": "Soft contact only for early delinquency"
                        },
                        "31-60": {
                            "allowed_actions": ["CALL", "SMS", "EMAIL", "IVR", "WHATSAPP"]
                        },
                        "61-90": {
                            "allowed_actions": ["CALL", "SMS", "EMAIL", "IVR", "WHATSAPP", "FIELD_VISIT"]
                        },
                        "91+": {
                            "allowed_actions": ["CALL", "SMS", "EMAIL", "IVR", "WHATSAPP", "FIELD_VISIT", "LEGAL"]
                        }
                    },
                    "on_violation": "BLOCK",
                    "enabled": true
                }
            ],
            "metadata": {
                "created_by": "System",
                "regulatory_compliance": ["SAMA", "PDP"],
                "review_frequency": "quarterly"
            }
        }'::jsonb,
        'Initial retail policy configuration',
        demo_user_id,
        demo_user_id,
        NOW(),
        demo_user_id,
        NOW()
    )
    ON CONFLICT (profile_id, version_no) DO NOTHING
    RETURNING id INTO retail_version_id;

    -- =====================================================
    -- 2. SME Customer Policy Profile
    -- =====================================================
    
    INSERT INTO policy.policy_profiles (
        id,
        tenant_id,
        name,
        description,
        customer_type,
        secured_flag,
        status,
        priority,
        metadata,
        created_by
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'SME Collection Policy - Standard',
        'Collection policy for SME customers with extended contact limits',
        'SME',
        NULL,
        'ACTIVE',
        100,
        '{"department": "SME Collections", "regulatory_reference": "REG-2024-002"}'::jsonb,
        demo_user_id
    )
    ON CONFLICT (tenant_id, customer_type, secured_flag) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO sme_profile_id;

    -- Create PUBLISHED version for SME
    INSERT INTO policy.policy_versions (
        id,
        tenant_id,
        profile_id,
        version_no,
        status,
        effective_from,
        rules_json,
        change_reason,
        created_by,
        approved_by,
        approved_at,
        published_by,
        published_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        sme_profile_id,
        1,
        'PUBLISHED',
        NOW(),
        '{
            "version": "1.0.0",
            "description": "SME Collection Policy Rules",
            "rules": [
                {
                    "id": "sme_max_attempts",
                    "type": "max_attempts",
                    "name": "Maximum Contact Attempts",
                    "description": "Limit contact attempts to 15 per 7-day window for SME",
                    "max_attempts": 15,
                    "window": "7d",
                    "action_types": ["CALL", "WHATSAPP", "SMS", "EMAIL", "IVR"],
                    "on_violation": "APPROVAL_REQUIRED",
                    "enabled": true
                },
                {
                    "id": "sme_time_window",
                    "type": "time_window",
                    "name": "Allowed Contact Hours",
                    "description": "Extended business hours for SME",
                    "allowed_windows": [
                        {
                            "days": [0, 1, 2, 3, 4],
                            "start_time": "08:00",
                            "end_time": "20:00",
                            "description": "Weekdays 8 AM - 8 PM"
                        },
                        {
                            "days": [5],
                            "start_time": "09:00",
                            "end_time": "17:00",
                            "description": "Saturday 9 AM - 5 PM"
                        }
                    ],
                    "timezone": "Asia/Riyadh",
                    "on_violation": "BLOCK",
                    "enabled": true
                },
                {
                    "id": "sme_cooling_period",
                    "type": "cooling_period",
                    "name": "Cooling Period After Contact",
                    "description": "Wait 12 hours between contact attempts",
                    "cooling_period": "12h",
                    "trigger_condition": "after_any_contact",
                    "on_violation": "APPROVAL_REQUIRED",
                    "enabled": true
                }
            ],
            "metadata": {
                "created_by": "System",
                "regulatory_compliance": ["SAMA", "PDP"],
                "review_frequency": "quarterly"
            }
        }'::jsonb,
        'Initial SME policy configuration',
        demo_user_id,
        demo_user_id,
        NOW(),
        demo_user_id,
        NOW()
    )
    ON CONFLICT (profile_id, version_no) DO NOTHING
    RETURNING id INTO sme_version_id;

    -- =====================================================
    -- 3. Corporate Customer Policy Profile
    -- =====================================================
    
    INSERT INTO policy.policy_profiles (
        id,
        tenant_id,
        name,
        description,
        customer_type,
        secured_flag,
        status,
        priority,
        metadata,
        created_by
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        'Corporate Collection Policy - Standard',
        'Collection policy for corporate customers with relationship manager involvement',
        'CORP',
        NULL,
        'ACTIVE',
        100,
        '{"department": "Corporate Collections", "regulatory_reference": "REG-2024-003"}'::jsonb,
        demo_user_id
    )
    ON CONFLICT (tenant_id, customer_type, secured_flag) 
    DO UPDATE SET 
        name = EXCLUDED.name,
        description = EXCLUDED.description,
        updated_at = NOW()
    RETURNING id INTO corp_profile_id;

    -- Create PUBLISHED version for Corporate
    INSERT INTO policy.policy_versions (
        id,
        tenant_id,
        profile_id,
        version_no,
        status,
        effective_from,
        rules_json,
        change_reason,
        created_by,
        approved_by,
        approved_at,
        published_by,
        published_at
    ) VALUES (
        gen_random_uuid(),
        demo_tenant_id,
        corp_profile_id,
        1,
        'PUBLISHED',
        NOW(),
        '{
            "version": "1.0.0",
            "description": "Corporate Collection Policy Rules",
            "rules": [
                {
                    "id": "corp_max_attempts",
                    "type": "max_attempts",
                    "name": "Maximum Contact Attempts",
                    "description": "Limit contact attempts to 5 per 7-day window for Corporate (high-touch relationship)",
                    "max_attempts": 5,
                    "window": "7d",
                    "action_types": ["CALL", "EMAIL"],
                    "on_violation": "APPROVAL_REQUIRED",
                    "enabled": true
                },
                {
                    "id": "corp_time_window",
                    "type": "time_window",
                    "name": "Allowed Contact Hours",
                    "description": "Business hours only for corporate",
                    "allowed_windows": [
                        {
                            "days": [0, 1, 2, 3, 4],
                            "start_time": "09:00",
                            "end_time": "17:00",
                            "description": "Weekdays 9 AM - 5 PM"
                        }
                    ],
                    "timezone": "Asia/Riyadh",
                    "on_violation": "BLOCK",
                    "enabled": true
                },
                {
                    "id": "corp_channel_restriction",
                    "type": "channel_restriction",
                    "name": "Channel Restrictions",
                    "description": "Corporate customers - formal channels only",
                    "allowed_channels": ["CALL", "EMAIL", "FORMAL_LETTER"],
                    "blocked_channels": ["SMS", "WHATSAPP", "IVR"],
                    "on_violation": "BLOCK",
                    "enabled": true
                },
                {
                    "id": "corp_cooling_period",
                    "type": "cooling_period",
                    "name": "Cooling Period After Contact",
                    "description": "Wait 48 hours between contact attempts for corporate",
                    "cooling_period": "48h",
                    "trigger_condition": "after_any_contact",
                    "on_violation": "APPROVAL_REQUIRED",
                    "enabled": true
                }
            ],
            "metadata": {
                "created_by": "System",
                "regulatory_compliance": ["SAMA", "PDP"],
                "review_frequency": "monthly",
                "notes": "Corporate policies require relationship manager approval for overrides"
            }
        }'::jsonb,
        'Initial corporate policy configuration',
        demo_user_id,
        demo_user_id,
        NOW(),
        demo_user_id,
        NOW()
    )
    ON CONFLICT (profile_id, version_no) DO NOTHING
    RETURNING id INTO corp_version_id;

    -- =====================================================
    -- 4. Sample Contact Attempt Data for Testing
    -- =====================================================
    
    -- Insert sample contact attempts for testing max_attempts rule
    -- Customer with multiple attempts approaching limit
    INSERT INTO policy.contact_attempt_cache (
        tenant_id,
        customer_id,
        contract_id,
        action_type,
        channel,
        attempt_timestamp,
        outcome,
        metadata
    )
    SELECT 
        demo_tenant_id,
        'CUST-TEST-001',
        'CONT-TEST-001',
        action_type,
        channel,
        NOW() - (n || ' days')::interval,
        outcome,
        '{"test": true}'::jsonb
    FROM (
        VALUES 
            (1, 'CALL', 'PHONE', 'ANSWERED'),
            (2, 'CALL', 'PHONE', 'NO_ANSWER'),
            (3, 'SMS', 'SMS', 'DELIVERED'),
            (4, 'CALL', 'PHONE', 'ANSWERED'),
            (5, 'EMAIL', 'EMAIL', 'OPENED'),
            (6, 'CALL', 'PHONE', 'BUSY'),
            (7, 'WHATSAPP', 'WHATSAPP', 'READ'),
            (8, 'CALL', 'PHONE', 'ANSWERED')
    ) AS t(n, action_type, channel, outcome)
    ON CONFLICT DO NOTHING;

    -- Customer at the limit (10 attempts)
    INSERT INTO policy.contact_attempt_cache (
        tenant_id,
        customer_id,
        contract_id,
        action_type,
        channel,
        attempt_timestamp,
        outcome,
        metadata
    )
    SELECT 
        demo_tenant_id,
        'CUST-TEST-002',
        'CONT-TEST-002',
        'CALL',
        'PHONE',
        NOW() - ((n * 12) || ' hours')::interval,
        'ATTEMPTED',
        '{"test": true}'::jsonb
    FROM generate_series(1, 10) AS n
    ON CONFLICT DO NOTHING;

    -- =====================================================
    -- Log completion
    -- =====================================================
    
    RAISE NOTICE 'Policy seed data completed successfully';
    RAISE NOTICE 'Created profiles: RETAIL (%), SME (%), CORP (%)', 
        retail_profile_id, sme_profile_id, corp_profile_id;

END $$;

-- =====================================================
-- Verification Queries
-- =====================================================

-- Verify profiles were created
SELECT 'Policy Profiles Created:' AS info;
SELECT 
    id,
    name,
    customer_type,
    secured_flag,
    status,
    created_at
FROM policy.policy_profiles
ORDER BY customer_type;

-- Verify versions were created
SELECT 'Policy Versions Created:' AS info;
SELECT 
    pv.id,
    pp.name AS profile_name,
    pv.version_no,
    pv.status,
    pv.effective_from,
    jsonb_array_length(pv.rules_json->'rules') AS rule_count
FROM policy.policy_versions pv
JOIN policy.policy_profiles pp ON pv.profile_id = pp.id
ORDER BY pp.customer_type, pv.version_no;

-- Verify contact attempts were cached
SELECT 'Contact Attempt Cache:' AS info;
SELECT 
    customer_id,
    COUNT(*) AS attempt_count,
    MAX(attempt_timestamp) AS last_attempt
FROM policy.contact_attempt_cache
GROUP BY customer_id
ORDER BY customer_id;
