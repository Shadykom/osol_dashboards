-- Diagnostic script for PostgREST relationship issue between collection_cases and loan_accounts

-- 1. Check if both tables exist in the kastle_banking schema
SELECT 
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'kastle_banking' 
  AND table_name IN ('collection_cases', 'loan_accounts')
ORDER BY table_name;

-- 2. Check the columns in both tables
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name IN ('collection_cases', 'loan_accounts')
  AND column_name IN ('loan_account_number', 'case_id', 'loan_account_id')
ORDER BY table_name, ordinal_position;

-- 3. Check existing foreign key relationships
SELECT 
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_schema = 'kastle_banking'
  AND (tc.table_name = 'collection_cases' OR ccu.table_name = 'loan_accounts');

-- 4. Check for unique constraints on loan_account_number
SELECT 
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.table_schema = 'kastle_banking'
  AND tc.table_name = 'loan_accounts'
  AND kcu.column_name = 'loan_account_number'
  AND tc.constraint_type IN ('UNIQUE', 'PRIMARY KEY');

-- 5. Check if there are any orphaned loan_account_numbers in collection_cases
SELECT 
    COUNT(*) as total_collection_cases,
    COUNT(loan_account_number) as cases_with_loan_account,
    COUNT(DISTINCT loan_account_number) as unique_loan_accounts,
    COUNT(*) FILTER (WHERE loan_account_number IS NULL) as cases_without_loan_account
FROM kastle_banking.collection_cases;

-- 6. Check for orphaned references (loan_account_numbers that don't exist in loan_accounts)
SELECT 
    cc.case_id,
    cc.case_number,
    cc.loan_account_number,
    cc.account_type,
    cc.total_outstanding
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la 
    ON cc.loan_account_number = la.loan_account_number
WHERE cc.loan_account_number IS NOT NULL 
  AND la.loan_account_number IS NULL
LIMIT 10;

-- 7. Sample data from both tables to verify the relationship
SELECT 
    'collection_cases' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT loan_account_number) as distinct_loan_accounts
FROM kastle_banking.collection_cases
WHERE loan_account_number IS NOT NULL
UNION ALL
SELECT 
    'loan_accounts' as table_name,
    COUNT(*) as row_count,
    COUNT(DISTINCT loan_account_number) as distinct_loan_accounts
FROM kastle_banking.loan_accounts;

-- 8. Check PostgREST schema cache (if accessible)
-- Note: This might require appropriate permissions
SELECT 
    schemaname,
    tablename,
    attname,
    n_distinct,
    most_common_vals
FROM pg_stats
WHERE schemaname = 'kastle_banking' 
  AND tablename IN ('collection_cases', 'loan_accounts')
  AND attname = 'loan_account_number';