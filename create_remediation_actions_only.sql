-- Create remediation_actions table only
-- This is a minimal script to create just the missing table

-- Ensure schema exists
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Grant basic permissions
GRANT USAGE ON SCHEMA kastle_banking TO authenticated;
GRANT CREATE ON SCHEMA kastle_banking TO authenticated;

-- Create the remediation_actions table
CREATE TABLE kastle_banking.remediation_actions (
    action_id SERIAL PRIMARY KEY,
    case_id INTEGER,
    action_type VARCHAR(50) NOT NULL,
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

-- Grant permissions on the table
GRANT ALL ON TABLE kastle_banking.remediation_actions TO authenticated;
GRANT ALL ON SEQUENCE kastle_banking.remediation_actions_action_id_seq TO authenticated;

-- Verify table was created
SELECT 
    'remediation_actions' as table_name,
    EXISTS(
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'remediation_actions'
    ) as created_successfully;