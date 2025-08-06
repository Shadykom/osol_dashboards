-- Fix RLS Policies for kastle_banking collection tables
-- This script fixes the column references and data type issues

-- First, disable existing RLS policies if they exist
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.remediation_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.user_roles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Executives can view all cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Specialists can view assigned cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Branch managers can view branch cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Product managers can view product cases" ON kastle_banking.collection_cases;

-- Re-enable RLS
ALTER TABLE kastle_banking.collection_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.remediation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.user_roles ENABLE ROW LEVEL SECURITY;

-- Create corrected RLS policies
-- Note: Using proper column names and handling auth.uid() correctly

-- Policy for user_roles table - users can see their own role
CREATE POLICY "Users can view own role" ON kastle_banking.user_roles
    FOR SELECT TO authenticated
    USING (user_id = auth.uid()::text);

-- Policy for admins to manage user roles
CREATE POLICY "Admins can manage all roles" ON kastle_banking.user_roles
    FOR ALL TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kastle_banking.user_roles 
            WHERE user_id = auth.uid()::text AND role IN ('ADMIN', 'EXECUTIVE')
        )
    );

-- Executives can see all cases
CREATE POLICY "Executives can view all cases" ON kastle_banking.collection_cases
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kastle_banking.user_roles 
            WHERE user_id = auth.uid()::text AND role = 'EXECUTIVE'
        )
    );

-- Specialists can only see their assigned cases
CREATE POLICY "Specialists can view assigned cases" ON kastle_banking.collection_cases
    FOR SELECT TO authenticated
    USING (
        assigned_to = auth.uid()::text OR
        EXISTS (
            SELECT 1 FROM kastle_banking.user_roles 
            WHERE user_id = auth.uid()::text AND role IN ('EXECUTIVE', 'ADMIN')
        )
    );

-- Branch managers can see cases in their branch
CREATE POLICY "Branch managers can view branch cases" ON kastle_banking.collection_cases
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kastle_banking.user_roles ur
            WHERE ur.user_id = auth.uid()::text 
            AND (
                (ur.role = 'BRANCH_MANAGER' AND ur.branch_id = collection_cases.branch_id)
                OR ur.role IN ('EXECUTIVE', 'ADMIN')
            )
        )
    );

-- Product managers can see cases for their products
CREATE POLICY "Product managers can view product cases" ON kastle_banking.collection_cases
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kastle_banking.user_roles ur
            WHERE ur.user_id = auth.uid()::text 
            AND (
                (ur.role = 'PRODUCT_MANAGER' AND collection_cases.product_type = ANY(ur.product_types))
                OR ur.role IN ('EXECUTIVE', 'ADMIN')
            )
        )
    );

-- Policies for remediation_actions
CREATE POLICY "View remediation actions for viewable cases" ON kastle_banking.remediation_actions
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kastle_banking.collection_cases cc
            WHERE cc.case_id = remediation_actions.case_id
            -- This will inherit the case visibility rules
        )
    );

-- Allow specialists to create remediation actions for their cases
CREATE POLICY "Specialists can create remediation actions" ON kastle_banking.remediation_actions
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM kastle_banking.collection_cases cc
            WHERE cc.case_id = remediation_actions.case_id
            AND cc.assigned_to = auth.uid()::text
        )
    );

-- Grant necessary permissions
GRANT USAGE ON SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- Create a function to get current user role
CREATE OR REPLACE FUNCTION kastle_banking.get_user_role()
RETURNS TEXT AS $$
BEGIN
    RETURN (
        SELECT role 
        FROM kastle_banking.user_roles 
        WHERE user_id = auth.uid()::text
        LIMIT 1
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a function to check if user has role
CREATE OR REPLACE FUNCTION kastle_banking.user_has_role(check_role TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM kastle_banking.user_roles 
        WHERE user_id = auth.uid()::text 
        AND role = check_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some default roles for testing (optional)
-- You can uncomment and modify these as needed
/*
INSERT INTO kastle_banking.user_roles (user_id, email, full_name, role, branch_id, is_active)
VALUES 
    ('YOUR_USER_ID_HERE', 'executive@example.com', 'Executive User', 'EXECUTIVE', NULL, true),
    ('YOUR_USER_ID_HERE', 'specialist@example.com', 'Collection Specialist', 'SPECIALIST', 'BR001', true),
    ('YOUR_USER_ID_HERE', 'branch_manager@example.com', 'Branch Manager', 'BRANCH_MANAGER', 'BR001', true)
ON CONFLICT (user_id) DO NOTHING;
*/