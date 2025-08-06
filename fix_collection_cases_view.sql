-- Fix for missing collection_cases_detailed view
-- This view is used by the collection service to display collection cases

-- Create the view in kastle_banking schema (which is what supabaseCollection uses)
CREATE OR REPLACE VIEW kastle_banking.collection_cases_detailed AS
SELECT 
    cc.id,
    cc.case_number,
    cc.loan_account_id,
    la.account_number as loan_account_number,
    cc.customer_id,
    c.full_name as customer_name,
    c.customer_number,
    cc.total_outstanding,
    cc.principal_outstanding,
    cc.interest_outstanding,
    cc.fees_outstanding,
    cc.days_past_due,
    cc.bucket_id,
    cb.name as bucket_name,
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
    cc.legal_status,
    cc.settlement_status,
    cc.created_at,
    cc.updated_at,
    -- Additional useful fields
    CASE 
        WHEN cc.days_past_due <= 30 THEN 'LOW'
        WHEN cc.days_past_due <= 60 THEN 'MEDIUM'
        WHEN cc.days_past_due <= 90 THEN 'HIGH'
        ELSE 'CRITICAL'
    END as risk_level,
    COALESCE(cc.total_outstanding, 0) as amount_at_risk
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la ON cc.loan_account_id = la.id
LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.id
LEFT JOIN kastle_banking.collection_buckets cb ON cc.bucket_id = cb.id
LEFT JOIN kastle_banking.auth_user_profiles u ON cc.assigned_to = u.id;

-- Grant permissions
GRANT SELECT ON kastle_banking.collection_cases_detailed TO authenticated;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO anon;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO service_role;

-- Add comment
COMMENT ON VIEW kastle_banking.collection_cases_detailed IS 'Detailed view of collection cases with customer and loan information';

-- Verify the view was created
SELECT 
    'collection_cases_detailed view created' as status,
    count(*) as row_count
FROM kastle_banking.collection_cases_detailed;