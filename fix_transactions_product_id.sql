-- Fix for "column transactions.product_id does not exist" error
-- This script adds the missing product_id column to the transactions table

-- First, check if the column already exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'transactions' 
        AND column_name = 'product_id'
    ) THEN
        -- Add the product_id column
        ALTER TABLE kastle_banking.transactions 
        ADD COLUMN product_id INTEGER;
        
        RAISE NOTICE 'Added product_id column to transactions table';
    ELSE
        RAISE NOTICE 'product_id column already exists in transactions table';
    END IF;
END $$;

-- Add foreign key constraint if products table exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'products'
    ) AND NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_transactions_product'
    ) THEN
        ALTER TABLE kastle_banking.transactions 
        ADD CONSTRAINT fk_transactions_product 
        FOREIGN KEY (product_id) 
        REFERENCES kastle_banking.products(product_id);
        
        RAISE NOTICE 'Added foreign key constraint to products table';
    END IF;
END $$;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_transactions_product_id 
ON kastle_banking.transactions(product_id);

-- Also add product_id to other related tables if they don't have it
-- Add to accounts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'accounts' 
        AND column_name = 'product_id'
    ) THEN
        ALTER TABLE kastle_banking.accounts 
        ADD COLUMN product_id INTEGER;
        
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'products'
        ) THEN
            ALTER TABLE kastle_banking.accounts 
            ADD CONSTRAINT fk_accounts_product 
            FOREIGN KEY (product_id) 
            REFERENCES kastle_banking.products(product_id);
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_accounts_product_id 
        ON kastle_banking.accounts(product_id);
        
        RAISE NOTICE 'Added product_id column to accounts table';
    END IF;
END $$;

-- Add to loan_accounts table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'product_id'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts 
        ADD COLUMN product_id INTEGER;
        
        IF EXISTS (
            SELECT 1 
            FROM information_schema.tables 
            WHERE table_schema = 'kastle_banking' 
            AND table_name = 'products'
        ) THEN
            ALTER TABLE kastle_banking.loan_accounts 
            ADD CONSTRAINT fk_loan_accounts_product 
            FOREIGN KEY (product_id) 
            REFERENCES kastle_banking.products(product_id);
        END IF;
        
        CREATE INDEX IF NOT EXISTS idx_loan_accounts_product_id 
        ON kastle_banking.loan_accounts(product_id);
        
        RAISE NOTICE 'Added product_id column to loan_accounts table';
    END IF;
END $$;

-- Verify the changes
SELECT 
    t.table_schema,
    t.table_name,
    CASE 
        WHEN c.column_name IS NOT NULL THEN '✓ Has product_id'
        ELSE '✗ Missing product_id'
    END AS status
FROM 
    information_schema.tables t
LEFT JOIN 
    information_schema.columns c 
    ON t.table_schema = c.table_schema 
    AND t.table_name = c.table_name 
    AND c.column_name = 'product_id'
WHERE 
    t.table_schema = 'kastle_banking'
    AND t.table_name IN ('transactions', 'accounts', 'loan_accounts')
ORDER BY 
    t.table_name;