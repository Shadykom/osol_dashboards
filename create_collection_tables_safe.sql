-- Safe Creation of Collection Dashboard Tables
-- This script creates all necessary tables for the collection dashboard
-- It checks if tables exist before creating them

-- Ensure kastle_banking schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Grant permissions on schema
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;

-- 1. Create remediation_actions table
CREATE TABLE IF NOT EXISTS kastle_banking.remediation_actions (
    action_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    action_type VARCHAR(50) NOT NULL, -- RESTRUCTURE, SETTLEMENT, LEGAL_REFERRAL, WRITE_OFF
    action_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    action_status VARCHAR(50) DEFAULT 'PENDING',
    original_amount DECIMAL(15,2),
    proposed_amount DECIMAL(15,2),
    approved_amount DECIMAL(15,2),
    approved_by VARCHAR(50),
    approved_date TIMESTAMP,
    notes TEXT,
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create portfolio_metrics table
CREATE TABLE IF NOT EXISTS kastle_banking.portfolio_metrics (
    metric_id SERIAL PRIMARY KEY,
    metric_date DATE NOT NULL,
    total_portfolio_value DECIMAL(15,2),
    total_overdue_amount DECIMAL(15,2),
    npl_ratio DECIMAL(5,2),
    collection_rate DECIMAL(5,2),
    bucket_30_60_amount DECIMAL(15,2),
    bucket_30_60_count INTEGER,
    bucket_60_90_amount DECIMAL(15,2),
    bucket_60_90_count INTEGER,
    bucket_90_180_amount DECIMAL(15,2),
    bucket_90_180_count INTEGER,
    bucket_180_360_amount DECIMAL(15,2),
    bucket_180_360_count INTEGER,
    bucket_360_plus_amount DECIMAL(15,2),
    bucket_360_plus_count INTEGER,
    total_restructured_count INTEGER,
    total_restructured_amount DECIMAL(15,2),
    total_settlements_count INTEGER,
    total_settlements_amount DECIMAL(15,2),
    total_legal_referrals_count INTEGER,
    total_legal_referrals_amount DECIMAL(15,2),
    total_write_offs_count INTEGER,
    total_write_offs_amount DECIMAL(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create product_performance table
CREATE TABLE IF NOT EXISTS kastle_banking.product_performance (
    performance_id SERIAL PRIMARY KEY,
    product_type VARCHAR(50) NOT NULL,
    performance_date DATE NOT NULL,
    total_portfolio_value DECIMAL(15,2),
    total_overdue_amount DECIMAL(15,2),
    npl_ratio DECIMAL(5,2),
    collection_amount DECIMAL(15,2),
    collection_rate DECIMAL(5,2),
    bucket_distribution JSONB,
    remediation_success_rate DECIMAL(5,2),
    average_days_to_resolve INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_type, performance_date)
);

-- 4. Create collection_targets table
CREATE TABLE IF NOT EXISTS kastle_banking.collection_targets (
    target_id SERIAL PRIMARY KEY,
    target_type VARCHAR(50) NOT NULL, -- COMPANY, BRANCH, OFFICER, PRODUCT
    target_reference VARCHAR(50) NOT NULL, -- branch_id, officer_id, product_type, or 'COMPANY'
    target_month DATE NOT NULL,
    target_amount DECIMAL(15,2) NOT NULL,
    target_npl_ratio DECIMAL(5,2),
    target_collection_rate DECIMAL(5,2),
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(target_type, target_reference, target_month)
);

-- 5. Create user_roles table
CREATE TABLE IF NOT EXISTS kastle_banking.user_roles (
    user_id VARCHAR(50) PRIMARY KEY,
    email VARCHAR(100) UNIQUE NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL, -- EXECUTIVE, SPECIALIST, BRANCH_MANAGER, PRODUCT_MANAGER, COMPLIANCE_OFFICER, ADMIN
    branch_id VARCHAR(50),
    product_types TEXT[], -- Array of product types for product managers
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create recommended_actions table
CREATE TABLE IF NOT EXISTS kastle_banking.recommended_actions (
    recommendation_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date TIMESTAMP,
    completed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create promise_to_pay table if not exists
CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    promised_amount DECIMAL(15,2) NOT NULL,
    promise_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kept_amount DECIMAL(15,2),
    kept_date DATE,
    broken_reason VARCHAR(200)
);

-- 8. Create collection_interactions table if not exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_interactions (
    interaction_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    officer_id VARCHAR(50),
    interaction_type VARCHAR(50) NOT NULL,
    interaction_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    channel VARCHAR(50),
    outcome VARCHAR(50),
    notes TEXT,
    next_action VARCHAR(100),
    next_action_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 9. Add columns to collection_cases if they don't exist
DO $$ 
BEGIN
    -- Check if columns exist before adding
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'product_type') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN product_type VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'collateral_value') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN collateral_value DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'collateral_type') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN collateral_type VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'restructured') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN restructured BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'restructure_date') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN restructure_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'settlement_offered') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN settlement_offered BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'settlement_amount') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN settlement_amount DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'legal_referral') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN legal_referral BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'legal_referral_date') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN legal_referral_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'write_off') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN write_off BOOLEAN DEFAULT FALSE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'write_off_date') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN write_off_date DATE;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'write_off_amount') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN write_off_amount DECIMAL(15,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'remediation_type') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN remediation_type VARCHAR(50);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'collection_cases' 
                   AND column_name = 'remediation_status') THEN
        ALTER TABLE kastle_banking.collection_cases ADD COLUMN remediation_status VARCHAR(50);
    END IF;
