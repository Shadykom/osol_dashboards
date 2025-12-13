-- Essential Database Alterations
-- Copy and paste this into your Supabase SQL editor
-- This script is idempotent - safe to run multiple times

-- 1. Add branch_id column to loan_accounts table (REQUIRED)
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS branch_id character varying(10);

-- 2. Update branch_id values from loan_applications (only if NULL)
UPDATE kastle_banking.loan_accounts la
SET branch_id = lap.branch_id
FROM kastle_banking.loan_applications lap
WHERE la.application_id = lap.application_id
AND la.branch_id IS NULL
AND lap.branch_id IS NOT NULL;

-- 3. Set default branch_id for remaining NULL values
UPDATE kastle_banking.loan_accounts
SET branch_id = 'BR001'
WHERE branch_id IS NULL;

-- 4. Add foreign key constraint for loan_accounts.branch_id (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'kastle_banking'
        AND table_name = 'loan_accounts'
        AND constraint_name = 'loan_accounts_branch_id_fkey'
    ) THEN
        ALTER TABLE kastle_banking.loan_accounts
        ADD CONSTRAINT loan_accounts_branch_id_fkey
        FOREIGN KEY (branch_id)
        REFERENCES kastle_banking.branches(branch_id);
        RAISE NOTICE 'Foreign key constraint loan_accounts_branch_id_fkey added';
    ELSE
        RAISE NOTICE 'Foreign key constraint loan_accounts_branch_id_fkey already exists';
    END IF;
END $$;

-- 5. Add foreign key constraint for accounts.account_type_id (if not exists)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.table_constraints
        WHERE constraint_type = 'FOREIGN KEY'
        AND table_schema = 'kastle_banking'
        AND table_name = 'accounts'
        AND constraint_name = 'accounts_account_type_id_fkey'
    ) THEN
        ALTER TABLE kastle_banking.accounts
        ADD CONSTRAINT accounts_account_type_id_fkey
        FOREIGN KEY (account_type_id)
        REFERENCES kastle_banking.account_types(type_id);
        RAISE NOTICE 'Foreign key constraint accounts_account_type_id_fkey added';
    ELSE
        RAISE NOTICE 'Foreign key constraint accounts_account_type_id_fkey already exists';
    END IF;
END $$;

-- 6. Create indexes for better performance (IF NOT EXISTS)
CREATE INDEX IF NOT EXISTS idx_loan_accounts_branch_id 
ON kastle_banking.loan_accounts(branch_id);

CREATE INDEX IF NOT EXISTS idx_loan_accounts_loan_status 
ON kastle_banking.loan_accounts(loan_status);

CREATE INDEX IF NOT EXISTS idx_accounts_account_type_id 
ON kastle_banking.accounts(account_type_id);

CREATE INDEX IF NOT EXISTS idx_accounts_account_status
ON kastle_banking.accounts(account_status);

-- Verify the changes
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking'
AND table_name = 'loan_accounts'
AND column_name = 'branch_id';

-- Show success message
DO $$ BEGIN RAISE NOTICE 'Essential database alterations completed successfully!'; END $$;
