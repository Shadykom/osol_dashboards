-- Insert sample branch performance data (FINAL VERSION)
-- Based on the actual table schema with performance_date as the primary date column

-- First, ensure we have some branches with proper regions
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

-- Insert performance data for the last 30 days
DO $$
DECLARE
    branch_record RECORD;
    date_counter DATE;
    base_collection DECIMAL;
    base_outstanding DECIMAL;
    collection_variance DECIMAL;
    active_ratio DECIMAL;
BEGIN
    -- Loop through each active branch
    FOR branch_record IN 
        SELECT branch_id 
        FROM kastle_banking.branches 
        WHERE is_active = true
        LIMIT 10 -- Limit to first 10 branches for testing
    LOOP
        -- Generate data for the last 30 days
        FOR date_counter IN 
            SELECT generate_series(
                CURRENT_DATE - INTERVAL '30 days',
                CURRENT_DATE,
                '1 day'::interval
            )::date
        LOOP
            -- Random base values for each branch
            base_collection := 50000 + (random() * 100000);
            base_outstanding := 200000 + (random() * 300000);
            collection_variance := 0.8 + (random() * 0.4); -- 80% to 120% variance
            active_ratio := 0.3 + (random() * 0.4); -- 30% to 70% active cases
            
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
                date_counter, -- period_date
                date_counter, -- performance_date (same as period_date)
                base_outstanding,
                base_collection * collection_variance,
                60 + (random() * 35), -- 60-95% collection rate
                100 + floor(random() * 200), -- 100-300 accounts
                floor((100 + floor(random() * 200)) * active_ratio), -- active cases
                floor((100 + floor(random() * 200)) * (1 - active_ratio)), -- resolved cases
                base_outstanding * 1.1, -- total outstanding slightly higher than delinquent
                5 + (random() * 15), -- 5-20% delinquency rate
                15 + (random() * 45), -- 15-60 days average DPD
                200 + floor(random() * 300), -- 200-500 calls
                100 + floor(random() * 200), -- 100-300 SMS
                50 + floor(random() * 150), -- 50-200 emails
                70 + (random() * 25), -- 70-95% contact rate
                40 + (random() * 30), -- 40-70% PTP rate
                60 + (random() * 30), -- 60-90% PTP kept rate
                50 + (random() * 40), -- 50-90% PTP success rate
                5 + floor(random() * 15), -- 5-20 remediation cases
                10000 + (random() * 40000) -- 10k-50k remediation amount
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

-- Insert some sample officer performance data if the table is empty
INSERT INTO kastle_banking.officer_performance_summary (
    officer_id,
    summary_date,
    total_collected,
    total_cases,
    active_cases,
    collection_rate,
    success_rate,
    contacts_made,
    promises_made,
    promises_kept
)
SELECT 
    co.officer_id,
    CURRENT_DATE,
    50000 + (random() * 100000),
    20 + floor(random() * 80),
    10 + floor(random() * 40),
    60 + (random() * 35),
    50 + (random() * 40),
    50 + floor(random() * 150),
    10 + floor(random() * 40),
    5 + floor(random() * 35)
FROM kastle_banking.collection_officers co
WHERE co.is_active = true
AND NOT EXISTS (
    SELECT 1 FROM kastle_banking.officer_performance_summary ops
    WHERE ops.officer_id = co.officer_id
    AND ops.summary_date = CURRENT_DATE
)
LIMIT 50; -- Insert for first 50 officers only

-- Verify the data was inserted
SELECT 
    b.branch_id,
    b.branch_name,
    b.state as region,
    COUNT(bcp.id) as performance_records,
    AVG(bcp.collection_rate) as avg_collection_rate,
    SUM(bcp.total_collected_amount) as total_collected,
    MAX(bcp.performance_date) as latest_date
FROM kastle_banking.branches b
LEFT JOIN kastle_banking.branch_collection_performance bcp 
    ON b.branch_id = bcp.branch_id
    AND bcp.performance_date >= CURRENT_DATE - INTERVAL '30 days'
WHERE b.is_active = true
GROUP BY b.branch_id, b.branch_name, b.state
ORDER BY b.branch_id
LIMIT 10;

-- Check if views are working
SELECT 'branch_summary_view' as view_name, COUNT(*) as record_count 
FROM kastle_banking.branch_summary_view
WHERE performance_date >= CURRENT_DATE - INTERVAL '7 days';