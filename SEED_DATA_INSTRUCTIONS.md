# Instructions for Seeding Test Data

## Overview
I've created SQL scripts to insert sample data for testing the Specialist Report functionality. The data includes performance metrics for officer OFF007 and related data.

## Scripts Available

### 1. Simple Script (Recommended for Quick Testing)
**File**: `seed_specialist_data_simple.sql`
- Contains only officer performance metrics data
- Covers July 2025 and June 2025
- Uses ON CONFLICT to handle duplicate entries
- Quick and easy to run

### 2. Comprehensive Script
**File**: `seed_specialist_performance_data.sql`
- Contains performance metrics, interactions, and promises to pay
- Includes data for multiple officers for comparison
- Creates a summary view
- More complete dataset for thorough testing

## How to Run the Scripts

### Option 1: Using psql Command Line
```bash
# Simple script
psql postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres -f seed_specialist_data_simple.sql

# Comprehensive script
psql postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres -f seed_specialist_performance_data.sql
```

### Option 2: Using Supabase SQL Editor
1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/sql
2. Click on "SQL Editor" in the left sidebar
3. Copy and paste the content from either script
4. Click "Run" to execute

### Option 3: Using a Database Client
1. Connect to your database using any PostgreSQL client (pgAdmin, DBeaver, etc.)
2. Connection details:
   - Host: `db.bzlenegoilnswsbanxgb.supabase.co`
   - Port: `5432`
   - Database: `postgres`
   - Username: `postgres`
   - Password: `OSOL1a15975311`
3. Run the SQL script

## What the Scripts Create

### Performance Metrics Data
- Daily performance data for OFF007 from May to July 2025
- Metrics include:
  - Calls made and successful contacts
  - Amount collected
  - Promises to pay (PTPs) obtained and kept rate
  - Quality scores
  - Talk time and accounts worked

### Additional Data (Comprehensive Script Only)
- Collection interactions (calls, SMS, emails, WhatsApp)
- Promise to pay records (pending, kept, broken, partial)
- Performance data for other officers (OFF001, OFF002, OFF003)
- Updates collection cases to assign some to OFF007

## Verification

After running the script, you can verify the data was inserted:

```sql
-- Check officer performance metrics
SELECT COUNT(*) as record_count
FROM kastle_banking.officer_performance_metrics
WHERE officer_id = 'OFF007';

-- View recent performance data
SELECT 
    metric_date,
    calls_made,
    contacts_successful,
    amount_collected,
    quality_score
FROM kastle_banking.officer_performance_metrics
WHERE officer_id = 'OFF007'
ORDER BY metric_date DESC
LIMIT 10;
```

## Troubleshooting

1. **Permission Errors**: Make sure you're using the correct database credentials
2. **Schema Not Found**: Ensure `kastle_banking` schema is exposed in Supabase settings
3. **Duplicate Key Errors**: The simple script uses ON CONFLICT to handle duplicates, but the comprehensive script may fail if data already exists
4. **Connection Timeout**: Check your internet connection and firewall settings

## Next Steps

After seeding the data:
1. Restart your development server: `npm run dev`
2. Navigate to the Specialist Report page
3. Select officer "Abdullah Al-Ghamdi" (OFF007)
4. You should now see the performance data and charts populated

## Clean Up

If you need to remove the test data:

```sql
-- Remove performance metrics for OFF007
DELETE FROM kastle_banking.officer_performance_metrics 
WHERE officer_id = 'OFF007' 
AND metric_date >= '2025-05-01';

-- Remove interactions (comprehensive script only)
DELETE FROM kastle_banking.collection_interactions 
WHERE officer_id = 'OFF007';

-- Remove promises to pay (comprehensive script only)
DELETE FROM kastle_banking.promise_to_pay 
WHERE officer_id = 'OFF007';
```