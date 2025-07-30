-- Fix for missing kastle_collection schema and tables
-- This script creates the kastle_collection schema and essential tables

-- Create kastle_collection schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- Grant permissions on the schema
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;

-- Create collection_teams table
CREATE TABLE IF NOT EXISTS kastle_collection.collection_teams (
    team_id SERIAL PRIMARY KEY,
    team_code VARCHAR(50) NOT NULL UNIQUE,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50) CHECK (team_type IN ('CALL_CENTER', 'FIELD', 'LEGAL', 'DIGITAL', 'RECOVERY')),
    branch_id VARCHAR(50),
    manager_id VARCHAR(50),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collection_officers table
CREATE TABLE IF NOT EXISTS kastle_collection.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    employee_id VARCHAR(50),
    officer_name VARCHAR(100) NOT NULL,
    officer_type VARCHAR(50) CHECK (officer_type IN ('CALL_AGENT', 'FIELD_AGENT', 'LEGAL_OFFICER', 'SENIOR_COLLECTOR', 'TEAM_LEAD')),
    team_id INTEGER REFERENCES kastle_collection.collection_teams(team_id),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    language_skills VARCHAR(100),
    collection_limit NUMERIC(15,2),
    commission_rate NUMERIC(5,2),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    joining_date DATE,
    last_active TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collection_buckets table (if not exists in kastle_banking)
