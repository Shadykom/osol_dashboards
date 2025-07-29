-- CHECK VIEWS IN ALL SCHEMAS
-- This script shows all views in public, kastle_collection, and kastle_banking schemas

-- Summary of views by schema
SELECT 
    table_schema as "Schema",
    COUNT(*) as "View Count"
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY table_schema
ORDER BY table_schema;

-- Detailed list of views
SELECT '' as blank;
SELECT 'DETAILED VIEW LIST:' as info;

SELECT 
    table_schema as "Schema",
    table_name as "View Name",
    CASE 
        WHEN view_definition LIKE '%kastle_banking.%' THEN 'References kastle_banking'
        WHEN view_definition LIKE '%kastle_collection.%' THEN 'References kastle_collection'
        WHEN view_definition LIKE '%public.%' THEN 'References public'
        ELSE 'No schema prefix'
    END as "Schema References"
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
ORDER BY table_schema, table_name;

-- Check for views with same name in different schemas
SELECT '' as blank;
SELECT 'DUPLICATE VIEW NAMES ACROSS SCHEMAS:' as info;

SELECT 
    table_name as "View Name",
    string_agg(table_schema, ', ' ORDER BY table_schema) as "Found in Schemas",
    COUNT(*) as "Count"
FROM information_schema.views
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY table_name
HAVING COUNT(*) > 1
ORDER BY table_name;

-- Show view dependencies (views that depend on other views)
SELECT '' as blank;
SELECT 'VIEW DEPENDENCIES:' as info;

WITH view_deps AS (
    SELECT DISTINCT
        nv.nspname as view_schema,
        cv.relname as view_name,
        nr.nspname as referenced_schema,
        cr.relname as referenced_object,
        CASE 
            WHEN cr.relkind = 'v' THEN 'view'
            WHEN cr.relkind = 'm' THEN 'materialized view'
            WHEN cr.relkind = 'r' THEN 'table'
            ELSE cr.relkind::text
        END as referenced_type
    FROM pg_depend d
    JOIN pg_rewrite r ON r.oid = d.objid
    JOIN pg_class cv ON cv.oid = r.ev_class
    JOIN pg_namespace nv ON nv.oid = cv.relnamespace
    JOIN pg_class cr ON cr.oid = d.refobjid
    JOIN pg_namespace nr ON nr.oid = cr.relnamespace
    WHERE cv.relkind = 'v'
      AND nv.nspname IN ('public', 'kastle_collection', 'kastle_banking')
      AND nr.nspname IN ('public', 'kastle_collection', 'kastle_banking')
      AND d.deptype = 'n'
      AND cr.oid != cv.oid
)
SELECT * FROM view_deps
ORDER BY view_schema, view_name, referenced_schema, referenced_object;