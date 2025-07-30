-- Comprehensive fix for collection_buckets table issues
-- This script handles all NOT NULL constraints dynamically

-- First, let's see what columns exist and their constraints
DO $$
DECLARE
    col RECORD;
    sql_cmd TEXT;
BEGIN
    RAISE NOTICE 'Checking collection_buckets table structure...';
    
    -- Check if the table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_buckets'
    ) THEN
        RAISE NOTICE 'Table kastle_banking.collection_buckets does not exist. Creating it...';
        
        -- Create the table with all known columns
        CREATE TABLE kastle_banking.collection_buckets (
            bucket_id SERIAL PRIMARY KEY,
            bucket_name VARCHAR(50) NOT NULL,
            bucket_code VARCHAR(20) UNIQUE,
            min_days INTEGER,
            max_days INTEGER,
            min_dpd INTEGER NOT NULL DEFAULT 0,
            max_dpd INTEGER NOT NULL DEFAULT 9999,
            priority_level INTEGER NOT NULL DEFAULT 1,
            priority_order INTEGER,
            description TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW()
        );
    ELSE
        RAISE NOTICE 'Table exists. Checking for missing columns...';
        
        -- For each potentially missing column, add it if it doesn't exist
        -- min_dpd
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'min_dpd'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN min_dpd INTEGER DEFAULT 0;
            
            -- Update existing rows
            UPDATE kastle_banking.collection_buckets 
            SET min_dpd = COALESCE(min_days, 0) 
            WHERE min_dpd IS NULL;
            
            -- Add NOT NULL constraint
            ALTER TABLE kastle_banking.collection_buckets 
            ALTER COLUMN min_dpd SET NOT NULL;
        END IF;
        
        -- max_dpd
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'max_dpd'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN max_dpd INTEGER DEFAULT 9999;
            
            -- Update existing rows
            UPDATE kastle_banking.collection_buckets 
            SET max_dpd = COALESCE(max_days, 9999) 
            WHERE max_dpd IS NULL;
            
            -- Add NOT NULL constraint
            ALTER TABLE kastle_banking.collection_buckets 
            ALTER COLUMN max_dpd SET NOT NULL;
        END IF;
        
        -- priority_level
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'priority_level'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN priority_level INTEGER DEFAULT 1;
            
            -- Update existing rows based on bucket code
            UPDATE kastle_banking.collection_buckets 
            SET priority_level = 
                CASE bucket_code
                    WHEN 'CURRENT' THEN 1
                    WHEN 'BUCKET_1' THEN 2
                    WHEN 'BUCKET_2' THEN 3
                    WHEN 'BUCKET_3' THEN 4
                    WHEN 'BUCKET_4' THEN 5
                    WHEN 'BUCKET_5' THEN 6
                    WHEN 'BUCKET_6' THEN 7
                    ELSE COALESCE(priority_order, bucket_id, 99)
                END
            WHERE priority_level IS NULL;
            
            -- Add NOT NULL constraint
            ALTER TABLE kastle_banking.collection_buckets 
            ALTER COLUMN priority_level SET NOT NULL;
        END IF;
        
        -- priority_order (not NOT NULL, but useful)
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'priority_order'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN priority_order INTEGER;
            
            -- Update existing rows
            UPDATE kastle_banking.collection_buckets 
            SET priority_order = priority_level
            WHERE priority_order IS NULL;
        END IF;
        
        -- is_active
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'is_active'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
    END IF;
    
    -- Fix any NULL values in NOT NULL columns
    UPDATE kastle_banking.collection_buckets 
    SET 
        min_dpd = COALESCE(min_dpd, min_days, 0),
        max_dpd = COALESCE(max_dpd, max_days, 9999),
        priority_level = COALESCE(priority_level, priority_order, 
            CASE bucket_code
                WHEN 'CURRENT' THEN 1
                WHEN 'BUCKET_1' THEN 2
                WHEN 'BUCKET_2' THEN 3
                WHEN 'BUCKET_3' THEN 4
                WHEN 'BUCKET_4' THEN 5
                WHEN 'BUCKET_5' THEN 6
                WHEN 'BUCKET_6' THEN 7
                ELSE 99
            END)
    WHERE min_dpd IS NULL OR max_dpd IS NULL OR priority_level IS NULL;
    
END $$;

-- Now insert or update the default buckets
INSERT INTO kastle_banking.collection_buckets 
    (bucket_code, bucket_name, min_days, max_days, min_dpd, max_dpd, priority_level, priority_order, is_active)
VALUES 
    ('CURRENT', 'Current', 0, 0, 0, 0, 1, 1, true),
    ('BUCKET_1', '1-30 Days', 1, 30, 1, 30, 2, 2, true),
    ('BUCKET_2', '31-60 Days', 31, 60, 31, 60, 3, 3, true),
    ('BUCKET_3', '61-90 Days', 61, 90, 61, 90, 4, 4, true),
    ('BUCKET_4', '91-120 Days', 91, 120, 91, 120, 5, 5, true),
    ('BUCKET_5', '121-180 Days', 121, 180, 121, 180, 6, 6, true),
    ('BUCKET_6', '180+ Days', 181, 9999, 181, 9999, 7, 7, true)
ON CONFLICT (bucket_code) 
DO UPDATE SET 
    bucket_name = EXCLUDED.bucket_name,
    min_days = EXCLUDED.min_days,
    max_days = EXCLUDED.max_days,
    min_dpd = EXCLUDED.min_dpd,
    max_dpd = EXCLUDED.max_dpd,
    priority_level = EXCLUDED.priority_level,
    priority_order = EXCLUDED.priority_order,
    is_active = EXCLUDED.is_active;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.collection_buckets TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON kastle_banking.collection_buckets_bucket_id_seq TO anon, authenticated, service_role;

-- Verify the fix
DO $$
DECLARE
    bucket_count INTEGER;
    null_count INTEGER;
    col_info RECORD;
BEGIN
    SELECT COUNT(*) INTO bucket_count FROM kastle_banking.collection_buckets;
    
    SELECT COUNT(*) INTO null_count 
    FROM kastle_banking.collection_buckets 
    WHERE min_dpd IS NULL OR max_dpd IS NULL OR priority_level IS NULL;
    
    RAISE NOTICE '=== Collection Buckets Status ===';
    RAISE NOTICE 'Total buckets: %', bucket_count;
    RAISE NOTICE 'Buckets with NULL in required fields: %', null_count;
    
    -- Show column information
    RAISE NOTICE '';
    RAISE NOTICE 'Column structure:';
    FOR col_info IN 
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_buckets'
        ORDER BY ordinal_position
    LOOP
        RAISE NOTICE '  % (%) - Nullable: %, Default: %', 
            col_info.column_name, 
            col_info.data_type, 
            col_info.is_nullable,
            COALESCE(col_info.column_default, 'none');
    END LOOP;
    
    IF null_count = 0 THEN
        RAISE NOTICE '';
        RAISE NOTICE '✅ All collection buckets have valid data!';
    ELSE
        RAISE WARNING '⚠️  Some buckets still have NULL values in required fields';
    END IF;
END $$;