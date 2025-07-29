-- Check for Duplicate Tables Across Schemas
-- This script helps identify tables that exist in multiple schemas

-- Find tables that exist in multiple schemas
WITH table_occurrences AS (
    SELECT 
        table_name,
        array_agg(table_schema ORDER BY table_schema) as schemas,
        COUNT(*) as schema_count
    FROM information_schema.tables
    WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
      AND table_type = 'BASE TABLE'
    GROUP BY table_name
)
SELECT 
    table_name as "Table Name",
    schema_count as "Found in # Schemas",
    array_to_string(schemas, ', ') as "Schemas"
FROM table_occurrences
WHERE schema_count > 1
ORDER BY schema_count DESC, table_name;

-- Show detailed breakdown
SELECT '' as empty_line;
SELECT 'Detailed Schema Contents:' as info;

-- Tables in each schema
SELECT 
    table_schema as "Schema",
    string_agg(table_name, ', ' ORDER BY table_name) as "Tables"
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- Count summary
SELECT '' as empty_line;
SELECT 'Schema Summary:' as info;

SELECT 
    table_schema as "Schema",
    COUNT(*) as "Table Count"
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;