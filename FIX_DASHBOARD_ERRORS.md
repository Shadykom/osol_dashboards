# Dashboard Error Fixes Guide

## Overview

This guide addresses the following dashboard errors:
1. **404 Error**: `collection_cases_detailed` view not found
2. **400 Error**: `collection_teams.branch_id` column does not exist
3. **409 Errors**: Duplicate key violations for customers and accounts (these are handled gracefully)
4. **PDF Loading Error**: PDF worker file not loading correctly

## Quick Fix

### Option 1: Run the SQL Script in Supabase

1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Copy and paste the contents of `fix_dashboard_errors.sql`
4. Click "Run" to execute the script

### Option 2: Use the Shell Script (if you have psql installed)

```bash
./apply_dashboard_fixes.sh
```

## What the Fix Does

### 1. Adds Missing Columns
- Adds `branch_id` column to `collection_teams` table
- Adds `is_active` column to `collection_teams` table
- Creates proper foreign key relationships

### 2. Creates Missing Views
- Creates `collection_cases_detailed` view in both schemas
- Includes all necessary joins for loan, customer, and officer data
- Adds calculated `priority` field based on days past due

### 3. Updates Data
- Assigns branches to collection teams
- Sets all teams as active by default

### 4. Performance Optimizations
- Creates indexes on frequently queried columns
- Disables Row Level Security (RLS) for better performance

## Manual Steps (if needed)

### Check Current Schema
```sql
SELECT schema_name 
FROM information_schema.schemata 
WHERE schema_name IN ('kastle_banking', 'kastle_collection');
```

### Verify Tables Exist
```sql
SELECT table_schema, table_name
FROM information_schema.tables
WHERE table_schema IN ('kastle_banking', 'kastle_collection')
AND table_name IN ('collection_teams', 'collection_cases', 'collection_officers')
ORDER BY table_schema, table_name;
```

### Check if Fixes Were Applied
```sql
-- Check collection_teams columns
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_schema = 'kastle_banking' 
AND table_name = 'collection_teams'
ORDER BY ordinal_position;

-- Check if view exists
SELECT * 
FROM information_schema.views
WHERE table_schema = 'kastle_banking'
AND table_name = 'collection_cases_detailed';
```

## About the 409 Errors

The 409 (Conflict) errors for customers and accounts are **expected behavior** when the application tries to insert sample data that already exists. The code handles these gracefully by:
- Using `upsert` with `onConflict` to avoid actual errors
- Logging "already exist" messages instead of failing
- Continuing with the rest of the initialization

These are not actual errors and can be safely ignored.

## PDF Worker Error

The PDF worker error occurs when the PDF.js library tries to load its worker file. The application has fallback mechanisms:
1. First tries to load from `/pdf-worker/pdf.worker.min.js`
2. Falls back to CDN if local file fails

This error doesn't prevent PDFs from loading - it just means the worker is loaded from CDN instead of locally.

## Troubleshooting

### If errors persist after running the fix:

1. **Clear browser cache**
   - Hard refresh: Ctrl+Shift+R (Windows/Linux) or Cmd+Shift+R (Mac)

2. **Check Supabase logs**
   - Go to Supabase Dashboard > Logs > API logs
   - Look for any SQL errors

3. **Verify permissions**
   ```sql
   -- Check table permissions
   SELECT grantee, privilege_type
   FROM information_schema.role_table_grants
   WHERE table_schema = 'kastle_banking'
   AND table_name IN ('collection_teams', 'collection_cases_detailed');
   ```

4. **Re-run the fix script**
   - The script is idempotent (safe to run multiple times)

## Prevention

To prevent these issues in the future:
1. Always run database migrations before deploying
2. Keep schema definitions in sync across environments
3. Use proper error handling for expected scenarios (like duplicate data)

## Support

If you continue to experience issues:
1. Check the browser console for specific error messages
2. Review the Supabase logs for database errors
3. Ensure all environment variables are correctly set
4. Verify database connection and permissions