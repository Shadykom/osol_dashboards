# Database Schema Migration Guide

This guide will help you migrate all tables from `public` and `kastle_collection` schemas to the `kastle_banking` schema in your PostgreSQL database.

## ⚠️ UPDATE: Handling Duplicate Tables

Based on the error you encountered, some tables already exist in the `kastle_banking` schema. Use the new safe migration script that handles duplicates properly.

## Prerequisites

- PostgreSQL client (`psql`) installed on your local machine
- Network access to your Supabase database

## Migration Files

I've created several files to help with the migration:

1. **`safe_migration.sql`** - 🆕 **RECOMMENDED** - Safe migration that skips existing tables
2. **`check_duplicates.sql`** - 🆕 Check which tables exist in multiple schemas
3. **`handle_duplicates.sql`** - 🆕 Options for handling duplicate tables
4. **`simple_migration.sql`** - Basic migration script (will fail on duplicates)
5. **`migrate_tables.sql`** - Detailed migration script with error handling
6. **`check_schemas.sql`** - Script to check current state of schemas
7. **`local_migration_script.sh`** - Shell script for automated migration
8. **`migrate_schemas.py`** - Python script for migration (requires psycopg2)

## Method 1: Safe Migration (Recommended for Duplicate Tables)

Since you have duplicate tables, first check what duplicates exist:

```bash
# Check for duplicate tables
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f check_duplicates.sql
```

Then run the safe migration:

```bash
# Run safe migration that skips existing tables
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f safe_migration.sql
```

## Method 2: Step-by-Step Migration

### Step 1: Check Current Schema State

First, see what tables are in each schema:

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f check_schemas.sql
```

### Step 2: Run the Migration

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f migrate_tables.sql
```

### Step 3: Verify the Migration

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -c "SELECT table_schema, COUNT(*) as table_count FROM information_schema.tables WHERE table_schema IN ('public', 'kastle_collection', 'kastle_banking') AND table_type = 'BASE TABLE' GROUP BY table_schema ORDER BY table_schema;"
```

## Method 3: Using the Shell Script

If you prefer automation:

```bash
./local_migration_script.sh
```

## Method 4: Manual Migration

If you want to migrate tables one by one, connect to your database:

```bash
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres"
```

Then run these commands:

```sql
-- Create the target schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS kastle_banking;

-- Move a specific table from public to kastle_banking
ALTER TABLE public.your_table_name SET SCHEMA kastle_banking;

-- Move a specific table from kastle_collection to kastle_banking
ALTER TABLE kastle_collection.your_table_name SET SCHEMA kastle_banking;
```

## What the Migration Does

1. Creates the `kastle_banking` schema if it doesn't exist
2. Moves all user tables from the `public` schema to `kastle_banking`
3. Moves all tables from the `kastle_collection` schema to `kastle_banking`
4. Preserves all table data, constraints, indexes, and relationships
5. Excludes system tables (like PostGIS tables) from migration

## Important Notes

- **Backup First**: Always backup your database before running schema migrations
- **Application Updates**: Update your application code to reference the new schema (`kastle_banking`) instead of `public` or `kastle_collection`
- **Permissions**: Ensure your database user has the necessary permissions to create schemas and alter tables
- **Rollback**: If you need to rollback, you can move tables back using similar ALTER TABLE commands

## Handling Duplicate Tables

If you have tables that already exist in `kastle_banking`:

### Option 1: Check and Handle Duplicates
```bash
# See which tables are duplicated
psql "postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres" -f handle_duplicates.sql
```

This will show you:
- Which tables exist in multiple schemas
- Commands to DROP duplicate tables (destructive)
- Commands to RENAME duplicate tables (preserves data)
- Commands to compare data between duplicates

### Option 2: Drop Duplicates from Source Schemas
If you're sure the data in `kastle_banking` is correct and complete:
```sql
-- Example: Drop the duplicate from public schema
DROP TABLE public.customers;
```

### Option 3: Rename Duplicates
If you want to preserve the data for comparison:
```sql
-- Example: Rename the duplicate in public schema
ALTER TABLE public.customers RENAME TO customers_backup_from_public;
```

## Troubleshooting

If you encounter connection issues:
1. Ensure you have internet connectivity
2. Check if your IP is whitelisted in Supabase settings
3. Try adding `?sslmode=require` to the connection string

If you get "relation already exists" errors:
1. Use the `safe_migration.sql` script instead
2. Check for duplicates with `check_duplicates.sql`
3. Handle duplicates before migration

## After Migration

Update your application's database queries to use the new schema:
- Change `FROM table_name` to `FROM kastle_banking.table_name`
- Or set the search path: `SET search_path TO kastle_banking;`