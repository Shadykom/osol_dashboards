-- Fix missing columns and tables in kastle_banking schema

-- 1. Add missing branch_id column to collection_officers
ALTER TABLE kastle_banking.collection_officers 
ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50);

-- 2. Add missing is_active column to collection_officers (if not exists)
ALTER TABLE kastle_banking.collection_officers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 3. Add missing product_type column to loan_accounts
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50);

-- 4. Create missing call_attempts table
CREATE TABLE IF NOT EXISTS kastle_banking.call_attempts (
    attempt_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    customer_id VARCHAR(50),
    officer_id VARCHAR(50),
    phone_number VARCHAR(20),
    call_datetime TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    call_duration INTEGER,
    call_status VARCHAR(50),
    call_outcome VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create missing case_bucket_history table
CREATE TABLE IF NOT EXISTS kastle_banking.case_bucket_history (
    history_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    from_bucket_id INTEGER,
    to_bucket_id INTEGER,
    change_date DATE NOT NULL,
    change_reason VARCHAR(100),
    changed_by VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create missing system_performance table
CREATE TABLE IF NOT EXISTS kastle_banking.system_performance (
    id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    metric_type VARCHAR(50) NOT NULL,
    metric_name VARCHAR(100) NOT NULL,
    metric_value NUMERIC,
    branch_id VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_call_attempts_case_id ON kastle_banking.call_attempts(case_id);
CREATE INDEX IF NOT EXISTS idx_call_attempts_customer_id ON kastle_banking.call_attempts(customer_id);
CREATE INDEX IF NOT EXISTS idx_call_attempts_officer_id ON kastle_banking.call_attempts(officer_id);
CREATE INDEX IF NOT EXISTS idx_case_bucket_history_case_id ON kastle_banking.case_bucket_history(case_id);
CREATE INDEX IF NOT EXISTS idx_system_performance_metric_date ON kastle_banking.system_performance(metric_date);
CREATE INDEX IF NOT EXISTS idx_system_performance_branch_id ON kastle_banking.system_performance(branch_id);

-- Grant permissions on new tables
GRANT ALL ON kastle_banking.call_attempts TO authenticated;
GRANT ALL ON kastle_banking.call_attempts TO anon;
GRANT ALL ON kastle_banking.case_bucket_history TO authenticated;
GRANT ALL ON kastle_banking.case_bucket_history TO anon;
GRANT ALL ON kastle_banking.system_performance TO authenticated;
GRANT ALL ON kastle_banking.system_performance TO anon;

-- Disable RLS on new tables
ALTER TABLE kastle_banking.call_attempts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.case_bucket_history DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.system_performance DISABLE ROW LEVEL SECURITY;

-- Update existing loan_accounts records with a default product_type if null
UPDATE kastle_banking.loan_accounts 
SET product_type = 'Personal Loan' 
WHERE product_type IS NULL AND loan_type_id = 1;

UPDATE kastle_banking.loan_accounts 
SET product_type = 'Auto Loan' 
WHERE product_type IS NULL AND loan_type_id = 2;

UPDATE kastle_banking.loan_accounts 
SET product_type = 'Home Loan' 
WHERE product_type IS NULL AND loan_type_id = 3;

-- Set default for any remaining null product_types
UPDATE kastle_banking.loan_accounts 
SET product_type = 'General Loan' 
WHERE product_type IS NULL;

-- Update collection_officers with sample branch_id if needed
UPDATE kastle_banking.collection_officers 
SET branch_id = 'BR001' 
WHERE branch_id IS NULL;

-- Verify the changes
SELECT 
    'collection_officers.branch_id' as check_item,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'collection_officers' 
        AND column_name = 'branch_id'
    ) as exists;

SELECT 
    'loan_accounts.product_type' as check_item,
    EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'product_type'
    ) as exists;

SELECT 
    'call_attempts table' as check_item,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'call_attempts'
    ) as exists;

SELECT 
    'case_bucket_history table' as check_item,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'case_bucket_history'
    ) as exists;

SELECT 
    'system_performance table' as check_item,
    EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'system_performance'
    ) as exists;