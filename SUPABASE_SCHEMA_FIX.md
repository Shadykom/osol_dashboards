# Supabase Schema Access Fix

## Problem
The application is receiving 406 errors with the message:
```
The schema must be one of the following: public, graphql_public
```

This indicates that the Supabase REST API is not configured to allow access to the custom schemas (`kastle_banking` and `kastle_collection`).

## Solution Options

### Option 1: Enable Schema Access in Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to Settings → API
3. Under "Exposed schemas", add:
   - `kastle_banking`
   - `kastle_collection`
4. Save the changes

### Option 2: Use RPC Functions (Alternative)

If you cannot expose the schemas directly, create RPC functions in the public schema that proxy to your custom schemas:

```sql
-- Example RPC function for branches
CREATE OR REPLACE FUNCTION public.get_branches()
RETURNS SETOF kastle_banking.branches
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT * FROM kastle_banking.branches WHERE is_active = true ORDER BY branch_name;
$$;

-- Grant access
GRANT EXECUTE ON FUNCTION public.get_branches() TO anon, authenticated;
```

### Option 3: Move Tables to Public Schema

As a last resort, you could move your tables to the public schema, but this is not recommended as it would require significant changes to your database structure.

## Temporary Fix Applied

I've updated the `supabase.js` file to use schema-qualified table names (e.g., `kastle_banking.branches` instead of just `branches`). However, this will only work if the schemas are exposed in the Supabase API settings.

## Next Steps

1. **Immediate Action**: Enable the schemas in Supabase Dashboard (Option 1)
2. **Verify**: After enabling, test the application to ensure queries work
3. **Security**: Review RLS policies on all tables to ensure proper access control

## Testing

After applying the fix, test with:
```javascript
// Test query
const { data, error } = await supabase
  .from('kastle_banking.branches')
  .select('*')
  .limit(1);

if (error) {
  console.error('Schema access error:', error);
} else {
  console.log('Schema access successful:', data);
}
```