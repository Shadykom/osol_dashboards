-- DROP ALL VIEWS FROM PUBLIC AND KASTLE_COLLECTION SCHEMAS
-- This script drops all views that are not in kastle_banking schema

-- Show current state
SELECT 
    table_schema as "Schema",
    COUNT(*) as "View Count",
    string_agg(table_name, ', ' ORDER BY table_name) as "View Names"
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY table_schema
ORDER BY table_schema;

-- Drop all views from public and kastle_collection
DO $$
DECLARE
    view_record RECORD;
    total_dropped INTEGER := 0;
BEGIN
    -- Drop from public schema
    FOR view_record IN 
        SELECT table_name 
        FROM information_schema.views
        WHERE table_schema = 'public'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS public.%I CASCADE', view_record.table_name);
        RAISE NOTICE 'Dropped: public.%', view_record.table_name;
        total_dropped := total_dropped + 1;
    END LOOP;
    
    -- Drop from kastle_collection schema
    FOR view_record IN 
        SELECT table_name 
        FROM information_schema.views
        WHERE table_schema = 'kastle_collection'
    LOOP
        EXECUTE format('DROP VIEW IF EXISTS kastle_collection.%I CASCADE', view_record.table_name);
        RAISE NOTICE 'Dropped: kastle_collection.%', view_record.table_name;
        total_dropped := total_dropped + 1;
    END LOOP;
    
    RAISE NOTICE '';
    RAISE NOTICE 'Total views dropped: %', total_dropped;
END $$;

-- Final verification
SELECT '' as blank;
SELECT 'FINAL STATE:' as info;

SELECT 
    table_schema as "Schema",
    COUNT(*) as "View Count"
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY table_schema
ORDER BY table_schema;