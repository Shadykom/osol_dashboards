-- Fix for Reports Page Errors
-- This script creates missing tables and fixes column references

-- 1. Create kastle_collection schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_collection;

-- 2. Create missing collection tables that are referenced in the reports
CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id SERIAL PRIMARY KEY,
    case_number VARCHAR(50) UNIQUE NOT NULL,
    customer_id VARCHAR(20),
    account_number VARCHAR(20),
    account_type VARCHAR(50),
    loan_account_number VARCHAR(50),
    card_number VARCHAR(20),
    bucket_id INTEGER,
    total_outstanding DECIMAL(18,2) DEFAULT 0,
    principal_outstanding DECIMAL(18,2) DEFAULT 0,
    interest_outstanding DECIMAL(18,2) DEFAULT 0,
    penalty_outstanding DECIMAL(18,2) DEFAULT 0,
    other_charges DECIMAL(18,2) DEFAULT 0,
    days_past_due INTEGER DEFAULT 0,
    last_payment_date DATE,
    last_payment_amount DECIMAL(18,2),
    case_status VARCHAR(20) DEFAULT 'ACTIVE',
    assigned_to VARCHAR(20),
    assignment_date DATE,
    priority VARCHAR(20),
    branch_id VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_amount DECIMAL(18,2) DEFAULT 0,
    total_overdue DECIMAL(18,2) DEFAULT 0,
    dpd INTEGER DEFAULT 0,
    last_contact_date DATE,
    next_action_date DATE,
    CONSTRAINT collection_cases_case_status_check CHECK (case_status IN ('ACTIVE', 'CLOSED', 'SUSPENDED', 'LEGAL'))
);

