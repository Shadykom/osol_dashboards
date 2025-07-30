
-- Minimal Collection Schema Fix
-- Run this in Supabase SQL Editor

-- Create schema
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- Grant permissions
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;

-- Create essential tables with minimal structure
CREATE TABLE IF NOT EXISTS kastle_collection.collection_teams (
    team_id INTEGER PRIMARY KEY,
    team_name VARCHAR(100),
    team_type VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    officer_name VARCHAR(100),
    team_id INTEGER
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_buckets (
    bucket_id VARCHAR(50) PRIMARY KEY,
    bucket_name VARCHAR(100),
    min_days INTEGER,
    max_days INTEGER
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id VARCHAR(50) PRIMARY KEY,
    case_number VARCHAR(50),
    loan_account_number VARCHAR(50),
    customer_id VARCHAR(50),
    total_outstanding DECIMAL(15,2),
    days_past_due INTEGER,
    case_status VARCHAR(50),
    priority VARCHAR(20),
    bucket_id VARCHAR(50),
    assigned_to VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_interactions (
    interaction_id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50),
    officer_id VARCHAR(50),
    interaction_type VARCHAR(50),
    interaction_date TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kastle_collection.promise_to_pay (
    ptp_id VARCHAR(50) PRIMARY KEY,
    case_id VARCHAR(50),
    promised_amount DECIMAL(15,2),
    promise_date DATE,
    status VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS kastle_collection.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE UNIQUE,
    total_cases INTEGER,
    total_outstanding DECIMAL(15,2),
    total_collected DECIMAL(15,2),
    collection_rate DECIMAL(5,2)
);

CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_summary (
    summary_id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50),
    summary_date DATE,
    total_collected DECIMAL(15,2),
    quality_score DECIMAL(5,2)
);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;

-- Disable RLS
ALTER TABLE kastle_collection.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.promise_to_pay DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- Insert minimal data
INSERT INTO kastle_collection.collection_teams (team_id, team_name, team_type) VALUES
    (1, 'Team A', 'FIELD'),
    (2, 'Team B', 'CALL_CENTER')
ON CONFLICT DO NOTHING;

INSERT INTO kastle_collection.collection_officers (officer_id, officer_name, team_id) VALUES
    ('OFF001', 'Officer 1', 1),
    ('OFF002', 'Officer 2', 2)
ON CONFLICT DO NOTHING;

INSERT INTO kastle_collection.collection_buckets (bucket_id, bucket_name, min_days, max_days) VALUES
    ('BUCKET_1', '1-30 Days', 1, 30),
    ('BUCKET_2', '31-60 Days', 31, 60),
    ('BUCKET_3', '61-90 Days', 61, 90)
ON CONFLICT DO NOTHING;

-- Insert sample daily summary
INSERT INTO kastle_collection.daily_collection_summary (summary_date, total_cases, total_outstanding, total_collected, collection_rate)
VALUES (CURRENT_DATE, 100, 1000000, 50000, 5.0)
ON CONFLICT DO NOTHING;
