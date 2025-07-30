-- Migration script to fix customer_types relationship
-- This script safely adds the missing foreign key constraint with data validation

BEGIN;

-- Step 1: Check if customer_types table is empty and populate with default data if needed
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.customer_types LIMIT 1) THEN
        INSERT INTO kastle_banking.customer_types (type_code, type_name, description) VALUES
        ('IND', 'Individual', 'Individual customer account'),
        ('CORP', 'Corporate', 'Corporate/Business customer account'),
        ('SME', 'SME', 'Small and Medium Enterprise account'),
        ('GOV', 'Government', 'Government entity account'),
        ('NGO', 'NGO', 'Non-Governmental Organization account');
        
        RAISE NOTICE 'Populated customer_types table with default values';
    END IF;
END $$;

-- Step 2: Check for and fix any orphaned customer_type_id values
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count orphaned records
    SELECT COUNT(DISTINCT c.customer_type_id) INTO orphaned_count
    FROM kastle_banking.customers c
    LEFT JOIN kastle_banking.customer_types ct ON c.customer_type_id = ct.type_id
    WHERE c.customer_type_id IS NOT NULL AND ct.type_id IS NULL;
    
    IF orphaned_count > 0 THEN
        -- Option 1: Set orphaned customer_type_id to NULL
        UPDATE kastle_banking.customers c
        SET customer_type_id = NULL
        WHERE c.customer_type_id IS NOT NULL 
        AND NOT EXISTS (
            SELECT 1 FROM kastle_banking.customer_types ct 
            WHERE ct.type_id = c.customer_type_id
        );
        
        RAISE NOTICE 'Updated % customers with invalid customer_type_id to NULL', orphaned_count;
    END IF;
END $$;

-- Step 3: Add the foreign key constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_customer_type_id_fkey'
        AND table_schema = 'kastle_banking'
        AND table_name = 'customers'
    ) THEN
        ALTER TABLE kastle_banking.customers
        ADD CONSTRAINT customers_customer_type_id_fkey 
        FOREIGN KEY (customer_type_id) 
        REFERENCES kastle_banking.customer_types(type_id)
        ON DELETE SET NULL;  -- If a customer type is deleted, set customer's type to NULL
        
        RAISE NOTICE 'Added foreign key constraint customers_customer_type_id_fkey';
    ELSE
        RAISE NOTICE 'Foreign key constraint customers_customer_type_id_fkey already exists';
    END IF;
END $$;

-- Step 4: Create index for better performance if it doesn't exist
CREATE INDEX IF NOT EXISTS idx_customers_customer_type_id 
ON kastle_banking.customers(customer_type_id);

-- Step 5: Verify the migration
DO $$
DECLARE
    constraint_exists BOOLEAN;
    customer_count INTEGER;
    typed_customer_count INTEGER;
BEGIN
    -- Check constraint exists
    SELECT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_customer_type_id_fkey'
        AND table_schema = 'kastle_banking'
        AND table_name = 'customers'
    ) INTO constraint_exists;
    
    -- Count customers
    SELECT COUNT(*) INTO customer_count FROM kastle_banking.customers;
    SELECT COUNT(*) INTO typed_customer_count 
    FROM kastle_banking.customers 
    WHERE customer_type_id IS NOT NULL;
    
    RAISE NOTICE 'Migration completed:';
    RAISE NOTICE '  - Foreign key constraint exists: %', constraint_exists;
    RAISE NOTICE '  - Total customers: %', customer_count;
    RAISE NOTICE '  - Customers with type assigned: %', typed_customer_count;
END $$;

COMMIT;

-- Post-migration verification queries
-- Run these manually to verify the migration:

-- 1. Check customer distribution by type
SELECT 
    ct.type_code,
    ct.type_name,
    COUNT(c.customer_id) as customer_count,
    ROUND(COUNT(c.customer_id) * 100.0 / NULLIF((SELECT COUNT(*) FROM kastle_banking.customers), 0), 2) as percentage
FROM kastle_banking.customer_types ct
LEFT JOIN kastle_banking.customers c ON ct.type_id = c.customer_type_id
GROUP BY ct.type_id, ct.type_code, ct.type_name
ORDER BY customer_count DESC;

-- 2. Check customers without type
SELECT COUNT(*) as customers_without_type 
FROM kastle_banking.customers 
WHERE customer_type_id IS NULL;