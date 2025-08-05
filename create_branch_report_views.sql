-- Create views for branch report functionality
-- This script creates views to simplify data fetching for the branch report pages

-- 1. Create a view for branch performance with latest data
CREATE OR REPLACE VIEW kastle_banking.branch_performance_latest AS
SELECT DISTINCT ON (bcp.branch_id)
    b.branch_id,
    b.branch_name,
    b.branch_type,
    b.state as region,
    b.city,
    b.address,
    b.phone,
    b.email,
    b.manager_id,
    b.is_active,
    bcp.performance_date,
    bcp.total_cases,
    bcp.active_cases,
    bcp.resolved_cases,
    bcp.total_outstanding,
    bcp.total_collected,
    bcp.collection_rate,
    bcp.delinquency_rate,
    bcp.avg_dpd,
    bcp.total_calls,
    bcp.total_sms,
    bcp.total_emails,
    bcp.contact_rate,
    bcp.ptp_rate,
    bcp.ptp_kept_rate,
    bcp.created_at as performance_created_at,
    -- Calculate performance score based on multiple factors
    CASE 
        WHEN bcp.collection_rate >= 90 THEN 95
        WHEN bcp.collection_rate >= 80 THEN 85
        WHEN bcp.collection_rate >= 70 THEN 75
        WHEN bcp.collection_rate >= 60 THEN 65
        WHEN bcp.collection_rate >= 50 THEN 55
        ELSE 45
    END as performance_score
FROM kastle_banking.branches b
LEFT JOIN kastle_banking.branch_collection_performance bcp ON b.branch_id = bcp.branch_id
WHERE b.is_active = true
ORDER BY bcp.branch_id, bcp.performance_date DESC;

-- 2. Create a view for branch summary with officer counts
CREATE OR REPLACE VIEW kastle_banking.branch_summary_view AS
SELECT 
    bpl.*,
    COALESCE(officer_counts.total_officers, 0) as total_officers,
    COALESCE(officer_counts.active_officers, 0) as active_officers_count
FROM kastle_banking.branch_performance_latest bpl
LEFT JOIN (
    SELECT 
        branch_id,
        COUNT(DISTINCT officer_id) as total_officers,
        COUNT(DISTINCT CASE WHEN is_active = true THEN officer_id END) as active_officers
    FROM kastle_banking.collection_officers
    GROUP BY branch_id
) officer_counts ON bpl.branch_id = officer_counts.branch_id;

-- 3. Create a view for branch performance history
CREATE OR REPLACE VIEW kastle_banking.branch_performance_history_view AS
SELECT 
    b.branch_id,
    b.branch_name,
    bcp.performance_date,
    bcp.total_cases,
    bcp.active_cases,
    bcp.resolved_cases,
    bcp.total_outstanding,
    bcp.total_collected,
    bcp.collection_rate,
    bcp.delinquency_rate,
    bcp.avg_dpd,
    bcp.total_calls,
    bcp.total_sms,
    bcp.total_emails,
    bcp.contact_rate,
    bcp.ptp_rate,
    bcp.ptp_kept_rate
FROM kastle_banking.branches b
JOIN kastle_banking.branch_collection_performance bcp ON b.branch_id = bcp.branch_id
WHERE b.is_active = true
ORDER BY b.branch_id, bcp.performance_date DESC;

-- 4. Create a view for branch collection trends (daily aggregates)
CREATE OR REPLACE VIEW kastle_banking.branch_collection_trends AS
SELECT 
    branch_id,
    performance_date,
    SUM(total_collected) OVER (PARTITION BY branch_id ORDER BY performance_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as week_collection,
    SUM(total_collected) OVER (PARTITION BY branch_id ORDER BY performance_date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as month_collection,
    SUM(total_collected) OVER (PARTITION BY branch_id ORDER BY performance_date ROWS BETWEEN 364 PRECEDING AND CURRENT ROW) as year_collection,
    total_collected as daily_collection,
    total_cases,
    resolved_cases,
    collection_rate
FROM kastle_banking.branch_collection_performance
ORDER BY branch_id, performance_date DESC;

-- 5. Create a view for branch officer performance
CREATE OR REPLACE VIEW kastle_banking.branch_officer_performance AS
SELECT 
    co.branch_id,
    co.officer_id,
    co.officer_name,
    co.email,
    co.phone,
    co.role,
    co.is_active,
    ops.summary_date,
    ops.total_collected,
    ops.total_cases,
    ops.active_cases,
    ops.collection_rate,
    ops.success_rate,
    ops.contacts_made,
    ops.promises_made,
    ops.promises_kept,
    -- Calculate performance score
    CASE 
        WHEN ops.collection_rate >= 90 THEN 95
        WHEN ops.collection_rate >= 80 THEN 85
        WHEN ops.collection_rate >= 70 THEN 75
        WHEN ops.collection_rate >= 60 THEN 65
        WHEN ops.collection_rate >= 50 THEN 55
        ELSE 45
    END as performance_score
FROM kastle_banking.collection_officers co
LEFT JOIN kastle_banking.officer_performance_summary ops ON co.officer_id = ops.officer_id
WHERE co.is_active = true;

-- 6. Create a materialized view for branch comparison data
CREATE MATERIALIZED VIEW IF NOT EXISTS kastle_banking.branch_comparison_data AS
SELECT 
    b.branch_id,
    b.branch_name,
    b.branch_type,
    b.state as region,
    DATE_TRUNC('month', bcp.performance_date) as month,
    SUM(bcp.total_collected) as monthly_collection,
    SUM(bcp.total_outstanding) as monthly_outstanding,
    AVG(bcp.collection_rate) as avg_collection_rate,
    SUM(bcp.total_cases) as total_cases,
    SUM(bcp.resolved_cases) as resolved_cases,
    AVG(bcp.delinquency_rate) as avg_delinquency_rate,
    COUNT(DISTINCT bcp.performance_date) as days_reported
FROM kastle_banking.branches b
JOIN kastle_banking.branch_collection_performance bcp ON b.branch_id = bcp.branch_id
WHERE b.is_active = true
GROUP BY b.branch_id, b.branch_name, b.branch_type, b.state, DATE_TRUNC('month', bcp.performance_date);

-- Create index on materialized view
CREATE INDEX idx_branch_comparison_branch_id ON kastle_banking.branch_comparison_data(branch_id);
CREATE INDEX idx_branch_comparison_month ON kastle_banking.branch_comparison_data(month DESC);

-- 7. Grant permissions on views
GRANT SELECT ON kastle_banking.branch_performance_latest TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_summary_view TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_performance_history_view TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_collection_trends TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_officer_performance TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_comparison_data TO authenticated, anon;

-- 8. Create a function to refresh the materialized view
CREATE OR REPLACE FUNCTION kastle_banking.refresh_branch_comparison_data()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY kastle_banking.branch_comparison_data;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION kastle_banking.refresh_branch_comparison_data() TO authenticated;

-- 9. Create a scheduled job to refresh the materialized view (requires pg_cron extension)
-- This should be run daily or as needed
-- SELECT cron.schedule('refresh-branch-comparison', '0 2 * * *', 'SELECT kastle_banking.refresh_branch_comparison_data();');

-- Verify views are created
SELECT 
    schemaname,
    viewname,
    definition IS NOT NULL as has_definition
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