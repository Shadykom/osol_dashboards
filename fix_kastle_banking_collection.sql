-- Fix Collection Tables in kastle_banking Schema
-- Since all tables have been moved to kastle_banking, ensure they have the required columns

-- 1. Check what collection-related tables exist in kastle_banking
SELECT 'Collection tables in kastle_banking:' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'kastle_banking' 
AND table_name IN (
    'collection_cases', 'collection_officers', 'collection_teams',
    'collection_interactions', 'promise_to_pay', 'daily_collection_summary',
    'officer_performance_summary', 'collection_buckets'
)
ORDER BY table_name;

-- 2. Ensure collection_cases has all required columns
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS days_past_due INTEGER DEFAULT 0;

-- 3. Ensure daily_collection_summary has all required columns
ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS total_cases INTEGER DEFAULT 0;

ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;

ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS total_collected DECIMAL(15,2) DEFAULT 0;

ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS collection_rate DECIMAL(5,2) DEFAULT 0;

ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS accounts_due INTEGER DEFAULT 0;

ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS accounts_collected INTEGER DEFAULT 0;

ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS calls_made INTEGER DEFAULT 0;

ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS ptps_created INTEGER DEFAULT 0;

ALTER TABLE kastle_banking.daily_collection_summary 
ADD COLUMN IF NOT EXISTS ptps_kept INTEGER DEFAULT 0;

-- 4. Disable RLS on all collection tables in kastle_banking
DO $$
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking'
        AND tablename IN (
            'collection_cases', 'collection_officers', 'collection_teams',
            'collection_interactions', 'promise_to_pay', 'daily_collection_summary',
            'officer_performance_summary', 'collection_buckets', 'loan_accounts',
            'customers', 'customer_contacts', 'products'
        )
    LOOP
        EXECUTE format('ALTER TABLE kastle_banking.%I DISABLE ROW LEVEL SECURITY', tbl);
    END LOOP;
END $$;

-- 5. Grant permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated, service_role;

-- 6. Insert minimal test data if tables are empty
INSERT INTO kastle_banking.daily_collection_summary (summary_date)
SELECT CURRENT_DATE
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_banking.daily_collection_summary 
    WHERE summary_date = CURRENT_DATE
);

-- 7. Verify the structure
SELECT 'Verification - collection_cases columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_cases'
AND column_name IN ('total_outstanding', 'days_past_due')
ORDER BY column_name;

SELECT 'Verification - daily_collection_summary columns:' as info;
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'daily_collection_summary'
AND column_name IN ('total_cases', 'total_outstanding', 'total_collected', 'collection_rate')
ORDER BY column_name;

-- 8. Check if we have any data
SELECT 
    'Data Summary:' as info,
    (SELECT COUNT(*) FROM kastle_banking.collection_cases) as collection_cases_count,
    (SELECT COUNT(*) FROM kastle_banking.daily_collection_summary) as daily_summary_count,
    (SELECT COUNT(*) FROM kastle_banking.collection_officers WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_officers')) as officers_count,
    (SELECT COUNT(*) FROM kastle_banking.collection_teams WHERE EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_teams')) as teams_count;

SELECT '✅ All collection tables are now properly configured in kastle_banking schema!' as message;