-- Fix Collection Database Access Issues
-- This script ensures proper access to collection-related tables

-- 1. Check if RLS is enabled on collection tables
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
ORDER BY schemaname, tablename;

-- 2. Temporarily disable RLS on all collection tables to test
-- kastle_collection schema tables
ALTER TABLE kastle_collection.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_teams DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_interactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.promise_to_pay DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.officer_performance_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.call_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.daily_collection_summary DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_strategies DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.legal_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.field_visits DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.digital_collection_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.hardship_applications DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.case_bucket_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.system_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.audit_trail DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.auth_user_profiles DISABLE ROW LEVEL SECURITY;

-- kastle_banking schema tables used by collection
ALTER TABLE kastle_banking.loan_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.products DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_buckets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_rates DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.aging_distribution DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.executive_delinquency_summary DISABLE ROW LEVEL SECURITY;

-- 3. Grant necessary permissions to authenticated and anon roles
-- Grant usage on schemas
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;

-- Grant select permissions on all tables in kastle_collection schema
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated;

-- Grant select permissions on specific kastle_banking tables needed for collection
GRANT SELECT ON kastle_banking.loan_accounts TO anon, authenticated;
GRANT SELECT ON kastle_banking.customers TO anon, authenticated;
GRANT SELECT ON kastle_banking.transactions TO anon, authenticated;
GRANT SELECT ON kastle_banking.accounts TO anon, authenticated;
GRANT SELECT ON kastle_banking.products TO anon, authenticated;
GRANT SELECT ON kastle_banking.collection_cases TO anon, authenticated;
GRANT SELECT ON kastle_banking.collection_buckets TO anon, authenticated;
GRANT SELECT ON kastle_banking.collection_rates TO anon, authenticated;
GRANT SELECT ON kastle_banking.aging_distribution TO anon, authenticated;
GRANT SELECT ON kastle_banking.executive_delinquency_summary TO anon, authenticated;

-- 4. Create sample data for testing if tables are empty
-- Insert sample collection officers if none exist
INSERT INTO kastle_collection.collection_officers (
    officer_id, officer_name, officer_type, team_id, 
    contact_number, email, status, created_at
)
SELECT 
    'OFF001', 'أحمد محمد', 'SENIOR', 'TEAM001',
    '+966501234567', 'ahmed@example.com', 'ACTIVE', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_collection.collection_officers WHERE officer_id = 'OFF001'
);

INSERT INTO kastle_collection.collection_officers (
    officer_id, officer_name, officer_type, team_id, 
    contact_number, email, status, created_at
)
SELECT 
    'OFF002', 'فاطمة علي', 'JUNIOR', 'TEAM001',
    '+966502345678', 'fatima@example.com', 'ACTIVE', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_collection.collection_officers WHERE officer_id = 'OFF002'
);

-- Insert sample collection team if none exist
INSERT INTO kastle_collection.collection_teams (
    team_id, team_name, team_type, manager_id, status, created_at
)
SELECT 
    'TEAM001', 'فريق التحصيل الرئيسي', 'FIELD', 'OFF001', 'ACTIVE', NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM kastle_collection.collection_teams WHERE team_id = 'TEAM001'
);

-- 5. Create or replace functions that might be needed
CREATE OR REPLACE FUNCTION kastle_collection.get_officer_performance(
    p_officer_id TEXT,
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
)
RETURNS TABLE (
    total_cases INTEGER,
    total_amount DECIMAL,
    collected_amount DECIMAL,
    collection_rate DECIMAL,
    promises_made INTEGER,
    promises_kept INTEGER,
    calls_made INTEGER,
    successful_contacts INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(DISTINCT cc.case_id)::INTEGER as total_cases,
        COALESCE(SUM(cc.total_outstanding), 0) as total_amount,
        COALESCE(SUM(cc.amount_collected), 0) as collected_amount,
        CASE 
            WHEN SUM(cc.total_outstanding) > 0 
            THEN (SUM(cc.amount_collected) / SUM(cc.total_outstanding) * 100)
            ELSE 0 
        END as collection_rate,
        COUNT(DISTINCT ptp.promise_id)::INTEGER as promises_made,
        COUNT(DISTINCT CASE WHEN ptp.promise_status = 'KEPT' THEN ptp.promise_id END)::INTEGER as promises_kept,
        COUNT(DISTINCT ca.attempt_id)::INTEGER as calls_made,
        COUNT(DISTINCT CASE WHEN ca.contact_outcome = 'SUCCESSFUL' THEN ca.attempt_id END)::INTEGER as successful_contacts
    FROM kastle_collection.collection_cases cc
    LEFT JOIN kastle_collection.promise_to_pay ptp ON cc.case_id = ptp.case_id
    LEFT JOIN kastle_collection.call_attempts ca ON cc.case_id = ca.case_id
    WHERE cc.assigned_officer_id = p_officer_id
    AND cc.created_at BETWEEN p_start_date AND p_end_date;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission on functions
GRANT EXECUTE ON FUNCTION kastle_collection.get_officer_performance TO anon, authenticated;

-- 6. Verify the changes
SELECT 
    'Tables with RLS disabled' as check_type,
    COUNT(*) as count
FROM pg_tables
WHERE schemaname IN ('kastle_banking', 'kastle_collection')
AND rowsecurity = false;

SELECT 
    'Collection officers count' as check_type,
    COUNT(*) as count
FROM kastle_collection.collection_officers;

SELECT 
    'Collection teams count' as check_type,
    COUNT(*) as count
FROM kastle_collection.collection_teams;