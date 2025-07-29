-- CHECK RELATIONSHIPS - PURE SQL VERSION
-- This script checks foreign key relationships without using psql meta-commands

-- STEP 1: Check current foreign key relationships
SELECT 'CURRENT FOREIGN KEY RELATIONSHIPS:' as info;

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

-- STEP 2: Show indexes
SELECT '' as blank_line;
SELECT 'INDEXES IN KASTLE_BANKING:' as info;

SELECT 
    schemaname,
    tablename,
    indexname,
    indexdef
FROM pg_indexes
WHERE schemaname = 'kastle_banking'
ORDER BY tablename, indexname;

-- STEP 3: Show primary keys
SELECT '' as blank_line;
SELECT 'PRIMARY KEYS IN KASTLE_BANKING:' as info;

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

-- STEP 4: Count foreign keys by schema
SELECT '' as blank_line;
SELECT 'FOREIGN KEY COUNT BY SCHEMA:' as info;

SELECT 
    n.nspname as schema_name,
    COUNT(*) as foreign_key_count
FROM pg_constraint c
JOIN pg_namespace n ON n.oid = c.connamespace
WHERE c.contype = 'f'
  AND n.nspname IN ('public', 'kastle_collection', 'kastle_banking')
GROUP BY n.nspname
ORDER BY n.nspname;