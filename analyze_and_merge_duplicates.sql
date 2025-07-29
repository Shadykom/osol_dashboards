-- Comprehensive Duplicate Table Analysis and Merge Strategy
-- This script helps you decide how to handle tables that exist in multiple schemas

\echo '==============================================='
\echo 'DUPLICATE TABLE ANALYSIS AND MERGE STRATEGY'
\echo '==============================================='
\echo ''

-- 1. Detailed analysis of each duplicate table
\echo '1. ANALYZING EACH DUPLICATE TABLE'
\echo '---------------------------------'

-- Function to analyze tables
DO $$
DECLARE
    dup_record RECORD;
    schema_record RECORD;
    row_count BIGINT;
    col_count INTEGER;
BEGIN
    -- Get list of duplicate tables
    FOR dup_record IN 
        SELECT 
            table_name,
            array_agg(table_schema ORDER BY table_schema) as schemas
        FROM information_schema.tables
        WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking')
          AND table_type = 'BASE TABLE'
        GROUP BY table_name
        HAVING COUNT(*) > 1
        ORDER BY table_name
    LOOP
        RAISE NOTICE '';
        RAISE NOTICE 'Table: %', dup_record.table_name;
        RAISE NOTICE 'Found in schemas: %', array_to_string(dup_record.schemas, ', ');
        
        -- Check row counts and column counts for each version
        FOREACH schema_record IN ARRAY dup_record.schemas
        LOOP
            -- Get row count
            EXECUTE format('SELECT COUNT(*) FROM %I.%I', schema_record, dup_record.table_name) INTO row_count;
            
            -- Get column count
            SELECT COUNT(*) INTO col_count
            FROM information_schema.columns
            WHERE table_schema = schema_record
              AND table_name = dup_record.table_name;
            
            RAISE NOTICE '  - %.%: % rows, % columns', 
                schema_record, dup_record.table_name, row_count, col_count;
        END LOOP;
    END LOOP;
END $$;

\echo ''
\echo '2. RECOMMENDED MERGE STRATEGY'
\echo '-----------------------------'
\echo ''

-- Generate merge strategy based on the specific duplicates found
\echo '-- Tables in ALL THREE schemas (need careful consolidation):'
\echo '-- collection_officers, promise_to_pay'
\echo ''
\echo '-- Step 1: Compare data in all three versions'
\echo 'SELECT ''collection_officers in kastle_banking'' as source, COUNT(*) as row_count FROM kastle_banking.collection_officers'
\echo 'UNION ALL'
\echo 'SELECT ''collection_officers in kastle_collection'', COUNT(*) FROM kastle_collection.collection_officers'
\echo 'UNION ALL'
\echo 'SELECT ''collection_officers in public'', COUNT(*) FROM public.collection_officers;'
\echo ''
\echo 'SELECT ''promise_to_pay in kastle_banking'' as source, COUNT(*) as row_count FROM kastle_banking.promise_to_pay'
\echo 'UNION ALL'
\echo 'SELECT ''promise_to_pay in kastle_collection'', COUNT(*) FROM kastle_collection.promise_to_pay'
\echo 'UNION ALL'
\echo 'SELECT ''promise_to_pay in public'', COUNT(*) FROM public.promise_to_pay;'
\echo ''

\echo '3. CONSOLIDATION SCRIPTS'
\echo '------------------------'
\echo ''

-- Generate consolidation commands
\echo '-- OPTION A: If kastle_banking has the most complete/recent data'
\echo '-- Drop duplicates from other schemas:'
\echo ''
SELECT 
    '-- DROP TABLE ' || table_schema || '.' || table_name || ';' as command
FROM information_schema.tables
WHERE table_name IN ('collection_officers', 'promise_to_pay', 'collection_cases', 
                     'collection_teams', 'customers', 'officer_performance_metrics')
  AND table_schema IN ('public', 'kastle_collection')
  AND table_type = 'BASE TABLE'
ORDER BY table_name, table_schema;

\echo ''
\echo '-- OPTION B: Merge data from all schemas (if each has unique records)'
\echo '-- First, rename tables to preserve data:'
\echo ''
SELECT 
    '-- ALTER TABLE ' || table_schema || '.' || table_name || 
    ' RENAME TO ' || table_name || '_from_' || table_schema || ';' as command
FROM information_schema.tables
WHERE table_name IN ('collection_officers', 'promise_to_pay')
  AND table_schema IN ('public', 'kastle_collection')
  AND table_type = 'BASE TABLE'
ORDER BY table_name, table_schema;

\echo ''
\echo '-- Then merge data (example for collection_officers):'
\echo '-- INSERT INTO kastle_banking.collection_officers '
\echo '-- SELECT * FROM public.collection_officers_from_public'
\echo '-- WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.collection_officers WHERE id = collection_officers_from_public.id);'

\echo ''
\echo '-- OPTION C: For tables NOT in kastle_banking yet, move them:'
\echo ''
SELECT 
    'ALTER TABLE ' || table_schema || '.' || table_name || ' SET SCHEMA kastle_banking;' as command
FROM information_schema.tables
WHERE table_name IN ('collection_interactions', 'officer_performance_summary')
  AND table_schema = 'kastle_collection'  -- Move from kastle_collection first
  AND table_type = 'BASE TABLE';

\echo ''
\echo '4. FINAL CLEANUP'
\echo '----------------'
\echo ''
\echo '-- After consolidation, run the safe_migration.sql to move remaining tables'
\echo '-- Then verify final state:'
\echo ''
\echo 'SELECT table_schema, COUNT(*) as table_count'
\echo 'FROM information_schema.tables'
\echo 'WHERE table_schema IN (''public'', ''kastle_collection'', ''kastle_banking'')'
\echo '  AND table_type = ''BASE TABLE'''
\echo 'GROUP BY table_schema'
\echo 'ORDER BY table_schema;'