-- Check existing user_roles table structure
SELECT 
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'user_roles'
ORDER BY ordinal_position;

-- Check if the table exists
SELECT 
    table_name,
    table_schema
FROM information_schema.tables
WHERE table_name = 'user_roles'
AND table_schema IN ('kastle_banking', 'public', 'auth');

-- Check constraints
SELECT
    tc.constraint_name,
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'kastle_banking'
AND tc.table_name = 'user_roles';