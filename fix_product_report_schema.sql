-- Fix Product Report Schema Issues
-- This script fixes the database schema issues for the product report functionality

-- 1. Check if loan_accounts table exists and has correct structure
DO $$
BEGIN
    -- Check if loan_accounts table exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts'
    ) THEN
        RAISE NOTICE 'Creating loan_accounts table...';
        
        CREATE TABLE kastle_banking.loan_accounts (
            loan_account_id SERIAL PRIMARY KEY,
            loan_account_number VARCHAR(50) UNIQUE NOT NULL,
            customer_id VARCHAR(50) NOT NULL,
            product_id VARCHAR(50) NOT NULL,
            loan_amount DECIMAL(15,2) NOT NULL,
            principal_amount DECIMAL(15,2),
            outstanding_balance DECIMAL(15,2) DEFAULT 0,
            overdue_amount DECIMAL(15,2) DEFAULT 0,
            overdue_days INTEGER DEFAULT 0,
            interest_rate DECIMAL(5,2),
            disbursement_date DATE,
            maturity_date DATE,
            loan_status VARCHAR(50),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Create indexes
        CREATE INDEX idx_loan_accounts_customer ON kastle_banking.loan_accounts(customer_id);
        CREATE INDEX idx_loan_accounts_product ON kastle_banking.loan_accounts(product_id);
        CREATE INDEX idx_loan_accounts_status ON kastle_banking.loan_accounts(loan_status);
    END IF;
END $$;

-- 2. Check if products table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'products'
    ) THEN
        RAISE NOTICE 'Creating products table...';
        
        CREATE TABLE kastle_banking.products (
            product_id VARCHAR(50) PRIMARY KEY,
            product_code VARCHAR(50) UNIQUE NOT NULL,
            product_name VARCHAR(100) NOT NULL,
            product_type VARCHAR(50),
            category_id VARCHAR(50),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert sample products
        INSERT INTO kastle_banking.products (product_id, product_code, product_name, product_type, category_id) VALUES
        ('PROD001', 'TAW001', 'قرض تورق', 'Tawarruq', 'CAT001'),
        ('PROD002', 'CSH001', 'قرض كاش', 'Cash', 'CAT002'),
        ('PROD003', 'AUT001', 'تمويل سيارات', 'Auto', 'CAT003'),
        ('PROD004', 'REL001', 'تمويل عقاري', 'Real Estate', 'CAT004'),
        ('PROD005', 'CRD001', 'بطاقة ائتمان', 'Credit Card', 'CAT005')
        ON CONFLICT (product_id) DO NOTHING;
    END IF;
END $$;

-- 3. Check if branches table exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branches'
    ) THEN
        RAISE NOTICE 'Creating branches table...';
        
        CREATE TABLE kastle_banking.branches (
            branch_id VARCHAR(50) PRIMARY KEY,
            branch_code VARCHAR(50) UNIQUE NOT NULL,
            branch_name VARCHAR(100) NOT NULL,
            city VARCHAR(50),
            region VARCHAR(50),
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        -- Insert sample branches
        INSERT INTO kastle_banking.branches (branch_id, branch_code, branch_name, city, region) VALUES
        ('BR001', 'RYD001', 'الرياض - الفرع الرئيسي', 'الرياض', 'الوسطى'),
        ('BR002', 'JED001', 'جدة - فرع التحلية', 'جدة', 'الغربية'),
        ('BR003', 'DMM001', 'الدمام - فرع الخليج', 'الدمام', 'الشرقية')
        ON CONFLICT (branch_id) DO NOTHING;
    END IF;
END $$;

-- 4. Add missing columns to loan_accounts if they don't exist
DO $$
BEGIN
    -- Add interest_rate column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'interest_rate'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts ADD COLUMN interest_rate DECIMAL(5,2);
    END IF;
    
    -- Add disbursement_date column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'disbursement_date'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts ADD COLUMN disbursement_date DATE;
    END IF;
    
    -- Add restructured column if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'restructured'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts ADD COLUMN restructured BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 5. Create collection_cases table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_cases'
    ) THEN
        RAISE NOTICE 'Creating collection_cases table...';
        
        CREATE TABLE kastle_banking.collection_cases (
            case_id VARCHAR(50) PRIMARY KEY,
            loan_account_number VARCHAR(50) NOT NULL,
            customer_id VARCHAR(50) NOT NULL,
            case_status VARCHAR(50) DEFAULT 'ACTIVE',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_collection_cases_loan ON kastle_banking.collection_cases(loan_account_number);
        CREATE INDEX idx_collection_cases_status ON kastle_banking.collection_cases(case_status);
    END IF;
END $$;

-- 6. Create collection_interactions table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'collection_interactions'
    ) THEN
        RAISE NOTICE 'Creating collection_interactions table...';
        
        CREATE TABLE kastle_collection.collection_interactions (
            interaction_id SERIAL PRIMARY KEY,
            case_id VARCHAR(50) NOT NULL,
            interaction_type VARCHAR(50),
            outcome VARCHAR(100),
            interaction_datetime TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_interactions_case ON kastle_collection.collection_interactions(case_id);
        CREATE INDEX idx_interactions_datetime ON kastle_collection.collection_interactions(interaction_datetime);
    END IF;
END $$;

-- 7. Create promise_to_pay table if not exists
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_collection' 
        AND table_name = 'promise_to_pay'
    ) THEN
        RAISE NOTICE 'Creating promise_to_pay table...';
        
        CREATE TABLE kastle_collection.promise_to_pay (
            ptp_id SERIAL PRIMARY KEY,
            case_id VARCHAR(50) NOT NULL,
            ptp_amount DECIMAL(15,2) NOT NULL,
            ptp_date DATE NOT NULL,
            status VARCHAR(50) DEFAULT 'PENDING',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        
        CREATE INDEX idx_ptp_case ON kastle_collection.promise_to_pay(case_id);
        CREATE INDEX idx_ptp_date ON kastle_collection.promise_to_pay(ptp_date);
    END IF;
END $$;

-- 8. Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_collection TO anon, authenticated;

-- 9. Insert sample loan data if tables are empty
INSERT INTO kastle_banking.loan_accounts (
    loan_account_number, customer_id, product_id, loan_amount, 
    principal_amount, outstanding_balance, overdue_amount, overdue_days,
    interest_rate, disbursement_date, loan_status
) 
SELECT 
    'LN' || LPAD(generate_series::text, 6, '0'),
    'CUST' || LPAD((random() * 100 + 1)::int::text, 3, '0'),
    'PROD' || LPAD((random() * 5 + 1)::int::text, 3, '0'),
    (random() * 900000 + 100000)::decimal(15,2),
    (random() * 900000 + 100000)::decimal(15,2),
    (random() * 500000 + 50000)::decimal(15,2),
    CASE WHEN random() > 0.7 THEN (random() * 50000 + 5000)::decimal(15,2) ELSE 0 END,
    CASE WHEN random() > 0.7 THEN (random() * 180)::int ELSE 0 END,
    (random() * 5 + 3)::decimal(5,2),
    CURRENT_DATE - (random() * 365)::int,
    CASE WHEN random() > 0.8 THEN 'OVERDUE' ELSE 'ACTIVE' END
FROM generate_series(1, 100)
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.loan_accounts LIMIT 1);

