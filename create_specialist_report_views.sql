-- Create necessary views and tables for Specialist Reports

-- Create collection_cases table if not exists
CREATE TABLE IF NOT EXISTS kastle_collection.collection_cases (
    case_id SERIAL PRIMARY KEY,
    case_number VARCHAR UNIQUE NOT NULL,
    customer_id VARCHAR,
    loan_account_number VARCHAR,
    assigned_to VARCHAR, -- officer_id
    priority VARCHAR CHECK (priority IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
    case_status VARCHAR CHECK (case_status IN ('ACTIVE', 'RESOLVED', 'LEGAL', 'WRITTEN_OFF', 'SETTLED', 'CLOSED')),
    assignment_date DATE,
    total_outstanding DECIMAL(15,2),
    total_overdue DECIMAL(15,2),
    dpd INTEGER, -- Days Past Due
    bucket_id INTEGER,
    last_payment_date DATE,
    last_payment_amount DECIMAL(15,2),
    last_contact_date DATE,
    next_action_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (customer_id) REFERENCES kastle_banking.customers(customer_id),
    FOREIGN KEY (loan_account_number) REFERENCES kastle_banking.loan_accounts(loan_account_number),
    FOREIGN KEY (assigned_to) REFERENCES kastle_collection.collection_officers(officer_id),
    FOREIGN KEY (bucket_id) REFERENCES kastle_collection.collection_buckets(bucket_id)
);

-- Create collection_buckets table if not exists
CREATE TABLE IF NOT EXISTS kastle_collection.collection_buckets (
    bucket_id SERIAL PRIMARY KEY,
    bucket_name VARCHAR NOT NULL,
    min_days INTEGER NOT NULL,
    max_days INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Insert default buckets
INSERT INTO kastle_collection.collection_buckets (bucket_name, min_days, max_days) VALUES
('Current', 0, 0),
('1-30 Days', 1, 30),
('31-60 Days', 31, 60),
('61-90 Days', 61, 90),
('91-180 Days', 91, 180),
('181-360 Days', 181, 360),
('>360 Days', 361, NULL)
ON CONFLICT DO NOTHING;

-- Create promise_to_pay table if not exists
CREATE TABLE IF NOT EXISTS kastle_collection.promise_to_pay (
    ptp_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    officer_id VARCHAR,
    ptp_date DATE NOT NULL,
    ptp_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR CHECK (status IN ('PENDING', 'KEPT', 'BROKEN', 'PARTIAL')),
    actual_payment_date DATE,
    actual_payment_amount DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (case_id) REFERENCES kastle_collection.collection_cases(case_id),
    FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id)
);

-- Create officer_performance_metrics table if not exists
CREATE TABLE IF NOT EXISTS kastle_collection.officer_performance_metrics (
    metric_id SERIAL PRIMARY KEY,
    officer_id VARCHAR NOT NULL,
    metric_date DATE NOT NULL,
    calls_made INTEGER DEFAULT 0,
    calls_answered INTEGER DEFAULT 0,
    promises_made INTEGER DEFAULT 0,
    promises_kept INTEGER DEFAULT 0,
    amount_collected DECIMAL(15,2) DEFAULT 0,
    cases_resolved INTEGER DEFAULT 0,
    avg_call_duration INTEGER DEFAULT 0, -- in seconds
    customer_satisfaction_score DECIMAL(3,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (officer_id) REFERENCES kastle_collection.collection_officers(officer_id),
    UNIQUE(officer_id, metric_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned_to ON kastle_collection.collection_cases(assigned_to);
CREATE INDEX IF NOT EXISTS idx_collection_cases_status ON kastle_collection.collection_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_collection_cases_dpd ON kastle_collection.collection_cases(dpd);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_officer_id ON kastle_collection.collection_interactions(officer_id);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_datetime ON kastle_collection.collection_interactions(interaction_datetime);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_officer_id ON kastle_collection.promise_to_pay(officer_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_status ON kastle_collection.promise_to_pay(status);

-- Create a view for specialist performance summary
CREATE OR REPLACE VIEW kastle_collection.specialist_performance_summary AS
SELECT 
    o.officer_id,
    o.officer_name,
    o.officer_type,
    o.team_id,
    COUNT(DISTINCT c.case_id) as total_cases,
    SUM(c.total_outstanding) as total_portfolio_value,
    SUM(c.total_overdue) as total_overdue_amount,
    COUNT(DISTINCT CASE WHEN c.case_status = 'RESOLVED' THEN c.case_id END) as resolved_cases,
    COUNT(DISTINCT i.interaction_id) as total_interactions,
    COUNT(DISTINCT CASE WHEN i.interaction_type = 'CALL' THEN i.interaction_id END) as total_calls,
    COUNT(DISTINCT p.ptp_id) as total_promises,
    COUNT(DISTINCT CASE WHEN p.status = 'KEPT' THEN p.ptp_id END) as kept_promises,
    COALESCE(AVG(pm.customer_satisfaction_score), 0) as avg_satisfaction_score
FROM kastle_collection.collection_officers o
LEFT JOIN kastle_collection.collection_cases c ON o.officer_id = c.assigned_to
LEFT JOIN kastle_collection.collection_interactions i ON o.officer_id = i.officer_id
LEFT JOIN kastle_collection.promise_to_pay p ON o.officer_id = p.officer_id
LEFT JOIN kastle_collection.officer_performance_metrics pm ON o.officer_id = pm.officer_id
WHERE o.status = 'ACTIVE'
GROUP BY o.officer_id, o.officer_name, o.officer_type, o.team_id;

-- Create sample data for testing
-- Insert sample collection cases
INSERT INTO kastle_collection.collection_cases (
    case_number, customer_id, loan_account_number, assigned_to, 
    priority, case_status, assignment_date, total_outstanding, 
    total_overdue, dpd, bucket_id
)
SELECT 
    'CASE-' || generate_series,
    'CUST' || LPAD(generate_series::text, 6, '0'),
    'LN' || LPAD(generate_series::text, 8, '0'),
    CASE 
        WHEN generate_series % 3 = 0 THEN 'SP001'
        WHEN generate_series % 3 = 1 THEN 'SP002'
        ELSE 'SP003'
    END,
    CASE 
        WHEN random() < 0.2 THEN 'HIGH'
        WHEN random() < 0.5 THEN 'MEDIUM'
        ELSE 'LOW'
    END,
    'ACTIVE',
    CURRENT_DATE - INTERVAL '30 days' * random(),
    50000 + random() * 450000,
    5000 + random() * 45000,
    FLOOR(random() * 180)::INTEGER,
    CASE 
        WHEN FLOOR(random() * 180) = 0 THEN 1
        WHEN FLOOR(random() * 180) <= 30 THEN 2
        WHEN FLOOR(random() * 180) <= 60 THEN 3
        WHEN FLOOR(random() * 180) <= 90 THEN 4
        WHEN FLOOR(random() * 180) <= 180 THEN 5
        ELSE 6
    END
FROM generate_series(1, 50)
ON CONFLICT (case_number) DO NOTHING;

-- Insert sample interactions
INSERT INTO kastle_collection.collection_interactions (
    case_id, officer_id, interaction_type, interaction_datetime,
    interaction_status, outcome, promise_to_pay
)
SELECT 
    (SELECT case_id FROM kastle_collection.collection_cases ORDER BY random() LIMIT 1),
    CASE 
        WHEN generate_series % 3 = 0 THEN 'SP001'
        WHEN generate_series % 3 = 1 THEN 'SP002'
        ELSE 'SP003'
    END,
    CASE 
        WHEN random() < 0.6 THEN 'CALL'
        WHEN random() < 0.8 THEN 'SMS'
        ELSE 'EMAIL'
    END,
    CURRENT_TIMESTAMP - INTERVAL '1 day' * (random() * 30),
    CASE 
        WHEN random() < 0.7 THEN 'ANSWERED'
        ELSE 'NO_ANSWER'
    END,
    CASE 
        WHEN random() < 0.3 THEN 'SUCCESSFUL'
        WHEN random() < 0.6 THEN 'PENDING'
        ELSE 'FAILED'
    END,
    random() < 0.3
FROM generate_series(1, 200);

-- Insert sample promises to pay
INSERT INTO kastle_collection.promise_to_pay (
    case_id, officer_id, ptp_date, ptp_amount, status
)
SELECT 
    (SELECT case_id FROM kastle_collection.collection_cases WHERE assigned_to = officer ORDER BY random() LIMIT 1),
    officer,
    CURRENT_DATE + INTERVAL '1 day' * (random() * 30),
    5000 + random() * 25000,
    CASE 
        WHEN random() < 0.4 THEN 'KEPT'
        WHEN random() < 0.7 THEN 'PENDING'
        ELSE 'BROKEN'
    END
FROM (
    SELECT 'SP001' as officer FROM generate_series(1, 10)
    UNION ALL
    SELECT 'SP002' FROM generate_series(1, 10)
    UNION ALL
    SELECT 'SP003' FROM generate_series(1, 10)
) t;

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_collection TO authenticated;
GRANT INSERT, UPDATE ON kastle_collection.collection_interactions TO authenticated;
GRANT INSERT, UPDATE ON kastle_collection.promise_to_pay TO authenticated;
GRANT INSERT, UPDATE ON kastle_collection.collection_cases TO authenticated;