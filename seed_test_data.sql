-- Seed test data for dashboard
-- This script populates the database with sample data

-- First, ensure schemas exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- Set search path
SET search_path TO kastle_banking, public;

-- Clear existing test data (optional - be careful in production!)
-- TRUNCATE TABLE kastle_banking.transactions CASCADE;
-- TRUNCATE TABLE kastle_banking.accounts CASCADE;
-- TRUNCATE TABLE kastle_banking.customers CASCADE;

-- Insert test customers
INSERT INTO kastle_banking.customers (
    customer_id,
    customer_number,
    first_name,
    last_name,
    customer_type,
    customer_status,
    email,
    phone_number,
    date_of_birth,
    created_at
) VALUES 
    ('c1', 'CUST001', 'أحمد', 'محمد', 'INDIVIDUAL', 'ACTIVE', 'ahmed@example.com', '+966501234567', '1985-05-15', NOW()),
    ('c2', 'CUST002', 'فاطمة', 'علي', 'INDIVIDUAL', 'ACTIVE', 'fatima@example.com', '+966502345678', '1990-08-22', NOW()),
    ('c3', 'CUST003', 'شركة التقنية', 'المحدودة', 'CORPORATE', 'ACTIVE', 'info@tech.com', '+966503456789', NULL, NOW()),
    ('c4', 'CUST004', 'خالد', 'سالم', 'INDIVIDUAL', 'ACTIVE', 'khalid@example.com', '+966504567890', '1978-12-10', NOW()),
    ('c5', 'CUST005', 'نورا', 'عبدالله', 'INDIVIDUAL', 'ACTIVE', 'nora@example.com', '+966505678901', '1995-03-28', NOW())
ON CONFLICT (customer_id) DO NOTHING;

-- Insert test accounts
INSERT INTO kastle_banking.accounts (
    account_id,
    account_number,
    customer_id,
    account_type,
    account_status,
    current_balance,
    available_balance,
    currency_code,
    opened_date,
    branch_id
) VALUES
    ('a1', 'ACC001', 'c1', 'SAVINGS', 'ACTIVE', 50000.00, 50000.00, 'SAR', NOW() - INTERVAL '2 years', 'BR001'),
    ('a2', 'ACC002', 'c1', 'CURRENT', 'ACTIVE', 125000.00, 120000.00, 'SAR', NOW() - INTERVAL '1 year', 'BR001'),
    ('a3', 'ACC003', 'c2', 'SAVINGS', 'ACTIVE', 75000.00, 75000.00, 'SAR', NOW() - INTERVAL '18 months', 'BR001'),
    ('a4', 'ACC004', 'c3', 'CURRENT', 'ACTIVE', 500000.00, 450000.00, 'SAR', NOW() - INTERVAL '3 years', 'BR002'),
    ('a5', 'ACC005', 'c4', 'SAVINGS', 'ACTIVE', 30000.00, 30000.00, 'SAR', NOW() - INTERVAL '6 months', 'BR002'),
    ('a6', 'ACC006', 'c5', 'CURRENT', 'ACTIVE', 15000.00, 15000.00, 'SAR', NOW() - INTERVAL '1 month', 'BR001')
ON CONFLICT (account_id) DO NOTHING;

-- Insert test transactions for the last 30 days
INSERT INTO kastle_banking.transactions (
    transaction_id,
    account_id,
    transaction_type,
    transaction_amount,
    transaction_date,
    description,
    transaction_status,
    reference_number
)
SELECT 
    'txn_' || generate_series::text,
    account_id,
    CASE 
        WHEN random() > 0.5 THEN 'CREDIT'
        ELSE 'DEBIT'
    END,
    (random() * 10000 + 100)::numeric(15,2),
    NOW() - (random() * 30 || ' days')::interval,
    CASE (random() * 5)::int
        WHEN 0 THEN 'راتب شهري'
        WHEN 1 THEN 'سحب نقدي'
        WHEN 2 THEN 'تحويل بنكي'
        WHEN 3 THEN 'دفعة فاتورة'
        ELSE 'معاملة عامة'
    END,
    'COMPLETED',
    'REF' || generate_series::text
FROM 
    (SELECT account_id FROM kastle_banking.accounts LIMIT 6) a,
    generate_series(1, 50)
ON CONFLICT (transaction_id) DO NOTHING;

-- Insert test loan accounts
INSERT INTO kastle_banking.loan_accounts (
    loan_account_id,
    loan_account_number,
    customer_id,
    product_id,
    loan_amount,
    outstanding_balance,
    loan_status,
    disbursement_date,
    maturity_date,
    interest_rate,
    overdue_days
) VALUES
    ('l1', 'LOAN001', 'c1', 'PROD001', 200000.00, 150000.00, 'ACTIVE', NOW() - INTERVAL '1 year', NOW() + INTERVAL '4 years', 5.5, 0),
    ('l2', 'LOAN002', 'c2', 'PROD002', 500000.00, 450000.00, 'ACTIVE', NOW() - INTERVAL '6 months', NOW() + INTERVAL '10 years', 4.8, 0),
    ('l3', 'LOAN003', 'c3', 'PROD003', 1000000.00, 800000.00, 'ACTIVE', NOW() - INTERVAL '2 years', NOW() + INTERVAL '3 years', 6.2, 0),
    ('l4', 'LOAN004', 'c4', 'PROD001', 100000.00, 95000.00, 'ACTIVE', NOW() - INTERVAL '3 months', NOW() + INTERVAL '2 years', 5.8, 15),
    ('l5', 'LOAN005', 'c5', 'PROD002', 300000.00, 280000.00, 'DELINQUENT', NOW() - INTERVAL '1 year', NOW() + INTERVAL '4 years', 5.0, 95)
