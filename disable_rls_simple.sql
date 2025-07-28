-- Simple script to disable ALL Row Level Security
-- Run this in Supabase SQL Editor or any PostgreSQL client

-- 1. Disable RLS on all tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename 
        FROM pg_tables 
        WHERE rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE %I.%I DISABLE ROW LEVEL SECURITY', r.schemaname, r.tablename);
        RAISE NOTICE 'Disabled RLS on %.%', r.schemaname, r.tablename;
    END LOOP;
END $$;

-- 2. Drop all policies
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
        RAISE NOTICE 'Dropped policy % on %.%', r.policyname, r.schemaname, r.tablename;
    END LOOP;
END $$;

-- 3. Grant access to all schemas and tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT schema_name 
        FROM information_schema.schemata 
        WHERE schema_name NOT LIKE 'pg_%' 
        AND schema_name != 'information_schema'
    LOOP
        EXECUTE format('GRANT USAGE ON SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
        EXECUTE format('GRANT ALL ON ALL TABLES IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
        EXECUTE format('GRANT ALL ON ALL SEQUENCES IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
        EXECUTE format('GRANT ALL ON ALL FUNCTIONS IN SCHEMA %I TO anon, authenticated, service_role', r.schema_name);
    END LOOP;
END $$;

-- 4. Show results
SELECT 
    'Tables with RLS still enabled:' as status,
    COUNT(*) as count 
FROM pg_tables 
WHERE rowsecurity = true;

SELECT 
    schemaname || '.' || tablename as table_name,
    'RLS STILL ENABLED' as status
FROM pg_tables 
WHERE rowsecurity = true
ORDER BY schemaname, tablename;