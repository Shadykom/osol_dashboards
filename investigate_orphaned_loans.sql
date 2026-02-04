-- Investigate orphaned loan account numbers in collection_cases

-- 1. Find all orphaned loan_account_numbers
SELECT 
    cc.case_id,
    cc.case_number,
    cc.customer_id,
    cc.loan_account_number,
    cc.account_type,
    cc.total_outstanding,
    cc.days_past_due,
    cc.case_status,
    cc.created_at
FROM kastle_banking.collection_cases cc
WHERE cc.loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = cc.loan_account_number
  )
ORDER BY cc.loan_account_number, cc.created_at;

-- 2. Count orphaned records by loan_account_number
SELECT 
    loan_account_number,
    COUNT(*) as orphaned_cases_count,
    SUM(total_outstanding) as total_outstanding_amount,
    MIN(created_at) as earliest_case,
    MAX(created_at) as latest_case
FROM kastle_banking.collection_cases
WHERE loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = collection_cases.loan_account_number
  )
GROUP BY loan_account_number
ORDER BY orphaned_cases_count DESC;

-- 3. Check if these loan accounts exist in any other table or schema
-- Check if the loan might exist in the public schema instead
SELECT 
    'public.loan_accounts' as table_location,
    loan_account_number,
    loan_status,
    customer_id,
    principal_amount
FROM public.loan_accounts
WHERE loan_account_number IN (
    SELECT DISTINCT loan_account_number 
    FROM kastle_banking.collection_cases cc
    WHERE cc.loan_account_number IS NOT NULL 
      AND NOT EXISTS (
          SELECT 1 
          FROM kastle_banking.loan_accounts la 
          WHERE la.loan_account_number = cc.loan_account_number
      )
);

-- 4. Summary statistics
WITH orphaned_stats AS (
    SELECT 
        COUNT(DISTINCT cc.loan_account_number) as unique_orphaned_loans,
        COUNT(*) as total_orphaned_cases,
        SUM(cc.total_outstanding) as total_outstanding_amount,
        AVG(cc.days_past_due) as avg_days_past_due
    FROM kastle_banking.collection_cases cc
    WHERE cc.loan_account_number IS NOT NULL 
      AND NOT EXISTS (
          SELECT 1 
          FROM kastle_banking.loan_accounts la 
          WHERE la.loan_account_number = cc.loan_account_number
      )
),
total_stats AS (
    SELECT 
        COUNT(DISTINCT loan_account_number) as total_unique_loans,
        COUNT(*) as total_cases
    FROM kastle_banking.collection_cases
    WHERE loan_account_number IS NOT NULL
)
SELECT 
    os.unique_orphaned_loans,
    ts.total_unique_loans,
    ROUND(100.0 * os.unique_orphaned_loans / ts.total_unique_loans, 2) as orphaned_loan_percentage,
    os.total_orphaned_cases,
    ts.total_cases,
    ROUND(100.0 * os.total_orphaned_cases / ts.total_cases, 2) as orphaned_case_percentage,
    os.total_outstanding_amount,
    ROUND(os.avg_days_past_due, 0) as avg_days_past_due_orphaned
FROM orphaned_stats os, total_stats ts;

-- 5. Check what loan accounts DO exist
SELECT 
    'Existing in kastle_banking.loan_accounts' as status,
    COUNT(DISTINCT loan_account_number) as count
FROM kastle_banking.loan_accounts
UNION ALL
SELECT 
    'Referenced in kastle_banking.collection_cases' as status,
    COUNT(DISTINCT loan_account_number) as count
FROM kastle_banking.collection_cases
WHERE loan_account_number IS NOT NULL
UNION ALL
SELECT 
    'Orphaned references' as status,
    COUNT(DISTINCT cc.loan_account_number) as count
FROM kastle_banking.collection_cases cc
WHERE cc.loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 
      FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = cc.loan_account_number
  );