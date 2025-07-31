-- Test query to debug the collection overview issue

-- First, check what dates we have in the database
SELECT DISTINCT summary_date 
FROM kastle_banking.officer_performance_summary 
ORDER BY summary_date DESC 
LIMIT 10;

-- Check if we have any data for the date the frontend is querying (2025-07-31)
SELECT COUNT(*) as records_for_future_date
FROM kastle_banking.officer_performance_summary
WHERE summary_date = '2025-07-31';

-- Show the actual query structure that works
SELECT 
    ops.*,
    co.officer_name,
    co.officer_type,
    co.team_id,
    ct.team_name
FROM kastle_banking.officer_performance_summary ops
LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
WHERE ops.summary_date <= CURRENT_DATE
ORDER BY ops.total_collected DESC
LIMIT 10;

-- Test the Supabase-style query with proper joins
SELECT 
    ops.*,
    jsonb_build_object(
        'officer_id', co.officer_id,
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
ORDER BY ops.total_collected DESC
LIMIT 10;
