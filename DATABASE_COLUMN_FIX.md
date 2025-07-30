# Database Column Name Fix Guide

## Issue Summary

The application is experiencing 400 Bad Request errors when querying the database. The main issue is a column name mismatch:

- **Application expects**: `customer_status` column in the `customers` table
- **Database has**: `status` column in the `customers` table

## Error Examples

```
bzlenegoilnswsbanxgb.supabase.co/rest/v1/customers?select=*&customer_status=eq.ACTIVE:1  Failed to load resource: the server responded with a status of 400 ()
```

## Solution

You need to run the SQL migration script to rename the column in your Supabase database.

### Option 1: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb
2. Navigate to the SQL Editor
3. Copy and paste the contents of `/workspace/scripts/fix-database-columns-simple.sql`
4. Run the script

### Option 2: Using psql Command Line

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres?sslmode=require" -f /workspace/scripts/fix-database-columns-simple.sql
```

### Option 3: Manual SQL Commands

If the script doesn't work, run these commands manually in the Supabase SQL editor:

```sql
-- Rename the column
ALTER TABLE kastle_banking.customers 
RENAME COLUMN status TO customer_status;

-- Update indexes
DROP INDEX IF EXISTS kastle_banking.idx_customers_status;
CREATE INDEX idx_customers_customer_status 
ON kastle_banking.customers(customer_status);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.customers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON kastle_banking.customers TO authenticated;
```

## Verification

After running the migration, verify the fix by:

1. Checking the column exists:
```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_schema = 'kastle_banking' 
AND table_name = 'customers'
AND column_name = 'customer_status';
```

2. Testing a query:
```sql
SELECT COUNT(*) 
FROM kastle_banking.customers 
WHERE customer_status = 'ACTIVE';
```

## Alternative Solution

If you cannot modify the database schema, you can update all application queries to use `status` instead of `customer_status`. However, this requires changes in multiple files and is not recommended.

## Affected Queries

The following queries are affected and will be fixed by the database migration:
- Customer growth metrics
- Total customers count
- Customer segments distribution
- All customer-related filters in the dashboard

## Next Steps

1. Run the migration script
2. Refresh your application
3. The 400 errors should be resolved
4. All dashboard widgets should load data correctly