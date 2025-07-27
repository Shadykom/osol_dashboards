-- Fix missing columns in kastle_collection schema

-- 1. Add team_lead_id to collection_teams table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_teams' 
        AND column_name = 'team_lead_id'
    ) THEN
        ALTER TABLE kastle_collection.collection_teams 
        ADD COLUMN team_lead_id VARCHAR(50);
        
        -- Add foreign key constraint if collection_officers table exists
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'kastle_collection' 
            AND table_name = 'collection_officers'
        ) THEN
            ALTER TABLE kastle_collection.collection_teams
            ADD CONSTRAINT fk_team_lead
            FOREIGN KEY (team_lead_id) 
            REFERENCES kastle_collection.collection_officers(officer_id)
            ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 2. Add missing columns to promise_to_pay table
DO $$ 
BEGIN
    -- Add actual_payment_date column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'promise_to_pay' 
        AND column_name = 'actual_payment_date'
    ) THEN
        ALTER TABLE kastle_collection.promise_to_pay 
        ADD COLUMN actual_payment_date TIMESTAMP;
    END IF;
    
    -- Add actual_payment_amount column
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'promise_to_pay' 
        AND column_name = 'actual_payment_amount'
    ) THEN
        ALTER TABLE kastle_collection.promise_to_pay 
        ADD COLUMN actual_payment_amount DECIMAL(15,2);
    END IF;
    
    -- Add officer_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'promise_to_pay' 
        AND column_name = 'officer_id'
    ) THEN
        ALTER TABLE kastle_collection.promise_to_pay 
        ADD COLUMN officer_id VARCHAR(50);
        
        -- Add foreign key constraint
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'kastle_collection' 
            AND table_name = 'collection_officers'
        ) THEN
            ALTER TABLE kastle_collection.promise_to_pay
            ADD CONSTRAINT fk_promise_officer
            FOREIGN KEY (officer_id) 
            REFERENCES kastle_collection.collection_officers(officer_id)
            ON DELETE SET NULL;
        END IF;
    END IF;
END $$;

-- 3. Create officer_performance_metrics table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'officer_performance_metrics'
    ) THEN
        CREATE TABLE kastle_collection.officer_performance_metrics (
            id SERIAL PRIMARY KEY,
            officer_id VARCHAR(50) NOT NULL,
            metric_date DATE NOT NULL,
            calls_made INTEGER DEFAULT 0,
            calls_answered INTEGER DEFAULT 0,
            promises_made INTEGER DEFAULT 0,
            promises_kept INTEGER DEFAULT 0,
            amount_collected DECIMAL(15,2) DEFAULT 0,
            cases_resolved INTEGER DEFAULT 0,
            avg_call_duration INTEGER DEFAULT 0,
            customer_satisfaction_score DECIMAL(3,2),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            CONSTRAINT fk_performance_officer
                FOREIGN KEY (officer_id) 
                REFERENCES kastle_collection.collection_officers(officer_id)
                ON DELETE CASCADE,
            UNIQUE(officer_id, metric_date)
        );
        
        -- Create index for performance
        CREATE INDEX idx_officer_performance_date 
        ON kastle_collection.officer_performance_metrics(officer_id, metric_date DESC);
    END IF;
END $$;

-- 4. Add any missing columns to collection_officers table
DO $$ 
BEGIN
    -- Ensure all required columns exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_officers' 
        AND column_name = 'language_skills'
    ) THEN
        ALTER TABLE kastle_collection.collection_officers 
        ADD COLUMN language_skills TEXT[];
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_officers' 
        AND column_name = 'collection_limit'
    ) THEN
        ALTER TABLE kastle_collection.collection_officers 
        ADD COLUMN collection_limit DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_officers' 
        AND column_name = 'commission_rate'
    ) THEN
        ALTER TABLE kastle_collection.collection_officers 
        ADD COLUMN commission_rate DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_officers' 
        AND column_name = 'last_active'
    ) THEN
        ALTER TABLE kastle_collection.collection_officers 
        ADD COLUMN last_active TIMESTAMP;
    END IF;
END $$;

-- 5. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_collection TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_collection TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_collection TO authenticated;