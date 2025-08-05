-- Complete Schema Export Script for Branch Report
-- Run this entire script in Supabase SQL editor and copy the output

-- 1. Table Structures
SELECT '=== TABLE STRUCTURES ===' as info;

SELECT 
    'Table: ' || table_name || ' | Column: ' || column_name || ' | Type: ' || data_type || ' | Nullable: ' || is_nullable || ' | Default: ' || COALESCE(column_default, 'NULL') as info
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name IN ('branches', 'branch_collection_performance', 'collection_officers', 'collection_teams', 'officer_performance_summary')
ORDER BY table_name, ordinal_position;

-- 2. Foreign Keys
SELECT '=== FOREIGN KEY RELATIONSHIPS ===' as info;

SELECT 
    'FK: ' || tc.table_name || '.' || kcu.column_name || ' -> ' || ccu.table_name || '.' || ccu.column_name as info
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'kastle_banking'
AND tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name IN ('branches', 'branch_collection_performance', 'collection_officers', 'collection_teams', 'officer_performance_summary')
ORDER BY tc.table_name, kcu.column_name;

-- 3. Primary Keys
SELECT '=== PRIMARY KEYS ===' as info;

SELECT 
    'PK: ' || tc.table_name || '.' || kcu.column_name as info
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'kastle_banking'
AND tc.constraint_type = 'PRIMARY KEY'
AND tc.table_name IN ('branches', 'branch_collection_performance', 'collection_officers', 'collection_teams', 'officer_performance_summary')
ORDER BY tc.table_name;

-- 4. Existing Views
SELECT '=== EXISTING VIEWS ===' as info;

SELECT 
    'View: ' || viewname || ' (owner: ' || viewowner || ')' as info
FROM pg_views
WHERE schemaname = 'kastle_banking'
AND viewname IN ('branch_performance_latest', 'branch_summary_view', 'branch_performance_history_view', 'branch_collection_trends', 'branch_officer_performance')
ORDER BY viewname;

-- 5. Existing Materialized Views
SELECT '=== EXISTING MATERIALIZED VIEWS ===' as info;

SELECT 
    'Materialized View: ' || matviewname || ' (owner: ' || matviewowner || ')' as info
FROM pg_matviews
WHERE schemaname = 'kastle_banking'
AND matviewname = 'branch_comparison_data';

-- 6. Row Counts
SELECT '=== ROW COUNTS ===' as info;

SELECT 'Branches: ' || COUNT(*)::text as info FROM kastle_banking.branches;
SELECT 'Branch performance records: ' || COUNT(*)::text as info FROM kastle_banking.branch_collection_performance;
SELECT 'Collection officers: ' || COUNT(*)::text as info FROM kastle_banking.collection_officers;
SELECT 'Collection teams: ' || COUNT(*)::text as info FROM kastle_banking.collection_teams;
SELECT 'Officer performance records: ' || COUNT(*)::text as info FROM kastle_banking.officer_performance_summary;

-- 7. Sample Data
SELECT '=== SAMPLE DATA ===' as info;

SELECT 'Sample branch:' as info;
SELECT branch_id, branch_name, branch_type, state, city FROM kastle_banking.branches LIMIT 1;

SELECT 'Sample branch performance:' as info;
SELECT branch_id, performance_date, total_collected_amount, collection_rate, number_of_accounts FROM kastle_banking.branch_collection_performance LIMIT 1;

SELECT 'Sample collection team:' as info;
SELECT team_id, team_code, team_name, branch_id FROM kastle_banking.collection_teams LIMIT 1;

SELECT 'Sample collection officer:' as info;
SELECT officer_id, officer_name, team_id, status FROM kastle_banking.collection_officers LIMIT 1;

SELECT 'Sample officer performance:' as info;
SELECT officer_id, summary_date, total_collected, collection_rate FROM kastle_banking.officer_performance_summary LIMIT 1;