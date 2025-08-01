-- Create tables for regulatory reports
-- These tables will store generated reports and their metadata

-- Table for SAMA reports
CREATE TABLE IF NOT EXISTS kastle_banking.sama_reports (
    report_id SERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    total_deposits DECIMAL(20,2),
    total_loans DECIMAL(20,2),
    total_assets DECIMAL(20,2),
    liquidity_ratio DECIMAL(5,2),
    npl_ratio DECIMAL(5,2),
    capital_adequacy_ratio DECIMAL(5,2),
    report_data JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'DRAFT',
    submitted_at TIMESTAMP,
    submission_reference VARCHAR(100),
    CONSTRAINT sama_reports_status_check CHECK (status IN ('DRAFT', 'FINAL', 'SUBMITTED', 'ACCEPTED', 'REJECTED'))
);

-- Table for Basel III compliance reports
CREATE TABLE IF NOT EXISTS kastle_banking.basel_compliance_reports (
    report_id SERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    cet1_ratio DECIMAL(5,2),
    tier1_ratio DECIMAL(5,2),
    total_capital_ratio DECIMAL(5,2),
    leverage_ratio DECIMAL(5,2),
    lcr_ratio DECIMAL(5,2),
    nsfr_ratio DECIMAL(5,2),
    risk_weighted_assets DECIMAL(20,2),
    total_capital DECIMAL(20,2),
    compliance_status VARCHAR(50),
    report_data JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'DRAFT'
);

-- Table for AML/CFT reports
CREATE TABLE IF NOT EXISTS kastle_banking.aml_reports (
    report_id SERIAL PRIMARY KEY,
    report_date DATE NOT NULL,
    report_period_start DATE NOT NULL,
    report_period_end DATE NOT NULL,
    new_customers INTEGER,
    kyc_completed INTEGER,
    high_risk_customers INTEGER,
    suspicious_transactions INTEGER,
    ctrs_filed INTEGER,
    sars_filed INTEGER,
    alerts_generated INTEGER,
    alerts_cleared INTEGER,
    report_data JSONB,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    generated_by VARCHAR(100),
    status VARCHAR(50) DEFAULT 'DRAFT'
);

-- Table for regulatory submissions tracking
CREATE TABLE IF NOT EXISTS kastle_banking.regulatory_submissions (
    submission_id SERIAL PRIMARY KEY,
    report_type VARCHAR(50) NOT NULL,
    report_id INTEGER NOT NULL,
    regulator VARCHAR(100) NOT NULL,
    submission_date TIMESTAMP NOT NULL,
    due_date DATE,
    submission_method VARCHAR(50),
    submission_reference VARCHAR(100),
    status VARCHAR(50) DEFAULT 'PENDING',
    response_date TIMESTAMP,
    response_details TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    CONSTRAINT regulatory_submissions_status_check CHECK (status IN ('PENDING', 'SUBMITTED', 'ACKNOWLEDGED', 'ACCEPTED', 'REJECTED', 'RESUBMISSION_REQUIRED'))
);

-- Table for regulatory requirements
CREATE TABLE IF NOT EXISTS kastle_banking.regulatory_requirements (
    requirement_id SERIAL PRIMARY KEY,
    regulator VARCHAR(100) NOT NULL,
    report_type VARCHAR(100) NOT NULL,
    frequency VARCHAR(50) NOT NULL,
    due_day INTEGER,
    grace_period_days INTEGER DEFAULT 0,
    minimum_thresholds JSONB,
    required_fields JSONB,
    validation_rules JSONB,
    is_active BOOLEAN DEFAULT true,
    effective_from DATE,
    effective_to DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for regulatory alerts
CREATE TABLE IF NOT EXISTS kastle_banking.regulatory_alerts (
    alert_id SERIAL PRIMARY KEY,
    alert_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) NOT NULL,
    report_type VARCHAR(100),
    metric_name VARCHAR(100),
    current_value DECIMAL(20,2),
    threshold_value DECIMAL(20,2),
    alert_message TEXT,
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT regulatory_alerts_severity_check CHECK (severity IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL'))
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sama_reports_date ON kastle_banking.sama_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_sama_reports_status ON kastle_banking.sama_reports(status);
CREATE INDEX IF NOT EXISTS idx_basel_reports_date ON kastle_banking.basel_compliance_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_aml_reports_date ON kastle_banking.aml_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_regulatory_submissions_status ON kastle_banking.regulatory_submissions(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_alerts_resolved ON kastle_banking.regulatory_alerts(is_resolved);

-- Insert sample regulatory requirements
INSERT INTO kastle_banking.regulatory_requirements (regulator, report_type, frequency, due_day, grace_period_days, minimum_thresholds)
VALUES 
    ('SAMA', 'Monthly Report', 'MONTHLY', 15, 5, '{"capital_adequacy_ratio": 10.5, "liquidity_ratio": 20, "npl_ratio": 5}'::jsonb),
    ('SAMA', 'Basel III Compliance', 'QUARTERLY', 30, 10, '{"cet1_ratio": 4.5, "tier1_ratio": 6.0, "total_capital_ratio": 8.0}'::jsonb),
    ('SAMA', 'AML/CFT Report', 'MONTHLY', 10, 3, '{"kyc_completion_rate": 95}'::jsonb),
    ('SAMA', 'Liquidity Coverage Ratio', 'DAILY', 1, 0, '{"lcr_ratio": 100}'::jsonb),
    ('SAMA', 'Capital Adequacy Report', 'QUARTERLY', 30, 10, '{"minimum_car": 10.5}'::jsonb)
ON CONFLICT DO NOTHING;

-- Add comments for documentation
COMMENT ON TABLE kastle_banking.sama_reports IS 'Stores SAMA monthly regulatory reports';
COMMENT ON TABLE kastle_banking.basel_compliance_reports IS 'Stores Basel III compliance reports';
COMMENT ON TABLE kastle_banking.aml_reports IS 'Stores AML/CFT compliance reports';
COMMENT ON TABLE kastle_banking.regulatory_submissions IS 'Tracks all regulatory report submissions';
COMMENT ON TABLE kastle_banking.regulatory_requirements IS 'Defines regulatory reporting requirements and thresholds';
COMMENT ON TABLE kastle_banking.regulatory_alerts IS 'Stores alerts for regulatory compliance issues';