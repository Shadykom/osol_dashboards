-- Seed Data for Dashboard Components
-- This script populates all necessary tables with sample data

-- Set the search path to include kastle_banking schema
SET search_path TO kastle_banking, public;

-- Begin transaction
BEGIN;

-- Insert Countries (if not exists)
INSERT INTO countries (country_code, country_name, is_active) VALUES
('SA', 'Saudi Arabia', true),
('AE', 'United Arab Emirates', true),
('KW', 'Kuwait', true),
('QA', 'Qatar', true),
('BH', 'Bahrain', true),
('OM', 'Oman', true)
ON CONFLICT (country_code) DO NOTHING;

-- Insert Currencies (if not exists)
INSERT INTO currencies (currency_code, currency_name, symbol, is_active) VALUES
('SAR', 'Saudi Riyal', '﷼', true),
('USD', 'US Dollar', '$', true),
('EUR', 'Euro', '€', true),
('GBP', 'British Pound', '£', true)
ON CONFLICT (currency_code) DO NOTHING;

-- Insert Customer Types (if not exists)
INSERT INTO customer_types (type_code, type_name, description) VALUES
('IND', 'Individual', 'Individual customers'),
('CRP', 'Corporate', 'Corporate customers'),
('SME', 'Small & Medium Enterprise', 'SME customers'),
('GOV', 'Government', 'Government entities')
ON CONFLICT (type_code) DO NOTHING;

-- Insert Account Types (if not exists)
INSERT INTO account_types (type_code, type_name, description, min_balance, interest_rate) VALUES
('SAV', 'Savings Account', 'Regular savings account', 1000.00, 2.5),
('CUR', 'Current Account', 'Current account for daily transactions', 5000.00, 0.0),
('DEP', 'Deposit Account', 'Fixed deposit account', 10000.00, 4.5),
('VIP', 'VIP Account', 'Premium account with special benefits', 50000.00, 3.5)
ON CONFLICT (type_code) DO NOTHING;

-- Insert Transaction Types (if not exists)
INSERT INTO transaction_types (type_code, type_name, description, is_debit) VALUES
('DEP', 'Deposit', 'Cash or check deposit', false),
('WTH', 'Withdrawal', 'Cash withdrawal', true),
('TRF', 'Transfer', 'Fund transfer', true),
('PMT', 'Payment', 'Bill payment', true),
('FEE', 'Fee', 'Service fee', true),
('INT', 'Interest', 'Interest credit', false)
ON CONFLICT (type_code) DO NOTHING;

-- Insert Product Categories (if not exists)
INSERT INTO product_categories (category_code, category_name, description) VALUES
('DEP', 'Deposits', 'Deposit products'),
('LON', 'Loans', 'Loan products'),
('CRD', 'Cards', 'Credit and debit cards'),
('INV', 'Investments', 'Investment products')
ON CONFLICT (category_code) DO NOTHING;

-- Insert Products (if not exists)
INSERT INTO products (product_code, product_name, category_id, description, min_amount, max_amount, interest_rate, is_active) 
SELECT 
    'SAV001', 'Basic Savings', category_id, 'Basic savings account', 1000.00, 1000000.00, 2.5, true
FROM product_categories WHERE category_code = 'DEP'
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO products (product_code, product_name, category_id, description, min_amount, max_amount, interest_rate, is_active)
SELECT 
    'PRL001', 'Personal Loan', category_id, 'Personal loan for individuals', 10000.00, 500000.00, 8.5, true
FROM product_categories WHERE category_code = 'LON'
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO products (product_code, product_name, category_id, description, min_amount, max_amount, interest_rate, is_active)
SELECT 
    'HML001', 'Home Loan', category_id, 'Home mortgage loan', 100000.00, 5000000.00, 6.5, true
FROM product_categories WHERE category_code = 'LON'
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO products (product_code, product_name, category_id, description, min_amount, max_amount, interest_rate, is_active)
SELECT 
    'AUL001', 'Auto Loan', category_id, 'Vehicle financing', 50000.00, 500000.00, 7.5, true
FROM product_categories WHERE category_code = 'LON'
ON CONFLICT (product_code) DO NOTHING;

INSERT INTO products (product_code, product_name, category_id, description, min_amount, max_amount, interest_rate, is_active)
SELECT 
    'CRD001', 'Credit Card', category_id, 'Standard credit card', 5000.00, 100000.00, 18.0, true
FROM product_categories WHERE category_code = 'CRD'
ON CONFLICT (product_code) DO NOTHING;

