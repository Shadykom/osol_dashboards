# Dashboard Access Fix Guide

## Problem
The collection/overview dashboard is not showing data due to 401 (Unauthorized) errors when fetching data from Supabase. This is because:

1. The dashboard is trying to fetch data using the anonymous (anon) role
2. Row Level Security (RLS) is enabled on the tables but no policies exist for anonymous access
3. The table names in the code included schema prefixes which caused issues

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

To allow the dashboard to access data, you need to run ONE of these SQL scripts in your Supabase SQL editor:

### Option 1: Enable Anonymous Access (Recommended for Development)

Run the SQL script in `/workspace/disable_rls_temp.sql`:

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

### Option 2: Add Proper RLS Policies (Recommended for Production)

Run the SQL script in `/workspace/fix_dashboard_rls.sql` to add proper Row Level Security policies that allow anonymous read access for dashboard metrics while protecting sensitive data.

## How to Apply the Fix

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb
2. Navigate to the SQL Editor
3. Copy and paste the content from either:
   - `/workspace/disable_rls_temp.sql` (for quick development fix)
   - `/workspace/fix_dashboard_rls.sql` (for production-ready fix)
4. Click "Run" to execute the SQL
5. Refresh your application - the dashboard should now load data properly

## Testing

After applying the fix, you should see:
- No more 401 errors in the console
- Actual data loading in the dashboard widgets instead of mock data
- The message "Using mock data for..." should disappear from the console

## Next Steps

1. Restart your development server if needed
2. Clear your browser cache and localStorage
3. The dashboard should now display real data from your database

## Security Note

If you used Option 1 (disabling RLS), remember to re-enable it with proper policies before deploying to production. Option 2 provides a better balance of security and functionality.