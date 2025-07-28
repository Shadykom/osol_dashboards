-- Comprehensive RLS Disable Script for All Schemas
-- Connection: postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres
-- This script disables Row Level Security on ALL tables in ALL schemas

-- ============================================
-- Disable RLS on ALL Tables in ALL Schemas
-- ============================================

DO $$ 
DECLARE
    r RECORD;
    schema_count INTEGER := 0;
    table_count INTEGER := 0;
BEGIN
    -- Loop through all schemas except system schemas
    FOR r IN 
        SELECT DISTINCT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        AND rowsecurity = true
        ORDER BY schemaname, tablename
    LOOP
        BEGIN
            -- Disable RLS on each table
            EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
            RAISE NOTICE 'Disabled RLS on %.%', r.schemaname, r.tablename;
            table_count := table_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to disable RLS on %.%: %', r.schemaname, r.tablename, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Summary: Disabled RLS on % tables', table_count;
END $$;

-- ============================================
-- Drop ALL RLS Policies
-- ============================================

DO $$ 
DECLARE
    r RECORD;
    policy_count INTEGER := 0;
BEGIN
    -- Drop all policies on all tables
    FOR r IN 
        SELECT 
            schemaname,
            tablename,
            policyname
        FROM pg_policies
        WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        ORDER BY schemaname, tablename, policyname
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
            RAISE NOTICE 'Dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
            policy_count := policy_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to drop policy % on %.%: %', r.policyname, r.schemaname, r.tablename, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Summary: Dropped % policies', policy_count;
END $$;

-- ============================================
-- Grant Full Permissions to All Roles
-- ============================================

DO $$ 
DECLARE
    r RECORD;
    schema_count INTEGER := 0;
BEGIN
    -- Grant permissions on all schemas
    FOR r IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
        ORDER BY schema_name
    LOOP
        BEGIN
            -- Grant usage on schema
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            
            -- Grant all privileges on all tables
            EXECUTE format('GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            
            -- Grant all privileges on all sequences
            EXECUTE format('GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            
            -- Grant all privileges on all functions
            EXECUTE format('GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            
            -- Grant all privileges on all procedures
            EXECUTE format('GRANT ALL PRIVILEGES ON ALL PROCEDURES IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            
            RAISE NOTICE 'Granted full permissions on schema %', r.schema_name;
            schema_count := schema_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Failed to grant permissions on schema %: %', r.schema_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Summary: Granted permissions on % schemas', schema_count;
END $$;

-- ============================================
-- Disable RLS on Auth Schema (if exists)
-- ============================================

DO $$ 
BEGIN
    -- Special handling for auth schema tables
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'auth') THEN
        -- Disable RLS on auth.users if it exists
        IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'auth' AND tablename = 'users') THEN
            ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
            RAISE NOTICE 'Disabled RLS on auth.users';
        END IF;
        
        -- Grant permissions on auth schema
        GRANT USAGE ON SCHEMA auth TO anon, authenticated, service_role;
        GRANT SELECT ON ALL TABLES IN SCHEMA auth TO anon, authenticated, service_role;
    END IF;
END $$;

-- ============================================
-- Verification Queries
-- ============================================

-- Show all tables with RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'RLS STILL ENABLED!' ELSE 'RLS Disabled' END as security_status
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY rowsecurity DESC, schemaname, tablename;

-- Count tables with RLS still enabled
SELECT 
    COUNT(*) as tables_with_rls_enabled
FROM pg_tables
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
AND rowsecurity = true;

-- Show all remaining policies
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
WHERE schemaname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schemaname, tablename, policyname;

-- List all schemas with their access status
SELECT 
    schema_name,
    has_schema_privilege('anon', schema_name, 'USAGE') as anon_can_use,
    has_schema_privilege('authenticated', schema_name, 'USAGE') as authenticated_can_use,
    has_schema_privilege('service_role', schema_name, 'USAGE') as service_role_can_use
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'pg_temp_1', 'pg_toast_temp_1')
ORDER BY schema_name;