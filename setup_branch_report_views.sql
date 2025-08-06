-- Setup Branch Report Views
-- This script creates the necessary views for the branch report functionality

-- First, ensure we have the required columns in branch_collection_performance
DO $$
BEGIN
    -- Add performance_date column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branch_collection_performance' 
        AND column_name = 'performance_date'
    ) THEN
        ALTER TABLE kastle_banking.branch_collection_performance 
        ADD COLUMN performance_date DATE DEFAULT CURRENT_DATE;
    END IF;

    -- Add total_collected_amount column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branch_collection_performance' 
        AND column_name = 'total_collected_amount'
    ) THEN
        ALTER TABLE kastle_banking.branch_collection_performance 
        ADD COLUMN total_collected_amount DECIMAL(15,2) DEFAULT 0;
    END IF;

    -- Add collection_rate column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branch_collection_performance' 
        AND column_name = 'collection_rate'
    ) THEN
        ALTER TABLE kastle_banking.branch_collection_performance 
        ADD COLUMN collection_rate DECIMAL(5,2) DEFAULT 0;
    END IF;

    -- Add number_of_accounts column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branch_collection_performance' 
        AND column_name = 'number_of_accounts'
    ) THEN
        ALTER TABLE kastle_banking.branch_collection_performance 
        ADD COLUMN number_of_accounts INTEGER DEFAULT 0;
    END IF;
END $$;

-- Insert sample data for testing if table is empty
INSERT INTO kastle_banking.branch_collection_performance (
    branch_id,
    performance_date,
    total_collected_amount,
    total_outstanding,
    collection_rate,
    number_of_accounts,
    total_calls,
    total_sms,
    total_emails
)
SELECT 
    b.branch_id,
    CURRENT_DATE - (n || ' days')::interval,
    ROUND(RANDOM() * 1000000 + 500000),
    ROUND(RANDOM() * 2000000 + 1000000),
    ROUND(RANDOM() * 40 + 60),
    ROUND(RANDOM() * 200 + 100),
    ROUND(RANDOM() * 500 + 200),
    ROUND(RANDOM() * 300 + 100),
    ROUND(RANDOM() * 200 + 50)
FROM 
    kastle_banking.branches b
    CROSS JOIN generate_series(0, 29) n
WHERE 
    NOT EXISTS (
        SELECT 1 FROM kastle_banking.branch_collection_performance 
        WHERE branch_id = b.branch_id
    )
    AND b.is_active = true
LIMIT 1000;

-- Grant permissions
GRANT SELECT ON kastle_banking.branch_collection_performance TO authenticated, anon;
GRANT ALL ON kastle_banking.branch_collection_performance TO service_role;

-- Enable RLS
ALTER TABLE kastle_banking.branch_collection_performance ENABLE ROW LEVEL SECURITY;

-- Create policy for read access
DROP POLICY IF EXISTS "Enable read access for all users" ON kastle_banking.branch_collection_performance;
CREATE POLICY "Enable read access for all users" ON kastle_banking.branch_collection_performance
    FOR SELECT USING (true);

-- Add to realtime if needed
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'kastle_banking' 
        AND tablename = 'branch_collection_performance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.branch_collection_performance;
    END IF;
END $$;

-- Verify the setup
SELECT 
    'Tables exist' as check_type,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'branches') as branches_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance') as performance_exists,
    EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'kastle_banking' AND table_name = 'collection_officers') as officers_exists;

-- Check sample data
SELECT 
    'Sample data' as check_type,
    COUNT(DISTINCT branch_id) as branches_with_data,
    COUNT(*) as total_performance_records,
    MIN(performance_date) as earliest_date,
    MAX(performance_date) as latest_date
FROM kastle_banking.branch_collection_performance;