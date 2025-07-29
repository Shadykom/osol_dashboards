# Schema Method Fix Summary

## Issue
The application was experiencing 401 "Invalid API key" errors when accessing collection-related pages, particularly `/collection/specialist-report`. The error was caused by calling `.schema('kastle_collection')` on Supabase clients that were already configured with a schema.

## Root Cause
When creating the Supabase clients in `src/lib/supabase.js`:
- `supabaseBanking` is already configured with `db: { schema: 'kastle_banking' }`
- `supabaseCollection` is already configured with `db: { schema: 'kastle_collection' }`

Calling `.schema()` again on these pre-configured clients was causing the API requests to fail with authentication errors.

## Files Fixed

### 1. `src/pages/SpecialistReport.jsx`
- Removed `.schema('kastle_collection')` from 2 locations
- Now uses `supabaseCollection.from('table_name')` directly

### 2. `src/services/specialistReportService.js`
- Removed `.schema('kastle_collection')` from 9 locations
- All queries now use the pre-configured schema

### 3. `src/services/collectionService.js`
- Removed `.schema('kastle_collection')` from 16 locations using sed command
- Fixed all collection table queries

### 4. `src/services/branchReportService.js`
- Removed `.schema('kastle_collection')` from 1 location
- Fixed collection_officers query

## Correct Usage

### ❌ Incorrect (causes 401 errors):
```javascript
const { data, error } = await supabaseCollection
  .schema('kastle_collection')  // Don't do this!
  .from('collection_officers')
  .select('*');
```

### ✅ Correct:
```javascript
const { data, error } = await supabaseCollection
  .from('collection_officers')
  .select('*');
```

## Key Takeaway
When using pre-configured Supabase clients:
- `supabase` - for public schema
- `supabaseBanking` - for kastle_banking schema
- `supabaseCollection` - for kastle_collection schema

Never call `.schema()` on these clients as they're already configured with the appropriate schema.

## Next Steps
1. Restart the development server to apply changes
2. Test the `/collection/specialist-report` page
3. Verify no more 401 errors occur