-- Insert Branches (if not exists)
INSERT INTO branches (branch_code, branch_name, branch_type, address, city, region, country_code, phone, email, is_active) VALUES
('BR001', 'Main Branch - Riyadh', 'MAIN', 'King Fahd Road', 'Riyadh', 'Central', 'SA', '+966112345678', 'main@bank.sa', true),
('BR002', 'Olaya Branch', 'BRANCH', 'Olaya Street', 'Riyadh', 'Central', 'SA', '+966112345679', 'olaya@bank.sa', true),
('BR003', 'Jeddah Main', 'BRANCH', 'Tahlia Street', 'Jeddah', 'Western', 'SA', '+966122345678', 'jeddah@bank.sa', true),
('BR004', 'Dammam Branch', 'BRANCH', 'King Saud Street', 'Dammam', 'Eastern', 'SA', '+966132345678', 'dammam@bank.sa', true),
('BR005', 'Makkah Branch', 'BRANCH', 'Ibrahim Khalil Road', 'Makkah', 'Western', 'SA', '+966125345678', 'makkah@bank.sa', true)
ON CONFLICT (branch_code) DO NOTHING;

-- Check if we need to add sample customers
DO $$
DECLARE
    customer_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO customer_count FROM customers;
    
    IF customer_count < 100 THEN
        -- Insert Customers with realistic Saudi names
        INSERT INTO customers (
            customer_number, customer_type_id, first_name, last_name, full_name, 
            date_of_birth, gender, nationality, national_id, email, mobile_number,
            customer_segment, kyc_status, risk_category, is_active, branch_id
        )
        SELECT 
            'CUS' || LPAD((ROW_NUMBER() OVER() + customer_count)::text, 6, '0'),
            (SELECT customer_type_id FROM customer_types WHERE type_code = 'IND'),
            first_names.name,
            last_names.name,
            first_names.name || ' ' || last_names.name,
            DATE '1970-01-01' + (random() * 365 * 40)::int,
            CASE WHEN random() > 0.5 THEN 'M' ELSE 'F' END,
            'SA',
            '1' || LPAD((random() * 999999999)::int::text, 9, '0'),
            lower(replace(first_names.name, ' ', '') || '.' || replace(last_names.name, ' ', '') || (random() * 1000)::int || '@email.com'),
            '05' || LPAD((random() * 99999999)::int::text, 8, '0'),
            CASE 
                WHEN random() < 0.1 THEN 'PREMIUM'
                WHEN random() < 0.4 THEN 'GOLD'
                WHEN random() < 0.8 THEN 'SILVER'
                ELSE 'BASIC'
            END,
            CASE WHEN random() < 0.9 THEN 'VERIFIED' ELSE 'PENDING' END,
            CASE 
                WHEN random() < 0.7 THEN 'LOW'
                WHEN random() < 0.95 THEN 'MEDIUM'
                ELSE 'HIGH'
            END,
            true,
            (SELECT branch_id FROM branches ORDER BY random() LIMIT 1)
        FROM 
            generate_series(1, 200),
            (VALUES ('Ahmed'), ('Mohammed'), ('Abdullah'), ('Khalid'), ('Fahad'), ('Omar'), ('Ali'), ('Hassan'), ('Ibrahim'), ('Yousef'),
                    ('Fatima'), ('Aisha'), ('Maryam'), ('Noura'), ('Sarah'), ('Huda'), ('Layla'), ('Zainab'), ('Khadija'), ('Amira')) AS first_names(name),
            (VALUES ('Al-Rashid'), ('Al-Saud'), ('Al-Zahrani'), ('Al-Qahtani'), ('Al-Otaibi'), ('Al-Harbi'), ('Al-Dossari'), ('Al-Shehri'), ('Al-Ghamdi'), ('Al-Maliki')) AS last_names(name)
        ORDER BY random()
        LIMIT 200;
    END IF;
END $$;

-- Check if we need to add sample accounts
DO $$
DECLARE
    account_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO account_count FROM accounts;
    
    IF account_count < 100 THEN
        -- Insert Accounts
        INSERT INTO accounts (
            account_number, customer_id, account_type_id, branch_id, currency_code,
            current_balance, available_balance, hold_amount, account_status, 
            overdraft_limit, last_transaction_date
        )
        SELECT 
            'ACC' || LPAD((ROW_NUMBER() OVER() + account_count)::text, 10, '0'),
            customer_id,
            (SELECT account_type_id FROM account_types ORDER BY random() LIMIT 1),
            branch_id,
            'SAR',
            (random() * 500000)::numeric(15,2),
            (random() * 500000)::numeric(15,2),
            0.00,
            CASE WHEN random() < 0.95 THEN 'ACTIVE' ELSE 'DORMANT' END,
            CASE WHEN random() < 0.3 THEN (random() * 50000)::numeric(15,2) ELSE 0.00 END,
            CURRENT_DATE - (random() * 30)::int
        FROM customers
        CROSS JOIN generate_series(1, 2) -- 2 accounts per customer on average
        WHERE random() < 0.8 -- Not all customers have accounts
        LIMIT 300;
    END IF;
