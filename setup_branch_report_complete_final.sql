-- Complete Branch Report Setup Script (FINAL VERSION)
-- This script sets up everything needed for the branch report functionality
-- Run this script in your Supabase SQL editor

-- PART 1: Create views
\i create_branch_report_views_final.sql

-- PART 2: Update branch regions
UPDATE kastle_banking.branches
SET state = CASE 
    WHEN branch_id IN ('BR001', 'BR002') THEN 'Central'
    WHEN branch_id IN ('BR003', 'BR004') THEN 'Eastern'
    WHEN branch_id IN ('BR005', 'BR006') THEN 'Western'
    WHEN branch_id IN ('BR007', 'BR008') THEN 'Northern'
    WHEN branch_id IN ('BR009', 'BR010') THEN 'Southern'
    ELSE 'Central'
END
WHERE state IS NULL OR state = '';

-- PART 3: Insert sample data
\i insert_sample_branch_performance_final.sql

-- PART 4: Refresh materialized view
SELECT kastle_banking.refresh_branch_comparison_data();

-- PART 5: Enable real-time
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'kastle_banking' 
        AND tablename = 'branch_collection_performance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.branch_collection_performance;
    END IF;
END $$;

-- PART 6: Verify setup
SELECT 'Setup Verification' as check_type, 'Views Created' as check_item, COUNT(*) as count
FROM pg_views
WHERE schemaname = 'kastle_banking'
AND viewname IN (
    'branch_performance_latest',
    'branch_summary_view',
    'branch_performance_history_view',
    'branch_collection_trends',
    'branch_officer_performance'
)
UNION ALL
SELECT 'Setup Verification', 'Branch Performance Records', COUNT(*)
FROM kastle_banking.branch_collection_performance
WHERE performance_date >= CURRENT_DATE - INTERVAL '30 days'
UNION ALL
SELECT 'Setup Verification', 'Active Branches with Data', COUNT(DISTINCT branch_id)
FROM kastle_banking.branch_summary_view
WHERE performance_date IS NOT NULL;

-- PART 7: Test queries
-- Test branch summary view with filters
SELECT 
    branch_id,
    branch_name,
    region,
    branch_type,
    performance_score,
    total_collected,
    total_outstanding,
    collection_rate,
    total_cases,
    active_cases,
    resolved_cases
FROM kastle_banking.branch_summary_view
WHERE region = 'Central'
AND performance_score >= 70
ORDER BY performance_score DESC
LIMIT 5;

-- Test collection trends
SELECT 
    branch_id,
    performance_date,
    daily_collection,
    week_collection,
    month_collection,
    collection_rate
FROM kastle_banking.branch_collection_trends
WHERE branch_id IN (SELECT branch_id FROM kastle_banking.branches LIMIT 1)
AND performance_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY performance_date DESC;