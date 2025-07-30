# Collection Schema Fix Guide

## Problem Summary

The application was experiencing multiple database errors related to the `kastle_collection` schema:

1. **Missing Schema**: The `kastle_collection` schema didn't exist in the database
2. **Missing Tables**: Essential collection tables were not created
3. **Foreign Key Issues**: Cross-schema references were causing errors
4. **Invalid Table References**: Service files were using schema-prefixed table names incorrectly

## Errors Fixed

- `relation "kastle_banking.kastle_collection.daily_collection_summary" does not exist`
- `relation "kastle_banking.kastle_collection.collection_cases" does not exist`
- `Could not find a relationship between 'kastle_collection.collection_officers' and 'collection_teams'`
- `relation "kastle_banking.report_schedules" does not exist`
- Various 400 errors when querying collection-related endpoints

## Solution Applied

### 1. Created Missing Schema and Tables

**File: `fix_collection_schema.sql`**
- Creates `kastle_collection` schema
- Creates essential tables:
  - `collection_teams`
  - `collection_officers`
  - `collection_buckets`
  - `collection_cases`
  - `collection_interactions`
  - `promise_to_pay`
  - `daily_collection_summary`
  - `officer_performance_summary`
- Adds sample data for testing
- Sets up proper permissions

### 2. Fixed Foreign Key Relationships

**File: `fix_collection_foreign_keys.sql`**
- Creates missing `report_schedules` table
- Ensures `collection_buckets` exists in `kastle_banking` schema
- Creates `collection_cases` in `kastle_banking` schema
- Adds missing columns to existing tables
- Creates views for cross-schema queries
- Adds `customer_contacts` table

### 3. Fixed Service Layer Code

**Script: `scripts/fix-table-references.js`**
- Removes schema prefixes from table names in `from()` calls
- Changes `from('kastle_collection.table_name')` to `from('table_name')`
- Updates 56 table references across service files

## How to Apply the Fixes

### Option 1: Automated Script (Recommended)
```bash
# Run the comprehensive fix script
./scripts/apply-collection-fixes.sh
```

### Option 2: Manual SQL Execution
1. Go to your Supabase SQL Editor
2. Run `fix_collection_schema.sql`
3. Run `fix_collection_foreign_keys.sql`
4. The table references in code have already been fixed

### Option 3: Using Node.js Script
```bash
# Run the SQL fixes
node scripts/fix-collection-schema.js

# Table references already fixed
```

## Verification Steps

After applying the fixes:

1. **Check Schema Creation**:
   ```sql
   SELECT schema_name FROM information_schema.schemata 
   WHERE schema_name = 'kastle_collection';
   ```

2. **Check Tables**:
   ```sql
   SELECT table_name FROM information_schema.tables 
   WHERE table_schema = 'kastle_collection';
   ```

3. **Test the Application**:
   - Navigate to `/collection/specialist-report`
   - Check that data loads without errors
   - Verify collection officers and teams appear

## Key Changes Made

### Database Structure
- Added `kastle_collection` schema with 8 core tables
- Added `report_schedules` table to `kastle_banking`
- Created cross-schema views for easier querying
- Added missing columns to existing tables

### Code Changes
- Updated `collectionService.js` - 49 table references fixed
- Updated `specialistReportService.js` - 7 table references fixed
- All queries now use correct Supabase syntax

### Sample Data
- 4 collection teams
- 20 collection officers
- 7 collection buckets
- 50 collection cases
- 30 days of daily summaries

## Troubleshooting

If you still see errors after applying fixes:

1. **Clear Browser Cache**: Force refresh (Ctrl+Shift+R or Cmd+Shift+R)
2. **Restart Dev Server**: Stop and restart your development server
3. **Check Supabase Logs**: Look for any permission errors
4. **Verify Schema**: Ensure both schemas exist in your database

## Future Considerations

1. **Schema Organization**: Consider consolidating collection tables into `kastle_banking` schema
2. **Foreign Keys**: Review cross-schema foreign key constraints
3. **Performance**: Add appropriate indexes for large tables
4. **Migration Scripts**: Create proper migration files for production

## Related Files

- `/fix_collection_schema.sql` - Main schema creation
- `/fix_collection_foreign_keys.sql` - Foreign key fixes
- `/scripts/fix-table-references.js` - Code fixes
- `/scripts/apply-collection-fixes.sh` - Automated fix script
- `/scripts/fix-collection-schema.js` - Node.js SQL runner