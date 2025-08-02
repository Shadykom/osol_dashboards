-- Fix Collection Database Errors
-- This script addresses all the errors shown in the console logs

BEGIN;

-- 1. Add branch_id column to collection_teams table
-- This fixes: "column collection_teams.branch_id does not exist"
ALTER TABLE kastle_banking.collection_teams 
ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_collection_teams_branch 
ON kastle_banking.collection_teams(branch_id);

-- 2. Update collection_teams with branch_id from collection_officers
-- Assuming officers in the same team belong to the same branch
UPDATE kastle_banking.collection_teams ct
SET branch_id = (
    SELECT DISTINCT co.branch_id 
    FROM kastle_banking.collection_officers co
    WHERE co.team_id = ct.team_id
    AND co.branch_id IS NOT NULL
    LIMIT 1
)
WHERE ct.branch_id IS NULL;

-- 3. Enable Realtime for required tables
-- This fixes: "Unable to subscribe to changes... Please check Realtime is enabled"

-- First, check if realtime extension is enabled
CREATE EXTENSION IF NOT EXISTS "realtime" SCHEMA extensions;

-- Enable realtime for collection_cases table
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.collection_cases;

-- Enable realtime for branch_collection_performance table
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.branch_collection_performance;

-- 4. Create missing foreign key relationships
-- This helps with the query parsing errors

-- Ensure foreign keys exist for collection_cases
ALTER TABLE kastle_collection.collection_cases
DROP CONSTRAINT IF EXISTS fk_collection_cases_loan_account;

ALTER TABLE kastle_collection.collection_cases
ADD CONSTRAINT fk_collection_cases_loan_account
FOREIGN KEY (loan_account_number) 
REFERENCES kastle_banking.loan_accounts(loan_account_number);

ALTER TABLE kastle_collection.collection_cases
DROP CONSTRAINT IF EXISTS fk_collection_cases_customer;

ALTER TABLE kastle_collection.collection_cases
ADD CONSTRAINT fk_collection_cases_customer
FOREIGN KEY (customer_id) 
REFERENCES kastle_banking.customers(customer_id);

ALTER TABLE kastle_collection.collection_cases
DROP CONSTRAINT IF EXISTS fk_collection_cases_officer;

ALTER TABLE kastle_collection.collection_cases
ADD CONSTRAINT fk_collection_cases_officer
FOREIGN KEY (assigned_to) 
REFERENCES kastle_collection.collection_officers(officer_id);

-- 5. Create views to simplify complex queries
-- This helps avoid the parsing errors with nested foreign key joins

CREATE OR REPLACE VIEW kastle_collection.collection_cases_detailed AS
SELECT 
    cc.*,
    -- Loan account details
    la.loan_amount,
    la.outstanding_balance,
    la.overdue_amount,
    la.overdue_days,
    la.product_id,
    -- Product details
    p.product_name,
    p.product_type,
    -- Customer details
    c.full_name as customer_name,
    c.customer_type,
    -- Officer details
    co.officer_name,
    co.officer_type,
    co.team_id,
    co.contact_number as officer_contact,
    -- Bucket details
    cb.bucket_name,
    cb.min_days as bucket_min_days,
    cb.max_days as bucket_max_days
FROM kastle_collection.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la ON cc.loan_account_number = la.loan_account_number
LEFT JOIN kastle_banking.products p ON la.product_id = p.product_id
LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
LEFT JOIN kastle_collection.collection_officers co ON cc.assigned_to = co.officer_id
LEFT JOIN kastle_collection.collection_buckets cb ON cc.bucket_id = cb.bucket_id;

-- Grant permissions on the view
GRANT SELECT ON kastle_collection.collection_cases_detailed TO authenticated;
GRANT SELECT ON kastle_collection.collection_cases_detailed TO anon;
GRANT SELECT ON kastle_collection.collection_cases_detailed TO service_role;

-- 6. Create a simpler view for customer contacts
CREATE OR REPLACE VIEW kastle_collection.customer_contacts_by_case AS
SELECT 
    cc.case_id,
    cc.customer_id,
    cont.contact_type,
    cont.contact_value,
    cont.is_primary
FROM kastle_collection.collection_cases cc
JOIN kastle_banking.customer_contacts cont ON cc.customer_id = cont.customer_id;

-- Grant permissions
GRANT SELECT ON kastle_collection.customer_contacts_by_case TO authenticated;
GRANT SELECT ON kastle_collection.customer_contacts_by_case TO anon;
GRANT SELECT ON kastle_collection.customer_contacts_by_case TO service_role;

