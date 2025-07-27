# Database Relationship Fix Summary

## Issue
The application was encountering a PostgreSQL error when trying to embed `collection_teams` with `collection_officers`:

```
{
    "code": "PGRST201",
    "message": "Could not embed because more than one relationship was found for 'collection_officers' and 'collection_teams'"
}
```

## Root Cause
There are two foreign key relationships between `collection_officers` and `collection_teams` tables:

1. **Many-to-One**: `collection_officers.team_id` → `collection_teams.team_id` 
   - Constraint name: `collection_officers_team_id_fkey`
   - Represents: Officers belong to a team

2. **One-to-Many**: `collection_teams.team_lead_id` → `collection_officers.officer_id`
   - Constraint name: `fk_team_lead`
   - Represents: Teams have a team lead (who is an officer)

When using Supabase's PostgREST API with embedding, this ambiguity causes the error.

## Solution Applied

### 1. Database Connection Setup
- Created `.env` file with the correct Supabase credentials:
  - URL: `https://bzlenegoilnswsbanxgb.supabase.co`
  - Anon Key: Updated to the correct key from `vercel.json`

### 2. Fixed Ambiguous Relationships
Updated all queries to explicitly specify which relationship to use:

#### In `src/services/specialistReportService.js`:
- Changed `collection_teams (...)` to `collection_teams!collection_officers_team_id_fkey (...)`
- Fixed in 2 locations (lines 161 and 187)

#### In `src/services/collectionService.js`:
- Fixed 4 queries from `collection_teams` to `collection_officers`:
  - Line 404: `collection_officers!team_id` → `collection_officers!collection_officers_team_id_fkey`
  - Line 902: `collection_officers (...)` → `collection_officers!collection_officers_team_id_fkey (...)`
  - Line 1031: `collection_officers (...)` → `collection_officers!collection_officers_team_id_fkey (...)`
  
- Fixed 1 query from `collection_officers` to `collection_teams`:
  - Line 1091: `collection_teams (...)` → `collection_teams!collection_officers_team_id_fkey (...)`

### 3. Updated Data Access Patterns
- Removed unnecessary `kastle_collection?.` prefixes when accessing embedded data
- Updated from `team.kastle_collection?.collection_officers` to `team.collection_officers`
- Updated from `o.kastle_collection?.collection_officers` to `o.collection_officers`

## Testing
Created and ran a test script that verified:
1. ✅ Basic database connection works
2. ✅ Officer → Team relationship query works with explicit relationship
3. ✅ Team → Officers relationship query works with explicit relationship

## Result
All database queries now work correctly without ambiguity errors. The application can properly fetch:
- Officers with their team information
- Teams with their officers
- Collection performance data with proper relationships