END $$;

-- 10. Add columns to branch_collection_performance if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'branch_collection_performance' 
                   AND column_name = 'active_cases') THEN
        ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN active_cases INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'branch_collection_performance' 
                   AND column_name = 'resolved_cases') THEN
        ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN resolved_cases INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'branch_collection_performance' 
                   AND column_name = 'ptp_success_rate') THEN
        ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN ptp_success_rate DECIMAL(5,2);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'branch_collection_performance' 
                   AND column_name = 'remediation_count') THEN
        ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN remediation_count INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'branch_collection_performance' 
                   AND column_name = 'remediation_amount') THEN
        ALTER TABLE kastle_banking.branch_collection_performance ADD COLUMN remediation_amount DECIMAL(15,2);
    END IF;
END $$;

-- 11. Add columns to audit_trail if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'audit_trail' 
                   AND column_name = 'collection_case_id') THEN
        ALTER TABLE kastle_banking.audit_trail ADD COLUMN collection_case_id INTEGER;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'kastle_banking' 
                   AND table_name = 'audit_trail' 
                   AND column_name = 'collection_action_type') THEN
        ALTER TABLE kastle_banking.audit_trail ADD COLUMN collection_action_type VARCHAR(100);
    END IF;
END $$;

-- 12. Add columns to collection_strategies if table exists
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'kastle_banking' 
               AND table_name = 'collection_strategies') THEN
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'kastle_banking' 
                       AND table_name = 'collection_strategies' 
                       AND column_name = 'min_dpd') THEN
            ALTER TABLE kastle_banking.collection_strategies ADD COLUMN min_dpd INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'kastle_banking' 
                       AND table_name = 'collection_strategies' 
                       AND column_name = 'max_dpd') THEN
            ALTER TABLE kastle_banking.collection_strategies ADD COLUMN max_dpd INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'kastle_banking' 
                       AND table_name = 'collection_strategies' 
                       AND column_name = 'min_amount') THEN
            ALTER TABLE kastle_banking.collection_strategies ADD COLUMN min_amount DECIMAL(15,2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'kastle_banking' 
                       AND table_name = 'collection_strategies' 
                       AND column_name = 'max_amount') THEN
            ALTER TABLE kastle_banking.collection_strategies ADD COLUMN max_amount DECIMAL(15,2);
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                       WHERE table_schema = 'kastle_banking' 
                       AND table_name = 'collection_strategies' 
                       AND column_name = 'product_types') THEN
            ALTER TABLE kastle_banking.collection_strategies ADD COLUMN product_types TEXT[];
        END IF;
    END IF;
END $$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_product_type ON kastle_banking.collection_cases(product_type);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_case_id ON kastle_banking.remediation_actions(case_id);
CREATE INDEX IF NOT EXISTS idx_remediation_actions_action_type ON kastle_banking.remediation_actions(action_type);
CREATE INDEX IF NOT EXISTS idx_portfolio_metrics_date ON kastle_banking.portfolio_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_product_performance_date ON kastle_banking.product_performance(product_type, performance_date);
CREATE INDEX IF NOT EXISTS idx_collection_targets_month ON kastle_banking.collection_targets(target_type, target_reference, target_month);
CREATE INDEX IF NOT EXISTS idx_recommended_actions_case ON kastle_banking.recommended_actions(case_id, is_completed);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case ON kastle_banking.promise_to_pay(case_id, status);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_case ON kastle_banking.collection_interactions(case_id);

