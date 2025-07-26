-- Create necessary tables for collection system

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

-- Insert sample data for testing
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