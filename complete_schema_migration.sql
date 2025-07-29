-- COMPLETE SCHEMA MIGRATION TO KASTLE_BANKING
-- This script migrates tables, views, functions, and other objects

BEGIN;

-- Create target schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- ================================================
-- STEP 1: MIGRATE TABLES
-- ================================================
SELECT 'STEP 1: MIGRATING TABLES' as step_info;

-- Drop duplicate tables from source schemas
DROP TABLE IF EXISTS public.collection_officers CASCADE;
DROP TABLE IF EXISTS kastle_collection.collection_officers CASCADE;
DROP TABLE IF EXISTS public.promise_to_pay CASCADE;
DROP TABLE IF EXISTS kastle_collection.promise_to_pay CASCADE;
DROP TABLE IF EXISTS public.collection_cases CASCADE;
DROP TABLE IF EXISTS public.customers CASCADE;
DROP TABLE IF EXISTS kastle_collection.collection_teams CASCADE;
DROP TABLE IF EXISTS kastle_collection.officer_performance_metrics CASCADE;

-- Move unique tables
DO $$
DECLARE
    table_record RECORD;
    moved_count INTEGER := 0;
BEGIN
    -- Move collection_interactions
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_interactions') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'collection_interactions') THEN
            DROP TABLE IF EXISTS public.collection_interactions CASCADE;
            ALTER TABLE kastle_collection.collection_interactions SET SCHEMA kastle_banking;
            moved_count := moved_count + 1;
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'collection_interactions') THEN
            ALTER TABLE public.collection_interactions SET SCHEMA kastle_banking;
            moved_count := moved_count + 1;
        END IF;
    END IF;
    
    -- Move officer_performance_summary
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'officer_performance_summary') THEN
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_collection' AND table_name = 'officer_performance_summary') THEN
            DROP TABLE IF EXISTS public.officer_performance_summary CASCADE;
            ALTER TABLE kastle_collection.officer_performance_summary SET SCHEMA kastle_banking;
            moved_count := moved_count + 1;
        ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'officer_performance_summary') THEN
            ALTER TABLE public.officer_performance_summary SET SCHEMA kastle_banking;
            moved_count := moved_count + 1;
        END IF;
    END IF;
    
    -- Move all remaining tables
    FOR table_record IN 
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_schema IN ('public', 'kastle_collection')
          AND table_type = 'BASE TABLE'
          AND table_name NOT IN ('spatial_ref_sys', 'geometry_columns', 'geography_columns', 'raster_columns', 'raster_overviews')
    LOOP
        IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = table_record.table_name) THEN
            EXECUTE format('ALTER TABLE %I.%I SET SCHEMA kastle_banking', table_record.table_schema, table_record.table_name);
            moved_count := moved_count + 1;
        END IF;
    END LOOP;
    
    RAISE NOTICE 'Tables moved: %', moved_count;
END $$;

-- ================================================
-- STEP 2: MIGRATE VIEWS
-- ================================================
SELECT '' as blank;
SELECT 'STEP 2: MIGRATING VIEWS' as step_info;

DO $$
DECLARE
    view_record RECORD;
    view_def TEXT;
    new_view_def TEXT;
    view_count INTEGER := 0;
BEGIN
    -- Get all views from source schemas
    FOR view_record IN 
        SELECT table_schema, table_name
        FROM information_schema.views
        WHERE table_schema IN ('public', 'kastle_collection')
        ORDER BY table_schema, table_name
    LOOP
        BEGIN
            -- Get the full view definition
            SELECT pg_get_viewdef((view_record.table_schema || '.' || view_record.table_name)::regclass, true) INTO view_def;
            
            -- Replace schema references
            new_view_def := view_def;
            new_view_def := regexp_replace(new_view_def, '\mpublic\.', 'kastle_banking.', 'g');
            new_view_def := regexp_replace(new_view_def, '\mkastle_collection\.', 'kastle_banking.', 'g');
            
            -- Create view in kastle_banking
            EXECUTE format('CREATE OR REPLACE VIEW kastle_banking.%I AS %s', view_record.table_name, new_view_def);
            
            -- Drop old view
            EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.table_schema, view_record.table_name);
            
            view_count := view_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to migrate view %.%: %', view_record.table_schema, view_record.table_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Views migrated: %', view_count;
END $$;

-- ================================================
-- STEP 3: MIGRATE FUNCTIONS
-- ================================================
SELECT '' as blank;
SELECT 'STEP 3: MIGRATING FUNCTIONS' as step_info;

DO $$
DECLARE
    func_record RECORD;
    func_count INTEGER := 0;
    func_def TEXT;
    new_func_def TEXT;
BEGIN
    FOR func_record IN
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            pg_get_function_identity_arguments(p.oid) as arguments,
            pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname IN ('public', 'kastle_collection')
          AND p.prokind = 'f'  -- Only functions, not procedures
    LOOP
        BEGIN
            -- Get function definition and replace schema references
            new_func_def := func_record.definition;
            new_func_def := regexp_replace(new_func_def, '\mpublic\.', 'kastle_banking.', 'g');
            new_func_def := regexp_replace(new_func_def, '\mkastle_collection\.', 'kastle_banking.', 'g');
            new_func_def := regexp_replace(new_func_def, 'FUNCTION ' || func_record.schema_name || '\.', 'FUNCTION kastle_banking.', 'g');
            
            -- Create function in kastle_banking
            EXECUTE new_func_def;
            
            -- Drop old function
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                          func_record.schema_name, 
                          func_record.function_name, 
                          func_record.arguments);
            
            func_count := func_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to migrate function %.%: %', func_record.schema_name, func_record.function_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Functions migrated: %', func_count;
END $$;

-- ================================================
-- STEP 4: MIGRATE SEQUENCES
-- ================================================
SELECT '' as blank;
SELECT 'STEP 4: MIGRATING SEQUENCES' as step_info;

DO $$
DECLARE
    seq_record RECORD;
    seq_count INTEGER := 0;
BEGIN
    FOR seq_record IN
        SELECT 
            sequence_schema,
            sequence_name
        FROM information_schema.sequences
        WHERE sequence_schema IN ('public', 'kastle_collection')
    LOOP
        BEGIN
            EXECUTE format('ALTER SEQUENCE %I.%I SET SCHEMA kastle_banking', 
                          seq_record.sequence_schema, 
                          seq_record.sequence_name);
            seq_count := seq_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to migrate sequence %.%: %', seq_record.sequence_schema, seq_record.sequence_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Sequences migrated: %', seq_count;
END $$;

-- ================================================
-- STEP 5: UPDATE SEARCH PATH
-- ================================================
ALTER DATABASE postgres SET search_path TO kastle_banking, public;

-- ================================================
-- STEP 6: FINAL SUMMARY
-- ================================================
SELECT '' as blank;
SELECT 'MIGRATION COMPLETE - SUMMARY:' as status;

-- Tables summary
SELECT 
    'Tables' as object_type,
    table_schema as schema,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema

UNION ALL

-- Views summary
SELECT 
    'Views' as object_type,
    table_schema as schema,
    COUNT(*) as count
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY table_schema

UNION ALL

-- Functions summary
SELECT 
    'Functions' as object_type,
    n.nspname as schema,
    COUNT(*) as count
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'kastle_collection', 'kastle_banking')
  AND p.prokind = 'f'
GROUP BY n.nspname

UNION ALL

-- Sequences summary
SELECT 
    'Sequences' as object_type,
    sequence_schema as schema,
    COUNT(*) as count
FROM information_schema.sequences
WHERE sequence_schema IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY sequence_schema

ORDER BY object_type, schema;

COMMIT;