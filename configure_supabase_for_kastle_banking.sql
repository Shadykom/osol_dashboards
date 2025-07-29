-- CONFIGURE SUPABASE FOR KASTLE_BANKING SCHEMA
-- This script sets up all necessary configurations for Supabase to work with kastle_banking

BEGIN;

-- ================================================
-- STEP 1: SCHEMA PERMISSIONS
-- ================================================

-- Grant schema usage to Supabase roles
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role, postgres;

-- Grant table permissions
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO postgres;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO service_role;

-- Grant sequence permissions
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO postgres;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO service_role;

-- Grant function permissions
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA kastle_banking TO anon, authenticated, service_role;

-- Set default privileges for future objects
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT SELECT ON TABLES TO anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT ALL ON TABLES TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT USAGE ON SEQUENCES TO authenticated, anon;
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
    GRANT EXECUTE ON FUNCTIONS TO anon, authenticated, service_role;

-- ================================================
-- STEP 2: UPDATE SEARCH PATH
-- ================================================

-- Set search path for the database
ALTER DATABASE postgres SET search_path TO kastle_banking, public, extensions;

-- Set search path for specific roles
ALTER ROLE anon SET search_path TO kastle_banking, public, extensions;
ALTER ROLE authenticated SET search_path TO kastle_banking, public, extensions;
ALTER ROLE service_role SET search_path TO kastle_banking, public, extensions;
ALTER ROLE postgres SET search_path TO kastle_banking, public, extensions;

-- ================================================
-- STEP 3: EXPOSE SCHEMA TO POSTGREST
-- ================================================

-- Update PostgREST configuration
-- Note: You may need to update your Supabase project settings to include kastle_banking in exposed schemas

-- Create a configuration table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.supabase_config (
    key TEXT PRIMARY KEY,
    value TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert schema exposure configuration
INSERT INTO kastle_banking.supabase_config (key, value) 
VALUES ('exposed_schemas', 'kastle_banking')
ON CONFLICT (key) 
DO UPDATE SET value = EXCLUDED.value, updated_at = NOW();

-- ================================================
-- STEP 4: UPDATE RLS POLICIES
-- ================================================

-- Enable RLS on all tables in kastle_banking
DO $$
DECLARE
    tbl RECORD;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking'
    LOOP
        EXECUTE format('ALTER TABLE kastle_banking.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
        RAISE NOTICE 'Enabled RLS on kastle_banking.%', tbl.tablename;
    END LOOP;
END $$;

-- ================================================
-- STEP 5: CREATE HELPER FUNCTIONS
-- ================================================

-- Function to check current user
CREATE OR REPLACE FUNCTION kastle_banking.current_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN auth.uid();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has role
CREATE OR REPLACE FUNCTION kastle_banking.user_has_role(role_name TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN auth.jwt() ->> 'role' = role_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- STEP 6: CREATE SAMPLE RLS POLICIES
-- ================================================

-- Example RLS policies for common tables
-- Adjust these based on your actual requirements

-- For customers table (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'kastle_banking' AND tablename = 'customers') THEN
        -- Policy for authenticated users to see their own data
        CREATE POLICY "Users can view own customer data" 
            ON kastle_banking.customers 
            FOR SELECT 
            TO authenticated 
            USING (auth.uid() = user_id OR auth.jwt() ->> 'role' = 'service_role');
            
        -- Policy for service role to manage all data
        CREATE POLICY "Service role has full access" 
            ON kastle_banking.customers 
            FOR ALL 
            TO service_role 
            USING (true) 
            WITH CHECK (true);
    END IF;
END $$;

-- ================================================
-- STEP 7: VERIFICATION
-- ================================================

-- Check schema permissions
SELECT '' as blank;
SELECT 'SCHEMA PERMISSIONS:' as info;

SELECT 
    nspname as schema_name,
    rolname as role_name,
    has_schema_privilege(rolname, nspname, 'USAGE') as has_usage,
    has_schema_privilege(rolname, nspname, 'CREATE') as has_create
FROM pg_namespace
CROSS JOIN pg_roles
WHERE nspname = 'kastle_banking'
  AND rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
ORDER BY rolname;

-- Check search paths
SELECT '' as blank;
SELECT 'SEARCH PATHS:' as info;

SELECT 
    rolname as role_name,
    rolconfig as config
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'postgres')
  AND rolconfig IS NOT NULL;

-- Check RLS status
SELECT '' as blank;
SELECT 'RLS STATUS:' as info;

SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'kastle_banking'
ORDER BY tablename;

COMMIT;

-- ================================================
-- POST-MIGRATION STEPS
-- ================================================
-- 1. Update your Supabase project settings:
--    - Go to Settings > API
--    - Add 'kastle_banking' to the exposed schemas
--
-- 2. Update your client code:
--    - Change schema in Supabase client initialization
--    - Update RPC calls to use kastle_banking.function_name
--
-- 3. Update any Edge Functions that reference the old schemas
--
-- 4. Test all API endpoints to ensure they work correctly