# Direct kastle_banking Schema Connection Setup

## Overview
This guide shows how to configure your Supabase project to directly access the `kastle_banking` schema without creating public schema views.

## Step 1: Enable kastle_banking Schema in Supabase Dashboard

### Required Steps:
1. Go to your Supabase Dashboard: https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api
2. Scroll down to the **"Exposed schemas"** section
3. You'll see a field that likely shows: `public, storage, graphql_public`
4. Add `kastle_banking` to this list, so it becomes: `public, storage, graphql_public, kastle_banking`
5. Click **Save**

### What This Does:
- Exposes the `kastle_banking` schema through the REST API
- Allows direct queries to tables in `kastle_banking` schema
- No need for public schema views or workarounds

## Step 2: Verify Schema Permissions (SQL)

Run this SQL in your Supabase SQL Editor to ensure proper permissions:

```sql
-- Grant usage on kastle_banking schema
GRANT USAGE ON SCHEMA kastle_banking TO anon, authenticated, service_role;

-- Grant SELECT permissions on all existing tables
GRANT SELECT ON ALL TABLES IN SCHEMA kastle_banking TO anon, authenticated;

-- Grant permissions for future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA kastle_banking 
GRANT SELECT ON TABLES TO anon, authenticated;

-- For write operations (if needed)
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA kastle_banking TO authenticated;

-- Verify the grants
SELECT 
    schemaname,
    tablename,
    tableowner,
    has_table_privilege('anon', schemaname||'.'||tablename, 'SELECT') as anon_select,
    has_table_privilege('authenticated', schemaname||'.'||tablename, 'SELECT') as auth_select
FROM pg_tables 
WHERE schemaname = 'kastle_banking'
ORDER BY tablename;
```

## Step 3: Application Configuration

The application is already configured to use `kastle_banking` schema directly:

### In `src/lib/supabase.js`:
- The `supabaseBanking` client includes proper schema headers:
  - `Accept-Profile: kastle_banking`
  - `Content-Profile: kastle_banking`
- All table references use TABLES constants (no schema prefixes)

### How It Works:
1. When you make a query like `.from(TABLES.COLLECTION_OFFICERS)`
2. The headers tell Supabase to look in `kastle_banking` schema
3. Direct connection without any public schema involvement

## Step 4: Testing

After enabling the schema in Supabase Dashboard:

1. Open your browser console
2. Run this test:
```javascript
// This should work without errors
await window.checkSupabaseConfig()
```

3. Navigate to `/collection/specialist-report`
4. Check console - should see no 404 errors
5. Data should load correctly

## Troubleshooting

If you still get errors after enabling the schema:

1. **Clear browser cache** - Old API responses might be cached
2. **Check Supabase logs** - Go to Dashboard > Logs > API logs
3. **Verify schema is exposed** - In SQL Editor run:
   ```sql
   SELECT current_schemas(true);
   ```
4. **Test direct query** - In SQL Editor:
   ```sql
   SELECT * FROM kastle_banking.collection_officers LIMIT 1;
   ```

## Benefits of Direct Connection
- ✅ No duplicate data in public schema
- ✅ Single source of truth
- ✅ Better performance (no view overhead)
- ✅ Simpler maintenance
- ✅ Proper schema isolation

## Important Notes
- Changes take effect immediately after saving in Supabase Dashboard
- No need to restart your application
- The schema fallback helper will still work but won't be needed
- All queries go directly to `kastle_banking` schema