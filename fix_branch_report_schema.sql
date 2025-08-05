-- Fix Branch Report Schema
-- This script ensures all required tables and views for the branch report functionality exist

-- 1. Create branches table if not exists
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

-- 2. Create branch_collection_performance table if not exists
CREATE TABLE IF NOT EXISTS kastle_banking.branch_collection_performance (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    branch_id VARCHAR(50) REFERENCES kastle_banking.branches(branch_id),
    date DATE NOT NULL,
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
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(branch_id, date)
);

-- 3. Ensure collection_cases table has all required columns
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS total_outstanding DECIMAL(15,2) DEFAULT 0;

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS days_past_due INTEGER DEFAULT 0;

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50);

ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS customer_type VARCHAR(50);

-- 4. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_branch_collection_performance_branch_date 
ON kastle_banking.branch_collection_performance(branch_id, date DESC);

CREATE INDEX IF NOT EXISTS idx_collection_cases_branch 
ON kastle_banking.collection_cases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_collection_cases_status 
ON kastle_banking.collection_cases(status);

CREATE INDEX IF NOT EXISTS idx_collection_cases_dpd 
ON kastle_banking.collection_cases(days_past_due);

-- 5. Insert sample branches if none exist
INSERT INTO kastle_banking.branches (branch_id, branch_name, branch_code, city, region)
VALUES 
    ('BR001', 'الرياض - الفرع الرئيسي', 'RYD001', 'الرياض', 'الوسطى'),
    ('BR002', 'جدة - فرع التحلية', 'JED001', 'جدة', 'الغربية'),
    ('BR003', 'الدمام - فرع الملك فهد', 'DMM001', 'الدمام', 'الشرقية'),
    ('BR004', 'مكة المكرمة', 'MKH001', 'مكة', 'الغربية'),
    ('BR005', 'المدينة المنورة', 'MDN001', 'المدينة', 'الغربية')
ON CONFLICT (branch_id) DO NOTHING;

-- 6. Enable Row Level Security
ALTER TABLE kastle_banking.branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branch_collection_performance ENABLE ROW LEVEL SECURITY;

-- 7. Create policies for public access (adjust as needed for your security requirements)
CREATE POLICY "Enable read access for all users" ON kastle_banking.branches
    FOR SELECT USING (true);

CREATE POLICY "Enable read access for all users" ON kastle_banking.branch_collection_performance
    FOR SELECT USING (true);

-- 8. Grant permissions
GRANT SELECT ON kastle_banking.branches TO anon, authenticated;
GRANT SELECT ON kastle_banking.branch_collection_performance TO anon, authenticated;
GRANT ALL ON kastle_banking.branches TO service_role;
GRANT ALL ON kastle_banking.branch_collection_performance TO service_role;

-- 9. Enable realtime for branch_collection_performance
ALTER PUBLICATION supabase_realtime ADD TABLE kastle_banking.branch_collection_performance;

-- 10. Create a function to update branch performance metrics
CREATE OR REPLACE FUNCTION kastle_banking.update_branch_performance()
RETURNS void AS $$
BEGIN
    -- Update branch performance metrics based on collection cases
    INSERT INTO kastle_banking.branch_collection_performance (
        branch_id,
        date,
        total_cases,
        active_cases,
        total_outstanding,
        delinquency_rate,
        collection_rate
    )
    SELECT 
        b.branch_id,
        CURRENT_DATE,
        COUNT(DISTINCT cc.case_id) as total_cases,
        COUNT(DISTINCT CASE WHEN cc.status = 'active' THEN cc.case_id END) as active_cases,
        COALESCE(SUM(cc.total_outstanding), 0) as total_outstanding,
        CASE 
            WHEN COUNT(DISTINCT cc.case_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN cc.days_past_due > 0 THEN cc.case_id END)::DECIMAL / COUNT(DISTINCT cc.case_id)) * 100
            ELSE 0
        END as delinquency_rate,
        CASE 
            WHEN SUM(cc.total_outstanding) > 0 
            THEN (SUM(COALESCE(cc.amount_collected, 0))::DECIMAL / SUM(cc.total_outstanding)) * 100
            ELSE 0
        END as collection_rate
    FROM kastle_banking.branches b
    LEFT JOIN kastle_banking.collection_cases cc ON cc.assigned_to = b.branch_id
    WHERE b.is_active = true
    GROUP BY b.branch_id
    ON CONFLICT (branch_id, date) 
    DO UPDATE SET
        total_cases = EXCLUDED.total_cases,
        active_cases = EXCLUDED.active_cases,
        total_outstanding = EXCLUDED.total_outstanding,
        delinquency_rate = EXCLUDED.delinquency_rate,
        collection_rate = EXCLUDED.collection_rate,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- 11. Create a trigger to update branch performance when collection cases change
CREATE OR REPLACE FUNCTION kastle_banking.trigger_update_branch_performance()
RETURNS TRIGGER AS $$
BEGIN
    -- Update branch performance for affected branch
    PERFORM kastle_banking.update_branch_performance();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop existing trigger if exists
DROP TRIGGER IF EXISTS update_branch_performance_trigger ON kastle_banking.collection_cases;

-- Create trigger
CREATE TRIGGER update_branch_performance_trigger
AFTER INSERT OR UPDATE OR DELETE ON kastle_banking.collection_cases
FOR EACH STATEMENT
EXECUTE FUNCTION kastle_banking.trigger_update_branch_performance();

-- 12. Initial population of branch performance data
SELECT kastle_banking.update_branch_performance();

-- Verify the setup
SELECT 
    'Branches' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.branches
UNION ALL
SELECT 
    'Branch Performance' as table_name,
    COUNT(*) as record_count
FROM kastle_banking.branch_collection_performance;