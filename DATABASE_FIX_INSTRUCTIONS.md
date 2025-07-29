# Database Fix Instructions

## Overview
The application is experiencing database errors because:
1. Missing tables in the `kastle_banking` schema
2. Missing foreign key relationships
3. Missing columns in tables

## Quick Fix

### Option 1: Run the SQL Script Directly in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb
2. Navigate to the SQL Editor
3. Copy and paste the contents of `db-schema-fix.sql` 
4. Click "Run" to execute the script

### Option 2: Run the Node.js Script

1. Ensure you're connected to the internet
2. Run the following command:
   ```bash
   node apply-db-fixes.js
   ```

## What the Fix Does

The script will:

1. **Create the `kastle_banking` schema** (if it doesn't exist)
2. **Create missing tables**:
   - `collection_teams`
   - `collection_officers` 
   - `branches`
   - `officer_performance_metrics`
   - `collection_cases`

3. **Add proper foreign key relationships**:
   - `collection_officers.team_id` → `collection_teams.team_id`
   - `officer_performance_metrics.officer_id` → `collection_officers.officer_id`
   - `collection_cases.assigned_officer_id` → `collection_officers.officer_id`

4. **Insert sample data** for testing

## Important Configuration

### Ensure Schema is Exposed in Supabase

1. Go to: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/settings/api
2. Under "Exposed schemas", make sure `kastle_banking` is included
3. If not, add it and save

### PostgREST Schema Cache

After running the fixes, the PostgREST schema cache needs to be refreshed. This happens automatically with the `NOTIFY pgrst, 'reload schema'` command in the script.

If issues persist:
1. Wait 1-2 minutes for the cache to refresh
2. Or restart your application

## Verify the Fix

After applying the fixes, you should see:
- No more 400 errors about missing relationships
- No more errors about missing columns
- The application should load data properly

## Troubleshooting

### If you still see errors:

1. **Check if tables were created**:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'kastle_banking';
   ```

2. **Check foreign keys**:
   ```sql
   SELECT
     tc.table_name,
     kcu.column_name,
     ccu.table_name AS foreign_table_name
   FROM information_schema.table_constraints AS tc
   JOIN information_schema.key_column_usage AS kcu
     ON tc.constraint_name = kcu.constraint_name
   JOIN information_schema.constraint_column_usage AS ccu
     ON ccu.constraint_name = tc.constraint_name
   WHERE tc.constraint_type = 'FOREIGN KEY'
     AND tc.table_schema = 'kastle_banking';
   ```

3. **Clear browser cache** and reload the application

## Error Details Explained

### Error 1: "Could not find a relationship between 'collection_officers' and 'collection_teams'"
- **Cause**: Missing foreign key constraint `collection_officers_team_id_fkey`
- **Fix**: The script creates this relationship

### Error 2: "Could not find the 'branch_code' column of 'branches'"
- **Cause**: The `branches` table was missing or didn't have the `branch_code` column
- **Fix**: The script creates the table with all required columns

### Error 3: 400 Bad Request on officer_performance_metrics
- **Cause**: Table didn't exist
- **Fix**: The script creates this table with proper structure

## Next Steps

After fixing the database:
1. Refresh your application
2. The dashboard should load without errors
3. You can start using the collection management features