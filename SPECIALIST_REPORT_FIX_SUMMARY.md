# Specialist Report Database Connection Fix

## Issue
The `/collection/specialist-report` page was showing database connection errors because:
1. The Supabase credentials were not properly configured in the `.env` file
2. The `kastle_banking` schema was not exposed in the Supabase API settings

## Solution Applied

### 1. Updated Environment Variables
Created/updated `.env` file with the correct Supabase credentials:
```
VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ0NDMxMTUsImV4cCI6MjA1MDAxOTExNX0.V9pqQJR7QcyOJKJLl-7kRBBVxBdoFiDLa88wWYVWeBE
```

### 2. Created Database Diagnostic Page
Added a new diagnostic page at `/db-diagnostic` that:
- Checks environment variable configuration
- Tests database connection
- Verifies schema access
- Tests specific table access
- Provides clear instructions for fixing any issues

### 3. Required Supabase Configuration

**IMPORTANT**: You need to expose the `kastle_banking` schema in Supabase:

1. Go to your Supabase Dashboard: https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api
2. Navigate to Settings → API
3. Find the "Exposed schemas" section
4. Add `kastle_banking` to the list
5. Click Save
6. Wait a few seconds for the changes to take effect

## How to Verify the Fix

1. Visit `/db-diagnostic` to run the database diagnostics
2. All checks should show green/success status
3. Once the schema is exposed, visit `/collection/specialist-report`
4. The page should load without errors and display specialist data

## Technical Details

The application uses a multi-schema setup:
- `public` schema: Default Supabase schema
- `kastle_banking` schema: Contains all banking and collection tables

The specialist report queries data from tables in the `kastle_banking` schema:
- `collection_officers`: Specialist information
- `collection_cases`: Assigned cases
- `collection_interactions`: Communication history
- `promise_to_pay`: Payment promises

## Connection String (for reference)
```
postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres
```

## Next Steps

After exposing the schema:
1. Restart the development server if needed
2. Clear browser cache if you still see errors
3. Check the browser console for any remaining issues

The specialist report should now work correctly with real data from your Supabase database.