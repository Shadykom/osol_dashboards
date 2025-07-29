-- Schema Migration Script
-- Move all tables from public and kastle_collection schemas to kastle_banking schema

BEGIN;

-- Create kastle_banking schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Function to generate ALTER TABLE statements
DO $$
DECLARE
    table_record RECORD;
    move_count INTEGER := 0;
BEGIN
    -- Move tables from public schema
    RAISE NOTICE 'Moving tables from public schema...';
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns', 'raster_columns', 'raster_overviews')
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA kastle_banking', table_record.table_name);
            RAISE NOTICE 'Moved public.% to kastle_banking.%', table_record.table_name, table_record.table_name;
            move_count := move_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to move public.%: %', table_record.table_name, SQLERRM;
        END;
    END LOOP;

    -- Move tables from kastle_collection schema
    RAISE NOTICE 'Moving tables from kastle_collection schema...';
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
          AND table_type = 'BASE TABLE'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE kastle_collection.%I SET SCHEMA kastle_banking', table_record.table_name);
            RAISE NOTICE 'Moved kastle_collection.% to kastle_banking.%', table_record.table_name, table_record.table_name;
            move_count := move_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to move kastle_collection.%: %', table_record.table_name, SQLERRM;
        END;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE 'Migration complete. Total tables moved: %', move_count;
END $$;

-- Display final state
SELECT 
    'Tables in kastle_banking schema:' as info;

SELECT 
    table_name,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables
WHERE schemaname = 'kastle_banking'
ORDER BY table_name;

-- Summary of all schemas
SELECT 
    '' as empty_line;

SELECT 
    'Schema summary:' as info;

SELECT 
    table_schema,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

COMMIT;