CREATE TABLE IF NOT EXISTS kastle_collection.daily_collection_summary (
    summary_id SERIAL PRIMARY KEY,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_outstanding DECIMAL(18,2) DEFAULT 0,
    total_collected DECIMAL(18,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    new_cases INTEGER DEFAULT 0,
    closed_cases INTEGER DEFAULT 0,
    active_cases INTEGER DEFAULT 0,
    total_contacts INTEGER DEFAULT 0,
    successful_contacts INTEGER DEFAULT 0,
    contact_rate DECIMAL(5,2) DEFAULT 0,
    promises_made INTEGER DEFAULT 0,
    promises_kept INTEGER DEFAULT 0,
    ptp_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_contact_attempts (
    attempt_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    customer_id VARCHAR(20),
    contact_type VARCHAR(20),
    contact_number VARCHAR(50),
    contact_result VARCHAR(50),
    attempt_datetime TIMESTAMP WITH TIME ZONE,
    officer_id VARCHAR(20),
    best_time_to_contact VARCHAR(20),
    contact_quality_score INTEGER,
    is_valid BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    outstanding_amount DECIMAL(18,2)
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_risk_assessment (
    assessment_id SERIAL PRIMARY KEY,
    customer_id VARCHAR(20),
    case_id INTEGER,
    assessment_date DATE,
    risk_category VARCHAR(20),
    default_probability DECIMAL(5,2),
    loss_given_default DECIMAL(5,2),
    expected_loss DECIMAL(18,6),
    early_warning_flags JSONB,
    behavioral_score INTEGER,
    payment_pattern_score INTEGER,
    external_risk_factors JSONB,
    recommended_strategy VARCHAR(50),
    next_review_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_settlement_offers (
    offer_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    customer_id VARCHAR(20),
    offer_date DATE,
    original_amount DECIMAL(18,2),
    settlement_amount DECIMAL(18,2),
    discount_percentage DECIMAL(5,2),
    payment_terms VARCHAR(50),
    installments INTEGER,
    offer_valid_until DATE,
    offer_status VARCHAR(20) DEFAULT 'PENDING',
    approval_level VARCHAR(20),
    approved_by VARCHAR(20),
    customer_response VARCHAR(50),
    response_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kastle_collection.collection_officers (
    officer_id VARCHAR(20) PRIMARY KEY,
    officer_name VARCHAR(100),
    officer_type VARCHAR(20),
    team_id INTEGER,
    contact_number VARCHAR(50),
    email VARCHAR(100),
    status VARCHAR(20) DEFAULT 'ACTIVE',
    language_skills TEXT[],
    collection_limit DECIMAL(18,2),
    commission_rate DECIMAL(5,2),
    joining_date DATE,
    last_active TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kastle_collection.audit_log (
    audit_id SERIAL PRIMARY KEY,
    table_name VARCHAR(100) NOT NULL,
    operation VARCHAR(20) CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    record_id VARCHAR(100) NOT NULL,
    user_id VARCHAR(20) NOT NULL,
    changed_fields JSONB,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Create report_schedules table in kastle_banking schema
CREATE TABLE IF NOT EXISTS kastle_banking.report_schedules (
    schedule_id SERIAL PRIMARY KEY,
    report_name VARCHAR(100) NOT NULL,
    report_type VARCHAR(50) NOT NULL,
    schedule_frequency VARCHAR(20) CHECK (schedule_frequency IN ('DAILY', 'WEEKLY', 'MONTHLY', 'QUARTERLY', 'YEARLY')),
    schedule_time TIME,
    schedule_day INTEGER,
    schedule_date INTEGER,
    recipients TEXT[],
    report_format VARCHAR(20) CHECK (report_format IN ('PDF', 'EXCEL', 'CSV', 'HTML')),
    report_parameters JSONB,
    enabled BOOLEAN DEFAULT TRUE,
    last_run_date TIMESTAMP WITH TIME ZONE,
    next_run_date TIMESTAMP WITH TIME ZONE,
    created_by VARCHAR(20),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_customer_id ON kastle_collection.collection_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_cases_case_status ON kastle_collection.collection_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_collection_cases_bucket_id ON kastle_collection.collection_cases(bucket_id);
CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned_to ON kastle_collection.collection_cases(assigned_to);

CREATE INDEX IF NOT EXISTS idx_daily_collection_summary_date ON kastle_collection.daily_collection_summary(summary_date);

CREATE INDEX IF NOT EXISTS idx_collection_contact_attempts_case_id ON kastle_collection.collection_contact_attempts(case_id);
CREATE INDEX IF NOT EXISTS idx_collection_contact_attempts_customer_id ON kastle_collection.collection_contact_attempts(customer_id);

CREATE INDEX IF NOT EXISTS idx_report_schedules_enabled ON kastle_banking.report_schedules(enabled);
CREATE INDEX IF NOT EXISTS idx_report_schedules_report_type ON kastle_banking.report_schedules(report_type);

-- 5. Grant permissions
GRANT USAGE ON SCHEMA kastle_collection TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_collection TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_collection TO authenticated;

GRANT ALL ON kastle_banking.report_schedules TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE kastle_banking.report_schedules_schedule_id_seq TO authenticated;

-- 6. Create a view to map 'amount' to 'transaction_amount' for compatibility
CREATE OR REPLACE VIEW kastle_banking.transactions_view AS
SELECT 
    transaction_id,
    transaction_ref,
    transaction_date,
    value_date,
    account_number,
    transaction_type_id,
    debit_credit,
    transaction_amount AS amount, -- Map transaction_amount to amount
    transaction_amount,
    currency_code,
    running_balance,
    contra_account,
    channel,
    reference_number,
    cheque_number,
    narration,
    beneficiary_name,
    beneficiary_account,
    beneficiary_bank,
    status,
    approval_status,
    approved_by,
    reversal_ref,
    branch_id,
    teller_id,
    device_id,
    ip_address,
    created_at,
    posted_at
FROM kastle_banking.transactions;

-- Grant permissions on the view
GRANT SELECT ON kastle_banking.transactions_view TO authenticated;

-- 7. Insert some sample data for testing (optional)
-- INSERT INTO kastle_banking.report_schedules (report_name, report_type, schedule_frequency, enabled)
-- VALUES 
-- ('Daily Collection Summary', 'COLLECTION', 'DAILY', true),
-- ('Weekly Performance Report', 'PERFORMANCE', 'WEEKLY', true),
-- ('Monthly Financial Report', 'FINANCIAL', 'MONTHLY', true);

COMMENT ON SCHEMA kastle_collection IS 'Schema for collection management system tables';
COMMENT ON TABLE kastle_collection.collection_cases IS 'Main table for collection cases';
COMMENT ON TABLE kastle_collection.daily_collection_summary IS 'Daily summary of collection activities';
COMMENT ON TABLE kastle_banking.report_schedules IS 'Scheduled reports configuration';