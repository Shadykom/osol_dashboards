-- Fix Specialist Report API compatibility issues
-- This version properly handles schema-qualified types

-- First, ensure we're in the right schema context
SET search_path TO kastle_banking, public;

-- Solution 1: Create computed columns using functions with proper schema qualification
CREATE OR REPLACE FUNCTION kastle_banking.loan_accounts_loan_amount(kastle_banking.loan_accounts)
RETURNS NUMERIC AS $$
  SELECT $1.principal_amount
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION kastle_banking.loan_accounts_loan_start_date(kastle_banking.loan_accounts)
RETURNS DATE AS $$
  SELECT $1.disbursement_date
$$ LANGUAGE sql STABLE;

CREATE OR REPLACE FUNCTION kastle_banking.loan_accounts_outstanding_balance(kastle_banking.loan_accounts)
RETURNS NUMERIC AS $$
  SELECT COALESCE($1.outstanding_principal, 0) + COALESCE($1.outstanding_interest, 0)
$$ LANGUAGE sql STABLE;

-- Solution 2: Add missing columns directly to the tables
-- This is simpler and doesn't require computed columns

-- Add loan_amount column to loan_accounts if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'loan_amount'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts ADD COLUMN loan_amount NUMERIC(18,2);
        -- Copy data from principal_amount
        UPDATE kastle_banking.loan_accounts SET loan_amount = principal_amount;
        RAISE NOTICE 'Added loan_amount column to loan_accounts';
    END IF;
END $$;

-- Add outstanding_balance as a generated column (PostgreSQL 12+) or regular column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'outstanding_balance'
    ) THEN
        -- Try to add as generated column first (requires PostgreSQL 12+)
        BEGIN
            ALTER TABLE kastle_banking.loan_accounts 
            ADD COLUMN outstanding_balance NUMERIC(18,2) 
            GENERATED ALWAYS AS (COALESCE(outstanding_principal, 0) + COALESCE(outstanding_interest, 0)) STORED;
            RAISE NOTICE 'Added outstanding_balance as generated column';
        EXCEPTION
            WHEN OTHERS THEN
                -- Fall back to regular column
                ALTER TABLE kastle_banking.loan_accounts ADD COLUMN outstanding_balance NUMERIC(18,2);
                UPDATE kastle_banking.loan_accounts 
                SET outstanding_balance = COALESCE(outstanding_principal, 0) + COALESCE(outstanding_interest, 0);
                RAISE NOTICE 'Added outstanding_balance as regular column';
        END;
    END IF;
END $$;

-- Add loan_start_date column
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'loan_start_date'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts ADD COLUMN loan_start_date DATE;
        UPDATE kastle_banking.loan_accounts SET loan_start_date = disbursement_date;
        RAISE NOTICE 'Added loan_start_date column to loan_accounts';
    END IF;
END $$;

-- Fix promise_to_pay table
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'promise_to_pay'
    ) THEN
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
        -- Add missing columns
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
        
        -- Add officer_id if missing
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'promise_to_pay' 
            AND column_name = 'officer_id'
        ) THEN
            ALTER TABLE kastle_banking.promise_to_pay ADD COLUMN officer_id VARCHAR(20);
            RAISE NOTICE 'Added officer_id column';
        END IF;
    END IF;
END $$;

-- Create indexes for promise_to_pay
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case_id ON kastle_banking.promise_to_pay(case_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_officer_id ON kastle_banking.promise_to_pay(officer_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_created_at ON kastle_banking.promise_to_pay(created_at);

-- Fix collection_teams table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50),
    team_lead_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add team_lead_id if missing
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

-- Create collection_officers table if it doesn't exist
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (team_id) REFERENCES kastle_banking.collection_teams(team_id)
);

-- Create officer_performance_metrics table
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

-- Grant permissions if roles exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
        GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO web_anon;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA kastle_banking TO web_anon;
        RAISE NOTICE 'Granted permissions to web_anon';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;
        GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA kastle_banking TO authenticated;
        RAISE NOTICE 'Granted permissions to authenticated';
    END IF;
END $$;

-- Verify all fixes
SELECT 'Loan Accounts Columns' as check_type, 
       COUNT(*) FILTER (WHERE column_name IN ('loan_amount', 'outstanding_balance', 'loan_start_date')) as added_columns
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' AND table_name = 'loan_accounts';

SELECT 'Promise to Pay Columns' as check_type,
       COUNT(*) FILTER (WHERE column_name IN ('actual_payment_date', 'actual_payment_amount', 'officer_id')) as required_columns
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' AND table_name = 'promise_to_pay';

SELECT 'Collection Teams' as check_type,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'kastle_banking' 
              AND table_name = 'collection_teams' 
              AND column_name = 'team_lead_id') as has_team_lead_id;

-- Reset search path
RESET search_path;