-- Test Collection Dashboard Tables
-- This script checks if all required tables exist

SELECT 
    table_name,
    CASE 
        WHEN table_name IS NOT NULL THEN '✓ EXISTS'
        ELSE '✗ MISSING'
    END as status
FROM (
    VALUES 
        ('collection_cases'),
        ('remediation_actions'),
        ('portfolio_metrics'),
        ('product_performance'),
        ('collection_targets'),
        ('user_roles'),
        ('recommended_actions'),
        ('promise_to_pay'),
        ('collection_interactions'),
        ('branch_collection_performance'),
        ('audit_trail'),
        ('daily_collection_summary')
) AS required_tables(table_name)
LEFT JOIN information_schema.tables ist 
    ON ist.table_name = required_tables.table_name 
    AND ist.table_schema = 'kastle_banking'
ORDER BY required_tables.table_name;

-- Check for required columns in collection_cases
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_cases'
AND column_name IN (
    'product_type', 'collateral_value', 'collateral_type',
    'restructured', 'settlement_offered', 'legal_referral',
    'write_off', 'remediation_type', 'remediation_status'
)
ORDER BY column_name;

-- Check sample data
SELECT 'portfolio_metrics' as table_name, COUNT(*) as row_count 
FROM kastle_banking.portfolio_metrics
UNION ALL
SELECT 'collection_targets', COUNT(*) 
FROM kastle_banking.collection_targets
UNION ALL
SELECT 'user_roles', COUNT(*) 
FROM kastle_banking.user_roles;