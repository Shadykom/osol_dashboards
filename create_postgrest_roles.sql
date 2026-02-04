-- Create PostgREST roles and permissions
-- This script sets up the necessary roles for PostgREST to function properly

-- 1. Create the authenticator role (used by PostgREST to connect)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticator') THEN
        CREATE ROLE authenticator NOINHERIT LOGIN PASSWORD 'your_secure_password_here';
        RAISE NOTICE 'Created role: authenticator';
    ELSE
        RAISE NOTICE 'Role authenticator already exists';
    END IF;
END $$;

-- 2. Create the anonymous role (for unauthenticated requests)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
        RAISE NOTICE 'Created role: web_anon';
    ELSE
        RAISE NOTICE 'Role web_anon already exists';
    END IF;
END $$;

-- 3. Create the authenticated role (for authenticated users)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
        RAISE NOTICE 'Created role: authenticated';
    ELSE
        RAISE NOTICE 'Role authenticated already exists';
    END IF;
END $$;

-- 4. Grant role memberships
GRANT web_anon TO authenticator;
GRANT authenticated TO authenticator;

-- 5. Grant schema usage permissions
GRANT USAGE ON SCHEMA kastle_banking TO web_anon, authenticated;
GRANT USAGE ON SCHEMA public TO web_anon, authenticated;

-- If kastle_collection schema exists, grant usage
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kastle_collection') THEN
        EXECUTE 'GRANT USAGE ON SCHEMA kastle_collection TO web_anon, authenticated';
        RAISE NOTICE 'Granted usage on kastle_collection schema';
    END IF;
END $$;

-- 6. Grant SELECT permissions on tables to web_anon (read-only access)
-- Core banking tables
GRANT SELECT ON kastle_banking.customers TO web_anon;
GRANT SELECT ON kastle_banking.customer_contacts TO web_anon;
GRANT SELECT ON kastle_banking.loan_accounts TO web_anon;
GRANT SELECT ON kastle_banking.loan_applications TO web_anon;
GRANT SELECT ON kastle_banking.products TO web_anon;
GRANT SELECT ON kastle_banking.collection_cases TO web_anon;
GRANT SELECT ON kastle_banking.collection_buckets TO web_anon;
GRANT SELECT ON kastle_banking.promise_to_pay TO web_anon;
GRANT SELECT ON kastle_banking.officer_performance_metrics TO web_anon;

-- Grant on any views we created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.views WHERE table_schema = 'kastle_banking' AND table_name = 'loan_accounts_api') THEN
        EXECUTE 'GRANT SELECT ON kastle_banking.loan_accounts_api TO web_anon';
    END IF;
END $$;

-- Collection-specific tables if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_teams') THEN
        EXECUTE 'GRANT SELECT ON kastle_banking.collection_teams TO web_anon';
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_officers') THEN
        EXECUTE 'GRANT SELECT ON kastle_banking.collection_officers TO web_anon';
    END IF;
END $$;

-- 7. Grant fuller permissions to authenticated role
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- 8. Grant execute permissions on functions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA kastle_banking TO web_anon, authenticated;

-- 9. Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT SELECT ON TABLES TO web_anon;
    
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
    
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT USAGE, SELECT ON SEQUENCES TO authenticated;
    
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT EXECUTE ON FUNCTIONS TO web_anon, authenticated;

-- 10. Verify roles were created
SELECT 
    rolname,
    rolsuper,
    rolinherit,
    rolcreaterole,
    rolcreatedb,
    rolcanlogin,
    rolreplication,
    rolbypassrls
FROM pg_roles 
WHERE rolname IN ('authenticator', 'web_anon', 'authenticated')
ORDER BY rolname;

-- 11. Show granted permissions summary
SELECT 
    'Table Permissions for web_anon' as description,
    COUNT(*) as count
FROM information_schema.table_privileges
WHERE grantee = 'web_anon'
UNION ALL
SELECT 
    'Table Permissions for authenticated' as description,
    COUNT(*) as count
FROM information_schema.table_privileges
WHERE grantee = 'authenticated';