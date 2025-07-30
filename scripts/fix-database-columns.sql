-- Fix column name mismatches between application and database
-- This script adds computed columns to match what the application expects

-- 1. Add customer_status as a generated column that mirrors status
-- First check if the column already exists
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_status'
    ) THEN
        -- Add customer_status as a generated column
        ALTER TABLE kastle_banking.customers 
        ADD COLUMN customer_status VARCHAR(20) GENERATED ALWAYS AS (status) STORED;
        
        RAISE NOTICE 'Added customer_status column to customers table';
    ELSE
        RAISE NOTICE 'customer_status column already exists in customers table';
    END IF;
END $$;

-- 2. Create indexes on the new column for performance
CREATE INDEX IF NOT EXISTS idx_customers_customer_status 
ON kastle_banking.customers(customer_status);

-- 3. Grant necessary permissions
GRANT SELECT ON kastle_banking.customers TO anon;
GRANT SELECT ON kastle_banking.customers TO authenticated;

-- 4. Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default,
    generation_expression
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'customers'
AND column_name IN ('status', 'customer_status')
ORDER BY column_name;