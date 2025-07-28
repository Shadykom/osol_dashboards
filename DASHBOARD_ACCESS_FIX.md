# Dashboard Access Fix Guide

## Problem
The collection/overview dashboard is not showing data due to 401 (Unauthorized) errors when fetching data from Supabase. This is because:

1. The dashboard is trying to fetch data using the anonymous (anon) role
2. Row Level Security (RLS) is enabled on the tables but no policies exist for anonymous access
3. The table names in the code included schema prefixes which caused issues
4. Some collection schema tables might not exist

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

## Database Fixes Required

To allow the dashboard to access data, you need to run these SQL scripts in your Supabase SQL editor:

### Step 1: Fix Banking Schema Access

Run the SQL script in `/workspace/fix_dashboard_rls.sql` to enable access to banking data.

**Quick Fix (Development):**
```sql
-- Temporarily disable RLS on banking tables to allow dashboard access
ALTER TABLE kastle_banking.customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.loan_accounts DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.branches DISABLE ROW LEVEL SECURITY;
ALTER TABLE kastle_banking.customer_types DISABLE ROW LEVEL SECURITY;

-- Grant permissions to anon role
GRANT USAGE ON SCHEMA kastle_banking TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon;
```

### Step 2: Fix Collection Schema Access

Run the SQL script in `/workspace/fix_collection_rls.sql` to create missing collection tables and enable access.

This script will:
- Create the `kastle_collection` schema if it doesn't exist
- Create necessary collection tables if they don't exist
- Enable RLS with proper policies for anonymous access
- Insert sample data for testing

## How to Apply the Fix

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb
2. Navigate to the SQL Editor
3. First, run the content from `/workspace/fix_dashboard_rls.sql`
4. Then, run the content from `/workspace/fix_collection_rls.sql`
5. Click "Run" to execute each SQL script
6. Refresh your application - the dashboard should now load data properly

## Testing

After applying the fixes, you should see:
- No more 401 errors in the console
- No more "relation does not exist" errors
- Actual data loading in the dashboard widgets instead of mock data
- The message "Using mock data for..." should disappear from the console

## Next Steps

1. Restart your development server if needed:
   ```bash
   cd /workspace
   npm run dev
   ```
2. Clear your browser cache and localStorage
3. The dashboard should now display real data from your database

## Security Note

The current fix allows anonymous read access to dashboard data. For production:
- Implement proper authentication flow
- Add user-specific RLS policies
- Consider creating read-only views for dashboard metrics
- Use service role keys only on the server side

## Troubleshooting

If you still see errors:
1. Check that all SQL scripts ran successfully without errors
2. Verify the Supabase URL and anon key are correct in `.env`
3. Check browser console for specific error messages
4. Try running the test script: `node test_db_connection.js`