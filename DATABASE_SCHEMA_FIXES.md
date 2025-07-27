# Database Schema Fixes Summary

## Overview
The application is experiencing errors because it's trying to access tables with incorrect schema qualifications. The database has two main schemas:
- `kastle_banking` - Contains banking-related tables
- `kastle_collection` - Contains collection-related tables

## Key Issues Fixed

### 1. Supabase Client Configuration
Updated `/src/lib/supabase.js` to create separate clients for each schema:
- `supabaseBanking` - Uses `kastle_banking` schema
- `supabaseCollection` - Uses `kastle_collection` schema

### 2. Table References
All table references should use unqualified names when using the schema-specific clients:
- ❌ Wrong: `supabaseBanking.from('kastle_collection.collection_officers')`
- ✅ Correct: `supabaseCollection.from('collection_officers')`

### 3. Cross-Schema Joins
When joining tables across schemas, we need to fetch data separately:
- First query the primary table
- Then query related tables from other schemas using the IDs
- Merge the data in JavaScript

## Tables by Schema

### kastle_banking schema:
- customers
- accounts
- transactions
- loan_accounts
- branches
- products
- collection_cases (Note: This is in banking schema, not collection)
- collection_buckets (Note: This is in banking schema, not collection)

### kastle_collection schema:
- collection_officers
- collection_teams
- collection_interactions
- promise_to_pay
- officer_performance_metrics
- officer_performance_summary
- field_visits
- legal_cases
- collection_scores

## Files Updated

1. **src/lib/supabase.js**
   - Created separate clients for each schema
   - Updated TABLES constant with correct schema prefixes

2. **src/services/specialistReportService.js**
   - Updated to use `supabaseCollection` for collection tables
   - Updated to use `supabaseBanking` for banking tables
   - Fixed cross-schema joins by fetching data separately

## Common Patterns

### Pattern 1: Simple Query
```javascript
// Collection table
const { data } = await supabaseCollection
  .from('collection_officers')
  .select('*');

// Banking table  
const { data } = await supabaseBanking
  .from('customers')
  .select('*');
```

### Pattern 2: Cross-Schema Join
```javascript
// Step 1: Get collection data
const { data: officers } = await supabaseCollection
  .from('collection_officers')
  .select('officer_id, officer_name, team_id');

// Step 2: Get related banking data
const teamIds = officers.map(o => o.team_id);
const { data: teams } = await supabaseCollection
  .from('collection_teams')
  .select('*')
  .in('team_id', teamIds);

// Step 3: Merge data
const officersWithTeams = officers.map(officer => ({
  ...officer,
  team: teams.find(t => t.team_id === officer.team_id)
}));
```

## Next Steps

All services and components need to be reviewed to ensure they:
1. Use the correct client for each table
2. Don't use schema-qualified names with schema-specific clients
3. Handle cross-schema joins properly by fetching data separately