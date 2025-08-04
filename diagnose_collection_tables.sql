-- Diagnostic Script for Collection Dashboard Tables
-- This script checks the current state of the database

-- 1. Check if kastle_banking schema exists
SELECT 
    schema_name,
    schema_owner
FROM information_schema.schemata
WHERE schema_name = 'kastle_banking';

-- 2. List all tables in kastle_banking schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
ORDER BY table_name;

-- 3. Check specifically for our required tables
SELECT 
    'remediation_actions' as required_table,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'remediation_actions'
    ) as exists;

-- 4. Check current user permissions
SELECT 
    current_user,
    has_schema_privilege(current_user, 'kastle_banking', 'CREATE') as can_create_in_schema,
    has_schema_privilege(current_user, 'kastle_banking', 'USAGE') as can_use_schema;

-- 5. Check if we can create tables
DO $$
BEGIN
    RAISE NOTICE 'Current user: %', current_user;
    RAISE NOTICE 'Can create schema: %', has_schema_privilege(current_user, 'CREATE');
    
    -- Try to create a test table
    BEGIN
        CREATE TABLE IF NOT EXISTS kastle_banking.test_permissions (id INT);
        DROP TABLE IF EXISTS kastle_banking.test_permissions;
        RAISE NOTICE 'Successfully created and dropped test table';
    EXCEPTION
        WHEN OTHERS THEN
            RAISE NOTICE 'Failed to create test table: %', SQLERRM;
    END;
END $$;