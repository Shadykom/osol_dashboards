# Dashboard Error Fixes Guide (Updated)

## Overview

This guide addresses the dashboard errors after migrating all tables to the `kastle_banking` schema. The errors include:

1. **404 Error**: `collection_cases_detailed` view not found
2. **400 Error**: `collection_teams.branch_id` column does not exist  
3. **409 Errors**: Duplicate key violations (handled gracefully)
4. **PDF Loading Error**: PDF worker file issue (has fallback)

## Schema Changes

All tables have been consolidated into the `kastle_banking` schema as shown in `osol_full_schema.sql`. The application code has been updated to use this unified schema.

## Quick Fix

### Option 1: Run the Updated SQL Script in Supabase

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix_dashboard_errors_updated.sql`
4. Click "Run" to execute the script

### Option 2: Use the Shell Script

```bash
# First, update the script to use the new SQL file
sed -i 's/fix_dashboard_errors.sql/fix_dashboard_errors_updated.sql/g' apply_dashboard_fixes.sh

# Then run it
./apply_dashboard_fixes.sh
```

## What the Fix Does

### 1. Adds Missing Columns to `kastle_banking.collection_teams`
- Adds `branch_id` column with foreign key to `branches` table
- Adds `is_active` column with default value `true`
- Creates indexes for better query performance

### 2. Creates `collection_cases_detailed` View
- Creates the view in `kastle_banking` schema
- Joins collection cases with loan accounts, products, customers, and officers
- Adds calculated `priority` field based on days past due

### 3. Updates Existing Data
- Assigns branches to collection teams based on team_id
- Sets all teams as active
- Inserts sample teams if none exist

### 4. Performance Optimizations
- Creates indexes on frequently queried columns
- Disables Row Level Security (RLS) for collection tables

## Verification Queries

After running the fix, verify the changes:

```sql
-- Check if columns were added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_teams'
ORDER BY ordinal_position;

-- Check if view exists
SELECT * 
FROM information_schema.views
WHERE table_schema = 'kastle_banking'
AND table_name = 'collection_cases_detailed';

-- Check teams data
SELECT team_id, team_name, branch_id, is_active
FROM kastle_banking.collection_teams
ORDER BY team_id;
```

## Application Code Status

The application code has already been updated to use the unified `kastle_banking` schema:
- `supabaseCollection` now points to `kastle_banking`
- All table references use the `kastle_banking` schema
- No code changes are needed

## About the Errors

### 409 Errors
These are **expected** when inserting duplicate data. The application handles them gracefully:
- Uses `upsert` with `onConflict` to avoid failures
- Logs "already exist" messages
- Continues with initialization

### PDF Worker Error
The PDF.js library has a fallback mechanism:
1. Tries to load from `/pdf-worker/pdf.worker.min.js`
2. Falls back to CDN if local file fails
3. PDFs will still load correctly

## Troubleshooting

If errors persist:

1. **Clear browser cache**
   ```
   Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)
   ```

2. **Check Supabase logs**
   - Dashboard > Logs > API logs
   - Look for SQL errors

3. **Verify the schema**
   ```sql
   -- List all tables in kastle_banking
   SELECT table_name
   FROM information_schema.tables
   WHERE table_schema = 'kastle_banking'
   AND table_type = 'BASE TABLE'
   ORDER BY table_name;
   ```

4. **Re-run the fix**
   - The script is idempotent (safe to run multiple times)

## Next Steps

1. Run `fix_dashboard_errors_updated.sql` in Supabase SQL Editor
2. Refresh your dashboard
3. Check browser console for remaining errors
4. If issues persist, check Supabase logs

The unified schema approach simplifies the database structure and improves maintainability.