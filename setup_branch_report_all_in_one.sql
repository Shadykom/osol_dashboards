-- Complete Branch Report Setup - All in One Script
-- This script can be run directly in Supabase SQL editor
-- It includes all views, sample data, and setup steps

-- PART 1: Create views for branch report functionality

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
    COALESCE(bcp.number_of_accounts, 0) as total_cases,
    COALESCE(bcp.active_cases, bcp.number_of_accounts - COALESCE(bcp.resolved_cases, 0)) as active_cases,
    COALESCE(bcp.resolved_cases, 0) as resolved_cases,
    COALESCE(bcp.total_outstanding, bcp.total_delinquent_amount) as total_outstanding,
    bcp.total_collected_amount as total_collected,
    bcp.collection_rate,
    COALESCE(bcp.delinquency_rate, 0) as delinquency_rate,
    COALESCE(bcp.avg_dpd, 0) as avg_dpd,
    COALESCE(bcp.total_calls, 0) as total_calls,
    COALESCE(bcp.total_sms, 0) as total_sms,
    COALESCE(bcp.total_emails, 0) as total_emails,
    COALESCE(bcp.contact_rate, 0) as contact_rate,
    COALESCE(bcp.ptp_rate, 0) as ptp_rate,
    COALESCE(bcp.ptp_kept_rate, 0) as ptp_kept_rate,
    COALESCE(bcp.ptp_success_rate, 0) as ptp_success_rate,
    COALESCE(bcp.remediation_count, 0) as remediation_count,
    COALESCE(bcp.remediation_amount, 0) as remediation_amount,
    bcp.created_at as performance_created_at,
    -- Calculate performance score based on collection rate
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
WITH officer_counts AS (
    SELECT 
        branch_id,
        COUNT(DISTINCT officer_id) as total_officers,
        COUNT(DISTINCT CASE WHEN is_active = true THEN officer_id END) as active_officers
    FROM kastle_banking.collection_officers
    GROUP BY branch_id
)
SELECT 
    bpl.*,
    COALESCE(oc.total_officers, 0) as total_officers,
    COALESCE(oc.active_officers, 0) as active_officers_count
FROM kastle_banking.branch_performance_latest bpl
LEFT JOIN officer_counts oc ON bpl.branch_id = oc.branch_id;

-- 3. Create a view for branch performance history
CREATE OR REPLACE VIEW kastle_banking.branch_performance_history_view AS
SELECT 
    b.branch_id,
    b.branch_name,
    bcp.performance_date,
    bcp.period_date,
    COALESCE(bcp.number_of_accounts, 0) as total_cases,
    COALESCE(bcp.active_cases, bcp.number_of_accounts - COALESCE(bcp.resolved_cases, 0)) as active_cases,
    COALESCE(bcp.resolved_cases, 0) as resolved_cases,
    COALESCE(bcp.total_outstanding, bcp.total_delinquent_amount) as total_outstanding,
    bcp.total_collected_amount as total_collected,
    bcp.collection_rate,
    COALESCE(bcp.delinquency_rate, 0) as delinquency_rate,
    COALESCE(bcp.avg_dpd, 0) as avg_dpd,
    COALESCE(bcp.total_calls, 0) as total_calls,
    COALESCE(bcp.total_sms, 0) as total_sms,
    COALESCE(bcp.total_emails, 0) as total_emails,
    COALESCE(bcp.contact_rate, 0) as contact_rate,
    COALESCE(bcp.ptp_rate, 0) as ptp_rate,
    COALESCE(bcp.ptp_kept_rate, 0) as ptp_kept_rate,
    COALESCE(bcp.ptp_success_rate, 0) as ptp_success_rate,
    COALESCE(bcp.remediation_count, 0) as remediation_count,
    COALESCE(bcp.remediation_amount, 0) as remediation_amount
FROM kastle_banking.branches b
JOIN kastle_banking.branch_collection_performance bcp ON b.branch_id = bcp.branch_id
WHERE b.is_active = true
ORDER BY b.branch_id, bcp.performance_date DESC;

-- 4. Create a view for branch collection trends
CREATE OR REPLACE VIEW kastle_banking.branch_collection_trends AS
SELECT 
    branch_id,
    performance_date,
    SUM(total_collected_amount) OVER (PARTITION BY branch_id ORDER BY performance_date ROWS BETWEEN 6 PRECEDING AND CURRENT ROW) as week_collection,
    SUM(total_collected_amount) OVER (PARTITION BY branch_id ORDER BY performance_date ROWS BETWEEN 29 PRECEDING AND CURRENT ROW) as month_collection,
    SUM(total_collected_amount) OVER (PARTITION BY branch_id ORDER BY performance_date ROWS BETWEEN 364 PRECEDING AND CURRENT ROW) as year_collection,
    total_collected_amount as daily_collection,
    number_of_accounts as total_cases,
    COALESCE(resolved_cases, 0) as resolved_cases,
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
DROP MATERIALIZED VIEW IF EXISTS kastle_banking.branch_comparison_data CASCADE;
CREATE MATERIALIZED VIEW kastle_banking.branch_comparison_data AS
SELECT 
    b.branch_id,
    b.branch_name,
    b.branch_type,
    b.state as region,
    DATE_TRUNC('month', bcp.performance_date) as month,
    SUM(bcp.total_collected_amount) as monthly_collection,
    SUM(COALESCE(bcp.total_outstanding, bcp.total_delinquent_amount)) as monthly_outstanding,
    AVG(bcp.collection_rate) as avg_collection_rate,
    SUM(bcp.number_of_accounts) as total_cases,
    SUM(COALESCE(bcp.resolved_cases, 0)) as resolved_cases,
    AVG(COALESCE(bcp.delinquency_rate, 0)) as avg_delinquency_rate,
    COUNT(DISTINCT bcp.performance_date) as days_reported
