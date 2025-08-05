-- Safe Branch Report Migration Script
-- This script handles existing table structures gracefully

-- 1. First ensure branches table exists with required columns
CREATE TABLE IF NOT EXISTS kastle_banking.branches (
    branch_id VARCHAR(50) PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(20),
    city VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add missing columns to branches table if they don't exist
DO $$ 
BEGIN
    -- Add branch_code if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branches' 
        AND column_name = 'branch_code'
    ) THEN
        ALTER TABLE kastle_banking.branches ADD COLUMN branch_code VARCHAR(20);
    END IF;

    -- Add city if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branches' 
        AND column_name = 'city'
    ) THEN
        ALTER TABLE kastle_banking.branches ADD COLUMN city VARCHAR(50);
    END IF;

    -- Add state if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branches' 
        AND column_name = 'state'
    ) THEN
        ALTER TABLE kastle_banking.branches ADD COLUMN state VARCHAR(50);
    END IF;

    -- Add region if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branches' 
        AND column_name = 'region'
    ) THEN
        ALTER TABLE kastle_banking.branches ADD COLUMN region VARCHAR(50);
    END IF;

    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branches' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE kastle_banking.branches ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;

    -- Make branch_code unique if not already
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'UNIQUE' 
        AND table_schema = 'kastle_banking' 
        AND table_name = 'branches'
        AND constraint_name = 'branches_branch_code_key'
    ) THEN
        ALTER TABLE kastle_banking.branches 
        ADD CONSTRAINT branches_branch_code_key UNIQUE (branch_code);
    END IF;
END $$;

-- 3. Insert sample branches (now all columns should exist)
INSERT INTO kastle_banking.branches (branch_id, branch_name, branch_code, city, region)
VALUES 
    ('BR001', 'الرياض - الفرع الرئيسي', 'RYD001', 'الرياض', 'الوسطى'),
    ('BR002', 'جدة - فرع التحلية', 'JED001', 'جدة', 'الغربية'),
    ('BR003', 'الدمام - فرع الملك فهد', 'DMM001', 'الدمام', 'الشرقية'),
    ('BR004', 'مكة المكرمة', 'MKH001', 'مكة', 'الغربية'),
    ('BR005', 'المدينة المنورة', 'MDN001', 'المدينة', 'الغربية')
ON CONFLICT (branch_id) DO UPDATE SET
    branch_name = EXCLUDED.branch_name,
    branch_code = EXCLUDED.branch_code,
    city = EXCLUDED.city,
    region = EXCLUDED.region,
    is_active = true;

-- 4. Handle branch_collection_performance table
DO $$
DECLARE
    has_date_column BOOLEAN;
    has_report_date_column BOOLEAN;
    has_performance_date_column BOOLEAN;
    date_column_to_use TEXT;
