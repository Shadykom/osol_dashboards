-- Fix missing tables in kastle_banking schema

-- Ensure collection_officers table exists
CREATE TABLE IF NOT EXISTS kastle_banking.collection_officers (
    officer_id VARCHAR(50) PRIMARY KEY,
    officer_code VARCHAR(20) UNIQUE,
    officer_name VARCHAR(100) NOT NULL,
    officer_type VARCHAR(50),
    team_id VARCHAR(50),
    branch_id VARCHAR(50),
    email VARCHAR(100),
    contact_number VARCHAR(20),
    is_active BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Ensure loan_accounts table exists with correct columns
CREATE TABLE IF NOT EXISTS kastle_banking.loan_accounts (
    loan_id VARCHAR(50) PRIMARY KEY,
    customer_id VARCHAR(50) NOT NULL,
    branch_id VARCHAR(50),
    product_type VARCHAR(50),
    loan_amount DECIMAL(15,2) NOT NULL,
    outstanding_balance DECIMAL(15,2) NOT NULL,
    interest_rate DECIMAL(5,2),
    loan_status VARCHAR(20) DEFAULT 'ACTIVE',
    disbursement_date DATE,
    maturity_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_officers_branch_id ON kastle_banking.collection_officers(branch_id);
CREATE INDEX IF NOT EXISTS idx_collection_officers_is_active ON kastle_banking.collection_officers(is_active);
CREATE INDEX IF NOT EXISTS idx_loan_accounts_loan_status ON kastle_banking.loan_accounts(loan_status);
CREATE INDEX IF NOT EXISTS idx_loan_accounts_branch_id ON kastle_banking.loan_accounts(branch_id);

-- Grant permissions
GRANT ALL ON kastle_banking.collection_officers TO authenticated;
GRANT ALL ON kastle_banking.collection_officers TO anon;
GRANT ALL ON kastle_banking.loan_accounts TO authenticated;
GRANT ALL ON kastle_banking.loan_accounts TO anon;

-- Disable RLS for now
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts DISABLE ROW LEVEL SECURITY;

-- Insert sample data if tables are empty
INSERT INTO kastle_banking.collection_officers (officer_id, officer_code, officer_name, branch_id, is_active)
SELECT 'OFF001', 'OFF001', 'John Doe', 'BR003', true
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.collection_officers LIMIT 1);

INSERT INTO kastle_banking.loan_accounts (loan_id, customer_id, branch_id, product_type, loan_amount, outstanding_balance, loan_status)
SELECT 'LOAN001', 'CUST001', 'BR003', 'Personal Loan', 50000, 45000, 'ACTIVE'
WHERE NOT EXISTS (SELECT 1 FROM kastle_banking.loan_accounts LIMIT 1);