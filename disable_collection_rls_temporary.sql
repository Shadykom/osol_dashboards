-- Temporarily disable RLS for testing
-- Run this if you want to test without Row Level Security

-- Disable RLS on collection tables
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.remediation_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.portfolio_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.product_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.recommended_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.promise_to_pay DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_interactions DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies to avoid conflicts
DROP POLICY IF EXISTS "Executives can view all cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Specialists can view assigned cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Branch managers can view branch cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Product managers can view product cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Users can view own role" ON kastle_banking.user_roles;
DROP POLICY IF EXISTS "Admins can manage all roles" ON kastle_banking.user_roles;
DROP POLICY IF EXISTS "View remediation actions for viewable cases" ON kastle_banking.remediation_actions;
DROP POLICY IF EXISTS "Specialists can create remediation actions" ON kastle_banking.remediation_actions;

-- Grant full access to authenticated users (for testing only)
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;
GRANT USAGE ON SCHEMA kastle_banking TO authenticated;

-- Create a simple test user in user_roles if needed
INSERT INTO kastle_banking.user_roles (user_id, email, full_name, role, is_active)
VALUES 
    ('test-user-id', 'test@example.com', 'Test User', 'EXECUTIVE', true)
ON CONFLICT (user_id) DO UPDATE SET role = 'EXECUTIVE';

COMMENT ON TABLE kastle_banking.collection_cases IS 'RLS DISABLED FOR TESTING - Enable in production';
COMMENT ON TABLE kastle_banking.user_roles IS 'RLS DISABLED FOR TESTING - Enable in production';