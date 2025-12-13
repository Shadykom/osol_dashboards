-- =====================================================
-- Fix Database Columns (Simple Version)
-- Version: 1.0.0
-- Description: Safely renames/adds columns to match application expectations
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
    -- If 'status' exists but 'customer_status' doesn't, rename it
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
        ALTER TABLE kastle_banking.customers RENAME COLUMN status TO customer_status;
        RAISE NOTICE 'Renamed status to customer_status';
    END IF;
    
    -- If neither exists, add customer_status
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'customer_status'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customers' 
        AND column_name = 'status'
    ) THEN
        ALTER TABLE kastle_banking.customers ADD COLUMN customer_status VARCHAR(20) DEFAULT 'ACTIVE';
        RAISE NOTICE 'Added customer_status column';
    END IF;
END $$;

-- =====================================================
-- 3. Update constraints safely
-- =====================================================
DO $$
BEGIN
    -- Drop old constraint if exists
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_status_check'
        AND table_schema = 'kastle_banking'
    ) THEN
        ALTER TABLE kastle_banking.customers DROP CONSTRAINT customers_status_check;
    END IF;
    
    -- Drop new constraint if exists (to recreate)
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'customers_customer_status_check'
        AND table_schema = 'kastle_banking'
    ) THEN
        ALTER TABLE kastle_banking.customers DROP CONSTRAINT customers_customer_status_check;
    END IF;
    
    -- Add constraint
    ALTER TABLE kastle_banking.customers 
    ADD CONSTRAINT customers_customer_status_check 
    CHECK (customer_status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'CLOSED', 'PENDING'));
    
    RAISE NOTICE 'Updated constraints for customer_status';
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'Constraint update skipped: %', SQLERRM;
END $$;

-- =====================================================
-- 4. Create/update indexes
-- =====================================================
DROP INDEX IF EXISTS kastle_banking.idx_customers_status;
CREATE INDEX IF NOT EXISTS idx_customers_customer_status ON kastle_banking.customers(customer_status);
CREATE INDEX IF NOT EXISTS idx_customers_customer_type ON kastle_banking.customers(customer_type);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON kastle_banking.customers(branch_id);

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
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM kastle_banking.customers;
    RAISE NOTICE 'fix-database-columns-simple.sql completed. Customers: %', v_count;
END $$;
