-- Complete Collection System Setup
-- This script creates all necessary tables and views for the collection system

-- Step 1: Create necessary tables
-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
  customer_id VARCHAR PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  national_id VARCHAR,
  mobile_number VARCHAR,
  email VARCHAR,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_officers table
CREATE TABLE IF NOT EXISTS collection_officers (
  officer_id VARCHAR PRIMARY KEY,
  full_name VARCHAR NOT NULL,
  email VARCHAR,
  mobile_number VARCHAR,
  department VARCHAR,
  status VARCHAR CHECK (status IN ('ACTIVE', 'INACTIVE', 'ON_LEAVE')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_cases table
CREATE TABLE IF NOT EXISTS collection_cases (
  case_id SERIAL PRIMARY KEY,
  case_number VARCHAR NOT NULL UNIQUE DEFAULT ('COLL' || to_char(now(), 'YYYYMMDD') || '_' || substr(md5(random()::text), 1, 8)),
  customer_id VARCHAR REFERENCES customers(customer_id),
  loan_account_number VARCHAR,
  officer_id VARCHAR REFERENCES collection_officers(officer_id),
  loan_amount DECIMAL(15,2),
  outstanding_balance DECIMAL(15,2),
  overdue_amount DECIMAL(15,2),
  overdue_days INTEGER DEFAULT 0,
  delinquency_bucket VARCHAR,
  priority_level VARCHAR CHECK (priority_level IN ('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')),
  loan_status VARCHAR CHECK (loan_status IN ('ACTIVE', 'RESOLVED', 'LEGAL', 'WRITTEN_OFF', 'SETTLED', 'CLOSED')),
  product_type VARCHAR,
  last_payment_date DATE,
  last_payment_amount DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create collection_interactions table
CREATE TABLE IF NOT EXISTS collection_interactions (
  interaction_id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES collection_cases(case_id),
  officer_id VARCHAR REFERENCES collection_officers(officer_id),
  interaction_type VARCHAR CHECK (interaction_type IN ('CALL', 'SMS', 'EMAIL', 'VISIT', 'LETTER')),
  interaction_datetime TIMESTAMP WITH TIME ZONE,
  response_received BOOLEAN DEFAULT FALSE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create promise_to_pay table
CREATE TABLE IF NOT EXISTS promise_to_pay (
  ptp_id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES collection_cases(case_id),
  officer_id VARCHAR REFERENCES collection_officers(officer_id),
  promise_date DATE NOT NULL,
  promise_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR CHECK (status IN ('PENDING', 'KEPT', 'BROKEN', 'PARTIAL')),
  actual_payment_date DATE,
  actual_payment_amount DECIMAL(15,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  payment_id SERIAL PRIMARY KEY,
  case_id INTEGER REFERENCES collection_cases(case_id),
  payment_date DATE NOT NULL,
  payment_amount DECIMAL(15,2) NOT NULL,
  payment_method VARCHAR,
  reference_number VARCHAR,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_customer_id ON collection_cases(customer_id);
CREATE INDEX IF NOT EXISTS idx_collection_cases_officer_id ON collection_cases(officer_id);
CREATE INDEX IF NOT EXISTS idx_collection_cases_status ON collection_cases(loan_status);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_case_id ON collection_interactions(case_id);
CREATE INDEX IF NOT EXISTS idx_collection_interactions_officer_id ON collection_interactions(officer_id);
CREATE INDEX IF NOT EXISTS idx_promise_to_pay_case_id ON promise_to_pay(case_id);
CREATE INDEX IF NOT EXISTS idx_payments_case_id ON payments(case_id);
CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);

-- Step 2: Insert sample data
INSERT INTO customers (customer_id, full_name, national_id, mobile_number, email) VALUES
('CUST001', 'John Doe', '1234567890', '+254712345678', 'john.doe@email.com'),
('CUST002', 'Jane Smith', '0987654321', '+254723456789', 'jane.smith@email.com'),
('CUST003', 'Robert Johnson', '1122334455', '+254734567890', 'robert.j@email.com'),
('CUST004', 'Mary Williams', '5544332211', '+254745678901', 'mary.w@email.com'),
('CUST005', 'David Brown', '6677889900', '+254756789012', 'david.b@email.com')
ON CONFLICT (customer_id) DO NOTHING;

INSERT INTO collection_officers (officer_id, full_name, email, mobile_number, department, status) VALUES
('OFF001', 'Alice Officer', 'alice.o@company.com', '+254700111222', 'Collections', 'ACTIVE'),
('OFF002', 'Bob Collector', 'bob.c@company.com', '+254700222333', 'Collections', 'ACTIVE'),
('OFF003', 'Charlie Agent', 'charlie.a@company.com', '+254700333444', 'Collections', 'ACTIVE')
ON CONFLICT (officer_id) DO NOTHING;

INSERT INTO collection_cases (customer_id, loan_account_number, officer_id, loan_amount, outstanding_balance, overdue_amount, overdue_days, delinquency_bucket, priority_level, loan_status, product_type) VALUES
('CUST001', 'LN001234', 'OFF001', 100000, 85000, 15000, 30, '30-60 days', 'MEDIUM', 'ACTIVE', 'Personal Loan'),
('CUST002', 'LN001235', 'OFF001', 200000, 180000, 40000, 60, '60-90 days', 'HIGH', 'ACTIVE', 'Business Loan'),
('CUST003', 'LN001236', 'OFF002', 50000, 45000, 10000, 15, '0-30 days', 'LOW', 'ACTIVE', 'Personal Loan'),
('CUST004', 'LN001237', 'OFF002', 300000, 250000, 80000, 90, '90+ days', 'CRITICAL', 'ACTIVE', 'Mortgage'),
('CUST005', 'LN001238', 'OFF003', 75000, 70000, 20000, 45, '30-60 days', 'MEDIUM', 'ACTIVE', 'Auto Loan')
ON CONFLICT (case_number) DO NOTHING;

-- Step 3: Create view for specialist loan portfolio
CREATE OR REPLACE VIEW v_specialist_loan_portfolio AS
SELECT 
    cc.case_id,
    cc.loan_account_number,
    cc.customer_id,
    cc.officer_id,
    cc.loan_amount,
    cc.outstanding_balance,
    cc.overdue_amount as due_amount,
    cc.overdue_days,
    cc.delinquency_bucket,
    cc.priority_level,
    cc.loan_status,
    cc.product_type,
    cc.last_payment_date,
    cc.last_payment_amount,
    cc.created_at,
    cc.updated_at,
    c.full_name as customer_name,
    c.national_id,
    c.mobile_number,
    (cc.loan_amount - cc.outstanding_balance) as paid_amount,
    ci.interaction_datetime as last_contact_date
FROM collection_cases cc
LEFT JOIN customers c ON cc.customer_id = c.customer_id
LEFT JOIN LATERAL (
    SELECT interaction_datetime 
    FROM collection_interactions 
    WHERE case_id = cc.case_id 
    ORDER BY interaction_datetime DESC 
    LIMIT 1
) ci ON true;

-- Step 4: Create table for officer performance summary
CREATE TABLE IF NOT EXISTS officer_performance_summary (
    summary_id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    officer_id VARCHAR(50) NOT NULL,
    summary_date DATE NOT NULL,
    total_cases INTEGER DEFAULT 0,
    total_calls INTEGER DEFAULT 0,
    total_messages INTEGER DEFAULT 0,
    total_ptps INTEGER DEFAULT 0,
    ptps_kept INTEGER DEFAULT 0,
    collection_amount DECIMAL(15,2) DEFAULT 0,
    collection_rate DECIMAL(5,2) DEFAULT 0,
    contact_rate DECIMAL(5,2) DEFAULT 0,
    ptp_keep_rate DECIMAL(5,2) DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(officer_id, summary_date)
);

-- Step 5: Create function to update officer performance summary
CREATE OR REPLACE FUNCTION update_officer_performance_summary()
RETURNS void AS $$
BEGIN
    INSERT INTO officer_performance_summary (
        officer_id,
        summary_date,
        total_cases,
        total_calls,
        total_messages,
        total_ptps,
        ptps_kept,
        collection_amount,
        collection_rate,
        contact_rate,
        ptp_keep_rate
    )
    SELECT 
        co.officer_id,
        CURRENT_DATE as summary_date,
        COUNT(DISTINCT cc.case_id) as total_cases,
        COUNT(DISTINCT CASE WHEN ci.interaction_type = 'CALL' THEN ci.interaction_id END) as total_calls,
        COUNT(DISTINCT CASE WHEN ci.interaction_type IN ('SMS', 'EMAIL') THEN ci.interaction_id END) as total_messages,
        COUNT(DISTINCT ptp.ptp_id) as total_ptps,
        COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END) as ptps_kept,
        COALESCE(SUM(p.payment_amount), 0) as collection_amount,
        CASE 
            WHEN SUM(cc.overdue_amount) > 0 
            THEN (SUM(p.payment_amount) / SUM(cc.overdue_amount) * 100)
            ELSE 0 
        END as collection_rate,
        CASE 
            WHEN COUNT(DISTINCT ci.case_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ci.response_received = true THEN ci.case_id END)::DECIMAL / COUNT(DISTINCT ci.case_id) * 100)
            ELSE 0 
        END as contact_rate,
        CASE 
            WHEN COUNT(DISTINCT ptp.ptp_id) > 0 
            THEN (COUNT(DISTINCT CASE WHEN ptp.status = 'KEPT' THEN ptp.ptp_id END)::DECIMAL / COUNT(DISTINCT ptp.ptp_id) * 100)
            ELSE 0 
        END as ptp_keep_rate
    FROM collection_officers co
    LEFT JOIN collection_cases cc ON cc.officer_id = co.officer_id
    LEFT JOIN collection_interactions ci ON ci.officer_id = co.officer_id 
        AND DATE(ci.interaction_datetime) = CURRENT_DATE
    LEFT JOIN promise_to_pay ptp ON ptp.officer_id = co.officer_id 
        AND DATE(ptp.created_at) = CURRENT_DATE
    LEFT JOIN payments p ON p.case_id = cc.case_id 
        AND DATE(p.payment_date) = CURRENT_DATE
    WHERE co.status = 'ACTIVE'
    GROUP BY co.officer_id
    ON CONFLICT (officer_id, summary_date) 
    DO UPDATE SET
        total_cases = EXCLUDED.total_cases,
        total_calls = EXCLUDED.total_calls,
        total_messages = EXCLUDED.total_messages,
        total_ptps = EXCLUDED.total_ptps,
        ptps_kept = EXCLUDED.ptps_kept,
        collection_amount = EXCLUDED.collection_amount,
        collection_rate = EXCLUDED.collection_rate,
        contact_rate = EXCLUDED.contact_rate,
        ptp_keep_rate = EXCLUDED.ptp_keep_rate,
        updated_at = CURRENT_TIMESTAMP;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Insert sample data for officer performance summary
INSERT INTO officer_performance_summary (
    officer_id,
    summary_date,
    total_cases,
    total_calls,
    total_messages,
    total_ptps,
    ptps_kept,
    collection_amount,
    collection_rate,
    contact_rate,
    ptp_keep_rate
)
SELECT 
    officer_id,
    CURRENT_DATE,
    FLOOR(RANDOM() * 50 + 10),
    FLOOR(RANDOM() * 100 + 20),
    FLOOR(RANDOM() * 50 + 10),
    FLOOR(RANDOM() * 20 + 5),
    FLOOR(RANDOM() * 15 + 2),
    FLOOR(RANDOM() * 500000 + 100000),
    FLOOR(RANDOM() * 30 + 50),
    FLOOR(RANDOM() * 40 + 40),
    FLOOR(RANDOM() * 30 + 60)
FROM collection_officers
WHERE status = 'ACTIVE'
ON CONFLICT (officer_id, summary_date) DO NOTHING;

-- Optional: Create a scheduled job to update performance summary daily (if using pg_cron)
-- SELECT cron.schedule('update-officer-performance', '0 1 * * *', 'SELECT update_officer_performance_summary();');

-- Verify the setup
SELECT 'Tables created successfully!' as message;
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('customers', 'collection_officers', 'collection_cases', 
                   'collection_interactions', 'promise_to_pay', 'payments', 
                   'officer_performance_summary')
ORDER BY table_name;