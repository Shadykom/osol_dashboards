-- Script to disable RLS only on tables you own
-- This avoids permission errors on system tables

-- 1. Disable RLS on tables you own
DO $$ 
DECLARE
    r RECORD;
    success_count INTEGER := 0;
    skip_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting RLS disable process...';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT 
            t.schemaname, 
            t.tablename,
            t.tableowner
        FROM pg_tables t
        WHERE t.rowsecurity = true
        ORDER BY t.schemaname, t.tablename
    LOOP
        BEGIN
            -- Try to disable RLS
            EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
            RAISE NOTICE '✓ Disabled RLS on %.% (owner: %)', r.schemaname, r.tablename, r.tableowner;
            success_count := success_count + 1;
        EXCEPTION
            WHEN insufficient_privilege THEN
                RAISE NOTICE '⚠ Skipped %.% (owned by: %, not you)', r.schemaname, r.tablename, r.tableowner;
                skip_count := skip_count + 1;
            WHEN OTHERS THEN
                RAISE NOTICE '✗ Error on %.%: %', r.schemaname, r.tablename, SQLERRM;
                error_count := error_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  - Successfully disabled RLS on % tables', success_count;
    RAISE NOTICE '  - Skipped % system/unowned tables', skip_count;
    RAISE NOTICE '  - Errors on % tables', error_count;
END $$;

-- 2. Drop policies on tables you own
DO $$ 
DECLARE
    r RECORD;
    success_count INTEGER := 0;
    skip_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Dropping policies...';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT DISTINCT
            p.schemaname,
            p.tablename,
            p.policyname,
            t.tableowner
        FROM pg_policies p
        JOIN pg_tables t ON p.schemaname = t.schemaname AND p.tablename = t.tablename
        ORDER BY p.schemaname, p.tablename, p.policyname
    LOOP
        BEGIN
            EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
            RAISE NOTICE '✓ Dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
            success_count := success_count + 1;
        EXCEPTION
            WHEN insufficient_privilege THEN
                RAISE NOTICE '⚠ Cannot drop policy % on %.% (owned by %)', r.policyname, r.schemaname, r.tablename, r.tableowner;
                skip_count := skip_count + 1;
            WHEN OTHERS THEN
                -- Silently continue
                skip_count := skip_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Policy Summary:';
    RAISE NOTICE '  - Dropped % policies', success_count;
    RAISE NOTICE '  - Skipped % policies on system tables', skip_count;
END $$;

-- 3. Grant permissions on schemas you have access to
DO $$ 
DECLARE
    r RECORD;
    success_count INTEGER := 0;
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE 'Granting permissions...';
    RAISE NOTICE '';
    
    FOR r IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
        AND schema_name NOT LIKE 'pg_temp_%'
        AND schema_name NOT LIKE 'pg_toast_temp_%'
        ORDER BY schema_name
    LOOP
        BEGIN
            -- Try to grant permissions
            EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            EXECUTE format('GRANT ALL ON ALL FUNCTIONS IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
            RAISE NOTICE '✓ Granted permissions on schema %', r.schema_name;
            success_count := success_count + 1;
        EXCEPTION
            WHEN insufficient_privilege THEN
                RAISE NOTICE '⚠ Cannot grant permissions on schema % (insufficient privileges)', r.schema_name;
            WHEN OTHERS THEN
                RAISE NOTICE '⚠ Error granting permissions on schema %: %', r.schema_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Granted permissions on % schemas', success_count;
END $$;

-- 4. Final verification
DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '==========================================';
    RAISE NOTICE 'FINAL VERIFICATION';
    RAISE NOTICE '==========================================';
END $$;

-- Show tables that still have RLS enabled
WITH rls_status AS (
    SELECT 
        t.schemaname,
        t.tablename,
        t.tableowner,
        t.rowsecurity,
        CASE 
            WHEN t.tableowner = current_user THEN 'You own this'
            ELSE 'Owned by: ' || t.tableowner
        END as ownership_status
    FROM pg_tables t
    WHERE t.rowsecurity = true
    ORDER BY 
        CASE WHEN t.tableowner = current_user THEN 0 ELSE 1 END,
        t.schemaname, 
        t.tablename
)
SELECT 
    schemaname || '.' || tablename as "Table",
    ownership_status as "Status",
    'RLS Still Enabled' as "RLS Status"
FROM rls_status;

-- Summary count
SELECT 
    COUNT(*) FILTER (WHERE tableowner = current_user) as "Your Tables with RLS",
    COUNT(*) FILTER (WHERE tableowner != current_user) as "System Tables with RLS",
    COUNT(*) as "Total Tables with RLS"
FROM pg_tables
WHERE rowsecurity = true;

-- Show which schemas you have access to
SELECT 
    schema_name as "Schema",
    has_schema_privilege(current_user, schema_name, 'USAGE') as "You Have Access",
    has_schema_privilege('anon', schema_name, 'USAGE') as "Anon Has Access",
    has_schema_privilege('authenticated', schema_name, 'USAGE') as "Authenticated Has Access"
FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
AND schema_name NOT LIKE 'pg_temp_%'
ORDER BY schema_name;