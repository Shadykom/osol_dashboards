-- Temporarily disable RLS on banking tables to allow dashboard access
-- WARNING: This is for testing only. Re-enable RLS with proper policies in production!

-- Disable RLS on all banking tables
ALTER TABLE kastle_banking.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customer_types DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role
GRANT USAGE ON SCHEMA kastle_banking TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon;

-- Verify the changes
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'kastle_banking'
ORDER BY tablename;