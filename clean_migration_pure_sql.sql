-- CLEAN MIGRATION - PURE SQL VERSION
-- This script migrates all tables to kastle_banking schema

BEGIN;

-- Create target schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- STEP 1: Handle duplicate tables by dropping them from source schemas
-- (keeping only kastle_banking versions)

-- Drop duplicates that exist in kastle_banking
DROP TABLE IF EXISTS public.collection_officers CASCADE;
DROP TABLE IF EXISTS kastle_collection.collection_officers CASCADE;
DROP TABLE IF EXISTS public.promise_to_pay CASCADE;
DROP TABLE IF EXISTS kastle_collection.promise_to_pay CASCADE;
DROP TABLE IF EXISTS public.collection_cases CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS kastle_collection.collection_teams CASCADE;
DROP TABLE IF EXISTS kastle_collection.officer_performance_metrics CASCADE;

-- STEP 2: Move tables that don't exist in kastle_banking yet
DO $$
BEGIN
    -- Move collection_interactions (prefer kastle_collection version)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_interactions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'collection_interactions') THEN
            DROP TABLE IF EXISTS public.collection_interactions CASCADE;
            ALTER TABLE kastle_collection.collection_interactions SET SCHEMA kastle_banking;
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collection_interactions') THEN
            ALTER TABLE public.collection_interactions SET SCHEMA kastle_banking;
        END IF;
    END IF;
    
    -- Move officer_performance_summary (prefer kastle_collection version)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'officer_performance_summary') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'officer_performance_summary') THEN
            DROP TABLE IF EXISTS public.officer_performance_summary CASCADE;
            ALTER TABLE kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'officer_performance_summary') THEN
            ALTER TABLE public.officer_performance_summary SET SCHEMA kastle_banking;
        END IF;
    END IF;
END $$;

-- STEP 3: Move any remaining tables from public and kastle_collection
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Move all remaining tables from public
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns', 'raster_columns', 'raster_overviews')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = table_record.table_name) THEN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA kastle_banking', table_record.table_name);
        END IF;
    END LOOP;
    
    -- Move all remaining tables from kastle_collection
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
          AND table_type = 'BASE TABLE'
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = table_record.table_name) THEN
            EXECUTE format('ALTER TABLE kastle_collection.%I SET SCHEMA kastle_banking', table_record.table_name);
        END IF;
    END LOOP;
END $$;

-- STEP 4: Update database search path
ALTER DATABASE postgres SET search_path TO kastle_banking, public;

-- STEP 5: Show results
SELECT 'MIGRATION COMPLETE - SUMMARY:' as status;

SELECT 
    table_schema as "Schema",
    COUNT(*) as "Table Count"
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- Show all tables in kastle_banking
SELECT '' as blank;
SELECT 'TABLES IN KASTLE_BANKING:' as info;

SELECT 
    table_name as "Table Name"
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

COMMIT;