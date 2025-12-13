-- =====================================================
-- Essential Database Alterations
-- Version: 1.0.0
-- Description: Safe alterations that check for table existence
-- This script is idempotent - safe to run multiple times
-- =====================================================

-- Ensure kastle_banking schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- =====================================================
-- 1. Create loan_accounts table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.loan_accounts (
    loan_account_id SERIAL PRIMARY KEY,
    loan_account_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(20),
    application_id INTEGER,
    product_id INTEGER,
    branch_id VARCHAR(10),
    loan_amount NUMERIC(18,2),
    disbursed_amount NUMERIC(18,2),
    outstanding_balance NUMERIC(18,2),
    interest_rate NUMERIC(5,2),
    loan_tenure INTEGER,
    loan_start_date DATE,
    maturity_date DATE,
    emi_amount NUMERIC(18,2),
    loan_status VARCHAR(20) DEFAULT 'ACTIVE',
    overdue_amount NUMERIC(18,2) DEFAULT 0,
    days_past_due INTEGER DEFAULT 0,
    last_payment_date DATE,
    next_payment_date DATE,
    collateral_value NUMERIC(18,2),
    collateral_type VARCHAR(50),
    guarantor_id VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 2. Create loan_applications table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.loan_applications (
    application_id SERIAL PRIMARY KEY,
    application_number VARCHAR(50) UNIQUE,
    customer_id VARCHAR(20),
    product_id INTEGER,
    branch_id VARCHAR(10),
    requested_amount NUMERIC(18,2),
    approved_amount NUMERIC(18,2),
    interest_rate NUMERIC(5,2),
    tenure_months INTEGER,
    application_date DATE DEFAULT CURRENT_DATE,
    status VARCHAR(20) DEFAULT 'PENDING',
    decision_date DATE,
    decided_by VARCHAR(100),
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 3. Create branches table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.branches (
    branch_id VARCHAR(10) PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(20),
    region VARCHAR(50),
    city VARCHAR(50),
    address TEXT,
    phone VARCHAR(20),
    email VARCHAR(100),
    manager_name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. Create accounts table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.accounts (
    account_id SERIAL PRIMARY KEY,
    account_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(20),
    account_type_id INTEGER,
    branch_id VARCHAR(10),
    currency_code VARCHAR(3) DEFAULT 'SAR',
    current_balance NUMERIC(18,2) DEFAULT 0,
    available_balance NUMERIC(18,2) DEFAULT 0,
    account_status VARCHAR(20) DEFAULT 'ACTIVE',
    opened_date DATE DEFAULT CURRENT_DATE,
    closed_date DATE,
    last_transaction_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 5. Create account_types table if it doesn't exist
-- =====================================================
CREATE TABLE IF NOT EXISTS kastle_banking.account_types (
    type_id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    min_balance NUMERIC(18,2) DEFAULT 0,
    interest_rate NUMERIC(5,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. Insert default branch if table is empty
-- =====================================================
INSERT INTO kastle_banking.branches (branch_id, branch_name, branch_code, region, city, is_active)
SELECT 'BR001', 'Main Branch', 'MAIN', 'Central', 'Riyadh', true
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.branches WHERE branch_id = 'BR001');

-- =====================================================
-- 7. Add branch_id column to loan_accounts if missing
-- =====================================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts ADD COLUMN branch_id VARCHAR(10);
    END IF;
END $$;

-- =====================================================
-- 8. Update branch_id from loan_applications (safe)
-- =====================================================
DO $$
BEGIN
    -- Only run if both tables have the required columns
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'branch_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'application_id'
    ) AND EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_applications' 
        AND column_name = 'branch_id'
    ) THEN
        UPDATE kastle_banking.loan_accounts la
        SET branch_id = lap.branch_id
        FROM kastle_banking.loan_applications lap
        WHERE la.application_id = lap.application_id
        AND la.branch_id IS NULL
        AND lap.branch_id IS NOT NULL;
    END IF;
END $$;

-- =====================================================
-- 9. Set default branch_id for NULL values
-- =====================================================
UPDATE kastle_banking.loan_accounts
SET branch_id = 'BR001'
WHERE branch_id IS NULL;

-- =====================================================
-- 10. Add foreign key constraints (safe - ignore if exists)
-- =====================================================
DO $$
BEGIN
    -- loan_accounts -> branches FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'loan_accounts_branch_id_fkey'
        AND table_schema = 'kastle_banking'
    ) THEN
        BEGIN
            ALTER TABLE kastle_banking.loan_accounts
            ADD CONSTRAINT loan_accounts_branch_id_fkey
            FOREIGN KEY (branch_id) REFERENCES kastle_banking.branches(branch_id);
            RAISE NOTICE 'Foreign key constraint loan_accounts_branch_id_fkey added';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add loan_accounts_branch_id_fkey: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Foreign key constraint loan_accounts_branch_id_fkey already exists';
    END IF;
    
    -- accounts -> account_types FK
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'accounts_account_type_id_fkey'
        AND table_schema = 'kastle_banking'
    ) THEN
        BEGIN
            ALTER TABLE kastle_banking.accounts
            ADD CONSTRAINT accounts_account_type_id_fkey
            FOREIGN KEY (account_type_id) REFERENCES kastle_banking.account_types(type_id);
            RAISE NOTICE 'Foreign key constraint accounts_account_type_id_fkey added';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Could not add accounts_account_type_id_fkey: %', SQLERRM;
        END;
    ELSE
        RAISE NOTICE 'Foreign key constraint accounts_account_type_id_fkey already exists';
    END IF;
END $$;

-- =====================================================
-- 11. Create indexes for better performance
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_loan_accounts_branch_id 
ON kastle_banking.loan_accounts(branch_id);

CREATE INDEX IF NOT EXISTS idx_loan_accounts_loan_status 
ON kastle_banking.loan_accounts(loan_status);

CREATE INDEX IF NOT EXISTS idx_loan_accounts_customer_id 
ON kastle_banking.loan_accounts(customer_id);

CREATE INDEX IF NOT EXISTS idx_accounts_account_type_id 
ON kastle_banking.accounts(account_type_id);

CREATE INDEX IF NOT EXISTS idx_accounts_account_status
ON kastle_banking.accounts(account_status);

CREATE INDEX IF NOT EXISTS idx_accounts_customer_id
ON kastle_banking.accounts(customer_id);

-- =====================================================
-- 12. Grant permissions
-- =====================================================
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO postgres, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO postgres, service_role;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;

-- =====================================================
-- 13. Verify the changes
-- =====================================================
DO $$
DECLARE
    v_loan_accounts INTEGER;
    v_branches INTEGER;
    v_accounts INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_loan_accounts FROM kastle_banking.loan_accounts;
    SELECT COUNT(*) INTO v_branches FROM kastle_banking.branches;
    SELECT COUNT(*) INTO v_accounts FROM kastle_banking.accounts;
    
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Essential database alterations completed!';
    RAISE NOTICE '  loan_accounts rows: %', v_loan_accounts;
    RAISE NOTICE '  branches rows: %', v_branches;
    RAISE NOTICE '  accounts rows: %', v_accounts;
    RAISE NOTICE '========================================';
END $$;