ON CONFLICT (loan_account_id) DO NOTHING;

-- Insert test collection cases
INSERT INTO kastle_banking.collection_cases (
    case_id,
    case_number,
    customer_id,
    loan_account_id,
    total_outstanding,
    case_status,
    bucket_id,
    assigned_date,
    priority_level
) VALUES
    ('case1', 'CASE001', 'c4', 'l4', 95000.00, 'ACTIVE', 'BUCKET1', NOW() - INTERVAL '10 days', 'MEDIUM'),
    ('case2', 'CASE002', 'c5', 'l5', 280000.00, 'ACTIVE', 'BUCKET3', NOW() - INTERVAL '90 days', 'HIGH')
ON CONFLICT (case_id) DO NOTHING;

-- Insert test products
INSERT INTO kastle_banking.products (
    product_id,
    product_code,
    product_name,
    product_category,
    product_status
) VALUES
    ('PROD001', 'PL001', 'قرض شخصي', 'LOANS', 'ACTIVE'),
    ('PROD002', 'HL001', 'قرض سكني', 'LOANS', 'ACTIVE'),
    ('PROD003', 'BL001', 'قرض تجاري', 'LOANS', 'ACTIVE'),
    ('PROD004', 'SA001', 'حساب توفير', 'DEPOSITS', 'ACTIVE'),
    ('PROD005', 'CA001', 'حساب جاري', 'DEPOSITS', 'ACTIVE')
ON CONFLICT (product_id) DO NOTHING;

-- Insert test branches
INSERT INTO kastle_banking.branches (
    branch_id,
    branch_code,
    branch_name,
    branch_type,
    branch_status
) VALUES
    ('BR001', 'BR001', 'الفرع الرئيسي', 'MAIN', 'ACTIVE'),
    ('BR002', 'BR002', 'فرع الرياض', 'BRANCH', 'ACTIVE'),
    ('BR003', 'BR003', 'فرع جدة', 'BRANCH', 'ACTIVE')
ON CONFLICT (branch_id) DO NOTHING;

-- Insert test collection officers in collection schema
INSERT INTO kastle_collection.collection_officers (
    officer_id,
    officer_code,
    officer_name,
    email,
    phone,
    team_id,
    officer_status,
    created_at
) VALUES
    ('off1', 'OFF001', 'محمد أحمد', 'mohammed@example.com', '+966501111111', 'TEAM1', 'ACTIVE', NOW()),
    ('off2', 'OFF002', 'سارة علي', 'sara@example.com', '+966502222222', 'TEAM1', 'ACTIVE', NOW()),
    ('off3', 'OFF003', 'عبدالله خالد', 'abdullah@example.com', '+966503333333', 'TEAM2', 'ACTIVE', NOW())
ON CONFLICT (officer_id) DO NOTHING;

-- Insert test collection teams
INSERT INTO kastle_collection.collection_teams (
    team_id,
    team_name,
    team_lead_id,
    team_status
) VALUES
    ('TEAM1', 'فريق التحصيل الأول', 'off1', 'ACTIVE'),
    ('TEAM2', 'فريق التحصيل الثاني', 'off3', 'ACTIVE')
ON CONFLICT (team_id) DO NOTHING;

-- Insert test promise to pay records
INSERT INTO kastle_collection.promise_to_pay (
    ptp_id,
    case_id,
    promised_amount,
    promised_date,
    ptp_status,
    created_by,
    created_at
) VALUES
    ('ptp1', 'case1', 10000.00, NOW() + INTERVAL '7 days', 'PENDING', 'off1', NOW()),
    ('ptp2', 'case2', 50000.00, NOW() + INTERVAL '14 days', 'PENDING', 'off2', NOW())
ON CONFLICT (ptp_id) DO NOTHING;

-- Update statistics
ANALYZE kastle_banking.customers;
ANALYZE kastle_banking.accounts;
ANALYZE kastle_banking.transactions;
ANALYZE kastle_banking.loan_accounts;
ANALYZE kastle_banking.collection_cases;
ANALYZE kastle_collection.collection_officers;
ANALYZE kastle_collection.promise_to_pay;

-- Verify data insertion
SELECT 'Customers' as table_name, COUNT(*) as count FROM kastle_banking.customers
UNION ALL
SELECT 'Accounts', COUNT(*) FROM kastle_banking.accounts
UNION ALL
SELECT 'Transactions', COUNT(*) FROM kastle_banking.transactions
UNION ALL
SELECT 'Loan Accounts', COUNT(*) FROM kastle_banking.loan_accounts
UNION ALL
SELECT 'Collection Cases', COUNT(*) FROM kastle_banking.collection_cases
UNION ALL
SELECT 'Collection Officers', COUNT(*) FROM kastle_collection.collection_officers;