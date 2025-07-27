-- Fix PostgREST relationship issue between collection_cases and loan_accounts
-- This script will establish the foreign key relationship that PostgREST needs

-- Step 1: First, check for any data integrity issues
DO $$
DECLARE
    orphaned_count INTEGER;
BEGIN
    -- Count orphaned records
    SELECT COUNT(*) INTO orphaned_count
    FROM kastle_banking.collection_cases cc
    WHERE cc.loan_account_number IS NOT NULL 
      AND NOT EXISTS (
          SELECT 1 FROM kastle_banking.loan_accounts la 
          WHERE la.loan_account_number = cc.loan_account_number
      );
    
    IF orphaned_count > 0 THEN
        RAISE NOTICE 'Found % orphaned loan_account_number references in collection_cases', orphaned_count;
        RAISE NOTICE 'You need to clean these up before creating the foreign key';
        
        -- Option 1: Set orphaned references to NULL
        -- UPDATE kastle_banking.collection_cases 
        -- SET loan_account_number = NULL
        -- WHERE loan_account_number IS NOT NULL 
        --   AND NOT EXISTS (
        --       SELECT 1 FROM kastle_banking.loan_accounts la 
        --       WHERE la.loan_account_number = collection_cases.loan_account_number
        --   );
        
        -- Option 2: Delete orphaned records (uncomment if appropriate)
        -- DELETE FROM kastle_banking.collection_cases 
        -- WHERE loan_account_number IS NOT NULL 
        --   AND NOT EXISTS (
        --       SELECT 1 FROM kastle_banking.loan_accounts la 
        --       WHERE la.loan_account_number = collection_cases.loan_account_number
        --   );
        
        RAISE EXCEPTION 'Cannot create foreign key due to orphaned records. Please clean up the data first.';
    ELSE
        RAISE NOTICE 'No orphaned records found. Proceeding with foreign key creation.';
    END IF;
END $$;

-- Step 2: Create the foreign key constraint
ALTER TABLE kastle_banking.collection_cases
ADD CONSTRAINT fk_collection_cases_loan_accounts
FOREIGN KEY (loan_account_number) 
REFERENCES kastle_banking.loan_accounts(loan_account_number)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Step 3: Create an index for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_loan_account_number 
ON kastle_banking.collection_cases(loan_account_number)
WHERE loan_account_number IS NOT NULL;

-- Step 4: Add a comment to help PostgREST understand the relationship
COMMENT ON CONSTRAINT fk_collection_cases_loan_accounts ON kastle_banking.collection_cases IS 
'@foreignKey (loan_account_number) references kastle_banking.loan_accounts(loan_account_number)|@fieldName loanAccount';

-- Step 5: Refresh PostgREST schema cache
-- Note: This requires appropriate permissions and PostgREST configuration
-- You may need to restart PostgREST or call the reload endpoint
-- NOTIFY pgrst, 'reload schema';

-- Step 6: Verify the relationship was created
SELECT 
    'Foreign Key Created' as status,
    tc.constraint_name,
    tc.table_schema || '.' || tc.table_name as source_table,
    kcu.column_name as source_column,
    ccu.table_schema || '.' || ccu.table_name as target_table,
    ccu.column_name as target_column
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_name = 'fk_collection_cases_loan_accounts';

-- Step 7: Test the relationship with a sample query
-- This is how PostgREST would join the tables
SELECT 
    cc.case_id,
    cc.case_number,
    cc.loan_account_number,
    cc.total_outstanding,
    la.principal_amount,
    la.outstanding_principal,
    la.loan_status
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la 
    ON cc.loan_account_number = la.loan_account_number
WHERE cc.loan_account_number IS NOT NULL
LIMIT 5;