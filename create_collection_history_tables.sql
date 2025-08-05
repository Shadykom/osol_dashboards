-- Create tables for collection case historical data
-- These tables will store all historical information related to collection cases

-- Table for storing collection payments history
CREATE TABLE IF NOT EXISTS kastle_banking.collection_payments (
    payment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES kastle_banking.collection_cases(case_id),
    amount DECIMAL(15,2) NOT NULL,
    payment_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(50),
    reference_number VARCHAR(100),
    status VARCHAR(20) DEFAULT 'PENDING',
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID,
    CONSTRAINT check_payment_status CHECK (status IN ('PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED'))
);

-- Table for storing field visits history
CREATE TABLE IF NOT EXISTS kastle_banking.field_visits (
    visit_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES kastle_banking.collection_cases(case_id),
    officer_id UUID REFERENCES kastle_banking.collection_officers(officer_id),
    visit_date TIMESTAMP NOT NULL,
    visit_status VARCHAR(50),
    address TEXT,
    amount_collected DECIMAL(15,2) DEFAULT 0,
    notes TEXT,
    photos JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing legal actions history
CREATE TABLE IF NOT EXISTS kastle_banking.legal_actions (
    action_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES kastle_banking.collection_cases(case_id),
    action_type VARCHAR(100) NOT NULL,
    action_date TIMESTAMP NOT NULL,
    status VARCHAR(50),
    description TEXT,
    next_hearing_date TIMESTAMP,
    initiated_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for storing case status change history
CREATE TABLE IF NOT EXISTS kastle_banking.case_status_history (
    history_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES kastle_banking.collection_cases(case_id),
    from_status VARCHAR(50),
    to_status VARCHAR(50) NOT NULL,
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by VARCHAR(255),
    reason TEXT
);

-- Table for storing case assignment history
CREATE TABLE IF NOT EXISTS kastle_banking.case_assignment_history (
    assignment_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    case_id UUID NOT NULL REFERENCES kastle_banking.collection_cases(case_id),
    officer_id UUID REFERENCES kastle_banking.collection_officers(officer_id),
    assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    assigned_by VARCHAR(255),
    reason TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_collection_payments_case_id ON kastle_banking.collection_payments(case_id);
CREATE INDEX IF NOT EXISTS idx_collection_payments_payment_date ON kastle_banking.collection_payments(payment_date);
CREATE INDEX IF NOT EXISTS idx_field_visits_case_id ON kastle_banking.field_visits(case_id);
CREATE INDEX IF NOT EXISTS idx_field_visits_visit_date ON kastle_banking.field_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_legal_actions_case_id ON kastle_banking.legal_actions(case_id);
CREATE INDEX IF NOT EXISTS idx_case_status_history_case_id ON kastle_banking.case_status_history(case_id);
CREATE INDEX IF NOT EXISTS idx_case_assignment_history_case_id ON kastle_banking.case_assignment_history(case_id);

-- Add RLS policies for security
ALTER TABLE kastle_banking.collection_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.field_visits ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.legal_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.case_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.case_assignment_history ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your security requirements)
CREATE POLICY "Enable read access for all users" ON kastle_banking.collection_payments FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON kastle_banking.field_visits FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON kastle_banking.legal_actions FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON kastle_banking.case_status_history FOR SELECT USING (true);
CREATE POLICY "Enable read access for all users" ON kastle_banking.case_assignment_history FOR SELECT USING (true);

-- Sample data for testing (optional)
-- Uncomment below to insert sample data

/*
-- Insert sample payment history
INSERT INTO kastle_banking.collection_payments (case_id, amount, payment_date, payment_method, reference_number, status, notes)
SELECT 
    case_id,
    (RANDOM() * 5000 + 500)::DECIMAL(15,2),
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days'),
    CASE (RANDOM() * 3)::INT 
        WHEN 0 THEN 'CASH'
        WHEN 1 THEN 'BANK_TRANSFER'
        ELSE 'ONLINE'
    END,
    'REF-' || LPAD((RANDOM() * 999999)::INT::TEXT, 6, '0'),
    'CONFIRMED',
    'Payment received via ' || CASE (RANDOM() * 3)::INT 
        WHEN 0 THEN 'branch visit'
        WHEN 1 THEN 'online portal'
        ELSE 'field collection'
    END
FROM kastle_banking.collection_cases
WHERE RANDOM() < 0.3
LIMIT 100;

-- Insert sample field visits
INSERT INTO kastle_banking.field_visits (case_id, officer_id, visit_date, visit_status, address, amount_collected, notes)
SELECT 
    cc.case_id,
    cc.assigned_to,
    CURRENT_TIMESTAMP - (RANDOM() * INTERVAL '30 days'),
    CASE (RANDOM() * 3)::INT 
        WHEN 0 THEN 'SUCCESSFUL'
        WHEN 1 THEN 'CUSTOMER_NOT_AVAILABLE'
        ELSE 'PARTIAL_COLLECTION'
    END,
    'Sample address for testing',
    CASE WHEN RANDOM() < 0.5 THEN (RANDOM() * 2000 + 100)::DECIMAL(15,2) ELSE 0 END,
    'Visit notes: ' || CASE (RANDOM() * 3)::INT 
        WHEN 0 THEN 'Customer promised to pay next week'
        WHEN 1 THEN 'Customer not at home'
        ELSE 'Partial payment collected'
    END
FROM kastle_banking.collection_cases cc
WHERE cc.assigned_to IS NOT NULL AND RANDOM() < 0.2
LIMIT 50;

-- Insert sample status changes
INSERT INTO kastle_banking.case_status_history (case_id, from_status, to_status, changed_by, reason)
SELECT 
    case_id,
    'ACTIVE',
    CASE (RANDOM() * 2)::INT 
        WHEN 0 THEN 'LEGAL'
        ELSE 'RESOLVED'
    END,
    'System',
    'Status changed due to ' || CASE (RANDOM() * 2)::INT 
        WHEN 0 THEN 'escalation to legal department'
        ELSE 'payment settlement'
    END
FROM kastle_banking.collection_cases
WHERE RANDOM() < 0.1
LIMIT 20;
*/