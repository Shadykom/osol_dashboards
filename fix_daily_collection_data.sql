-- Fix daily_collection_summary data
-- This script inserts sample data into the existing table

-- Insert sample data for current month if no data exists
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
    CASE 
        WHEN RANDOM() < 0.3 THEN 'RIYADH_MAIN'
        WHEN RANDOM() < 0.6 THEN 'JEDDAH'
        WHEN RANDOM() < 0.8 THEN 'DAMMAM'
        ELSE 'KHOBAR'
    END,
    200000 + (RANDOM() * 300000)::NUMERIC(18,2), -- total_due_amount
    50000 + (RANDOM() * 150000)::NUMERIC(18,2), -- total_collected
    25 + (RANDOM() * 35)::NUMERIC(5,2), -- collection_rate
    150 + (RANDOM() * 100)::INTEGER, -- accounts_due
    50 + (RANDOM() * 50)::INTEGER, -- accounts_collected
    200 + (RANDOM() * 300)::INTEGER, -- calls_made
    100 + (RANDOM() * 150)::INTEGER, -- contacts_successful
    20 + (RANDOM() * 30)::INTEGER, -- ptps_obtained
    15 + (RANDOM() * 20)::INTEGER, -- ptps_kept
    10 + (RANDOM() * 20)::INTEGER, -- field_visits_done
    5 + (RANDOM() * 10)::INTEGER, -- legal_notices_sent
    30 + (RANDOM() * 50)::INTEGER, -- digital_payments
    150 + (RANDOM() * 50)::INTEGER, -- total_cases
    500000 + (RANDOM() * 1000000)::NUMERIC(15,2), -- total_outstanding
    20 + (RANDOM() * 30)::INTEGER -- ptps_created
FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE),
    CURRENT_DATE,
    '1 day'::INTERVAL
) AS date_series(date)
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.daily_collection_summary 
    WHERE summary_date = date_series.date::DATE
);

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
    CASE 
        WHEN RANDOM() < 0.3 THEN 'RIYADH_MAIN'
        WHEN RANDOM() < 0.6 THEN 'JEDDAH'
        WHEN RANDOM() < 0.8 THEN 'DAMMAM'
        ELSE 'KHOBAR'
    END,
    180000 + (RANDOM() * 280000)::NUMERIC(18,2), -- total_due_amount
    45000 + (RANDOM() * 140000)::NUMERIC(18,2), -- total_collected
    23 + (RANDOM() * 32)::NUMERIC(5,2), -- collection_rate
    140 + (RANDOM() * 90)::INTEGER, -- accounts_due
    45 + (RANDOM() * 45)::INTEGER, -- accounts_collected
    180 + (RANDOM() * 280)::INTEGER, -- calls_made
    90 + (RANDOM() * 140)::INTEGER, -- contacts_successful
    18 + (RANDOM() * 28)::INTEGER, -- ptps_obtained
    13 + (RANDOM() * 18)::INTEGER, -- ptps_kept
    8 + (RANDOM() * 18)::INTEGER, -- field_visits_done
    4 + (RANDOM() * 9)::INTEGER, -- legal_notices_sent
    25 + (RANDOM() * 45)::INTEGER, -- digital_payments
    140 + (RANDOM() * 45)::INTEGER, -- total_cases
    480000 + (RANDOM() * 950000)::NUMERIC(15,2), -- total_outstanding
    18 + (RANDOM() * 28)::INTEGER -- ptps_created
FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE - INTERVAL '1 month'),
    DATE_TRUNC('month', CURRENT_DATE) - INTERVAL '1 day',
    '1 day'::INTERVAL
) AS date_series(date)
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.daily_collection_summary 
    WHERE summary_date = date_series.date::DATE
);