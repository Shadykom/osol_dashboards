-- Fix for collection_cases_detailed view not found error
-- This script creates the missing view in the kastle_banking schema

-- Drop existing view if it exists
DROP VIEW IF EXISTS kastle_banking.collection_cases_detailed CASCADE;

-- Create the collection_cases_detailed view
CREATE VIEW kastle_banking.collection_cases_detailed AS
SELECT 
    cc.id,
    cc.case_number,
    cc.customer_id,
    cc.account_id,
    cc.total_outstanding,
    cc.principal_outstanding,
    cc.interest_outstanding,
    cc.penalty_outstanding,
    cc.days_past_due,
    cc.delinquency_bucket,
    cc.priority,
    cc.status,
    cc.assigned_to,
    cc.last_contact_date,
    cc.next_action_date,
    cc.created_at,
    cc.updated_at,
    -- Customer details
    c.customer_name,
    c.phone_number AS customer_phone,
    c.email AS customer_email,
    c.address AS customer_address,
    -- Account details
    a.account_number,
    a.product_type,
    a.branch_id,
    -- Assignment details
    co.officer_name AS assigned_officer_name,
    co.phone_number AS officer_phone,
    co.email AS officer_email,
    -- Computed fields
    CASE 
        WHEN cc.days_past_due = 0 THEN 'Current'
        WHEN cc.days_past_due BETWEEN 1 AND 30 THEN '1-30 Days'
        WHEN cc.days_past_due BETWEEN 31 AND 60 THEN '31-60 Days'
        WHEN cc.days_past_due BETWEEN 61 AND 90 THEN '61-90 Days'
        ELSE '90+ Days'
    END AS dpd_bucket,
    -- Communication counts
    COALESCE(comm_counts.call_count, 0) AS calls_this_month,
    COALESCE(comm_counts.message_count, 0) AS messages_this_month,
    -- PTP status
    CASE WHEN ptp.id IS NOT NULL THEN true ELSE false END AS has_promise_to_pay,
    ptp.ptp_date AS latest_ptp_date,
    ptp.ptp_amount AS latest_ptp_amount
FROM 
    kastle_banking.collection_cases cc
    LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
    LEFT JOIN kastle_banking.accounts a ON cc.account_id = a.account_id
    LEFT JOIN kastle_banking.collection_officers co ON cc.assigned_to = co.officer_id
    -- Communication counts for current month
    LEFT JOIN LATERAL (
        SELECT 
            COUNT(CASE WHEN interaction_type = 'CALL' THEN 1 END) AS call_count,
            COUNT(CASE WHEN interaction_type IN ('SMS', 'EMAIL') THEN 1 END) AS message_count
        FROM kastle_banking.collection_interactions ci
        WHERE ci.case_id = cc.id
        AND ci.interaction_date >= date_trunc('month', CURRENT_DATE)
    ) comm_counts ON true
    -- Latest PTP
    LEFT JOIN LATERAL (
        SELECT id, ptp_date, ptp_amount
        FROM kastle_banking.collection_ptp cp
        WHERE cp.case_id = cc.id
        AND cp.status = 'PENDING'
        ORDER BY cp.ptp_date DESC
        LIMIT 1
    ) ptp ON true;

-- Grant permissions
GRANT SELECT ON kastle_banking.collection_cases_detailed TO authenticated;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO anon;
GRANT SELECT ON kastle_banking.collection_cases_detailed TO service_role;

-- Add comment
COMMENT ON VIEW kastle_banking.collection_cases_detailed IS 'Detailed view of collection cases with customer, account, and interaction information';

-- Verify the view was created
SELECT 
    'View created successfully' as status,
    table_schema,
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'kastle_banking'
AND table_name = 'collection_cases_detailed';