-- Simple fix for Specialist Report - just add missing columns
-- This avoids complex type references and computed columns

-- 1. Fix loan_accounts table - add missing columns
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_amount NUMERIC(18,2);

ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(18,2);

ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_start_date DATE;

-- Update the new columns with data from existing columns
UPDATE kastle_banking.loan_accounts 
SET 
    loan_amount = COALESCE(loan_amount, principal_amount),
    outstanding_balance = COALESCE(outstanding_balance, COALESCE(outstanding_principal, 0) + COALESCE(outstanding_interest, 0)),
    loan_start_date = COALESCE(loan_start_date, disbursement_date)
WHERE loan_amount IS NULL 
   OR outstanding_balance IS NULL 
   OR loan_start_date IS NULL;

-- 2. Create or fix promise_to_pay table
CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    officer_id VARCHAR(20),
    ptp_date DATE NOT NULL,
    ptp_amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING',
    actual_payment_date DATE,
    actual_payment_amount NUMERIC(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns if table already exists
ALTER TABLE kastle_banking.promise_to_pay 
ADD COLUMN IF NOT EXISTS actual_payment_date DATE;

ALTER TABLE kastle_banking.promise_to_pay 
ADD COLUMN IF NOT EXISTS actual_payment_amount NUMERIC(18,2);

ALTER TABLE kastle_banking.promise_to_pay 
ADD COLUMN IF NOT EXISTS officer_id VARCHAR(20);

-- 3. Create collection_teams table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50),
    team_lead_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add team_lead_id if missing
ALTER TABLE kastle_banking.collection_teams 
ADD COLUMN IF NOT EXISTS team_lead_id VARCHAR(20);

-- 4. Create collection_officers table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_officers (
    officer_id VARCHAR(20) PRIMARY KEY,
    officer_name VARCHAR(100) NOT NULL,
    officer_type VARCHAR(50),
    team_id INTEGER,
    contact_number VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    language_skills TEXT,
    collection_limit NUMERIC(18,2),
    commission_rate NUMERIC(5,2),
    joining_date DATE,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Create officer_performance_metrics table
CREATE TABLE IF NOT EXISTS kastle_banking.officer_performance_metrics (
    id SERIAL PRIMARY KEY,
    officer_id VARCHAR(20) NOT NULL,
    metric_date DATE NOT NULL,
    calls_made INTEGER DEFAULT 0,
    calls_answered INTEGER DEFAULT 0,
    promises_made INTEGER DEFAULT 0,
    promises_kept INTEGER DEFAULT 0,
    amount_collected NUMERIC(18,2) DEFAULT 0,
    cases_resolved INTEGER DEFAULT 0,
    avg_call_duration INTEGER,
    customer_satisfaction_score NUMERIC(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(officer_id, metric_date)
);

-- 6. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case_id 
ON kastle_banking.promise_to_pay(case_id);

CREATE INDEX IF NOT EXISTS idx_promise_to_pay_officer_id 
ON kastle_banking.promise_to_pay(officer_id);

CREATE INDEX IF NOT EXISTS idx_loan_accounts_loan_account_number 
ON kastle_banking.loan_accounts(loan_account_number);

-- 7. Verify the changes
SELECT 
    'loan_accounts' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'loan_accounts'
  AND column_name IN ('loan_amount', 'outstanding_balance', 'loan_start_date')
ORDER BY column_name;

SELECT 
    'promise_to_pay' as table_name,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'promise_to_pay'
  AND column_name IN ('actual_payment_date', 'actual_payment_amount', 'officer_id')
ORDER BY column_name;

SELECT 
    'Tables Created' as status,
    COUNT(*) as count
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
  AND table_name IN ('promise_to_pay', 'collection_teams', 'collection_officers', 'officer_performance_metrics');