-- Grant permissions
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon;

-- Add foreign key constraints if they don't exist
DO $$
BEGIN
    -- Add foreign key for remediation_actions.case_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_remediation_actions_case_id'
        AND table_schema = 'kastle_banking'
        AND table_name = 'remediation_actions'
    ) THEN
        ALTER TABLE kastle_banking.remediation_actions 
        ADD CONSTRAINT fk_remediation_actions_case_id 
        FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);
    END IF;

    -- Add foreign key for recommended_actions.case_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_recommended_actions_case_id'
        AND table_schema = 'kastle_banking'
        AND table_name = 'recommended_actions'
    ) THEN
        ALTER TABLE kastle_banking.recommended_actions 
        ADD CONSTRAINT fk_recommended_actions_case_id 
        FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);
    END IF;

    -- Add foreign key for promise_to_pay.case_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_promise_to_pay_case_id'
        AND table_schema = 'kastle_banking'
        AND table_name = 'promise_to_pay'
    ) THEN
        ALTER TABLE kastle_banking.promise_to_pay 
        ADD CONSTRAINT fk_promise_to_pay_case_id 
        FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);
    END IF;

    -- Add foreign key for collection_interactions.case_id if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_collection_interactions_case_id'
        AND table_schema = 'kastle_banking'
        AND table_name = 'collection_interactions'
    ) THEN
        ALTER TABLE kastle_banking.collection_interactions 
        ADD CONSTRAINT fk_collection_interactions_case_id 
        FOREIGN KEY (case_id) REFERENCES kastle_banking.collection_cases(case_id);
    END IF;
END $$;

-- Disable RLS for now (enable in production with proper policies)
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.remediation_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.user_roles DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.portfolio_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.product_performance DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_targets DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.recommended_actions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.promise_to_pay DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_interactions DISABLE ROW LEVEL SECURITY;

-- Insert sample data for testing
-- Insert a test user role
INSERT INTO kastle_banking.user_roles (user_id, email, full_name, role, is_active)
VALUES ('test-executive', 'executive@test.com', 'Test Executive', 'EXECUTIVE', true)
ON CONFLICT (user_id) DO NOTHING;

-- Insert sample portfolio metrics for the last 6 months
INSERT INTO kastle_banking.portfolio_metrics (
    metric_date, 
    total_portfolio_value, 
    total_overdue_amount, 
    npl_ratio, 
    collection_rate,
    bucket_30_60_amount, bucket_30_60_count,
    bucket_60_90_amount, bucket_60_90_count,
    bucket_90_180_amount, bucket_90_180_count,
    bucket_180_360_amount, bucket_180_360_count,
    bucket_360_plus_amount, bucket_360_plus_count
)
SELECT 
    date_trunc('month', CURRENT_DATE - (n || ' months')::interval)::date,
    1000000000 - (n * 10000000), -- Total portfolio value
    50000000 + (n * 1000000), -- Total overdue
    4.5 + (n * 0.1), -- NPL ratio
    75 - (n * 2), -- Collection rate
    10000000, 100,
    8000000, 80,
    15000000, 120,
    12000000, 90,
    5000000, 30
FROM generate_series(0, 5) n
ON CONFLICT DO NOTHING;

-- Insert sample collection targets
INSERT INTO kastle_banking.collection_targets (
    target_type, 
    target_reference, 
    target_month, 
    target_amount, 
    target_npl_ratio, 
    target_collection_rate
)
VALUES 
    ('COMPANY', 'COMPANY', date_trunc('month', CURRENT_DATE)::date, 100000000, 4.0, 80.0)
ON CONFLICT DO NOTHING;

COMMENT ON SCHEMA kastle_banking IS 'Schema for banking operations including loan collection dashboards';
COMMENT ON TABLE kastle_banking.remediation_actions IS 'Tracks all remediation actions taken on collection cases';
COMMENT ON TABLE kastle_banking.portfolio_metrics IS 'Stores aggregated portfolio metrics for executive dashboards';
COMMENT ON TABLE kastle_banking.user_roles IS 'Defines user roles for role-based access control';