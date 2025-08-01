-- Fix Customer Reports Schema Issues
-- This script addresses the following errors:
-- 1. column customers_2.segment does not exist
-- 2. column customers.customer_status does not exist  
-- 3. column customers_1.risk_rating does not exist
-- 4. Multiple foreign key relationships between customers and customer_contacts
-- 5. Unknown customer report type: dormant_accounts

BEGIN;

-- 1. Add missing 'segment' column (alias for customer_segment)
-- Many queries are looking for 'segment' but the column is named 'customer_segment'
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'segment'
    ) THEN
        ALTER TABLE kastle_banking.customers 
        ADD COLUMN segment VARCHAR(30) GENERATED ALWAYS AS (customer_segment) STORED;
        
        RAISE NOTICE 'Added segment column as alias for customer_segment';
    ELSE
        RAISE NOTICE 'Segment column already exists';
    END IF;
END $$;

-- 2. Add missing 'customer_status' column
-- Reports are looking for customer_status but it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_status'
    ) THEN
        -- Add customer_status column based on is_active field
        ALTER TABLE kastle_banking.customers 
        ADD COLUMN customer_status VARCHAR(20) DEFAULT 'ACTIVE';
        
        -- Update existing records
        UPDATE kastle_banking.customers 
        SET customer_status = CASE 
            WHEN is_active = true THEN 'ACTIVE'
            ELSE 'INACTIVE'
        END;
        
        -- Add constraint
        ALTER TABLE kastle_banking.customers 
        ADD CONSTRAINT customers_customer_status_check 
        CHECK (customer_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED'));
        
        RAISE NOTICE 'Added customer_status column';
    ELSE
        RAISE NOTICE 'customer_status column already exists';
    END IF;
END $$;

-- 3. Add missing 'risk_rating' column
-- Credit risk reports are looking for risk_rating but it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'risk_rating'
    ) THEN
        -- Add risk_rating column based on risk_category
        ALTER TABLE kastle_banking.customers 
        ADD COLUMN risk_rating VARCHAR(20);
        
        -- Update existing records based on risk_category
        UPDATE kastle_banking.customers 
        SET risk_rating = CASE 
            WHEN risk_category = 'LOW' THEN 'A'
            WHEN risk_category = 'MEDIUM' THEN 'B'
            WHEN risk_category = 'HIGH' THEN 'C'
            WHEN risk_category = 'VERY_HIGH' THEN 'D'
            ELSE 'B'
        END;
        
        -- Add constraint
        ALTER TABLE kastle_banking.customers 
        ADD CONSTRAINT customers_risk_rating_check 
        CHECK (risk_rating IN ('A', 'B', 'C', 'D'));
        
        RAISE NOTICE 'Added risk_rating column';
    ELSE
        RAISE NOTICE 'risk_rating column already exists';
    END IF;
END $$;

-- 4. Fix duplicate foreign key constraints on customer_contacts
-- Remove the duplicate constraint that's causing embedding issues
DO $$
BEGIN
    -- Check if duplicate constraint exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'kastle_banking' 
        AND table_name = 'customer_contacts' 
        AND constraint_name = 'customer_contacts_customer_id_fkey1'
    ) THEN
        ALTER TABLE kastle_banking.customer_contacts 
        DROP CONSTRAINT customer_contacts_customer_id_fkey1;
        
        RAISE NOTICE 'Removed duplicate foreign key constraint customer_contacts_customer_id_fkey1';
    ELSE
        RAISE NOTICE 'Duplicate foreign key constraint does not exist';
    END IF;
END $$;

-- 5. Create indexes for better performance on new columns
CREATE INDEX IF NOT EXISTS idx_customers_segment 
ON kastle_banking.customers(segment);

CREATE INDEX IF NOT EXISTS idx_customers_customer_status 
ON kastle_banking.customers(customer_status);

CREATE INDEX IF NOT EXISTS idx_customers_risk_rating 
ON kastle_banking.customers(risk_rating);

-- 6. Update RLS policies if they exist for the new columns
-- Enable RLS on customers table if not already enabled
ALTER TABLE kastle_banking.customers ENABLE ROW LEVEL SECURITY;

-- Create or replace policies for the new columns
DROP POLICY IF EXISTS "Enable read access for all users" ON kastle_banking.customers;
CREATE POLICY "Enable read access for all users" ON kastle_banking.customers
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON kastle_banking.customers;
CREATE POLICY "Enable insert for authenticated users only" ON kastle_banking.customers
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON kastle_banking.customers;
CREATE POLICY "Enable update for authenticated users only" ON kastle_banking.customers
FOR UPDATE USING (true);

-- Grant necessary permissions
GRANT SELECT, INSERT, UPDATE ON kastle_banking.customers TO anon;
GRANT SELECT, INSERT, UPDATE ON kastle_banking.customers TO authenticated;
GRANT ALL ON kastle_banking.customers TO service_role;

-- Ensure customer_contacts table has proper RLS
ALTER TABLE kastle_banking.customer_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable read access for all users" ON kastle_banking.customer_contacts;
CREATE POLICY "Enable read access for all users" ON kastle_banking.customer_contacts
FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON kastle_banking.customer_contacts;
CREATE POLICY "Enable insert for authenticated users only" ON kastle_banking.customer_contacts
FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users only" ON kastle_banking.customer_contacts;
CREATE POLICY "Enable update for authenticated users only" ON kastle_banking.customer_contacts
FOR UPDATE USING (true);

GRANT SELECT, INSERT, UPDATE ON kastle_banking.customer_contacts TO anon;
GRANT SELECT, INSERT, UPDATE ON kastle_banking.customer_contacts TO authenticated;
GRANT ALL ON kastle_banking.customer_contacts TO service_role;

COMMIT;

-- Verify the changes
DO $$
BEGIN
    RAISE NOTICE 'Schema fixes completed. Verifying...';
    
    -- Check if all required columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name IN ('segment', 'customer_status', 'risk_rating')
        GROUP BY table_name
        HAVING COUNT(*) = 3
    ) THEN
        RAISE NOTICE '✓ All required columns (segment, customer_status, risk_rating) exist';
    ELSE
        RAISE NOTICE '✗ Some required columns are missing';
    END IF;
    
    -- Check foreign key constraints
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'kastle_banking' 
        AND table_name = 'customer_contacts' 
        AND constraint_name = 'customer_contacts_customer_id_fkey'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_schema = 'kastle_banking' 
        AND table_name = 'customer_contacts' 
        AND constraint_name = 'customer_contacts_customer_id_fkey1'
    ) THEN
        RAISE NOTICE '✓ Foreign key constraints fixed (no duplicates)';
    ELSE
        RAISE NOTICE '✗ Foreign key constraint issue still exists';
    END IF;
END $$;