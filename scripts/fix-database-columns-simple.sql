-- Fix column name mismatches between application and database
-- This script renames columns to match what the application expects

-- 1. Rename 'status' to 'customer_status' in customers table
DO $$ 
BEGIN
    -- Check if we need to rename the column
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'status'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_status'
    ) THEN
        -- Rename the column
        ALTER TABLE kastle_banking.customers 
        RENAME COLUMN status TO customer_status;
        
        RAISE NOTICE 'Renamed status column to customer_status in customers table';
    ELSE
        RAISE NOTICE 'Column rename not needed - customer_status already exists or status does not exist';
    END IF;
END $$;

-- 2. Update any existing constraints to use the new column name
DO $$
BEGIN
    -- Drop old constraint if exists
    ALTER TABLE kastle_banking.customers 
    DROP CONSTRAINT IF EXISTS customers_status_check;
    
    -- Add new constraint with correct column name
    ALTER TABLE kastle_banking.customers 
    ADD CONSTRAINT customers_customer_status_check 
    CHECK (customer_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED'));
    
    RAISE NOTICE 'Updated constraints for customer_status column';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Constraint update skipped: %', SQLERRM;
END $$;

-- 3. Create/update indexes
DROP INDEX IF EXISTS kastle_banking.idx_customers_status;
CREATE INDEX IF NOT EXISTS idx_customers_customer_status 
ON kastle_banking.customers(customer_status);

-- 4. Grant necessary permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.customers TO authenticated;

-- 5. Verify the changes
SELECT 
    table_schema,
    table_name,
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'customers'
AND column_name IN ('status', 'customer_status')
ORDER BY column_name;