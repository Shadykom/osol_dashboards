-- Simple query to check table structures in kastle_banking schema
-- Run this in Supabase SQL Editor to see what tables exist and their structures

-- 1. Check which tables exist
SELECT 
    table_name,
    CASE 
        WHEN table_name IN ('loan_accounts', 'collection_officers') THEN '⚠️ CRITICAL'
        ELSE '✅ OK'
    END as priority
FROM information_schema.tables 
WHERE table_schema = 'kastle_banking'
    AND table_type = 'BASE TABLE'
ORDER BY priority DESC, table_name;

-- 2. Check loan_accounts structure (if exists)
SELECT 
    '--- LOAN_ACCOUNTS STRUCTURE ---' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
    AND table_name = 'loan_accounts'
ORDER BY ordinal_position;

-- 3. Check collection_officers structure (if exists)
SELECT 
    '--- COLLECTION_OFFICERS STRUCTURE ---' as info;
    
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
    AND table_name = 'collection_officers'
ORDER BY ordinal_position;

-- 4. Check if schema is exposed
SELECT 
    '--- SCHEMA EXPOSURE CHECK ---' as info;

SELECT 
    nspname as schema_name,
    CASE 
        WHEN nspname = 'kastle_banking' THEN 'Schema exists in database'
        ELSE 'Schema not found'
    END as status
FROM pg_namespace
WHERE nspname = 'kastle_banking';

-- 5. Quick count of critical tables
SELECT 
    '--- TABLE COUNTS ---' as info;

SELECT 
    'Total tables in kastle_banking' as metric,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'kastle_banking'
    AND table_type = 'BASE TABLE';