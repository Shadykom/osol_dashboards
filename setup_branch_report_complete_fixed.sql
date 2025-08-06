-- Complete setup for branch report functionality (FIXED VERSION)
-- This script creates views and inserts sample data using correct column names

-- 1. First, run the fixed view creation
\i create_branch_report_views_fixed.sql

-- 2. Update branch regions to ensure proper values
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

-- 3. Insert sample performance data
\i insert_sample_branch_performance_fixed.sql

-- 4. Refresh materialized view
SELECT kastle_banking.refresh_branch_comparison_data();

-- 5. Enable real-time for branch_collection_performance if not already enabled
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

-- 6. Verify setup
SELECT 'Setup Verification' as check_type, 'Branch Summary View' as check_item, COUNT(*) as record_count 
FROM kastle_banking.branch_summary_view
UNION ALL
SELECT 'Setup Verification', 'Branch Performance History', COUNT(*) 
FROM kastle_banking.branch_performance_history_view
UNION ALL
SELECT 'Setup Verification', 'Branch Collection Trends', COUNT(*) 
FROM kastle_banking.branch_collection_trends
UNION ALL
SELECT 'Setup Verification', 'Branch Officer Performance', COUNT(*) 
FROM kastle_banking.branch_officer_performance
UNION ALL
SELECT 'Setup Verification', 'Branch Comparison Data', COUNT(*) 
FROM kastle_banking.branch_comparison_data;

-- 7. Sample query to test filters
SELECT 
    branch_id,
    branch_name,
    region,
    branch_type,
    performance_score,
    total_collected,
    total_outstanding,
    collection_rate
FROM kastle_banking.branch_summary_view
WHERE region = 'Central'
AND performance_score >= 70
ORDER BY performance_score DESC
LIMIT 5;

-- 8. Check column existence in branch_collection_performance
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking'
AND table_name = 'branch_collection_performance'
ORDER BY ordinal_position;