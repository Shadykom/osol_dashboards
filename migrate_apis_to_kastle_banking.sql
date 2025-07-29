-- MIGRATE ALL APIS AND FUNCTIONS TO KASTLE_BANKING
-- This script migrates functions, updates their definitions, and handles all API-related objects

BEGIN;

-- ================================================
-- STEP 1: MIGRATE FUNCTIONS AND UPDATE REFERENCES
-- ================================================
DO $$
DECLARE
    func_record RECORD;
    func_def TEXT;
    new_func_def TEXT;
    func_count INTEGER := 0;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Starting API and Function Migration...';
    
    -- First, get all functions from public and kastle_collection
    FOR func_record IN
        SELECT 
            n.nspname as schema_name,
            p.proname as function_name,
            p.oid as function_oid,
            pg_get_function_identity_arguments(p.oid) as arguments,
            pg_get_functiondef(p.oid) as definition,
            p.prosecdef as is_security_definer
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname IN ('public', 'kastle_collection')
          AND p.prokind IN ('f', 'p')  -- Functions and procedures
        ORDER BY n.nspname, p.proname
    LOOP
        BEGIN
            -- Get the current function definition
            func_def := func_record.definition;
            
            -- Update schema references in the function body
            new_func_def := func_def;
            
            -- Replace table references
            new_func_def := regexp_replace(new_func_def, '\mpublic\.', 'kastle_banking.', 'g');
            new_func_def := regexp_replace(new_func_def, '\mkastle_collection\.', 'kastle_banking.', 'g');
            
            -- Replace function schema in CREATE statement
            new_func_def := regexp_replace(new_func_def, 
                'CREATE (OR REPLACE )?FUNCTION ' || func_record.schema_name || '\.',
                'CREATE OR REPLACE FUNCTION kastle_banking.', 'gi');
            
            -- Drop the old function
            EXECUTE format('DROP FUNCTION IF EXISTS %I.%I(%s) CASCADE', 
                          func_record.schema_name, 
                          func_record.function_name, 
                          func_record.arguments);
            
            -- Create the new function in kastle_banking
            EXECUTE new_func_def;
            
            RAISE NOTICE 'Migrated function: %.% -> kastle_banking.%', 
                        func_record.schema_name, func_record.function_name, func_record.function_name;
            
            func_count := func_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to migrate function %.%: %', 
                         func_record.schema_name, func_record.function_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Functions migrated: %', func_count;
END $$;

-- ================================================
-- STEP 2: UPDATE EXISTING FUNCTIONS IN KASTLE_BANKING
-- ================================================
DO $$
DECLARE
    func_record RECORD;
    func_def TEXT;
    new_func_def TEXT;
    updated_count INTEGER := 0;
BEGIN
    RAISE NOTICE 'Updating existing functions in kastle_banking to use correct schema references...';
    
    -- Update functions already in kastle_banking that might reference old schemas
    FOR func_record IN
        SELECT 
            p.proname as function_name,
            p.oid as function_oid,
            pg_get_function_identity_arguments(p.oid) as arguments,
            pg_get_functiondef(p.oid) as definition
        FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'kastle_banking'
          AND p.prokind IN ('f', 'p')
          AND (pg_get_functiondef(p.oid) LIKE '%public.%' 
               OR pg_get_functiondef(p.oid) LIKE '%kastle_collection.%')
    LOOP
        BEGIN
            -- Get current definition
            func_def := func_record.definition;
            
            -- Update schema references
            new_func_def := func_def;
            new_func_def := regexp_replace(new_func_def, '\mpublic\.', 'kastle_banking.', 'g');
            new_func_def := regexp_replace(new_func_def, '\mkastle_collection\.', 'kastle_banking.', 'g');
            
            -- Recreate the function with updated references
            EXECUTE new_func_def;
            
            RAISE NOTICE 'Updated function: kastle_banking.%', func_record.function_name;
            updated_count := updated_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to update function kastle_banking.%: %', 
                         func_record.function_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Functions updated: %', updated_count;
END $$;

-- ================================================
-- STEP 3: MIGRATE TRIGGERS
-- ================================================
DO $$
DECLARE
    trig_record RECORD;
    trig_count INTEGER := 0;
    new_action TEXT;
BEGIN
    RAISE NOTICE 'Migrating triggers...';
    
    FOR trig_record IN
        SELECT 
            trigger_schema,
            trigger_name,
            event_object_schema,
            event_object_table,
            action_statement,
            action_timing,
            event_manipulation,
            action_orientation
        FROM information_schema.triggers
        WHERE trigger_schema IN ('public', 'kastle_collection')
          AND event_object_schema IN ('public', 'kastle_collection')
    LOOP
        BEGIN
            -- Update the action statement to reference kastle_banking
            new_action := trig_record.action_statement;
            new_action := regexp_replace(new_action, '\mpublic\.', 'kastle_banking.', 'g');
            new_action := regexp_replace(new_action, '\mkastle_collection\.', 'kastle_banking.', 'g');
            
            -- Drop old trigger
            EXECUTE format('DROP TRIGGER IF EXISTS %I ON %I.%I CASCADE',
                          trig_record.trigger_name,
                          trig_record.event_object_schema,
                          trig_record.event_object_table);
            
            -- Note: Triggers would need to be recreated on tables in kastle_banking
            -- This is handled when tables are moved
            
            trig_count := trig_count + 1;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE WARNING 'Failed to process trigger %: %', trig_record.trigger_name, SQLERRM;
        END;
    END LOOP;
    
    RAISE NOTICE 'Triggers processed: %', trig_count;
END $$;

-- ================================================
-- STEP 4: UPDATE SUPABASE SPECIFIC SETTINGS
-- ================================================

-- Update search_path for the database
ALTER DATABASE postgres SET search_path TO kastle_banking, public, extensions;

-- Grant necessary permissions for Supabase
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA kastle_banking TO anon, authenticated, service_role;

-- ================================================
-- STEP 5: CREATE API EXPOSURE FUNCTIONS
-- ================================================

-- Create a function to expose kastle_banking functions to PostgREST
CREATE OR REPLACE FUNCTION kastle_banking.expose_api_functions()
RETURNS void AS $$
BEGIN
    -- Grant execute permissions on all functions to API roles
    EXECUTE 'GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA kastle_banking TO anon, authenticated';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Execute the exposure function
SELECT kastle_banking.expose_api_functions();

-- ================================================
-- STEP 6: VERIFICATION
-- ================================================

-- Show migrated functions
SELECT '' as blank;
SELECT 'MIGRATED FUNCTIONS IN KASTLE_BANKING:' as info;

SELECT 
    p.proname as "Function Name",
    pg_get_function_identity_arguments(p.oid) as "Arguments",
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as "Security"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname = 'kastle_banking'
  AND p.prokind IN ('f', 'p')
ORDER BY p.proname;

-- Check for any remaining functions in old schemas
SELECT '' as blank;
SELECT 'REMAINING FUNCTIONS IN OLD SCHEMAS:' as info;

SELECT 
    n.nspname as "Schema",
    COUNT(*) as "Function Count"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'kastle_collection')
  AND p.prokind IN ('f', 'p')
GROUP BY n.nspname;

COMMIT;

-- ================================================
-- IMPORTANT: UPDATE YOUR APPLICATION
-- ================================================
-- After running this migration, update your application code:
-- 1. Update Supabase client to use kastle_banking schema
-- 2. Update any RPC calls to reference kastle_banking.function_name
-- 3. Update any direct SQL queries to use kastle_banking schema
-- 4. Test all API endpoints to ensure they work correctly