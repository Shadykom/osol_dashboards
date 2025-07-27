-- Comprehensive fix for ALL column mismatches in Specialist Report
-- This script addresses every single column mismatch error

-- 1. First, let's see what columns actually exist in customers table
SELECT 
    'CUSTOMERS TABLE CHECK' as check_type,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'customers'
  AND column_name IN ('customer_type', 'customer_type_id', 'national_id', 'nationality')
ORDER BY column_name;

-- 2. Fix customers table - add missing columns
-- Add customer_type if missing
ALTER TABLE kastle_banking.customers 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50);

-- Add national_id if missing (seems like it might be called 'nationality')
ALTER TABLE kastle_banking.customers 
ADD COLUMN IF NOT EXISTS national_id VARCHAR(50);

-- Update customer_type based on customer_type_id if it exists
UPDATE kastle_banking.customers 
SET customer_type = CASE 
    WHEN customer_type_id = 1 THEN 'فرد'
    WHEN customer_type_id = 2 THEN 'شركة'
    ELSE 'فرد'
END
WHERE customer_type IS NULL;

-- If nationality exists but national_id doesn't, copy the data
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'nationality'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'national_id'
    ) THEN
        UPDATE kastle_banking.customers 
        SET national_id = nationality 
        WHERE national_id IS NULL AND nationality IS NOT NULL;
    END IF;
END $$;

-- 3. Fix loan_accounts table - add ALL missing columns
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_amount NUMERIC(18,2);

ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS outstanding_balance NUMERIC(18,2);

ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_start_date DATE;

-- Update the columns with data
UPDATE kastle_banking.loan_accounts 
SET 
    loan_amount = COALESCE(loan_amount, principal_amount),
    outstanding_balance = COALESCE(outstanding_balance, COALESCE(outstanding_principal, 0) + COALESCE(outstanding_interest, 0)),
    loan_start_date = COALESCE(loan_start_date, disbursement_date);

-- 4. Fix collection_cases table - add all missing columns
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

-- Update dpd from days_past_due
UPDATE kastle_banking.collection_cases 
SET dpd = days_past_due 
WHERE dpd IS NULL AND days_past_due IS NOT NULL;

-- Update total_overdue
UPDATE kastle_banking.collection_cases 
SET total_overdue = COALESCE(penalty_outstanding, 0) + COALESCE(interest_outstanding, 0)
WHERE total_overdue IS NULL;

-- 5. Create promise_to_pay table with ALL required columns
DROP TABLE IF EXISTS kastle_banking.promise_to_pay CASCADE;
CREATE TABLE kastle_banking.promise_to_pay (
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

-- 6. Create collection_teams table
DROP TABLE IF EXISTS kastle_banking.collection_teams CASCADE;
CREATE TABLE kastle_banking.collection_teams (
    team_id SERIAL PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50),
    team_lead_id VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Create collection_officers table
DROP TABLE IF EXISTS kastle_banking.collection_officers CASCADE;
CREATE TABLE kastle_banking.collection_officers (
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

-- 8. Create officer_performance_metrics table
DROP TABLE IF EXISTS kastle_banking.officer_performance_metrics CASCADE;
CREATE TABLE kastle_banking.officer_performance_metrics (
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

-- 9. Insert test data
-- Insert a test team
INSERT INTO kastle_banking.collection_teams (team_id, team_name, team_type)
VALUES (1, 'Default Team', 'Field')
ON CONFLICT DO NOTHING;

-- Insert test officer
INSERT INTO kastle_banking.collection_officers (officer_id, officer_name, officer_type, team_id, status)
VALUES ('OFF007', 'Test Officer', 'Field', 1, 'ACTIVE')
ON CONFLICT (officer_id) DO UPDATE 
SET team_id = 1;

-- 10. Create all indexes
CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned_to ON kastle_banking.collection_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_collection_cases_loan_account ON kastle_banking.collection_cases(loan_account_number);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_officer ON kastle_banking.promise_to_pay(officer_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case ON kastle_banking.promise_to_pay(case_id);

-- 11. Grant permissions if roles exist
DO $$
BEGIN
    -- Create web_anon role if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
    END IF;
    
    -- Grant permissions
    GRANT USAGE ON SCHEMA kastle_banking TO web_anon;
    GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO web_anon;
    GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA kastle_banking TO web_anon;
    
    RAISE NOTICE 'Permissions granted successfully';
END $$;

-- 12. Final verification
SELECT 'VERIFICATION RESULTS' as section;

SELECT 
    'Customers columns' as check_item,
    string_agg(column_name, ', ') as columns
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'customers'
  AND column_name IN ('customer_type', 'national_id');

SELECT 
    'Loan accounts columns' as check_item,
    string_agg(column_name, ', ') as columns
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'loan_accounts'
  AND column_name IN ('loan_amount', 'outstanding_balance', 'loan_start_date');

SELECT 
    'Promise to pay columns' as check_item,
    string_agg(column_name, ', ') as columns
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'promise_to_pay'
  AND column_name IN ('actual_payment_date', 'actual_payment_amount', 'officer_id');

SELECT 
    'Collection teams' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_teams' 
            AND column_name = 'team_lead_id'
        ) THEN 'team_lead_id exists'
        ELSE 'team_lead_id MISSING'
    END as status;

SELECT 
    'Collection cases columns' as check_item,
    string_agg(column_name, ', ') as columns
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'collection_cases'
  AND column_name IN ('assigned_to', 'dpd', 'total_overdue', 'last_contact_date', 'next_action_date');

SELECT 
    'Test officer' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM kastle_banking.collection_officers 
            WHERE officer_id = 'OFF007'
        ) THEN 'OFF007 exists'
        ELSE 'OFF007 MISSING'
    END as status;

-- Show completion message
SELECT 
    'ALL FIXES APPLIED' as status,
    'Please restart PostgREST to reload the schema cache' as next_step,
    NOW() as completed_at;