CREATE TABLE IF NOT EXISTS kastle_collection.collection_buckets (
    bucket_id SERIAL PRIMARY KEY,
    bucket_name VARCHAR(50) NOT NULL,
    bucket_code VARCHAR(20) UNIQUE,
    min_days INTEGER,
    max_days INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collection_cases table
CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE,
    customer_id VARCHAR(50),
    loan_account_number VARCHAR(50),
    total_outstanding NUMERIC(15,2),
    days_past_due INTEGER,
    bucket_id INTEGER,
    case_status VARCHAR(50) DEFAULT 'ACTIVE',
    priority VARCHAR(20) DEFAULT 'NORMAL',
    assigned_to VARCHAR(50) REFERENCES kastle_collection.collection_officers(officer_id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collection_interactions table
CREATE TABLE IF NOT EXISTS kastle_collection.collection_interactions (
    interaction_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    customer_id VARCHAR(50),
    interaction_date TIMESTAMPTZ DEFAULT NOW(),
    interaction_type VARCHAR(50) CHECK (interaction_type IN ('CALL', 'SMS', 'EMAIL', 'LETTER', 'VISIT', 'LEGAL_NOTICE', 'WHATSAPP', 'IVR')),
    channel VARCHAR(50),
    officer_id VARCHAR(50) REFERENCES kastle_collection.collection_officers(officer_id),
    department VARCHAR(50),
    purpose VARCHAR(100),
    duration_minutes INTEGER,
    outcome VARCHAR(100),
    satisfaction_score INTEGER,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create promise_to_pay table
CREATE TABLE IF NOT EXISTS kastle_collection.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    customer_id VARCHAR(50),
    amount NUMERIC(15,2),
    promise_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create daily_collection_summary table
CREATE TABLE IF NOT EXISTS kastle_collection.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_outstanding NUMERIC(15,2) DEFAULT 0,
    total_collected NUMERIC(15,2) DEFAULT 0,
    collection_rate NUMERIC(5,2) DEFAULT 0,
    new_cases INTEGER DEFAULT 0,
    closed_cases INTEGER DEFAULT 0,
    active_officers INTEGER DEFAULT 0,
    total_interactions INTEGER DEFAULT 0,
    successful_contacts INTEGER DEFAULT 0,
    promises_made INTEGER DEFAULT 0,
    promises_kept INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(summary_date)
);

-- Create officer_performance_summary table
CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_summary (
    performance_id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50) REFERENCES kastle_collection.collection_officers(officer_id),
    summary_date DATE NOT NULL,
    cases_handled INTEGER DEFAULT 0,
    amount_collected NUMERIC(15,2) DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    successful_contacts INTEGER DEFAULT 0,
    promises_secured INTEGER DEFAULT 0,
    average_call_time NUMERIC(5,2) DEFAULT 0,
    productivity_score NUMERIC(5,2) DEFAULT 0,
    quality_score NUMERIC(5,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(officer_id, summary_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_customer_id ON kastle_collection.collection_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_cases_status ON kastle_collection.collection_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_customer_id ON kastle_collection.collection_interactions(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_date ON kastle_collection.collection_interactions(interaction_date);
CREATE INDEX IF NOT EXISTS idx_daily_summary_date ON kastle_collection.daily_collection_summary(summary_date);
CREATE INDEX IF NOT EXISTS idx_officer_performance_date ON kastle_collection.officer_performance_summary(summary_date);

-- Grant permissions on all tables
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;

-- Insert sample data for collection teams
INSERT INTO kastle_collection.collection_teams (team_code, team_name, team_type, status)
VALUES 
    ('CALL_TEAM_01', 'Call Center Team 1', 'CALL_CENTER', 'ACTIVE'),
    ('FIELD_TEAM_01', 'Field Collection Team 1', 'FIELD', 'ACTIVE'),
    ('LEGAL_TEAM_01', 'Legal Team 1', 'LEGAL', 'ACTIVE'),
    ('DIGITAL_TEAM_01', 'Digital Collection Team', 'DIGITAL', 'ACTIVE')
ON CONFLICT (team_code) DO NOTHING;

-- Insert sample data for collection officers
INSERT INTO kastle_collection.collection_officers (officer_id, officer_name, officer_type, team_id, email, contact_number, status)
SELECT 
    'OFF_' || LPAD(generate_series::text, 3, '0'),
    'Officer ' || generate_series,
    CASE 
        WHEN generate_series % 4 = 0 THEN 'TEAM_LEAD'
        WHEN generate_series % 4 = 1 THEN 'SENIOR_COLLECTOR'
        WHEN generate_series % 4 = 2 THEN 'CALL_AGENT'
        ELSE 'FIELD_AGENT'
    END,
    (generate_series % 4) + 1,
    'officer' || generate_series || '@osol.com',
    '+966' || (500000000 + generate_series),
    'ACTIVE'
FROM generate_series(1, 20)
ON CONFLICT (officer_id) DO NOTHING;

-- Insert sample collection buckets
INSERT INTO kastle_collection.collection_buckets (bucket_code, bucket_name, min_days, max_days)
VALUES 
    ('CURRENT', 'Current', 0, 0),
    ('BUCKET_1', '1-30 Days', 1, 30),
    ('BUCKET_2', '31-60 Days', 31, 60),
    ('BUCKET_3', '61-90 Days', 61, 90),
    ('BUCKET_4', '91-120 Days', 91, 120),
    ('BUCKET_5', '121-180 Days', 121, 180),
    ('BUCKET_6', '180+ Days', 181, 9999)
ON CONFLICT (bucket_code) DO NOTHING;

-- Insert sample daily collection summary for the last 30 days
INSERT INTO kastle_collection.daily_collection_summary (
    summary_date,
    total_cases,
    total_outstanding,
    total_collected,
    collection_rate,
    new_cases,
    closed_cases,
    active_officers,
    total_interactions,
    successful_contacts,
    promises_made,
    promises_kept
)
SELECT 
    CURRENT_DATE - INTERVAL '1 day' * generate_series,
    100 + (random() * 50)::int,
    1000000 + (random() * 500000)::numeric,
    50000 + (random() * 50000)::numeric,
    5 + (random() * 10)::numeric,
    5 + (random() * 10)::int,
    3 + (random() * 7)::int,
    15 + (random() * 5)::int,
    200 + (random() * 100)::int,
    150 + (random() * 50)::int,
    20 + (random() * 20)::int,
    15 + (random() * 15)::int
FROM generate_series(0, 29)
ON CONFLICT (summary_date) DO NOTHING;

-- Create a function to handle missing foreign key references
CREATE OR REPLACE FUNCTION kastle_collection.ensure_valid_references()
RETURNS void AS $$
BEGIN
    -- Update any invalid customer_id references in collection tables
    UPDATE kastle_collection.collection_cases 
    SET customer_id = NULL 
    WHERE customer_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM kastle_banking.customers WHERE customers.customer_id = collection_cases.customer_id);
    
    UPDATE kastle_collection.collection_interactions 
    SET customer_id = NULL 
    WHERE customer_id IS NOT NULL 
    AND NOT EXISTS (SELECT 1 FROM kastle_banking.customers WHERE customers.customer_id = collection_interactions.customer_id);
END;
$$ LANGUAGE plpgsql;

-- Run the function to clean up invalid references
SELECT kastle_collection.ensure_valid_references();

-- Create views for easier querying
CREATE OR REPLACE VIEW kastle_collection.v_collection_overview AS
SELECT 
    COUNT(DISTINCT cc.case_id) as total_cases,
    SUM(cc.total_outstanding) as total_outstanding,
    COUNT(DISTINCT cc.customer_id) as unique_customers,
    AVG(cc.days_past_due) as avg_dpd,
    COUNT(DISTINCT CASE WHEN cc.case_status = 'ACTIVE' THEN cc.case_id END) as active_cases,
    COUNT(DISTINCT cc.assigned_to) as assigned_officers
FROM kastle_collection.collection_cases cc
WHERE cc.case_status = 'ACTIVE';

-- Grant permissions on views
GRANT SELECT ON kastle_collection.v_collection_overview TO anon, authenticated, service_role;

-- Verify the setup
DO $$
BEGIN
    RAISE NOTICE 'Collection schema setup completed';
    RAISE NOTICE 'Teams created: %', (SELECT COUNT(*) FROM kastle_collection.collection_teams);
    RAISE NOTICE 'Officers created: %', (SELECT COUNT(*) FROM kastle_collection.collection_officers);
    RAISE NOTICE 'Buckets created: %', (SELECT COUNT(*) FROM kastle_collection.collection_buckets);
    RAISE NOTICE 'Daily summaries created: %', (SELECT COUNT(*) FROM kastle_collection.daily_collection_summary);
END $$;