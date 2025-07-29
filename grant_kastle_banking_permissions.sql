-- Grant permissions for direct kastle_banking schema access
-- This script ensures all necessary permissions are in place

-- 1. Grant schema usage permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;

-- 2. Grant SELECT permissions on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;

-- 3. Grant INSERT, UPDATE, DELETE permissions for authenticated users
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;

-- 4. Grant permissions on all sequences (for auto-increment fields)
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- 5. Set default privileges for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
GRANT SELECT ON TABLES TO anon, authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
GRANT USAGE, SELECT ON SEQUENCES TO authenticated;

-- 6. Verify permissions are granted
DO $$
DECLARE
    r RECORD;
    missing_permissions TEXT := '';
BEGIN
    -- Check each table
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking'
    LOOP
        -- Check anon SELECT permission
        IF NOT has_table_privilege('anon', 'kastle_banking.' || r.tablename, 'SELECT') THEN
            missing_permissions := missing_permissions || 'Missing SELECT for anon on ' || r.tablename || E'\n';
        END IF;
        
        -- Check authenticated permissions
        IF NOT has_table_privilege('authenticated', 'kastle_banking.' || r.tablename, 'SELECT') THEN
            missing_permissions := missing_permissions || 'Missing SELECT for authenticated on ' || r.tablename || E'\n';
        END IF;
    END LOOP;
    
    IF missing_permissions = '' THEN
        RAISE NOTICE 'All permissions granted successfully!';
    ELSE
        RAISE WARNING 'Missing permissions detected: %', missing_permissions;
    END IF;
END $$;

-- 7. Test queries to verify access
-- These should all work without errors after permissions are granted
SELECT 'Testing kastle_banking.collection_officers' as test, COUNT(*) as count 
FROM kastle_banking.collection_officers;

SELECT 'Testing kastle_banking.customers' as test, COUNT(*) as count 
FROM kastle_banking.customers;

SELECT 'Testing kastle_banking.loan_accounts' as test, COUNT(*) as count 
FROM kastle_banking.loan_accounts;

-- 8. Show current schema search path
SHOW search_path;

-- 9. List all tables in kastle_banking with their permissions
SELECT 
    schemaname,
    tablename,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_can_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as auth_can_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'INSERT') as auth_can_insert,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'UPDATE') as auth_can_update,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'DELETE') as auth_can_delete
FROM pg_tables 
WHERE schemaname = 'kastle_banking'
ORDER BY tablename;