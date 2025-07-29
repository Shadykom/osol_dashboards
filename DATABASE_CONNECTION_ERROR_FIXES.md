# Database Connection Error Fixes

## Summary of Issues Found

Based on the console logs and code analysis, there are several database connection issues:

### 1. ✅ Environment Variables Configured
The Supabase URL and anon key are properly configured:
- URL: `https://bzlenegoilnswsbanxgb.supabase.co`
- Anon Key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...88wWYVWeBE`

### 2. ❌ Schema Not Exposed in Supabase API
**Error**: `42P01` - Schema `kastle_banking` is not exposed through the REST API
**Fix**: You need to expose the `kastle_banking` schema in Supabase settings

### 3. ❌ Query Syntax Error (400 Bad Request)
**Error**: Column aliases using `as` in select queries cause malformed requests
**Location**: `src/services/specialistReportService.js` line 742-755
**Fix**: Remove column aliases from the select query

### 4. ⚠️ Database Connection Status Shows Disconnected
**Issue**: `{isConnected: false, hasDatabase: false}`
**Cause**: The schema exposure issue prevents proper database connection

## Fixes Applied

### 1. Created .env File
```env
VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6bGVuZWdvaWxuc3dzYmFueGdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTMyODU3ODIsImV4cCI6MjA2ODg2MTc4Mn0.DtVNndVsrUZtTtVRpEWiQb5QtbhPAErSQ88wWYVWeBE
DATABASE_URL=postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres
```

### 2. Fixed Query Syntax in specialistReportService.js
Removed column aliases from the select query:
```javascript
// Before (causing 400 error):
.select(`
  contacts_successful as calls_answered,
  ptps_obtained as promises_made,
  accounts_worked as cases_resolved,
  quality_score as customer_satisfaction_score
`)

// After (fixed):
.select(`
  contacts_successful,
  ptps_obtained,
  accounts_worked,
  quality_score
`)
```

## Required Manual Actions

### 1. Expose kastle_banking Schema in Supabase
1. Go to: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/settings/api
2. Find the "Exposed schemas" section
3. Update from `public` to: `public, kastle_banking`
4. Click Save

### 2. Run Database Migration (if needed)
Execute the migration script to ensure all tables are in the correct schema:
```bash
psql postgresql://postgres:OSOL1a15975311@db.bzlenegoilnswsbanxgb.supabase.co:5432/postgres -f check_and_update_schemas.sql
```

### 3. Restart Development Server
After making the changes:
```bash
npm run dev
# or
pnpm dev
```

## Other Observations

1. **Multiple GoTrueClient instances**: Warning about multiple auth client instances - not critical but should be investigated
2. **Ethereum conflict resolver**: Browser extension conflicts - not related to database issues
3. **Port disconnection/reconnection**: Browser extension communication issues - not related to database

## Testing After Fixes

1. Check if the database connection status shows `{isConnected: true, hasDatabase: true}`
2. Verify that the specialist report loads without 400 errors
3. Test other database queries to ensure they work properly

## Connection Details
- **Project URL**: https://bzlenegoilnswsbanxgb.supabase.co
- **Database**: PostgreSQL
- **Schema**: kastle_banking (needs to be exposed)
- **Authentication**: Using anon key for client-side access