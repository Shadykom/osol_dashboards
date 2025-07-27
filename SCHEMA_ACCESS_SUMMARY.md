# Schema Access Fix Summary

## Changes Made

1. **Updated `src/lib/supabase.js`**:
   - Changed from using schema-specific clients with `db: { schema: 'kastle_banking' }` to using a single client
   - Updated all `TABLES` constants to use schema-qualified names (e.g., `kastle_banking.branches` instead of just `branches`)
   - This approach works around the schema restriction by explicitly specifying the schema in the table name

2. **Updated Service Files**:
   - `branchReportService.js`: Updated hardcoded table names to use schema-qualified names
   - `productReportService.js`: Updated hardcoded table names to use schema-qualified names
   - `collectionService.js`: Updated all table references to use the TABLES constants with schema-qualified names
   - `specialistReportService.js`: Updated to use schema-qualified names and the correct client

## Root Cause

The error "The schema must be one of the following: public, graphql_public" indicates that your Supabase instance is not configured to expose the custom schemas (`kastle_banking` and `kastle_collection`) through the REST API.

## Required Action

You must enable the custom schemas in your Supabase Dashboard:

1. **Log in to Supabase Dashboard**
2. **Navigate to**: Settings → API
3. **Find**: "Exposed schemas" section
4. **Add the following schemas**:
   - `kastle_banking`
   - `kastle_collection`
5. **Save** the changes

## Alternative Solutions

If you cannot expose the schemas:

### Option 1: Create Proxy Views in Public Schema
```sql
-- Create views in public schema that reference the custom schemas
CREATE VIEW public.branches AS SELECT * FROM kastle_banking.branches;
CREATE VIEW public.customers AS SELECT * FROM kastle_banking.customers;
-- etc. for all tables

-- Grant permissions
GRANT SELECT ON public.branches TO anon, authenticated;
-- etc. for all views
```

### Option 2: Use RPC Functions
```sql
-- Create RPC functions in public schema
CREATE OR REPLACE FUNCTION public.get_branches()
RETURNS SETOF kastle_banking.branches
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM kastle_banking.branches;
$$;

GRANT EXECUTE ON FUNCTION public.get_branches() TO anon, authenticated;
```

## Testing

After enabling the schemas in Supabase, test with:

```javascript
// In browser console
const { data, error } = await supabase
  .from('kastle_banking.branches')
  .select('*')
  .limit(1);

console.log('Test result:', { data, error });
```

## Build Status

✅ The application builds successfully with the changes
⚠️ Runtime errors will persist until schemas are exposed in Supabase

## Next Steps

1. **Immediate**: Enable schemas in Supabase Dashboard
2. **Test**: Verify queries work after enabling schemas
3. **Monitor**: Check browser console for any remaining errors
4. **Security**: Review and update RLS policies as needed