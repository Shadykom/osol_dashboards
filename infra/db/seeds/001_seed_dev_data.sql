-- Seed Script: Development Data
-- ==============================
-- 
-- This script creates test data for local development.
-- DO NOT run this in production.

-- ============================================================================
-- Clean Existing Data (for re-runs)
-- ============================================================================

-- Note: In production, these tables would never be truncated
TRUNCATE TABLE audit_log CASCADE;
TRUNCATE TABLE users CASCADE;
TRUNCATE TABLE tenant_config CASCADE;
TRUNCATE TABLE feature_flags CASCADE;
TRUNCATE TABLE tenants CASCADE;

-- ============================================================================
-- Create Test Tenants
-- ============================================================================

INSERT INTO tenants (id, name, slug, status, config) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'Development Tenant',
    'dev',
    'active',
    '{
        "features": {
            "collection": true,
            "reporting": true,
            "ai_recommendations": false
        },
        "branding": {
            "primaryColor": "#3B82F6",
            "logoUrl": null
        },
        "locale": {
            "defaultLanguage": "en",
            "timezone": "UTC",
            "currency": "USD"
        },
        "limits": {
            "maxUsers": 100,
            "maxCases": 10000
        }
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000002',
    'Demo Bank',
    'demo-bank',
    'active',
    '{
        "features": {
            "collection": true,
            "reporting": true,
            "ai_recommendations": true
        },
        "branding": {
            "primaryColor": "#059669",
            "logoUrl": null
        },
        "locale": {
            "defaultLanguage": "ar",
            "timezone": "Asia/Riyadh",
            "currency": "SAR"
        },
        "limits": {
            "maxUsers": 500,
            "maxCases": 100000
        }
    }'::jsonb
),
(
    '00000000-0000-0000-0000-000000000003',
    'Test Credit Union',
    'test-cu',
    'pending',
    '{
        "features": {
            "collection": true,
            "reporting": false,
            "ai_recommendations": false
        }
    }'::jsonb
);

-- ============================================================================
-- Create Test Users (Development Tenant)
-- ============================================================================

-- Set tenant context for RLS
SELECT set_config('app.current_tenant', '00000000-0000-0000-0000-000000000001', false);

INSERT INTO users (id, tenant_id, email, name, role, status, permissions) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@dev.cms.local',
    'Dev Admin',
    'tenant_admin',
    'active',
    ARRAY['*']  -- All permissions
),
(
    '00000000-0000-0000-0000-000000000002',
    '00000000-0000-0000-0000-000000000001',
    'manager@dev.cms.local',
    'Dev Manager',
    'manager',
    'active',
    ARRAY['read:cases', 'write:cases', 'read:customers', 'write:customers', 'read:reports', 'manage:team']
),
(
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000001',
    'officer@dev.cms.local',
    'Dev Officer',
    'officer',
    'active',
    ARRAY['read:cases', 'write:cases', 'read:customers']
),
(
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000001',
    'readonly@dev.cms.local',
    'Dev Viewer',
    'readonly',
    'active',
    ARRAY['read:cases', 'read:customers', 'read:reports']
);

-- ============================================================================
-- Create Test Users (Demo Bank Tenant)
-- ============================================================================

SELECT set_config('app.current_tenant', '00000000-0000-0000-0000-000000000002', false);

INSERT INTO users (id, tenant_id, email, name, role, status, permissions) VALUES
(
    '00000000-0000-0000-0000-000000000011',
    '00000000-0000-0000-0000-000000000002',
    'admin@demo-bank.com',
    'Bank Admin',
    'tenant_admin',
    'active',
    ARRAY['*']
),
(
    '00000000-0000-0000-0000-000000000012',
    '00000000-0000-0000-0000-000000000002',
    'collection.manager@demo-bank.com',
    'Collection Manager',
    'manager',
    'active',
    ARRAY['read:cases', 'write:cases', 'read:customers', 'write:customers', 'read:reports', 'manage:team']
);

-- ============================================================================
-- Create Feature Flags
-- ============================================================================

-- Global feature flags
INSERT INTO feature_flags (tenant_id, feature_key, enabled, description) VALUES
(NULL, 'dark_mode', true, 'Enable dark mode UI'),
(NULL, 'export_pdf', true, 'Enable PDF export'),
(NULL, 'export_excel', true, 'Enable Excel export'),
(NULL, 'ai_recommendations', false, 'Enable AI-powered recommendations (beta)');

-- Tenant-specific overrides
SELECT set_config('app.current_tenant', '00000000-0000-0000-0000-000000000002', false);
INSERT INTO feature_flags (tenant_id, feature_key, enabled, description) VALUES
('00000000-0000-0000-0000-000000000002', 'ai_recommendations', true, 'Demo Bank: AI recommendations enabled');

-- ============================================================================
-- Create System Config
-- ============================================================================

INSERT INTO system_config (key, value, description) VALUES
('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
('lockout_duration_minutes', '30', 'Account lockout duration in minutes'),
('session_timeout_minutes', '60', 'Session inactivity timeout'),
('password_min_length', '12', 'Minimum password length'),
('require_mfa', 'false', 'Require multi-factor authentication');

-- ============================================================================
-- Create Initial Audit Logs
-- ============================================================================

SELECT set_config('app.current_tenant', '00000000-0000-0000-0000-000000000001', false);

SELECT log_audit_event(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'seed',
    'system',
    NULL,
    NULL,
    '{"message": "Development seed data created"}'::jsonb,
    '{"source": "seed_script"}'::jsonb
);

-- ============================================================================
-- Reset tenant context
-- ============================================================================

SELECT set_config('app.current_tenant', '', false);

-- ============================================================================
-- Summary
-- ============================================================================

SELECT 'Seed data created successfully' AS status;

SELECT 'Tenants' AS entity, COUNT(*) AS count FROM tenants
UNION ALL
SELECT 'Users', COUNT(*) FROM users
UNION ALL
SELECT 'Feature Flags', COUNT(*) FROM feature_flags
UNION ALL
SELECT 'System Config', COUNT(*) FROM system_config;
