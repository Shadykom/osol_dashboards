-- Fix schema issues for Specialist Report functionality

-- 1. Check and add missing column in loan_accounts table
DO $$
BEGIN
    -- Check if loan_amount column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'loan_amount'
    ) THEN
        -- Add loan_amount column (it might be named principal_amount instead)
        ALTER TABLE kastle_banking.loan_accounts 
        ADD COLUMN loan_amount NUMERIC(18,2);
        
        -- Copy data from principal_amount if it exists
        UPDATE kastle_banking.loan_accounts 
        SET loan_amount = principal_amount 
        WHERE principal_amount IS NOT NULL;
        
        RAISE NOTICE 'Added loan_amount column to loan_accounts table';
    END IF;
END $$;

-- 2. Check and add missing columns in promise_to_pay table
DO $$
BEGIN
    -- Check if actual_payment_date column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'promise_to_pay' 
        AND column_name = 'actual_payment_date'
    ) THEN
        ALTER TABLE kastle_banking.promise_to_pay 
        ADD COLUMN actual_payment_date DATE;
        
        RAISE NOTICE 'Added actual_payment_date column to promise_to_pay table';
    END IF;
    
    -- Check if actual_payment_amount column exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'promise_to_pay' 
        AND column_name = 'actual_payment_amount'
    ) THEN
        ALTER TABLE kastle_banking.promise_to_pay 
        ADD COLUMN actual_payment_amount NUMERIC(18,2);
        
        RAISE NOTICE 'Added actual_payment_amount column to promise_to_pay table';
    END IF;
END $$;

-- 3. Check and fix collection_teams table structure
-- First check if the table exists in the expected schema
SELECT 
    table_schema,
    table_name
FROM information_schema.tables
WHERE table_name = 'collection_teams'
AND table_schema IN ('kastle_banking', 'kastle_collection', 'public');

-- If collection_teams exists, check for team_lead_id column
DO $$
BEGIN
    -- Try kastle_collection schema first
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_teams'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_teams' 
        AND column_name = 'team_lead_id'
    ) THEN
        ALTER TABLE kastle_collection.collection_teams 
        ADD COLUMN team_lead_id VARCHAR(20);
        
        RAISE NOTICE 'Added team_lead_id column to kastle_collection.collection_teams table';
    END IF;
    
    -- Try kastle_banking schema
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_teams'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_teams' 
        AND column_name = 'team_lead_id'
    ) THEN
        ALTER TABLE kastle_banking.collection_teams 
        ADD COLUMN team_lead_id VARCHAR(20);
        
        RAISE NOTICE 'Added team_lead_id column to kastle_banking.collection_teams table';
    END IF;
END $$;

-- 4. Create missing tables if they don't exist
-- Create promise_to_pay table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    officer_id VARCHAR(20),
    ptp_date DATE NOT NULL,
    ptp_amount NUMERIC(18,2) NOT NULL,
    status VARCHAR(30) CHECK (status IN ('PENDING', 'KEPT', 'BROKEN', 'PARTIAL', 'CANCELLED')),
    actual_payment_date DATE,
    actual_payment_amount NUMERIC(18,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id)
);

-- Create officer_performance_metrics table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.officer_performance_metrics (
    id SERIAL PRIMARY KEY,
    officer_id VARCHAR(20) NOT NULL,
    metric_date DATE NOT NULL,
    calls_made INTEGER DEFAULT 0,
    calls_answered INTEGER DEFAULT 0,
    promises_made INTEGER DEFAULT 0,
    promises_kept INTEGER DEFAULT 0,
    amount_collected NUMERIC(18,2) DEFAULT 0,
    cases_resolved INTEGER DEFAULT 0,
    avg_call_duration INTEGER, -- in seconds
    customer_satisfaction_score NUMERIC(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(officer_id, metric_date)
);

-- 5. Verify all columns exist
SELECT 
    'loan_accounts.loan_amount' as column_check,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'loan_amount'
    ) as exists
UNION ALL
SELECT 
    'promise_to_pay.actual_payment_date' as column_check,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'promise_to_pay' 
        AND column_name = 'actual_payment_date'
    ) as exists
UNION ALL
SELECT 
    'promise_to_pay.actual_payment_amount' as column_check,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'promise_to_pay' 
        AND column_name = 'actual_payment_amount'
    ) as exists;

-- 6. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_officer_date 
ON kastle_banking.promise_to_pay(officer_id, created_at);

CREATE INDEX IF NOT EXISTS idx_officer_performance_officer_date 
ON kastle_banking.officer_performance_metrics(officer_id, metric_date);

-- 7. Grant appropriate permissions (adjust as needed)
GRANT SELECT ON kastle_banking.promise_to_pay TO web_anon;
GRANT SELECT ON kastle_banking.officer_performance_metrics TO web_anon;