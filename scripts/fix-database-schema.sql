-- Fix Database Schema Script
-- This script adds missing columns that the application expects

-- Add branch_code column to branches table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'branches' 
        AND column_name = 'branch_code'
    ) THEN
        ALTER TABLE kastle_banking.branches 
        ADD COLUMN branch_code VARCHAR(20) NOT NULL DEFAULT '';
        
        -- Update existing rows to have branch_code same as branch_id
        UPDATE kastle_banking.branches 
        SET branch_code = branch_id 
        WHERE branch_code = '';
    END IF;
END $$;

-- Ensure customer_types table exists with correct structure
CREATE TABLE IF NOT EXISTS kastle_banking.customer_types (
    type_id SERIAL PRIMARY KEY,
    type_code VARCHAR(20) UNIQUE NOT NULL,
    type_name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default customer types if they don't exist
INSERT INTO kastle_banking.customer_types (type_code, type_name, description)
VALUES 
    ('IND', 'Individual', 'Individual customers'),
    ('CORP', 'Corporate', 'Corporate customers'),
    ('SME', 'SME', 'Small and Medium Enterprises')
ON CONFLICT (type_code) DO NOTHING;

-- Ensure customer_contacts table has correct structure
DO $$ 
BEGIN
    -- Check if contact_id column exists and is SERIAL
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'customer_contacts' 
        AND column_name = 'contact_id'
    ) THEN
        -- Add contact_id as SERIAL PRIMARY KEY
        ALTER TABLE kastle_banking.customer_contacts 
        ADD COLUMN contact_id SERIAL PRIMARY KEY;
    END IF;
END $$;

-- Grant necessary permissions
GRANT ALL ON TABLE kastle_banking.branches TO authenticated;
GRANT ALL ON TABLE kastle_banking.customers TO authenticated;
GRANT ALL ON TABLE kastle_banking.customer_contacts TO authenticated;
GRANT ALL ON TABLE kastle_banking.customer_types TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;