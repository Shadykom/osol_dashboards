-- Fix Collection Overview Dashboard Issues

-- 1. Create collection_cases table in kastle_banking schema if it doesn't exist
CREATE TABLE IF NOT EXISTS kastle_banking.collection_cases (
    case_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    loan_account_number VARCHAR(50),
    customer_id VARCHAR(50),
    total_outstanding DECIMAL(15,2) DEFAULT 0,
    days_past_due INTEGER DEFAULT 0,
    dpd INTEGER DEFAULT 0,
    case_status VARCHAR(50) DEFAULT 'ACTIVE',
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    bucket_id INTEGER,
    assigned_to VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_status ON kastle_banking.collection_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_collection_cases_loan ON kastle_banking.collection_cases(loan_account_number);
CREATE INDEX IF NOT EXISTS idx_collection_cases_customer ON kastle_banking.collection_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned ON kastle_banking.collection_cases(assigned_to);

-- 3. Create collection_buckets table if missing
CREATE TABLE IF NOT EXISTS kastle_banking.collection_buckets (
    bucket_id SERIAL PRIMARY KEY,
    bucket_name VARCHAR(100) NOT NULL,
    min_days INTEGER NOT NULL,
    max_days INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Insert default buckets if table is empty
INSERT INTO kastle_banking.collection_buckets (bucket_name, min_days, max_days)
SELECT * FROM (VALUES
    ('Current', 0, 0),
    ('1-30 DPD', 1, 30),
    ('31-60 DPD', 31, 60),
    ('61-90 DPD', 61, 90),
    ('91-120 DPD', 91, 120),
    ('121-180 DPD', 121, 180),
    ('180+ DPD', 181, 9999)
) AS v(bucket_name, min_days, max_days)
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.collection_buckets);

-- 5. Fix data type issues in loan_accounts table
-- Convert product_id to proper type if needed
ALTER TABLE kastle_banking.loan_accounts 
ALTER COLUMN product_id TYPE VARCHAR(50) USING product_id::VARCHAR(50);

-- 6. Add missing columns to officer_performance_metrics if needed
ALTER TABLE kastle_collection.officer_performance_metrics 
ADD COLUMN IF NOT EXISTS calls_answered INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS promises_made INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cases_resolved INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS customer_satisfaction_score DECIMAL(3,2) DEFAULT 0;

-- 7. Update column aliases if they exist with different names
UPDATE kastle_collection.officer_performance_metrics 
SET calls_answered = contacts_successful 
WHERE calls_answered IS NULL AND contacts_successful IS NOT NULL;

UPDATE kastle_collection.officer_performance_metrics 
SET promises_made = ptps_obtained 
WHERE promises_made IS NULL AND ptps_obtained IS NOT NULL;

UPDATE kastle_collection.officer_performance_metrics 
SET cases_resolved = accounts_worked 
WHERE cases_resolved IS NULL AND accounts_worked IS NOT NULL;

UPDATE kastle_collection.officer_performance_metrics 
SET customer_satisfaction_score = quality_score 
WHERE customer_satisfaction_score IS NULL AND quality_score IS NOT NULL;

-- 8. Create sample collection cases if table is empty
INSERT INTO kastle_banking.collection_cases (
    loan_account_number, 
    customer_id, 
    total_outstanding, 
    days_past_due, 
    dpd,
    case_status, 
    priority, 
    bucket_id,
    assigned_to
)
SELECT 
    la.loan_account_number,
    la.customer_id,
    la.outstanding_balance,
    la.overdue_days,
    la.overdue_days,
    CASE 
        WHEN la.loan_status = 'OVERDUE' THEN 'ACTIVE'
        WHEN la.loan_status = 'DEFAULTED' THEN 'LEGAL'
        ELSE 'CLOSED'
    END,
    CASE 
        WHEN la.overdue_days > 90 THEN 'HIGH'
        WHEN la.overdue_days > 30 THEN 'MEDIUM'
        ELSE 'LOW'
    END,
    CASE 
        WHEN la.overdue_days = 0 THEN 1
        WHEN la.overdue_days <= 30 THEN 2
        WHEN la.overdue_days <= 60 THEN 3
        WHEN la.overdue_days <= 90 THEN 4
        WHEN la.overdue_days <= 120 THEN 5
        WHEN la.overdue_days <= 180 THEN 6
        ELSE 7
    END,
    'OFF001'
FROM kastle_banking.loan_accounts la
WHERE la.loan_status IN ('OVERDUE', 'DEFAULTED')
AND NOT EXISTS (
    SELECT 1 FROM kastle_banking.collection_cases cc 
    WHERE cc.loan_account_number = la.loan_account_number
)
LIMIT 100;

-- 9. Grant necessary permissions
GRANT ALL ON kastle_banking.collection_cases TO anon;
GRANT ALL ON kastle_banking.collection_buckets TO anon;
GRANT ALL ON kastle_collection.officer_performance_metrics TO anon;

-- 10. Enable RLS if needed
ALTER TABLE kastle_banking.collection_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_buckets ENABLE ROW LEVEL SECURITY;

-- Create policies for anonymous access
CREATE POLICY "Allow anonymous read" ON kastle_banking.collection_cases
    FOR SELECT TO anon USING (true);

CREATE POLICY "Allow anonymous read" ON kastle_banking.collection_buckets
    FOR SELECT TO anon USING (true);

-- 11. Verify the fixes
SELECT 'collection_cases count:', COUNT(*) FROM kastle_banking.collection_cases;
SELECT 'collection_buckets count:', COUNT(*) FROM kastle_banking.collection_buckets;
SELECT 'officer_performance_metrics count:', COUNT(*) FROM kastle_collection.officer_performance_metrics;