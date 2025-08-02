# Console Errors Fix Guide

## Overview
This guide addresses the console errors found in your Osol Dashboard application, specifically:
1. Missing `branch_id` column in `collection_teams` table
2. Realtime subscription errors for collection tables

## Errors Identified

### 1. Database Column Error
```
Officer performance error: 
Object { code: "42703", details: null, hint: null, message: "column collection_teams.branch_id does not exist" }
```

**Root Cause**: The `collection_teams` table in the `kastle_banking` schema is missing the `branch_id` column that the application expects.

### 2. Realtime Subscription Errors
```
System event: 
Object { message: '{:error, "Unable to subscribe to changes with given parameters. 
Please check Realtime is enabled for the given connect parameters: 
[event: *, schema: kastle_banking, table: collection_cases]"}', status: "error", ... }
```

**Root Cause**: Realtime is not enabled for the `collection_cases` and `branch_collection_performance` tables in Supabase.

## Fix Instructions

### Step 1: Fix the Missing branch_id Column

1. **Run the SQL fix script**:
   ```bash
   ./run_collection_teams_fix.sh
   ```

   This script will:
   - Add the `branch_id` column to `collection_teams` table
   - Add foreign key constraint to `branches` table
   - Add `is_active` column if it doesn't exist
   - Create an index on `branch_id` for performance

2. **Alternative: Run SQL directly in Supabase**:
   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Run the contents of `fix_collection_teams_branch_id.sql`

### Step 2: Enable Realtime for Collection Tables

1. **Via Supabase Dashboard (Recommended)**:
   - Go to your Supabase project dashboard
   - Navigate to Database > Replication
   - Enable replication for these tables:
     - `kastle_banking.collection_cases`
     - `kastle_banking.branch_collection_performance`

2. **Via SQL Script**:
   ```bash
   psql "$SUPABASE_DB_URL" -f enable_realtime_tables.sql
   ```

### Step 3: Verify the Fixes

1. **Check the column exists**:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_schema = 'kastle_banking' 
   AND table_name = 'collection_teams'
   AND column_name = 'branch_id';
   ```

2. **Verify Realtime is enabled**:
   - Check in Supabase Dashboard under Database > Replication
   - The tables should show as enabled for replication

### Step 4: Clear Browser Cache and Reload

1. Clear your browser cache
2. Reload the application
3. Check the console for errors

## Additional Notes

### Schema Consistency
The application uses the `kastle_banking` schema for all tables, including collection-related tables. This is configured in `/workspace/src/lib/supabase.js`:

```javascript
// The supabaseCollection client now also points to kastle_banking schema
export const supabaseCollection = supabaseBanking;
```

### Multiple GoTrueClient Warning
The warning about "Multiple GoTrueClient instances" is not critical but indicates that multiple Supabase clients are being initialized. This is expected behavior in the current setup but doesn't affect functionality.

## Files Created/Modified

1. **fix_collection_teams_branch_id.sql** - SQL script to add missing column
2. **run_collection_teams_fix.sh** - Shell script to run the fix
3. **enable_realtime_tables.sql** - SQL script to enable Realtime
4. **CONSOLE_ERRORS_FIX_GUIDE.md** - This guide

## Testing

After applying the fixes, test the following:

1. Navigate to Reports section
2. Check Branch Performance reports
3. Verify no console errors appear
4. Check that collection data loads properly

## Troubleshooting

If errors persist:

1. **Check database connection**:
   - Verify Supabase URL and keys are correct
   - Check network connectivity

2. **Verify table existence**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'kastle_banking' 
   AND table_name IN ('collection_teams', 'collection_cases', 'branches');
   ```

3. **Check foreign key constraints**:
   - Ensure `branches` table exists and has data
   - Verify `branch_id` values are valid

## Contact Support

If you continue to experience issues after following this guide, please provide:
- Console error messages
- Browser and version
- Steps to reproduce the issue