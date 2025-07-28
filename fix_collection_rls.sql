-- Fix Collection Schema RLS Policies
-- This script enables proper access to collection data

-- First, check if the collection schema and tables exist
-- If they don't exist, create them

-- Create collection schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- Grant usage on schema
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;

-- Create collection_cases table in kastle_collection schema if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES kastle_banking.customers(customer_id),
    loan_account_id UUID REFERENCES kastle_banking.loan_accounts(loan_account_id),
    total_outstanding DECIMAL(15,2),
    days_past_due INTEGER,
    case_status VARCHAR(50),
    priority VARCHAR(20),
    bucket_id INTEGER,
    assigned_to UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create daily_collection_summary table if it doesn't exist
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

-- Create collection_officers table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_collection.collection_officers (
    officer_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_name VARCHAR(255) NOT NULL,
    officer_type VARCHAR(50),
    team_id UUID,
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_teams table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_collection.collection_teams (
    team_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_name VARCHAR(255) NOT NULL,
    team_type VARCHAR(50),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create officer_performance_summary table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_summary (
    summary_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    officer_id UUID REFERENCES kastle_collection.collection_officers(officer_id),
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    promises_secured INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Enable RLS on collection tables
ALTER TABLE kastle_collection.collection_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous read access
CREATE POLICY "Allow anonymous read access to collection cases" ON kastle_collection.collection_cases
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anonymous read access to daily summaries" ON kastle_collection.daily_collection_summary
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anonymous read access to officers" ON kastle_collection.collection_officers
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anonymous read access to teams" ON kastle_collection.collection_teams
    FOR SELECT TO anon
    USING (true);

CREATE POLICY "Allow anonymous read access to performance" ON kastle_collection.officer_performance_summary
    FOR SELECT TO anon
    USING (true);

-- Create policies for authenticated users
CREATE POLICY "Allow authenticated read access to collection cases" ON kastle_collection.collection_cases
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access to daily summaries" ON kastle_collection.daily_collection_summary
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access to officers" ON kastle_collection.collection_officers
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access to teams" ON kastle_collection.collection_teams
    FOR SELECT TO authenticated
    USING (true);

CREATE POLICY "Allow authenticated read access to performance" ON kastle_collection.officer_performance_summary
    FOR SELECT TO authenticated
    USING (true);

-- Grant permissions
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;

-- Insert some sample data if tables are empty
INSERT INTO kastle_collection.collection_teams (team_name, team_type)
SELECT 'Team Alpha', 'FIELD'
WHERE NOT EXISTS (SELECT 1 FROM kastle_collection.collection_teams);

INSERT INTO kastle_collection.collection_teams (team_name, team_type)
SELECT 'Team Beta', 'CALL_CENTER'
WHERE NOT EXISTS (SELECT 1 FROM kastle_collection.collection_teams WHERE team_name = 'Team Beta');

-- Verify the setup
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'kastle_collection'
ORDER BY tablename;