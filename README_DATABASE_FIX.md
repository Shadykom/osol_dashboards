# Database Schema Fix Instructions

## Overview
The application is experiencing errors due to missing columns in the database tables. This document provides the SQL commands needed to fix these issues.

## Errors to Fix
1. `column collection_teams_1.team_lead_id does not exist`
2. `column promise_to_pay.actual_payment_date does not exist`
3. `column promise_to_pay.actual_payment_amount does not exist`
4. Missing `officer_performance_metrics` table

## How to Apply the Fix

### Option 1: Using Supabase Dashboard (Recommended)

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project (bzlenegoilnswsbanxgb)
3. Navigate to the SQL Editor
4. Copy and paste the contents of `fix_missing_columns.sql` file
5. Click "Run" to execute the migration

### Option 2: Using psql Command Line

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f fix_missing_columns.sql
```

### Option 3: Using a Database Client

Use any PostgreSQL client (pgAdmin, DBeaver, TablePlus, etc.) with these connection details:
- Host: `db.bzlenegoilnswsbanxgb.supabase.co`
- Port: `5432`
- Database: `postgres`
- Username: `postgres`
- Password: `OSOL1a15975311`

Then execute the SQL from `fix_missing_columns.sql`.

## What the Migration Does

1. **Adds `team_lead_id` to `collection_teams` table**
   - Type: VARCHAR(50)
   - Foreign key reference to `collection_officers(officer_id)`

2. **Adds missing columns to `promise_to_pay` table**
   - `actual_payment_date`: TIMESTAMP
   - `actual_payment_amount`: DECIMAL(15,2)
   - `officer_id`: VARCHAR(50) with foreign key reference

3. **Creates `officer_performance_metrics` table if missing**
   - Tracks daily performance metrics for collection officers
   - Includes columns for calls, promises, collections, etc.

4. **Adds missing columns to `collection_officers` table**
   - `language_skills`: TEXT[]
   - `collection_limit`: DECIMAL(15,2)
   - `commission_rate`: DECIMAL(5,2)
   - `last_active`: TIMESTAMP

5. **Grants necessary permissions**
   - Ensures `anon` and `authenticated` roles have proper access

## Verification

After running the migration, you can verify the changes by running these queries:

```sql
-- Check collection_teams columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kastle_collection' 
AND table_name = 'collection_teams';

-- Check promise_to_pay columns
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'kastle_collection' 
AND table_name = 'promise_to_pay';

-- Check if officer_performance_metrics exists
SELECT EXISTS (
  SELECT 1 
  FROM information_schema.tables 
  WHERE table_schema = 'kastle_collection' 
  AND table_name = 'officer_performance_metrics'
);
```

## Additional Notes

- The migration script is idempotent - it checks if columns/tables exist before creating them
- All foreign key constraints include `ON DELETE SET NULL` or `ON DELETE CASCADE` for data integrity
- The script preserves existing data and only adds missing structures

## Troubleshooting

If you encounter permission errors, ensure your database user has the necessary privileges:
```sql
GRANT CREATE ON SCHEMA kastle_collection TO postgres;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA kastle_collection TO postgres;
```