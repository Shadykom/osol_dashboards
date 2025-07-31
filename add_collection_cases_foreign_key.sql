-- Add foreign key constraint between collection_cases and loan_accounts
-- This will establish the relationship that PostgREST is looking for

-- First, let's check if there are any orphaned records that would prevent the foreign key creation
SELECT cc.case_id, cc.loan_account_number 
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la ON cc.loan_account_number = la.loan_account_number
WHERE cc.loan_account_number IS NOT NULL 
  AND la.loan_account_number IS NULL;

-- If the above query returns no results, proceed with adding the foreign key
-- Otherwise, you'll need to clean up the orphaned records first

-- Add the foreign key constraint
ALTER TABLE kastle_banking.collection_cases
ADD CONSTRAINT fk_collection_cases_loan_accounts
FOREIGN KEY (loan_account_number) 
REFERENCES kastle_banking.loan_accounts(loan_account_number)
ON DELETE RESTRICT
ON UPDATE CASCADE;

-- Create an index on the foreign key column for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_loan_account_number 
ON kastle_banking.collection_cases(loan_account_number);

-- Verify the constraint was created
SELECT 
    tc.constraint_name,
    tc.table_schema,
    tc.table_name,
    kcu.column_name,
    ccu.table_schema AS foreign_table_schema,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
    AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
    AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'kastle_banking'
    AND tc.table_name = 'collection_cases'
    AND kcu.column_name = 'loan_account_number';