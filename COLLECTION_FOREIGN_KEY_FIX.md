# Collection Cases Foreign Key Fix

## Issue
The application is experiencing the following error:
```
Collection cases error: Could not find a relationship between 'collection_cases' and 'assigned_to' in the schema cache
```

This error occurs because the foreign key constraint between `collection_cases.assigned_to` and `collection_officers.officer_id` is missing in the database.

## Root Cause
The `collection_cases` table has an `assigned_to` column, but there's no foreign key constraint linking it to the `collection_officers` table. Supabase's automatic relationship detection requires explicit foreign key constraints to work properly.

## Solution

### Option 1: Apply SQL Fix via Supabase Dashboard (Recommended)
1. Go to the Supabase SQL Editor: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/sql/new
2. Copy and paste the SQL from `/workspace/fix_collection_cases_foreign_key.sql`
3. Click "Run" to execute the SQL

### Option 2: Temporary Frontend Workaround
While waiting for the database fix, we can modify the query to use explicit joins instead of relying on Supabase's automatic relationship detection.

Update `/workspace/src/services/collectionService.js`:

```javascript
// Change from:
let query = supabaseBanking
  .from('collection_cases')
  .select(`
    *,
    customers:customer_id (
      full_name,
      customer_contacts (
        contact_type,
        contact_value
      )
    ),
    collection_officers:assigned_to (
      officer_name
    ),
    collection_buckets:bucket_id (
      bucket_name
    )
  `)

// To:
let query = supabaseBanking
  .from('collection_cases')
  .select(`
    *,
    customers:customer_id (
      full_name,
      customer_contacts (
        contact_type,
        contact_value
      )
    ),
    collection_buckets:bucket_id (
      bucket_name
    )
  `)

// Then fetch officer data separately if needed:
const { data: officers } = await supabaseBanking
  .from('collection_officers')
  .select('officer_id, officer_name');

// Map officer names after fetching the data
```

## Verification
After applying the fix, you can verify it's working by:
1. Checking the browser console - the error should no longer appear
2. The collection cases page should load without errors
3. Officer names should display correctly in the collection cases list

## Prevention
To prevent similar issues in the future:
1. Always define foreign key constraints when creating related tables
2. Test relationship queries before deploying
3. Include foreign key constraints in migration scripts