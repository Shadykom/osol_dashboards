-- Unified Script to Get All Table Structures for Dashboard
-- This script retrieves the complete structure of all tables used by the dashboard

-- Set the search path to include both schemas
SET search_path TO kastle_banking, public;

-- Function to get table structure information
CREATE OR REPLACE FUNCTION get_table_structure(schema_name text, table_name text)
RETURNS TABLE (
    column_name text,
    data_type text,
    is_nullable text,
    column_default text,
    constraint_info text
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.column_name::text,
        c.data_type::text || 
        CASE 
            WHEN c.character_maximum_length IS NOT NULL 
            THEN '(' || c.character_maximum_length || ')'
            WHEN c.numeric_precision IS NOT NULL 
            THEN '(' || c.numeric_precision || ',' || c.numeric_scale || ')'
            ELSE ''
        END AS data_type,
        c.is_nullable::text,
        c.column_default::text,
        COALESCE(
            string_agg(
                CASE tc.constraint_type
                    WHEN 'PRIMARY KEY' THEN 'PK'
                    WHEN 'FOREIGN KEY' THEN 'FK -> ' || ccu.table_name || '(' || ccu.column_name || ')'
                    WHEN 'UNIQUE' THEN 'UNIQUE'
                    WHEN 'CHECK' THEN 'CHECK'
                    ELSE tc.constraint_type
                END, ', '
            ), 
            ''
        )::text AS constraint_info
    FROM 
        information_schema.columns c
    LEFT JOIN 
        information_schema.key_column_usage kcu 
        ON c.table_schema = kcu.table_schema 
        AND c.table_name = kcu.table_name 
        AND c.column_name = kcu.column_name
    LEFT JOIN 
        information_schema.table_constraints tc 
        ON kcu.constraint_schema = tc.constraint_schema 
        AND kcu.constraint_name = tc.constraint_name
    LEFT JOIN 
        information_schema.constraint_column_usage ccu 
        ON tc.constraint_schema = ccu.constraint_schema 
        AND tc.constraint_name = ccu.constraint_name
    WHERE 
        c.table_schema = schema_name 
        AND c.table_name = table_name
    GROUP BY 
        c.column_name, c.ordinal_position, c.data_type, 
        c.character_maximum_length, c.numeric_precision, 
        c.numeric_scale, c.is_nullable, c.column_default
    ORDER BY 
        c.ordinal_position;
END;
$$ LANGUAGE plpgsql;

-- Get all tables used by the dashboard
WITH dashboard_tables AS (
    SELECT DISTINCT table_schema, table_name 
    FROM information_schema.tables 
    WHERE table_schema IN ('kastle_banking', 'public')
    AND table_type = 'BASE TABLE'
    AND table_name IN (
        -- Core banking tables
        'customers',
        'accounts',
        'transactions',
        'loan_accounts',
        'branches',
        'currencies',
        'countries',
        'audit_trail',
        'auth_user_profiles',
        
        -- Product and category tables
        'products',
        'product_categories',
        
        -- Branch and performance tables
        'branch_performance',
        'branch_targets',
        'branch_daily_metrics',
        
        -- Officer and collection tables
        'collection_officers',
        'collection_cases',
        'collection_interactions',
        'collection_teams',
        'collection_scores',
        'collection_strategies',
        'collection_buckets',
        'collection_performance',
        'officer_performance_summary',
        
        -- Customer and segmentation tables
        'customer_segments',
        'customer_risk_profiles',
        'customer_interactions',
        
        -- Dashboard and analytics tables
        'dashboard_widgets',
        'dashboard_layouts',
        'daily_collection_summary',
        'monthly_collection_summary',
        
        -- System and configuration tables
        'system_configuration',
        'system_performance',
        
        -- Regulatory and reporting tables
        'regulatory_reports',
        'regulatory_report_config',
        'remediation_actions',
        
        -- Risk and compliance tables
        'risk_assessments',
        'compliance_checks'
    )
    ORDER BY table_schema, table_name
)
SELECT 
    '-- Table: ' || dt.table_schema || '.' || dt.table_name || E'\n' ||
    '-- Description: ' || COALESCE(obj_description(c.oid), 'No description available') || E'\n' ||
    '-- Columns:' || E'\n' ||
    string_agg(
        '  ' || rpad(ts.column_name, 30) || ' | ' || 
        rpad(ts.data_type, 25) || ' | ' || 
        rpad(ts.is_nullable, 8) || ' | ' || 
        rpad(COALESCE(ts.column_default, ''), 40) || ' | ' || 
        ts.constraint_info,
        E'\n' ORDER BY ts.column_name
    ) || E'\n\n' AS table_structure
FROM 
    dashboard_tables dt
CROSS JOIN LATERAL 
    get_table_structure(dt.table_schema, dt.table_name) ts
LEFT JOIN 
    pg_class c ON c.relname = dt.table_name 
    AND c.relnamespace = (SELECT oid FROM pg_namespace WHERE nspname = dt.table_schema)
GROUP BY 
    dt.table_schema, dt.table_name, c.oid
ORDER BY 
    dt.table_schema, dt.table_name;

-- Check for missing columns that the dashboard expects
SELECT E'\n\n-- MISSING COLUMNS CHECK --\n';

-- Check if transactions table has product_id column
SELECT 
    CASE 
        WHEN EXISTS (
            SELECT 1 
            FROM information_schema.columns 
            WHERE table_name = 'transactions' 
            AND column_name = 'product_id'
        )
        THEN '✓ transactions.product_id exists'
        ELSE '✗ MISSING: transactions.product_id - Required for product analytics'
    END AS column_check;

-- Check other potentially missing columns
WITH required_columns AS (
    SELECT 'transactions' AS table_name, 'product_id' AS column_name
    UNION ALL SELECT 'accounts', 'product_id'
    UNION ALL SELECT 'loan_accounts', 'product_id'
    UNION ALL SELECT 'customers', 'segment_id'
    UNION ALL SELECT 'branches', 'region_id'
    UNION ALL SELECT 'products', 'category_id'
)
SELECT 
    '  ' || rc.table_name || '.' || rc.column_name || ': ' ||
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END AS column_status
FROM 
    required_columns rc
LEFT JOIN 
    information_schema.columns c 
    ON c.table_name = rc.table_name 
    AND c.column_name = rc.column_name
    AND c.table_schema IN ('kastle_banking', 'public')
ORDER BY 
    rc.table_name, rc.column_name;

-- Get table row counts for context
SELECT E'\n\n-- TABLE ROW COUNTS --\n';

SELECT 
    schemaname || '.' || tablename AS full_table_name,
    n_live_tup AS estimated_rows
FROM 
    pg_stat_user_tables
WHERE 
    schemaname IN ('kastle_banking', 'public')
    AND tablename IN (
        'customers', 'accounts', 'transactions', 'loan_accounts', 
        'branches', 'products', 'collection_cases', 'collection_officers'
    )
ORDER BY 
    schemaname, tablename;

-- Get indexes on key tables
SELECT E'\n\n-- INDEXES ON KEY TABLES --\n';

SELECT 
    schemaname || '.' || tablename AS table_name,
    indexname,
    indexdef
FROM 
    pg_indexes
WHERE 
    schemaname IN ('kastle_banking', 'public')
    AND tablename IN ('transactions', 'accounts', 'customers', 'loan_accounts')
ORDER BY 
    schemaname, tablename, indexname;

-- Check for any recent errors in the database logs (if accessible)
SELECT E'\n\n-- RECENT ERROR PATTERNS --\n';

-- This would typically query pg_stat_activity or logs, but for now we'll check constraints
SELECT 
    conname AS constraint_name,
    contype AS constraint_type,
    conrelid::regclass AS table_name,
    pg_get_constraintdef(oid) AS constraint_definition
FROM 
    pg_constraint
WHERE 
    connamespace IN (
        SELECT oid FROM pg_namespace WHERE nspname IN ('kastle_banking', 'public')
    )
    AND contype IN ('c', 'f') -- CHECK and FOREIGN KEY constraints
    AND conrelid::regclass::text LIKE '%transaction%'
LIMIT 10;

-- Generate ALTER TABLE statements for missing columns
SELECT E'\n\n-- FIX MISSING COLUMNS (Execute these if needed) --\n';

SELECT '-- Add missing product_id to transactions table:
ALTER TABLE kastle_banking.transactions 
ADD COLUMN IF NOT EXISTS product_id INTEGER,
ADD CONSTRAINT fk_transactions_product 
    FOREIGN KEY (product_id) 
    REFERENCES kastle_banking.products(product_id);

-- Add index for better performance:
CREATE INDEX IF NOT EXISTS idx_transactions_product_id 
ON kastle_banking.transactions(product_id);

-- Add missing product_id to accounts table:
ALTER TABLE kastle_banking.accounts 
ADD COLUMN IF NOT EXISTS product_id INTEGER,
ADD CONSTRAINT fk_accounts_product 
    FOREIGN KEY (product_id) 
    REFERENCES kastle_banking.products(product_id);

-- Add missing product_id to loan_accounts table:
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS product_id INTEGER,
ADD CONSTRAINT fk_loan_accounts_product 
    FOREIGN KEY (product_id) 
    REFERENCES kastle_banking.products(product_id);';

-- Clean up the temporary function
DROP FUNCTION IF EXISTS get_table_structure(text, text);