BEGIN
    -- Check if table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branch_collection_performance'
    ) THEN
        -- Create new table with performance_date
        CREATE TABLE kastle_banking.branch_collection_performance (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            branch_id VARCHAR(50) REFERENCES kastle_banking.branches(branch_id),
            performance_date DATE NOT NULL DEFAULT CURRENT_DATE,
            total_cases INTEGER DEFAULT 0,
            active_cases INTEGER DEFAULT 0,
            resolved_cases INTEGER DEFAULT 0,
            total_outstanding DECIMAL(15,2) DEFAULT 0,
            total_collected DECIMAL(15,2) DEFAULT 0,
            collected_amount DECIMAL(15,2) DEFAULT 0,
            collection_rate DECIMAL(5,2) DEFAULT 0,
            delinquency_rate DECIMAL(5,2) DEFAULT 0,
            avg_dpd DECIMAL(10,2) DEFAULT 0,
            total_calls INTEGER DEFAULT 0,
            total_sms INTEGER DEFAULT 0,
            total_emails INTEGER DEFAULT 0,
            contact_rate DECIMAL(5,2) DEFAULT 0,
            ptp_rate DECIMAL(5,2) DEFAULT 0,
            ptp_kept_rate DECIMAL(5,2) DEFAULT 0,
            ptp_success_rate DECIMAL(5,2) DEFAULT 0,
            remediation_count INTEGER DEFAULT 0,
            remediation_amount DECIMAL(15,2) DEFAULT 0,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
        
        date_column_to_use := 'performance_date';
    ELSE
        -- Table exists, check which date column it has
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'branch_collection_performance' 
            AND column_name = 'date'
        ) INTO has_date_column;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'branch_collection_performance' 
            AND column_name = 'report_date'
        ) INTO has_report_date_column;
        
        SELECT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'branch_collection_performance' 
            AND column_name = 'performance_date'
        ) INTO has_performance_date_column;
        
        -- Determine which column to use
        IF has_performance_date_column THEN
            date_column_to_use := 'performance_date';
        ELSIF has_report_date_column THEN
            date_column_to_use := 'report_date';
        ELSIF has_date_column THEN
            date_column_to_use := 'date';
        ELSE
            -- No date column exists, add performance_date
            ALTER TABLE kastle_banking.branch_collection_performance 
            ADD COLUMN performance_date DATE NOT NULL DEFAULT CURRENT_DATE;
            date_column_to_use := 'performance_date';
        END IF;
        
        -- Add other missing columns
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'total_outstanding') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN total_outstanding DECIMAL(15,2) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'delinquency_rate') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN delinquency_rate DECIMAL(5,2) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'avg_dpd') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN avg_dpd DECIMAL(10,2) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'total_calls') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN total_calls INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'total_sms') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN total_sms INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'total_emails') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN total_emails INTEGER DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'contact_rate') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN contact_rate DECIMAL(5,2) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'ptp_rate') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN ptp_rate DECIMAL(5,2) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'ptp_kept_rate') THEN
            ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN ptp_kept_rate DECIMAL(5,2) DEFAULT 0;
        END IF;
    END IF;
    
    -- Store the date column name for later use
    RAISE NOTICE 'Using date column: %', date_column_to_use;
    
    -- Add unique constraint if needed
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_type = 'UNIQUE' 
        AND table_schema = 'kastle_banking' 
        AND table_name = 'branch_collection_performance'
        AND constraint_name LIKE '%branch%'
    ) THEN
        EXECUTE format('ALTER TABLE kastle_banking.branch_collection_performance 
                       ADD CONSTRAINT unique_branch_date UNIQUE (branch_id, %I)', date_column_to_use);
    END IF;
    
    -- Insert sample data if table is empty
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.branch_collection_performance LIMIT 1) THEN
        EXECUTE format('
            INSERT INTO kastle_banking.branch_collection_performance (
                branch_id, 
                %I,
                total_cases, 
                active_cases,
                total_outstanding, 
                delinquency_rate, 
                collection_rate,
                total_calls,
                total_sms,
                total_emails,
                contact_rate,
                ptp_rate
            )
            SELECT 
                b.branch_id,
                CURRENT_DATE - (n || '' days'')::INTERVAL,
                FLOOR(RANDOM() * 100 + 50)::INTEGER,
                FLOOR(RANDOM() * 50 + 25)::INTEGER,
                ROUND((RANDOM() * 5000000 + 1000000)::NUMERIC, 2),
                ROUND((RANDOM() * 20 + 5)::NUMERIC, 2),
                ROUND((RANDOM() * 30 + 60)::NUMERIC, 2),
                FLOOR(RANDOM() * 200 + 100)::INTEGER,
                FLOOR(RANDOM() * 150 + 50)::INTEGER,
                FLOOR(RANDOM() * 50 + 10)::INTEGER,
                ROUND((RANDOM() * 30 + 60)::NUMERIC, 2),
                ROUND((RANDOM() * 15 + 5)::NUMERIC, 2)
            FROM kastle_banking.branches b
            CROSS JOIN generate_series(0, 30) n
            WHERE b.is_active = true
            ON CONFLICT DO NOTHING', date_column_to_use);
    END IF;
END $$;

-- 5. Create indexes
CREATE INDEX IF NOT EXISTS idx_branches_is_active 
ON kastle_banking.branches(is_active);

CREATE INDEX IF NOT EXISTS idx_branch_collection_performance_branch 
ON kastle_banking.branch_collection_performance(branch_id);

-- Create date index based on which column exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'performance_date') THEN
        CREATE INDEX IF NOT EXISTS idx_branch_collection_performance_date 
        ON kastle_banking.branch_collection_performance(performance_date DESC);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'report_date') THEN
        CREATE INDEX IF NOT EXISTS idx_branch_collection_performance_date 
        ON kastle_banking.branch_collection_performance(report_date DESC);
    ELSIF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'kastle_banking' AND table_name = 'branch_collection_performance' AND column_name = 'date') THEN
        CREATE INDEX IF NOT EXISTS idx_branch_collection_performance_date 
        ON kastle_banking.branch_collection_performance(date DESC);
    END IF;
END $$;

-- 6. Enable RLS and create policies
ALTER TABLE kastle_banking.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branch_collection_performance ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for all users" ON kastle_banking.branches;
DROP POLICY IF EXISTS "Enable read access for all users" ON kastle_banking.branch_collection_performance;

-- Create new policies
CREATE POLICY "Enable read access for all users" ON kastle_banking.branches
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON kastle_banking.branch_collection_performance
    FOR SELECT USING (true);

-- 7. Grant permissions
GRANT SELECT ON kastle_banking.branches TO anon, authenticated;
GRANT SELECT ON kastle_banking.branch_collection_performance TO anon, authenticated;
GRANT ALL ON kastle_banking.branches TO service_role;
GRANT ALL ON kastle_banking.branch_collection_performance TO service_role;

-- 8. Enable realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'kastle_banking' 
        AND tablename = 'branch_collection_performance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.branch_collection_performance;
    END IF;
END $$;

-- 9. Final verification
SELECT 
    'Migration Complete' as status,
    (SELECT COUNT(*) FROM kastle_banking.branches) as total_branches,
    (SELECT COUNT(*) FROM kastle_banking.branch_collection_performance) as performance_records,
    (SELECT string_agg(column_name, ', ' ORDER BY ordinal_position) 
     FROM information_schema.columns 
     WHERE table_schema = 'kastle_banking' 
     AND table_name = 'branches') as branch_columns,
    (SELECT column_name 
     FROM information_schema.columns 
     WHERE table_schema = 'kastle_banking' 
     AND table_name = 'branch_collection_performance' 
     AND column_name IN ('date', 'report_date', 'performance_date')
     LIMIT 1) as date_column_used;