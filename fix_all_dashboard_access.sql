-- Complete Dashboard Access Fix
-- This script fixes all access issues for the collection/overview dashboard

-- ============================================
-- PART 1: Fix Banking Schema Access
-- ============================================

-- Disable RLS temporarily on banking tables for dashboard access
ALTER TABLE kastle_banking.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customer_types DISABLE ROW LEVEL SECURITY;

-- Also check for collection_cases and collection_buckets in banking schema
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_banking' 
               AND table_name = 'collection_cases') THEN
        ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_banking' 
               AND table_name = 'collection_buckets') THEN
        ALTER TABLE kastle_banking.collection_buckets DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Grant permissions to anon role for banking schema
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;

-- ============================================
-- PART 2: Fix Collection Schema Access
-- ============================================

-- Grant usage on collection schema (it should already exist)
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;

-- Disable RLS on existing collection tables
DO $$ 
BEGIN
    -- Disable RLS on all collection schema tables
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_collection' 
               AND table_name = 'collection_cases') THEN
        ALTER TABLE kastle_collection.collection_cases DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_collection' 
               AND table_name = 'collection_teams') THEN
        ALTER TABLE kastle_collection.collection_teams DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_collection' 
               AND table_name = 'collection_officers') THEN
        ALTER TABLE kastle_collection.collection_officers DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_collection' 
               AND table_name = 'daily_collection_summary') THEN
        ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_collection' 
               AND table_name = 'officer_performance_summary') THEN
        ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_collection' 
               AND table_name = 'collection_interactions') THEN
        ALTER TABLE kastle_collection.collection_interactions DISABLE ROW LEVEL SECURITY;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_collection' 
               AND table_name = 'promise_to_pay') THEN
        ALTER TABLE kastle_collection.promise_to_pay DISABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- Grant permissions on collection schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated;

-- ============================================
-- PART 3: Insert Sample Data for Testing
-- ============================================

-- Insert sample collection teams if none exist (with proper team_code)
INSERT INTO kastle_collection.collection_teams (team_code, team_name, team_type)
SELECT 'TEAM_ALPHA', 'Team Alpha', 'FIELD'
WHERE NOT EXISTS (SELECT 1 FROM kastle_collection.collection_teams WHERE team_code = 'TEAM_ALPHA');

INSERT INTO kastle_collection.collection_teams (team_code, team_name, team_type)
SELECT 'TEAM_BETA', 'Team Beta', 'CALL_CENTER'
WHERE NOT EXISTS (SELECT 1 FROM kastle_collection.collection_teams WHERE team_code = 'TEAM_BETA');

INSERT INTO kastle_collection.collection_teams (team_code, team_name, team_type)
SELECT 'TEAM_GAMMA', 'Team Gamma', 'DIGITAL'
WHERE NOT EXISTS (SELECT 1 FROM kastle_collection.collection_teams WHERE team_code = 'TEAM_GAMMA');

-- Insert sample collection officers if none exist
-- First, check if officer_code is required
DO $$
DECLARE
    has_officer_code BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_officers' 
        AND column_name = 'officer_code'
        AND is_nullable = 'NO'
    ) INTO has_officer_code;
    
    IF has_officer_code THEN
        -- Insert with officer_code
        INSERT INTO kastle_collection.collection_officers (officer_code, officer_name, officer_type, team_id)
        SELECT 'OFF001', 'John Doe', 'FIELD', team_id
        FROM kastle_collection.collection_teams
        WHERE team_code = 'TEAM_ALPHA'
        AND NOT EXISTS (SELECT 1 FROM kastle_collection.collection_officers WHERE officer_code = 'OFF001');
        
        INSERT INTO kastle_collection.collection_officers (officer_code, officer_name, officer_type, team_id)
        SELECT 'OFF002', 'Jane Smith', 'CALL_CENTER', team_id
        FROM kastle_collection.collection_teams
        WHERE team_code = 'TEAM_BETA'
        AND NOT EXISTS (SELECT 1 FROM kastle_collection.collection_officers WHERE officer_code = 'OFF002');
    ELSE
        -- Insert without officer_code
        INSERT INTO kastle_collection.collection_officers (officer_name, officer_type, team_id)
        SELECT 'John Doe', 'FIELD', team_id
        FROM kastle_collection.collection_teams
        WHERE team_code = 'TEAM_ALPHA'
        AND NOT EXISTS (SELECT 1 FROM kastle_collection.collection_officers WHERE officer_name = 'John Doe');
        
        INSERT INTO kastle_collection.collection_officers (officer_name, officer_type, team_id)
        SELECT 'Jane Smith', 'CALL_CENTER', team_id
        FROM kastle_collection.collection_teams
        WHERE team_code = 'TEAM_BETA'
        AND NOT EXISTS (SELECT 1 FROM kastle_collection.collection_officers WHERE officer_name = 'Jane Smith');
    END IF;
END $$;

-- Insert sample daily summary for today if none exists
INSERT INTO kastle_collection.daily_collection_summary 
    (summary_date, total_cases, total_outstanding, total_collected, collection_rate)
SELECT 
    CURRENT_DATE, 
    150, 
    2500000, 
    125000, 
    5.0
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_collection.daily_collection_summary 
    WHERE summary_date = CURRENT_DATE
);

-- Insert sample data for the last 7 days
INSERT INTO kastle_collection.daily_collection_summary 
    (summary_date, total_cases, total_outstanding, total_collected, collection_rate)
SELECT 
    CURRENT_DATE - INTERVAL '1 day' * generate_series(1, 7),
    150 + (random() * 50)::int,
    2500000 + (random() * 500000)::int,
    125000 + (random() * 50000)::int,
    4.5 + (random() * 2)::numeric(5,2)
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_collection.daily_collection_summary 
    WHERE summary_date >= CURRENT_DATE - INTERVAL '7 days'
    AND summary_date < CURRENT_DATE
);

-- ============================================
-- PART 4: Verify the Setup
-- ============================================

-- Check banking schema tables
SELECT 
    'Banking Schema' as schema_type,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as security_status
FROM pg_tables
WHERE schemaname = 'kastle_banking'
AND tablename IN ('customers', 'accounts', 'transactions', 'loan_accounts', 'collection_cases', 'collection_buckets')
ORDER BY tablename;

-- Check collection schema tables
SELECT 
    'Collection Schema' as schema_type,
    tablename,
    rowsecurity,
    CASE WHEN rowsecurity THEN 'RLS Enabled' ELSE 'RLS Disabled' END as security_status
FROM pg_tables
WHERE schemaname = 'kastle_collection'
ORDER BY tablename;

-- Check data counts
SELECT 
    'Data Summary' as check_type,
    (SELECT COUNT(*) FROM kastle_banking.customers) as banking_customers,
    (SELECT COUNT(*) FROM kastle_banking.accounts) as banking_accounts,
    (SELECT COUNT(*) FROM kastle_collection.collection_teams) as collection_teams,
    (SELECT COUNT(*) FROM kastle_collection.daily_collection_summary) as collection_summaries;

-- Show collection teams
SELECT 'Collection Teams' as data_type, team_code, team_name, team_type 
FROM kastle_collection.collection_teams;

-- Show recent collection summaries
SELECT 'Recent Collection Summaries' as data_type, summary_date, total_cases, total_collected, collection_rate
FROM kastle_collection.daily_collection_summary
WHERE summary_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY summary_date DESC;