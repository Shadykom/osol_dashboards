-- Fix for missing collection_cases_detailed view (CORRECTED)
-- This view is used by the collection service to display collection cases

-- Drop existing view if it exists
DROP VIEW IF EXISTS kastle_banking.collection_cases_detailed CASCADE;

-- Create the view in kastle_banking schema (which is what supabaseCollection uses)
CREATE OR REPLACE VIEW kastle_banking.collection_cases_detailed AS
SELECT 
    cc.case_id as id,  -- Alias for compatibility
    cc.case_number,
    cc.loan_account_number,
    cc.account_number,
    cc.account_type,
    cc.customer_id,
    c.full_name as customer_name,
    c.customer_number,
    cc.total_outstanding,
    cc.principal_outstanding,
    cc.interest_outstanding,
    cc.penalty_outstanding,
    cc.days_past_due,
    cc.bucket_id,
    cb.bucket_name,
    cb.min_dpd,
    cb.max_dpd,
    cc.assigned_to,
    u.full_name as assigned_to_name,
    cc.case_status,
    cc.priority,
    cc.last_payment_date,
    cc.last_payment_amount,
    cc.last_contact_date,
    cc.next_action_date,
    cc.created_at,
    cc.updated_at,
    -- Additional fields that might be needed
    cc.branch_id,
    b.branch_name,
    -- Calculated fields
    CASE 
        WHEN cc.priority IS NOT NULL THEN cc.priority
        WHEN cc.days_past_due >= 90 THEN 'CRITICAL'
        WHEN cc.days_past_due >= 60 THEN 'HIGH'
        WHEN cc.days_past_due >= 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END as calculated_priority,
    COALESCE(cc.total_outstanding, 0) as amount_at_risk,
    -- Legal status (if exists in the table)
    CASE 
        WHEN cc.case_status = 'LEGAL' THEN 'LEGAL_PROCEEDINGS'
        ELSE 'NORMAL'
    END as legal_status,
    -- Settlement status (derived from case status)
    CASE 
        WHEN cc.case_status = 'CLOSED' THEN 'SETTLED'
        WHEN cc.case_status = 'SUSPENDED' THEN 'SUSPENDED'
        ELSE 'ACTIVE'
    END as settlement_status
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
LEFT JOIN kastle_banking.collection_buckets cb ON cc.bucket_id = cb.bucket_id
LEFT JOIN kastle_banking.auth_user_profiles u ON cc.assigned_to = u.user_id
LEFT JOIN kastle_banking.branches b ON cc.branch_id = b.branch_id;

-- Grant permissions
GRANT SELECT ON kastle_banking.collection_cases_detailed TO authenticated;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO anon;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO service_role;

-- Add comment
COMMENT ON VIEW kastle_banking.collection_cases_detailed IS 'Detailed view of collection cases with customer and loan information';

-- Verify the view was created successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.views 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_cases_detailed'
    ) THEN
        RAISE NOTICE 'View kastle_banking.collection_cases_detailed created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create view kastle_banking.collection_cases_detailed';
    END IF;
END $$;