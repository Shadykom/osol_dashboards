-- Fix Dashboard RLS Policies
-- This script enables proper access to dashboard data

-- Enable RLS on all banking tables
ALTER TABLE kastle_banking.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customer_types ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous read access (for dashboard widgets)
-- This allows the dashboard to fetch aggregate data without authentication

-- Branches - allow read access to all
CREATE POLICY "Allow anonymous read access to branches" ON kastle_banking.branches
    FOR SELECT TO anon
    USING (true);

-- Customer types - allow read access to all
CREATE POLICY "Allow anonymous read access to customer types" ON kastle_banking.customer_types
    FOR SELECT TO anon
    USING (true);

-- Customers - allow read access for dashboard metrics
CREATE POLICY "Allow anonymous read access to customers" ON kastle_banking.customers
    FOR SELECT TO anon
    USING (true);

-- Accounts - allow read access for dashboard metrics
CREATE POLICY "Allow anonymous read access to accounts" ON kastle_banking.accounts
    FOR SELECT TO anon
    USING (true);

-- Transactions - allow read access for dashboard metrics
CREATE POLICY "Allow anonymous read access to transactions" ON kastle_banking.transactions
    FOR SELECT TO anon
    USING (true);

-- Loan accounts - allow read access for dashboard metrics
CREATE POLICY "Allow anonymous read access to loan accounts" ON kastle_banking.loan_accounts
    FOR SELECT TO anon
    USING (true);

-- For authenticated users, allow full access
-- Since there's no user_id column, we'll allow authenticated users to see all data
-- In production, you would implement proper user-based filtering

-- Customers - authenticated users can see all customer data
CREATE POLICY "Users can view customer data" ON kastle_banking.customers
    FOR SELECT TO authenticated
    USING (true);

-- Accounts - authenticated users can see all accounts
CREATE POLICY "Users can view accounts" ON kastle_banking.accounts
    FOR SELECT TO authenticated
    USING (true);

-- Transactions - authenticated users can see all transactions
CREATE POLICY "Users can view transactions" ON kastle_banking.transactions
    FOR SELECT TO authenticated
    USING (true);

-- Loan accounts - authenticated users can see all loans
CREATE POLICY "Users can view loans" ON kastle_banking.loan_accounts
    FOR SELECT TO authenticated
    USING (true);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_accounts_customer_id ON kastle_banking.accounts(customer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_account_id ON kastle_banking.transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON kastle_banking.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_loan_accounts_customer_id ON kastle_banking.loan_accounts(customer_id);

-- Verify the policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE schemaname = 'kastle_banking'
ORDER BY tablename, policyname;