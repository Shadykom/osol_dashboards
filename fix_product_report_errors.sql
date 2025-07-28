-- Fix Product Report Database Errors
-- This script adds missing columns and creates necessary views

-- 1. Add branch_id to loan_accounts table if it doesn't exist
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS branch_id character varying(10);

-- 2. Add branch_id to customers table if it doesn't exist
ALTER TABLE kastle_banking.customers 
ADD COLUMN IF NOT EXISTS branch_id character varying(10);

-- 3. Add missing columns to officer_performance_metrics table
ALTER TABLE kastle_collection.officer_performance_metrics 
ADD COLUMN IF NOT EXISTS calls_answered integer,
ADD COLUMN IF NOT EXISTS promises_made integer,
ADD COLUMN IF NOT EXISTS cases_resolved integer,
ADD COLUMN IF NOT EXISTS customer_satisfaction_score numeric(5,2);

-- 4. Update existing data with default values
UPDATE kastle_banking.loan_accounts 
SET branch_id = 'BR001' 
WHERE branch_id IS NULL;

UPDATE kastle_banking.customers 
SET branch_id = COALESCE(onboarding_branch, 'BR001')
WHERE branch_id IS NULL;

UPDATE kastle_collection.officer_performance_metrics
SET calls_answered = COALESCE(contacts_successful, 0),
    promises_made = COALESCE(ptps_obtained, 0),
    cases_resolved = COALESCE(accounts_worked, 0),
    customer_satisfaction_score = COALESCE(quality_score, 0)
WHERE calls_answered IS NULL 
   OR promises_made IS NULL 
   OR cases_resolved IS NULL 
   OR customer_satisfaction_score IS NULL;

-- 4.5. Add loan_amount column if it doesn't exist (alias for principal_amount)
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_amount numeric(18,2);

-- Update loan_amount to match principal_amount
UPDATE kastle_banking.loan_accounts 
SET loan_amount = principal_amount 
WHERE loan_amount IS NULL;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_loan_accounts_branch_id 
ON kastle_banking.loan_accounts(branch_id);

CREATE INDEX IF NOT EXISTS idx_customers_branch_id 
ON kastle_banking.customers(branch_id);

CREATE INDEX IF NOT EXISTS idx_loan_accounts_product_id 
ON kastle_banking.loan_accounts(product_id);

-- 6. Add foreign key constraints (optional, only if you want referential integrity)
-- ALTER TABLE kastle_banking.loan_accounts 
-- ADD CONSTRAINT fk_loan_accounts_branch 
-- FOREIGN KEY (branch_id) 
-- REFERENCES kastle_banking.branches(branch_id);

-- ALTER TABLE kastle_banking.customers 
-- ADD CONSTRAINT fk_customers_branch 
-- FOREIGN KEY (branch_id) 
-- REFERENCES kastle_banking.branches(branch_id);

-- 7. Grant necessary permissions
GRANT SELECT ON kastle_banking.loan_accounts TO anon, authenticated;
GRANT SELECT ON kastle_banking.customers TO anon, authenticated;
GRANT SELECT ON kastle_banking.branches TO anon, authenticated;
GRANT SELECT ON kastle_collection.officer_performance_metrics TO anon, authenticated;

-- 8. Refresh any materialized views that might be affected
-- REFRESH MATERIALIZED VIEW IF EXISTS your_view_name;

-- Verify the changes
SELECT 
    'loan_accounts columns' as table_info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'loan_accounts'
  AND column_name IN ('branch_id', 'product_id', 'customer_id')
ORDER BY ordinal_position;

SELECT 
    'customers columns' as table_info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'customers'
  AND column_name = 'branch_id';

SELECT 
    'officer_performance_metrics columns' as table_info,
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'kastle_collection' 
  AND table_name = 'officer_performance_metrics'
  AND column_name IN ('calls_answered', 'promises_made', 'cases_resolved', 'customer_satisfaction_score')
ORDER BY ordinal_position;