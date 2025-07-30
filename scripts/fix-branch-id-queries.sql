-- Fix branch_id issue in loan_accounts table
-- Add branch_id column to loan_accounts table to match the queries

-- Check if column exists before adding
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'branch_id'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts 
        ADD COLUMN branch_id character varying(10);
        
        -- Update branch_id based on loan_applications table
        UPDATE kastle_banking.loan_accounts la
        SET branch_id = lap.branch_id
        FROM kastle_banking.loan_applications lap
        WHERE la.application_id = lap.application_id
        AND lap.branch_id IS NOT NULL;
        
        -- For any remaining null values, set a default branch
        UPDATE kastle_banking.loan_accounts
        SET branch_id = 'BR001'
        WHERE branch_id IS NULL;
        
        RAISE NOTICE 'branch_id column added successfully to loan_accounts table';
    ELSE
        RAISE NOTICE 'branch_id column already exists in loan_accounts table';
    END IF;
END $$;