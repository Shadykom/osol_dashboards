-- Simple RLS Disable Script
-- This script disables Row Level Security on all necessary tables to allow dashboard access

-- ============================================
-- Disable RLS on Banking Schema Tables
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Disable RLS on all tables in kastle_banking schema
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking' 
        AND rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE kastle_banking.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Disabled RLS on kastle_banking.%', r.tablename;
    END LOOP;
END $$;

-- ============================================
-- Disable RLS on Collection Schema Tables
-- ============================================

DO $$ 
DECLARE
    r RECORD;
BEGIN
    -- Disable RLS on all tables in kastle_collection schema
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_collection' 
        AND rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE kastle_collection.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Disabled RLS on kastle_collection.%', r.tablename;
    END LOOP;
END $$;

-- ============================================
-- Grant Permissions
-- ============================================

-- Grant permissions to anon and authenticated roles
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated;

-- ============================================
-- Verify Results
-- ============================================

-- Show all tables with their RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as security_status
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
ORDER BY schemaname, tablename;

-- Check if we have access to key tables
SELECT 
    'Access Check' as check_type,
    EXISTS(SELECT 1 FROM kastle_banking.customers LIMIT 1) as can_read_customers,
    EXISTS(SELECT 1 FROM kastle_banking.accounts LIMIT 1) as can_read_accounts,
    EXISTS(SELECT 1 FROM kastle_collection.collection_teams LIMIT 1) as can_read_teams,
    EXISTS(SELECT 1 FROM kastle_collection.collection_cases LIMIT 1) as can_read_cases;