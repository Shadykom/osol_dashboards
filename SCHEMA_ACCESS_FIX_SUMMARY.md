# Schema Access Fix Summary

## Problem
The application was receiving "relation does not exist" errors (404) when trying to access tables in the `kastle_banking` schema. The error occurred because:
1. All tables are in the `kastle_banking` schema, not the default `public` schema
2. The `kastle_banking` schema is not exposed through the Supabase REST API by default

## Solutions Applied

### 1. Updated Supabase Client Configuration
- Modified `src/lib/supabase.js` to properly set schema headers:
  - Added `Accept-Profile: kastle_banking` header
  - Added `Content-Profile: kastle_banking` header
  - Updated `customFetch` function to include schema headers for all REST API calls

### 2. Created Schema Fallback Helper
- Created `src/utils/supabaseHelper.js` with:
  - `executeWithSchemaFallback()` function that tries kastle_banking first, then falls back to public schema
  - `queryWithSchemaFallback()` for query builder pattern
  - `getClientWithFallback()` for getting appropriate client with fallback support

### 3. Updated Service Files
- Modified `src/services/specialistReportService.js` to use the fallback helper
- The `getSpecialists()` function now handles schema errors gracefully

### 4. Created SQL Scripts
- `fix_schema_exposure.sql` - Grants permissions and checks schema access
- `create_public_schema_views.sql` - Creates views in public schema as a workaround

## Immediate Actions Required

### Option 1: Enable Schema in Supabase Dashboard (Recommended)
1. Go to https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api
2. In the "Exposed schemas" section, add:
   - `kastle_banking`
3. Save the changes

### Option 2: Execute SQL Script (Alternative)
If you cannot modify the Supabase dashboard settings, run the `create_public_schema_views.sql` script in your database:
1. Go to Supabase SQL Editor
2. Copy and paste the contents of `create_public_schema_views.sql`
3. Execute the script

## How the Fix Works

1. **Primary Method**: The Supabase client now includes proper schema headers to access `kastle_banking` schema directly
2. **Fallback Method**: If a table is not found in `kastle_banking`, the helper automatically tries the `public` schema
3. **View Method**: If views are created in public schema, they act as proxies to the actual tables in `kastle_banking`

## Testing
After applying one of the solutions:
1. Navigate to `/collection/specialist-report`
2. The page should load without errors
3. Check the browser console - no more 404 errors should appear
4. Data should display correctly

## Additional Notes
- The fix maintains backward compatibility
- No changes to business logic were required
- The solution is transparent to the rest of the application
- Performance impact is minimal as the fallback only triggers on errors