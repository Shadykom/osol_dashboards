-- Rollback Migration Script
-- This script can be used to move tables back to their original schemas
-- WARNING: This assumes you know which tables originally belonged to which schema

-- Example rollback commands:
-- To move a table back to public schema:
-- ALTER TABLE kastle_banking.table_name SET SCHEMA public;

-- To move a table back to kastle_collection schema:
-- ALTER TABLE kastle_banking.table_name SET SCHEMA kastle_collection;

-- If you want to move ALL tables back to public schema:
DO $$
DECLARE
    cmd text;
BEGIN
    FOR cmd IN 
        SELECT 'ALTER TABLE kastle_banking.' || quote_ident(table_name) || ' SET SCHEMA public;'
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
          AND table_type = 'BASE TABLE'
    LOOP
        RAISE NOTICE 'Executing: %', cmd;
        -- Uncomment the next line to actually execute the rollback
        -- EXECUTE cmd;
    END LOOP;
END $$;

-- Note: The EXECUTE line is commented out for safety.
-- Review the commands that would be executed, then uncomment the EXECUTE line to perform the rollback.