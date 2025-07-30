-- Fix foreign key issues and add missing tables

-- First, ensure the kastle_collection schema exists
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- Create report_schedules table that's missing
CREATE TABLE IF NOT EXISTS kastle_banking.report_schedules (
    schedule_id SERIAL PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50),
    schedule_type VARCHAR(50) CHECK (schedule_type IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    enabled BOOLEAN DEFAULT true,
    last_run TIMESTAMPTZ,
    next_run TIMESTAMPTZ,
    config JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions on report_schedules
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.report_schedules TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON kastle_banking.report_schedules_schedule_id_seq TO anon, authenticated, service_role;

-- Add some sample report schedules
INSERT INTO kastle_banking.report_schedules (report_name, report_type, schedule_type, enabled)
VALUES 
    ('Daily Collection Summary', 'COLLECTION', 'DAILY', true),
    ('Weekly Performance Report', 'PERFORMANCE', 'WEEKLY', true),
    ('Monthly Financial Report', 'FINANCIAL', 'MONTHLY', true)
ON CONFLICT DO NOTHING;

-- Fix the collection_buckets reference - ensure it exists in kastle_banking
CREATE TABLE IF NOT EXISTS kastle_banking.collection_buckets (
    bucket_id SERIAL PRIMARY KEY,
    bucket_name VARCHAR(50) NOT NULL,
    bucket_code VARCHAR(20) UNIQUE,
    min_days INTEGER,
    max_days INTEGER,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Copy buckets from kastle_collection if they exist there
INSERT INTO kastle_banking.collection_buckets (bucket_code, bucket_name, min_days, max_days)
SELECT bucket_code, bucket_name, min_days, max_days
FROM kastle_collection.collection_buckets
ON CONFLICT (bucket_code) DO NOTHING;

-- If no buckets exist, create default ones
INSERT INTO kastle_banking.collection_buckets (bucket_code, bucket_name, min_days, max_days)
VALUES 
    ('CURRENT', 'Current', 0, 0),
    ('BUCKET_1', '1-30 Days', 1, 30),
    ('BUCKET_2', '31-60 Days', 31, 60),
    ('BUCKET_3', '61-90 Days', 61, 90),
    ('BUCKET_4', '91-120 Days', 91, 120),
    ('BUCKET_5', '121-180 Days', 121, 180),
    ('BUCKET_6', '180+ Days', 181, 9999)
ON CONFLICT (bucket_code) DO NOTHING;

-- Create collection_cases in kastle_banking if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.collection_cases (
    case_id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE,
    customer_id VARCHAR(50) REFERENCES kastle_banking.customers(customer_id),
    loan_account_number VARCHAR(50),
    total_outstanding NUMERIC(15,2),
    days_past_due INTEGER,
    bucket_id INTEGER REFERENCES kastle_banking.collection_buckets(bucket_id),
    case_status VARCHAR(50) DEFAULT 'ACTIVE',
    priority VARCHAR(20) DEFAULT 'NORMAL',
    assigned_to VARCHAR(50),
    amount_due NUMERIC(15,2),
    amount_collected NUMERIC(15,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes on collection_cases
CREATE INDEX IF NOT EXISTS idx_banking_collection_cases_customer_id ON kastle_banking.collection_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_banking_collection_cases_status ON kastle_banking.collection_cases(case_status);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.collection_cases TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON kastle_banking.collection_cases_case_id_seq TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.collection_buckets TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON kastle_banking.collection_buckets_bucket_id_seq TO anon, authenticated, service_role;

-- Create some sample collection cases
INSERT INTO kastle_banking.collection_cases (
    case_number, 
    customer_id, 
    total_outstanding, 
    days_past_due, 
    bucket_id, 
    case_status,
    amount_due
)
SELECT 
    'CASE_' || LPAD(ROW_NUMBER() OVER ()::text, 6, '0'),
    c.customer_id,
    10000 + (random() * 90000)::numeric,
    (random() * 180)::int,
    CASE 
        WHEN (random() * 180)::int <= 30 THEN 2
        WHEN (random() * 180)::int <= 60 THEN 3
        WHEN (random() * 180)::int <= 90 THEN 4
        WHEN (random() * 180)::int <= 120 THEN 5
        WHEN (random() * 180)::int <= 180 THEN 6
        ELSE 7
    END,
    CASE WHEN random() > 0.2 THEN 'ACTIVE' ELSE 'CLOSED' END,
    10000 + (random() * 90000)::numeric
FROM kastle_banking.customers c
LIMIT 50
ON CONFLICT (case_number) DO NOTHING;

-- Fix transaction table columns if missing
ALTER TABLE kastle_banking.transactions 
ADD COLUMN IF NOT EXISTS transaction_status VARCHAR(50) DEFAULT 'COMPLETED',
ADD COLUMN IF NOT EXISTS transaction_type_id INTEGER,
ADD COLUMN IF NOT EXISTS channel VARCHAR(50);

-- Update transaction_status for existing records
UPDATE kastle_banking.transactions 
SET transaction_status = 'COMPLETED' 
WHERE transaction_status IS NULL;

-- Create a view that joins collection data across schemas for easier querying
CREATE OR REPLACE VIEW kastle_banking.v_collection_specialists AS
SELECT 
    co.officer_id,
    co.officer_name,
    co.officer_type,
    co.team_id,
    co.contact_number,
    co.email,
    co.status,
    ct.team_name,
    ct.team_type
FROM kastle_collection.collection_officers co
LEFT JOIN kastle_collection.collection_teams ct ON co.team_id = ct.team_id
WHERE co.status = 'ACTIVE';

-- Grant permissions on the view
GRANT SELECT ON kastle_banking.v_collection_specialists TO anon, authenticated, service_role;

-- Create promise_to_pay in kastle_banking if needed by queries
CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES kastle_banking.collection_cases(case_id),
    customer_id VARCHAR(50) REFERENCES kastle_banking.customers(customer_id),
    amount NUMERIC(15,2),
    promise_date DATE,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.promise_to_pay TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON kastle_banking.promise_to_pay_ptp_id_seq TO anon, authenticated, service_role;

-- Add missing columns to accounts table
ALTER TABLE kastle_banking.accounts
ADD COLUMN IF NOT EXISTS account_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS product_id INTEGER;

-- Add missing columns to loan_accounts table  
ALTER TABLE kastle_banking.loan_accounts
ADD COLUMN IF NOT EXISTS loan_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS product_id INTEGER,
ADD COLUMN IF NOT EXISTS overdue_amount NUMERIC(15,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS overdue_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS loan_amount NUMERIC(15,2);

-- Update loan_amount from original_amount if it exists
UPDATE kastle_banking.loan_accounts 
SET loan_amount = original_amount 
WHERE loan_amount IS NULL AND original_amount IS NOT NULL;

-- Add customer_contacts table if missing
CREATE TABLE IF NOT EXISTS kastle_banking.customer_contacts (
    contact_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(50) REFERENCES kastle_banking.customers(customer_id),
    contact_type VARCHAR(50),
    contact_value VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.customer_contacts TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON kastle_banking.customer_contacts_contact_id_seq TO anon, authenticated, service_role;

-- Insert sample customer contacts
INSERT INTO kastle_banking.customer_contacts (customer_id, contact_type, contact_value, is_primary)
SELECT 
    customer_id,
    'MOBILE',
    mobile_number,
    true
FROM kastle_banking.customers
WHERE mobile_number IS NOT NULL
ON CONFLICT DO NOTHING;

-- Verify the fixes
DO $$
BEGIN
    RAISE NOTICE 'Foreign key fixes completed';
    RAISE NOTICE 'Report schedules: %', (SELECT COUNT(*) FROM kastle_banking.report_schedules);
    RAISE NOTICE 'Collection buckets: %', (SELECT COUNT(*) FROM kastle_banking.collection_buckets);
    RAISE NOTICE 'Collection cases: %', (SELECT COUNT(*) FROM kastle_banking.collection_cases);
END $$;