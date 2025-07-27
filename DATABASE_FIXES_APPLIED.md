# Database Fixes Applied - Summary

## Date: 2024-01-10

### Problem
The application was showing the error:
```
relation "public.kastle_collection.collection_officers" does not exist
```

This was happening because the code was trying to reference tables with incorrect schema qualifications.

### Root Cause
1. The database has two schemas: `kastle_banking` and `kastle_collection`
2. The code was using a single Supabase client and trying to reference tables with schema prefixes
3. Some tables were being referenced in the wrong schema

### Fixes Applied

#### 1. Updated Supabase Configuration (`src/lib/supabase.js`)
- Created separate Supabase clients for each schema:
  - `supabaseBanking` - configured to use `kastle_banking` schema by default
  - `supabaseCollection` - configured to use `kastle_collection` schema by default
- Updated the TABLES constant to correctly identify which tables belong to which schema
- Added a helper function `getClientForTable()` to determine which client to use

#### 2. Fixed Service Files
- **`src/services/specialistReportService.js`**:
  - Updated to use `supabaseCollection` for collection tables
  - Updated to use `supabaseBanking` for banking tables
  - Fixed cross-schema joins by fetching data separately and merging in JavaScript
  - Removed all schema prefixes from table references

- **`src/services/collectionService.js`**:
  - Fixed `getCollectionCases` to use `supabaseBanking` (since collection_cases is in kastle_banking schema)
  - Removed all schema prefixes from foreign key references
  - Added logic to fetch officer details separately from the collection schema

#### 3. Fixed Component Files
- **`src/pages/SpecialistReport.jsx`**
- **`src/pages/DelinquencyExecutiveDashboard.tsx`**
- Removed schema prefixes and ensured correct client usage

### Key Tables by Schema

#### kastle_banking schema:
- customers
- accounts
- transactions
- loan_accounts
- products
- **collection_cases** (Note: This is in banking schema, not collection)
- **collection_buckets** (Note: This is in banking schema, not collection)
- collection_rates

#### kastle_collection schema:
- collection_officers
- collection_teams
- collection_interactions
- promise_to_pay
- officer_performance_metrics
- officer_performance_summary
- field_visits
- legal_cases

### Pattern for Cross-Schema Queries
Since Supabase doesn't support cross-schema joins directly, we now:
1. Query the primary table from its schema
2. Extract foreign keys
3. Query related tables from other schemas
4. Merge the data in JavaScript

Example:
```javascript
// Step 1: Get cases from banking schema
const { data: cases } = await supabaseBanking
  .from('collection_cases')
  .select('*');

// Step 2: Get officer IDs
const officerIds = cases.map(c => c.assigned_to);

// Step 3: Get officers from collection schema
const { data: officers } = await supabaseCollection
  .from('collection_officers')
  .select('*')
  .in('officer_id', officerIds);

// Step 4: Merge data
const casesWithOfficers = cases.map(c => ({
  ...c,
  officer: officers.find(o => o.officer_id === c.assigned_to)
}));
```

### Testing
After these fixes, the error "relation public.kastle_collection.collection_officers does not exist" should be resolved. The application should now correctly query tables from their respective schemas.