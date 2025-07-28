-- Create executive_delinquency_summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.executive_delinquency_summary (
    id BIGSERIAL PRIMARY KEY,
    snapshot_date DATE NOT NULL,
    current_month_collection DECIMAL(15, 2),
    previous_month_collection DECIMAL(15, 2),
    current_month_delinquency_rate DECIMAL(5, 2),
    previous_month_delinquency_rate DECIMAL(5, 2),
    current_month_recovery_rate DECIMAL(5, 2),
    previous_month_recovery_rate DECIMAL(5, 2),
    ytd_collection DECIMAL(15, 2),
    ytd_target DECIMAL(15, 2),
    ytd_achievement_rate DECIMAL(5, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index on snapshot_date for performance
CREATE INDEX IF NOT EXISTS idx_executive_delinquency_summary_snapshot_date 
ON kastle_banking.executive_delinquency_summary(snapshot_date DESC);

-- Insert sample data if table is empty
INSERT INTO kastle_banking.executive_delinquency_summary (
    snapshot_date,
    current_month_collection,
    previous_month_collection,
    current_month_delinquency_rate,
    previous_month_delinquency_rate,
    current_month_recovery_rate,
    previous_month_recovery_rate,
    ytd_collection,
    ytd_target,
    ytd_achievement_rate
)
SELECT 
    CURRENT_DATE,
    67500000,
    65000000,
    5.0,
    5.2,
    78.5,
    76.8,
    810000000,
    900000000,
    90.0
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.executive_delinquency_summary 
    WHERE snapshot_date = CURRENT_DATE
);

-- Ensure collection_rates has some sample data
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
    75 + (random() * 10) AS collection_rate,
    80 AS target_rate,
    65000000 + (random() * 10000000) AS amount_collected,
    85000000 + (random() * 5000000) AS amount_due,
    NOW() AS created_at,
    NOW() AS updated_at
FROM generate_series(0, 11) AS n
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.collection_rates 
    WHERE period_type = 'MONTHLY'
    AND period_date = date_trunc('month', CURRENT_DATE - INTERVAL '1 month' * n)::date
);

-- Update aging_distribution if needed
UPDATE kastle_banking.aging_distribution
SET updated_at = NOW()
WHERE bucket_name IS NOT NULL;