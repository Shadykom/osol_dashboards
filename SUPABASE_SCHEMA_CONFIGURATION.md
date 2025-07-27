# Supabase Schema Configuration Fix

## Problem
The application is receiving 404 errors when trying to access tables in the `kastle_banking` and `kastle_collection` schemas. This is because these custom schemas are not exposed through the Supabase REST API by default.

## Root Cause
The Supabase REST API only exposes the `public` and `graphql_public` schemas by default. Custom schemas need to be explicitly exposed in the Supabase project settings.

## Solution

### Step 1: Enable Schema Access in Supabase Dashboard

1. Go to your Supabase Dashboard at https://app.supabase.com
2. Select your project
3. Navigate to **Settings** → **API**
4. Find the **Exposed schemas** section
5. Add the following schemas:
   - `kastle_banking`
   - `kastle_collection`
6. Click **Save**

### Step 2: Verify the Configuration

After saving, the schemas should be accessible through the REST API. You can verify this by:

1. Opening your browser's developer console
2. Refreshing the application
3. Checking that the 404 errors are resolved

### Alternative Solutions (if schema exposure is not possible)

#### Option 1: Use RPC Functions
Create PostgreSQL functions in the public schema that proxy to your custom schemas:

```sql
-- Example: Get customer count
CREATE OR REPLACE FUNCTION public.get_customer_count()
RETURNS bigint
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT COUNT(*) FROM kastle_banking.customers;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_customer_count() TO anon, authenticated;
```

Then call it from the application:
```javascript
const { data, error } = await supabase.rpc('get_customer_count');
```

#### Option 2: Create Views in Public Schema
Create views in the public schema that reference your custom schema tables:

```sql
-- Create view for customers
CREATE OR REPLACE VIEW public.v_customers AS
SELECT * FROM kastle_banking.customers;

-- Grant access
GRANT SELECT ON public.v_customers TO anon, authenticated;
```

## Code Changes Applied

I've already updated the codebase to fix the double-schema issue:

1. **Updated TABLES constants** in `/workspace/src/lib/supabase.js`:
   - Removed schema prefixes from table names (e.g., changed `'kastle_banking.customers'` to `'customers'`)
   - The schema is now properly set at the client level, not in the table names

2. **Fixed direct schema references**:
   - Updated `branchReportService.js` to use `TABLES.BRANCHES` instead of `'kastle_banking.branches'`
   - Updated `productReportService.js` to use `TABLES.LOAN_ACCOUNTS` instead of `'kastle_banking.loan_accounts'`

## Testing

After enabling the schemas in Supabase:

1. The dashboard should load without 404 errors
2. KPI data should display correctly
3. Recent transactions should appear
4. All analytics charts should populate with data

## Security Considerations

When exposing custom schemas:

1. Ensure Row Level Security (RLS) is enabled on all tables
2. Review and test RLS policies to prevent unauthorized access
3. Consider using database roles for fine-grained access control