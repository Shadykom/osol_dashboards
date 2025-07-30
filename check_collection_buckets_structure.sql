-- Script to check the actual structure of collection_buckets table
-- This will help identify all NOT NULL constraints

-- Check columns in kastle_banking.collection_buckets
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_buckets'
ORDER BY ordinal_position;

-- Check constraints on the table
SELECT 
    conname AS constraint_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM pg_constraint
WHERE conrelid = 'kastle_banking.collection_buckets'::regclass;

-- Show the complete table definition
SELECT 
    'kastle_banking.collection_buckets' as table_name,
    pg_get_tabledef('kastle_banking.collection_buckets'::regclass) as definition;

-- Alternative way to see the table structure
\d kastle_banking.collection_buckets

-- Check if kastle_collection schema has the same table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_collection' 
AND table_name = 'collection_buckets'
ORDER BY ordinal_position;