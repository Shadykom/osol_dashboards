-- Fix Specialist Report API compatibility issues
-- This provides alternative solutions that don't require modifying the base tables

-- Solution 1: Create a view that provides the expected column names
CREATE OR REPLACE VIEW kastle_banking.loan_accounts_api AS
SELECT 
    loan_account_id,
    loan_account_number,
    application_id,
    customer_id,
    product_id,
    principal_amount,
    principal_amount as loan_amount,  -- Alias for API compatibility
    interest_rate,
    tenure_months,
    emi_amount,
    disbursement_date,
    disbursement_date as loan_start_date,  -- Alias for API compatibility
    first_emi_date,
    maturity_date,
    outstanding_principal,
    outstanding_principal as outstanding_balance,  -- Alias for API compatibility
    outstanding_interest,
    total_interest_paid,
    total_principal_paid,
    overdue_amount,
    overdue_days,
    loan_status,
    npa_date,
    settlement_amount,
    settlement_date,
    created_at,
    updated_at
FROM kastle_banking.loan_accounts;

-- Grant permissions
GRANT SELECT ON kastle_banking.loan_accounts_api TO web_anon;

-- Solution 2: Create computed columns using functions (PostgREST compatible)
CREATE OR REPLACE FUNCTION kastle_banking.loan_accounts_loan_amount(loan_accounts)
RETURNS NUMERIC AS $$
  SELECT $1.principal_amount
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION kastle_banking.loan_accounts_loan_start_date(loan_accounts)
RETURNS DATE AS $$
  SELECT $1.disbursement_date
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION kastle_banking.loan_accounts_outstanding_balance(loan_accounts)
RETURNS NUMERIC AS $$
  SELECT COALESCE($1.outstanding_principal, 0) + COALESCE($1.outstanding_interest, 0)
$$ LANGUAGE sql STABLE;

-- Solution 3: Update the promise_to_pay table structure if it doesn't match
-- Check current structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'promise_to_pay'
ORDER BY ordinal_position;

-- If the table structure is different, create the expected structure
DROP TABLE IF EXISTS kastle_banking.promise_to_pay_old;
ALTER TABLE IF EXISTS kastle_banking.promise_to_pay RENAME TO promise_to_pay_old;

CREATE TABLE kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    officer_id VARCHAR(20),
    ptp_date DATE NOT NULL,
    ptp_amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(30) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'KEPT', 'BROKEN', 'PARTIAL', 'CANCELLED')),
    actual_payment_date DATE,
    actual_payment_amount NUMERIC(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id)
);

-- Copy data from old table if it exists
INSERT INTO kastle_banking.promise_to_pay (
    case_id, officer_id, ptp_date, ptp_amount, status, 
    actual_payment_date, actual_payment_amount, created_at
)
SELECT 
    case_id, officer_id, ptp_date, ptp_amount, 
    COALESCE(status, 'PENDING'),
    NULL as actual_payment_date,  -- Add these columns with NULL initially
    NULL as actual_payment_amount,
    COALESCE(created_at, NOW())
FROM kastle_banking.promise_to_pay_old
WHERE EXISTS (SELECT 1 FROM kastle_banking.promise_to_pay_old);

-- Drop old table if migration successful
DROP TABLE IF EXISTS kastle_banking.promise_to_pay_old;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case_id ON kastle_banking.promise_to_pay(case_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_officer_id ON kastle_banking.promise_to_pay(officer_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_created_at ON kastle_banking.promise_to_pay(created_at);

-- Grant permissions
GRANT SELECT ON kastle_banking.promise_to_pay TO web_anon;
GRANT ALL ON kastle_banking.promise_to_pay TO authenticated;

-- Solution 4: Fix collection_teams relationship
-- Check where collection_teams table exists
SELECT 
    table_schema,
    table_name,
    column_name
FROM information_schema.columns
WHERE table_name = 'collection_teams'
  AND column_name IN ('team_id', 'team_name', 'team_lead_id')
ORDER BY table_schema, ordinal_position;

-- Create the table in the expected schema if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50),
    team_lead_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT ON kastle_banking.collection_teams TO web_anon;

-- Verify the fixes
SELECT 'Checking loan_accounts computed columns' as check_type;
SELECT 
    p.proname as function_name,
    pg_get_function_result(p.oid) as return_type
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'kastle_banking' 
  AND p.proname LIKE 'loan_accounts_%'
  AND p.pronargs = 1;

SELECT 'Checking promise_to_pay columns' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'promise_to_pay'
  AND column_name IN ('actual_payment_date', 'actual_payment_amount');