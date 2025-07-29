-- MIGRATE VIEWS TO KASTLE_BANKING SCHEMA
-- This script migrates all views from public and kastle_collection to kastle_banking

BEGIN;

-- STEP 1: Check existing views in all schemas
SELECT 'EXISTING VIEWS BY SCHEMA:' as info;

SELECT 
    table_schema as "Schema",
    COUNT(*) as "View Count",
    string_agg(table_name, ', ' ORDER BY table_name) as "View Names"
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY table_schema
ORDER BY table_schema;

-- STEP 2: Get view definitions before migration (for backup/reference)
SELECT '' as blank;
SELECT 'VIEW DEFINITIONS FOR BACKUP:' as info;

SELECT 
    table_schema || '.' || table_name as "View",
    view_definition as "Definition"
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection')
ORDER BY table_schema, table_name;

-- STEP 3: Migrate views
DO $$
DECLARE
    view_record RECORD;
    view_def TEXT;
    new_view_def TEXT;
    view_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Process views from public schema
    FOR view_record IN 
        SELECT table_name, view_definition
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name
    LOOP
        BEGIN
            -- Get the full view definition
            SELECT pg_get_viewdef(('public.' || view_record.table_name)::regclass, true) INTO view_def;
            
            -- Replace schema references in the view definition
            new_view_def := view_def;
            new_view_def := regexp_replace(new_view_def, '\mpublic\.', 'kastle_banking.', 'g');
            new_view_def := regexp_replace(new_view_def, '\mkastle_collection\.', 'kastle_banking.', 'g');
            
            -- Create the view in kastle_banking
            EXECUTE format('CREATE OR REPLACE VIEW kastle_banking.%I AS %s', view_record.table_name, new_view_def);
            
            -- Drop the old view
            EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_record.table_name);
            
            RAISE NOTICE 'Migrated view: public.% to kastle_banking.%', view_record.table_name, view_record.table_name;
            view_count := view_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to migrate view public.%: %', view_record.table_name, SQLERRM;
            error_count := error_count + 1;
        END;
    END LOOP;
    
    -- Process views from kastle_collection schema
    FOR view_record IN 
        SELECT table_name, view_definition
        FROM information_schema.views
        WHERE table_schema = 'kastle_collection'
        ORDER BY table_name
    LOOP
        BEGIN
            -- Get the full view definition
            SELECT pg_get_viewdef(('kastle_collection.' || view_record.table_name)::regclass, true) INTO view_def;
            
            -- Replace schema references in the view definition
            new_view_def := view_def;
            new_view_def := regexp_replace(new_view_def, '\mpublic\.', 'kastle_banking.', 'g');
            new_view_def := regexp_replace(new_view_def, '\mkastle_collection\.', 'kastle_banking.', 'g');
            
            -- Create the view in kastle_banking
            EXECUTE format('CREATE OR REPLACE VIEW kastle_banking.%I AS %s', view_record.table_name, new_view_def);
            
            -- Drop the old view
            EXECUTE format('DROP VIEW IF EXISTS kastle_collection.%I CASCADE', view_record.table_name);
            
            RAISE NOTICE 'Migrated view: kastle_collection.% to kastle_banking.%', view_record.table_name, view_record.table_name;
            view_count := view_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to migrate view kastle_collection.%: %', view_record.table_name, SQLERRM;
            error_count := error_count + 1;
        END;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'View Migration Summary:';
    RAISE NOTICE '  Views migrated: %', view_count;
    RAISE NOTICE '  Errors: %', error_count;
END $$;

-- STEP 4: Handle duplicate views (if any exist in multiple schemas)
-- Check for views with same name in kastle_banking that might have been created
DO $$
DECLARE
    view_record RECORD;
BEGIN
    FOR view_record IN
        WITH duplicate_views AS (
            SELECT table_name
            FROM information_schema.views
            WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
            GROUP BY table_name
            HAVING COUNT(DISTINCT table_schema) > 1
        )
        SELECT 
            v.table_schema,
            v.table_name
        FROM information_schema.views v
        JOIN duplicate_views d ON v.table_name = d.table_name
        WHERE v.table_schema IN ('public', 'kastle_collection')
    LOOP
        -- Drop duplicates from source schemas
        EXECUTE format('DROP VIEW IF EXISTS %I.%I CASCADE', view_record.table_schema, view_record.table_name);
        RAISE NOTICE 'Dropped duplicate view: %.%', view_record.table_schema, view_record.table_name;
    END LOOP;
END $$;

-- STEP 5: Show final results
SELECT '' as blank;
SELECT 'MIGRATION COMPLETE - FINAL VIEW COUNT:' as status;

SELECT 
    table_schema as "Schema",
    COUNT(*) as "View Count"
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY table_schema
ORDER BY table_schema;

-- List all views in kastle_banking
SELECT '' as blank;
SELECT 'VIEWS IN KASTLE_BANKING:' as info;

SELECT 
    table_name as "View Name",
    LEFT(view_definition, 100) || '...' as "Definition Preview"
FROM information_schema.views
WHERE table_schema = 'kastle_banking'
ORDER BY table_name;

COMMIT;