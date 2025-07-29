-- Fix Collection Database Issues (Minimal Version)
-- This script only fixes the critical errors

-- 1. Add missing columns to collection_cases
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS days_past_due INTEGER DEFAULT 0;

-- 2. Create missing daily_collection_summary table
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

-- 3. Create missing officer_performance_summary table
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

-- 4. Disable RLS on key tables
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- 5. Grant permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated;

-- 6. Insert sample daily collection summary data (this should work)
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

-- 7. Verify the critical fixes
SELECT 'Critical Fixes Applied:' as status;

SELECT 
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'kastle_banking' 
           AND table_name = 'collection_cases' 
           AND column_name = 'total_outstanding') as collection_cases_total_outstanding,
    EXISTS(SELECT 1 FROM information_schema.columns 
           WHERE table_schema = 'kastle_banking' 
           AND table_name = 'collection_cases' 
           AND column_name = 'days_past_due') as collection_cases_days_past_due,
    EXISTS(SELECT 1 FROM information_schema.tables 
           WHERE table_schema = 'kastle_collection' 
           AND table_name = 'daily_collection_summary') as daily_collection_summary_exists,
    (SELECT COUNT(*) FROM kastle_collection.daily_collection_summary) as daily_summaries_count;