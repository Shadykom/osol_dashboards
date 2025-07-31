-- Fix Collection Overview - Insert data only (assumes tables exist)
-- This script adapts to existing schema

-- Insert teams with integer IDs
INSERT INTO kastle_banking.collection_teams (team_id, team_name) 
VALUES (1, 'Alpha Team'), (2, 'Beta Team'), (3, 'Gamma Team')
ON CONFLICT (team_id) DO NOTHING;

-- Insert officers with integer IDs
INSERT INTO kastle_banking.collection_officers (officer_id, officer_name, officer_type, team_id)
VALUES 
    (1, 'John Smith', 'Senior', 1),
    (2, 'Jane Doe', 'Junior', 1),
    (3, 'Mike Johnson', 'Senior', 2),
    (4, 'Sarah Williams', 'Mid-level', 2),
    (5, 'Tom Brown', 'Junior', 3)
ON CONFLICT (officer_id) DO NOTHING;

-- Insert performance data
INSERT INTO kastle_banking.officer_performance_summary (
    officer_id, summary_date, total_collected, cases_handled
)
SELECT 
    o.officer_id,
    CURRENT_DATE as summary_date,
    ROUND(RANDOM() * 100000 + 50000, 2),
    FLOOR(RANDOM() * 100 + 50)::INTEGER
FROM kastle_banking.collection_officers o
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.officer_performance_summary ops
    WHERE ops.officer_id = o.officer_id AND ops.summary_date = CURRENT_DATE
);

-- Also insert data for last day of current month
INSERT INTO kastle_banking.officer_performance_summary (
    officer_id, summary_date, total_collected, cases_handled
)
SELECT 
    o.officer_id,
    date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day' as summary_date,
    ROUND(RANDOM() * 100000 + 50000, 2),
    FLOOR(RANDOM() * 100 + 50)::INTEGER
FROM kastle_banking.collection_officers o
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.officer_performance_summary ops
    WHERE ops.officer_id = o.officer_id 
    AND ops.summary_date = date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day'
);

-- Grant permissions
GRANT ALL ON SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- Disable RLS
ALTER TABLE kastle_banking.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;

-- Verify
SELECT 
    'Data Inserted' as status,
    (SELECT COUNT(*) FROM kastle_banking.collection_teams) as teams,
    (SELECT COUNT(*) FROM kastle_banking.collection_officers) as officers,
    (SELECT COUNT(*) FROM kastle_banking.officer_performance_summary) as performance_records;
