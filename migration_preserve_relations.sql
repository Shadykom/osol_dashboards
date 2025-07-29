-- MIGRATION SCRIPT WITH RELATIONSHIP PRESERVATION
-- This script moves tables while preserving all foreign key relationships

BEGIN;

-- Create target schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- STEP 1: First, let's see what foreign key relationships exist
\echo 'Checking existing foreign key relationships...'
SELECT 
    conname as "Constraint Name",
    conrelid::regclass as "Table",
    confrelid::regclass as "References Table"
FROM pg_constraint
WHERE contype = 'f'
  AND (connamespace IN (
    SELECT oid FROM pg_namespace 
    WHERE nspname IN ('public', 'kastle_collection', 'kastle_banking')
  ))
ORDER BY conrelid::regclass::text;

-- STEP 2: Move tables that don't have duplicates first
\echo ''
\echo 'Moving non-duplicate tables...'

-- Move tables that only exist in kastle_collection or public (not in kastle_banking)
DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- First, move collection_interactions (exists in kastle_collection and public, but NOT in kastle_banking)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_interactions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'collection_interactions') THEN
            -- Drop the public version first
            DROP TABLE IF EXISTS public.collection_interactions CASCADE;
            -- Move from kastle_collection
            ALTER TABLE kastle_collection.collection_interactions SET SCHEMA kastle_banking;
            RAISE NOTICE 'Moved collection_interactions to kastle_banking';
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collection_interactions') THEN
            ALTER TABLE public.collection_interactions SET SCHEMA kastle_banking;
            RAISE NOTICE 'Moved collection_interactions to kastle_banking';
        END IF;
    END IF;
    
    -- Move officer_performance_summary (exists in kastle_collection and public, but NOT in kastle_banking)
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'officer_performance_summary') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'officer_performance_summary') THEN
            -- Drop the public version first
            DROP TABLE IF EXISTS public.officer_performance_summary CASCADE;
            -- Move from kastle_collection
            ALTER TABLE kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;
            RAISE NOTICE 'Moved officer_performance_summary to kastle_banking';
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'officer_performance_summary') THEN
            ALTER TABLE public.officer_performance_summary SET SCHEMA kastle_banking;
            RAISE NOTICE 'Moved officer_performance_summary to kastle_banking';
        END IF;
    END IF;
END $$;

-- STEP 3: Handle duplicate tables
\echo ''
\echo 'Handling duplicate tables...'

-- For tables that exist in multiple schemas including kastle_banking,
-- we need to check if they have the same structure and relationships
DO $$
DECLARE
    dup_tables TEXT[] := ARRAY['collection_officers', 'promise_to_pay', 'collection_cases', 
                               'customers', 'collection_teams', 'officer_performance_metrics'];
    tbl TEXT;
BEGIN
    FOREACH tbl IN ARRAY dup_tables
    LOOP
        -- Check if table exists in kastle_banking
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = tbl) THEN
            -- Drop from other schemas
            EXECUTE format('DROP TABLE IF EXISTS public.%I CASCADE', tbl);
            EXECUTE format('DROP TABLE IF EXISTS kastle_collection.%I CASCADE', tbl);
            RAISE NOTICE 'Kept %.% and dropped duplicates from other schemas', 'kastle_banking', tbl;
        END IF;
    END LOOP;
END $$;

-- STEP 4: Move any remaining tables from public and kastle_collection
\echo ''
\echo 'Moving any remaining tables...'

DO $$
DECLARE
    table_record RECORD;
BEGIN
    -- Move remaining tables from public
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns', 'raster_columns', 'raster_overviews')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = table_record.table_name) THEN
            EXECUTE format('ALTER TABLE public.%I SET SCHEMA kastle_banking', table_record.table_name);
            RAISE NOTICE 'Moved public.% to kastle_banking', table_record.table_name;
        END IF;
    END LOOP;
    
    -- Move remaining tables from kastle_collection
    FOR table_record IN 
        SELECT table_name 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
          AND table_type = 'BASE TABLE'
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = table_record.table_name) THEN
            EXECUTE format('ALTER TABLE kastle_collection.%I SET SCHEMA kastle_banking', table_record.table_name);
            RAISE NOTICE 'Moved kastle_collection.% to kastle_banking', table_record.table_name;
        END IF;
    END LOOP;
END $$;

-- STEP 5: Update search_path to include kastle_banking
ALTER DATABASE postgres SET search_path TO kastle_banking, public;

-- STEP 6: Show final results
\echo ''
\echo 'Migration Complete!'
\echo ''

-- Show schema summary
SELECT 
    table_schema as "Schema",
    COUNT(*) as "Table Count"
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- Show all tables in kastle_banking
\echo ''
\echo 'Tables now in kastle_banking:'
SELECT 
    table_name as "Table Name"
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
  AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- Show foreign key relationships in kastle_banking
\echo ''
\echo 'Foreign key relationships in kastle_banking:'
SELECT 
    conname as "Constraint Name",
    conrelid::regclass as "Table",
    confrelid::regclass as "References Table"
FROM pg_constraint
WHERE contype = 'f'
  AND connamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'kastle_banking')
ORDER BY conrelid::regclass::text;

COMMIT;