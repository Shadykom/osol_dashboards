-- Fix Collection Schema Issues
-- This script creates the kastle_collection schema and all required tables
-- Note: collection_cases already exists in kastle_banking, but app expects it in kastle_collection

-- 1. Create kastle_collection schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- 2. Grant permissions on the schema
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;

-- 3. Create collection_teams table
CREATE TABLE IF NOT EXISTS kastle_collection.collection_teams (
    team_id INTEGER PRIMARY KEY,
    team_code VARCHAR(20) UNIQUE,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50) NOT NULL,
    manager_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create collection_officers table
CREATE TABLE IF NOT EXISTS kastle_collection.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    officer_code VARCHAR(20) UNIQUE,
    officer_name VARCHAR(100) NOT NULL,
    officer_type VARCHAR(50) NOT NULL,
    team_id INTEGER REFERENCES kastle_collection.collection_teams(team_id),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create collection_buckets table
CREATE TABLE IF NOT EXISTS kastle_collection.collection_buckets (
    bucket_id VARCHAR(50) PRIMARY KEY,
    bucket_name VARCHAR(100) NOT NULL,
    bucket_code VARCHAR(20) UNIQUE,
    min_days INTEGER NOT NULL,
    max_days INTEGER NOT NULL,
    priority_level VARCHAR(20),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create collection_cases table (simplified version that references kastle_banking data)
-- This is a bridge table that connects to the existing collection_cases in kastle_banking
CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id VARCHAR(50) PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    loan_account_number VARCHAR(50) NOT NULL,
    customer_id VARCHAR(50) NOT NULL,
    total_outstanding DECIMAL(15,2) DEFAULT 0,
    days_past_due INTEGER DEFAULT 0,
    case_status VARCHAR(50) DEFAULT 'ACTIVE',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    bucket_id VARCHAR(50) REFERENCES kastle_collection.collection_buckets(bucket_id),
    assigned_to VARCHAR(50) REFERENCES kastle_collection.collection_officers(officer_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolution_type VARCHAR(50),
    resolution_amount DECIMAL(15,2)
);

-- 7. Create collection_interactions table
CREATE TABLE IF NOT EXISTS kastle_collection.collection_interactions (
    interaction_id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) REFERENCES kastle_collection.collection_cases(case_id),
    officer_id VARCHAR(50) REFERENCES kastle_collection.collection_officers(officer_id),
    interaction_type VARCHAR(50) NOT NULL,
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    channel VARCHAR(50),
    outcome VARCHAR(50),
    notes TEXT,
    next_action VARCHAR(100),
    next_action_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create promise_to_pay table
CREATE TABLE IF NOT EXISTS kastle_collection.promise_to_pay (
    ptp_id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50) REFERENCES kastle_collection.collection_cases(case_id),
    promised_amount DECIMAL(15,2) NOT NULL,
    promise_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_by VARCHAR(50) REFERENCES kastle_collection.collection_officers(officer_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kept_amount DECIMAL(15,2),
    kept_date DATE,
    broken_reason VARCHAR(200)
);

-- 9. Create daily_collection_summary table
CREATE TABLE IF NOT EXISTS kastle_collection.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL UNIQUE,
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

-- 10. Create officer_performance_summary table
CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_summary (
    summary_id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL REFERENCES kastle_collection.collection_officers(officer_id),
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

-- 11. Grant permissions on all tables
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;

-- 12. Disable RLS on all tables
ALTER TABLE kastle_collection.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.promise_to_pay DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- 13. Insert sample data

-- Insert buckets
INSERT INTO kastle_collection.collection_buckets (bucket_id, bucket_name, bucket_code, min_days, max_days) VALUES
    ('BUCKET_1', '1-30 Days', 'B1', 1, 30),
    ('BUCKET_2', '31-60 Days', 'B2', 31, 60),
    ('BUCKET_3', '61-90 Days', 'B3', 61, 90),
    ('BUCKET_4', '91-120 Days', 'B4', 91, 120),
    ('BUCKET_5', '120+ Days', 'B5', 121, 9999)
ON CONFLICT (bucket_id) DO NOTHING;

-- Insert teams
INSERT INTO kastle_collection.collection_teams (team_id, team_code, team_name, team_type) VALUES
    (1, 'TEAM_A', 'Field Collection Team', 'FIELD'),
    (2, 'TEAM_B', 'Call Center Team', 'CALL_CENTER'),
    (3, 'TEAM_C', 'Digital Collection Team', 'DIGITAL'),
    (4, 'TEAM_D', 'Legal Team', 'LEGAL')
ON CONFLICT (team_id) DO NOTHING;

-- Insert officers
INSERT INTO kastle_collection.collection_officers (officer_id, officer_code, officer_name, officer_type, team_id, contact_number, email) VALUES
    ('OFF001', 'O001', 'Ahmed Mohammed', 'SENIOR', 1, '+966501234567', 'ahmed@example.com'),
    ('OFF002', 'O002', 'Fatima Ali', 'JUNIOR', 1, '+966502345678', 'fatima@example.com'),
    ('OFF003', 'O003', 'Mohammed Salem', 'FIELD', 2, '+966503456789', 'mohammed@example.com'),
    ('OFF004', 'O004', 'Nora Khalid', 'CALL_CENTER', 2, '+966504567890', 'nora@example.com'),
    ('OFF005', 'O005', 'Omar Hassan', 'SENIOR', 3, '+966505678901', 'omar@example.com'),
    ('OFF006', 'O006', 'Sara Ahmed', 'JUNIOR', 3, '+966506789012', 'sara@example.com')
ON CONFLICT (officer_id) DO NOTHING;

-- Migrate collection cases from kastle_banking to kastle_collection
-- Only migrate if kastle_collection.collection_cases is empty
INSERT INTO kastle_collection.collection_cases (
    case_id, case_number, loan_account_number, customer_id, 
    total_outstanding, days_past_due, case_status, priority, 
    bucket_id, assigned_to, created_at, updated_at
)
SELECT 
    'CASE' || LPAD(cc.case_id::TEXT, 6, '0'),
    cc.case_number,
    COALESCE(cc.loan_account_number, cc.account_number),
    cc.customer_id,
    cc.total_outstanding,
    cc.days_past_due,
    cc.case_status,
    cc.priority,
    CASE 
        WHEN cc.days_past_due > 120 THEN 'BUCKET_5'
        WHEN cc.days_past_due > 90 THEN 'BUCKET_4'
        WHEN cc.days_past_due > 60 THEN 'BUCKET_3'
        WHEN cc.days_past_due > 30 THEN 'BUCKET_2'
        ELSE 'BUCKET_1'
    END,
    CASE 
        WHEN cc.assigned_to IN ('OFF001', 'OFF002', 'OFF003', 'OFF004', 'OFF005', 'OFF006') 
        THEN cc.assigned_to
        ELSE 'OFF001'  -- Default assignment
    END,
    cc.created_at,
    cc.updated_at
FROM kastle_banking.collection_cases cc
WHERE NOT EXISTS (SELECT 1 FROM kastle_collection.collection_cases)
LIMIT 100
ON CONFLICT (case_id) DO NOTHING;

-- If no cases were migrated, create sample cases from loan accounts
INSERT INTO kastle_collection.collection_cases (case_id, case_number, loan_account_number, customer_id, total_outstanding, days_past_due, case_status, priority, bucket_id, assigned_to)
SELECT 
    'CASE' || LPAD(ROW_NUMBER() OVER()::TEXT, 6, '0'),
    'CC-2024-' || LPAD(ROW_NUMBER() OVER()::TEXT, 6, '0'),
    la.loan_account_number,
    la.customer_id,
    la.outstanding_balance,
    COALESCE(la.overdue_days, 0),
    CASE 
        WHEN la.loan_status = 'DEFAULTED' THEN 'ACTIVE'
        WHEN la.loan_status = 'WRITTEN_OFF' THEN 'WRITTEN_OFF'
        ELSE 'ACTIVE'
    END,
    CASE 
        WHEN COALESCE(la.overdue_days, 0) > 90 THEN 'CRITICAL'
        WHEN COALESCE(la.overdue_days, 0) > 60 THEN 'HIGH'
        WHEN COALESCE(la.overdue_days, 0) > 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END,
    CASE 
        WHEN COALESCE(la.overdue_days, 0) > 120 THEN 'BUCKET_5'
        WHEN COALESCE(la.overdue_days, 0) > 90 THEN 'BUCKET_4'
        WHEN COALESCE(la.overdue_days, 0) > 60 THEN 'BUCKET_3'
        WHEN COALESCE(la.overdue_days, 0) > 30 THEN 'BUCKET_2'
        ELSE 'BUCKET_1'
    END,
    CASE (ROW_NUMBER() OVER() % 6)
        WHEN 1 THEN 'OFF001'
        WHEN 2 THEN 'OFF002'
        WHEN 3 THEN 'OFF003'
        WHEN 4 THEN 'OFF004'
        WHEN 5 THEN 'OFF005'
        ELSE 'OFF006'
    END
FROM kastle_banking.loan_accounts la
WHERE la.loan_status IN ('DEFAULTED', 'DELINQUENT', 'WRITTEN_OFF')
AND la.outstanding_balance > 0
AND NOT EXISTS (SELECT 1 FROM kastle_collection.collection_cases WHERE loan_account_number = la.loan_account_number)
LIMIT 50
ON CONFLICT (case_id) DO NOTHING;

-- Insert daily collection summary data for the last 30 days
INSERT INTO kastle_collection.daily_collection_summary (
    summary_date, total_cases, total_outstanding, total_collected, 
    collection_rate, accounts_due, accounts_collected, calls_made, 
    ptps_created, ptps_kept, new_cases, closed_cases
)
SELECT 
    CURRENT_DATE - (n || ' days')::INTERVAL,
    150 + (RANDOM() * 50)::INT,
    2500000 + (RANDOM() * 1000000)::DECIMAL,
    100000 + (RANDOM() * 100000)::DECIMAL,
    3 + (RANDOM() * 4)::DECIMAL,
    100 + (RANDOM() * 50)::INT,
    20 + (RANDOM() * 20)::INT,
    200 + (RANDOM() * 100)::INT,
    30 + (RANDOM() * 20)::INT,
    20 + (RANDOM() * 10)::INT,
    5 + (RANDOM() * 10)::INT,
    3 + (RANDOM() * 7)::INT
FROM generate_series(0, 30) n
ON CONFLICT (summary_date) DO NOTHING;

-- Insert officer performance data
INSERT INTO kastle_collection.officer_performance_summary (
    officer_id, summary_date, total_cases, total_collected, 
    total_calls, contact_rate, ptp_rate, quality_score
)
SELECT 
    o.officer_id,
    CURRENT_DATE - (n || ' days')::INTERVAL,
    10 + (RANDOM() * 10)::INT,
    50000 + (RANDOM() * 50000)::DECIMAL,
    20 + (RANDOM() * 20)::INT,
    70 + (RANDOM() * 25)::DECIMAL,
    60 + (RANDOM() * 30)::DECIMAL,
    75 + (RANDOM() * 20)::DECIMAL
FROM kastle_collection.collection_officers o
CROSS JOIN generate_series(0, 7) n
ON CONFLICT (officer_id, summary_date) DO NOTHING;

-- 14. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_status ON kastle_collection.collection_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_collection_cases_bucket ON kastle_collection.collection_cases(bucket_id);
CREATE INDEX IF NOT EXISTS idx_collection_cases_officer ON kastle_collection.collection_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_collection_cases_customer ON kastle_collection.collection_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON kastle_collection.daily_collection_summary(summary_date);
CREATE INDEX IF NOT EXISTS idx_officer_performance_date ON kastle_collection.officer_performance_summary(summary_date);
CREATE INDEX IF NOT EXISTS idx_officer_performance_officer ON kastle_collection.officer_performance_summary(officer_id);

-- 15. Verify the setup
SELECT 
    'Schema Created Successfully!' as status,
    (SELECT COUNT(*) FROM kastle_collection.collection_teams) as teams_count,
    (SELECT COUNT(*) FROM kastle_collection.collection_officers) as officers_count,
    (SELECT COUNT(*) FROM kastle_collection.collection_buckets) as buckets_count,
    (SELECT COUNT(*) FROM kastle_collection.collection_cases) as cases_count,
    (SELECT COUNT(*) FROM kastle_collection.daily_collection_summary) as daily_summaries_count,
    (SELECT COUNT(*) FROM kastle_collection.officer_performance_summary) as officer_performance_count;