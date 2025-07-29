-- Fix for kastle_banking schema issues
-- This script creates missing tables and relationships

-- Ensure kastle_banking schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Set search path
SET search_path TO kastle_banking, public;

-- Create collection_teams table if not exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id VARCHAR(50) PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create collection_officers table if not exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    officer_name VARCHAR(100) NOT NULL,
    officer_type VARCHAR(50),
    team_id VARCHAR(50),
    contact_number VARCHAR(20),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'active',
    language_skills TEXT[],
    collection_limit DECIMAL(15,2),
    commission_rate DECIMAL(5,2),
    joining_date DATE,
    last_active TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create branches table with branch_code column
CREATE TABLE IF NOT EXISTS kastle_banking.branches (
    branch_code VARCHAR(50) PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    branch_type VARCHAR(50),
    status VARCHAR(20) DEFAULT 'active',
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100),
    postal_code VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create officer_performance_metrics table
CREATE TABLE IF NOT EXISTS kastle_banking.officer_performance_metrics (
    metric_id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL,
    metric_date DATE NOT NULL,
    calls_made INTEGER DEFAULT 0,
    contacts_successful INTEGER DEFAULT 0,
    calls_answered INTEGER DEFAULT 0,
    ptps_obtained INTEGER DEFAULT 0,
    promises_made INTEGER DEFAULT 0,
    ptps_kept_rate DECIMAL(5,2),
    amount_collected DECIMAL(15,2) DEFAULT 0,
    accounts_worked INTEGER DEFAULT 0,
    cases_resolved INTEGER DEFAULT 0,
    talk_time_minutes INTEGER DEFAULT 0,
    quality_score DECIMAL(5,2),
    customer_satisfaction_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(officer_id, metric_date)
);

-- Create collection_cases table if referenced
CREATE TABLE IF NOT EXISTS kastle_banking.collection_cases (
    case_id VARCHAR(50) PRIMARY KEY,
    account_number VARCHAR(50),
    customer_name VARCHAR(100),
    outstanding_amount DECIMAL(15,2),
    days_past_due INTEGER,
    assigned_officer_id VARCHAR(50),
    status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key constraint from collection_officers to collection_teams
-- First drop any existing constraint
ALTER TABLE kastle_banking.collection_officers 
DROP CONSTRAINT IF EXISTS collection_officers_team_id_fkey;

ALTER TABLE kastle_banking.collection_officers 
DROP CONSTRAINT IF EXISTS fk_collection_officers_team_id;

-- Add the constraint with the exact name expected by the application
ALTER TABLE kastle_banking.collection_officers
ADD CONSTRAINT collection_officers_team_id_fkey 
FOREIGN KEY (team_id) REFERENCES kastle_banking.collection_teams(team_id)
ON DELETE SET NULL;

-- Add foreign key constraint from officer_performance_metrics to collection_officers
ALTER TABLE kastle_banking.officer_performance_metrics
DROP CONSTRAINT IF EXISTS officer_performance_metrics_officer_id_fkey;

ALTER TABLE kastle_banking.officer_performance_metrics
ADD CONSTRAINT officer_performance_metrics_officer_id_fkey
FOREIGN KEY (officer_id) REFERENCES kastle_banking.collection_officers(officer_id)
ON DELETE CASCADE;

-- Add foreign key constraint from collection_cases to collection_officers
ALTER TABLE kastle_banking.collection_cases
DROP CONSTRAINT IF EXISTS collection_cases_assigned_officer_id_fkey;

ALTER TABLE kastle_banking.collection_cases
ADD CONSTRAINT collection_cases_assigned_officer_id_fkey
FOREIGN KEY (assigned_officer_id) REFERENCES kastle_banking.collection_officers(officer_id)
ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_officers_team_id ON kastle_banking.collection_officers(team_id);
CREATE INDEX IF NOT EXISTS idx_officer_performance_metrics_officer_id ON kastle_banking.officer_performance_metrics(officer_id);
CREATE INDEX IF NOT EXISTS idx_officer_performance_metrics_date ON kastle_banking.officer_performance_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_collection_cases_officer_id ON kastle_banking.collection_cases(assigned_officer_id);

-- Insert sample data for testing
INSERT INTO kastle_banking.collection_teams (team_id, team_name, team_type) 
VALUES 
    ('TEAM001', 'Alpha Team', 'Field'),
    ('TEAM002', 'Beta Team', 'Call Center'),
    ('TEAM003', 'Gamma Team', 'Legal')
ON CONFLICT (team_id) DO NOTHING;

INSERT INTO kastle_banking.collection_officers (officer_id, officer_name, officer_type, team_id, status) 
VALUES 
    ('OFF007', 'James Bond', 'Senior', 'TEAM001', 'active'),
    ('OFF001', 'John Doe', 'Junior', 'TEAM002', 'active'),
    ('OFF002', 'Jane Smith', 'Senior', 'TEAM002', 'active')
ON CONFLICT (officer_id) DO NOTHING;

INSERT INTO kastle_banking.branches (branch_code, branch_name, branch_type, status)
VALUES
    ('BR001', 'Main Branch', 'Head Office', 'active'),
    ('BR002', 'Downtown Branch', 'Retail', 'active'),
    ('BR003', 'Airport Branch', 'Retail', 'active')
ON CONFLICT (branch_code) DO NOTHING;

-- Grant permissions to the app user
GRANT ALL ON SCHEMA kastle_banking TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO postgres;

-- Refresh the schema cache (for PostgREST)
NOTIFY pgrst, 'reload schema';