-- Fix collection_cases foreign key relationship with collection_officers
-- This fixes the error: "Could not find a relationship between 'collection_cases' and 'assigned_to'"

-- First, check if the foreign key constraint already exists
DO $$
BEGIN
    -- Check if the constraint exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_schema = 'kastle_banking' 
        AND table_name = 'collection_cases' 
        AND constraint_name = 'collection_cases_assigned_to_fkey'
    ) THEN
        -- Add the foreign key constraint
        ALTER TABLE kastle_banking.collection_cases
        ADD CONSTRAINT collection_cases_assigned_to_fkey 
        FOREIGN KEY (assigned_to) 
        REFERENCES kastle_banking.collection_officers(officer_id)
        ON DELETE SET NULL
        ON UPDATE CASCADE;
        
        RAISE NOTICE 'Foreign key constraint added successfully';
    ELSE
        RAISE NOTICE 'Foreign key constraint already exists';
    END IF;
END $$;

-- Create an index on assigned_to for better performance
CREATE INDEX IF NOT EXISTS idx_collection_cases_assigned_to 
ON kastle_banking.collection_cases(assigned_to);

-- Verify the constraint was created
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
    AND tc.table_schema = 'kastle_banking'
    AND tc.table_name = 'collection_cases'
    AND kcu.column_name = 'assigned_to';

-- Grant necessary permissions
GRANT ALL ON kastle_banking.collection_cases TO authenticated;
GRANT ALL ON kastle_banking.collection_officers TO authenticated;

-- Ensure RLS is disabled for both tables
ALTER TABLE kastle_banking.collection_cases DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.collection_officers DISABLE ROW LEVEL SECURITY;

-- Test the relationship by running a simple join query
SELECT 
    cc.case_id,
    cc.case_number,
    cc.assigned_to,
    co.officer_name
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.collection_officers co ON cc.assigned_to = co.officer_id
LIMIT 5;