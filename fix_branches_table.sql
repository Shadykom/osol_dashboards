-- Fix branches table structure
-- This script adds a unique constraint on branch_code and fixes the branch_id issue

-- First, check if branch_code has a unique constraint
DO $$
BEGIN
    -- Add unique constraint on branch_code if it doesn't exist
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'branches_branch_code_key' 
        AND connamespace = 'kastle_banking'::regnamespace
    ) THEN
        ALTER TABLE kastle_banking.branches 
        ADD CONSTRAINT branches_branch_code_key UNIQUE (branch_code);
        RAISE NOTICE 'Added unique constraint on branch_code';
    ELSE
        RAISE NOTICE 'Unique constraint on branch_code already exists';
    END IF;
END $$;

-- Update any existing branches without branch_id
UPDATE kastle_banking.branches
SET branch_id = branch_code
WHERE branch_id IS NULL OR branch_id = '';

-- Show current branches
SELECT branch_id, branch_code, branch_name, branch_type, is_active
FROM kastle_banking.branches
ORDER BY branch_code;