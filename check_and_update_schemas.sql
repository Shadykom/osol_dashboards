-- Check current schemas
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('public', 'kastle_banking', 'kastle_collection')
ORDER BY schema_name;

-- Check tables in each schema
SELECT 
    table_schema,
    COUNT(*) as table_count
FROM information_schema.tables
WHERE table_schema IN ('public', 'kastle_banking', 'kastle_collection')
AND table_type = 'BASE TABLE'
GROUP BY table_schema
ORDER BY table_schema;

-- List all tables in kastle_banking schema
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
ORDER BY table_name;

-- List all tables in kastle_collection schema (to be migrated)
SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'kastle_collection'
ORDER BY table_name;

-- Check if kastle_banking schema exists, create if not
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'kastle_banking') THEN
        CREATE SCHEMA kastle_banking;
        RAISE NOTICE 'Created kastle_banking schema';
    END IF;
END
$$;

-- Grant permissions on kastle_banking schema
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA kastle_banking TO anon, authenticated, service_role;

-- Move tables from kastle_collection to kastle_banking if they exist
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Move each table from kastle_collection to kastle_banking
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_collection'
    LOOP
        -- Check if table already exists in kastle_banking
        IF NOT EXISTS (
            SELECT 1 
            FROM pg_tables 
            WHERE schemaname = 'kastle_banking' 
            AND tablename = r.tablename
        ) THEN
            EXECUTE format('ALTER TABLE kastle_collection.%I SET SCHEMA kastle_banking', r.tablename);
            RAISE NOTICE 'Moved table % from kastle_collection to kastle_banking', r.tablename;
        ELSE
            RAISE NOTICE 'Table % already exists in kastle_banking, skipping', r.tablename;
        END IF;
    END LOOP;
END
$$;

-- Move sequences from kastle_collection to kastle_banking
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT sequence_name 
        FROM information_schema.sequences 
        WHERE sequence_schema = 'kastle_collection'
    LOOP
        IF NOT EXISTS (
            SELECT 1 
            FROM information_schema.sequences 
            WHERE sequence_schema = 'kastle_banking' 
            AND sequence_name = r.sequence_name
        ) THEN
            EXECUTE format('ALTER SEQUENCE kastle_collection.%I SET SCHEMA kastle_banking', r.sequence_name);
            RAISE NOTICE 'Moved sequence % from kastle_collection to kastle_banking', r.sequence_name;
        END IF;
    END LOOP;
END
$$;

-- Move functions from kastle_collection to kastle_banking
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            proname as function_name,
            pg_get_function_identity_arguments(oid) as arguments
        FROM pg_proc 
        WHERE pronamespace = (SELECT oid FROM pg_namespace WHERE nspname = 'kastle_collection')
    LOOP
        BEGIN
            EXECUTE format('ALTER FUNCTION kastle_collection.%I(%s) SET SCHEMA kastle_banking', 
                          r.function_name, r.arguments);
            RAISE NOTICE 'Moved function % from kastle_collection to kastle_banking', r.function_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not move function %: %', r.function_name, SQLERRM;
        END;
    END LOOP;
END
$$;

-- Move views from kastle_collection to kastle_banking
DO $$
DECLARE
    r RECORD;
    view_def TEXT;
BEGIN
    FOR r IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'kastle_collection'
    LOOP
        -- Get view definition
        SELECT definition INTO view_def
        FROM pg_views
        WHERE schemaname = 'kastle_collection' AND viewname = r.viewname;
        
        -- Drop view in old schema
        EXECUTE format('DROP VIEW IF EXISTS kastle_collection.%I CASCADE', r.viewname);
        
        -- Create view in new schema with updated references
        view_def := REPLACE(view_def, 'kastle_collection.', 'kastle_banking.');
        EXECUTE format('CREATE VIEW kastle_banking.%I AS %s', r.viewname, view_def);
        
        RAISE NOTICE 'Moved view % from kastle_collection to kastle_banking', r.viewname;
    END LOOP;
END
$$;

-- Update foreign key constraints to reference kastle_banking
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT 
            tc.constraint_name,
            tc.table_schema,
            tc.table_name,
            kcu.column_name,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM information_schema.table_constraints AS tc
        JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY'
        AND (ccu.table_schema = 'kastle_collection' OR tc.table_schema = 'kastle_collection')
    LOOP
        -- Drop old constraint
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT IF EXISTS %I',
                      r.table_schema, r.table_name, r.constraint_name);
        
        -- Add new constraint with kastle_banking reference
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES kastle_banking.%I(%I)',
                      CASE WHEN r.table_schema = 'kastle_collection' THEN 'kastle_banking' ELSE r.table_schema END,
                      r.table_name,
                      r.constraint_name,
                      r.column_name,
                      r.foreign_table_name,
                      r.foreign_column_name);
        
        RAISE NOTICE 'Updated foreign key constraint % to reference kastle_banking', r.constraint_name;
    END LOOP;
END
$$;

-- Disable RLS on all tables in kastle_banking
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking'
    LOOP
        EXECUTE format('ALTER TABLE kastle_banking.%I DISABLE ROW LEVEL SECURITY', r.tablename);
        RAISE NOTICE 'Disabled RLS on kastle_banking.%', r.tablename;
    END LOOP;
END
$$;

-- Drop kastle_collection schema if empty
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_tables 
        WHERE schemaname = 'kastle_collection'
        LIMIT 1
    ) THEN
        DROP SCHEMA IF EXISTS kastle_collection CASCADE;
        RAISE NOTICE 'Dropped empty kastle_collection schema';
    ELSE
        RAISE NOTICE 'kastle_collection schema still contains objects, not dropping';
    END IF;
END
$$;

-- Final check - list all tables in kastle_banking
SELECT 
    'kastle_banking' as schema_name,
    tablename as table_name
FROM pg_tables
WHERE schemaname = 'kastle_banking'
ORDER BY tablename;

-- Check for any remaining references to kastle_collection
SELECT 
    'Remaining kastle_collection references' as check_type,
    COUNT(*) as count
FROM (
    SELECT 1 FROM pg_views WHERE schemaname = 'kastle_collection'
    UNION ALL
    SELECT 1 FROM pg_tables WHERE schemaname = 'kastle_collection'
    UNION ALL
    SELECT 1 FROM information_schema.sequences WHERE sequence_schema = 'kastle_collection'
) t;