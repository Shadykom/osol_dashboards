# Fixing Database Errors

## Overview

The application is experiencing database schema mismatches between the expected schema and the actual Supabase database. This guide will help you fix these issues.

## Common Errors and Solutions

### 1. Branch Code Error
**Error**: `null value in column "branch_code" of relation "branches" violates not-null constraint`

**Cause**: The live database has a `branch_code` column that is NOT NULL, but the seeding code wasn't providing this value.

**Solution**: Already fixed in the code. The seeding function now includes `branch_code` when inserting branches.

### 2. Customer Types Duplicate Error
**Error**: `duplicate key value violates unique constraint "customer_types_type_code_key"`

**Cause**: Trying to insert customer types that already exist.

**Solution**: Already fixed in the code. The seeding function now checks if customer types exist before inserting.

### 3. Missing Email Column Error
**Error**: `Could not find the 'email' column of 'customers' in the schema cache`

**Cause**: The customers table doesn't have email/phone columns. These are stored in the `customer_contacts` table.

**Solution**: Already fixed in the code. Email and phone are now inserted into the `customer_contacts` table.

## How to Apply the Database Fix

### Option 1: Run the SQL Migration Script

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `scripts/fix-database-schema.sql`
4. Run the script

### Option 2: Manual Database Updates

If you prefer to update manually:

1. **Add branch_code to branches table** (if missing):
   ```sql
   ALTER TABLE kastle_banking.branches 
   ADD COLUMN branch_code VARCHAR(20) NOT NULL DEFAULT '';
   
   UPDATE kastle_banking.branches 
   SET branch_code = branch_id 
   WHERE branch_code = '';
   ```

2. **Ensure customer_types table exists**:
   ```sql
   CREATE TABLE IF NOT EXISTS kastle_banking.customer_types (
       type_id SERIAL PRIMARY KEY,
       type_code VARCHAR(20) UNIQUE NOT NULL,
       type_name VARCHAR(100) NOT NULL,
       description TEXT,
       created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
       updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
   );
   ```

3. **Grant permissions**:
   ```sql
   GRANT ALL ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;
   GRANT USAGE ON ALL SEQUENCES IN SCHEMA kastle_banking TO authenticated;
   ```

## Testing the Fix

1. Open the application in your browser
2. Open the browser console (F12)
3. Click the "Test Database Schema" button on the dashboard
4. Check the console output to see which columns are available
5. Try the "Seed Sample Data" button again

## Browser Extension Errors

The errors related to `window.ethereum` are caused by multiple crypto wallet browser extensions (MetaMask, etc.) trying to inject their providers. These are harmless and can be ignored. The application includes an ethereum conflict resolver to minimize these warnings.

## Additional Debugging

If you continue to experience issues:

1. Check the browser console for specific error messages
2. Use the "Test Database Schema" button to verify table structures
3. Check Supabase logs for any database-related errors
4. Ensure your Supabase anon key and URL are correctly configured

## Environment Variables

Ensure these are set correctly:
- `VITE_SUPABASE_URL`: Your Supabase project URL
- `VITE_SUPABASE_ANON_KEY`: Your Supabase anon key

## Support

If issues persist after following this guide:
1. Check the exact error message in the browser console
2. Verify the database schema matches what the application expects
3. Ensure all migrations have been applied successfully