# Database Connection Standardization

## Overview
All database connections in the application have been standardized to use shared Supabase client instances from `src/lib/supabase.js`. This ensures consistency, prevents duplicate client creation, and eliminates the "Multiple GoTrueClient instances" warning.

## Shared Supabase Clients

The application uses three main Supabase client instances:

### 1. Main Client (`supabase`)
- **Purpose**: General authentication and default operations
- **Schema**: Public schema
- **Import**: `import { supabase } from '@/lib/supabase'`
- **Used by**: 
  - AuthContext
  - Authentication helpers
  - General utilities

### 2. Banking Client (`supabaseBanking`)
- **Purpose**: All banking-related operations
- **Schema**: `kastle_banking`
- **Import**: `import { supabaseBanking } from '@/lib/supabase'`
- **Used by**:
  - Dashboard services
  - Customer services
  - Account/Transaction pages
  - Loan management

### 3. Collection Client (`supabaseCollection`)
- **Purpose**: All collection-related operations
- **Schema**: `kastle_collection`
- **Import**: `import { supabaseCollection } from '@/lib/supabase'`
- **Used by**:
  - Collection services
  - Collection dashboard
  - Specialist reports
  - Collection officers management

## Standard Import Pattern

All files should import Supabase clients using this pattern:

```javascript
import { 
  supabase,           // Main client (if needed)
  supabaseBanking,    // Banking operations
  supabaseCollection, // Collection operations
  TABLES,             // Table constants
  COLLECTION_TABLES,  // Collection table constants
  getClientForTable   // Helper function
} from '@/lib/supabase';
```

## Files Updated

### Fixed Files
1. **`src/utils/fixDashboardAuth.js`**
   - Previously created its own client
   - Now uses shared `supabaseBanking` client

### Removed Files
1. **`src/lib/supabase-temp.js`** - Temporary mock client (deleted)
2. **`src/lib/supabaseBypass.js`** - Bypass client (deleted)
3. **`test_db_connection.js`** - Test file with own client (deleted)

### Verified Files (Already Using Shared Clients)
- All service files in `src/services/`
- All page components in `src/pages/`
- AuthContext and other contexts
- All utility files

## Best Practices

### DO ✅
- Always import clients from `@/lib/supabase`
- Use `supabaseBanking` for banking schema operations
- Use `supabaseCollection` for collection schema operations
- Use the `getClientForTable()` helper when the schema is dynamic

### DON'T ❌
- Never create new Supabase clients with `createClient()`
- Don't import `@supabase/supabase-js` directly in application code
- Avoid hardcoding connection strings or keys outside of `src/lib/supabase.js`

## Environment Configuration

All Supabase configuration is centralized in the `.env` file:

```env
VITE_SUPABASE_URL=https://bzlenegoilnswsbanxgb.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGc...
```

The `src/lib/supabase.js` file handles:
- Reading environment variables
- Creating configured clients
- Providing mock clients when not configured
- Managing authentication tokens

## Benefits of This Approach

1. **No Duplicate Clients**: Eliminates the "Multiple GoTrueClient instances" warning
2. **Consistent Configuration**: All clients share the same auth settings
3. **Schema Isolation**: Each client is configured for its specific schema
4. **Easier Maintenance**: Single point of configuration
5. **Better Performance**: Reuses existing connections
6. **Simplified Testing**: Easy to mock the shared clients

## Migration Guide

If you find any file still creating its own Supabase client:

1. Remove the `createClient` import
2. Import the appropriate shared client
3. Replace client creation with the imported client
4. Test to ensure functionality remains the same

Example migration:
```javascript
// Before
import { createClient } from '@supabase/supabase-js';
const supabase = createClient(url, key);

// After
import { supabaseBanking } from '@/lib/supabase';
// Use supabaseBanking directly
```