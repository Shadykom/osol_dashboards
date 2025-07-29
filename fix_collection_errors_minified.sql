GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;
UPDATE kastle_banking.collection_cases cc
SET total_outstanding = la.outstanding_balance
FROM kastle_banking.loan_accounts la
WHERE cc.loan_account_number = la.loan_account_number
AND cc.total_outstanding = 0;
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS days_past_due INTEGER DEFAULT 0;
UPDATE kastle_banking.collection_cases cc
SET days_past_due = la.overdue_days
FROM kastle_banking.loan_accounts la
WHERE cc.loan_account_number = la.loan_account_number
AND cc.days_past_due = 0;
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
CREATE INDEX IF NOT EXISTS idx_daily_collection_summary_date 
ON kastle_collection.daily_collection_summary(summary_date);
ALTER TABLE kastle_collection.collection_officers
ADD COLUMN IF NOT EXISTS officer_id VARCHAR(50) PRIMARY KEY,
ADD COLUMN IF NOT EXISTS officer_name VARCHAR(255) NOT NULL,
ADD COLUMN IF NOT EXISTS officer_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS team_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS contact_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS email VARCHAR(255),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'ACTIVE';
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
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
INSERT INTO kastle_collection.collection_officers (
    officer_id, officer_name, officer_type, team_id, 
    contact_number, email, status
) VALUES 
    ('OFF001', 'أحمد محمد', 'SENIOR', 'TEAM001', '+966501234567', 'ahmed@example.com', 'ACTIVE'),
    ('OFF002', 'فاطمة علي', 'JUNIOR', 'TEAM001', '+966502345678', 'fatima@example.com', 'ACTIVE'),
    ('OFF003', 'محمد سالم', 'FIELD', 'TEAM002', '+966503456789', 'mohammed@example.com', 'ACTIVE'),
    ('OFF004', 'نورا خالد', 'CALL_CENTER', 'TEAM002', '+966504567890', 'nora@example.com', 'ACTIVE')
ON CONFLICT (officer_id) DO NOTHING;
INSERT INTO kastle_collection.collection_teams (
    team_id, team_name, team_type, status
) VALUES 
    ('TEAM001', 'فريق التحصيل الرئيسي', 'FIELD', 'ACTIVE'),
    ('TEAM002', 'فريق مركز الاتصال', 'CALL_CENTER', 'ACTIVE')
ON CONFLICT (team_id) DO NOTHING;
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
CREATE OR REPLACE FUNCTION kastle_collection.refresh_daily_collection_summary(p_date DATE DEFAULT CURRENT_DATE)
RETURNS VOID AS $$
BEGIN
    INSERT INTO kastle_collection.daily_collection_summary (
        summary_date, total_cases, total_outstanding, total_collected,
        collection_rate, accounts_due, accounts_collected, calls_made,
        ptps_created, ptps_kept
    )
    SELECT 
        p_date,
        COUNT(DISTINCT cc.case_id),
        SUM(cc.total_outstanding),
        COALESCE(SUM(t.transaction_amount), 0),
        CASE 
            WHEN SUM(cc.total_outstanding) > 0 
            THEN (COALESCE(SUM(t.transaction_amount), 0) / SUM(cc.total_outstanding) * 100)
            ELSE 0 
        END,
        COUNT(DISTINCT cc.case_id),
        COUNT(DISTINCT CASE WHEN t.transaction_amount > 0 THEN cc.case_id END),
        COUNT(DISTINCT ci.interaction_id),
        COUNT(DISTINCT ptp.ptp_id),
        COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END)
    FROM kastle_banking.collection_cases cc
    LEFT JOIN kastle_banking.transactions t 
        ON cc.loan_account_number = t.account_number 
        AND DATE(t.transaction_date) = p_date
        AND t.transaction_type_id = 'LOAN_REPAYMENT'
    LEFT JOIN kastle_collection.collection_interactions ci 
        ON cc.case_id = ci.case_id 
        AND DATE(ci.interaction_datetime) = p_date
    LEFT JOIN kastle_collection.promise_to_pay ptp 
        ON cc.case_id = ptp.case_id 
        AND DATE(ptp.created_at) = p_date
    WHERE cc.case_status = 'ACTIVE'
    ON CONFLICT (summary_date) DO UPDATE SET
        total_cases = EXCLUDED.total_cases,
        total_outstanding = EXCLUDED.total_outstanding,
        total_collected = EXCLUDED.total_collected,
        collection_rate = EXCLUDED.collection_rate,
        accounts_due = EXCLUDED.accounts_due,
        accounts_collected = EXCLUDED.accounts_collected,
        calls_made = EXCLUDED.calls_made,
        ptps_created = EXCLUDED.ptps_created,
        ptps_kept = EXCLUDED.ptps_kept,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;
GRANT EXECUTE ON FUNCTION kastle_collection.refresh_daily_collection_summary TO anon, authenticated;