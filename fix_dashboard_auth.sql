-- Fix Dashboard Authentication and RLS Policies
-- This script sets up proper Row Level Security policies to allow authenticated users to access data

-- Enable RLS on all tables in kastle_banking schema
ALTER TABLE kastle_banking.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customer_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.currencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.countries ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.product_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.account_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.transaction_types ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.accounts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.loan_accounts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.transactions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.branches;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.customer_types;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.currencies;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.countries;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.product_categories;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.products;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.account_types;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.transaction_types;

-- Create policies to allow authenticated users to read data
CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.accounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.loan_accounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.branches
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.customer_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.currencies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.countries
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.product_categories
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.account_types
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.transaction_types
    FOR SELECT USING (auth.role() = 'authenticated');

-- Also create policies for anon users (for initial access)
CREATE POLICY "Enable read access for anon users" ON kastle_banking.accounts
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.customers
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.loan_accounts
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.transactions
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.branches
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.customer_types
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.currencies
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.countries
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.product_categories
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.products
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.account_types
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for anon users" ON kastle_banking.transaction_types
    FOR SELECT USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT INSERT, UPDATE ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_status ON kastle_banking.accounts(account_status);
CREATE INDEX IF NOT EXISTS idx_loan_accounts_status ON kastle_banking.loan_accounts(loan_status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON kastle_banking.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_customers_status ON kastle_banking.customers(status);

-- Insert sample data if tables are empty
DO $$
BEGIN
    -- Check if branches table is empty
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.branches LIMIT 1) THEN
        INSERT INTO kastle_banking.branches (branch_code, branch_name, branch_type, status)
        VALUES 
            ('BR001', 'Main Branch', 'MAIN', 'ACTIVE'),
            ('BR002', 'Downtown Branch', 'BRANCH', 'ACTIVE'),
            ('BR003', 'West Side Branch', 'BRANCH', 'ACTIVE');
    END IF;

    -- Check if customer_types table is empty
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.customer_types LIMIT 1) THEN
        INSERT INTO kastle_banking.customer_types (type_code, type_name, description)
        VALUES 
            ('IND', 'Individual', 'Individual customers'),
            ('CORP', 'Corporate', 'Corporate customers'),
            ('SME', 'SME', 'Small and Medium Enterprises');
    END IF;

    -- Check if currencies table is empty
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.currencies LIMIT 1) THEN
        INSERT INTO kastle_banking.currencies (currency_code, currency_name, currency_symbol)
        VALUES 
            ('USD', 'US Dollar', '$'),
            ('EUR', 'Euro', '€'),
            ('GBP', 'British Pound', '£');
    END IF;

    -- Check if account_types table is empty
    IF NOT EXISTS (SELECT 1 FROM kastle_banking.account_types LIMIT 1) THEN
        INSERT INTO kastle_banking.account_types (type_code, type_name, description)
        VALUES 
            ('SAVINGS', 'Savings Account', 'Regular savings account'),
            ('CHECKING', 'Checking Account', 'Regular checking account'),
            ('FIXED_DEPOSIT', 'Fixed Deposit', 'Fixed deposit account');
    END IF;
END $$;