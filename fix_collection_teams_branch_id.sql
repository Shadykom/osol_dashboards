-- Fix missing branch_id column in collection_teams table
-- This fixes the error: "column collection_teams.branch_id does not exist"

-- Add branch_id column to collection_teams table in kastle_banking schema
ALTER TABLE kastle_banking.collection_teams 
ADD COLUMN IF NOT EXISTS branch_id VARCHAR(50);

-- Add foreign key constraint to branches table
ALTER TABLE kastle_banking.collection_teams
DROP CONSTRAINT IF EXISTS collection_teams_branch_id_fkey;

ALTER TABLE kastle_banking.collection_teams
ADD CONSTRAINT collection_teams_branch_id_fkey 
FOREIGN KEY (branch_id) 
REFERENCES kastle_banking.branches(branch_id)
ON DELETE SET NULL;

-- Update existing teams with a default branch if needed
-- You can customize this based on your business logic
UPDATE kastle_banking.collection_teams
SET branch_id = (
    SELECT branch_id 
    FROM kastle_banking.branches 
    WHERE is_active = true 
    LIMIT 1
)
WHERE branch_id IS NULL;

-- Add index for performance
CREATE INDEX IF NOT EXISTS idx_collection_teams_branch_id 
ON kastle_banking.collection_teams(branch_id);

-- Add is_active column if it doesn't exist (used in the query)
ALTER TABLE kastle_banking.collection_teams 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Verify the changes
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_teams'
ORDER BY ordinal_position;