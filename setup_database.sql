-- Create kastle_banking schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Set search path
SET search_path TO kastle_banking;

-- Create customers table
CREATE TABLE IF NOT EXISTS customers (
    customer_id VARCHAR(50) PRIMARY KEY,
    first_name VARCHAR(100) NOT NULL,
    middle_name VARCHAR(100),
    last_name VARCHAR(100) NOT NULL,
    full_name VARCHAR(300),
    email VARCHAR(255),
    phone VARCHAR(50),
    date_of_birth DATE,
    gender VARCHAR(20),
    nationality VARCHAR(100),
    segment VARCHAR(50) DEFAULT 'RETAIL',
    kyc_status VARCHAR(50) DEFAULT 'PENDING',
    risk_category VARCHAR(50) DEFAULT 'LOW',
    annual_income DECIMAL(15,2),
    employment_status VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_customers_segment ON customers(segment);
CREATE INDEX IF NOT EXISTS idx_customers_kyc_status ON customers(kyc_status);
CREATE INDEX IF NOT EXISTS idx_customers_full_name ON customers(full_name);
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);

-- Insert sample customers
INSERT INTO customers (customer_id, first_name, middle_name, last_name, full_name, email, phone, date_of_birth, gender, nationality, segment, kyc_status, risk_category, annual_income, employment_status)
VALUES 
    ('CUST001', 'Ahmed', 'Mohammed', 'Al-Rashid', 'Ahmed Mohammed Al-Rashid', 'ahmed.rashid@email.com', '+966501234567', '1985-03-15', 'Male', 'Saudi Arabian', 'RETAIL', 'APPROVED', 'LOW', 75000.00, 'Employed'),
    ('CUST002', 'Fatima', NULL, 'Al-Zahrani', 'Fatima Al-Zahrani', 'fatima.zahrani@email.com', '+966502345678', '1990-07-22', 'Female', 'Saudi Arabian', 'PREMIUM', 'APPROVED', 'MEDIUM', 120000.00, 'Employed'),
    ('CUST003', 'Khalid', 'Abdullah', 'Al-Otaibi', 'Khalid Abdullah Al-Otaibi', 'khalid.otaibi@email.com', '+966503456789', '1978-11-30', 'Male', 'Saudi Arabian', 'HNI', 'APPROVED', 'LOW', 500000.00, 'Business Owner'),
    ('CUST004', 'Nora', NULL, 'Al-Harbi', 'Nora Al-Harbi', 'nora.harbi@email.com', '+966504567890', '1995-05-18', 'Female', 'Saudi Arabian', 'RETAIL', 'PENDING', 'LOW', 45000.00, 'Employed'),
    ('CUST005', 'Omar', 'Ibrahim', 'Al-Ghamdi', 'Omar Ibrahim Al-Ghamdi', 'omar.ghamdi@email.com', '+966505678901', '1982-09-25', 'Male', 'Saudi Arabian', 'CORPORATE', 'APPROVED', 'HIGH', 1000000.00, 'CEO')
ON CONFLICT (customer_id) DO NOTHING;

-- Grant permissions
GRANT ALL ON SCHEMA kastle_banking TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO anon;
GRANT ALL ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon;