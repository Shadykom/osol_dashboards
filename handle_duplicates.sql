-- Handle Duplicate Tables Script
-- This script provides options for dealing with duplicate tables

-- First, let's see what duplicates exist
\echo 'Checking for duplicate tables across schemas...'
\echo ''

WITH duplicates AS (
    SELECT 
        table_name,
        array_agg(table_schema ORDER BY table_schema) as schemas,
        COUNT(*) as schema_count
    FROM information_schema.tables
    WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
      AND table_type = 'BASE TABLE'
    GROUP BY table_name
    HAVING COUNT(*) > 1
)
SELECT 
    table_name,
    schema_count,
    array_to_string(schemas, ', ') as in_schemas
FROM duplicates
ORDER BY table_name;

\echo ''
\echo 'Options for handling duplicates:'
\echo ''

-- Generate commands to handle duplicates
-- Option 1: Drop duplicates from source schemas (keeping only kastle_banking version)
\echo '-- Option 1: Drop duplicate tables from source schemas (DESTRUCTIVE - removes data!)'
WITH duplicates AS (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'kastle_banking'
      AND table_type = 'BASE TABLE'
      AND EXISTS (
          SELECT 1 
          FROM information_schema.tables t2
          WHERE t2.table_name = information_schema.tables.table_name
            AND t2.table_schema IN ('public', 'kastle_collection')
            AND t2.table_type = 'BASE TABLE'
      )
)
SELECT 
    '-- DROP TABLE ' || table_schema || '.' || table_name || ';' as drop_command
FROM information_schema.tables
WHERE table_name IN (SELECT table_name FROM duplicates)
  AND table_schema IN ('public', 'kastle_collection')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

\echo ''
\echo '-- Option 2: Rename duplicate tables in source schemas (preserves data)'
WITH duplicates AS (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'kastle_banking'
      AND table_type = 'BASE TABLE'
      AND EXISTS (
          SELECT 1 
          FROM information_schema.tables t2
          WHERE t2.table_name = information_schema.tables.table_name
            AND t2.table_schema IN ('public', 'kastle_collection')
            AND t2.table_type = 'BASE TABLE'
      )
)
SELECT 
    '-- ALTER TABLE ' || table_schema || '.' || table_name || 
    ' RENAME TO ' || table_name || '_backup_from_' || table_schema || ';' as rename_command
FROM information_schema.tables
WHERE table_name IN (SELECT table_name FROM duplicates)
  AND table_schema IN ('public', 'kastle_collection')
  AND table_type = 'BASE TABLE'
ORDER BY table_schema, table_name;

\echo ''
\echo '-- Option 3: Compare data between duplicate tables'
\echo '-- Use these queries to check if tables have the same data:'
WITH duplicates AS (
    SELECT DISTINCT table_name
    FROM information_schema.tables
    WHERE table_schema = 'kastle_banking'
      AND table_type = 'BASE TABLE'
      AND EXISTS (
          SELECT 1 
          FROM information_schema.tables t2
          WHERE t2.table_name = information_schema.tables.table_name
            AND t2.table_schema IN ('public', 'kastle_collection')
            AND t2.table_type = 'BASE TABLE'
      )
)
SELECT 
    '-- SELECT COUNT(*) as row_count, ''' || table_schema || '.' || table_name || 
    ''' as table_full_name FROM ' || table_schema || '.' || table_name || ';' as count_command
FROM information_schema.tables
WHERE table_name IN (SELECT table_name FROM duplicates)
  AND table_schema IN ('public', 'kastle_collection', 'kastle_banking')
  AND table_type = 'BASE TABLE'
ORDER BY table_name, table_schema;