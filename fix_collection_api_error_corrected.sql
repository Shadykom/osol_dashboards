-- Fix Collection Overview API Error for kastle_banking schema
-- Handles both integer and varchar ID types

-- First, check what type the team_id column is
DO $$
DECLARE
    team_id_type text;
    officer_id_type text;
BEGIN
    -- Check if tables exist and get column types
    SELECT data_type INTO team_id_type
    FROM information_schema.columns
    WHERE table_schema = 'kastle_banking' 
    AND table_name = 'collection_teams'
    AND column_name = 'team_id';
    
    SELECT data_type INTO officer_id_type
    FROM information_schema.columns
    WHERE table_schema = 'kastle_banking' 
    AND table_name = 'collection_officers'
    AND column_name = 'officer_id';

    -- If tables don't exist, create them with integer IDs
    IF team_id_type IS NULL THEN
        CREATE TABLE kastle_banking.collection_teams (
            team_id SERIAL PRIMARY KEY,
            team_name VARCHAR(100) NOT NULL,
            team_lead_id INTEGER,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
    END IF;

    IF officer_id_type IS NULL THEN
        CREATE TABLE kastle_banking.collection_officers (
            officer_id SERIAL PRIMARY KEY,
            officer_name VARCHAR(100) NOT NULL,
            officer_type VARCHAR(50),
            team_id INTEGER,
            email VARCHAR(100),
            phone VARCHAR(20),
            status VARCHAR(20) DEFAULT 'active',
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (team_id) REFERENCES kastle_banking.collection_teams(team_id)
        );
    END IF;
END $$;

-- Ensure officer_performance_summary exists
CREATE TABLE IF NOT EXISTS kastle_banking.officer_performance_summary (
    performance_id SERIAL PRIMARY KEY,
    officer_id INTEGER NOT NULL,
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

-- Add sample data with integer IDs
INSERT INTO kastle_banking.collection_teams (team_id, team_name) 
VALUES (1, 'Alpha Team'), (2, 'Beta Team'), (3, 'Gamma Team')
ON CONFLICT (team_id) DO NOTHING;

INSERT INTO kastle_banking.collection_officers (officer_id, officer_name, officer_type, team_id)
VALUES 
    (1, 'John Smith', 'Senior', 1),
    (2, 'Jane Doe', 'Junior', 1),
    (3, 'Mike Johnson', 'Senior', 2),
    (4, 'Sarah Williams', 'Mid-level', 2),
    (5, 'Tom Brown', 'Junior', 3)
ON CONFLICT (officer_id) DO NOTHING;

-- Insert performance data for current and previous months
INSERT INTO kastle_banking.officer_performance_summary (
    officer_id, summary_date, total_collected, cases_handled, amount_collected,
    interactions_count, successful_contacts, promises_secured, productivity_score
)
SELECT 
    o.officer_id,
    dates.summary_date,
    ROUND(RANDOM() * 100000 + 50000, 2),
    FLOOR(RANDOM() * 100 + 50)::INTEGER,
    ROUND(RANDOM() * 100000 + 50000, 2),
    FLOOR(RANDOM() * 200 + 100)::INTEGER,
    FLOOR(RANDOM() * 150 + 50)::INTEGER,
    FLOOR(RANDOM() * 50 + 20)::INTEGER,
    ROUND(RANDOM() * 30 + 70, 2)
FROM kastle_banking.collection_officers o
CROSS JOIN (
    SELECT date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day' as summary_date
    UNION ALL
    SELECT date_trunc('month', CURRENT_DATE - interval '1 month') + interval '1 month' - interval '1 day'
    UNION ALL
    SELECT date_trunc('month', CURRENT_DATE - interval '2 months') + interval '1 month' - interval '1 day'
    UNION ALL
    SELECT CURRENT_DATE
) dates
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.officer_performance_summary ops
    WHERE ops.officer_id = o.officer_id AND ops.summary_date = dates.summary_date
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_officer_performance_date 
ON kastle_banking.officer_performance_summary(summary_date);

CREATE INDEX IF NOT EXISTS idx_officer_performance_officer 
ON kastle_banking.officer_performance_summary(officer_id);

-- Grant permissions
GRANT ALL ON SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- Disable RLS
ALTER TABLE kastle_banking.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_teams DISABLE ROW LEVEL SECURITY;

-- Create a view that matches the expected query structure
CREATE OR REPLACE VIEW kastle_banking.officer_performance_with_details AS
SELECT 
    ops.*,
    row_to_json(
        (SELECT r FROM (
            SELECT 
                co.officer_id,
                co.officer_name,
                co.officer_type,
                co.team_id,
                row_to_json(
                    (SELECT t FROM (
                        SELECT ct.team_name
                    ) t)
                ) as collection_teams
        ) r)
    ) as collection_officers
FROM kastle_banking.officer_performance_summary ops
LEFT JOIN kastle_banking.collection_officers co ON ops.officer_id = co.officer_id
LEFT JOIN kastle_banking.collection_teams ct ON co.team_id = ct.team_id;

-- Grant permissions on the view
GRANT SELECT ON kastle_banking.officer_performance_with_details TO authenticated;

-- Verify
SELECT 
    'Setup Complete' as status,
    (SELECT COUNT(*) FROM kastle_banking.collection_teams) as teams,
    (SELECT COUNT(*) FROM kastle_banking.collection_officers) as officers,
    (SELECT COUNT(*) FROM kastle_banking.officer_performance_summary) as performance_records;
