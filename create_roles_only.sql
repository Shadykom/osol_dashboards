-- Create minimal roles needed for the previous scripts to work
-- Run this FIRST before running other fix scripts

-- Create web_anon role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'web_anon') THEN
        CREATE ROLE web_anon NOLOGIN;
        RAISE NOTICE 'Created role: web_anon';
    ELSE
        RAISE NOTICE 'Role web_anon already exists';
    END IF;
END $$;

-- Create authenticated role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
        CREATE ROLE authenticated NOLOGIN;
        RAISE NOTICE 'Created role: authenticated';
    ELSE
        RAISE NOTICE 'Role authenticated already exists';
    END IF;
END $$;

-- Verify roles were created
SELECT rolname, rolcanlogin 
FROM pg_roles 
WHERE rolname IN ('web_anon', 'authenticated')
ORDER BY rolname;