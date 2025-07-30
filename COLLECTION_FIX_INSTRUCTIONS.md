# Collection Dashboard Fix Instructions

## Problem Summary
The collection dashboard is throwing errors because it's trying to access tables in the `kastle_collection` schema, but this schema doesn't exist in the database. The collection-related tables currently exist in the `kastle_banking` schema.

## Error Messages
- `relation "kastle_banking.kastle_collection.daily_collection_summary" does not exist`
- `Failed to load resource: the server responded with a status of 404` for collection tables
- Multiple 400 errors when trying to access collection data

## Solution

### Option 1: Manual Fix via Supabase Dashboard (Recommended)

1. **Login to Supabase Dashboard**
   - Go to your Supabase project dashboard
   - Navigate to the SQL Editor

2. **Execute the Fix SQL**
   - Copy the contents of `/workspace/fix_collection_schema.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute

3. **Alternative: Use the Minimal Fix**
   - If the full fix has issues, use `/workspace/fix_collection_minimal.sql`
   - This creates the basic schema structure needed for the dashboard to work

### Option 2: Fix via Command Line

1. **Using psql directly:**
   ```bash
   psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f fix_collection_schema.sql
   ```

2. **Using the provided scripts:**
   ```bash
   # Make sure you have psql installed
   export DATABASE_URL="postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres"
   ./run_collection_fix.sh
   ```

## What the Fix Does

1. **Creates the `kastle_collection` schema**
   - This is where the application expects to find collection-related tables

2. **Creates all necessary tables:**
   - `collection_teams` - Collection team management
   - `collection_officers` - Collection officer records
   - `collection_buckets` - Risk bucket definitions
   - `collection_cases` - Main collection cases table
   - `collection_interactions` - Customer interaction logs
   - `promise_to_pay` - Payment promise tracking
   - `daily_collection_summary` - Daily performance metrics
   - `officer_performance_summary` - Officer performance tracking

3. **Sets up proper permissions**
   - Grants access to `anon`, `authenticated`, and `service_role` users
   - Disables Row Level Security (RLS) on all tables

4. **Populates sample data**
   - Creates sample teams, officers, and buckets
   - Migrates existing cases from `kastle_banking.collection_cases` if available
   - Generates daily summary data for the last 30 days

## Verification

After running the fix, verify it worked by:

1. **Check in Supabase Dashboard:**
   - Go to Table Editor
   - Look for the `kastle_collection` schema in the schema dropdown
   - Verify all tables are created

2. **Test the Application:**
   - Refresh the collection dashboard page
   - The errors should be gone
   - You should see collection data displayed

## Troubleshooting

If you still see errors after applying the fix:

1. **Clear browser cache and refresh**
2. **Check browser console for new error messages**
3. **Verify the schema was created:**
   ```sql
   SELECT schema_name 
   FROM information_schema.schemata 
   WHERE schema_name = 'kastle_collection';
   ```

4. **Check if tables were created:**
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'kastle_collection';
   ```

## Alternative Solution

If creating the new schema is not possible, you could update the application code to use `kastle_banking` schema instead of `kastle_collection`. This would require:

1. Updating all references in `/workspace/src/services/collectionService.js`
2. Changing from `kastle_collection.collection_cases` to `kastle_banking.collection_cases`
3. Similar changes for all other collection tables

However, this is more complex and might break other parts of the application.

## Files Created

- `/workspace/fix_collection_schema.sql` - Complete fix with all tables and data
- `/workspace/fix_collection_minimal.sql` - Minimal fix with basic structure
- `/workspace/run_collection_fix.sh` - Shell script to run the fix
- `/workspace/scripts/fix-collection-schema.js` - Node.js script for automated fix
- `/workspace/scripts/fix-collection-via-supabase.js` - Supabase client-based fix attempt

## Additional Issues

### PDF Generation Error

There's also an error when generating reports:
- `TypeError: t.autoTable is not a function`

This is because the `jspdf-autotable` plugin is not properly installed or imported.

**To fix this:**

1. Install the missing dependency:
   ```bash
   npm install jspdf-autotable
   ```

2. If that doesn't work, update the import in `/workspace/src/utils/reportGenerator.js`:
   ```javascript
   import jsPDF from 'jspdf';
   import autoTable from 'jspdf-autotable';
   ```

3. Then update all `pdf.autoTable` calls to use the imported function:
   ```javascript
   autoTable(pdf, { /* options */ });
   ```

## Summary

The main issue is the missing `kastle_collection` schema. Once you create this schema using the provided SQL scripts, the collection dashboard should work properly. The PDF generation issue is secondary and can be fixed by ensuring the jspdf-autotable plugin is properly installed.