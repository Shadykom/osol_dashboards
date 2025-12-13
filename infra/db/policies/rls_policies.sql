-- RLS Policies Reference
-- ======================
-- 
-- This file documents the RLS policy pattern used across all tenant tables.
-- 
-- NON-NEGOTIABLE REQUIREMENTS:
-- 1. Every tenant table MUST have tenant_id UUID NOT NULL
-- 2. RLS MUST be enabled on all tenant tables
-- 3. RLS rule: tenant_id = current_setting('app.current_tenant')::uuid
-- 4. API MUST set tenant per request: SELECT set_config('app.current_tenant','<uuid>', true)
-- 5. No hardcoded tenant routing

-- ============================================================================
-- Standard RLS Policy Template
-- ============================================================================

-- For new tenant tables, use this template:

/*
-- Enable RLS on the table
ALTER TABLE <table_name> ENABLE ROW LEVEL SECURITY;

-- Create isolation policy for all operations
CREATE POLICY <table_name>_tenant_isolation ON <table_name>
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

-- Alternative: Separate policies for read and write
CREATE POLICY <table_name>_select ON <table_name>
    FOR SELECT
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY <table_name>_insert ON <table_name>
    FOR INSERT
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY <table_name>_update ON <table_name>
    FOR UPDATE
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);

CREATE POLICY <table_name>_delete ON <table_name>
    FOR DELETE
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
*/

-- ============================================================================
-- Verify RLS is Enabled
-- ============================================================================

-- Run this query to verify RLS is enabled on all tenant tables:

/*
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN (
    'users',
    'audit_log',
    'tenant_config',
    'feature_flags'
    -- Add other tenant tables here
)
ORDER BY tablename;
*/

-- ============================================================================
-- Verify RLS Policies
-- ============================================================================

-- Run this query to list all RLS policies:

/*
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
*/

-- ============================================================================
-- Testing RLS
-- ============================================================================

-- Test RLS isolation between tenants:

/*
-- Create two test tenants
INSERT INTO tenants (id, name, slug, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Tenant A', 'tenant-a', 'active'),
    ('22222222-2222-2222-2222-222222222222', 'Tenant B', 'tenant-b', 'active');

-- Create users in each tenant
SET app.current_tenant = '11111111-1111-1111-1111-111111111111';
INSERT INTO users (tenant_id, email, name, role, status) VALUES
    ('11111111-1111-1111-1111-111111111111', 'user1@tenant-a.com', 'User 1', 'officer', 'active');

SET app.current_tenant = '22222222-2222-2222-2222-222222222222';
INSERT INTO users (tenant_id, email, name, role, status) VALUES
    ('22222222-2222-2222-2222-222222222222', 'user2@tenant-b.com', 'User 2', 'officer', 'active');

-- Verify isolation
SET app.current_tenant = '11111111-1111-1111-1111-111111111111';
SELECT * FROM users; -- Should only see User 1

SET app.current_tenant = '22222222-2222-2222-2222-222222222222';
SELECT * FROM users; -- Should only see User 2

-- Cleanup
DELETE FROM users WHERE tenant_id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);
DELETE FROM tenants WHERE id IN (
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
);
*/

-- ============================================================================
-- Bypass RLS (for superuser operations only)
-- ============================================================================

-- CAUTION: Only use for administrative tasks
-- Never expose this to application code

/*
-- Temporarily bypass RLS
SET ROLE postgres;

-- Run your administrative query here
SELECT * FROM users;

-- Reset to normal role
RESET ROLE;
*/
