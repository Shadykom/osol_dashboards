# Collection Cases View Error Fix

## Error Message
```
ERROR: 42703: column cc.account_id does not exist
LINE 58: LEFT JOIN kastle_banking.accounts a ON cc.account_id = a.account_id
```

## Root Cause
The error occurred because the SQL script was trying to reference `cc.account_id` which doesn't exist in the `collection_cases` table. The actual column name is `account_number`.

## Solution
Created a corrected view definition that uses the actual column names from the `collection_cases` table.

### Key Changes:
1. Removed reference to non-existent `account_id` column
2. Used `account_number` which is the actual column in the table
3. Properly joined with `customers` table using `customer_id`
4. Added proper aliases for compatibility with the application code
5. Included calculated fields for priority and status

## How to Apply the Fix

Run the corrected SQL script in your Supabase SQL editor:

```sql
-- Copy and run the contents of:
/workspace/fix_collection_cases_view_corrected.sql
```

This script will:
1. Drop any existing `collection_cases_detailed` view
2. Create the view with correct column references
3. Grant proper permissions
4. Verify the view was created successfully

## Verification
After running the script, you should see:
- Message: "View kastle_banking.collection_cases_detailed created successfully"
- The Collection Cases page should load without 404 errors
- No more SQL errors about missing columns