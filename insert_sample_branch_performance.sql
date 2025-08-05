-- Insert sample branch performance data for testing
-- This script inserts sample data into branch_collection_performance table

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
BEGIN
    -- Loop through each active branch
    FOR branch_record IN 
        SELECT branch_id 
        FROM kastle_banking.branches 
        WHERE is_active = true
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
            
            -- Insert or update performance data
            INSERT INTO kastle_banking.branch_collection_performance (
                branch_id,
                performance_date,
                total_cases,
                active_cases,
                resolved_cases,
                total_outstanding,
                total_collected,
                collected_amount,
                collection_rate,
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
                100 + floor(random() * 200), -- 100-300 cases
                50 + floor(random() * 100),  -- 50-150 active cases
                30 + floor(random() * 70),   -- 30-100 resolved cases
                base_outstanding,
                base_collection * collection_variance,
                base_collection * collection_variance * 0.9, -- 90% of total collected
                60 + (random() * 35), -- 60-95% collection rate
                5 + (random() * 15),  -- 5-20% delinquency rate
                15 + (random() * 45), -- 15-60 days average DPD
                200 + floor(random() * 300), -- 200-500 calls
                100 + floor(random() * 200), -- 100-300 SMS
                50 + floor(random() * 150),  -- 50-200 emails
                70 + (random() * 25), -- 70-95% contact rate
                40 + (random() * 30), -- 40-70% PTP rate
                60 + (random() * 30), -- 60-90% PTP kept rate
                50 + (random() * 40), -- 50-90% PTP success rate
                5 + floor(random() * 15), -- 5-20 remediation cases
                10000 + (random() * 40000) -- 10k-50k remediation amount
            )
            ON CONFLICT (branch_id, performance_date) 
            DO UPDATE SET
                total_collected = EXCLUDED.total_collected,
                collection_rate = EXCLUDED.collection_rate,
                updated_at = CURRENT_TIMESTAMP;
        END LOOP;
    END LOOP;
END $$;

-- Verify the data was inserted
SELECT 
    b.branch_id,
    b.branch_name,
    b.state as region,
    COUNT(bcp.id) as performance_records,
    AVG(bcp.collection_rate) as avg_collection_rate,
    SUM(bcp.total_collected) as total_collected
FROM kastle_banking.branches b
LEFT JOIN kastle_banking.branch_collection_performance bcp 
    ON b.branch_id = bcp.branch_id
    AND bcp.performance_date >= CURRENT_DATE - INTERVAL '30 days'
WHERE b.is_active = true
GROUP BY b.branch_id, b.branch_name, b.state
ORDER BY b.branch_id;

-- Check if views are working
SELECT COUNT(*) as view_count FROM kastle_banking.branch_summary_view;
SELECT COUNT(*) as history_count FROM kastle_banking.branch_performance_history_view;