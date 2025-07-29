-- Safe Migration Script with Duplicate Checking
-- This script safely moves tables, checking for existing tables in the target schema

BEGIN;

-- Create target schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Function to safely move tables
DO $$
DECLARE
    table_record RECORD;
    move_count INTEGER := 0;
    skip_count INTEGER := 0;
    target_exists BOOLEAN;
BEGIN
    RAISE NOTICE '=== Starting Safe Schema Migration ===';
    RAISE NOTICE '';
    
    -- Process tables from public schema
    RAISE NOTICE 'Processing tables from PUBLIC schema...';
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns', 'raster_columns', 'raster_overviews')
        ORDER BY table_name
    LOOP
        -- Check if table already exists in target schema
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'kastle_banking' 
              AND table_name = table_record.table_name
        ) INTO target_exists;
        
        IF target_exists THEN
            RAISE NOTICE '  ⚠️  SKIP: Table "%" already exists in kastle_banking', table_record.table_name;
            skip_count := skip_count + 1;
        ELSE
            BEGIN
                EXECUTE format('ALTER TABLE public.%I SET SCHEMA kastle_banking', table_record.table_name);
                RAISE NOTICE '  ✓ MOVED: public.% → kastle_banking.%', table_record.table_name, table_record.table_name;
                move_count := move_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING '  ✗ ERROR moving public.%: %', table_record.table_name, SQLERRM;
            END;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    
    -- Process tables from kastle_collection schema
    RAISE NOTICE 'Processing tables from KASTLE_COLLECTION schema...';
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
          AND table_type = 'BASE TABLE'
        ORDER BY table_name
    LOOP
        -- Check if table already exists in target schema
        SELECT EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'kastle_banking' 
              AND table_name = table_record.table_name
        ) INTO target_exists;
        
        IF target_exists THEN
            RAISE NOTICE '  ⚠️  SKIP: Table "%" already exists in kastle_banking', table_record.table_name;
            skip_count := skip_count + 1;
        ELSE
            BEGIN
                EXECUTE format('ALTER TABLE kastle_collection.%I SET SCHEMA kastle_banking', table_record.table_name);
                RAISE NOTICE '  ✓ MOVED: kastle_collection.% → kastle_banking.%', table_record.table_name, table_record.table_name;
                move_count := move_count + 1;
            EXCEPTION WHEN OTHERS THEN
                RAISE WARNING '  ✗ ERROR moving kastle_collection.%: %', table_record.table_name, SQLERRM;
            END;
        END IF;
    END LOOP;

    RAISE NOTICE '';
    RAISE NOTICE '=== Migration Summary ===';
    RAISE NOTICE '  Tables moved: %', move_count;
    RAISE NOTICE '  Tables skipped (already exist): %', skip_count;
    RAISE NOTICE '';
END $$;

-- Show detailed results
RAISE NOTICE 'Final schema state:';

SELECT 
    table_schema as "Schema",
    COUNT(*) as "Table Count"
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- List all tables in kastle_banking
SELECT 
    '' as empty_line;
    
SELECT 
    'Tables in kastle_banking schema:' as info;

SELECT 
    table_name as "Table Name"
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

COMMIT;