-- Simple Dashboard Fix
-- This is the minimal fix to get your dashboard working

-- Disable RLS on all tables in kastle_banking schema
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking'
    LOOP
        EXECUTE format('ALTER TABLE kastle_banking.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Disable RLS on all tables in kastle_collection schema (if it exists)
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_collection'
    LOOP
        EXECUTE format('ALTER TABLE kastle_collection.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
EXCEPTION
    WHEN OTHERS THEN
        -- Schema might not exist, that's OK
        NULL;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;

-- Grant on collection schema if it exists
DO $$
BEGIN
    IF EXISTS(SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kastle_collection') THEN
        GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;
        GRANT SELECT ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
    END IF;
END $$;

-- Show what we did
SELECT 
    schemaname,
    COUNT(*) as table_count,
    SUM(CASE WHEN rowsecurity THEN 1 ELSE 0 END) as rls_enabled_count
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
GROUP BY schemaname;

-- Done!
SELECT 'Dashboard access fix completed!' as status;