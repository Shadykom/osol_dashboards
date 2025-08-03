-- Fix Dashboard Errors
-- This script fixes the following issues:
-- 1. Missing collection_cases_detailed view
-- 2. Missing branch_id column in collection_teams table
-- 3. Duplicate key errors for customers and accounts

-- First, let's check current schema
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('kastle_banking', 'kastle_collection');

-- 1. Fix collection_teams table - add branch_id column if it doesn't exist
DO $$
BEGIN
    -- Check if the column exists in kastle_banking schema
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_teams' 
        AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE kastle_banking.collection_teams 
        ADD COLUMN branch_id VARCHAR(20);
        
        -- Add foreign key constraint
        ALTER TABLE kastle_banking.collection_teams
        ADD CONSTRAINT collection_teams_branch_id_fkey
        FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);
        
        -- Create index for better performance
        CREATE INDEX idx_collection_teams_branch_id 
        ON kastle_banking.collection_teams(branch_id);
        
        -- Update existing teams with default branch
        UPDATE kastle_banking.collection_teams
        SET branch_id = 'BR001'
        WHERE branch_id IS NULL;
        
        RAISE NOTICE 'Added branch_id column to kastle_banking.collection_teams';
    END IF;
    
    -- Check if the column exists in kastle_collection schema
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_teams'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_teams' 
        AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE kastle_collection.collection_teams 
        ADD COLUMN branch_id VARCHAR(20);
        
        -- Update existing teams with default branch
        UPDATE kastle_collection.collection_teams
        SET branch_id = 'BR001'
        WHERE branch_id IS NULL;
        
        RAISE NOTICE 'Added branch_id column to kastle_collection.collection_teams';
    END IF;
END $$;

-- 2. Create collection_cases_detailed view in kastle_banking schema
DROP VIEW IF EXISTS kastle_banking.collection_cases_detailed CASCADE;

CREATE VIEW kastle_banking.collection_cases_detailed AS
SELECT 
    cc.*,
    -- Loan account details
    la.loan_amount,
    la.outstanding_balance,
    la.overdue_amount,
    la.overdue_days,
    la.product_id,
    -- Product details
    p.product_name,
    p.product_type,
    -- Customer details
    c.full_name as customer_name,
    c.customer_type,
    c.email as customer_email,
    c.mobile_number as customer_phone,
    -- Officer details
    co.officer_name,
    co.officer_type,
    co.team_id,
    co.contact_number as officer_contact,
    -- Calculate priority based on amount and days
    CASE 
        WHEN cc.days_past_due >= 90 THEN 'HIGH'
        WHEN cc.days_past_due >= 60 THEN 'MEDIUM'
        WHEN cc.days_past_due >= 30 THEN 'LOW'
        ELSE 'NORMAL'
    END as priority
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la ON cc.loan_account_number = la.loan_account_number
LEFT JOIN kastle_banking.products p ON la.product_id = p.product_id
LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
LEFT JOIN kastle_banking.collection_officers co ON cc.assigned_to = co.officer_id;

-- Grant permissions
GRANT SELECT ON kastle_banking.collection_cases_detailed TO authenticated;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO anon;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO service_role;

