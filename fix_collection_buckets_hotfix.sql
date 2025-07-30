-- Hotfix for collection_buckets min_dpd NOT NULL constraint issue
-- This script fixes the existing table structure and data

-- First, check if the table exists and has the problematic constraint
DO $$
BEGIN
    -- Check if kastle_banking.collection_buckets exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_buckets'
    ) THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'min_dpd'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN min_dpd INTEGER NOT NULL DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'max_dpd'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN max_dpd INTEGER NOT NULL DEFAULT 9999;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'priority_order'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN priority_order INTEGER;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'is_active'
        ) THEN
            ALTER TABLE kastle_banking.collection_buckets 
            ADD COLUMN is_active BOOLEAN DEFAULT true;
        END IF;
        
        -- Update existing rows to set min_dpd and max_dpd based on min_days and max_days
        UPDATE kastle_banking.collection_buckets 
        SET 
            min_dpd = COALESCE(min_days, 0),
            max_dpd = COALESCE(max_days, 9999)
        WHERE min_dpd IS NULL OR max_dpd IS NULL;
        
        -- Set priority order based on bucket order
        UPDATE kastle_banking.collection_buckets 
        SET priority_order = 
            CASE bucket_code
                WHEN 'CURRENT' THEN 1
                WHEN 'BUCKET_1' THEN 2
                WHEN 'BUCKET_2' THEN 3
                WHEN 'BUCKET_3' THEN 4
                WHEN 'BUCKET_4' THEN 5
                WHEN 'BUCKET_5' THEN 6
                WHEN 'BUCKET_6' THEN 7
                ELSE 99
            END
        WHERE priority_order IS NULL;
    END IF;
    
    -- Check if kastle_collection.collection_buckets exists
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_buckets'
    ) THEN
        -- Add missing columns if they don't exist
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_collection' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'min_dpd'
        ) THEN
            ALTER TABLE kastle_collection.collection_buckets 
            ADD COLUMN min_dpd INTEGER NOT NULL DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'kastle_collection' 
            AND table_name = 'collection_buckets' 
            AND column_name = 'max_dpd'
        ) THEN
            ALTER TABLE kastle_collection.collection_buckets 
            ADD COLUMN max_dpd INTEGER NOT NULL DEFAULT 9999;
        END IF;
        
        -- Update existing rows
        UPDATE kastle_collection.collection_buckets 
        SET 
            min_dpd = COALESCE(min_days, 0),
            max_dpd = COALESCE(max_days, 9999)
        WHERE min_dpd IS NULL OR max_dpd IS NULL;
    END IF;
END $$;

-- Now try to insert the default buckets again with all required fields
INSERT INTO kastle_banking.collection_buckets (bucket_code, bucket_name, min_days, max_days, min_dpd, max_dpd, priority_order)
VALUES 
    ('CURRENT', 'Current', 0, 0, 0, 0, 1),
    ('BUCKET_1', '1-30 Days', 1, 30, 1, 30, 2),
    ('BUCKET_2', '31-60 Days', 31, 60, 31, 60, 3),
    ('BUCKET_3', '61-90 Days', 61, 90, 61, 90, 4),
    ('BUCKET_4', '91-120 Days', 91, 120, 91, 120, 5),
    ('BUCKET_5', '121-180 Days', 121, 180, 121, 180, 6),
    ('BUCKET_6', '180+ Days', 181, 9999, 181, 9999, 7)
ON CONFLICT (bucket_code) 
DO UPDATE SET 
    min_dpd = EXCLUDED.min_dpd,
    max_dpd = EXCLUDED.max_dpd,
    priority_order = EXCLUDED.priority_order
WHERE kastle_banking.collection_buckets.min_dpd IS NULL 
   OR kastle_banking.collection_buckets.max_dpd IS NULL;

-- Verify the fix
DO $$
DECLARE
    bucket_count INTEGER;
    buckets_with_null INTEGER;
BEGIN
    SELECT COUNT(*) INTO bucket_count 
    FROM kastle_banking.collection_buckets;
    
    SELECT COUNT(*) INTO buckets_with_null 
    FROM kastle_banking.collection_buckets 
    WHERE min_dpd IS NULL OR max_dpd IS NULL;
    
    RAISE NOTICE 'Total buckets: %', bucket_count;
    RAISE NOTICE 'Buckets with NULL min_dpd or max_dpd: %', buckets_with_null;
    
    IF buckets_with_null > 0 THEN
        RAISE WARNING 'Some buckets still have NULL values in min_dpd or max_dpd';
    ELSE
        RAISE NOTICE 'All buckets have valid min_dpd and max_dpd values';
    END IF;
END $$;