-- Disable Row Level Security for Testing
-- WARNING: Only use this for testing! Re-enable RLS for production!

-- Connect to the database using:
-- psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres"

-- Disable RLS on kastle_banking schema tables
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
        RAISE NOTICE 'Disabled RLS on kastle_banking.%', r.tablename;
    END LOOP;
END $$;

-- Disable RLS on kastle_collection schema tables
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
        RAISE NOTICE 'Disabled RLS on kastle_collection.%', r.tablename;
    END LOOP;
END $$;

-- Disable RLS on public schema tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        EXECUTE format('ALTER TABLE public.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Disabled RLS on public.%', r.tablename;
    END LOOP;
END $$;

-- Grant necessary permissions to anon role
GRANT USAGE ON SCHEMA kastle_banking TO anon;
GRANT USAGE ON SCHEMA kastle_collection TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_collection TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO anon;

-- Grant sequence permissions
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon;

-- Verify RLS status
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname IN ('kastle_banking', 'kastle_collection', 'public')
ORDER BY schemaname, tablename;