-- Check and Fix Dashboard Access
-- This script checks what tables exist and fixes access accordingly

-- ============================================
-- STEP 1: Check what schemas and tables exist
-- ============================================

SELECT 
    'Schema Check' as check_type,
    EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kastle_banking') as has_banking_schema,
    EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kastle_collection') as has_collection_schema;

-- List all tables in both schemas
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
ORDER BY schemaname, tablename;

-- ============================================
-- STEP 2: Disable RLS on existing tables only
-- ============================================

-- Disable RLS on all banking tables
DO $$ 
DECLARE
    r RECORD;
    table_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking' 
        AND rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE kastle_banking.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Disabled RLS on kastle_banking.%', r.tablename;
        table_count := table_count + 1;
    END LOOP;
    
    IF table_count = 0 THEN
        RAISE NOTICE 'No tables with RLS found in kastle_banking schema';
    END IF;
END $$;

-- Disable RLS on all collection tables
DO $$ 
DECLARE
    r RECORD;
    table_count INTEGER := 0;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_collection' 
        AND rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE kastle_collection.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Disabled RLS on kastle_collection.%', r.tablename;
        table_count := table_count + 1;
    END LOOP;
    
    IF table_count = 0 THEN
        RAISE NOTICE 'No tables with RLS found in kastle_collection schema';
    END IF;
END $$;

-- ============================================
-- STEP 3: Grant permissions on existing schemas
-- ============================================

-- Grant permissions only if schemas exist
DO $$
BEGIN
    -- Grant on kastle_banking if it exists
    IF EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kastle_banking') THEN
        GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
        GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
        GRANT SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;
        RAISE NOTICE 'Granted permissions on kastle_banking schema';
    END IF;
    
    -- Grant on kastle_collection if it exists
    IF EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kastle_collection') THEN
        GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;
        GRANT SELECT ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
        GRANT SELECT ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated;
        RAISE NOTICE 'Granted permissions on kastle_collection schema';
    END IF;
END $$;

-- ============================================
-- STEP 4: Check collection_cases location
-- ============================================

-- Check if collection_cases exists in kastle_banking schema instead
SELECT 
    'Collection Cases Location' as check_type,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_cases'
    ) as in_banking_schema,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_cases'
    ) as in_collection_schema;

-- If collection_cases is in banking schema, disable RLS on it
DO $$
BEGIN
    IF EXISTS(
        SELECT 1 FROM pg_tables 
        WHERE schemaname = 'kastle_banking' 
        AND tablename = 'collection_cases'
        AND rowsecurity = true
    ) THEN
        ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
        RAISE NOTICE 'Disabled RLS on kastle_banking.collection_cases';
    END IF;
END $$;

-- ============================================
-- STEP 5: Final verification
-- ============================================

-- Show final RLS status
SELECT 
    'Final Status' as check_type,
    schemaname,
    tablename,
    CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as security_status
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
ORDER BY schemaname, tablename;

-- Test access to key tables (only those that exist)
DO $$
DECLARE
    result RECORD;
BEGIN
    -- Check banking tables
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'customers') THEN
        SELECT EXISTS(SELECT 1 FROM kastle_banking.customers LIMIT 1) INTO result;
        RAISE NOTICE 'Can read kastle_banking.customers: %', result;
    END IF;
    
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'accounts') THEN
        SELECT EXISTS(SELECT 1 FROM kastle_banking.accounts LIMIT 1) INTO result;
        RAISE NOTICE 'Can read kastle_banking.accounts: %', result;
    END IF;
    
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_cases') THEN
        SELECT EXISTS(SELECT 1 FROM kastle_banking.collection_cases LIMIT 1) INTO result;
        RAISE NOTICE 'Can read kastle_banking.collection_cases: %', result;
    END IF;
    
    -- Check collection tables
    IF EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'collection_teams') THEN
        SELECT EXISTS(SELECT 1 FROM kastle_collection.collection_teams LIMIT 1) INTO result;
        RAISE NOTICE 'Can read kastle_collection.collection_teams: %', result;
    END IF;
END $$;