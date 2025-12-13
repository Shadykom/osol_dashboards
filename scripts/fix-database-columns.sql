-- =====================================================
-- Fix Database Columns
-- Version: 1.0.0
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
    status VARCHAR(20) DEFAULT 'ACTIVE',
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
-- 2. Handle customer_status column
-- =====================================================
DO $$ 
BEGIN
    -- Check if we have 'status' column but not 'customer_status'
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_status'
    ) THEN
        -- Add customer_status as a regular column (not generated - simpler)
        ALTER TABLE kastle_banking.customers ADD COLUMN customer_status VARCHAR(20);
        
        -- Copy values from status
        UPDATE kastle_banking.customers SET customer_status = status WHERE customer_status IS NULL;
        
        RAISE NOTICE 'Added customer_status column and copied values from status';
    ELSIF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_status'
    ) THEN
        -- No status or customer_status, add customer_status
        ALTER TABLE kastle_banking.customers ADD COLUMN customer_status VARCHAR(20) DEFAULT 'ACTIVE';
        RAISE NOTICE 'Added customer_status column with default ACTIVE';
    ELSE
        RAISE NOTICE 'customer_status column already exists';
    END IF;
END $$;

-- =====================================================
-- 3. Create trigger to keep status and customer_status in sync
-- =====================================================
CREATE OR REPLACE FUNCTION kastle_banking.sync_customer_status()
RETURNS TRIGGER AS $$
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
EXCEPTION
    WHEN undefined_column THEN
        RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger (drop first if exists)
DROP TRIGGER IF EXISTS sync_customer_status_trigger ON kastle_banking.customers;
CREATE TRIGGER sync_customer_status_trigger
    BEFORE INSERT OR UPDATE ON kastle_banking.customers
    FOR EACH ROW
    EXECUTE FUNCTION kastle_banking.sync_customer_status();

-- =====================================================
-- 4. Create indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customers_customer_status ON kastle_banking.customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_status ON kastle_banking.customers(status);
CREATE INDEX IF NOT EXISTS idx_customers_customer_id ON kastle_banking.customers(customer_id);

-- =====================================================
-- 5. Grant permissions
-- =====================================================
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON kastle_banking.customers TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.customers TO anon, authenticated;

-- =====================================================
-- 6. Verify
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
    
    RAISE NOTICE 'fix-database-columns.sql completed.';
    RAISE NOTICE '  has status column: %', v_has_status;
    RAISE NOTICE '  has customer_status column: %', v_has_customer_status;
END $$;
