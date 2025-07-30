-- Essential Database Alterations
-- Copy and paste this into your Supabase SQL editor

-- 1. Add branch_id column to loan_accounts table (REQUIRED)
ALTER TABLE kastle_banking.loan_accounts 
ADD COLUMN IF NOT EXISTS branch_id character varying(10);

-- 2. Update branch_id values from loan_applications
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

-- 4. Add foreign key constraints (RECOMMENDED)
ALTER TABLE kastle_banking.loan_accounts
ADD CONSTRAINT loan_accounts_branch_id_fkey
FOREIGN KEY (branch_id)
REFERENCES kastle_banking.branches(branch_id);

ALTER TABLE kastle_banking.accounts
ADD CONSTRAINT accounts_account_type_id_fkey
FOREIGN KEY (account_type_id)
REFERENCES kastle_banking.account_types(type_id);

-- 5. Create indexes for better performance (RECOMMENDED)
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