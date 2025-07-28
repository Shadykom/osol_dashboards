-- Focused script to disable RLS on kastle_banking and kastle_collection schemas
-- This targets only your application schemas

-- 1. First, check what tables exist in these schemas
SELECT 
    'Current RLS Status' as report_type,
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    tableowner as owner
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
ORDER BY schemaname, tablename;

-- 2. Disable RLS on kastle_banking tables
DO $$ 
DECLARE
    r RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Disabling RLS on kastle_banking schema...';
    
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking' 
        AND rowsecurity = true
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE kastle_banking.%I DISABLE ROW LEVEL SECURITY', r.tablename);
            RAISE NOTICE '✓ Disabled RLS on kastle_banking.%', r.tablename;
            success_count := success_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '✗ Error disabling RLS on kastle_banking.%: %', r.tablename, SQLERRM;
                error_count := error_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE 'kastle_banking: % successful, % errors', success_count, error_count;
END $$;

-- 3. Disable RLS on kastle_collection tables
DO $$ 
DECLARE
    r RECORD;
    success_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Disabling RLS on kastle_collection schema...';
    
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_collection' 
        AND rowsecurity = true
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE kastle_collection.%I DISABLE ROW LEVEL SECURITY', r.tablename);
            RAISE NOTICE '✓ Disabled RLS on kastle_collection.%', r.tablename;
            success_count := success_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '✗ Error disabling RLS on kastle_collection.%: %', r.tablename, SQLERRM;
                error_count := error_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE 'kastle_collection: % successful, % errors', success_count, error_count;
END $$;

-- 4. Drop all policies on these schemas
DO $$ 
DECLARE
    r RECORD;
    policy_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Dropping all policies...';
    
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname IN ('kastle_banking', 'kastle_collection')
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
            RAISE NOTICE '✓ Dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
            policy_count := policy_count + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE '✗ Error dropping policy % on %.%: %', r.policyname, r.schemaname, r.tablename, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Dropped % policies', policy_count;
END $$;

-- 5. Grant full permissions
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Granting permissions...';
    
    -- Grant on kastle_banking
    GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA kastle_banking TO anon, authenticated, service_role;
    RAISE NOTICE '✓ Granted full permissions on kastle_banking';
    
    -- Grant on kastle_collection
    GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;
    GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
    GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
    GRANT ALL PRIVILEGES ON ALL FUNCTIONS IN SCHEMA kastle_collection TO anon, authenticated, service_role;
    RAISE NOTICE '✓ Granted full permissions on kastle_collection';
    
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error granting permissions: %', SQLERRM;
END $$;

-- 6. Verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'VERIFICATION';
    RAISE NOTICE '==========================================';
END $$;

-- Check RLS status
SELECT 
    schemaname,
    tablename,
    CASE 
        WHEN rowsecurity THEN '❌ RLS STILL ENABLED' 
        ELSE '✅ RLS Disabled' 
    END as rls_status
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
ORDER BY schemaname, tablename;

-- Count summary
SELECT 
    schemaname,
    COUNT(*) as total_tables,
    COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls,
    COUNT(*) FILTER (WHERE rowsecurity = false) as tables_without_rls
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
GROUP BY schemaname
ORDER BY schemaname;

-- Check permissions
SELECT 
    'kastle_banking' as schema_name,
    has_schema_privilege('anon', 'kastle_banking', 'USAGE') as anon_access,
    has_schema_privilege('authenticated', 'kastle_banking', 'USAGE') as auth_access,
    has_schema_privilege('service_role', 'kastle_banking', 'USAGE') as service_role_access
UNION ALL
SELECT 
    'kastle_collection',
    has_schema_privilege('anon', 'kastle_collection', 'USAGE'),
    has_schema_privilege('authenticated', 'kastle_collection', 'USAGE'),
    has_schema_privilege('service_role', 'kastle_collection', 'USAGE');