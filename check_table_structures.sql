-- Check all table structures needed by the application
-- This query will show which tables exist and their column definitions

WITH table_check AS (
  SELECT 
    t.table_schema,
    t.table_name,
    array_agg(
      json_build_object(
        'column_name', c.column_name,
        'data_type', c.data_type,
        'is_nullable', c.is_nullable,
        'column_default', c.column_default
      ) ORDER BY c.ordinal_position
    ) as columns
  FROM information_schema.tables t
  LEFT JOIN information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name
  WHERE t.table_schema = 'kastle_banking'
    AND t.table_name IN (
      -- Core banking tables
      'customers',
      'accounts',
      'transactions',
      'loan_accounts',
      'branches',
      'currencies',
      'countries',
      'audit_trail',
      'auth_user_profiles',
      'realtime_notifications',
      'customer_addresses',
      'customer_contacts',
      'customer_documents',
      'customer_types',
      'products',
      'product_categories',
      'bank_config',
      
      -- Collection tables
      'collection_cases',
      'collection_buckets',
      'collection_rates',
      'collection_officers',
      'collection_teams',
      'collection_interactions',
      'collection_scores',
      'collection_strategies',
      'promise_to_pay',
      'legal_cases',
      'call_attempts',
      'field_visits',
      'digital_collection_attempts',
      'hardship_applications',
      
      -- Performance tables
      'delinquencies',
      'branch_collection_performance',
      'officer_performance_summary',
      'officer_performance_metrics',
      'daily_collection_summary',
      'system_performance',
      
      -- History tables
      'case_bucket_history',
      'collection_campaigns',
      
      -- Type/reference tables
      'account_types',
      'transaction_types',
      'loan_types'
    )
  GROUP BY t.table_schema, t.table_name
),
missing_tables AS (
  SELECT unnest(ARRAY[
    'customers',
    'accounts',
    'transactions',
    'loan_accounts',
    'branches',
    'currencies',
    'countries',
    'audit_trail',
    'auth_user_profiles',
    'realtime_notifications',
    'customer_addresses',
    'customer_contacts',
    'customer_documents',
    'customer_types',
    'products',
    'product_categories',
    'bank_config',
    'collection_cases',
    'collection_buckets',
    'collection_rates',
    'collection_officers',
    'collection_teams',
    'collection_interactions',
    'collection_scores',
    'collection_strategies',
    'promise_to_pay',
    'legal_cases',
    'call_attempts',
    'field_visits',
    'digital_collection_attempts',
    'hardship_applications',
    'delinquencies',
    'branch_collection_performance',
    'officer_performance_summary',
    'officer_performance_metrics',
    'daily_collection_summary',
    'system_performance',
    'case_bucket_history',
    'collection_campaigns',
    'account_types',
    'transaction_types',
    'loan_types'
  ]) AS table_name
  EXCEPT
  SELECT table_name FROM table_check
)
SELECT 
  'EXISTING TABLE' as status,
  table_schema,
  table_name,
  jsonb_pretty(to_jsonb(columns)) as columns
FROM table_check
UNION ALL
SELECT 
  'MISSING TABLE' as status,
  'kastle_banking' as table_schema,
  table_name,
  NULL as columns
FROM missing_tables
ORDER BY status DESC, table_name;

-- Also check for specific columns that are causing errors
SELECT 
  '--- SPECIFIC COLUMN CHECKS ---' as info;

-- Check loan_accounts columns
SELECT 
  'loan_accounts columns' as table_info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'loan_accounts'
  AND column_name IN ('product_type', 'outstanding_balance', 'branch_id', 'customer_id', 'loan_status')
ORDER BY ordinal_position;

-- Check collection_officers columns  
SELECT 
  'collection_officers columns' as table_info,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
  AND table_name = 'collection_officers'
  AND column_name IN ('branch_id', 'is_active', 'officer_id', 'officer_name')
ORDER BY ordinal_position;

-- Check if kastle_banking schema exists and is exposed
SELECT 
  '--- SCHEMA CHECK ---' as info;

SELECT 
  schema_name,
  schema_owner,
  CASE 
    WHEN schema_name = 'kastle_banking' THEN 'Schema exists'
    ELSE 'Schema missing'
  END as status
FROM information_schema.schemata
WHERE schema_name = 'kastle_banking';

-- Check RLS status for problematic tables
SELECT 
  '--- RLS STATUS ---' as info;

SELECT 
  schemaname,
  tablename,
  CASE 
    WHEN rowsecurity THEN 'RLS ENABLED'
    ELSE 'RLS DISABLED'
  END as rls_status
FROM pg_tables
WHERE schemaname = 'kastle_banking'
  AND tablename IN ('loan_accounts', 'collection_officers')
ORDER BY tablename;