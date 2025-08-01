-- Fix for loan_accounts and loan_types relationship
-- This script ensures proper foreign key relationships exist

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

-- Insert default loan types if the table is empty
INSERT INTO kastle_banking.loan_types (type_name, type_code, max_amount, min_amount, interest_rate, max_tenure_months) 
SELECT 'Personal Loan', 'PERSONAL', 500000.00, 10000.00, 12.5, 60
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.loan_types WHERE type_code = 'PERSONAL');

INSERT INTO kastle_banking.loan_types (type_name, type_code, max_amount, min_amount, interest_rate, max_tenure_months) 
SELECT 'Home Loan', 'HOME', 10000000.00, 100000.00, 8.5, 240
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.loan_types WHERE type_code = 'HOME');

INSERT INTO kastle_banking.loan_types (type_name, type_code, max_amount, min_amount, interest_rate, max_tenure_months) 
SELECT 'Auto Loan', 'AUTO', 2000000.00, 50000.00, 10.5, 84
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.loan_types WHERE type_code = 'AUTO');

INSERT INTO kastle_banking.loan_types (type_name, type_code, max_amount, min_amount, interest_rate, max_tenure_months) 
SELECT 'Business Loan', 'BUSINESS', 5000000.00, 50000.00, 11.0, 120
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.loan_types WHERE type_code = 'BUSINESS');

INSERT INTO kastle_banking.loan_types (type_name, type_code, max_amount, min_amount, interest_rate, max_tenure_months) 
SELECT 'Education Loan', 'EDUCATION', 1000000.00, 20000.00, 9.0, 120
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.loan_types WHERE type_code = 'EDUCATION');

-- Grant permissions on loan_types table
GRANT SELECT ON kastle_banking.loan_types TO authenticated;
GRANT SELECT ON kastle_banking.loan_types TO anon;

-- Now check if loan_type_id column exists in loan_accounts
DO $$ 
BEGIN
    -- Add loan_type_id column if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'loan_type_id'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts 
        ADD COLUMN loan_type_id INTEGER;
        
        RAISE NOTICE 'Added loan_type_id column to loan_accounts table';
    END IF;
END $$;

-- Check if the foreign key constraint already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints tc
        JOIN information_schema.key_column_usage kcu 
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        WHERE tc.table_schema = 'kastle_banking'
        AND tc.table_name = 'loan_accounts'
        AND tc.constraint_type = 'FOREIGN KEY'
        AND kcu.column_name = 'loan_type_id'
    ) THEN
        -- Add foreign key constraint
        ALTER TABLE kastle_banking.loan_accounts 
        ADD CONSTRAINT fk_loan_accounts_loan_type 
        FOREIGN KEY (loan_type_id) 
        REFERENCES kastle_banking.loan_types(loan_type_id);
        
        RAISE NOTICE 'Added foreign key constraint from loan_accounts to loan_types';
    END IF;
END $$;

-- Update any NULL loan_type_id values with a default
UPDATE kastle_banking.loan_accounts 
SET loan_type_id = (
    SELECT loan_type_id 
    FROM kastle_banking.loan_types 
    WHERE type_code = 'PERSONAL' 
    LIMIT 1
)
WHERE loan_type_id IS NULL
AND EXISTS (
    SELECT 1 
    FROM kastle_banking.loan_types 
    WHERE type_code = 'PERSONAL'
);

-- Create a view to make querying easier
CREATE OR REPLACE VIEW kastle_banking.loan_accounts_with_types AS
SELECT 
    la.*,
    lt.type_name,
    lt.type_code,
    lt.max_amount as loan_type_max_amount,
    lt.interest_rate as loan_type_interest_rate,
    lt.description as loan_type_description
FROM kastle_banking.loan_accounts la
LEFT JOIN kastle_banking.loan_types lt ON la.loan_type_id = lt.loan_type_id;

-- Grant permissions on the view
GRANT SELECT ON kastle_banking.loan_accounts_with_types TO authenticated;
GRANT SELECT ON kastle_banking.loan_accounts_with_types TO anon;

-- Output summary
SELECT 
    'Loan types in database' as description,
    COUNT(*) as count
FROM kastle_banking.loan_types
UNION ALL
SELECT 
    'Loan accounts with loan_type_id set' as description,
    COUNT(*) as count
FROM kastle_banking.loan_accounts
WHERE loan_type_id IS NOT NULL
UNION ALL
SELECT 
    'Loan accounts without loan_type_id' as description,
    COUNT(*) as count
FROM kastle_banking.loan_accounts
WHERE loan_type_id IS NULL;