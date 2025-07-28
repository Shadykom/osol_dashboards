-- Clean script to disable RLS on kastle_banking and kastle_collection schemas
-- This version minimizes syntax issues and focuses on the essentials

-- Step 1: Show current status
SELECT 
    'BEFORE' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
ORDER BY schemaname, tablename;

-- Step 2: Disable RLS and drop policies in one block
DO $$ 
DECLARE
    r RECORD;
    total_tables INTEGER := 0;
    total_policies INTEGER := 0;
BEGIN
    -- Disable RLS on all tables in kastle_banking and kastle_collection
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE schemaname IN ('kastle_banking', 'kastle_collection')
        AND rowsecurity = true
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
            total_tables := total_tables + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Could not disable RLS on %.%: %', r.schemaname, r.tablename, SQLERRM;
        END;
    END LOOP;
    
    -- Drop all policies
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
        WHERE schemaname IN ('kastle_banking', 'kastle_collection')
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
            total_policies := total_policies + 1;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE WARNING 'Could not drop policy % on %.%: %', r.policyname, r.schemaname, r.tablename, SQLERRM;
        END;
    END LOOP;
    
    -- Grant permissions
    BEGIN
        -- kastle_banking
        GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA kastle_banking TO anon, authenticated, service_role;
        
        -- kastle_collection
        GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;
        GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
        GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
        GRANT ALL ON ALL FUNCTIONS IN SCHEMA kastle_collection TO anon, authenticated, service_role;
    EXCEPTION
        WHEN OTHERS THEN
            RAISE WARNING 'Error granting permissions: %', SQLERRM;
    END;
    
    RAISE NOTICE 'Completed: Disabled RLS on % tables, dropped % policies', total_tables, total_policies;
END $$;

-- Step 3: Show final status
SELECT 
    'AFTER' as status,
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
ORDER BY schemaname, tablename;

-- Step 4: Summary
SELECT 
    schemaname,
    COUNT(*) as total_tables,
    COUNT(*) FILTER (WHERE rowsecurity = true) as tables_with_rls_enabled,
    COUNT(*) FILTER (WHERE rowsecurity = false) as tables_with_rls_disabled
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
GROUP BY schemaname;

-- Step 5: Verify permissions
SELECT 
    schema_name,
    has_schema_privilege('anon', schema_name, 'USAGE') as anon_can_access,
    has_schema_privilege('authenticated', schema_name, 'USAGE') as authenticated_can_access,
    has_schema_privilege('service_role', schema_name, 'USAGE') as service_role_can_access
FROM information_schema.schemata
WHERE schema_name IN ('kastle_banking', 'kastle_collection');