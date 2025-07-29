# Database Schema Fixes Documentation

## Overview
This document describes the database schema issues found and the fixes applied to resolve them.

## Issues Identified

### 1. Column Naming Mismatches
- **Issue**: The code expects `loan_amount` but the database has `principal_amount` in the `loan_accounts` table
- **Fix**: Added a generated column `loan_amount` that references `principal_amount`

### 2. Duplicate Tables Across Schemas
- **Issue**: Tables exist in multiple schemas (kastle_banking, kastle_collection, public):
  - `collection_officers`
  - `collection_interactions`
  - `promise_to_pay`
  - `officer_performance_summary`
- **Fix**: Created unified views in `kastle_banking` schema that consolidate data from all schemas

### 3. Missing Columns
- **Issue**: Some tables were missing columns expected by the application
- **Fix**: Added missing columns with appropriate data types

### 4. Schema References
- **Issue**: Code was referencing tables in wrong schemas
- **Fix**: Updated table references to use views that consolidate data

## How to Apply the Fixes

### Step 1: Run the Migration Script
Execute the migration script in your Supabase SQL editor:

```bash
# The script is located at:
scripts/fix_database_schema.sql
```

### Step 2: Verify the Changes
Run these queries to verify the fixes:

```sql
-- Check if loan_amount column exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'loan_accounts' 
AND column_name = 'loan_amount';

-- Check if views were created
SELECT viewname 
FROM pg_views 
WHERE schemaname = 'kastle_banking' 
AND viewname LIKE 'v_%';

-- Test the views
SELECT COUNT(*) FROM kastle_banking.v_collection_officers;
SELECT COUNT(*) FROM kastle_banking.v_collection_interactions;
SELECT COUNT(*) FROM kastle_banking.v_promise_to_pay;
SELECT COUNT(*) FROM kastle_banking.v_officer_performance_summary;
```

### Step 3: Update Environment Configuration
Ensure your Supabase configuration includes the `kastle_banking` schema:

1. Go to your Supabase project settings
2. Navigate to API settings
3. Add `kastle_banking` to the exposed schemas list
4. Save the changes

### Step 4: Restart Your Application
After applying the database changes:

```bash
# Restart your development server
npm run dev
# or
pnpm dev
```

## Code Changes Applied

### 1. Updated `src/lib/supabase.js`
- Changed table references to use the new views:
  - `collection_officers` → `v_collection_officers`
  - `collection_interactions` → `v_collection_interactions`
  - `promise_to_pay` → `v_promise_to_pay`
  - `officer_performance_summary` → `v_officer_performance_summary`

### 2. Database Migration Script
Created `scripts/fix_database_schema.sql` that:
- Adds missing columns
- Creates unified views
- Sets up proper permissions
- Creates indexes for performance
- Enables Row Level Security (RLS)

## Benefits of These Fixes

1. **Data Consistency**: Views ensure consistent data access regardless of which schema contains the data
2. **Backward Compatibility**: Existing data in all schemas remains accessible
3. **Performance**: Added indexes improve query performance
4. **Security**: RLS policies ensure proper data access control
5. **Maintainability**: Centralized views make future updates easier

## Troubleshooting

### If you get "relation does not exist" errors:
1. Ensure the migration script ran successfully
2. Check that the schema is exposed in Supabase settings
3. Verify the views were created using the queries above

### If you get permission errors:
1. Run the GRANT statements in the migration script again
2. Ensure your Supabase anon key has the correct permissions

### If data seems missing:
1. Check that data exists in the source tables
2. Verify the view definitions are correct
3. Look for any WHERE clauses that might filter data

## Future Considerations

1. **Data Migration**: Consider migrating all data to a single schema to simplify the structure
2. **Remove Duplicates**: Once stable, remove duplicate tables to avoid confusion
3. **Update Foreign Keys**: Ensure all foreign key relationships point to the correct tables
4. **Performance Monitoring**: Monitor query performance and add indexes as needed