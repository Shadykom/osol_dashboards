# Update Supabase API Settings for kastle_banking Schema

## Overview
This guide explains how to update your Supabase project settings to expose the `kastle_banking` schema through the REST API.

## Steps to Update Supabase Settings

### 1. Access Supabase Dashboard
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project: `bzlenegoilnswsbanxgb`

### 2. Navigate to API Settings
1. Click on **Settings** in the left sidebar
2. Select **API** from the settings menu

### 3. Update Exposed Schemas
1. Find the **Exposed schemas** section
2. You should see a field that currently shows: `public`
3. Update it to include `kastle_banking`:
   ```
   public, kastle_banking
   ```
4. Click **Save** to apply the changes

### 4. Wait for Changes to Propagate
- The changes should take effect within a few seconds
- You may need to refresh your application

## Database Migration Script

Before running the application, execute the following SQL script to consolidate all tables into the `kastle_banking` schema:

```sql
-- Run the migration script
-- File: check_and_update_schemas.sql
```

This script will:
1. Move all tables from `kastle_collection` schema to `kastle_banking`
2. Update all foreign key constraints
3. Grant necessary permissions
4. Disable Row Level Security on all tables

## Application Configuration

The application code has been updated to:
1. Use only `kastle_banking` schema for all database operations
2. The `supabaseCollection` client now points to `kastle_banking` schema
3. All table references have been updated to use the unified schema

## Verification

After updating the settings and running the migration:

1. Check that all tables are in `kastle_banking` schema:
   ```sql
   SELECT table_name 
   FROM information_schema.tables 
   WHERE table_schema = 'kastle_banking'
   ORDER BY table_name;
   ```

2. Verify no tables remain in `kastle_collection`:
   ```sql
   SELECT COUNT(*) 
   FROM information_schema.tables 
   WHERE table_schema = 'kastle_collection';
   ```

3. Test the application to ensure all database queries work correctly

## Connection String
Your PostgreSQL connection string remains the same:
```
postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres
```

## Troubleshooting

If you encounter issues:
1. Ensure the `kastle_banking` schema is exposed in Supabase API settings
2. Check that all tables have been migrated to `kastle_banking`
3. Verify that RLS is disabled on all tables
4. Clear your browser cache and restart the application