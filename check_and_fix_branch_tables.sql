-- Check and Fix Branch Report Tables
-- This script checks the existing structure and fixes any issues

-- 1. First, let's check what columns exist in the branch_collection_performance table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'branch_collection_performance'
ORDER BY ordinal_position;

-- 2. Check if the table exists at all
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'kastle_banking' 
    AND table_name = 'branch_collection_performance'
) as table_exists;

-- 3. Drop and recreate the table with the correct structure
-- This is safe since we're in development
DROP TABLE IF EXISTS kastle_banking.branch_collection_performance CASCADE;

-- 4. Create branches table if not exists
CREATE TABLE IF NOT EXISTS kastle_banking.branches (
    branch_id VARCHAR(50) PRIMARY KEY,
    branch_name VARCHAR(100) NOT NULL,
    branch_code VARCHAR(20) UNIQUE,
    city VARCHAR(50),
    state VARCHAR(50),
    region VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create branch_collection_performance with correct structure
CREATE TABLE kastle_banking.branch_collection_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES kastle_banking.branches(branch_id),
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_cases INTEGER DEFAULT 0,
    active_cases INTEGER DEFAULT 0,
    resolved_cases INTEGER DEFAULT 0,
    total_outstanding DECIMAL(15,2) DEFAULT 0,
    total_collected DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    delinquency_rate DECIMAL(5,2) DEFAULT 0,
    avg_dpd DECIMAL(10,2) DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    total_sms INTEGER DEFAULT 0,
    total_emails INTEGER DEFAULT 0,
    contact_rate DECIMAL(5,2) DEFAULT 0,
    ptp_rate DECIMAL(5,2) DEFAULT 0,
    ptp_kept_rate DECIMAL(5,2) DEFAULT 0,
    ptp_success_rate DECIMAL(5,2) DEFAULT 0,
    remediation_count INTEGER DEFAULT 0,
    remediation_amount DECIMAL(15,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. Add unique constraint
ALTER TABLE kastle_banking.branch_collection_performance 
ADD CONSTRAINT unique_branch_date UNIQUE (branch_id, report_date);

-- 7. Create indexes
CREATE INDEX idx_branch_collection_performance_branch_date 
ON kastle_banking.branch_collection_performance(branch_id, report_date DESC);

CREATE INDEX idx_branch_collection_performance_date 
ON kastle_banking.branch_collection_performance(report_date DESC);

-- 8. Insert sample branches
INSERT INTO kastle_banking.branches (branch_id, branch_name, branch_code, city, region)
VALUES 
    ('BR001', 'الرياض - الفرع الرئيسي', 'RYD001', 'الرياض', 'الوسطى'),
    ('BR002', 'جدة - فرع التحلية', 'JED001', 'جدة', 'الغربية'),
    ('BR003', 'الدمام - فرع الملك فهد', 'DMM001', 'الدمام', 'الشرقية'),
    ('BR004', 'مكة المكرمة', 'MKH001', 'مكة', 'الغربية'),
    ('BR005', 'المدينة المنورة', 'MDN001', 'المدينة', 'الغربية')
ON CONFLICT (branch_id) DO NOTHING;

-- 9. Insert sample performance data for testing
INSERT INTO kastle_banking.branch_collection_performance (
    branch_id, 
    report_date, 
    total_cases, 
    active_cases,
    total_outstanding, 
    delinquency_rate, 
    collection_rate,
    total_calls,
    total_sms,
    total_emails,
    contact_rate,
    ptp_rate
)
SELECT 
    b.branch_id,
    CURRENT_DATE - (n || ' days')::INTERVAL,
    FLOOR(RANDOM() * 100 + 50)::INTEGER,
    FLOOR(RANDOM() * 50 + 25)::INTEGER,
    ROUND((RANDOM() * 5000000 + 1000000)::NUMERIC, 2),
    ROUND((RANDOM() * 20 + 5)::NUMERIC, 2),
    ROUND((RANDOM() * 30 + 60)::NUMERIC, 2),
    FLOOR(RANDOM() * 200 + 100)::INTEGER,
    FLOOR(RANDOM() * 150 + 50)::INTEGER,
    FLOOR(RANDOM() * 50 + 10)::INTEGER,
    ROUND((RANDOM() * 30 + 60)::NUMERIC, 2),
    ROUND((RANDOM() * 15 + 5)::NUMERIC, 2)
FROM kastle_banking.branches b
CROSS JOIN generate_series(0, 30) n
WHERE b.is_active = true
ON CONFLICT (branch_id, report_date) DO NOTHING;

-- 10. Enable RLS
ALTER TABLE kastle_banking.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branch_collection_performance ENABLE ROW LEVEL SECURITY;

-- 11. Create policies
DROP POLICY IF EXISTS "Enable read access for all users" ON kastle_banking.branches;
DROP POLICY IF EXISTS "Enable read access for all users" ON kastle_banking.branch_collection_performance;

CREATE POLICY "Enable read access for all users" ON kastle_banking.branches
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON kastle_banking.branch_collection_performance
    FOR SELECT USING (true);

-- 12. Grant permissions
GRANT SELECT ON kastle_banking.branches TO anon, authenticated;
GRANT SELECT ON kastle_banking.branch_collection_performance TO anon, authenticated;
GRANT ALL ON kastle_banking.branches TO service_role;
GRANT ALL ON kastle_banking.branch_collection_performance TO service_role;

-- 13. Enable realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND schemaname = 'kastle_banking' 
        AND tablename = 'branch_collection_performance'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.branch_collection_performance;
    END IF;
END $$;

-- 14. Verify the setup
SELECT 
    'Setup Complete' as status,
    (SELECT COUNT(*) FROM kastle_banking.branches) as total_branches,
    (SELECT COUNT(*) FROM kastle_banking.branch_collection_performance) as performance_records,
    (SELECT COUNT(DISTINCT report_date) FROM kastle_banking.branch_collection_performance) as days_of_data;

-- 15. Show sample data
SELECT 
    b.branch_name,
    p.report_date,
    p.total_cases,
    p.active_cases,
    p.total_outstanding,
    p.delinquency_rate,
    p.collection_rate
FROM kastle_banking.branch_collection_performance p
JOIN kastle_banking.branches b ON b.branch_id = p.branch_id
ORDER BY p.report_date DESC, b.branch_name
LIMIT 10;