# Dashboard Access Fix Guide

## Problem
The collection/overview dashboard is not showing data due to 401 (Unauthorized) errors when fetching data from Supabase. This is because:

1. The dashboard is trying to fetch data using the anonymous (anon) role
2. Row Level Security (RLS) is enabled on the tables but no policies exist for anonymous access
3. The table names in the code included schema prefixes which caused issues
4. Some collection schema tables might not exist or have different structures

## Solutions Applied

### 1. Fixed Table Names
Updated `/workspace/src/lib/supabase.js` to remove schema prefixes from table names since we're using schema-specific clients:
- Changed `'kastle_banking.customers'` to `'customers'`
- Changed `'kastle_banking.accounts'` to `'accounts'`
- etc.

### 2. Fixed Authentication Headers
Updated the Supabase clients to properly include authentication headers in all requests.

### 3. Updated Environment Variables
Set the correct Supabase anon key in `.env` file:
```
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE
```

## Database Fix - Simple Solution

Since the table structure in your database has required fields like `team_code`, use the simple RLS disable script:

### Run this SQL in Supabase

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/sql
2. Copy and paste the content from `/workspace/disable_all_rls.sql`
3. Click "Run"

This script will:
- Automatically find all tables with RLS enabled
- Disable RLS on all tables in both schemas
- Grant read permissions to the anonymous role
- Show you the results

**Quick copy-paste version:**
```sql
-- Disable RLS on all banking tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_banking' 
        AND rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE kastle_banking.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Disable RLS on all collection tables
DO $$ 
DECLARE
    r RECORD;
BEGIN
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'kastle_collection' 
        AND rowsecurity = true
    LOOP
        EXECUTE format('ALTER TABLE kastle_collection.%I DISABLE ROW LEVEL SECURITY', r.tablename);
    END LOOP;
END $$;

-- Grant permissions
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated;
GRANT USAGE ON SCHEMA kastle_collection TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_collection TO anon, authenticated;
```

## Testing

After running the script:
1. Restart your development server:
   ```bash
   cd /workspace
   npm run dev
   ```
2. Clear your browser cache
3. Refresh the dashboard page

You should see:
- No more 401 errors
- No more "relation does not exist" errors
- Real data loading in the dashboard widgets
- No "Using mock data" messages in the console

## Troubleshooting

If you still see errors after running the script:

1. **Check the script output** - It should show all tables with "RLS Disabled" status
2. **Verify permissions** - The last query should show `true` for all access checks
3. **Check browser console** - Look for specific error messages
4. **Try a hard refresh** - Ctrl+Shift+R (or Cmd+Shift+R on Mac)
5. **Check the network tab** - See if the API calls are returning data

## Security Note

This solution disables Row Level Security for development. For production:
- Re-enable RLS with proper policies
- Implement user authentication
- Create read-only views for public metrics
- Use service role keys only on the backend

## Alternative Solutions

If you need to keep RLS enabled, you can create specific policies for the anonymous role. See `/workspace/fix_dashboard_rls.sql` for an example of how to create proper RLS policies.