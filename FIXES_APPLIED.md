# Database Query Fixes Applied

## Issues Fixed:

### 1. Missing `branch_id` column in `loan_accounts` table
- **Error**: `column loan_accounts.branch_id does not exist`
- **Solution**: Modified queries to join with `loan_applications` table to get branch_id
- **Files modified**:
  - `src/services/dashboardDetailsService.js` - Updated loan query to join with loan_applications
  - `src/pages/Dashboard.jsx` - Updated loan queries to use joined branch_id

### 2. Incorrect `account_type` column references
- **Error**: Queries were using `account_type` but the actual column is `account_type_id` (integer)
- **Solution**: Modified queries to:
  - Join with `account_types` table to get type names and categories
  - Filter by `account_category` instead of direct type comparison
- **Files modified**:
  - `src/pages/Dashboard.jsx` - Fixed account type distribution widget
  - `src/pages/Accounts.jsx` - Fixed account listing and filtering

### 3. SQL Script for Database Fix
- Created `scripts/fix-branch-id-queries.sql` to add the missing `branch_id` column
- This script needs to be executed in the Supabase SQL editor:

```sql
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
```

## Summary:
All queries have been updated to work with the current database schema. The application should now run without the 400 (Bad Request) errors. If you've updated the schema to include the `branch_id` column in `loan_accounts`, the queries will work even more efficiently without the need for joins.