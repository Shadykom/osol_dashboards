# @osol/config-resolver

Service configuration resolver with effective dating and scope-based config selection.

## Features

- **Effective Dating**: Automatically selects the latest PUBLISHED configuration version with `effective_from <= now`
- **Scope Specificity**: Supports hierarchical scopes (user > branch > region > tenant > global), preferring more specific scopes
- **Request-Scoped Caching**: Ensures consistency within a single request/transaction (not global caching)
- **Type Information**: Returns parsed `value_json` with type information

## Installation

```bash
npm install @osol/config-resolver
```

## Usage

### Basic Usage

```javascript
import { createConfigResolver } from '@osol/config-resolver';
import { supabase } from './lib/supabase';

// Create a resolver instance
const resolver = createConfigResolver(supabase);

// Resolve configuration values
const configs = await resolver.resolveConfig(
  'tenant-123',                              // tenantId
  ['feature.enabled', 'ui.theme', 'limits.maxItems'],  // keys
  { userId: 'user-456', branchId: 'branch-789' }      // contextScope (optional)
);

// Access resolved values
const themeConfig = configs.get('ui.theme');
console.log(themeConfig.value);   // { primary: '#blue', ... }
console.log(themeConfig.type);    // 'object'
console.log(themeConfig.scope);   // 'branch' (most specific match)
```

### Resolve Single Key

```javascript
const config = await resolver.resolveOne(
  'tenant-123',
  'feature.enabled',
  { userId: 'user-456' }
);

if (config) {
  console.log(config.value); // true
}
```

### Request-Scoped Caching

For consistency within a request, pass a request context object:

```javascript
// Express middleware example
app.use((req, res, next) => {
  // The same context object ensures cached values remain consistent
  req.configContext = {};
  next();
});

app.get('/api/data', async (req, res) => {
  const configs = await resolver.resolveConfig(
    req.tenantId,
    ['feature.a', 'feature.b'],
    { userId: req.userId },
    req.configContext  // Request context for caching
  );
  
  // Later in the same request, these will return cached values
  const moreConfigs = await resolver.resolveConfig(
    req.tenantId,
    ['feature.a'],  // Already cached
    { userId: req.userId },
    req.configContext
  );
});
```

### Standalone Function

For simple one-off resolutions:

```javascript
import { resolveConfig } from '@osol/config-resolver';

const configs = await resolveConfig(
  supabase,
  'tenant-123',
  ['feature.enabled'],
  { branchId: 'branch-001' }
);
```

## API Reference

### `createConfigResolver(supabaseClient, options?)`

Creates a new ConfigResolver instance.

**Parameters:**
- `supabaseClient`: Supabase client instance
- `options.tableName`: Configuration table name (default: `'config_values'`)
- `options.schema`: Database schema (default: `'kastle_banking'`)

**Returns:** `ConfigResolver` instance

### `resolver.resolveConfig(tenantId, keys, contextScope?, requestContext?)`

Resolves configuration values for the given keys.

**Parameters:**
- `tenantId`: Tenant identifier (required)
- `keys`: Array of configuration keys to resolve (required)
- `contextScope`: Context for scope resolution (optional)
  - `userId`: User ID for user-level scope
  - `branchId`: Branch ID for branch-level scope
  - `regionId`: Region ID for region-level scope
- `requestContext`: Object to store request-scoped cache (optional)

**Returns:** `Promise<Map<string, ResolvedConfigValue>>`

### `ResolvedConfigValue`

```typescript
{
  key: string;           // Configuration key
  value: any;            // Parsed configuration value
  type: string;          // Type: 'string' | 'number' | 'boolean' | 'object' | 'array'
  scope: string;         // Scope at which value was resolved
  scopeId?: string;      // ID for the scope (e.g., userId, branchId)
  version: number;       // Version identifier
  effectiveFrom: Date;   // When this configuration became effective
  metadata: object;      // Additional metadata
}
```

## Scope Priority

Scopes are resolved from most specific to least specific:

1. **user** - User-specific configuration (requires `userId` in context)
2. **branch** - Branch-specific configuration (requires `branchId` in context)
3. **region** - Region-specific configuration (requires `regionId` in context)
4. **tenant** - Tenant-wide configuration
5. **global** - System-wide default configuration

When multiple configurations match, the most specific scope wins. If there are multiple versions at the same scope, the one with the most recent `effective_from` date (that is <= now) is selected.

## Database Setup (Supabase)

Before using this package, you need to create the `config_values` table in your Supabase database.

### Run the Migration

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `migrations/001_create_config_values_table.sql`
4. Click **Run**

Or run via Supabase CLI:

```bash
supabase db push
```

### Database Schema

The migration creates a `config_values` table with the following structure:

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary key |
| `tenant_id` | UUID | Tenant identifier |
| `key` | VARCHAR(255) | Configuration key (e.g., 'feature.enabled') |
| `value_json` | JSONB | The configuration value |
| `value_type` | VARCHAR(50) | Type hint: 'string', 'number', 'boolean', 'object', 'array' |
| `scope` | VARCHAR(50) | Scope level: 'global', 'tenant', 'region', 'branch', 'user' |
| `scope_id` | VARCHAR(255) | Scope identifier (e.g., user_id, branch_id) |
| `status` | VARCHAR(50) | 'DRAFT', 'PUBLISHED', or 'ARCHIVED' |
| `version` | INTEGER | Version number |
| `effective_from` | TIMESTAMPTZ | When configuration becomes active |
| `effective_to` | TIMESTAMPTZ | When configuration expires (NULL = never) |
| `metadata` | JSONB | Additional metadata |

The migration also creates:
- Optimized indexes for fast queries
- Row Level Security (RLS) policies for tenant isolation
- Auto-updating `updated_at` trigger

## Testing

```bash
npm test
```

## License

MIT
