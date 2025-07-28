-- Fix Authentication and RLS Policies for Dashboard Access
-- This script ensures authenticated users can access dashboard data

-- Enable RLS on all tables
ALTER TABLE kastle_banking.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branches ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.accounts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.transactions;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.loan_accounts;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.customers;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.products;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON kastle_banking.branches;

-- Create policies that allow authenticated users to read data
CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.accounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.transactions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.loan_accounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.customers
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.products
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Enable read access for authenticated users" ON kastle_banking.branches
    FOR SELECT USING (auth.role() = 'authenticated');

-- Also create policies for anon users (for initial dashboard load)
CREATE POLICY "Enable read access for anon users" ON kastle_banking.accounts
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Enable read access for anon users" ON kastle_banking.transactions
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Enable read access for anon users" ON kastle_banking.loan_accounts
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Enable read access for anon users" ON kastle_banking.customers
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Enable read access for anon users" ON kastle_banking.products
    FOR SELECT USING (auth.role() = 'anon');

CREATE POLICY "Enable read access for anon users" ON kastle_banking.branches
    FOR SELECT USING (auth.role() = 'anon');

-- Create a demo user if it doesn't exist
-- Note: This should be run through Supabase Auth, not directly in SQL
-- The application will handle user creation through the auth.signUp method

-- Grant necessary permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;

-- Ensure the schema search path includes kastle_banking
ALTER DATABASE postgres SET search_path TO public, kastle_banking, kastle_collection;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_accounts_status ON kastle_banking.accounts(account_status);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON kastle_banking.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_loan_accounts_status ON kastle_banking.loan_accounts(loan_status);
CREATE INDEX IF NOT EXISTS idx_customers_status ON kastle_banking.customers(customer_status);

-- Verify the policies are working
-- You can test with: SELECT * FROM kastle_banking.accounts LIMIT 1;