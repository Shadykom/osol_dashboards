-- Database Schema Fix Script
-- This script fixes column naming mismatches and adds missing columns

-- 1. Fix loan_accounts table - add loan_amount as alias for principal_amount
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS loan_amount NUMERIC(18,2) 
GENERATED ALWAYS AS (principal_amount) STORED;

-- 2. Ensure all required columns exist in collection_cases
ALTER TABLE kastle_banking.collection_cases
ADD COLUMN IF NOT EXISTS total_amount NUMERIC(18,2) 
GENERATED ALWAYS AS (total_outstanding) STORED;

-- 3. Create views to consolidate duplicate tables
-- Drop existing views if they exist
DROP VIEW IF EXISTS kastle_banking.v_collection_officers CASCADE;
DROP VIEW IF EXISTS kastle_banking.v_collection_interactions CASCADE;
DROP VIEW IF EXISTS kastle_banking.v_promise_to_pay CASCADE;
DROP VIEW IF EXISTS kastle_banking.v_officer_performance_summary CASCADE;

-- Create unified views for collection_officers
CREATE OR REPLACE VIEW kastle_banking.v_collection_officers AS
SELECT DISTINCT ON (officer_id)
    officer_id,
    employee_id,
    officer_name,
    team_id,
    officer_type,
    contact_number,
    email,
    language_skills,
    collection_limit,
    commission_rate,
    status,
    joining_date,
    last_active,
    created_at
FROM (
    SELECT * FROM kastle_collection.collection_officers
    UNION ALL
    SELECT 
        officer_id,
        NULL as employee_id,
        officer_name,
        NULL as team_id,
        officer_type,
        contact_number,
        email,
        NULL as language_skills,
        NULL as collection_limit,
        NULL as commission_rate,
        status,
        joining_date,
        last_active,
        created_at
    FROM public.collection_officers
) combined
ORDER BY officer_id, created_at DESC;

-- Create unified views for collection_interactions
CREATE OR REPLACE VIEW kastle_banking.v_collection_interactions AS
SELECT DISTINCT ON (interaction_id)
    interaction_id,
    case_id,
    customer_id,
    interaction_type,
    interaction_direction,
    officer_id,
    contact_number,
    interaction_status,
    duration_seconds,
    outcome,
    promise_to_pay,
    ptp_amount,
    ptp_date,
    notes,
    recording_reference,
    interaction_datetime,
    created_at
FROM (
    SELECT * FROM kastle_collection.collection_interactions
    UNION ALL
    SELECT * FROM public.collection_interactions
) combined
ORDER BY interaction_id, created_at DESC;

-- Create unified views for promise_to_pay
CREATE OR REPLACE VIEW kastle_banking.v_promise_to_pay AS
SELECT DISTINCT ON (ptp_id)
    ptp_id,
    case_id,
    customer_id,
    interaction_id,
    ptp_amount,
    ptp_date,
    ptp_type,
    installment_count,
    officer_id,
    status,
    amount_received,
    kept_date,
    broken_reason,
    created_at,
    updated_at
FROM (
    SELECT * FROM kastle_collection.promise_to_pay
    UNION ALL
    SELECT * FROM public.promise_to_pay
) combined
ORDER BY ptp_id, created_at DESC;

-- Create unified views for officer_performance_summary
CREATE OR REPLACE VIEW kastle_banking.v_officer_performance_summary AS
SELECT DISTINCT ON (summary_id)
    summary_id,
    officer_id,
    summary_date,
    total_cases,
    total_portfolio_value,
    total_collected,
    collection_rate,
    total_calls,
    total_messages,
    successful_contacts,
    contact_rate,
    total_ptps,
    ptps_kept,
    ptp_keep_rate,
    avg_response_time,
    created_at,
    updated_at
FROM (
    SELECT * FROM kastle_collection.officer_performance_summary
    UNION ALL
    SELECT * FROM public.officer_performance_summary
) combined
ORDER BY summary_id, created_at DESC;

-- 4. Grant permissions on views
GRANT SELECT ON kastle_banking.v_collection_officers TO anon, authenticated;
GRANT SELECT ON kastle_banking.v_collection_interactions TO anon, authenticated;
GRANT SELECT ON kastle_banking.v_promise_to_pay TO anon, authenticated;
GRANT SELECT ON kastle_banking.v_officer_performance_summary TO anon, authenticated;

-- 5. Create missing indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_customer_id ON kastle_banking.collection_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_cases_loan_account_number ON kastle_banking.collection_cases(loan_account_number);
CREATE INDEX IF NOT EXISTS idx_loan_accounts_customer_id ON kastle_banking.loan_accounts(customer_id);

-- 6. Add missing foreign key relationships
ALTER TABLE kastle_banking.collection_cases
DROP CONSTRAINT IF EXISTS collection_cases_customer_id_fkey;

ALTER TABLE kastle_banking.collection_cases
ADD CONSTRAINT collection_cases_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id);

ALTER TABLE kastle_banking.collection_cases
DROP CONSTRAINT IF EXISTS collection_cases_bucket_id_fkey;

ALTER TABLE kastle_banking.collection_cases
ADD CONSTRAINT collection_cases_bucket_id_fkey 
FOREIGN KEY (bucket_id) REFERENCES kastle_banking.collection_buckets(bucket_id);

-- 7. Ensure RLS is enabled for security
ALTER TABLE kastle_banking.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_buckets ENABLE ROW LEVEL SECURITY;

-- 8. Create RLS policies for anon access
CREATE POLICY "Enable read access for all users" ON kastle_banking.customers
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON kastle_banking.collection_cases
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON kastle_banking.loan_accounts
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON kastle_banking.collection_buckets
    FOR SELECT USING (true);

-- 9. Add missing columns in customer_contacts if needed
ALTER TABLE kastle_banking.customer_contacts
ADD COLUMN IF NOT EXISTS contact_type VARCHAR(30),
ADD COLUMN IF NOT EXISTS contact_value VARCHAR(100);

-- 10. Refresh schema cache
NOTIFY pgrst, 'reload schema';