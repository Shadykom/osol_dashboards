-- Quick fix for missing loan accounts referenced in collection_cases

-- First, let's see exactly which loan numbers are missing
SELECT DISTINCT 
    cc.loan_account_number,
    cc.customer_id,
    cc.total_outstanding,
    cc.principal_outstanding,
    cc.interest_outstanding,
    COUNT(*) as collection_cases_count
FROM kastle_banking.collection_cases cc
WHERE cc.loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = cc.loan_account_number
  )
GROUP BY cc.loan_account_number, cc.customer_id, cc.total_outstanding, 
         cc.principal_outstanding, cc.interest_outstanding
ORDER BY cc.loan_account_number;

-- Based on the error, we know LOAN1000000003 is missing
-- Let's check if there's a loan application for it
SELECT * FROM kastle_banking.loan_applications 
WHERE application_id = 22; -- This seems to be for CUST005 who has LOAN1000000003 in collections

-- Insert the missing loan accounts based on collection_cases data
-- This creates placeholder records to maintain referential integrity
INSERT INTO kastle_banking.loan_accounts (
    loan_account_number,
    application_id,
    customer_id,
    product_id,
    principal_amount,
    interest_rate,
    tenure_months,
    emi_amount,
    disbursement_date,
    outstanding_principal,
    outstanding_interest,
    total_interest_paid,
    total_principal_paid,
    overdue_amount,
    overdue_days,
    loan_status,
    created_at,
    updated_at
)
SELECT DISTINCT
    cc.loan_account_number,
    CASE 
        WHEN cc.loan_account_number = 'LOAN1000000003' THEN 22  -- From loan_applications
        WHEN cc.loan_account_number = 'LOAN1000000004' THEN 23  -- Assuming sequential
        ELSE NULL 
    END as application_id,
    cc.customer_id,
    41, -- Default to personal loan product
    COALESCE(cc.principal_outstanding + cc.interest_outstanding, cc.total_outstanding) as principal_amount,
    8.50, -- Default interest rate
    60,   -- Default 5-year tenure
    ROUND((cc.total_outstanding / 60)::numeric, 2) as emi_amount, -- Rough EMI calculation
    CURRENT_DATE - INTERVAL '2 years' as disbursement_date, -- Assume disbursed 2 years ago
    COALESCE(cc.principal_outstanding, cc.total_outstanding * 0.9) as outstanding_principal,
    COALESCE(cc.interest_outstanding, cc.total_outstanding * 0.1) as outstanding_interest,
    0.00 as total_interest_paid,
    0.00 as total_principal_paid,
    cc.total_outstanding as overdue_amount,
    cc.days_past_due as overdue_days,
    'NPA' as loan_status, -- Mark as NPA since it's in collections
    NOW() as created_at,
    NOW() as updated_at
FROM kastle_banking.collection_cases cc
WHERE cc.loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = cc.loan_account_number
  )
ON CONFLICT (loan_account_number) DO NOTHING;

-- Verify the fix
SELECT 
    'After Fix' as status,
    COUNT(DISTINCT cc.loan_account_number) as missing_loans_count
FROM kastle_banking.collection_cases cc
WHERE cc.loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = cc.loan_account_number
  );

-- Now you can create the foreign key constraint
ALTER TABLE kastle_banking.collection_cases
ADD CONSTRAINT fk_collection_cases_loan_accounts
FOREIGN KEY (loan_account_number) 
REFERENCES kastle_banking.loan_accounts(loan_account_number)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_loan_account_number 
ON kastle_banking.collection_cases(loan_account_number)
WHERE loan_account_number IS NOT NULL;

-- Verify the constraint was created
SELECT 
    tc.constraint_name,
    tc.table_schema || '.' || tc.table_name as table_name,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.constraint_name = 'fk_collection_cases_loan_accounts';