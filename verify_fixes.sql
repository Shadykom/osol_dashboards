-- Verify if schema fixes have been applied
-- Run this to check the current state of your database

\echo '========================================='
\echo 'SCHEMA FIX VERIFICATION REPORT'
\echo '========================================='
\echo ''

-- 1. Check missing columns in customers table
\echo '1. CUSTOMERS TABLE CHECK:'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'customers' AND column_name = 'customer_type') 
        THEN '✓ customer_type column EXISTS'
        ELSE '✗ customer_type column MISSING'
    END as customer_type_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'customers' AND column_name = 'national_id') 
        THEN '✓ national_id column EXISTS'
        ELSE '✗ national_id column MISSING'
    END as national_id_status;

-- 2. Check missing columns in loan_accounts table
\echo ''
\echo '2. LOAN_ACCOUNTS TABLE CHECK:'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'loan_accounts' AND column_name = 'loan_amount') 
        THEN '✓ loan_amount column EXISTS'
        ELSE '✗ loan_amount column MISSING'
    END as loan_amount_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'loan_accounts' AND column_name = 'outstanding_balance') 
        THEN '✓ outstanding_balance column EXISTS'
        ELSE '✗ outstanding_balance column MISSING'
    END as outstanding_balance_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'loan_accounts' AND column_name = 'loan_start_date') 
        THEN '✓ loan_start_date column EXISTS'
        ELSE '✗ loan_start_date column MISSING'
    END as loan_start_date_status;

-- 3. Check promise_to_pay table
\echo ''
\echo '3. PROMISE_TO_PAY TABLE CHECK:'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'promise_to_pay') 
        THEN '✓ promise_to_pay table EXISTS'
        ELSE '✗ promise_to_pay table MISSING'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'promise_to_pay' AND column_name = 'actual_payment_date') 
        THEN '✓ actual_payment_date column EXISTS'
        ELSE '✗ actual_payment_date column MISSING'
    END as actual_payment_date_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'promise_to_pay' AND column_name = 'actual_payment_amount') 
        THEN '✓ actual_payment_amount column EXISTS'
        ELSE '✗ actual_payment_amount column MISSING'
    END as actual_payment_amount_status;

-- 4. Check collection_teams table
\echo ''
\echo '4. COLLECTION_TEAMS TABLE CHECK:'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_teams') 
        THEN '✓ collection_teams table EXISTS'
        ELSE '✗ collection_teams table MISSING'
    END as table_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'collection_teams' AND column_name = 'team_lead_id') 
        THEN '✓ team_lead_id column EXISTS'
        ELSE '✗ team_lead_id column MISSING'
    END as team_lead_id_status;

-- 5. Check other required tables
\echo ''
\echo '5. OTHER REQUIRED TABLES:'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_officers') 
        THEN '✓ collection_officers table EXISTS'
        ELSE '✗ collection_officers table MISSING'
    END as collection_officers_status,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'officer_performance_metrics') 
        THEN '✓ officer_performance_metrics table EXISTS'
        ELSE '✗ officer_performance_metrics table MISSING'
    END as officer_performance_metrics_status;

-- 6. Check test data
\echo ''
\echo '6. TEST DATA CHECK:'
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM kastle_banking.collection_officers WHERE officer_id = 'OFF007') 
        THEN '✓ Test officer OFF007 EXISTS'
        ELSE '✗ Test officer OFF007 MISSING'
    END as test_officer_status;

-- 7. Summary
\echo ''
\echo '========================================='
\echo 'ACTION REQUIRED:'
\echo ''
\echo 'If any items show ✗ (MISSING), run:'
\echo '  psql -d your_database -f fix_all_column_mismatches.sql'
\echo ''
\echo 'Then restart PostgREST:'
\echo '  sudo systemctl restart postgrest'
\echo '========================================='