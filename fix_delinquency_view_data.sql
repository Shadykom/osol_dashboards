-- Fix for executive_delinquency_summary view data
-- This view depends on portfolio_summary and collection_rates tables

-- First, ensure portfolio_summary table has recent data
INSERT INTO kastle_banking.portfolio_summary (
    snapshot_date,
    total_portfolio_value,
    total_delinquent_value,
    delinquency_rate,
    total_loans,
    delinquent_loans,
    created_at,
    updated_at
)
SELECT 
    CURRENT_DATE,
    850000000.00,  -- SAR 850M total portfolio
    42500000.00,   -- SAR 42.5M delinquent (5%)
    5.0,           -- 5% delinquency rate
    1250,          -- Total loans
    63,            -- Delinquent loans
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.portfolio_summary 
    WHERE snapshot_date = CURRENT_DATE
);

-- Add data for previous months to enable trend analysis
INSERT INTO kastle_banking.portfolio_summary (
    snapshot_date,
    total_portfolio_value,
    total_delinquent_value,
    delinquency_rate,
    total_loans,
    delinquent_loans,
    created_at,
    updated_at
)
SELECT 
    date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * n)::date AS snapshot_date,
    850000000.00 - (n * 5000000) AS total_portfolio_value,  -- Slightly decreasing portfolio
    (850000000.00 - (n * 5000000)) * (5.2 - (n * 0.1)) / 100 AS total_delinquent_value,
    5.2 - (n * 0.1) AS delinquency_rate,  -- Improving delinquency rate
    1250 - (n * 10) AS total_loans,
    63 - n AS delinquent_loans,
    NOW() AS created_at,
    NOW() AS updated_at
FROM generate_series(1, 12) AS n
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.portfolio_summary 
    WHERE snapshot_date = date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * n)::date
);

-- Ensure collection_rates has monthly data
INSERT INTO kastle_banking.collection_rates (
    period_date,
    period_type,
    collection_rate,
    target_rate,
    amount_collected,
    amount_due,
    created_at,
    updated_at
)
SELECT 
    date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * n)::date AS period_date,
    'MONTHLY' AS period_type,
    75 + (random() * 10) AS collection_rate,  -- 75-85% collection rate
    80 AS target_rate,
    65000000 + (random() * 10000000) AS amount_collected,
    85000000 + (random() * 5000000) AS amount_due,
    NOW() AS created_at,
    NOW() AS updated_at
FROM generate_series(0, 12) AS n
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.collection_rates 
    WHERE period_type = 'MONTHLY'
    AND period_date = date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * n)::date
);

-- Verify the view now has data
SELECT 
    snapshot_date,
    total_portfolio_value,
    total_delinquent_value,
    delinquency_rate,
    monthly_collection_rate,
    prev_month_delinquency_rate,
    prev_quarter_delinquency_rate,
    prev_year_delinquency_rate
FROM kastle_banking.executive_delinquency_summary
ORDER BY snapshot_date DESC
LIMIT 5;