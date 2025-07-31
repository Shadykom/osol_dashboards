-- Fix Specialist Report API compatibility issues
-- This version works without requiring web_anon role

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

-- If the table doesn't exist or is missing columns, create it
DO $$
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'promise_to_pay'
    ) THEN
        -- Create the table
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
        RAISE NOTICE 'Created promise_to_pay table';
    ELSE
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'promise_to_pay' 
            AND column_name = 'actual_payment_date'
        ) THEN
            ALTER TABLE kastle_banking.promise_to_pay ADD COLUMN actual_payment_date DATE;
            RAISE NOTICE 'Added actual_payment_date column';
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'promise_to_pay' 
            AND column_name = 'actual_payment_amount'
        ) THEN
            ALTER TABLE kastle_banking.promise_to_pay ADD COLUMN actual_payment_amount NUMERIC(18,2);
            RAISE NOTICE 'Added actual_payment_amount column';
        END IF;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case_id ON kastle_banking.promise_to_pay(case_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_officer_id ON kastle_banking.promise_to_pay(officer_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_created_at ON kastle_banking.promise_to_pay(created_at);

-- Solution 4: Fix collection_teams table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50),
    team_lead_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add team_lead_id column if missing
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_teams'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_teams' 
        AND column_name = 'team_lead_id'
    ) THEN
        ALTER TABLE kastle_banking.collection_teams ADD COLUMN team_lead_id VARCHAR(20);
        RAISE NOTICE 'Added team_lead_id column to collection_teams';
    END IF;
END $$;

-- Create officer_performance_metrics table if missing
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
    avg_call_duration INTEGER, -- in seconds
    customer_satisfaction_score NUMERIC(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(officer_id, metric_date)
);

-- Add loan_amount column to loan_accounts if missing
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'loan_amount'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts ADD COLUMN loan_amount NUMERIC(18,2);
        UPDATE kastle_banking.loan_accounts SET loan_amount = principal_amount;
        RAISE NOTICE 'Added loan_amount column to loan_accounts';
    END IF;
END $$;

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

SELECT 'Checking collection_teams columns' as check_type;
SELECT column_name, data_type 
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'collection_teams'
  AND column_name = 'team_lead_id';