FROM kastle_banking.branches b
JOIN kastle_banking.branch_collection_performance bcp ON b.branch_id = bcp.branch_id
WHERE b.is_active = true
GROUP BY b.branch_id, b.branch_name, b.branch_type, b.state, DATE_TRUNC('month', bcp.performance_date);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_branch_comparison_branch_id ON kastle_banking.branch_comparison_data(branch_id);
CREATE INDEX IF NOT EXISTS idx_branch_comparison_month ON kastle_banking.branch_comparison_data(month DESC);

-- 7. Grant permissions
GRANT SELECT ON kastle_banking.branch_performance_latest TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_summary_view TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_performance_history_view TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_collection_trends TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_officer_performance TO authenticated, anon;
GRANT SELECT ON kastle_banking.branch_comparison_data TO authenticated, anon;

-- 8. Create refresh function
CREATE OR REPLACE FUNCTION kastle_banking.refresh_branch_comparison_data()
RETURNS void AS $$
BEGIN
    REFRESH MATERIALIZED VIEW kastle_banking.branch_comparison_data;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION kastle_banking.refresh_branch_comparison_data() TO authenticated;

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

-- PART 3: Insert sample performance data
DO $$
DECLARE
    branch_record RECORD;
    date_counter DATE;
    base_collection DECIMAL;
    base_outstanding DECIMAL;
    collection_variance DECIMAL;
    active_ratio DECIMAL;
BEGIN
    -- Loop through each active branch (limit to 10 for testing)
    FOR branch_record IN 
        SELECT branch_id 
        FROM kastle_banking.branches 
        WHERE is_active = true
        LIMIT 10
    LOOP
        -- Generate data for the last 30 days
        FOR date_counter IN 
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '30 days',
                CURRENT_DATE,
                '1 day'::interval
            )::date
        LOOP
            -- Random base values
            base_collection := 50000 + (random() * 100000);
            base_outstanding := 200000 + (random() * 300000);
            collection_variance := 0.8 + (random() * 0.4);
            active_ratio := 0.3 + (random() * 0.4);
            
            -- Insert performance data
            INSERT INTO kastle_banking.branch_collection_performance (
                branch_id,
                period_date,
                performance_date,
                total_delinquent_amount,
                total_collected_amount,
                collection_rate,
                number_of_accounts,
                active_cases,
                resolved_cases,
                total_outstanding,
                delinquency_rate,
                avg_dpd,
                total_calls,
                total_sms,
                total_emails,
                contact_rate,
                ptp_rate,
                ptp_kept_rate,
                ptp_success_rate,
                remediation_count,
                remediation_amount
            ) VALUES (
                branch_record.branch_id,
                date_counter,
                date_counter,
                base_outstanding,
                base_collection * collection_variance,
                60 + (random() * 35),
                100 + floor(random() * 200),
                floor((100 + floor(random() * 200)) * active_ratio),
                floor((100 + floor(random() * 200)) * (1 - active_ratio)),
                base_outstanding * 1.1,
                5 + (random() * 15),
                15 + (random() * 45),
                200 + floor(random() * 300),
                100 + floor(random() * 200),
                50 + floor(random() * 150),
                70 + (random() * 25),
                40 + (random() * 30),
                60 + (random() * 30),
                50 + (random() * 40),
                5 + floor(random() * 15),
                10000 + (random() * 40000)
            )
            ON CONFLICT (branch_id, performance_date) 
            DO UPDATE SET
                total_collected_amount = EXCLUDED.total_collected_amount,
                collection_rate = EXCLUDED.collection_rate,
                active_cases = EXCLUDED.active_cases,
                resolved_cases = EXCLUDED.resolved_cases;
        END LOOP;
    END LOOP;
END $$;

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
SELECT 'Setup Complete!' as status, 
       (SELECT COUNT(*) FROM kastle_banking.branch_summary_view) as branches_with_data,
       (SELECT COUNT(*) FROM kastle_banking.branch_collection_performance 
        WHERE performance_date >= CURRENT_DATE - INTERVAL '30 days') as performance_records;

-- PART 7: Test query
SELECT 
    branch_id,
    branch_name,
    region,
    branch_type,
    performance_score,
    total_collected,
    collection_rate,
    total_cases,
    active_cases,
    resolved_cases
FROM kastle_banking.branch_summary_view
ORDER BY performance_score DESC
LIMIT 10;