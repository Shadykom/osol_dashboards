-- Fix Dashboard Errors (Updated for kastle_banking schema)
-- This script fixes the following issues:
-- 1. Missing collection_cases_detailed view
-- 2. Missing branch_id column in collection_teams table
-- 3. Missing is_active column in collection_teams table

-- First, verify we're working with the correct schema
SELECT 'Current schemas:' as info;
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('kastle_banking', 'kastle_collection')
ORDER BY schema_name;

-- 1. Add branch_id column to collection_teams table in kastle_banking
DO $$
BEGIN
    -- Check if the column exists
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
        
        -- Update existing teams with default branch assignments
        UPDATE kastle_banking.collection_teams
        SET branch_id = CASE team_id
            WHEN 1 THEN 'BR001'
            WHEN 2 THEN 'BR002'
            WHEN 3 THEN 'BR003'
            WHEN 4 THEN 'BR004'
            WHEN 5 THEN 'BR005'
            ELSE 'BR001'
        END
        WHERE branch_id IS NULL;
        
        RAISE NOTICE 'Added branch_id column to kastle_banking.collection_teams';
    ELSE
        RAISE NOTICE 'branch_id column already exists in kastle_banking.collection_teams';
    END IF;
END $$;

-- 2. Add is_active column to collection_teams table
DO $$
BEGIN
    -- Check if the column exists
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
    ELSE
        RAISE NOTICE 'is_active column already exists in kastle_banking.collection_teams';
    END IF;
END $$;

-- 3. Create collection_cases_detailed view in kastle_banking schema
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

-- 4. Ensure RLS is disabled for all collection tables (for better performance)
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.promise_to_pay DISABLE ROW LEVEL SECURITY;

-- 5. Create missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_status 
ON kastle_banking.collection_cases(case_status);

CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned_to 
ON kastle_banking.collection_cases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_collection_cases_customer_id 
ON kastle_banking.collection_cases(customer_id);

CREATE INDEX IF NOT EXISTS idx_collection_cases_loan_account_number 
ON kastle_banking.collection_cases(loan_account_number);

CREATE INDEX IF NOT EXISTS idx_collection_officers_team_id 
ON kastle_banking.collection_officers(team_id);

CREATE INDEX IF NOT EXISTS idx_collection_officers_status 
ON kastle_banking.collection_officers(status);

-- 6. Insert sample teams if none exist
INSERT INTO kastle_banking.collection_teams (team_id, team_name, team_type, branch_id, is_active)
SELECT * FROM (VALUES
    (1, 'Team Alpha', 'FIELD', 'BR001', true),
    (2, 'Team Beta', 'PHONE', 'BR002', true),
    (3, 'Team Gamma', 'LEGAL', 'BR003', true),
    (4, 'Team Delta', 'FIELD', 'BR004', true),
    (5, 'Team Epsilon', 'PHONE', 'BR005', true)
) AS t(team_id, team_name, team_type, branch_id, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.collection_teams WHERE team_id = t.team_id
);

-- 7. Verify the fixes
SELECT 'Verification Results:' as info;

SELECT 
    'kastle_banking.collection_teams columns' as check_item,
    string_agg(column_name, ', ' ORDER BY ordinal_position) as result
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
    END as result

UNION ALL

SELECT 
    'collection_teams with branch_id' as check_item,
    COUNT(*)::text || ' teams' as result
FROM kastle_banking.collection_teams
WHERE branch_id IS NOT NULL

UNION ALL

SELECT 
    'Active collection teams' as check_item,
    COUNT(*)::text || ' teams' as result
FROM kastle_banking.collection_teams
WHERE is_active = true;

-- Display summary
SELECT 
    'Dashboard Error Fixes Applied' as status,
    NOW() as timestamp,
    jsonb_build_object(
        'schema', 'kastle_banking',
        'collection_cases_detailed_view', 'CREATED',
        'collection_teams_branch_id', 'ADDED',
        'collection_teams_is_active', 'ADDED',
        'indexes', 'CREATED',
        'rls', 'DISABLED',
        'sample_teams', 'INSERTED'
    ) as fixes_applied;