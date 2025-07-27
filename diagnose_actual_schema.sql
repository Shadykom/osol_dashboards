-- Diagnose actual schema structure to understand the mismatches

-- 1. Check customers table structure
SELECT 
    'CUSTOMERS TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'customers'
ORDER BY ordinal_position;

-- 2. Check loan_accounts table structure
SELECT 
    'LOAN_ACCOUNTS TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'loan_accounts'
ORDER BY ordinal_position;

-- 3. Check collection_cases table structure
SELECT 
    'COLLECTION_CASES TABLE COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'collection_cases'
ORDER BY ordinal_position;

-- 4. Check if promise_to_pay table exists
SELECT 
    'PROMISE_TO_PAY TABLE' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'promise_to_pay'
        ) THEN 'EXISTS'
        ELSE 'DOES NOT EXIST'
    END as status;

-- 5. If promise_to_pay exists, show its columns
SELECT 
    'PROMISE_TO_PAY COLUMNS' as section,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'promise_to_pay'
ORDER BY ordinal_position;

-- 6. Check collection_teams
SELECT 
    'COLLECTION_TEAMS' as section,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_teams'
        ) THEN 'EXISTS in kastle_banking'
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'kastle_collection' 
            AND table_name = 'collection_teams'
        ) THEN 'EXISTS in kastle_collection'
        ELSE 'DOES NOT EXIST'
    END as status;

-- 7. Show sample data from customers to understand customer_type
SELECT 
    'CUSTOMER TYPE DATA' as section,
    customer_id,
    CASE 
        WHEN column_name = 'customer_type' THEN 'Has customer_type column'
        WHEN column_name = 'customer_type_id' THEN 'Has customer_type_id column'
        ELSE 'No customer type column'
    END as type_column
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'customers'
  AND column_name IN ('customer_type', 'customer_type_id')
LIMIT 1;