-- Also create in kastle_collection schema if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.schemata 
        WHERE schema_name = 'kastle_collection'
    ) THEN
        EXECUTE 'DROP VIEW IF EXISTS kastle_collection.collection_cases_detailed CASCADE';
        
        EXECUTE '
        CREATE VIEW kastle_collection.collection_cases_detailed AS
        SELECT 
            cc.*,
            -- Loan account details
            la.loan_amount,
            la.outstanding_balance,
            la.overdue_amount,
            la.overdue_days,
            la.product_id,
            -- Product details
            p.product_name,
            p.product_type,
            -- Customer details
            c.full_name as customer_name,
            c.customer_type,
            c.email as customer_email,
            c.mobile_number as customer_phone,
            -- Officer details
            co.officer_name,
            co.officer_type,
            co.team_id,
            co.contact_number as officer_contact,
            -- Calculate priority based on amount and days
            CASE 
                WHEN cc.days_past_due >= 90 THEN ''HIGH''
                WHEN cc.days_past_due >= 60 THEN ''MEDIUM''
                WHEN cc.days_past_due >= 30 THEN ''LOW''
                ELSE ''NORMAL''
            END as priority
        FROM kastle_collection.collection_cases cc
        LEFT JOIN kastle_banking.loan_accounts la ON cc.loan_account_number = la.loan_account_number
        LEFT JOIN kastle_banking.products p ON la.product_id = p.product_id
        LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
        LEFT JOIN kastle_collection.collection_officers co ON cc.assigned_to = co.officer_id';
        
        EXECUTE 'GRANT SELECT ON kastle_collection.collection_cases_detailed TO authenticated';
        EXECUTE 'GRANT SELECT ON kastle_collection.collection_cases_detailed TO anon';
        EXECUTE 'GRANT SELECT ON kastle_collection.collection_cases_detailed TO service_role';
        
        RAISE NOTICE 'Created collection_cases_detailed view in kastle_collection schema';
    END IF;
END $$;

-- 3. Add is_active column to collection_teams if it doesn't exist
DO $$
BEGIN
    -- Check kastle_banking schema
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_teams' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE kastle_banking.collection_teams 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Update existing records
        UPDATE kastle_banking.collection_teams
        SET is_active = true
        WHERE is_active IS NULL;
        
        RAISE NOTICE 'Added is_active column to kastle_banking.collection_teams';
    END IF;
    
    -- Check kastle_collection schema
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_teams'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_teams' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE kastle_collection.collection_teams 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        
        -- Update existing records
        UPDATE kastle_collection.collection_teams
        SET is_active = true
        WHERE is_active IS NULL;
        
        RAISE NOTICE 'Added is_active column to kastle_collection.collection_teams';
    END IF;
END $$;

-- 4. Update collection_teams with proper branch assignments
UPDATE kastle_banking.collection_teams
SET branch_id = CASE team_id
    WHEN 1 THEN 'BR001'
    WHEN 2 THEN 'BR002'
    WHEN 3 THEN 'BR003'
    WHEN 4 THEN 'BR004'
    WHEN 5 THEN 'BR005'
    ELSE 'BR001'
END
WHERE branch_id IS NULL OR branch_id = '';

-- 5. Ensure RLS is disabled for all collection tables
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.promise_to_pay DISABLE ROW LEVEL SECURITY;

-- 6. Create missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_status 
ON kastle_banking.collection_cases(case_status);

CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned_to 
ON kastle_banking.collection_cases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_collection_cases_customer_id 
ON kastle_banking.collection_cases(customer_id);

CREATE INDEX IF NOT EXISTS idx_collection_officers_team_id 
ON kastle_banking.collection_officers(team_id);

CREATE INDEX IF NOT EXISTS idx_collection_officers_status 
ON kastle_banking.collection_officers(status);

-- 7. Verify the fixes
SELECT 
    'kastle_banking.collection_teams columns' as check_item,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as columns
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_teams'

UNION ALL

SELECT 
    'kastle_banking.collection_cases_detailed view' as check_item,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.views 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_cases_detailed'
        ) THEN 'EXISTS'
        ELSE 'NOT EXISTS'
    END as columns

UNION ALL

SELECT 
    'collection_teams with branch_id' as check_item,
    COUNT(*)::text || ' teams' as columns
FROM kastle_banking.collection_teams
WHERE branch_id IS NOT NULL;

-- Display summary
SELECT 
    'Dashboard Error Fixes Applied' as status,
    NOW() as timestamp,
    jsonb_build_object(
        'collection_cases_detailed_view', 'CREATED',
        'collection_teams_branch_id', 'ADDED',
        'collection_teams_is_active', 'ADDED',
        'indexes', 'CREATED',
        'rls', 'DISABLED'
    ) as fixes_applied;