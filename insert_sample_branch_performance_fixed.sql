-- Insert sample branch performance data for testing (FIXED VERSION)
-- This script inserts sample data into branch_collection_performance table using actual column names

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
    date_column_name TEXT;
BEGIN
    -- Check which date column exists
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_schema = 'kastle_banking' 
               AND table_name = 'branch_collection_performance' 
               AND column_name = 'period_date') THEN
        date_column_name := 'period_date';
    ELSE
        date_column_name := 'performance_date';
    END IF;

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
            
            -- Insert performance data based on existing columns
            IF date_column_name = 'period_date' THEN
                INSERT INTO kastle_banking.branch_collection_performance (
                    branch_id,
                    period_date,
                    total_delinquent_amount,
                    total_collected_amount,
                    collection_rate,
                    number_of_accounts
                ) VALUES (
                    branch_record.branch_id,
                    date_counter,
                    base_outstanding,
                    base_collection * collection_variance,
                    60 + (random() * 35), -- 60-95% collection rate
                    100 + floor(random() * 200) -- 100-300 accounts
                )
                ON CONFLICT (branch_id, period_date) 
                DO UPDATE SET
                    total_collected_amount = EXCLUDED.total_collected_amount,
                    collection_rate = EXCLUDED.collection_rate;
            ELSE
                -- Use performance_date if it exists
                EXECUTE format('
                    INSERT INTO kastle_banking.branch_collection_performance (
                        branch_id,
                        %I,
                        total_delinquent_amount,
                        total_collected_amount,
                        collection_rate,
                        number_of_accounts
                    ) VALUES (
                        $1, $2, $3, $4, $5, $6
                    )
                    ON CONFLICT (branch_id, %I) 
                    DO UPDATE SET
                        total_collected_amount = EXCLUDED.total_collected_amount,
                        collection_rate = EXCLUDED.collection_rate
                ', date_column_name, date_column_name)
                USING 
                    branch_record.branch_id,
                    date_counter,
                    base_outstanding,
                    base_collection * collection_variance,
                    60 + (random() * 35),
                    100 + floor(random() * 200);
            END IF;
            
            -- Update additional columns if they exist
            EXECUTE format('
                UPDATE kastle_banking.branch_collection_performance
                SET total_outstanding = COALESCE(total_outstanding, total_delinquent_amount),
                    delinquency_rate = COALESCE(delinquency_rate, 5 + (random() * 15)),
                    avg_dpd = COALESCE(avg_dpd, 15 + (random() * 45)),
                    total_calls = COALESCE(total_calls, 200 + floor(random() * 300)),
                    total_sms = COALESCE(total_sms, 100 + floor(random() * 200)),
                    total_emails = COALESCE(total_emails, 50 + floor(random() * 150)),
                    contact_rate = COALESCE(contact_rate, 70 + (random() * 25)),
                    ptp_rate = COALESCE(ptp_rate, 40 + (random() * 30)),
                    ptp_kept_rate = COALESCE(ptp_kept_rate, 60 + (random() * 30))
                WHERE branch_id = $1 AND %I = $2
            ', date_column_name)
            USING branch_record.branch_id, date_counter;
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
    SUM(bcp.total_collected_amount) as total_collected
FROM kastle_banking.branches b
LEFT JOIN kastle_banking.branch_collection_performance bcp 
    ON b.branch_id = bcp.branch_id
    AND (bcp.period_date >= CURRENT_DATE - INTERVAL '30 days' 
         OR bcp.performance_date >= CURRENT_DATE - INTERVAL '30 days')
WHERE b.is_active = true
GROUP BY b.branch_id, b.branch_name, b.state
ORDER BY b.branch_id;

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

-- Check if views are working
SELECT 'branch_summary_view' as view_name, COUNT(*) as record_count 
FROM kastle_banking.branch_summary_view
UNION ALL
SELECT 'branch_performance_history_view', COUNT(*) 
FROM kastle_banking.branch_performance_history_view
WHERE performance_date >= CURRENT_DATE - INTERVAL '7 days';