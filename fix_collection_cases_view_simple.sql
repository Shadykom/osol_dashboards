-- Fix for missing collection_cases_detailed view (SIMPLIFIED VERSION)
-- This is a minimal version that should work with the existing schema

-- Drop existing view if it exists
DROP VIEW IF EXISTS kastle_banking.collection_cases_detailed CASCADE;

-- Create the view with only essential columns that we know exist
CREATE OR REPLACE VIEW kastle_banking.collection_cases_detailed AS
SELECT 
    cc.case_id as id,
    cc.case_number,
    cc.customer_id,
    cc.loan_account_number,
    cc.account_number,
    cc.account_type,
    cc.total_outstanding,
    cc.principal_outstanding,
    cc.interest_outstanding,
    cc.penalty_outstanding,
    cc.days_past_due,
    cc.bucket_id,
    cc.assigned_to,
    cc.case_status,
    cc.priority,
    cc.last_payment_date,
    cc.last_payment_amount,
    cc.last_contact_date,
    cc.next_action_date,
    cc.branch_id,
    cc.created_at,
    cc.updated_at,
    -- Add customer name if available
    c.full_name as customer_name,
    -- Add bucket name if available
    cb.bucket_name,
    cb.min_dpd,
    cb.max_dpd,
    -- Add branch name if available
    b.branch_name,
    -- Calculated fields
    CASE 
        WHEN cc.priority IS NOT NULL THEN cc.priority
        WHEN cc.days_past_due >= 90 THEN 'CRITICAL'
        WHEN cc.days_past_due >= 60 THEN 'HIGH'
        WHEN cc.days_past_due >= 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END as risk_level,
    COALESCE(cc.total_outstanding, 0) as amount_at_risk,
    -- Placeholder fields for compatibility
    cc.customer_id as customer_number,
    cc.assigned_to as assigned_to_name,
    CASE 
        WHEN cc.case_status = 'LEGAL' THEN 'LEGAL_PROCEEDINGS'
        ELSE 'NORMAL'
    END as legal_status,
    CASE 
        WHEN cc.case_status = 'CLOSED' THEN 'SETTLED'
        WHEN cc.case_status = 'SUSPENDED' THEN 'SUSPENDED'
        ELSE 'ACTIVE'
    END as settlement_status
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
LEFT JOIN kastle_banking.collection_buckets cb ON cc.bucket_id = cb.bucket_id
LEFT JOIN kastle_banking.branches b ON cc.branch_id = b.branch_id;

-- Grant permissions
GRANT SELECT ON kastle_banking.collection_cases_detailed TO authenticated;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO anon;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO service_role;

-- Add comment
COMMENT ON VIEW kastle_banking.collection_cases_detailed IS 'Detailed view of collection cases with customer and loan information';

-- Verify the view was created
SELECT 
    'collection_cases_detailed view created' as status,
    count(*) as column_count
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_cases_detailed';