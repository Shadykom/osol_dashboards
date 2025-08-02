# Collection Database Error Fixes

This document explains the fixes for the console errors you were experiencing.

## Errors Fixed

### 1. Missing Column Error
**Error:** `column collection_teams.branch_id does not exist`

**Fix:** Added the `branch_id` column to the `collection_teams` table and populated it based on the branch assignments of officers in each team.

### 2. Realtime Subscription Errors
**Error:** `Unable to subscribe to changes... Please check Realtime is enabled`

**Fix:** Enabled realtime subscriptions for:
- `kastle_banking.collection_cases`
- `kastle_banking.branch_collection_performance`

### 3. Query Parsing Error
**Error:** `failed to parse select parameter` with complex nested foreign key joins

**Fix:** Created simplified database views that flatten the complex relationships:
- `collection_cases_detailed` - For listing collection cases
- `collection_case_full_details` - For detailed case information
- `customer_contacts_by_case` - For customer contact information
- `customer_addresses_by_case` - For customer address information
- `loan_schedules_by_case` - For loan payment schedules

## How to Apply the Fixes

1. Run the fix script:
   ```bash
   ./run_collection_fixes.sh
   ```

2. The script will:
   - Add the missing `branch_id` column to `collection_teams`
   - Enable realtime for the required tables
   - Create simplified views to avoid query parsing errors
   - Set up proper foreign key relationships

## Code Changes Made

### 1. CollectionService.js
- Updated `getCollectionCases()` to use `collection_cases_detailed` view
- Updated `getCaseDetails()` to use `collection_case_full_details` view
- Updated `getSpecialistDashboard()` to use simplified views

### 2. Database Views Created
The views join multiple tables and flatten the data structure, making it easier for Supabase to parse the queries and avoiding the nested foreign key syntax that was causing errors.

## Benefits

1. **No more parsing errors** - Simplified queries work reliably
2. **Better performance** - Views are optimized by the database
3. **Cleaner code** - Simpler queries in the JavaScript code
4. **Realtime updates** - Tables now support realtime subscriptions

## Testing

After running the fixes, test the following:
1. Collection cases list should load without errors
2. Case details page should show all information
3. Officer performance reports should work
4. Realtime updates should function properly

## Rollback

If you need to rollback these changes, you can:
1. Drop the created views
2. Remove the `branch_id` column from `collection_teams`
3. Revert the JavaScript code changes

However, this is not recommended as it will bring back the errors.