# PostgREST Relationship Fix: collection_cases ↔ loan_accounts

## Problem Description

PostgREST is returning error PGRST200:
```
Could not find a relationship between 'collection_cases' and 'loan_accounts' in the schema cache
```

This error occurs because PostgREST cannot automatically detect a relationship between these two tables without an explicit foreign key constraint.

Additionally, when trying to create the foreign key, you may encounter:
```
ERROR: 23503: insert or update on table "collection_cases" violates foreign key constraint "fk_collection_cases_loan_accounts"
DETAIL: Key (loan_account_number)=(LOAN1000000003) is not present in table "loan_accounts".
```

This indicates data integrity issues where `collection_cases` references loan accounts that don't exist in the `loan_accounts` table.

## Root Cause

The `kastle_banking.collection_cases` table has a column `loan_account_number` that should reference `kastle_banking.loan_accounts.loan_account_number`, but no foreign key constraint was defined in the database schema.

## Solution

### 1. Diagnose the Current State

First, run the diagnostic script to understand the current state:

```bash
psql -d your_database -f diagnose_postgrest_relationship.sql
```

This will show you:
- Whether both tables exist
- The column definitions
- Any existing foreign key relationships
- Data integrity issues (orphaned records)

### 2. Fix Data Integrity Issues (if any)

If the diagnostic script reveals orphaned `loan_account_number` values in `collection_cases` that don't exist in `loan_accounts`, you need to clean them up first:

```sql
-- Option 1: Set orphaned references to NULL
UPDATE kastle_banking.collection_cases 
SET loan_account_number = NULL
WHERE loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = collection_cases.loan_account_number
  );

-- Option 2: Delete orphaned records (if appropriate for your use case)
DELETE FROM kastle_banking.collection_cases 
WHERE loan_account_number IS NOT NULL 
  AND NOT EXISTS (
      SELECT 1 FROM kastle_banking.loan_accounts la 
      WHERE la.loan_account_number = collection_cases.loan_account_number
  );
```

### 3. Apply the Fix

Run the fix script:

```bash
psql -d your_database -f fix_postgrest_relationship.sql
```

This script will:
1. Check for data integrity issues
2. Create the foreign key constraint
3. Add an index for performance
4. Add PostgREST-friendly comments
5. Verify the relationship was created

### 4. Refresh PostgREST Schema Cache

After applying the database changes, you need to refresh PostgREST's schema cache:

**Option A: Restart PostgREST**
```bash
# If using systemd
sudo systemctl restart postgrest

# If using Docker
docker restart postgrest_container_name
```

**Option B: Use Schema Reload Endpoint** (if configured)
```bash
curl -X POST http://your-postgrest-server/rpc/reload_schema
```

**Option C: Send NOTIFY command** (if PostgREST is configured to listen)
```sql
NOTIFY pgrst, 'reload schema';
```

## Verification

After applying the fix and refreshing PostgREST, you can verify the relationship works:

### Via PostgREST API:
```bash
# Get collection cases with loan account details
curl "http://your-postgrest-server/collection_cases?select=*,loan_accounts(*)"

# Filter by loan account properties
curl "http://your-postgrest-server/collection_cases?loan_accounts.loan_status=eq.ACTIVE"
```

### Via SQL:
```sql
-- Check the foreign key exists
SELECT * FROM information_schema.table_constraints 
WHERE constraint_name = 'fk_collection_cases_loan_accounts';

-- Test the join
SELECT cc.*, la.* 
FROM kastle_banking.collection_cases cc
JOIN kastle_banking.loan_accounts la 
  ON cc.loan_account_number = la.loan_account_number
LIMIT 5;
```

## Alternative Solutions

If you cannot create a foreign key due to business requirements (e.g., historical data with invalid references), you can:

1. **Create a database view** with the join:
```sql
CREATE VIEW kastle_banking.collection_cases_with_loans AS
SELECT cc.*, la.* 
FROM kastle_banking.collection_cases cc
LEFT JOIN kastle_banking.loan_accounts la 
  ON cc.loan_account_number = la.loan_account_number;
```

2. **Use PostgREST computed columns** (requires PostgREST 9.0+):
```sql
CREATE FUNCTION kastle_banking.collection_cases_loan_account(collection_cases)
RETURNS kastle_banking.loan_accounts AS $$
  SELECT * FROM kastle_banking.loan_accounts 
  WHERE loan_account_number = $1.loan_account_number
$$ LANGUAGE sql STABLE;
```

## Prevention

To prevent this issue in the future:
1. Always define foreign key constraints when creating tables with relationships
2. Include foreign keys in your migration scripts
3. Use database modeling tools that enforce referential integrity
4. Test PostgREST endpoints after schema changes