-- SQL script to fix collection database errors
-- Run this script in your Supabase SQL editor to create missing views and fix schema issues

-- 1. Ensure kastle_collection schema exists
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- 2. Grant necessary permissions on kastle_collection schema
GRANT USAGE ON SCHEMA kastle_collection TO authenticated;
GRANT USAGE ON SCHEMA kastle_collection TO anon;
GRANT USAGE ON SCHEMA kastle_collection TO service_role;

-- 3. Create the collection_cases_detailed view
-- This view provides a denormalized view of collection cases with related data
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
    -- Officer details (if tables exist)
    co.officer_name,
    co.officer_type,
    co.team_id,
    co.contact_number as officer_contact,
    -- Bucket details (if tables exist)
    cb.bucket_name,
    cb.min_days as bucket_min_days,
    cb.max_days as bucket_max_days
FROM kastle_collection.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la ON cc.loan_account_number = la.loan_account_number
LEFT JOIN kastle_banking.products p ON la.product_id = p.product_id
LEFT JOIN kastle_banking.customers c ON cc.customer_id = c.customer_id
LEFT JOIN kastle_collection.collection_officers co ON cc.assigned_to = co.officer_id
LEFT JOIN kastle_collection.collection_buckets cb ON cc.bucket_id = cb.bucket_id;

-- 4. Grant permissions on the view
GRANT SELECT ON kastle_collection.collection_cases_detailed TO authenticated;
GRANT SELECT ON kastle_collection.collection_cases_detailed TO anon;
GRANT SELECT ON kastle_collection.collection_cases_detailed TO service_role;

-- 5. Create basic collection tables if they don't exist (minimal structure)
CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id SERIAL PRIMARY KEY,
    customer_id INTEGER,
    loan_account_number VARCHAR(50),
    case_status VARCHAR(20),
    assigned_to INTEGER,
    bucket_id INTEGER,
    priority INTEGER DEFAULT 1,
    days_past_due INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_officers (
    officer_id SERIAL PRIMARY KEY,
    officer_name VARCHAR(255),
    officer_type VARCHAR(50),
    team_id INTEGER,
    contact_number VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_buckets (
    bucket_id SERIAL PRIMARY KEY,
    bucket_name VARCHAR(100),
    min_days INTEGER,
    max_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Grant permissions on all collection tables
GRANT ALL ON kastle_collection.collection_cases TO authenticated;
GRANT ALL ON kastle_collection.collection_officers TO authenticated;
GRANT ALL ON kastle_collection.collection_buckets TO authenticated;

GRANT SELECT ON kastle_collection.collection_cases TO anon;
GRANT SELECT ON kastle_collection.collection_officers TO anon;
GRANT SELECT ON kastle_collection.collection_buckets TO anon;

-- 7. Create RLS policies (basic security)
ALTER TABLE kastle_collection.collection_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_collection.collection_buckets ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (adjust as needed)
CREATE POLICY "collection_cases_all" ON kastle_collection.collection_cases FOR ALL TO authenticated USING (true);
CREATE POLICY "collection_officers_all" ON kastle_collection.collection_officers FOR ALL TO authenticated USING (true);
CREATE POLICY "collection_buckets_all" ON kastle_collection.collection_buckets FOR ALL TO authenticated USING (true);

-- 8. Insert sample data for testing
INSERT INTO kastle_collection.collection_buckets (bucket_name, min_days, max_days) VALUES
    ('Bucket 1-30', 1, 30),
    ('Bucket 31-60', 31, 60),
    ('Bucket 61-90', 61, 90),
    ('Bucket 90+', 91, 999)
ON CONFLICT DO NOTHING;

INSERT INTO kastle_collection.collection_officers (officer_name, officer_type, team_id, contact_number) VALUES
    ('John Smith', 'SENIOR', 1, '+1234567890'),
    ('Jane Doe', 'JUNIOR', 1, '+1234567891'),
    ('Mike Johnson', 'SENIOR', 2, '+1234567892')
ON CONFLICT DO NOTHING;

-- Note: After running this script, make sure to:
-- 1. Go to Settings > API in Supabase Dashboard
-- 2. Add 'kastle_collection' to the "Exposed schemas" list
-- 3. Click Save
-- 4. Restart your application

COMMENT ON VIEW kastle_collection.collection_cases_detailed IS 'Denormalized view of collection cases with related loan, customer, officer, and bucket data';