-- Complete Schema Export Script for Branch Report
-- Run this entire script in Supabase SQL editor and copy the output

WITH schema_info AS (
    -- Combine all schema information into one query
    SELECT 
        'TABLE_SCHEMA' as info_type,
        table_schema,
        table_name,
        column_name,
        ordinal_position,
        data_type,
        is_nullable,
        column_default,
        '' as constraint_type,
        '' as foreign_table,
        '' as foreign_column
    FROM information_schema.columns
    WHERE table_schema = 'kastle_banking' 
    AND table_name IN ('branches', 'branch_collection_performance', 'collection_officers', 'collection_teams', 'officer_performance_summary')
    
    UNION ALL
    
    SELECT 
        'CONSTRAINT' as info_type,
        tc.table_schema,
        tc.table_name,
        kcu.column_name,
        0 as ordinal_position,
        tc.constraint_type as data_type,
        'NO' as is_nullable,
        tc.constraint_name as column_default,
        tc.constraint_type,
        ccu.table_name as foreign_table,
        ccu.column_name as foreign_column
    FROM information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
    LEFT JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
    WHERE tc.table_schema = 'kastle_banking'
    AND tc.table_name IN ('branches', 'branch_collection_performance', 'collection_officers', 'collection_teams', 'officer_performance_summary')
    
    UNION ALL
    
    SELECT 
        'EXISTING_VIEW' as info_type,
        schemaname as table_schema,
        viewname as table_name,
        '' as column_name,
        0 as ordinal_position,
        'VIEW' as data_type,
        'NO' as is_nullable,
        viewowner as column_default,
        '' as constraint_type,
        '' as foreign_table,
        '' as foreign_column
    FROM pg_views
    WHERE schemaname = 'kastle_banking'
    AND viewname IN ('branch_performance_latest', 'branch_summary_view', 'branch_performance_history_view', 'branch_collection_trends', 'branch_officer_performance')
    
    UNION ALL
    
    SELECT 
        'EXISTING_MATVIEW' as info_type,
        schemaname as table_schema,
        matviewname as table_name,
        '' as column_name,
        0 as ordinal_position,
        'MATERIALIZED VIEW' as data_type,
        'NO' as is_nullable,
        matviewowner as column_default,
        '' as constraint_type,
        '' as foreign_table,
        '' as foreign_column
    FROM pg_matviews
    WHERE schemaname = 'kastle_banking'
    AND matviewname = 'branch_comparison_data'
)
SELECT 
    '=== SCHEMA INFORMATION FOR BRANCH REPORT ===' as output
UNION ALL
SELECT 
    '' as output
UNION ALL
SELECT 
    CASE 
        WHEN info_type = 'TABLE_SCHEMA' THEN 
            'Table: ' || table_name || ' | Column: ' || column_name || ' | Type: ' || data_type || ' | Nullable: ' || is_nullable || ' | Default: ' || COALESCE(column_default, 'NULL')
        WHEN info_type = 'CONSTRAINT' AND constraint_type = 'FOREIGN KEY' THEN 
            'FK: ' || table_name || '.' || column_name || ' -> ' || foreign_table || '.' || foreign_column
        WHEN info_type = 'CONSTRAINT' AND constraint_type = 'PRIMARY KEY' THEN 
            'PK: ' || table_name || '.' || column_name
        WHEN info_type = 'CONSTRAINT' THEN 
            'Constraint: ' || table_name || ' | ' || constraint_type || ' | ' || column_default
        WHEN info_type = 'EXISTING_VIEW' THEN 
            'Existing View: ' || table_name || ' (owner: ' || column_default || ')'
        WHEN info_type = 'EXISTING_MATVIEW' THEN 
            'Existing Materialized View: ' || table_name || ' (owner: ' || column_default || ')'
        ELSE 
            info_type || ': ' || table_name
    END as output
FROM schema_info
ORDER BY 
    CASE info_type 
        WHEN 'TABLE_SCHEMA' THEN 1 
        WHEN 'CONSTRAINT' THEN 2 
        WHEN 'EXISTING_VIEW' THEN 3 
        WHEN 'EXISTING_MATVIEW' THEN 4 
    END,
    table_name,
    ordinal_position,
    column_name;

-- Add sample data check
SELECT '' as output
UNION ALL
SELECT '=== SAMPLE DATA CHECK ===' as output
UNION ALL
SELECT 'Branches count: ' || COUNT(*)::text as output FROM kastle_banking.branches
UNION ALL
SELECT 'Branch performance records: ' || COUNT(*)::text as output FROM kastle_banking.branch_collection_performance
UNION ALL
SELECT 'Collection officers count: ' || COUNT(*)::text as output FROM kastle_banking.collection_officers
UNION ALL
SELECT 'Collection teams count: ' || COUNT(*)::text as output FROM kastle_banking.collection_teams
UNION ALL
SELECT 'Officer performance records: ' || COUNT(*)::text as output FROM kastle_banking.officer_performance_summary;