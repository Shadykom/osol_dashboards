-- CHECK AND REBUILD RELATIONSHIPS
-- This script checks foreign key relationships and helps rebuild them if needed

-- STEP 1: Check current foreign key relationships
\echo 'Current Foreign Key Relationships:'
\echo '================================='
SELECT 
    n.nspname as "Schema",
    conname as "Constraint Name",
    conrelid::regclass::text as "Table",
    a.attname as "Column",
    confrelid::regclass::text as "References Table",
    af.attname as "References Column"
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE c.contype = 'f'
  AND n.nspname IN ('public', 'kastle_collection', 'kastle_banking')
ORDER BY n.nspname, conrelid::regclass::text;

-- STEP 2: Generate commands to recreate foreign keys in kastle_banking
\echo ''
\echo 'Commands to Recreate Foreign Keys (if needed):'
\echo '============================================='
\echo ''
\echo '-- If you lost any foreign keys during migration, use these commands to recreate them:'
\echo ''

-- Common foreign key patterns in banking/collection systems
\echo '-- Example foreign keys (adjust table and column names as needed):'
\echo ''
\echo '-- Collection cases to customers'
\echo 'ALTER TABLE kastle_banking.collection_cases'
\echo '  ADD CONSTRAINT fk_collection_cases_customer'
\echo '  FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(id);'
\echo ''
\echo '-- Collection interactions to cases'
\echo 'ALTER TABLE kastle_banking.collection_interactions'
\echo '  ADD CONSTRAINT fk_interactions_case'
\echo '  FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(id);'
\echo ''
\echo '-- Collection interactions to officers'
\echo 'ALTER TABLE kastle_banking.collection_interactions'
\echo '  ADD CONSTRAINT fk_interactions_officer'
\echo '  FOREIGN KEY (officer_id) REFERENCES kastle_banking.collection_officers(id);'
\echo ''
\echo '-- Promise to pay to cases'
\echo 'ALTER TABLE kastle_banking.promise_to_pay'
\echo '  ADD CONSTRAINT fk_promise_case'
\echo '  FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(id);'
\echo ''
\echo '-- Officer performance to officers'
\echo 'ALTER TABLE kastle_banking.officer_performance_metrics'
\echo '  ADD CONSTRAINT fk_performance_officer'
\echo '  FOREIGN KEY (officer_id) REFERENCES kastle_banking.collection_officers(id);'

-- STEP 3: Check for orphaned records
\echo ''
\echo ''
\echo 'Checking for Orphaned Records:'
\echo '=============================='
\echo ''
\echo '-- Use these queries to find orphaned records (adjust column names as needed):'
\echo ''
\echo '-- Find collection_interactions without valid case_id:'
\echo 'SELECT COUNT(*) as orphaned_interactions'
\echo 'FROM kastle_banking.collection_interactions i'
\echo 'WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.collection_cases c WHERE c.id = i.case_id);'
\echo ''
\echo '-- Find promise_to_pay without valid case_id:'
\echo 'SELECT COUNT(*) as orphaned_promises'
\echo 'FROM kastle_banking.promise_to_pay p'
\echo 'WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.collection_cases c WHERE c.id = p.case_id);'

-- STEP 4: Show indexes (they should be preserved)
\echo ''
\echo ''
\echo 'Indexes in kastle_banking schema:'
\echo '================================'
SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'kastle_banking'
ORDER BY tablename, indexname;

-- STEP 5: Show primary keys
\echo ''
\echo 'Primary Keys in kastle_banking schema:'
\echo '====================================='
SELECT 
    tc.table_name,
    tc.constraint_name,
    string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position) as key_columns
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
WHERE tc.constraint_type = 'PRIMARY KEY'
  AND tc.table_schema = 'kastle_banking'
GROUP BY tc.table_name, tc.constraint_name
ORDER BY tc.table_name;