-- 7. Create comprehensive case details view for getCaseDetails method
CREATE OR REPLACE VIEW kastle_collection.collection_case_full_details AS
SELECT 
    cc.*,
    -- Loan account full details
    la.loan_account_number as la_loan_account_number,
    la.customer_id as la_customer_id,
    la.product_id as la_product_id,
    la.loan_amount as la_loan_amount,
    la.disbursement_date as la_disbursement_date,
    la.maturity_date as la_maturity_date,
    la.interest_rate as la_interest_rate,
    la.outstanding_balance as la_outstanding_balance,
    la.overdue_amount as la_overdue_amount,
    la.overdue_days as la_overdue_days,
    la.status as la_status,
    -- Product details
    p.product_name as product_name,
    p.product_type as product_type,
    p.product_code as product_code,
    -- Customer full details
    c.customer_id as c_customer_id,
    c.full_name as customer_name,
    c.customer_type as customer_type,
    c.national_id as customer_national_id,
    c.date_of_birth as customer_dob,
    c.gender as customer_gender,
    c.marital_status as customer_marital_status,
    c.employment_status as customer_employment_status,
    c.monthly_income as customer_monthly_income,
    -- Officer details
    co.officer_id as officer_id,
    co.officer_name as officer_name,
    co.officer_type as officer_type,
    co.team_id as officer_team_id,
    co.contact_number as officer_contact,
    co.email as officer_email,
    -- Strategy details
    cs.strategy_name as strategy_name,
    cs.strategy_type as strategy_type,
    cs.description as strategy_description,
    -- Bucket details
    cb.bucket_name as bucket_name,
    cb.min_days as bucket_min_days,
    cb.max_days as bucket_max_days,
    cb.bucket_color as bucket_color
FROM kastle_collection.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la ON cc.loan_account_number = la.loan_account_number
LEFT JOIN kastle_banking.products p ON la.product_id = p.product_id
LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
LEFT JOIN kastle_collection.collection_officers co ON cc.assigned_to = co.officer_id
LEFT JOIN kastle_collection.collection_strategies cs ON cc.strategy_id = cs.strategy_id
LEFT JOIN kastle_collection.collection_buckets cb ON cc.bucket_id = cb.bucket_id;

-- Grant permissions
GRANT SELECT ON kastle_collection.collection_case_full_details TO authenticated;
GRANT SELECT ON kastle_collection.collection_case_full_details TO anon;
GRANT SELECT ON kastle_collection.collection_case_full_details TO service_role;

-- 8. Create view for customer addresses
CREATE OR REPLACE VIEW kastle_collection.customer_addresses_by_case AS
SELECT 
    cc.case_id,
    cc.customer_id,
    ca.address_id,
    ca.address_type,
    ca.address_line1,
    ca.address_line2,
    ca.city,
    ca.state,
    ca.postal_code,
    ca.country,
    ca.is_primary
FROM kastle_collection.collection_cases cc
JOIN kastle_banking.customer_addresses ca ON cc.customer_id = ca.customer_id;

-- Grant permissions
GRANT SELECT ON kastle_collection.customer_addresses_by_case TO authenticated;
GRANT SELECT ON kastle_collection.customer_addresses_by_case TO anon;
GRANT SELECT ON kastle_collection.customer_addresses_by_case TO service_role;

-- 9. Create view for loan schedules
CREATE OR REPLACE VIEW kastle_collection.loan_schedules_by_case AS
SELECT 
    cc.case_id,
    cc.loan_account_number,
    ls.schedule_id,
    ls.installment_number,
    ls.due_date,
    ls.principal_amount,
    ls.interest_amount,
    ls.total_amount,
    ls.paid_date,
    ls.paid_amount,
    ls.status
FROM kastle_collection.collection_cases cc
JOIN kastle_banking.loan_schedules ls ON cc.loan_account_number = ls.loan_account_number;

-- Grant permissions
GRANT SELECT ON kastle_collection.loan_schedules_by_case TO authenticated;
GRANT SELECT ON kastle_collection.loan_schedules_by_case TO anon;
GRANT SELECT ON kastle_collection.loan_schedules_by_case TO service_role;

-- 7. Verify and display results
SELECT 
    'Collection Teams - branch_id column' as check_item,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_teams' 
        AND column_name = 'branch_id'
    ) as status;

-- Check realtime status
SELECT 
    'Realtime enabled for collection_cases' as check_item,
    EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'kastle_banking' 
        AND tablename = 'collection_cases'
    ) as status;

SELECT 
    'Realtime enabled for branch_collection_performance' as check_item,
    EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'kastle_banking' 
        AND tablename = 'branch_collection_performance'
    ) as status;

-- Check view creation
SELECT 
    'collection_cases_detailed view' as check_item,
    EXISTS (
        SELECT 1 
        FROM information_schema.views 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_cases_detailed'
    ) as status;

COMMIT;

-- Display summary
SELECT 
    'Database fixes applied successfully!' as message,
    NOW() as completed_at;