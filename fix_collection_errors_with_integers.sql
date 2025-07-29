-- Fix Collection Database Errors (Integer IDs Version)
-- This version uses integer IDs for team_id to match existing schema

-- 1. First, ensure schemas exist and have proper permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;

-- 2. Fix missing column 'total_outstanding' in collection_cases
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;

-- Update total_outstanding from loan_accounts if possible
UPDATE kastle_banking.collection_cases cc
SET total_outstanding = la.outstanding_balance
FROM kastle_banking.loan_accounts la
WHERE cc.loan_account_number = la.loan_account_number
AND cc.total_outstanding = 0;

-- 3. Fix missing column 'days_past_due' in collection_cases
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS days_past_due INTEGER DEFAULT 0;

-- Update days_past_due from loan_accounts if possible
UPDATE kastle_banking.collection_cases cc
SET days_past_due = la.overdue_days
FROM kastle_banking.loan_accounts la
WHERE cc.loan_account_number = la.loan_account_number
AND cc.days_past_due = 0;

-- 4. Create missing table 'daily_collection_summary' in kastle_collection schema
CREATE TABLE IF NOT EXISTS kastle_collection.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_outstanding DECIMAL(15,2) DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    accounts_due INTEGER DEFAULT 0,
    accounts_collected INTEGER DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    ptps_created INTEGER DEFAULT 0,
    ptps_kept INTEGER DEFAULT 0,
    new_cases INTEGER DEFAULT 0,
    closed_cases INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index on summary_date for better query performance
CREATE INDEX IF NOT EXISTS idx_daily_collection_summary_date 
ON kastle_collection.daily_collection_summary(summary_date);

-- 5. Disable Row Level Security on all affected tables
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customer_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_buckets DISABLE ROW LEVEL SECURITY;

ALTER TABLE kastle_collection.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.promise_to_pay DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- 6. Grant proper permissions
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;

-- 7. Insert sample data using integer IDs
-- First, insert teams with integer IDs
INSERT INTO kastle_collection.collection_teams (
    team_id, team_name, team_type, status
) VALUES 
    (1, 'فريق التحصيل الرئيسي', 'FIELD', 'ACTIVE'),
    (2, 'فريق مركز الاتصال', 'CALL_CENTER', 'ACTIVE')
ON CONFLICT (team_id) DO NOTHING;

-- Then insert officers with integer team_id references
INSERT INTO kastle_collection.collection_officers (
    officer_id, officer_name, officer_type, team_id, 
    contact_number, email, status
) VALUES 
    ('OFF001', 'أحمد محمد', 'SENIOR', 1, '+966501234567', 'ahmed@example.com', 'ACTIVE'),
    ('OFF002', 'فاطمة علي', 'JUNIOR', 1, '+966502345678', 'fatima@example.com', 'ACTIVE'),
    ('OFF003', 'محمد سالم', 'FIELD', 2, '+966503456789', 'mohammed@example.com', 'ACTIVE'),
    ('OFF004', 'نورا خالد', 'CALL_CENTER', 2, '+966504567890', 'nora@example.com', 'ACTIVE')
ON CONFLICT (officer_id) DO NOTHING;

-- Insert sample daily collection summary data
INSERT INTO kastle_collection.daily_collection_summary (
    summary_date, total_cases, total_outstanding, total_collected, 
    collection_rate, accounts_due, accounts_collected, calls_made, 
    ptps_created, ptps_kept
)
SELECT 
    CURRENT_DATE - (n || ' days')::INTERVAL,
    150 + (RANDOM() * 20)::INT,
    2500000 + (RANDOM() * 500000)::DECIMAL,
    100000 + (RANDOM() * 50000)::DECIMAL,
    4 + (RANDOM() * 2)::DECIMAL,
    100 + (RANDOM() * 20)::INT,
    20 + (RANDOM() * 10)::INT,
    200 + (RANDOM() * 50)::INT,
    30 + (RANDOM() * 10)::INT,
    20 + (RANDOM() * 5)::INT
FROM generate_series(0, 180) n
ON CONFLICT DO NOTHING;

-- 8. Create missing officer_performance_summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_summary (
    summary_id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    contact_rate DECIMAL(5,2) DEFAULT 0,
    ptp_rate DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(officer_id, summary_date)
);

-- 9. Verify the fixes
SELECT 'Collection Cases Columns' as check_type, 
       column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_cases'
AND column_name IN ('total_outstanding', 'days_past_due');

SELECT 'Daily Collection Summary Table' as check_type,
       EXISTS (
           SELECT 1 FROM information_schema.tables 
           WHERE table_schema = 'kastle_collection' 
           AND table_name = 'daily_collection_summary'
       ) as exists;

SELECT 'Collection Officers Count' as check_type,
       COUNT(*) as count
FROM kastle_collection.collection_officers;

SELECT 'Collection Teams Count' as check_type,
       COUNT(*) as count
FROM kastle_collection.collection_teams;