-- 10. Create a view to simplify product report queries
CREATE OR REPLACE VIEW kastle_banking.v_product_report AS
SELECT 
    la.loan_account_number,
    la.customer_id,
    la.product_id,
    p.product_name,
    p.product_type,
    la.loan_amount,
    la.principal_amount,
    la.outstanding_balance,
    la.overdue_amount,
    la.overdue_days,
    la.interest_rate,
    la.disbursement_date,
    la.loan_status,
    la.restructured,
    c.full_name as customer_name,
    c.customer_type,
    c.branch_id,
    b.branch_name,
    b.city,
    b.region
FROM kastle_banking.loan_accounts la
LEFT JOIN kastle_banking.products p ON la.product_id = p.product_id
LEFT JOIN kastle_banking.customers c ON la.customer_id = c.customer_id
LEFT JOIN kastle_banking.branches b ON c.branch_id = b.branch_id;

-- Grant permissions on the view
GRANT SELECT ON kastle_banking.v_product_report TO anon, authenticated;

-- Show summary
SELECT 'Database fixes applied successfully!' as status;

SELECT 
    'loan_accounts' as table_name, 
    COUNT(*) as record_count 
FROM kastle_banking.loan_accounts
UNION ALL
SELECT 
    'products' as table_name, 
    COUNT(*) as record_count 
FROM kastle_banking.products
UNION ALL
SELECT 
    'branches' as table_name, 
    COUNT(*) as record_count 
FROM kastle_banking.branches;