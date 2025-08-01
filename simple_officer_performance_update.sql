-- Simple Officer Performance Summary Table Update for Supabase SQL Editor
-- Copy and paste this entire script into your Supabase SQL Editor and run it

-- Create the officer_performance_summary table with exact structure
CREATE TABLE IF NOT EXISTS kastle_banking.officer_performance_summary (
  summary_id serial NOT NULL,
  officer_id character varying NULL,
  summary_date date NOT NULL,
  total_cases integer NULL DEFAULT 0,
  total_portfolio_value numeric NULL DEFAULT 0,
  total_collected numeric NULL DEFAULT 0,
  collection_rate numeric NULL DEFAULT 0,
  total_calls integer NULL DEFAULT 0,
  total_messages integer NULL DEFAULT 0,
  successful_contacts integer NULL DEFAULT 0,
  contact_rate numeric NULL DEFAULT 0,
  total_ptps integer NULL DEFAULT 0,
  ptps_kept integer NULL DEFAULT 0,
  ptp_keep_rate numeric NULL DEFAULT 0,
  avg_response_time numeric NULL DEFAULT 0,
  created_at timestamp with time zone NULL DEFAULT now(),
  updated_at timestamp with time zone NULL DEFAULT now(),
  CONSTRAINT officer_performance_summary_pkey PRIMARY KEY (summary_id),
  CONSTRAINT officer_performance_summary_officer_id_summary_date_key UNIQUE (officer_id, summary_date)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_officer_performance_date 
  ON kastle_banking.officer_performance_summary USING btree (summary_date);

CREATE INDEX IF NOT EXISTS idx_officer_performance_officer 
  ON kastle_banking.officer_performance_summary USING btree (officer_id);

CREATE INDEX IF NOT EXISTS idx_officer_performance_collected 
  ON kastle_banking.officer_performance_summary USING btree (total_collected DESC);

-- Ensure collection_officers table exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    officer_name VARCHAR(100) NOT NULL,
    officer_type VARCHAR(50) DEFAULT 'CALL_AGENT',
    team_id VARCHAR(50),
    email VARCHAR(100),
    contact_number VARCHAR(20),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure collection_teams table exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id VARCHAR(50) PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50) DEFAULT 'COLLECTIONS',
    manager_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample collection teams
INSERT INTO kastle_banking.collection_teams (team_id, team_name, team_type, manager_id) 
VALUES 
    ('TEAM001', 'Early Collections Team', 'EARLY_STAGE', 'MGR001'),
    ('TEAM002', 'Late Collections Team', 'LATE_STAGE', 'MGR002'),
    ('TEAM003', 'Field Operations Team', 'FIELD_WORK', 'MGR003')
ON CONFLICT (team_id) DO NOTHING;

-- Insert sample collection officers
INSERT INTO kastle_banking.collection_officers (officer_id, officer_name, officer_type, team_id, email, contact_number, status) 
VALUES 
    ('OFF001', 'Ahmed Al-Mansouri', 'SENIOR_COLLECTOR', 'TEAM001', 'ahmed.mansouri@bank.com', '+971501234567', 'ACTIVE'),
    ('OFF002', 'Fatima Al-Zahra', 'CALL_AGENT', 'TEAM001', 'fatima.zahra@bank.com', '+971501234568', 'ACTIVE'),
    ('OFF003', 'Mohammed Al-Rashid', 'FIELD_AGENT', 'TEAM003', 'mohammed.rashid@bank.com', '+971501234569', 'ACTIVE'),
    ('OFF004', 'Aisha Al-Qasimi', 'TEAM_LEAD', 'TEAM002', 'aisha.qasimi@bank.com', '+971501234570', 'ACTIVE'),
    ('OFF005', 'Omar Al-Maktoum', 'CALL_AGENT', 'TEAM001', 'omar.maktoum@bank.com', '+971501234571', 'ACTIVE')
ON CONFLICT (officer_id) DO NOTHING;

-- Insert sample performance data for recent dates
INSERT INTO kastle_banking.officer_performance_summary (
    officer_id, 
    summary_date, 
    total_cases, 
    total_portfolio_value, 
    total_collected, 
    collection_rate, 
    total_calls, 
    total_messages, 
    successful_contacts, 
    contact_rate, 
    total_ptps, 
    ptps_kept, 
    ptp_keep_rate, 
    avg_response_time
) VALUES
    ('OFF001', '2025-01-15', 45, 450000.00, 35000.00, 25.50, 120, 30, 75, 62.50, 15, 8, 53.33, 180.00),
    ('OFF001', '2025-01-14', 42, 420000.00, 28000.00, 22.80, 115, 25, 70, 60.87, 12, 7, 58.33, 175.00),
    ('OFF001', '2025-01-13', 38, 380000.00, 32000.00, 28.95, 110, 35, 68, 61.82, 18, 10, 55.56, 165.00),
    ('OFF002', '2025-01-15', 35, 350000.00, 22000.00, 18.75, 95, 40, 58, 61.05, 10, 6, 60.00, 195.00),
    ('OFF002', '2025-01-14', 32, 320000.00, 19000.00, 17.25, 90, 38, 55, 61.11, 8, 5, 62.50, 190.00),
    ('OFF002', '2025-01-13', 30, 300000.00, 25000.00, 20.15, 88, 42, 53, 60.23, 12, 7, 58.33, 185.00),
    ('OFF003', '2025-01-15', 28, 280000.00, 18000.00, 15.75, 70, 20, 42, 60.00, 8, 4, 50.00, 220.00),
    ('OFF003', '2025-01-14', 25, 250000.00, 16000.00, 14.50, 65, 18, 38, 58.46, 6, 3, 50.00, 215.00),
    ('OFF003', '2025-01-13', 30, 300000.00, 21000.00, 18.25, 75, 25, 45, 60.00, 10, 6, 60.00, 210.00),
    ('OFF004', '2025-01-15', 50, 500000.00, 45000.00, 32.50, 140, 35, 85, 60.71, 20, 12, 60.00, 155.00),
    ('OFF004', '2025-01-14', 48, 480000.00, 42000.00, 30.25, 135, 32, 82, 60.74, 18, 11, 61.11, 150.00),
    ('OFF004', '2025-01-13', 45, 450000.00, 38000.00, 28.75, 130, 38, 78, 60.00, 16, 9, 56.25, 160.00),
    ('OFF005', '2025-01-15', 40, 400000.00, 30000.00, 24.00, 105, 28, 63, 60.00, 14, 8, 57.14, 170.00),
    ('OFF005', '2025-01-14', 38, 380000.00, 27000.00, 22.50, 100, 25, 60, 60.00, 12, 7, 58.33, 175.00),
    ('OFF005', '2025-01-13', 35, 350000.00, 24000.00, 20.75, 95, 30, 57, 60.00, 10, 6, 60.00, 180.00)
ON CONFLICT (officer_id, summary_date) DO NOTHING;

-- Disable RLS for testing
ALTER TABLE kastle_banking.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;

-- Test query to verify relationships work
SELECT 
    ops.officer_id,
    co.officer_name,
    co.officer_type,
    ct.team_name,
    ops.summary_date,
    ops.total_cases,
    ops.total_collected,
    ops.collection_rate
FROM kastle_banking.officer_performance_summary ops
LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
ORDER BY ops.summary_date DESC, ops.total_collected DESC
LIMIT 10;