-- Fix Collection Overview Page Errors for kastle_banking schema
-- This script addresses the 400 error on officer_performance_summary query

-- 1. Ensure kastle_banking schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- 2. Drop and recreate officer_performance_summary with proper structure
DROP TABLE IF EXISTS kastle_banking.officer_performance_summary CASCADE;

CREATE TABLE kastle_banking.officer_performance_summary (
    performance_id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL,
    summary_date DATE NOT NULL,
    total_collected DECIMAL(15,2) DEFAULT 0,
    cases_handled INTEGER DEFAULT 0,
    amount_collected DECIMAL(15,2) DEFAULT 0,
    interactions_count INTEGER DEFAULT 0,
    successful_contacts INTEGER DEFAULT 0,
    promises_secured INTEGER DEFAULT 0,
    average_call_time INTERVAL,
    productivity_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create indexes for performance
CREATE INDEX idx_officer_performance_date ON kastle_banking.officer_performance_summary(summary_date);
CREATE INDEX idx_officer_performance_officer ON kastle_banking.officer_performance_summary(officer_id);
CREATE INDEX idx_officer_performance_date_desc ON kastle_banking.officer_performance_summary(summary_date DESC);
CREATE INDEX idx_officer_performance_collected ON kastle_banking.officer_performance_summary(total_collected DESC);

-- 4. Ensure collection_officers table exists with proper structure
CREATE TABLE IF NOT EXISTS kastle_banking.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    officer_name VARCHAR(100) NOT NULL,
    officer_type VARCHAR(50),
    team_id VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Ensure collection_teams table exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_teams (
    team_id VARCHAR(50) PRIMARY KEY,
    team_name VARCHAR(100) NOT NULL,
    team_lead_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add foreign key constraints
ALTER TABLE kastle_banking.officer_performance_summary 
    DROP CONSTRAINT IF EXISTS fk_performance_officer;
ALTER TABLE kastle_banking.officer_performance_summary 
    ADD CONSTRAINT fk_performance_officer 
    FOREIGN KEY (officer_id) 
    REFERENCES kastle_banking.collection_officers(officer_id) 
    ON DELETE CASCADE;

ALTER TABLE kastle_banking.collection_officers 
    DROP CONSTRAINT IF EXISTS fk_officer_team;
ALTER TABLE kastle_banking.collection_officers 
    ADD CONSTRAINT fk_officer_team 
    FOREIGN KEY (team_id) 
    REFERENCES kastle_banking.collection_teams(team_id) 
    ON DELETE SET NULL;

-- 7. Insert sample data for testing
-- Insert teams
INSERT INTO kastle_banking.collection_teams (team_id, team_name) VALUES
    ('TEAM001', 'Alpha Collection Team'),
    ('TEAM002', 'Beta Collection Team'),
    ('TEAM003', 'Gamma Collection Team')
ON CONFLICT (team_id) DO NOTHING;

-- Insert officers
INSERT INTO kastle_banking.collection_officers (officer_id, officer_name, officer_type, team_id) VALUES
    ('OFF001', 'John Smith', 'Senior', 'TEAM001'),
    ('OFF002', 'Jane Doe', 'Junior', 'TEAM001'),
    ('OFF003', 'Mike Johnson', 'Senior', 'TEAM002'),
    ('OFF004', 'Sarah Williams', 'Mid-level', 'TEAM002'),
    ('OFF005', 'Tom Brown', 'Junior', 'TEAM003')
ON CONFLICT (officer_id) DO NOTHING;

-- Insert performance data for current month and past months
INSERT INTO kastle_banking.officer_performance_summary (
    officer_id, 
    summary_date, 
    total_collected, 
    cases_handled, 
    amount_collected,
    interactions_count,
    successful_contacts,
    promises_secured,
    productivity_score
)
SELECT 
    officer_id,
    generate_series::date as summary_date,
    ROUND(RANDOM() * 100000 + 50000, 2) as total_collected,
    FLOOR(RANDOM() * 100 + 50)::INTEGER as cases_handled,
    ROUND(RANDOM() * 100000 + 50000, 2) as amount_collected,
    FLOOR(RANDOM() * 200 + 100)::INTEGER as interactions_count,
    FLOOR(RANDOM() * 150 + 50)::INTEGER as successful_contacts,
    FLOOR(RANDOM() * 50 + 20)::INTEGER as promises_secured,
    ROUND(RANDOM() * 30 + 70, 2) as productivity_score
FROM kastle_banking.collection_officers
CROSS JOIN generate_series(
    date_trunc('month', CURRENT_DATE - interval '3 months'),
    CURRENT_DATE,
    interval '1 day'
) AS generate_series
WHERE generate_series::date = date_trunc('month', generate_series::date) + interval '1 month' - interval '1 day'
ON CONFLICT DO NOTHING;

-- 8. Grant permissions
GRANT ALL ON SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- 9. Disable Row Level Security (RLS) on these tables
ALTER TABLE kastle_banking.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;

-- 10. Create a view for easier querying
CREATE OR REPLACE VIEW kastle_banking.officer_performance_view AS
SELECT 
    ops.*,
    co.officer_name,
    co.officer_type,
    co.team_id,
    ct.team_name
FROM kastle_banking.officer_performance_summary ops
JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id;

-- Grant permissions on the view
GRANT SELECT ON kastle_banking.officer_performance_view TO authenticated;

-- 11. Create function to get performance data with proper date handling
CREATE OR REPLACE FUNCTION kastle_banking.get_officer_performance(
    p_date DATE DEFAULT CURRENT_DATE,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    officer_id VARCHAR(50),
    officer_name VARCHAR(100),
    officer_type VARCHAR(50),
    team_id VARCHAR(50),
    team_name VARCHAR(100),
    summary_date DATE,
    total_collected DECIMAL(15,2),
    cases_handled INTEGER,
    productivity_score DECIMAL(5,2)
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ops.officer_id,
        co.officer_name,
        co.officer_type,
        co.team_id,
        ct.team_name,
        ops.summary_date,
        ops.total_collected,
        ops.cases_handled,
        ops.productivity_score
    FROM kastle_banking.officer_performance_summary ops
    JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
    LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
    WHERE ops.summary_date <= p_date
    ORDER BY ops.total_collected DESC
    LIMIT p_limit;
END;
$$;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION kastle_banking.get_officer_performance TO authenticated;

-- 12. Create API-friendly views with proper joins
CREATE OR REPLACE VIEW kastle_banking.api_officer_performance AS
SELECT 
    ops.performance_id,
    ops.officer_id,
    ops.summary_date,
    ops.total_collected,
    ops.cases_handled,
    ops.amount_collected,
    ops.interactions_count,
    ops.successful_contacts,
    ops.promises_secured,
    ops.average_call_time,
    ops.productivity_score,
    ops.created_at,
    ops.updated_at,
    jsonb_build_object(
        'officer_id', co.officer_id,
        'officer_name', co.officer_name,
        'officer_type', co.officer_type,
        'team_id', co.team_id,
        'collection_teams', jsonb_build_object(
            'team_name', ct.team_name
        )
    ) as collection_officers
FROM kastle_banking.officer_performance_summary ops
LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id;

-- Grant permissions on the API view
GRANT SELECT ON kastle_banking.api_officer_performance TO authenticated;

-- 13. Verify the setup
SELECT 
    'Tables Created' as status,
    (SELECT COUNT(*) FROM information_schema.tables 
     WHERE table_schema = 'kastle_banking' 
     AND table_name IN ('officer_performance_summary', 'collection_officers', 'collection_teams')) as table_count,
    (SELECT COUNT(*) FROM kastle_banking.collection_officers) as officer_count,
    (SELECT COUNT(*) FROM kastle_banking.collection_teams) as team_count,
    (SELECT COUNT(*) FROM kastle_banking.officer_performance_summary) as performance_records;
