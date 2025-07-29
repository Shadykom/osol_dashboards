-- CHECK SYSTEM APIS AND FUNCTIONS
-- This script identifies all functions/procedures and their schema dependencies

-- STEP 1: List all functions and procedures
SELECT 'FUNCTIONS AND PROCEDURES BY SCHEMA:' as info;

SELECT 
    n.nspname as "Schema",
    CASE p.prokind 
        WHEN 'f' THEN 'Function'
        WHEN 'p' THEN 'Procedure'
        WHEN 'a' THEN 'Aggregate'
        WHEN 'w' THEN 'Window'
    END as "Type",
    p.proname as "Name",
    pg_get_function_identity_arguments(p.oid) as "Arguments",
    pg_get_functiondef(p.oid) as "Definition"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'kastle_collection', 'kastle_banking')
  AND p.prokind IN ('f', 'p')  -- Functions and procedures
ORDER BY n.nspname, p.prokind, p.proname;

-- STEP 2: Check which functions reference old schemas
SELECT '' as blank;
SELECT 'FUNCTIONS THAT REFERENCE OLD SCHEMAS:' as info;

SELECT 
    n.nspname || '.' || p.proname as "Function",
    CASE 
        WHEN pg_get_functiondef(p.oid) LIKE '%public.%' THEN 'References public schema'
        WHEN pg_get_functiondef(p.oid) LIKE '%kastle_collection.%' THEN 'References kastle_collection schema'
        ELSE 'No old schema references'
    END as "Schema References"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'kastle_collection', 'kastle_banking')
  AND p.prokind IN ('f', 'p')
  AND (pg_get_functiondef(p.oid) LIKE '%public.%' 
       OR pg_get_functiondef(p.oid) LIKE '%kastle_collection.%')
ORDER BY n.nspname, p.proname;

-- STEP 3: Check Supabase RLS policies
SELECT '' as blank;
SELECT 'ROW LEVEL SECURITY POLICIES:' as info;

SELECT 
    schemaname as "Schema",
    tablename as "Table",
    policyname as "Policy Name",
    permissive as "Permissive",
    roles as "Roles",
    cmd as "Command",
    qual as "Using Expression",
    with_check as "With Check Expression"
FROM pg_policies
WHERE schemaname IN ('public', 'kastle_collection', 'kastle_banking')
ORDER BY schemaname, tablename, policyname;

-- STEP 4: Check triggers
SELECT '' as blank;
SELECT 'TRIGGERS:' as info;

SELECT 
    trigger_schema as "Schema",
    trigger_name as "Trigger",
    event_object_schema || '.' || event_object_table as "Table",
    action_statement as "Action"
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'kastle_collection', 'kastle_banking')
ORDER BY trigger_schema, trigger_name;

-- STEP 5: Check Supabase Edge Functions / Database Functions used in APIs
SELECT '' as blank;
SELECT 'FUNCTIONS EXPOSED AS APIS (Supabase RPC):' as info;

-- Functions that are likely exposed as APIs (have SECURITY DEFINER or are in public/exposed schemas)
SELECT 
    n.nspname as "Schema",
    p.proname as "Function Name",
    pg_get_function_identity_arguments(p.oid) as "Arguments",
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as "Security",
    obj_description(p.oid, 'pg_proc') as "Description"
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'kastle_collection', 'kastle_banking')
  AND p.prokind = 'f'
  AND NOT p.proisagg
  AND NOT p.proiswindow
ORDER BY n.nspname, p.proname;

-- STEP 6: Generate migration commands for functions
SELECT '' as blank;
SELECT 'MIGRATION COMMANDS FOR FUNCTIONS:' as info;

-- This generates ALTER FUNCTION commands to move functions to kastle_banking
SELECT 
    '-- Move function: ' || n.nspname || '.' || p.proname as comment,
    'ALTER FUNCTION ' || n.nspname || '.' || p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ') SET SCHEMA kastle_banking;' as command
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname IN ('public', 'kastle_collection')
  AND p.prokind = 'f'
ORDER BY n.nspname, p.proname;