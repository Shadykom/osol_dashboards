-- Fix Collection Overview with correct schema types and proper type casting
-- Based on the actual table structure

-- Insert teams with integer team_id
INSERT INTO kastle_banking.collection_teams (team_id, team_name, team_type) 
VALUES 
    (1, 'Alpha Collection Team', 'Field'),
    (2, 'Beta Collection Team', 'Call Center'),
    (3, 'Gamma Collection Team', 'Digital')
ON CONFLICT (team_id) DO NOTHING;

-- Insert officers with varchar officer_id and integer team_id
INSERT INTO kastle_banking.collection_officers (
    officer_id, officer_name, officer_type, team_id, 
    status, contact_number, email, joining_date
)
VALUES 
    ('OFF001', 'John Smith', 'Senior', 1, 'active', '+1234567890', 'john.smith@example.com', CURRENT_DATE - interval '2 years'),
    ('OFF002', 'Jane Doe', 'Junior', 1, 'active', '+1234567891', 'jane.doe@example.com', CURRENT_DATE - interval '1 year'),
    ('OFF003', 'Mike Johnson', 'Senior', 2, 'active', '+1234567892', 'mike.johnson@example.com', CURRENT_DATE - interval '3 years'),
    ('OFF004', 'Sarah Williams', 'Mid-level', 2, 'active', '+1234567893', 'sarah.williams@example.com', CURRENT_DATE - interval '18 months'),
    ('OFF005', 'Tom Brown', 'Junior', 3, 'active', '+1234567894', 'tom.brown@example.com', CURRENT_DATE - interval '6 months')
ON CONFLICT (officer_id) DO UPDATE SET
    officer_name = EXCLUDED.officer_name,
    team_id = EXCLUDED.team_id,
    status = EXCLUDED.status;

-- Insert performance data for current month and previous months
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
    o.officer_id,
    dates.summary_date,
    FLOOR(RANDOM() * 100 + 50)::INTEGER as total_cases,
    (RANDOM() * 1000000 + 500000)::NUMERIC(15,2) as total_portfolio_value,
    (RANDOM() * 100000 + 50000)::NUMERIC(15,2) as total_collected,
    (RANDOM() * 30 + 70)::NUMERIC(5,2) as collection_rate,
    FLOOR(RANDOM() * 200 + 100)::INTEGER as total_calls,
    FLOOR(RANDOM() * 100 + 50)::INTEGER as total_messages,
    FLOOR(RANDOM() * 150 + 50)::INTEGER as successful_contacts,
    (RANDOM() * 30 + 60)::NUMERIC(5,2) as contact_rate,
    FLOOR(RANDOM() * 50 + 20)::INTEGER as total_ptps,
    FLOOR(RANDOM() * 40 + 10)::INTEGER as ptps_kept,
    (RANDOM() * 30 + 60)::NUMERIC(5,2) as ptp_keep_rate,
    (RANDOM() * 60 + 30)::NUMERIC(5,2) as avg_response_time
FROM kastle_banking.collection_officers o
CROSS JOIN (
    -- Current date
    SELECT CURRENT_DATE as summary_date
    UNION ALL
    -- Last day of current month
    SELECT date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day'
    UNION ALL
    -- Last day of previous month
    SELECT date_trunc('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day'
    UNION ALL
    -- Last day of 2 months ago
    SELECT date_trunc('month', CURRENT_DATE - interval '2 months') + interval '1 month' - interval '1 day'
) dates
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.officer_performance_summary ops
    WHERE ops.officer_id = o.officer_id AND ops.summary_date = dates.summary_date
);

-- Update last_active for officers
UPDATE kastle_banking.collection_officers
SET last_active = CURRENT_TIMESTAMP
WHERE officer_id IN ('OFF001', 'OFF002', 'OFF003', 'OFF004', 'OFF005');

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_officer_performance_date 
ON kastle_banking.officer_performance_summary(summary_date);

CREATE INDEX IF NOT EXISTS idx_officer_performance_officer 
ON kastle_banking.officer_performance_summary(officer_id);

CREATE INDEX IF NOT EXISTS idx_officer_performance_collected 
ON kastle_banking.officer_performance_summary(total_collected DESC);

-- Grant permissions
GRANT ALL ON SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- Disable RLS
ALTER TABLE kastle_banking.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;

-- Create a view that matches the Supabase query structure
CREATE OR REPLACE VIEW kastle_banking.officer_performance_api_view AS
SELECT 
    ops.*,
    jsonb_build_object(
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

-- Grant permissions on the view
GRANT SELECT ON kastle_banking.officer_performance_api_view TO authenticated;

-- Verify the data
SELECT 
    'Data Status' as status,
    (SELECT COUNT(*) FROM kastle_banking.collection_teams) as teams_count,
    (SELECT COUNT(*) FROM kastle_banking.collection_officers) as officers_count,
    (SELECT COUNT(*) FROM kastle_banking.officer_performance_summary) as performance_records,
    (SELECT COUNT(DISTINCT summary_date) FROM kastle_banking.officer_performance_summary) as unique_dates;

-- Show sample data
SELECT 
    ops.officer_id,
    co.officer_name,
    ct.team_name,
    ops.summary_date,
    ops.total_collected,
    ops.collection_rate
FROM kastle_banking.officer_performance_summary ops
JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id
ORDER BY ops.summary_date DESC, ops.total_collected DESC
LIMIT 10;
