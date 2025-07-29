-- DROP ALL VIEWS IN PUBLIC SCHEMA
-- This script safely drops all views in the public schema

-- First, let's see what views exist in public schema
SELECT 'VIEWS TO BE DROPPED FROM PUBLIC SCHEMA:' as info;

SELECT 
    table_name as "View Name",
    view_definition as "Definition"
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Count of views to be dropped
SELECT '' as blank;
SELECT 'Total views in public schema: ' || COUNT(*) as count_info
FROM information_schema.views
WHERE table_schema = 'public';

-- Drop all views in public schema
DO $$
DECLARE
    view_record RECORD;
    drop_count INTEGER := 0;
    error_count INTEGER := 0;
BEGIN
    -- Loop through all views in public schema
    FOR view_record IN 
        SELECT table_name 
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name
    LOOP
        BEGIN
            -- Drop the view with CASCADE to handle dependencies
            EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_record.table_name);
            RAISE NOTICE 'Dropped view: public.%', view_record.table_name;
            drop_count := drop_count + 1;
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to drop view public.%: %', view_record.table_name, SQLERRM;
            error_count := error_count + 1;
        END;
    END LOOP;
    
    -- Summary
    RAISE NOTICE '';
    RAISE NOTICE 'Summary:';
    RAISE NOTICE '  Views dropped: %', drop_count;
    RAISE NOTICE '  Errors: %', error_count;
END $$;

-- Verify all views are dropped
SELECT '' as blank;
SELECT 'VERIFICATION - Remaining views in public schema:' as info;

SELECT 
    COUNT(*) as remaining_views
FROM information_schema.views
WHERE table_schema = 'public';

-- Show any remaining views (should be none)
SELECT 
    table_name as "View Name (if any remain)"
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;