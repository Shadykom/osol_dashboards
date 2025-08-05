-- Check current state of branches and collection data

-- 1. Check if branches table exists and what's in it
SELECT 
    'Checking branches table...' as status;

SELECT 
    branch_id,
    branch_code,
    branch_name,
    branch_type,
    is_active,
    status
FROM kastle_banking.branches
ORDER BY branch_id;

-- 2. Check collection teams
SELECT 
    'Checking collection teams...' as status;

SELECT 
    team_id,
    team_name,
    team_lead_id,
    branch_id,
    is_active
FROM kastle_banking.collection_teams
ORDER BY team_id;

-- 3. Check daily collection summary
SELECT 
    'Checking daily collection summary (last 5 days)...' as status;

SELECT 
    summary_date,
    branch_id,
    total_collected,
    collection_rate,
    total_cases
FROM kastle_banking.daily_collection_summary
ORDER BY summary_date DESC
LIMIT 5;

-- 4. Check constraints on daily_collection_summary
SELECT 
    'Checking constraints on daily_collection_summary...' as status;

SELECT 
    conname as constraint_name,
    contype as constraint_type,
    pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'kastle_banking.daily_collection_summary'::regclass;

-- 5. If no branches exist, insert them
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.branches WHERE branch_id = 'RYD_MAIN') THEN
        RAISE NOTICE 'No branches found. Please run the fix_collection_all_in_order.sql script.';
    ELSE
        RAISE NOTICE 'Branches exist. Check if branch_id matches what is being inserted.';
    END IF;
END $$;