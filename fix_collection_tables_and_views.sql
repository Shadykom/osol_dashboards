-- Fix Collection Tables and Views
-- This script ensures all collection-related tables exist in kastle_banking schema

-- Create daily_collection_summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    active_cases INTEGER DEFAULT 0,
    resolved_cases INTEGER DEFAULT 0,
    collection_amount NUMERIC(18,2) DEFAULT 0,
    target_amount NUMERIC(18,2) DEFAULT 0,
    collection_rate NUMERIC(5,2) DEFAULT 0,
    new_cases INTEGER DEFAULT 0,
    closed_cases INTEGER DEFAULT 0,
    branch_id VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on summary_date for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_collection_summary_date 
ON kastle_banking.daily_collection_summary(summary_date);

-- Create index on branch_id
CREATE INDEX IF NOT EXISTS idx_daily_collection_summary_branch 
ON kastle_banking.daily_collection_summary(branch_id);

-- Insert sample data for current month if no data exists
INSERT INTO kastle_banking.daily_collection_summary (
    summary_date,
    total_cases,
    active_cases,
    resolved_cases,
    collection_amount,
    target_amount,
    collection_rate,
    new_cases,
    closed_cases,
    branch_id
)
SELECT 
    date_series.date,
    150 + (RANDOM() * 50)::INTEGER,
    100 + (RANDOM() * 30)::INTEGER,
    20 + (RANDOM() * 10)::INTEGER,
    50000 + (RANDOM() * 100000)::NUMERIC(18,2),
    150000,
    30 + (RANDOM() * 20)::NUMERIC(5,2),
    5 + (RANDOM() * 10)::INTEGER,
    3 + (RANDOM() * 7)::INTEGER,
    CASE 
        WHEN RANDOM() < 0.3 THEN 'RIYADH_MAIN'
        WHEN RANDOM() < 0.6 THEN 'JEDDAH'
        WHEN RANDOM() < 0.8 THEN 'DAMMAM'
        ELSE 'KHOBAR'
    END
FROM generate_series(
    DATE_TRUNC('month', CURRENT_DATE),
    CURRENT_DATE,
    '1 day'::INTERVAL
) AS date_series(date)
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.daily_collection_summary 
    WHERE summary_date = date_series.date::DATE
);

-- Ensure collection_interactions table exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_interactions (
    interaction_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES kastle_banking.collection_cases(case_id),
    interaction_type VARCHAR(30) CHECK (interaction_type IN ('CALL', 'SMS', 'EMAIL', 'VISIT', 'LETTER', 'WHATSAPP')),
    interaction_date DATE NOT NULL,
    interaction_time TIME,
    officer_id VARCHAR(20),
    contact_person VARCHAR(100),
    contact_number VARCHAR(20),
    outcome VARCHAR(50),
    notes TEXT,
    promise_to_pay BOOLEAN DEFAULT FALSE,
    ptp_amount NUMERIC(18,2),
    ptp_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_interactions_case 
ON kastle_banking.collection_interactions(case_id);

CREATE INDEX IF NOT EXISTS idx_collection_interactions_date 
ON kastle_banking.collection_interactions(interaction_date);

-- Ensure promise_to_pay table exists
CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES kastle_banking.collection_cases(case_id),
    ptp_amount NUMERIC(18,2) NOT NULL,
    ptp_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'KEPT', 'BROKEN', 'CANCELLED')),
    created_by VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    kept_amount NUMERIC(18,2),
    kept_date DATE,
    notes TEXT
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case 
ON kastle_banking.promise_to_pay(case_id);

CREATE INDEX IF NOT EXISTS idx_promise_to_pay_status 
ON kastle_banking.promise_to_pay(status);

-- Grant permissions
GRANT ALL ON kastle_banking.daily_collection_summary TO authenticated;
GRANT ALL ON kastle_banking.collection_interactions TO authenticated;
GRANT ALL ON kastle_banking.promise_to_pay TO authenticated;

-- Grant sequence permissions
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.daily_collection_summary_summary_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.collection_interactions_interaction_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.promise_to_pay_ptp_id_seq TO authenticated;

-- Enable RLS
ALTER TABLE kastle_banking.daily_collection_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.promise_to_pay ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Enable all access for authenticated users" ON kastle_banking.daily_collection_summary
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON kastle_banking.collection_interactions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all access for authenticated users" ON kastle_banking.promise_to_pay
    FOR ALL USING (true) WITH CHECK (true);

-- Refresh schema cache
NOTIFY pgrst, 'reload schema';