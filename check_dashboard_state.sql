-- Check Current Dashboard State
-- Run this before applying fixes to see what needs to be done

-- 1. Check which schemas exist
SELECT 'Existing Schemas:' as check_type, '' as details;
SELECT schema_name as check_type, 'EXISTS' as details
FROM information_schema.schemata 
WHERE schema_name IN ('kastle_banking', 'kastle_collection')
ORDER BY schema_name;

-- 2. Check collection_teams structure
SELECT '', '';
SELECT 'collection_teams columns in kastle_banking:' as check_type, '' as details;
SELECT column_name as check_type, data_type as details
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_teams'
ORDER BY ordinal_position;

-- 3. Check if collection_cases_detailed view exists
SELECT '', '';
SELECT 'collection_cases_detailed view:' as check_type, '' as details;
SELECT 
    table_schema as check_type,
    CASE 
        WHEN table_name IS NOT NULL THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as details
FROM information_schema.views
WHERE table_schema IN ('kastle_banking', 'kastle_collection')
AND table_name = 'collection_cases_detailed'

UNION ALL

SELECT 
    'kastle_banking' as check_type,
    'NOT EXISTS' as details
WHERE NOT EXISTS (
    SELECT 1 FROM information_schema.views 
    WHERE table_schema = 'kastle_banking' 
    AND table_name = 'collection_cases_detailed'
);

-- 4. Check collection tables
SELECT '', '';
SELECT 'Collection tables in kastle_banking:' as check_type, '' as details;
SELECT table_name as check_type, 
       CASE 
           WHEN table_name IS NOT NULL THEN 'EXISTS'
           ELSE 'NOT EXISTS'
       END as details
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
AND table_name IN ('collection_cases', 'collection_officers', 'collection_teams', 
                   'collection_interactions', 'promise_to_pay')
ORDER BY table_name;

-- 5. Check if we have any collection teams
SELECT '', '';
SELECT 'Collection teams data:' as check_type, '' as details;
SELECT 
    'Total teams' as check_type,
    COUNT(*)::text as details
FROM kastle_banking.collection_teams

UNION ALL

SELECT 
    'Teams with branch_id' as check_type,
    COUNT(*)::text as details
FROM kastle_banking.collection_teams
WHERE branch_id IS NOT NULL

UNION ALL

SELECT 
    'Active teams' as check_type,
    COUNT(*)::text as details
FROM kastle_banking.collection_teams
WHERE is_active = true;

-- 6. Summary
SELECT '', '';
SELECT 'SUMMARY - Issues to fix:' as check_type, '' as details;
SELECT 
    '1. Missing column: branch_id in collection_teams' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_teams' 
            AND column_name = 'branch_id'
        ) THEN '✓ FIXED'
        ELSE '✗ NEEDS FIX'
    END as details

UNION ALL

SELECT 
    '2. Missing column: is_active in collection_teams' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_teams' 
            AND column_name = 'is_active'
        ) THEN '✓ FIXED'
        ELSE '✗ NEEDS FIX'
    END as details

UNION ALL

SELECT 
    '3. Missing view: collection_cases_detailed' as check_type,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_cases_detailed'
        ) THEN '✓ FIXED'
        ELSE '✗ NEEDS FIX'
    END as details;