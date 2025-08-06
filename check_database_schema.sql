-- Script to check database schema for branch report functionality
-- Run this in Supabase SQL editor to get all table structures

-- 1. Check branches table structure
SELECT 
    'branches' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'branches'
ORDER BY ordinal_position;

-- 2. Check branch_collection_performance table structure
SELECT 
    'branch_collection_performance' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'branch_collection_performance'
ORDER BY ordinal_position;

-- 3. Check collection_officers table structure
SELECT 
    'collection_officers' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_officers'
ORDER BY ordinal_position;

-- 4. Check collection_teams table structure
SELECT 
    'collection_teams' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_teams'
ORDER BY ordinal_position;

-- 5. Check officer_performance_summary table structure
SELECT 
    'officer_performance_summary' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'officer_performance_summary'
ORDER BY ordinal_position;

-- 6. Check if views already exist
SELECT 
    schemaname,
    viewname,
    viewowner
FROM pg_views
WHERE schemaname = 'kastle_banking'
AND viewname IN (
    'branch_performance_latest',
    'branch_summary_view',
    'branch_performance_history_view',
    'branch_collection_trends',
    'branch_officer_performance'
)
ORDER BY viewname;

-- 7. Check if materialized views exist
SELECT 
    schemaname,
    matviewname,
    matviewowner
FROM pg_matviews
WHERE schemaname = 'kastle_banking'
AND matviewname = 'branch_comparison_data';

-- 8. List all constraints on relevant tables
SELECT 
    tc.table_name,
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
LEFT JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.table_schema = 'kastle_banking'
AND tc.table_name IN ('branches', 'branch_collection_performance', 'collection_officers', 'collection_teams', 'officer_performance_summary')
ORDER BY tc.table_name, tc.constraint_type;

-- 9. Get sample data from each table (limit 1 row)
SELECT 'Sample from branches:' as info;
SELECT * FROM kastle_banking.branches LIMIT 1;

SELECT 'Sample from branch_collection_performance:' as info;
SELECT * FROM kastle_banking.branch_collection_performance LIMIT 1;

SELECT 'Sample from collection_officers:' as info;
SELECT * FROM kastle_banking.collection_officers LIMIT 1;

SELECT 'Sample from collection_teams:' as info;
SELECT * FROM kastle_banking.collection_teams LIMIT 1;

SELECT 'Sample from officer_performance_summary:' as info;
SELECT * FROM kastle_banking.officer_performance_summary LIMIT 1;