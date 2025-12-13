-- ============================================================================
-- CMS EPIC 1: Development Seed Data
-- ============================================================================
-- 
-- Run this AFTER supabase_epic1_setup.sql in Supabase SQL Editor
-- This creates test tenants and users for development.
--
-- DO NOT run in production!
-- ============================================================================

-- ============================================================================
-- 1. Create Test Tenants
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
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    config = EXCLUDED.config,
    updated_at = NOW();

-- ============================================================================
-- 2. Create Test Users (Development Tenant)
-- ============================================================================

INSERT INTO cms_users (id, tenant_id, email, name, role, status, permissions) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000001',
    'admin@dev.cms.local',
    'Dev Admin',
    'tenant_admin',
    'active',
    ARRAY['*']
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
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- ============================================================================
-- 3. Create Test Users (Demo Bank Tenant)
-- ============================================================================

INSERT INTO cms_users (id, tenant_id, email, name, role, status, permissions) VALUES
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
)
ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    permissions = EXCLUDED.permissions,
    updated_at = NOW();

-- ============================================================================
-- 4. Create Global Feature Flags
-- ============================================================================

INSERT INTO feature_flags (tenant_id, feature_key, enabled, description) VALUES
(NULL, 'dark_mode', true, 'Enable dark mode UI'),
(NULL, 'export_pdf', true, 'Enable PDF export'),
(NULL, 'export_excel', true, 'Enable Excel export'),
(NULL, 'ai_recommendations', false, 'Enable AI-powered recommendations (beta)')
ON CONFLICT (tenant_id, feature_key) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    description = EXCLUDED.description,
    updated_at = NOW();

-- Tenant-specific override for Demo Bank
INSERT INTO feature_flags (tenant_id, feature_key, enabled, description) VALUES
('00000000-0000-0000-0000-000000000002', 'ai_recommendations', true, 'Demo Bank: AI recommendations enabled')
ON CONFLICT (tenant_id, feature_key) DO UPDATE SET
    enabled = EXCLUDED.enabled,
    updated_at = NOW();

-- ============================================================================
-- 5. Create System Config
-- ============================================================================

INSERT INTO system_config (key, value, description) VALUES
('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
('lockout_duration_minutes', '30', 'Account lockout duration in minutes'),
('session_timeout_minutes', '60', 'Session inactivity timeout'),
('password_min_length', '12', 'Minimum password length'),
('require_mfa', 'false', 'Require multi-factor authentication')
ON CONFLICT (key) DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- ============================================================================
-- 6. Summary
-- ============================================================================

SELECT 'Seed Data Created!' AS status;

SELECT 'Tenants' AS entity, COUNT(*) AS count FROM tenants
UNION ALL
SELECT 'CMS Users', COUNT(*) FROM cms_users
UNION ALL
SELECT 'Feature Flags', COUNT(*) FROM feature_flags
UNION ALL
SELECT 'System Config', COUNT(*) FROM system_config;

-- ============================================================================
-- 7. Test RLS (Optional - Verify tenant isolation)
-- ============================================================================

-- Test tenant isolation by setting context and querying
-- SELECT set_config('app.current_tenant', '00000000-0000-0000-0000-000000000001', false);
-- SELECT * FROM cms_users; -- Should only see Dev Tenant users

-- SELECT set_config('app.current_tenant', '00000000-0000-0000-0000-000000000002', false);
-- SELECT * FROM cms_users; -- Should only see Demo Bank users
