# Supabase Schema Access Solution

## Problem Summary

The application is experiencing errors because:
1. The schemas `kastle_banking` and `kastle_collection` are not exposed in the Supabase API settings
2. The code uses Supabase's foreign key relationship syntax (e.g., `collection_teams!team_id`) which requires schema exposure
3. Without exposed schemas, these foreign key relationships cannot be resolved

## Error Examples

```
Error fetching specialists: {
  code: 'PGRST200', 
  details: "Searched for a foreign key relationship between 'kastle_collection.collection_officers' and 'collection_teams' in the schema 'public', but no matches were found.", 
  hint: "Perhaps you meant 'kastle_banking.collection_cases' instead of 'kastle_collection.collection_officers'.", 
  message: "Could not find a relationship between 'kastle_collection.collection_officers' and 'collection_teams' in the schema cache"
}
```

## Immediate Solution

### Option 1: Enable Schemas in Supabase (Recommended)

1. Go to your Supabase Dashboard
2. Navigate to **Settings → API**
3. Under **"Exposed schemas"**, add:
   - `kastle_banking`
   - `kastle_collection`
4. Save the changes
5. The application should work immediately without code changes

### Option 2: Code Workaround (Temporary)

If you cannot expose the schemas immediately, I've implemented a workaround for the `getSpecialists` function that:
1. Fetches data from related tables separately
2. Manually joins the data in JavaScript
3. Avoids using foreign key relationship syntax

## Files That Need Updates

The following files use foreign key relationships and will need updates if schemas remain unexposed:

1. **collectionService.js** - Multiple functions use foreign key joins
2. **specialistReportService.js** - Uses joins for teams, loan accounts, products, customers
3. **branchReportService.js** - Uses joins for officers, interactions, promise to pay
4. **productReportService.js** - Uses joins for interactions and promise to pay

## Long-term Recommendations

1. **Expose the schemas** - This is the cleanest solution that requires no code changes
2. **Use RPC functions** - Create PostgreSQL functions in the public schema that handle complex queries
3. **Implement a data access layer** - Create a service that handles all cross-schema queries with proper error handling

## Testing After Fix

After exposing schemas or applying code fixes, test with:

```javascript
// Test schema access
const { data, error } = await supabase
  .from('kastle_collection.collection_officers')
  .select('*, collection_teams!team_id(*)')
  .limit(1);

if (error) {
  console.error('Schema still not accessible:', error);
} else {
  console.log('Schema access successful!');
}
```

## Current Status

- ✅ Fixed `getSpecialists` function in collectionService.js with manual join workaround
- ⏳ Other functions still need updates if schemas remain unexposed
- 🎯 Recommended action: Enable schemas in Supabase Dashboard