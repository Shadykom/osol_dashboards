-- =====================================================
-- Fix Database Schema
-- Version: 1.0.0
-- Description: Creates missing tables and adds missing columns
-- =====================================================

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- =====================================================
-- 1. Create branches table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.branches (
    branch_id VARCHAR(10) PRIMARY KEY,
    branch_code VARCHAR(20),
    branch_name VARCHAR(100) NOT NULL,
    region VARCHAR(50),
    city VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_name VARCHAR(100),
    manager_id VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Add branch_code column if missing
-- =====================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branches' 
        AND column_name = 'branch_code'
    ) THEN
        ALTER TABLE kastle_banking.branches ADD COLUMN branch_code VARCHAR(20);
        RAISE NOTICE 'Added branch_code column to branches';
    END IF;
    
    -- Update existing rows to have branch_code same as branch_id if null
    UPDATE kastle_banking.branches 
    SET branch_code = branch_id 
    WHERE branch_code IS NULL OR branch_code = '';
    
END $$;

-- =====================================================
-- 3. Create customer_types table
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.customer_types (
    type_id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default customer types
INSERT INTO kastle_banking.customer_types (type_code, type_name, description)
VALUES 
    ('IND', 'Individual', 'Individual retail customers'),
    ('CORP', 'Corporate', 'Corporate customers'),
    ('SME', 'SME', 'Small and Medium Enterprises'),
    ('RETAIL', 'Retail', 'Retail banking customers'),
    ('PREMIUM', 'Premium', 'Premium/VIP customers')
ON CONFLICT (type_code) DO UPDATE SET
    type_name = EXCLUDED.type_name,
    description = EXCLUDED.description;

-- =====================================================
-- 4. Create customer_contacts table
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.customer_contacts (
    contact_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(20) NOT NULL,
    contact_type VARCHAR(20) NOT NULL,
    contact_value VARCHAR(200) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add contact_id if table exists but column doesn't
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' AND table_name = 'customer_contacts'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customer_contacts' 
        AND column_name = 'contact_id'
    ) THEN
        ALTER TABLE kastle_banking.customer_contacts ADD COLUMN contact_id SERIAL;
        RAISE NOTICE 'Added contact_id to customer_contacts';
    END IF;
EXCEPTION
    WHEN others THEN
        RAISE NOTICE 'customer_contacts contact_id: %', SQLERRM;
END $$;

-- =====================================================
-- 5. Create customer_addresses table
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.customer_addresses (
    address_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(20) NOT NULL,
    address_type VARCHAR(20) DEFAULT 'HOME',
    address_line1 VARCHAR(200),
    address_line2 VARCHAR(200),
    city VARCHAR(100),
    state VARCHAR(100),
    region VARCHAR(100),
    postal_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'Saudi Arabia',
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. Create customers table if missing
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
-- 7. Create products table if missing
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.products (
    product_id SERIAL PRIMARY KEY,
    product_code VARCHAR(20) UNIQUE,
    product_name VARCHAR(100) NOT NULL,
    product_type VARCHAR(50),
    category VARCHAR(50),
    description TEXT,
    interest_rate NUMERIC(5,2),
    min_amount NUMERIC(18,2),
    max_amount NUMERIC(18,2),
    min_tenure INTEGER,
    max_tenure INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. Create collection_buckets table if missing
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.collection_buckets (
    bucket_id SERIAL PRIMARY KEY,
    bucket_name VARCHAR(50) NOT NULL,
    bucket_code VARCHAR(20) UNIQUE,
    min_days INTEGER NOT NULL DEFAULT 0,
    max_days INTEGER NOT NULL DEFAULT 30,
    description TEXT,
    priority INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default buckets
INSERT INTO kastle_banking.collection_buckets (bucket_name, bucket_code, min_days, max_days, priority)
VALUES 
    ('Current', 'CURRENT', 0, 0, 0),
    ('1-30 Days', 'BUCKET_1', 1, 30, 1),
    ('31-60 Days', 'BUCKET_2', 31, 60, 2),
    ('61-90 Days', 'BUCKET_3', 61, 90, 3),
    ('91-180 Days', 'BUCKET_4', 91, 180, 4),
    ('181-360 Days', 'BUCKET_5', 181, 360, 5),
    ('360+ Days', 'BUCKET_6', 361, 9999, 6)
ON CONFLICT (bucket_code) DO UPDATE SET
    bucket_name = EXCLUDED.bucket_name,
    min_days = EXCLUDED.min_days,
    max_days = EXCLUDED.max_days;

-- =====================================================
-- 9. Create indexes
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_customer_contacts_customer_id ON kastle_banking.customer_contacts(customer_id);
CREATE INDEX IF NOT EXISTS idx_customer_addresses_customer_id ON kastle_banking.customer_addresses(customer_id);
CREATE INDEX IF NOT EXISTS idx_customers_branch_id ON kastle_banking.customers(branch_id);
CREATE INDEX IF NOT EXISTS idx_branches_branch_code ON kastle_banking.branches(branch_code);

-- =====================================================
-- 10. Grant permissions
-- =====================================================
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;

-- =====================================================
-- 11. Insert default branch if empty
-- =====================================================
INSERT INTO kastle_banking.branches (branch_id, branch_code, branch_name, region, city, is_active)
SELECT 'BR001', 'BR001', 'Main Branch', 'Central', 'Riyadh', true
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.branches LIMIT 1);

-- =====================================================
-- 12. Verify
-- =====================================================
DO $$
DECLARE
    v_tables TEXT[];
    v_table TEXT;
BEGIN
    v_tables := ARRAY['branches', 'customers', 'customer_types', 'customer_contacts', 'customer_addresses', 'products', 'collection_buckets'];
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'fix-database-schema.sql completed!';
    RAISE NOTICE 'Tables verified:';
    
    FOREACH v_table IN ARRAY v_tables
    LOOP
        IF EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_schema = 'kastle_banking' AND table_name = v_table
        ) THEN
            RAISE NOTICE '  ✓ kastle_banking.%', v_table;
        ELSE
            RAISE NOTICE '  ✗ kastle_banking.% MISSING', v_table;
        END IF;
    END LOOP;
    RAISE NOTICE '========================================';
END $$;
