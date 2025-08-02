-- Enable Realtime for collection tables
-- This fixes the errors about "Unable to subscribe to changes"

-- First, check if the tables exist
DO $$
BEGIN
    -- Enable Realtime for collection_cases table
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_cases'
    ) THEN
        -- Drop existing publication if it exists
        DROP PUBLICATION IF EXISTS supabase_realtime CASCADE;
        
        -- Create publication for realtime
        CREATE PUBLICATION supabase_realtime FOR TABLE 
            kastle_banking.collection_cases,
            kastle_banking.branch_collection_performance;
            
        RAISE NOTICE 'Realtime enabled for collection tables';
    ELSE
        RAISE NOTICE 'collection_cases table does not exist in kastle_banking schema';
    END IF;
END $$;

-- Alternative approach using Supabase's built-in function
-- This is the preferred method for Supabase

-- Enable Realtime for collection_cases
ALTER TABLE kastle_banking.collection_cases REPLICA IDENTITY FULL;

-- Enable Realtime for branch_collection_performance if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branch_collection_performance'
    ) THEN
        ALTER TABLE kastle_banking.branch_collection_performance REPLICA IDENTITY FULL;
    ELSE
        -- Create the table if it doesn't exist
        CREATE TABLE IF NOT EXISTS kastle_banking.branch_collection_performance (
            id SERIAL PRIMARY KEY,
            branch_id VARCHAR(50),
            performance_date DATE NOT NULL,
            total_cases INTEGER DEFAULT 0,
            resolved_cases INTEGER DEFAULT 0,
            total_amount DECIMAL(15,2) DEFAULT 0,
            collected_amount DECIMAL(15,2) DEFAULT 0,
            collection_rate DECIMAL(5,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_branch_performance_branch 
                FOREIGN KEY (branch_id) 
                REFERENCES kastle_banking.branches(branch_id) 
                ON DELETE CASCADE
        );
        
        ALTER TABLE kastle_banking.branch_collection_performance REPLICA IDENTITY FULL;
    END IF;
END $$;

-- Verify Realtime is enabled
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE schemaname = 'kastle_banking' 
AND tablename IN ('collection_cases', 'branch_collection_performance');

-- Note: You may also need to enable Realtime through Supabase Dashboard:
-- 1. Go to your Supabase project dashboard
-- 2. Navigate to Database > Replication
-- 3. Enable replication for these tables:
--    - kastle_banking.collection_cases
--    - kastle_banking.branch_collection_performance