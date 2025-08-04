-- Extended Collection Features for kastle_banking Schema
-- This script extends the existing kastle_banking collection tables with additional features
-- to support all user stories (US-001 to US-028)

-- 1. Extend collection_cases with additional fields
ALTER TABLE kastle_banking.collection_cases 
ADD COLUMN IF NOT EXISTS product_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS collateral_value DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS collateral_type VARCHAR(100),
ADD COLUMN IF NOT EXISTS restructured BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS restructure_date DATE,
ADD COLUMN IF NOT EXISTS settlement_offered BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS settlement_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS legal_referral BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS legal_referral_date DATE,
ADD COLUMN IF NOT EXISTS write_off BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS write_off_date DATE,
ADD COLUMN IF NOT EXISTS write_off_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS remediation_type VARCHAR(50),
ADD COLUMN IF NOT EXISTS remediation_status VARCHAR(50);

-- 2. Create remediation_actions table
CREATE TABLE IF NOT EXISTS kastle_banking.remediation_actions (
    action_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES kastle_banking.collection_cases(case_id),
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

-- 3. Create portfolio_metrics table for executive dashboard
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

-- 4. Extend branch_collection_performance table
ALTER TABLE kastle_banking.branch_collection_performance
ADD COLUMN IF NOT EXISTS active_cases INTEGER,
ADD COLUMN IF NOT EXISTS resolved_cases INTEGER,
ADD COLUMN IF NOT EXISTS ptp_success_rate DECIMAL(5,2),
ADD COLUMN IF NOT EXISTS remediation_count INTEGER,
ADD COLUMN IF NOT EXISTS remediation_amount DECIMAL(15,2);

-- 5. Create product_performance table
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

-- 6. Create collection_targets table
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

-- 7. Extend audit_trail table for collection activities
ALTER TABLE kastle_banking.audit_trail
ADD COLUMN IF NOT EXISTS collection_case_id INTEGER,
ADD COLUMN IF NOT EXISTS collection_action_type VARCHAR(100);

-- 8. Create user_roles table for role-based access
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

-- 9. Extend collection_strategies table
ALTER TABLE kastle_banking.collection_strategies
ADD COLUMN IF NOT EXISTS min_dpd INTEGER,
ADD COLUMN IF NOT EXISTS max_dpd INTEGER,
ADD COLUMN IF NOT EXISTS min_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS max_amount DECIMAL(15,2),
ADD COLUMN IF NOT EXISTS product_types TEXT[];

-- 10. Create recommended_actions table
CREATE TABLE IF NOT EXISTS kastle_banking.recommended_actions (
    recommendation_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES kastle_banking.collection_cases(case_id),
    action_type VARCHAR(100) NOT NULL,
    action_description TEXT,
    priority VARCHAR(20) DEFAULT 'MEDIUM',
    due_date DATE,
    is_completed BOOLEAN DEFAULT FALSE,
    completed_date TIMESTAMP,
    completed_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 11. Create promise_to_pay table if not exists
CREATE TABLE IF NOT EXISTS kastle_banking.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES kastle_banking.collection_cases(case_id),
    promised_amount DECIMAL(15,2) NOT NULL,
    promise_date DATE NOT NULL,
    status VARCHAR(50) DEFAULT 'PENDING',
    created_by VARCHAR(50),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    kept_amount DECIMAL(15,2),
    kept_date DATE,
    broken_reason VARCHAR(200)
);

-- 12. Create collection_interactions table if not exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_interactions (
    interaction_id SERIAL PRIMARY KEY,
    case_id INTEGER REFERENCES kastle_banking.collection_cases(case_id),
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

-- Enable Row Level Security on sensitive tables
ALTER TABLE kastle_banking.collection_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.remediation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.user_roles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Executives can view all cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Specialists can view assigned cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Branch managers can view branch cases" ON kastle_banking.collection_cases;
DROP POLICY IF EXISTS "Product managers can view product cases" ON kastle_banking.collection_cases;

-- Executives can see all data
CREATE POLICY "Executives can view all cases" ON kastle_banking.collection_cases
    FOR SELECT TO authenticated
    USING (EXISTS (
        SELECT 1 FROM kastle_banking.user_roles 
        WHERE user_id = auth.uid()::varchar AND role = 'EXECUTIVE'
    ));

-- Specialists can only see their assigned cases
CREATE POLICY "Specialists can view assigned cases" ON kastle_banking.collection_cases
    FOR SELECT TO authenticated
    USING (
        assigned_to = auth.uid()::varchar OR
        EXISTS (
            SELECT 1 FROM kastle_banking.user_roles 
            WHERE user_id = auth.uid()::varchar AND role IN ('EXECUTIVE', 'ADMIN')
        )
    );

-- Branch managers can see cases in their branch
CREATE POLICY "Branch managers can view branch cases" ON kastle_banking.collection_cases
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kastle_banking.user_roles 
            WHERE user_id = auth.uid()::varchar 
            AND (role = 'BRANCH_MANAGER' AND branch_id = collection_cases.branch_id)
            OR role IN ('EXECUTIVE', 'ADMIN')
        )
    );

-- Product managers can see cases for their products
CREATE POLICY "Product managers can view product cases" ON kastle_banking.collection_cases
    FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM kastle_banking.user_roles 
            WHERE user_id = auth.uid()::varchar 
            AND (
                (role = 'PRODUCT_MANAGER' AND collection_cases.product_type = ANY(product_types))
                OR role IN ('EXECUTIVE', 'ADMIN')
            )
        )
    );