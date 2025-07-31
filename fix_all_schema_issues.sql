-- Comprehensive fix for ALL Specialist Report schema issues
-- Run this script to fix all column mismatches

-- 1. First, check what columns actually exist in the customers table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'customers'
  AND column_name LIKE '%customer_type%'
ORDER BY column_name;

-- 2. Add customer_type column if it doesn't exist (it seems the table has customer_type_id instead)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_type'
    ) THEN
        -- Add customer_type column
        ALTER TABLE kastle_banking.customers ADD COLUMN customer_type VARCHAR(50);
        
        -- Set default values based on customer_type_id if it exists
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'customers' 
            AND column_name = 'customer_type_id'
        ) THEN
            UPDATE kastle_banking.customers 
            SET customer_type = CASE 
                WHEN customer_type_id = 1 THEN 'فرد'
                WHEN customer_type_id = 2 THEN 'شركة'
                ELSE 'فرد'
            END
            WHERE customer_type IS NULL;
        ELSE
            -- Default all to individual
            UPDATE kastle_banking.customers SET customer_type = 'فرد' WHERE customer_type IS NULL;
        END IF;
        
        RAISE NOTICE 'Added customer_type column to customers table';
    END IF;
END $$;

-- 3. Fix loan_accounts table - add ALL missing columns
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_amount NUMERIC(18,2);

ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(18,2);

ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_start_date DATE;

-- Update with data from existing columns
UPDATE kastle_banking.loan_accounts 
SET 
    loan_amount = COALESCE(loan_amount, principal_amount),
    outstanding_balance = COALESCE(outstanding_balance, COALESCE(outstanding_principal, 0) + COALESCE(outstanding_interest, 0)),
    loan_start_date = COALESCE(loan_start_date, disbursement_date)
WHERE loan_amount IS NULL 
   OR outstanding_balance IS NULL 
   OR loan_start_date IS NULL;

-- 4. Fix promise_to_pay table
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

-- Add missing columns if table exists
ALTER TABLE kastle_banking.promise_to_pay 
ADD COLUMN IF NOT EXISTS actual_payment_date DATE;

ALTER TABLE kastle_banking.promise_to_pay 
ADD COLUMN IF NOT EXISTS actual_payment_amount NUMERIC(18,2);

ALTER TABLE kastle_banking.promise_to_pay 
ADD COLUMN IF NOT EXISTS officer_id VARCHAR(20);

-- 5. Fix collection_teams table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50),
    team_lead_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE kastle_banking.collection_teams 
ADD COLUMN IF NOT EXISTS team_lead_id VARCHAR(20);

-- 6. Create collection_officers table if missing
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

-- 7. Create officer_performance_metrics table
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

-- 8. Add some test data for collection_officers if empty
INSERT INTO kastle_banking.collection_officers (officer_id, officer_name, officer_type, status)
SELECT 'OFF007', 'Test Officer', 'Field', 'ACTIVE'
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.collection_officers WHERE officer_id = 'OFF007'
);

-- 9. Fix collection_cases table - add missing columns
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS assigned_to VARCHAR(20);

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS dpd INTEGER;

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS total_overdue NUMERIC(18,2);

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS last_contact_date DATE;

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS next_action_date DATE;

-- Update dpd from days_past_due if it exists
UPDATE kastle_banking.collection_cases 
SET dpd = days_past_due 
WHERE dpd IS NULL AND days_past_due IS NOT NULL;

-- 10. Create all necessary indexes
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case_id 
ON kastle_banking.promise_to_pay(case_id);

CREATE INDEX IF NOT EXISTS idx_promise_to_pay_officer_id 
ON kastle_banking.promise_to_pay(officer_id);

CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned_to 
ON kastle_banking.collection_cases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_collection_cases_loan_account_number 
ON kastle_banking.collection_cases(loan_account_number);

-- 11. Grant permissions if roles exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
        GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO web_anon;
        RAISE NOTICE 'Granted SELECT permissions to web_anon';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
        GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;
        RAISE NOTICE 'Granted full permissions to authenticated';
    END IF;
END $$;

-- 12. Verify all fixes
SELECT 'Customers Table' as check_name,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'kastle_banking' 
              AND table_name = 'customers' 
              AND column_name = 'customer_type') as customer_type_exists;

SELECT 'Loan Accounts Columns' as check_name,
       COUNT(*) as missing_columns_fixed
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'loan_accounts'
  AND column_name IN ('loan_amount', 'outstanding_balance', 'loan_start_date');

SELECT 'Promise to Pay Columns' as check_name,
       COUNT(*) as required_columns
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'promise_to_pay'
  AND column_name IN ('actual_payment_date', 'actual_payment_amount', 'officer_id');

SELECT 'Collection Teams' as check_name,
       EXISTS(SELECT 1 FROM information_schema.columns 
              WHERE table_schema = 'kastle_banking' 
              AND table_name = 'collection_teams' 
              AND column_name = 'team_lead_id') as team_lead_id_exists;

SELECT 'All Required Tables' as check_name,
       COUNT(*) as tables_exist
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
  AND table_name IN ('promise_to_pay', 'collection_teams', 'collection_officers', 'officer_performance_metrics');

-- Show final summary
SELECT 
    'Schema Fix Complete' as status,
    NOW() as completed_at;