END $$;

-- Check if we need to add sample loans
DO $$
DECLARE
    loan_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO loan_count FROM loan_accounts;
    
    IF loan_count < 50 THEN
        -- Insert Loan Accounts
        INSERT INTO loan_accounts (
            loan_account_number, customer_id, product_id, branch_id, currency_code,
            loan_amount, disbursed_amount, outstanding_balance, principal_outstanding,
            interest_outstanding, loan_status, disbursement_date, maturity_date,
            interest_rate, installment_amount, total_installments, paid_installments,
            overdue_days, overdue_amount, next_installment_date
        )
        SELECT 
            'LN' || LPAD((ROW_NUMBER() OVER() + loan_count)::text, 10, '0'),
            customer_id,
            (SELECT product_id FROM products WHERE category_id IN (SELECT category_id FROM product_categories WHERE category_code = 'LON') ORDER BY random() LIMIT 1),
            branch_id,
            'SAR',
            loan_amount,
            loan_amount,
            outstanding,
            principal,
            interest,
            CASE 
                WHEN overdue_days > 90 THEN 'DEFAULT'
                WHEN overdue_days > 0 THEN 'OVERDUE'
                ELSE 'ACTIVE'
            END,
            CURRENT_DATE - (total_months * 30),
            CURRENT_DATE + ((total_months - paid_months) * 30),
            interest_rate,
            installment,
            total_months,
            paid_months,
            overdue_days,
            CASE WHEN overdue_days > 0 THEN installment * (overdue_days / 30) ELSE 0 END,
            CURRENT_DATE + 30
        FROM (
            SELECT 
                c.customer_id,
                c.branch_id,
                (random() * 900000 + 100000)::numeric(15,2) as loan_amount,
                (random() * 5 + 5)::numeric(5,2) as interest_rate,
                (random() * 48 + 12)::int as total_months,
                (random() * 24)::int as paid_months,
                CASE 
                    WHEN random() < 0.8 THEN 0
                    WHEN random() < 0.9 THEN (random() * 30)::int
                    WHEN random() < 0.95 THEN (random() * 60 + 30)::int
                    ELSE (random() * 90 + 90)::int
                END as overdue_days
            FROM customers c
            WHERE random() < 0.3 -- 30% of customers have loans
            LIMIT 100
        ) loan_calc
        CROSS JOIN LATERAL (
            SELECT 
                loan_amount * (1 - (paid_months::numeric / total_months)) as outstanding,
                loan_amount * (1 - (paid_months::numeric / total_months)) * 0.9 as principal,
                loan_amount * (1 - (paid_months::numeric / total_months)) * 0.1 as interest,
                (loan_amount * (1 + interest_rate/100) / total_months)::numeric(15,2) as installment
        ) calc;
    END IF;
END $$;

-- Check if we need to add sample transactions
DO $$
DECLARE
    transaction_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO transaction_count FROM transactions;
    
    IF transaction_count < 1000 THEN
        -- Insert Recent Transactions
        INSERT INTO transactions (
            transaction_ref, account_id, transaction_type_id, amount, currency_code,
            transaction_date, value_date, description, status, channel,
            reference_number, beneficiary_name, beneficiary_account
        )
        SELECT 
            'TRN' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '_' || LPAD((ROW_NUMBER() OVER() + transaction_count)::text, 6, '0'),
            account_id,
            tt.transaction_type_id,
            (random() * 50000)::numeric(15,2),
            'SAR',
            CURRENT_TIMESTAMP - (random() * interval '30 days'),
            CURRENT_DATE - (random() * 30)::int,
            'Transaction - ' || tt.type_name,
            CASE WHEN random() < 0.95 THEN 'COMPLETED' ELSE 'PENDING' END,
            CASE 
                WHEN random() < 0.4 THEN 'MOBILE'
                WHEN random() < 0.7 THEN 'ATM'
                WHEN random() < 0.9 THEN 'BRANCH'
                ELSE 'ONLINE'
            END,
            'REF' || LPAD((random() * 999999)::int::text, 6, '0'),
            CASE 
                WHEN tt.type_code = 'TRF' THEN 
                    (SELECT full_name FROM customers ORDER BY random() LIMIT 1)
                ELSE NULL
            END,
            CASE 
                WHEN tt.type_code = 'TRF' THEN 
                    'ACC' || LPAD((random() * 9999999999)::bigint::text, 10, '0')
                ELSE NULL
            END
        FROM 
            accounts a
            CROSS JOIN transaction_types tt
            CROSS JOIN generate_series(1, 5) -- 5 transactions per account
        WHERE 
            a.account_status = 'ACTIVE'
            AND random() < 0.2 -- Sample 20% to avoid too much data
        LIMIT 2000;
    END IF;
END $$;

