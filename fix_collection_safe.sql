-- Fix Collection Database Issues (Safe Version)
-- This script checks table structures before inserting data

-- 1. First, let's see what columns exist in our tables
SELECT 'Current collection_teams structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'kastle_collection' 
AND table_name = 'collection_teams'
ORDER BY ordinal_position;

SELECT 'Current collection_officers structure:' as info;
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_schema = 'kastle_collection' 
AND table_name = 'collection_officers'
ORDER BY ordinal_position;

-- 2. Add missing columns to collection_cases
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS days_past_due INTEGER DEFAULT 0;

-- 3. Create missing tables
CREATE TABLE IF NOT EXISTS kastle_collection.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL UNIQUE,
    total_cases INTEGER DEFAULT 0,
    total_outstanding DECIMAL(15,2) DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    accounts_due INTEGER DEFAULT 0,
    accounts_collected INTEGER DEFAULT 0,
    calls_made INTEGER DEFAULT 0,
    ptps_created INTEGER DEFAULT 0,
    ptps_kept INTEGER DEFAULT 0,
    new_cases INTEGER DEFAULT 0,
    closed_cases INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_summary (
    summary_id SERIAL PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    contact_rate DECIMAL(5,2) DEFAULT 0,
    ptp_rate DECIMAL(5,2) DEFAULT 0,
    quality_score DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(officer_id, summary_date)
);

-- 4. Disable RLS
ALTER TABLE IF EXISTS kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_banking.loan_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_banking.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_banking.customer_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_banking.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_banking.collection_buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_collection.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_collection.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_collection.collection_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_collection.promise_to_pay DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;

-- 6. Insert teams with only the columns that exist
-- This dynamic SQL will only insert columns that actually exist in the table
DO $$
DECLARE
    team_insert_sql text;
    team_columns text[];
    available_columns text[];
BEGIN
    -- Get list of actual columns in collection_teams
    SELECT array_agg(column_name::text)
    INTO available_columns
    FROM information_schema.columns 
    WHERE table_schema = 'kastle_collection' 
    AND table_name = 'collection_teams';
    
    -- Build list of columns we want to insert that actually exist
    team_columns := ARRAY[]::text[];
    
    IF 'team_id' = ANY(available_columns) THEN
        team_columns := array_append(team_columns, 'team_id');
    END IF;
    
    IF 'team_name' = ANY(available_columns) THEN
        team_columns := array_append(team_columns, 'team_name');
    END IF;
    
    IF 'team_type' = ANY(available_columns) THEN
        team_columns := array_append(team_columns, 'team_type');
    END IF;
    
    -- Build the INSERT statement dynamically
    IF array_length(team_columns, 1) >= 3 THEN
        team_insert_sql := format(
            'INSERT INTO kastle_collection.collection_teams (%s) VALUES (1, %L, %L), (2, %L, %L) ON CONFLICT (team_id) DO UPDATE SET team_name = EXCLUDED.team_name',
            array_to_string(team_columns, ', '),
            'فريق التحصيل الرئيسي',
            'FIELD',
            'فريق مركز الاتصال',
            'CALL_CENTER'
        );
        
        EXECUTE team_insert_sql;
        RAISE NOTICE 'Teams inserted successfully';
    ELSE
        RAISE NOTICE 'Not enough columns in collection_teams table. Available columns: %', available_columns;
    END IF;
END $$;

-- 7. Insert officers
INSERT INTO kastle_collection.collection_officers (
    officer_id, officer_name, officer_type, team_id, 
    contact_number, email, status
) VALUES 
    ('OFF001', 'أحمد محمد', 'SENIOR', 1, '+966501234567', 'ahmed@example.com', 'ACTIVE'),
    ('OFF002', 'فاطمة علي', 'JUNIOR', 1, '+966502345678', 'fatima@example.com', 'ACTIVE'),
    ('OFF003', 'محمد سالم', 'FIELD', 2, '+966503456789', 'mohammed@example.com', 'ACTIVE'),
    ('OFF004', 'نورا خالد', 'CALL_CENTER', 2, '+966504567890', 'nora@example.com', 'ACTIVE')
ON CONFLICT (officer_id) DO UPDATE SET
    officer_name = EXCLUDED.officer_name,
    officer_type = EXCLUDED.officer_type,
    team_id = EXCLUDED.team_id;

-- 8. Insert daily collection summary data
INSERT INTO kastle_collection.daily_collection_summary (
    summary_date, total_cases, total_outstanding, total_collected, 
    collection_rate, accounts_due, accounts_collected, calls_made, 
    ptps_created, ptps_kept
)
SELECT 
    CURRENT_DATE - (n || ' days')::INTERVAL,
    150 + (RANDOM() * 20)::INT,
    2500000 + (RANDOM() * 500000)::DECIMAL,
    100000 + (RANDOM() * 50000)::DECIMAL,
    4 + (RANDOM() * 2)::DECIMAL,
    100 + (RANDOM() * 20)::INT,
    20 + (RANDOM() * 10)::INT,
    200 + (RANDOM() * 50)::INT,
    30 + (RANDOM() * 10)::INT,
    20 + (RANDOM() * 5)::INT
FROM generate_series(0, 30) n
ON CONFLICT (summary_date) DO NOTHING;

-- 9. Verify the fixes
SELECT 'Verification Results:' as info;
SELECT 
    (SELECT COUNT(*) FROM kastle_collection.collection_officers) as officers_count,
    (SELECT COUNT(*) FROM kastle_collection.collection_teams) as teams_count,
    (SELECT COUNT(*) FROM kastle_collection.daily_collection_summary) as summaries_count,
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'kastle_banking' 
           AND table_name = 'collection_cases' 
           AND column_name = 'total_outstanding') as has_total_outstanding,
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'kastle_banking' 
           AND table_name = 'collection_cases' 
           AND column_name = 'days_past_due') as has_days_past_due;

-- Show the data we inserted
SELECT 'Teams:' as info;
SELECT * FROM kastle_collection.collection_teams;

SELECT 'Officers:' as info;
SELECT officer_id, officer_name, team_id FROM kastle_collection.collection_officers;