-- Fix Collection Tables and Views
-- This script ensures all collection-related tables exist in kastle_banking schema

-- Create daily_collection_summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL,
    branch_id VARCHAR(10),
    team_id INTEGER,
    total_due_amount NUMERIC(18,2),
    total_collected NUMERIC(18,2),
    collection_rate NUMERIC(5,2),
    accounts_due INTEGER,
    accounts_collected INTEGER,
    calls_made INTEGER,
    contacts_successful INTEGER,
    ptps_obtained INTEGER,
    ptps_kept INTEGER,
    field_visits_done INTEGER,
    legal_notices_sent INTEGER,
    digital_payments INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_cases INTEGER DEFAULT 0,
    total_outstanding NUMERIC(15,2) DEFAULT 0,
    ptps_created INTEGER DEFAULT 0
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
    date_series.date,
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