-- Update Officer Performance Summary Table
-- This script creates/updates the officer_performance_summary table with the correct structure
-- and populates it with sample data for testing

-- 1. Drop existing table if it exists (optional - remove if you want to preserve data)
DROP TABLE IF EXISTS kastle_banking.officer_performance_summary CASCADE;

-- 2. Create the officer_performance_summary table with exact structure
CREATE TABLE kastle_banking.officer_performance_summary (
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
) TABLESPACE pg_default;

-- 3. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_officer_performance_date 
  ON kastle_banking.officer_performance_summary USING btree (summary_date) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_officer_performance_officer 
  ON kastle_banking.officer_performance_summary USING btree (officer_id) 
  TABLESPACE pg_default;

CREATE INDEX IF NOT EXISTS idx_officer_performance_collected 
  ON kastle_banking.officer_performance_summary USING btree (total_collected DESC) 
  TABLESPACE pg_default;

-- 4. Ensure collection_officers table exists (create if missing)
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

-- 5. Ensure collection_teams table exists (create if missing)
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id VARCHAR(50) PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_type VARCHAR(50) DEFAULT 'COLLECTIONS',
    manager_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add foreign key constraint to officer_performance_summary
ALTER TABLE kastle_banking.officer_performance_summary 
    DROP CONSTRAINT IF EXISTS fk_performance_officer;

ALTER TABLE kastle_banking.officer_performance_summary 
    ADD CONSTRAINT fk_performance_officer 
    FOREIGN KEY (officer_id) 
    REFERENCES kastle_banking.collection_officers(officer_id) 
    ON DELETE SET NULL;

-- 7. Insert sample collection teams
INSERT INTO kastle_banking.collection_teams (team_id, team_name, team_type, manager_id) 
VALUES 
    ('TEAM001', 'Early Collections Team', 'EARLY_STAGE', 'MGR001'),
    ('TEAM002', 'Late Collections Team', 'LATE_STAGE', 'MGR002'),
    ('TEAM003', 'Field Operations Team', 'FIELD_WORK', 'MGR003'),
    ('TEAM004', 'Digital Collections Team', 'DIGITAL', 'MGR004')
ON CONFLICT (team_id) DO UPDATE SET
    team_name = EXCLUDED.team_name,
    team_type = EXCLUDED.team_type,
    updated_at = CURRENT_TIMESTAMP;

-- 8. Insert sample collection officers
INSERT INTO kastle_banking.collection_officers (officer_id, officer_name, officer_type, team_id, email, contact_number, status) 
VALUES 
    ('OFF001', 'Ahmed Al-Mansouri', 'SENIOR_COLLECTOR', 'TEAM001', 'ahmed.mansouri@bank.com', '+971501234567', 'ACTIVE'),
    ('OFF002', 'Fatima Al-Zahra', 'CALL_AGENT', 'TEAM001', 'fatima.zahra@bank.com', '+971501234568', 'ACTIVE'),
    ('OFF003', 'Mohammed Al-Rashid', 'FIELD_AGENT', 'TEAM003', 'mohammed.rashid@bank.com', '+971501234569', 'ACTIVE'),
    ('OFF004', 'Aisha Al-Qasimi', 'TEAM_LEAD', 'TEAM002', 'aisha.qasimi@bank.com', '+971501234570', 'ACTIVE'),
    ('OFF005', 'Omar Al-Maktoum', 'CALL_AGENT', 'TEAM001', 'omar.maktoum@bank.com', '+971501234571', 'ACTIVE'),
    ('OFF006', 'Maryam Al-Nahyan', 'SENIOR_COLLECTOR', 'TEAM002', 'maryam.nahyan@bank.com', '+971501234572', 'ACTIVE'),
    ('OFF007', 'Khalid Al-Thani', 'FIELD_AGENT', 'TEAM003', 'khalid.thani@bank.com', '+971501234573', 'ACTIVE'),
    ('OFF008', 'Noura Al-Sabah', 'DIGITAL_SPECIALIST', 'TEAM004', 'noura.sabah@bank.com', '+971501234574', 'ACTIVE'),
    ('OFF009', 'Saeed Al-Marri', 'CALL_AGENT', 'TEAM002', 'saeed.marri@bank.com', '+971501234575', 'ACTIVE'),
    ('OFF010', 'Layla Al-Dosari', 'SENIOR_COLLECTOR', 'TEAM001', 'layla.dosari@bank.com', '+971501234576', 'ACTIVE')
ON CONFLICT (officer_id) DO UPDATE SET
    officer_name = EXCLUDED.officer_name,
    officer_type = EXCLUDED.officer_type,
    team_id = EXCLUDED.team_id,
    email = EXCLUDED.email,
    contact_number = EXCLUDED.contact_number,
    status = EXCLUDED.status,
    updated_at = CURRENT_TIMESTAMP;

