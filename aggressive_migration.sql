-- AGGRESSIVE MIGRATION SCRIPT
-- This will DROP all duplicate tables and move everything to kastle_banking
-- Only use this if you don't care about preserving specific data!

BEGIN;

-- Create target schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- STEP 1: Drop all duplicate tables from public and kastle_collection
-- (keeping only the kastle_banking versions)
DROP TABLE IF EXISTS public.collection_officers CASCADE;
DROP TABLE IF EXISTS kastle_collection.collection_officers CASCADE;
DROP TABLE IF EXISTS public.promise_to_pay CASCADE;
DROP TABLE IF EXISTS kastle_collection.promise_to_pay CASCADE;
DROP TABLE IF EXISTS public.collection_cases CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS kastle_collection.collection_teams CASCADE;
DROP TABLE IF EXISTS kastle_collection.officer_performance_metrics CASCADE;

-- STEP 2: Move tables that don't exist in kastle_banking yet
-- First, check if they exist before moving
DO $$
BEGIN
    -- Move collection_interactions
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'collection_interactions') THEN
        ALTER TABLE kastle_collection.collection_interactions SET SCHEMA kastle_banking;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collection_interactions') THEN
        ALTER TABLE public.collection_interactions SET SCHEMA kastle_banking;
    END IF;
    
    -- Move officer_performance_summary
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'officer_performance_summary') THEN
        ALTER TABLE kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'officer_performance_summary') THEN
        ALTER TABLE public.officer_performance_summary SET SCHEMA kastle_banking;
    END IF;
END $$;

-- STEP 3: Move ALL remaining tables from public and kastle_collection to kastle_banking
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
        EXECUTE format('ALTER TABLE public.%I SET SCHEMA kastle_banking', table_record.table_name);
        RAISE NOTICE 'Moved public.% to kastle_banking', table_record.table_name;
    END LOOP;
    
    -- Move all remaining tables from kastle_collection
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
          AND table_type = 'BASE TABLE'
    LOOP
        EXECUTE format('ALTER TABLE kastle_collection.%I SET SCHEMA kastle_banking', table_record.table_name);
        RAISE NOTICE 'Moved kastle_collection.% to kastle_banking', table_record.table_name;
    END LOOP;
END $$;

-- STEP 4: Show final results
SELECT 
    'Migration Complete!' as status;

SELECT 
    table_schema as "Schema",
    COUNT(*) as "Table Count"
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- List all tables now in kastle_banking
SELECT 
    'Tables in kastle_banking:' as info;
    
SELECT 
    table_name as "Table Name"
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

COMMIT;