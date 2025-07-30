-- Complete Database Alterations Script
-- Execute this in your Supabase SQL editor to fix all schema issues

-- 1. Add branch_id column to loan_accounts table
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

-- 2. Add foreign key constraint for account_type_id if not exists
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
        
        RAISE NOTICE 'Foreign key constraint added for account_type_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for account_type_id';
    END IF;
END $$;

-- 3. Add foreign key constraint for loan_accounts.branch_id if not exists
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
        
        RAISE NOTICE 'Foreign key constraint added for loan_accounts.branch_id';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists for loan_accounts.branch_id';
    END IF;
END $$;

-- 4. Create indexes for better query performance
DO $$
BEGIN
    -- Index on loan_accounts.branch_id
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'kastle_banking'
        AND tablename = 'loan_accounts'
        AND indexname = 'idx_loan_accounts_branch_id'
    ) THEN
        CREATE INDEX idx_loan_accounts_branch_id 
        ON kastle_banking.loan_accounts(branch_id);
        
        RAISE NOTICE 'Index created on loan_accounts.branch_id';
    END IF;
    
    -- Index on loan_accounts.loan_status
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'kastle_banking'
        AND tablename = 'loan_accounts'
        AND indexname = 'idx_loan_accounts_loan_status'
    ) THEN
        CREATE INDEX idx_loan_accounts_loan_status 
        ON kastle_banking.loan_accounts(loan_status);
        
        RAISE NOTICE 'Index created on loan_accounts.loan_status';
    END IF;
    
    -- Index on accounts.account_type_id
    IF NOT EXISTS (
        SELECT 1
        FROM pg_indexes
        WHERE schemaname = 'kastle_banking'
        AND tablename = 'accounts'
        AND indexname = 'idx_accounts_account_type_id'
    ) THEN
        CREATE INDEX idx_accounts_account_type_id 
        ON kastle_banking.accounts(account_type_id);
        
        RAISE NOTICE 'Index created on accounts.account_type_id';
    END IF;
END $$;

-- 5. Grant necessary permissions for the application
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO anon;
GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;

-- 6. Enable Row Level Security (RLS) if needed
-- Uncomment these lines if you want to enable RLS
-- ALTER TABLE kastle_banking.accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kastle_banking.loan_accounts ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kastle_banking.customers ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE kastle_banking.transactions ENABLE ROW LEVEL SECURITY;

-- 7. Create RLS policies if RLS is enabled
-- Example policy for accounts table (uncomment if using RLS)
-- CREATE POLICY "Enable read access for all users" ON kastle_banking.accounts
--     FOR SELECT USING (true);
-- CREATE POLICY "Enable insert for authenticated users only" ON kastle_banking.accounts
--     FOR INSERT WITH CHECK (auth.role() = 'authenticated');
-- CREATE POLICY "Enable update for authenticated users only" ON kastle_banking.accounts
--     FOR UPDATE USING (auth.role() = 'authenticated');

-- Verify the changes
SELECT 
    'loan_accounts.branch_id' as change,
    EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'kastle_banking' 
        AND table_name = 'loan_accounts' 
        AND column_name = 'branch_id'
    ) as exists;

-- Summary of changes made
SELECT 'Database alterations completed successfully!' as status;