-- Insert Collection Buckets (if not exists)
INSERT INTO collection_buckets (bucket_code, bucket_name, min_dpd, max_dpd, priority, is_active) VALUES
('CURRENT', 'Current', 0, 0, 1, true),
('BUCKET1', '1-30 DPD', 1, 30, 2, true),
('BUCKET2', '31-60 DPD', 31, 60, 3, true),
('BUCKET3', '61-90 DPD', 61, 90, 4, true),
('BUCKET4', '91-120 DPD', 91, 120, 5, true),
('BUCKET5', '121-180 DPD', 121, 180, 6, true),
('BUCKET6', '180+ DPD', 181, 9999, 7, true)
ON CONFLICT (bucket_code) DO NOTHING;

-- Insert Collection Cases for overdue loans (if not exists)
INSERT INTO collection_cases (
    case_number, loan_account_id, customer_id, bucket_id, assigned_date,
    total_outstanding, principal_outstanding, interest_outstanding,
    overdue_days, case_status, priority, last_payment_date,
    last_payment_amount, promise_to_pay_date, promise_to_pay_amount
)
SELECT 
    'CASE' || TO_CHAR(CURRENT_DATE, 'YYYYMM') || LPAD(ROW_NUMBER() OVER()::text, 5, '0'),
    loan_account_id,
    customer_id,
    (SELECT bucket_id FROM collection_buckets WHERE overdue_days BETWEEN min_dpd AND max_dpd LIMIT 1),
    CURRENT_DATE - (overdue_days / 2),
    outstanding_balance,
    principal_outstanding,
    interest_outstanding,
    overdue_days,
    CASE 
        WHEN overdue_days > 180 THEN 'LEGAL'
        WHEN overdue_days > 90 THEN 'ESCALATED'
        ELSE 'ACTIVE'
    END,
    CASE 
        WHEN overdue_days > 90 THEN 'HIGH'
        WHEN overdue_days > 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END,
    CURRENT_DATE - (random() * 60)::int,
    (random() * 10000)::numeric(15,2),
    CASE 
        WHEN random() < 0.3 THEN CURRENT_DATE + (random() * 30)::int
        ELSE NULL
    END,
    CASE 
        WHEN random() < 0.3 THEN (outstanding_balance * (random() * 0.5 + 0.1))::numeric(15,2)
        ELSE NULL
    END
FROM loan_accounts
WHERE overdue_days > 0
AND NOT EXISTS (
    SELECT 1 FROM collection_cases cc 
    WHERE cc.loan_account_id = loan_accounts.loan_account_id
);

-- Insert or update Delinquencies
INSERT INTO delinquencies (
    loan_account_id, customer_id, branch_id, product_id,
    outstanding_balance, dpd, bucket, delinquency_amount,
    last_payment_date, last_payment_amount, risk_rating
)
SELECT 
    l.loan_account_id,
    l.customer_id,
    l.branch_id,
    l.product_id,
    l.outstanding_balance,
    l.overdue_days,
    CASE 
        WHEN l.overdue_days = 0 THEN 'CURRENT'
        WHEN l.overdue_days <= 30 THEN 'BUCKET1'
        WHEN l.overdue_days <= 60 THEN 'BUCKET2'
        WHEN l.overdue_days <= 90 THEN 'BUCKET3'
        WHEN l.overdue_days <= 120 THEN 'BUCKET4'
        WHEN l.overdue_days <= 180 THEN 'BUCKET5'
        ELSE 'BUCKET6'
    END,
    l.overdue_amount,
    CURRENT_DATE - (random() * 60)::int,
    (random() * 10000)::numeric(15,2),
    CASE 
        WHEN l.overdue_days > 90 THEN 'HIGH'
        WHEN l.overdue_days > 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END
FROM loan_accounts l
WHERE l.loan_status IN ('ACTIVE', 'OVERDUE', 'DEFAULT')
ON CONFLICT (loan_account_id) DO UPDATE SET
    outstanding_balance = EXCLUDED.outstanding_balance,
    dpd = EXCLUDED.dpd,
    bucket = EXCLUDED.bucket,
    delinquency_amount = EXCLUDED.delinquency_amount,
    updated_at = CURRENT_TIMESTAMP;

-- Commit transaction
COMMIT;

-- Update statistics
ANALYZE;

-- Display summary
SELECT 'Data seeding completed!' as message
UNION ALL
SELECT 'Customers: ' || COUNT(*)::text FROM customers
UNION ALL
SELECT 'Accounts: ' || COUNT(*)::text FROM accounts
UNION ALL
SELECT 'Loans: ' || COUNT(*)::text FROM loan_accounts
UNION ALL
SELECT 'Transactions: ' || COUNT(*)::text FROM transactions
UNION ALL
SELECT 'Collection Cases: ' || COUNT(*)::text FROM collection_cases;