-- 9. Insert sample performance data for the last 30 days
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
)
SELECT 
    officer_id,
    date_series,
    FLOOR(RANDOM() * 50 + 10)::INTEGER as total_cases,
    ROUND((RANDOM() * 500000 + 100000)::numeric, 2) as total_portfolio_value,
    ROUND((RANDOM() * 50000 + 5000)::numeric, 2) as total_collected,
    ROUND((RANDOM() * 30 + 10)::numeric, 2) as collection_rate,
    FLOOR(RANDOM() * 100 + 20)::INTEGER as total_calls,
    FLOOR(RANDOM() * 50 + 10)::INTEGER as total_messages,
    FLOOR(RANDOM() * 60 + 15)::INTEGER as successful_contacts,
    ROUND((RANDOM() * 40 + 30)::numeric, 2) as contact_rate,
    FLOOR(RANDOM() * 20 + 5)::INTEGER as total_ptps,
    FLOOR(RANDOM() * 15 + 2)::INTEGER as ptps_kept,
    ROUND((RANDOM() * 50 + 25)::numeric, 2) as ptp_keep_rate,
    ROUND((RANDOM() * 300 + 60)::numeric, 2) as avg_response_time
FROM 
    kastle_banking.collection_officers co,
    generate_series(
        CURRENT_DATE - INTERVAL '30 days',
        CURRENT_DATE,
        '1 day'::interval
    ) as date_series
WHERE co.status = 'ACTIVE'
ON CONFLICT (officer_id, summary_date) DO UPDATE SET
    total_cases = EXCLUDED.total_cases,
    total_portfolio_value = EXCLUDED.total_portfolio_value,
    total_collected = EXCLUDED.total_collected,
    collection_rate = EXCLUDED.collection_rate,
    total_calls = EXCLUDED.total_calls,
    total_messages = EXCLUDED.total_messages,
    successful_contacts = EXCLUDED.successful_contacts,
    contact_rate = EXCLUDED.contact_rate,
    total_ptps = EXCLUDED.total_ptps,
    ptps_kept = EXCLUDED.ptps_kept,
    ptp_keep_rate = EXCLUDED.ptp_keep_rate,
    avg_response_time = EXCLUDED.avg_response_time,
    updated_at = CURRENT_TIMESTAMP;

-- 10. Update table permissions for RLS
ALTER TABLE kastle_banking.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;

-- 11. Grant permissions to authenticated users
GRANT ALL ON TABLE kastle_banking.officer_performance_summary TO authenticated;
GRANT ALL ON TABLE kastle_banking.officer_performance_summary TO anon;
GRANT ALL ON TABLE kastle_banking.officer_performance_summary TO service_role;

GRANT ALL ON TABLE kastle_banking.collection_officers TO authenticated;
GRANT ALL ON TABLE kastle_banking.collection_officers TO anon;
GRANT ALL ON TABLE kastle_banking.collection_officers TO service_role;

GRANT ALL ON TABLE kastle_banking.collection_teams TO authenticated;
GRANT ALL ON TABLE kastle_banking.collection_teams TO anon;
GRANT ALL ON TABLE kastle_banking.collection_teams TO service_role;

-- 12. Grant usage on sequences
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.officer_performance_summary_summary_id_seq TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.officer_performance_summary_summary_id_seq TO anon;
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.officer_performance_summary_summary_id_seq TO service_role;

-- 13. Create an updated_at trigger function
CREATE OR REPLACE FUNCTION kastle_banking.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 14. Create triggers for automatic updated_at
DROP TRIGGER IF EXISTS update_officer_performance_updated_at ON kastle_banking.officer_performance_summary;
CREATE TRIGGER update_officer_performance_updated_at 
    BEFORE UPDATE ON kastle_banking.officer_performance_summary 
    FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();

DROP TRIGGER IF EXISTS update_collection_officers_updated_at ON kastle_banking.collection_officers;
CREATE TRIGGER update_collection_officers_updated_at 
    BEFORE UPDATE ON kastle_banking.collection_officers 
    FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();

DROP TRIGGER IF EXISTS update_collection_teams_updated_at ON kastle_banking.collection_teams;
CREATE TRIGGER update_collection_teams_updated_at 
    BEFORE UPDATE ON kastle_banking.collection_teams 
    FOR EACH ROW EXECUTE FUNCTION kastle_banking.update_updated_at_column();

-- 15. Verification queries
SELECT 
    'officer_performance_summary table' as item,
    'Created with ' || COUNT(*) || ' records' as status
FROM kastle_banking.officer_performance_summary
UNION ALL
SELECT 
    'collection_officers table' as item,
    'Created with ' || COUNT(*) || ' officers' as status
FROM kastle_banking.collection_officers
UNION ALL
SELECT 
    'collection_teams table' as item,
    'Created with ' || COUNT(*) || ' teams' as status
FROM kastle_banking.collection_teams;

-- 16. Show sample data
SELECT 
    ops.officer_id,
    co.officer_name,
    co.officer_type,
    ct.team_name,
    ops.summary_date,
    ops.total_cases,
    ops.total_collected,
    ops.collection_rate,
    ops.total_calls,
    ops.contact_rate
FROM kastle_banking.officer_performance_summary ops
LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
WHERE ops.summary_date >= CURRENT_DATE - INTERVAL '7 days'
ORDER BY ops.summary_date DESC, ops.total_collected DESC
LIMIT 20;

-- 17. Test the relationship query that was failing
SELECT 
    ops.*,
    co.officer_name,
    co.officer_type,
    co.team_id,
    ct.team_name
FROM kastle_banking.officer_performance_summary ops
LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
WHERE ops.summary_date <= CURRENT_DATE
ORDER BY ops.summary_date DESC, ops.total_collected DESC
LIMIT 10;

COMMIT;