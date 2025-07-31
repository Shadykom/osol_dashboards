-- Fix orphaned loan account references in collection_cases
-- Run investigate_orphaned_loans.sql first to understand the scope of the issue

-- SOLUTION 1: Insert missing loan accounts (if you have the data)
-- This is the best solution if you can recover the loan account information

-- First, check if loans exist in public schema and copy them over
INSERT INTO kastle_banking.loan_accounts (
    loan_account_number,
    customer_id,
    principal_amount,
    interest_rate,
    tenure_months,
    loan_status,
    created_at,
    updated_at
)
SELECT DISTINCT
    pl.loan_account_number,
    pl.customer_id,
    pl.principal_amount,
    COALESCE(pl.interest_rate, 10.0), -- Default interest rate if missing
    COALESCE(pl.tenure_months, 12),    -- Default tenure if missing
    COALESCE(pl.loan_status, 'ACTIVE'),
    COALESCE(pl.created_at, NOW()),
    COALESCE(pl.updated_at, NOW())
FROM public.loan_accounts pl
INNER JOIN (
    SELECT DISTINCT loan_account_number 
    FROM kastle_banking.collection_cases cc
    WHERE cc.loan_account_number IS NOT NULL 
      AND NOT EXISTS (
          SELECT 1 
          FROM kastle_banking.loan_accounts la 
          WHERE la.loan_account_number = cc.loan_account_number
      )
) orphaned ON pl.loan_account_number = orphaned.loan_account_number
ON CONFLICT (loan_account_number) DO NOTHING;

-- SOLUTION 2: Create placeholder loan accounts for orphaned references
-- Use this if you need to maintain referential integrity but don't have the original data

/*
INSERT INTO kastle_banking.loan_accounts (
    loan_account_number,
    customer_id,
    principal_amount,
    interest_rate,
    tenure_months,
    emi_amount,
    outstanding_principal,
    outstanding_interest,
    loan_status,
    created_at,
    updated_at
)
SELECT DISTINCT
    cc.loan_account_number,
    cc.customer_id,
    cc.total_outstanding, -- Use outstanding as principal since we don't know original
    10.0, -- Default interest rate
    12,   -- Default tenure
    0,    -- Unknown EMI
    cc.principal_outstanding,
    cc.interest_outstanding,
    'NPA', -- Mark as NPA since it's in collections
    cc.created_at,
    NOW()
FROM kastle_banking.collection_cases cc
WHERE cc.loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = cc.loan_account_number
  )
ON CONFLICT (loan_account_number) DO NOTHING;
*/

-- SOLUTION 3: Set orphaned references to NULL
-- Use this if you want to clean up invalid references

/*
UPDATE kastle_banking.collection_cases 
SET loan_account_number = NULL,
    updated_at = NOW()
WHERE loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = collection_cases.loan_account_number
  );
*/

-- SOLUTION 4: Delete orphaned collection cases
-- Use this only if these cases are invalid and can be removed

/*
DELETE FROM kastle_banking.collection_cases 
WHERE loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = collection_cases.loan_account_number
  );
*/

-- SOLUTION 5: Move orphaned cases to a separate table for later processing
-- Use this if you want to preserve the data but fix the integrity issue

/*
-- Create archive table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_cases_orphaned AS
SELECT * FROM kastle_banking.collection_cases
WHERE loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = collection_cases.loan_account_number
  );

-- Delete from main table
DELETE FROM kastle_banking.collection_cases 
WHERE loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = collection_cases.loan_account_number
  );
*/

-- After fixing the data, verify no orphaned records remain
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: No orphaned records found'
        ELSE 'ERROR: ' || COUNT(*) || ' orphaned records still exist'
    END as status,
    COUNT(*) as orphaned_count
FROM kastle_banking.collection_cases cc
WHERE cc.loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = cc.loan_account_number
  );

-- Now you can safely create the foreign key constraint
-- Run fix_postgrest_relationship.sql after cleaning up the data