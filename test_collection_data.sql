-- Test script to verify collection data setup

-- 1. Check if tables exist in kastle_banking schema
SELECT 
    'Table Check' as test,
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
AND table_name IN ('collection_teams', 'collection_officers', 'officer_performance_summary')
ORDER BY table_name;

-- 2. Check data counts
SELECT 
    'Data Counts' as test,
    'Teams' as entity,
    COUNT(*) as count
FROM kastle_banking.collection_teams
UNION ALL
SELECT 
    'Data Counts' as test,
    'Officers' as entity,
    COUNT(*) as count
FROM kastle_banking.collection_officers
UNION ALL
SELECT 
    'Data Counts' as test,
    'Performance Records' as entity,
    COUNT(*) as count
FROM kastle_banking.officer_performance_summary;

-- 3. Check date ranges in performance data
SELECT 
    'Date Range' as test,
    MIN(summary_date) as earliest_date,
    MAX(summary_date) as latest_date,
    COUNT(DISTINCT summary_date) as unique_dates
FROM kastle_banking.officer_performance_summary;

-- 4. Sample performance data with joins
SELECT 
    ops.officer_id,
    co.officer_name,
    ct.team_name,
    ops.summary_date,
    ops.total_collected,
    ops.total_cases
FROM kastle_banking.officer_performance_summary ops
LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
ORDER BY ops.summary_date DESC, ops.total_collected DESC
LIMIT 5;

-- 5. Test the query structure that matches the API call
SELECT 
    ops.*,
    jsonb_build_object(
        'officer_name', co.officer_name,
        'officer_type', co.officer_type,
        'team_id', co.team_id,
        'collection_teams', jsonb_build_object(
            'team_name', ct.team_name
        )
    ) as collection_officers
FROM kastle_banking.officer_performance_summary ops
LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
WHERE ops.summary_date <= CURRENT_DATE
ORDER BY ops.summary_date DESC, ops.total_collected DESC
LIMIT 3;
