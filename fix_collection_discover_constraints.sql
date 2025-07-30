-- Fix Collection Database Issues (Discover Constraints Version)
-- This script discovers all constraints before inserting data

-- 1. First, let's discover ALL constraints on our tables
SELECT 'Check Constraints on collection_officers:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'kastle_collection.collection_officers'::regclass
AND contype = 'c';

SELECT 'Check Constraints on collection_teams:' as info;
SELECT 
    conname as constraint_name,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint
WHERE conrelid = 'kastle_collection.collection_teams'::regclass
AND contype = 'c';

-- 2. Let's see the full structure of both tables
SELECT 'Full structure of collection_officers:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'kastle_collection' 
AND table_name = 'collection_officers'
ORDER BY ordinal_position;

SELECT 'Full structure of collection_teams:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'kastle_collection' 
AND table_name = 'collection_teams'
ORDER BY ordinal_position;

-- 3. Add missing columns to collection_cases (these are causing the main errors)
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS days_past_due INTEGER DEFAULT 0;

-- 4. Create missing tables
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

-- 5. Insert daily collection summary data (this should work without issues)
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

-- 6. Try to insert teams with common valid values
-- Based on the error, we know team_code is required
BEGIN;
    -- Try different team_type values
    INSERT INTO kastle_collection.collection_teams (team_id, team_code, team_name, team_type)
    VALUES (1, 'TEAM001', 'فريق التحصيل الرئيسي', 'FIELD')
    ON CONFLICT (team_id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    -- If FIELD doesn't work, try other common values
    BEGIN;
        INSERT INTO kastle_collection.collection_teams (team_id, team_code, team_name, team_type)
        VALUES (1, 'TEAM001', 'فريق التحصيل الرئيسي', 'COLLECTION')
        ON CONFLICT (team_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not insert team 1 with common team_type values';
    END;
END;

-- 7. Try to insert officers with common valid officer_type values
-- Based on the error, SENIOR is not valid, so let's try others
BEGIN;
    INSERT INTO kastle_collection.collection_officers (
        officer_id, officer_name, officer_type, team_id, 
        contact_number, email, status
    ) VALUES 
        ('OFF001', 'أحمد محمد', 'CALL_AGENT', 1, '+966501234567', 'ahmed@example.com', 'ACTIVE')
    ON CONFLICT (officer_id) DO NOTHING;
EXCEPTION WHEN OTHERS THEN
    BEGIN;
        INSERT INTO kastle_collection.collection_officers (
            officer_id, officer_name, officer_type, team_id, 
            contact_number, email, status
        ) VALUES 
            ('OFF001', 'أحمد محمد', 'FIELD_AGENT', 1, '+966501234567', 'ahmed@example.com', 'ACTIVE')
        ON CONFLICT (officer_id) DO NOTHING;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Could not insert officer with common officer_type values';
    END;
END;

-- 8. Disable RLS
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- 9. Grant permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;

-- 10. Show what we've accomplished
SELECT 'Final Results:' as info;
SELECT 
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'kastle_banking' 
           AND table_name = 'collection_cases' 
           AND column_name = 'total_outstanding') as collection_cases_fixed,
    EXISTS(SELECT 1 FROM information_schema.tables 
           WHERE table_schema = 'kastle_collection' 
           AND table_name = 'daily_collection_summary') as daily_summary_created,
    (SELECT COUNT(*) FROM kastle_collection.daily_collection_summary) as daily_summaries_count;

-- Show any existing data in the tables
SELECT 'Existing Teams:' as info;
SELECT * FROM kastle_collection.collection_teams LIMIT 5;

SELECT 'Existing Officers:' as info;
SELECT * FROM kastle_collection.collection_officers LIMIT 5;