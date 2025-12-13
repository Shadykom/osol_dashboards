-- =====================================================
-- Fix Database Columns
-- Version: 1.1.0
-- Description: Adds computed/alias columns to match application expectations
-- =====================================================

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- =====================================================
-- 1. Create customers table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.customers (
    customer_id VARCHAR(20) PRIMARY KEY,
    full_name VARCHAR(200) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    customer_type VARCHAR(20) DEFAULT 'INDIVIDUAL',
    customer_status VARCHAR(20) DEFAULT 'ACTIVE',
    national_id VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(10),
    marital_status VARCHAR(20),
    nationality VARCHAR(50),
    email VARCHAR(100),
    phone VARCHAR(20),
    mobile VARCHAR(20),
    address TEXT,
    city VARCHAR(50),
    region VARCHAR(50),
    postal_code VARCHAR(20),
    country VARCHAR(50) DEFAULT 'Saudi Arabia',
    employment_status VARCHAR(50),
    employer_name VARCHAR(200),
    monthly_income NUMERIC(18,2),
    risk_rating VARCHAR(20),
    kyc_status VARCHAR(20) DEFAULT 'PENDING',
    branch_id VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Ensure customer_status column exists
-- =====================================================
DO $$ 
BEGIN
    -- Add customer_status if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_status'
    ) THEN
        ALTER TABLE kastle_banking.customers ADD COLUMN customer_status VARCHAR(20) DEFAULT 'ACTIVE';
        RAISE NOTICE 'Added customer_status column';
    ELSE
        RAISE NOTICE 'customer_status column already exists';
    END IF;
END $$;

-- =====================================================
-- 3. Copy data from status to customer_status if status exists
-- =====================================================
DO $$ 
BEGIN
    -- Only try to copy if BOTH columns exist
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'status'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_status'
    ) THEN
        -- Copy values from status to customer_status where customer_status is null
        EXECUTE 'UPDATE kastle_banking.customers SET customer_status = status WHERE customer_status IS NULL AND status IS NOT NULL';
        RAISE NOTICE 'Copied values from status to customer_status';
    ELSE
        RAISE NOTICE 'Skipping status copy - status column does not exist';
    END IF;
END $$;

-- =====================================================
-- 4. Create sync trigger only if both columns exist
-- =====================================================
DO $$
DECLARE
    v_has_status BOOLEAN;
    v_has_customer_status BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' AND table_name = 'customers' AND column_name = 'status'
    ) INTO v_has_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' AND table_name = 'customers' AND column_name = 'customer_status'
    ) INTO v_has_customer_status;
    
    -- Only create sync trigger if BOTH columns exist
    IF v_has_status AND v_has_customer_status THEN
        -- Create or replace the sync function
        EXECUTE $func$
            CREATE OR REPLACE FUNCTION kastle_banking.sync_customer_status()
            RETURNS TRIGGER AS $tr$
            BEGIN
                -- If status is updated, update customer_status
                IF TG_OP = 'UPDATE' AND NEW.status IS DISTINCT FROM OLD.status THEN
                    NEW.customer_status := NEW.status;
                END IF;
                -- If customer_status is updated, update status
                IF TG_OP = 'UPDATE' AND NEW.customer_status IS DISTINCT FROM OLD.customer_status THEN
                    NEW.status := NEW.customer_status;
                END IF;
                -- For inserts, sync both
                IF TG_OP = 'INSERT' THEN
                    IF NEW.customer_status IS NULL AND NEW.status IS NOT NULL THEN
                        NEW.customer_status := NEW.status;
                    ELSIF NEW.status IS NULL AND NEW.customer_status IS NOT NULL THEN
                        NEW.status := NEW.customer_status;
                    END IF;
                END IF;
                RETURN NEW;
            END;
            $tr$ LANGUAGE plpgsql
        $func$;
        
        -- Drop existing trigger if any
        DROP TRIGGER IF EXISTS sync_customer_status_trigger ON kastle_banking.customers;
        
        -- Create trigger
        CREATE TRIGGER sync_customer_status_trigger
            BEFORE INSERT OR UPDATE ON kastle_banking.customers
            FOR EACH ROW
            EXECUTE FUNCTION kastle_banking.sync_customer_status();
            
        RAISE NOTICE 'Created sync trigger for status <-> customer_status';
    ELSE
        RAISE NOTICE 'Skipping sync trigger - only one status column exists (status: %, customer_status: %)', v_has_status, v_has_customer_status;
        
        -- Drop trigger if it exists (since we don't need it)
        DROP TRIGGER IF EXISTS sync_customer_status_trigger ON kastle_banking.customers;
    END IF;
END $$;

-- =====================================================
-- 5. Create indexes safely
-- =====================================================
DO $$
BEGIN
    -- Index on customer_status
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' AND table_name = 'customers' AND column_name = 'customer_status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_customers_customer_status ON kastle_banking.customers(customer_status);
    END IF;
    
    -- Index on status (only if it exists)
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' AND table_name = 'customers' AND column_name = 'status'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_customers_status ON kastle_banking.customers(status);
    END IF;
    
    -- Index on customer_id
    CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON kastle_banking.customers(customer_id);
END $$;

-- =====================================================
-- 6. Grant permissions
-- =====================================================
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON kastle_banking.customers TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.customers TO anon, authenticated;

-- =====================================================
-- 7. Verify
-- =====================================================
DO $$
DECLARE
    v_has_status BOOLEAN;
    v_has_customer_status BOOLEAN;
    v_count INTEGER;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' AND table_name = 'customers' AND column_name = 'status'
    ) INTO v_has_status;
    
    SELECT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' AND table_name = 'customers' AND column_name = 'customer_status'
    ) INTO v_has_customer_status;
    
    SELECT COUNT(*) INTO v_count FROM kastle_banking.customers;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'fix-database-columns.sql completed!';
    RAISE NOTICE '  has status column: %', v_has_status;
    RAISE NOTICE '  has customer_status column: %', v_has_customer_status;
    RAISE NOTICE '  total customers: %', v_count;
    RAISE NOTICE '========================================';
END $$;
