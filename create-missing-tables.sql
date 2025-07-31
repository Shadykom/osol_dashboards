-- Fix for missing loan_types table and schema issues
-- Run this script in your database to create the missing structures

-- First, ensure the schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Create loan_types table if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.loan_types (
    loan_type_id SERIAL PRIMARY KEY,
    type_name VARCHAR(100) NOT NULL,
    type_code VARCHAR(20) UNIQUE NOT NULL,
    max_amount DECIMAL(15,2),
    min_amount DECIMAL(15,2) DEFAULT 0,
    interest_rate DECIMAL(5,2),
    max_tenure_months INTEGER,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample loan types
INSERT INTO kastle_banking.loan_types (type_name, type_code, max_amount, min_amount, interest_rate, max_tenure_months) 
VALUES 
    ('Personal Loan', 'PERSONAL', 500000.00, 10000.00, 12.5, 60),
    ('Home Loan', 'HOME', 10000000.00, 100000.00, 8.5, 240),
    ('Auto Loan', 'AUTO', 2000000.00, 50000.00, 10.5, 84),
    ('Business Loan', 'BUSINESS', 5000000.00, 50000.00, 11.0, 120),
    ('Education Loan', 'EDUCATION', 1000000.00, 20000.00, 9.0, 120)
ON CONFLICT (type_code) DO NOTHING;

-- Add loan_type_id column to loan_accounts if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'loan_type_id'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts 
        ADD COLUMN loan_type_id INTEGER REFERENCES kastle_banking.loan_types(loan_type_id);
        
        -- Set default loan type for existing records
        UPDATE kastle_banking.loan_accounts 
        SET loan_type_id = (SELECT loan_type_id FROM kastle_banking.loan_types WHERE type_code = 'PERSONAL' LIMIT 1)
        WHERE loan_type_id IS NULL;
    END IF;
END $$;

-- Create a view for easier access without schema qualification
CREATE OR REPLACE VIEW public.loan_accounts AS 
SELECT * FROM kastle_banking.loan_accounts;

CREATE OR REPLACE VIEW public.loan_types AS 
SELECT * FROM kastle_banking.loan_types;

CREATE OR REPLACE VIEW public.accounts AS 
SELECT * FROM kastle_banking.accounts;

CREATE OR REPLACE VIEW public.deposit_accounts AS 
SELECT * FROM kastle_banking.deposit_accounts;

CREATE OR REPLACE VIEW public.customers AS 
SELECT * FROM kastle_banking.customers;

CREATE OR REPLACE VIEW public.products AS 
SELECT * FROM kastle_banking.products;

-- Grant permissions (adjust based on your user)
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO PUBLIC;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO PUBLIC;

-- Verify the setup
SELECT 
    'loan_accounts' as table_name,
    COUNT(*) as row_count
FROM kastle_banking.loan_accounts
UNION ALL
SELECT 
    'loan_types' as table_name,
    COUNT(*) as row_count
FROM kastle_banking.loan_types
UNION ALL
SELECT 
    'accounts' as table_name,
    COUNT(*) as row_count
FROM kastle_banking.accounts
UNION ALL
SELECT 
    'deposit_accounts' as table_name,
    COUNT(*) as row_count
FROM kastle_banking.deposit_accounts;