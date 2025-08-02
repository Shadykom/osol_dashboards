# Foreign Key Relationship Fixes

## Summary
Fixed database query errors related to ambiguous and incorrect foreign key relationships in Supabase queries.

## Issues Fixed

### 1. Product Report - Customers to Branches Relationship
**Error**: `Could not find a relationship between 'customers' and 'branches' using the hint 'kastle_banking_customers_onboarding_branch_fkey'`

**Root Cause**: The query was using `branches!onboarding_branch` which was incorrect. The correct foreign key name is `customers_onboarding_branch_fkey`.

**Files Fixed**:
- `/workspace/src/services/productReportService.js` (2 occurrences)
- `/workspace/src/services/enhancedDashboardDetailsService.js` (1 occurrence)
- `/workspace/src/services/dashboardDetailsService.js` (1 occurrence)

**Fix Applied**: Changed from:
```javascript
branches!onboarding_branch (...)
```
To:
```javascript
branches!customers_onboarding_branch_fkey (...)
```

### 2. Collection Officers to Collection Teams Relationship
**Error**: `Could not embed because more than one relationship was found for 'collection_officers' and 'collection_teams'`

**Root Cause**: There are multiple foreign key relationships between these tables, causing ambiguity. The query needs to specify which foreign key to use.

**Files Fixed**:
- `/workspace/src/services/specialistReportService.js` (1 occurrence)
- `/workspace/src/services/collectionService.js` (2 occurrences)
- `/workspace/src/pages/SpecialistReport.jsx` (1 occurrence)

**Fix Applied**: Changed from:
```javascript
collection_teams!team_id (...)
```
To:
```javascript
collection_teams!collection_officers_team_id_fkey (...)
```

## Testing
After these fixes, the following errors should no longer appear in the console:
1. PGRST200 error for customers-branches relationship
2. PGRST201 error for collection_officers-collection_teams relationship

## Notes
- The foreign key names follow Supabase's convention: `[table_name]_[column_name]_fkey`
- When there are multiple relationships between tables, always specify the exact foreign key to avoid ambiguity
- Some queries using `branches!inner(...)` were left unchanged as they correctly use the `branch_id` column from the `accounts` table