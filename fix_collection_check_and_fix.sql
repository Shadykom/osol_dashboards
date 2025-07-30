-- Fix Collection Database - Check Existing Structure First
-- This script checks what exists before making changes

-- 1. Check existing structure of daily_collection_summary
SELECT 'Current daily_collection_summary columns:' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_schema = 'kastle_collection' 
AND table_name = 'daily_collection_summary'
ORDER BY ordinal_position;

-- 2. Check if collection_cases has the required columns
SELECT 'Current collection_cases columns (checking for total_outstanding and days_past_due):' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_cases'
AND column_name IN ('total_outstanding', 'days_past_due', 'dpd', 'amount_outstanding', 'outstanding_amount', 'overdue_days', 'days_overdue');

-- 3. Add missing columns to collection_cases if they don't exist
DO $$
BEGIN
    -- Check if total_outstanding exists under any similar name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_cases' 
        AND column_name IN ('total_outstanding', 'amount_outstanding', 'outstanding_amount')
    ) THEN
        ALTER TABLE kastle_banking.collection_cases 
        ADD COLUMN total_outstanding DECIMAL(15,2) DEFAULT 0;
        RAISE NOTICE 'Added total_outstanding column';
    END IF;
    
    -- Check if days_past_due exists under any similar name
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_cases' 
        AND column_name IN ('days_past_due', 'dpd', 'overdue_days', 'days_overdue')
    ) THEN
        ALTER TABLE kastle_banking.collection_cases 
        ADD COLUMN days_past_due INTEGER DEFAULT 0;
        RAISE NOTICE 'Added days_past_due column';
    END IF;
END $$;

-- 4. Add missing columns to daily_collection_summary if needed
DO $$
BEGIN
    -- Add total_cases if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'daily_collection_summary' 
        AND column_name = 'total_cases'
    ) THEN
        ALTER TABLE kastle_collection.daily_collection_summary 
        ADD COLUMN total_cases INTEGER DEFAULT 0;
    END IF;
    
    -- Add total_outstanding if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'daily_collection_summary' 
        AND column_name = 'total_outstanding'
    ) THEN
        ALTER TABLE kastle_collection.daily_collection_summary 
        ADD COLUMN total_outstanding DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Add total_collected if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'daily_collection_summary' 
        AND column_name = 'total_collected'
    ) THEN
        ALTER TABLE kastle_collection.daily_collection_summary 
        ADD COLUMN total_collected DECIMAL(15,2) DEFAULT 0;
    END IF;
    
    -- Add collection_rate if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'daily_collection_summary' 
        AND column_name = 'collection_rate'
    ) THEN
        ALTER TABLE kastle_collection.daily_collection_summary 
        ADD COLUMN collection_rate DECIMAL(5,2) DEFAULT 0;
    END IF;
    
    -- Add other expected columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_collection' AND table_name = 'daily_collection_summary' AND column_name = 'accounts_due') THEN
        ALTER TABLE kastle_collection.daily_collection_summary ADD COLUMN accounts_due INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_collection' AND table_name = 'daily_collection_summary' AND column_name = 'accounts_collected') THEN
        ALTER TABLE kastle_collection.daily_collection_summary ADD COLUMN accounts_collected INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_collection' AND table_name = 'daily_collection_summary' AND column_name = 'calls_made') THEN
        ALTER TABLE kastle_collection.daily_collection_summary ADD COLUMN calls_made INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_collection' AND table_name = 'daily_collection_summary' AND column_name = 'ptps_created') THEN
        ALTER TABLE kastle_collection.daily_collection_summary ADD COLUMN ptps_created INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_collection' AND table_name = 'daily_collection_summary' AND column_name = 'ptps_kept') THEN
        ALTER TABLE kastle_collection.daily_collection_summary ADD COLUMN ptps_kept INTEGER DEFAULT 0;
    END IF;
END $$;

-- 5. Create officer_performance_summary if it doesn't exist
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

-- 6. Disable RLS on key tables
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customer_contacts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;

-- 7. Grant permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated, service_role;

-- 8. Check the updated structure
SELECT 'Updated daily_collection_summary structure:' as info;
SELECT column_name, data_type
FROM information_schema.columns 
WHERE table_schema = 'kastle_collection' 
AND table_name = 'daily_collection_summary'
ORDER BY ordinal_position;

-- 9. Insert a test row with minimal data
INSERT INTO kastle_collection.daily_collection_summary (summary_date)
VALUES (CURRENT_DATE)
ON CONFLICT (summary_date) DO NOTHING;

-- 10. Verify all fixes
SELECT 'Verification:' as info;
SELECT 
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'collection_cases' AND column_name = 'total_outstanding') as has_total_outstanding,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'collection_cases' AND column_name = 'days_past_due') as has_days_past_due,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_collection' AND table_name = 'daily_collection_summary' AND column_name = 'total_cases') as has_total_cases,
    EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_collection' AND table_name = 'daily_collection_summary' AND column_name = 'total_collected') as has_total_collected;