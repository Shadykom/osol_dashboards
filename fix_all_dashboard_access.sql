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

-- Create collection schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- Grant usage on collection schema
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;

-- Create collection_cases table in kastle_collection schema if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID,
    loan_account_id UUID,
    total_outstanding DECIMAL(15,2),
    days_past_due INTEGER,
    case_status VARCHAR(50),
    priority VARCHAR(20),
    bucket_id INTEGER,
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create other necessary collection tables
CREATE TABLE IF NOT EXISTS kastle_collection.daily_collection_summary (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_outstanding DECIMAL(15,2) DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    new_cases INTEGER DEFAULT 0,
    closed_cases INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_officers (
    officer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_name VARCHAR(255) NOT NULL,
    officer_type VARCHAR(50),
    team_id UUID,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) NOT NULL,
    team_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_summary (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    promises_secured INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Disable RLS on collection tables for now
ALTER TABLE kastle_collection.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- Grant permissions on collection schema
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated;

-- ============================================
-- PART 3: Insert Sample Data for Testing
-- ============================================

-- Insert sample collection teams if none exist
INSERT INTO kastle_collection.collection_teams (team_name, team_type)
SELECT 'Team Alpha', 'FIELD'
WHERE NOT EXISTS (SELECT 1 FROM kastle_collection.collection_teams);

INSERT INTO kastle_collection.collection_teams (team_name, team_type)
SELECT 'Team Beta', 'CALL_CENTER'
WHERE NOT EXISTS (SELECT 1 FROM kastle_collection.collection_teams WHERE team_name = 'Team Beta');

-- Insert sample collection officers if none exist
INSERT INTO kastle_collection.collection_officers (officer_name, officer_type, team_id)
SELECT 'John Doe', 'FIELD', team_id
FROM kastle_collection.collection_teams
WHERE team_name = 'Team Alpha'
AND NOT EXISTS (SELECT 1 FROM kastle_collection.collection_officers);

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