-- SIMPLE DROP ALL PUBLIC VIEWS
-- This generates and executes DROP commands for all views in public schema

-- Show what will be dropped
SELECT 
    'public.' || table_name as "Views to Drop"
FROM information_schema.views
WHERE table_schema = 'public'
ORDER BY table_name;

-- Generate and execute DROP commands
DO $$
DECLARE
    cmd TEXT;
BEGIN
    FOR cmd IN 
        SELECT 'DROP VIEW IF EXISTS public.' || quote_ident(table_name) || ' CASCADE;'
        FROM information_schema.views
        WHERE table_schema = 'public'
        ORDER BY table_name
    LOOP
        EXECUTE cmd;
        RAISE NOTICE 'Executed: %', cmd;
    END LOOP;
END $$;

-- Verify
SELECT 
    CASE 
        WHEN COUNT(*) = 0 THEN 'SUCCESS: All views dropped from public schema'
        ELSE 'WARNING: ' || COUNT(*) || ' views still remain in public schema'
    END as result
FROM information_schema.views
WHERE table_schema = 'public';