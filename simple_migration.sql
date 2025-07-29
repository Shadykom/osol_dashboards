-- Simple Migration Script
-- Run this script to move all tables to kastle_banking schema
-- Usage: psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f simple_migration.sql

-- Create target schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Generate and execute ALTER TABLE commands
DO $$
DECLARE
    cmd text;
BEGIN
    -- Generate commands for public schema tables
    FOR cmd IN 
        SELECT 'ALTER TABLE public.' || quote_ident(table_name) || ' SET SCHEMA kastle_banking;'
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns', 'raster_columns', 'raster_overviews')
    LOOP
        RAISE NOTICE 'Executing: %', cmd;
        EXECUTE cmd;
    END LOOP;

    -- Generate commands for kastle_collection schema tables
    FOR cmd IN 
        SELECT 'ALTER TABLE kastle_collection.' || quote_ident(table_name) || ' SET SCHEMA kastle_banking;'
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
          AND table_type = 'BASE TABLE'
    LOOP
        RAISE NOTICE 'Executing: %', cmd;
        EXECUTE cmd;
    END LOOP;
END $$;

-- Show results
SELECT 'Migration complete!' as status;

SELECT 
    table_schema as schema,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;