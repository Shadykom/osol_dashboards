-- Safe Collection Summary Data Insert
-- This script handles the unique constraint on summary_date properly

-- First, check if we need to modify the constraint to include branch_id
-- This would be the ideal solution, but requires altering the existing constraint
DO $$ 
BEGIN
    -- Check if the constraint exists
    IF EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'daily_collection_summary_summary_date_key' 
        AND conrelid = 'kastle_banking.daily_collection_summary'::regclass
    ) THEN
        -- For now, we'll work with the existing constraint
        -- In production, you might want to drop and recreate the constraint to include branch_id
        RAISE NOTICE 'Unique constraint on summary_date exists. Will insert data for one branch per date.';
    END IF;
END $$;

-- Insert data for the primary branch only (to avoid duplicate key errors)
-- We'll use RYD_MAIN as the primary branch
INSERT INTO kastle_banking.daily_collection_summary (
    summary_date,
    branch_id,
    total_due_amount,
    total_collected,
    collection_rate,
    accounts_due,
    accounts_collected,
    calls_made,
    contacts_successful,
    ptps_obtained,
    ptps_kept,
    field_visits_done,
    legal_notices_sent,
    digital_payments,
    total_cases,
    total_outstanding,
    ptps_created
)
SELECT 
    date_series.date::DATE,
    'RYD_MAIN', -- Using only one branch to avoid conflicts
    200000 + (RANDOM() * 300000)::NUMERIC(18,2),
    50000 + (RANDOM() * 150000)::NUMERIC(18,2),
    25 + (RANDOM() * 35)::NUMERIC(5,2),
    150 + (RANDOM() * 100)::INTEGER,
    50 + (RANDOM() * 50)::INTEGER,
    200 + (RANDOM() * 300)::INTEGER,
    100 + (RANDOM() * 150)::INTEGER,
    20 + (RANDOM() * 30)::INTEGER,
    15 + (RANDOM() * 20)::INTEGER,
    10 + (RANDOM() * 20)::INTEGER,
    5 + (RANDOM() * 10)::INTEGER,
    30 + (RANDOM() * 50)::INTEGER,
    150 + (RANDOM() * 50)::INTEGER,
    500000 + (RANDOM() * 1000000)::NUMERIC(15,2),
    20 + (RANDOM() * 30)::INTEGER
FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE),
    CURRENT_DATE,
    '1 day'::INTERVAL
) AS date_series(date)
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.daily_collection_summary 
    WHERE summary_date = date_series.date::DATE
)
ON CONFLICT (summary_date) DO UPDATE SET
    -- Update existing records with aggregated values
    total_due_amount = EXCLUDED.total_due_amount,
    total_collected = EXCLUDED.total_collected,
    collection_rate = EXCLUDED.collection_rate,
    accounts_due = EXCLUDED.accounts_due,
    accounts_collected = EXCLUDED.accounts_collected,
    calls_made = EXCLUDED.calls_made,
    contacts_successful = EXCLUDED.contacts_successful,
    ptps_obtained = EXCLUDED.ptps_obtained,
    ptps_kept = EXCLUDED.ptps_kept,
    field_visits_done = EXCLUDED.field_visits_done,
    legal_notices_sent = EXCLUDED.legal_notices_sent,
    digital_payments = EXCLUDED.digital_payments,
    total_cases = EXCLUDED.total_cases,
    total_outstanding = EXCLUDED.total_outstanding,
    ptps_created = EXCLUDED.ptps_created;

-- Also add some historical data for the previous month
INSERT INTO kastle_banking.daily_collection_summary (
    summary_date,
    branch_id,
    total_due_amount,
    total_collected,
    collection_rate,
    accounts_due,
    accounts_collected,
    calls_made,
    contacts_successful,
    ptps_obtained,
    ptps_kept,
    field_visits_done,
    legal_notices_sent,
    digital_payments,
    total_cases,
    total_outstanding,
    ptps_created
)
SELECT 
    date_series.date::DATE,
    'RYD_MAIN', -- Using only one branch to avoid conflicts
    180000 + (RANDOM() * 280000)::NUMERIC(18,2),
    45000 + (RANDOM() * 140000)::NUMERIC(18,2),
    23 + (RANDOM() * 32)::NUMERIC(5,2),
    140 + (RANDOM() * 90)::INTEGER,
    45 + (RANDOM() * 45)::INTEGER,
    180 + (RANDOM() * 280)::INTEGER,
    90 + (RANDOM() * 140)::INTEGER,
    18 + (RANDOM() * 28)::INTEGER,
    13 + (RANDOM() * 18)::INTEGER,
    8 + (RANDOM() * 18)::INTEGER,
    4 + (RANDOM() * 9)::INTEGER,
    25 + (RANDOM() * 45)::INTEGER,
    140 + (RANDOM() * 45)::INTEGER,
    480000 + (RANDOM() * 950000)::NUMERIC(15,2),
    18 + (RANDOM() * 28)::INTEGER
FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
    '1 day'::INTERVAL
) AS date_series(date)
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.daily_collection_summary 
    WHERE summary_date = date_series.date::DATE
)
ON CONFLICT (summary_date) DO UPDATE SET
    -- Update existing records with aggregated values
    total_due_amount = EXCLUDED.total_due_amount,
    total_collected = EXCLUDED.total_collected,
    collection_rate = EXCLUDED.collection_rate,
    accounts_due = EXCLUDED.accounts_due,
    accounts_collected = EXCLUDED.accounts_collected,
    calls_made = EXCLUDED.calls_made,
    contacts_successful = EXCLUDED.contacts_successful,
    ptps_obtained = EXCLUDED.ptps_obtained,
    ptps_kept = EXCLUDED.ptps_kept,
    field_visits_done = EXCLUDED.field_visits_done,
    legal_notices_sent = EXCLUDED.legal_notices_sent,
    digital_payments = EXCLUDED.digital_payments,
    total_cases = EXCLUDED.total_cases,
    total_outstanding = EXCLUDED.total_outstanding,
    ptps_created = EXCLUDED.ptps_created;

-- Display summary of what was inserted
SELECT 
    COUNT(*) as total_records,
    MIN(summary_date) as earliest_date,
    MAX(summary_date) as latest_date,
    COUNT(DISTINCT branch_id) as branches_count
FROM kastle_banking.daily_collection_summary
WHERE summary_date >= DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month');