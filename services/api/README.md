# OSOL API Service

Multi-tenant API service with Row Level Security (RLS) enforcement.

## Features

- **Tenant Isolation**: Every database query is automatically scoped to the current tenant using PostgreSQL's `set_config('app.current_tenant', tenant_id, true)`
- **Middleware Chain**: Request ID → Auth (stub) → Tenant Context → DB Context with set_config
- **RBAC**: Role-based access control with dev bypass support
- **Platform Endpoints**: Tenant info and organizational unit management

## Quick Start

```bash
# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env
# Edit .env with your database credentials

# Start development server
npm run dev

# Run tests
npm test
```

## API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/ready` - Readiness check (includes DB connectivity)
- `GET /health/live` - Liveness check

### Platform
- `GET /platform/tenants/me` - Get current tenant info (requires tenant context)
- `GET /platform/org-units/tree` - Get organizational structure (requires ADMIN role)
- `GET /platform/org-units/:id` - Get specific org unit (requires ADMIN role)
- `GET /platform/org-units/:id/children` - Get org unit children (requires ADMIN role)

## Tenant Context

Every request must include tenant context. Set it via:

1. **Header** (recommended for development):
   ```
   x-tenant-id: 11111111-1111-1111-1111-111111111111
   ```

2. **JWT Claims** (production):
   The auth middleware extracts `tenantId` from the authenticated user's JWT.

## RBAC Bypass (Development)

For endpoints requiring admin access, use the dev bypass header:
```
x-dev-role: ADMIN
```

## Middleware Chain

1. **request-id** - Generates/extracts unique request ID for tracing
2. **auth** - Authenticates user (currently a stub)
3. **tenant-context** - Extracts tenant ID from headers/JWT
4. **db-context** - Creates per-request DB client with `set_config`

## Database Access Layer

The `TenantClient` automatically sets the tenant context for every connection:

```javascript
import { withTenantClient } from './db/tenant-client.js';

// Automatic tenant scoping
const users = await withTenantClient(tenantId, async (client) => {
  const result = await client.query('SELECT * FROM users');
  return result.rows;
  // RLS will automatically filter by tenant
});
```

## RLS Policy Example

```sql
-- Enable RLS on table
ALTER TABLE org_units ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation_policy ON org_units
  FOR ALL
  USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
  WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);
```

## Testing

### Unit Tests
```bash
npm test
```

### Integration Tests (requires database)
```bash
npm run test:integration
```

The integration tests:
1. Create two tenants with different org units
2. Verify queries with Tenant A context only return Tenant A data
3. Verify queries with Tenant B context only return Tenant B data
4. Verify cross-tenant access is prevented

## Architecture

```
services/api/
├── src/
│   ├── config/           # Application configuration
│   ├── db/               # Database access layer
│   │   ├── pool.js       # Connection pool
│   │   └── tenant-client.js  # Tenant-aware client wrapper
│   ├── middleware/       # Express middleware
│   │   ├── request-id.js
│   │   ├── auth.js
│   │   ├── tenant-context.js
│   │   ├── db-context.js
│   │   └── rbac.js
│   ├── routes/           # API routes
│   │   ├── health.js
│   │   └── platform/
│   │       ├── tenants.js
│   │       └── org-units.js
│   ├── tests/            # Test files
│   └── index.js          # Application entry point
└── package.json
```

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `PORT` | Server port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `DB_HOST` | Database host | - |
| `DB_PORT` | Database port | `5432` |
| `DB_NAME` | Database name | `postgres` |
| `DB_USER` | Database user | `postgres` |
| `DB_PASSWORD` | Database password | - |
| `DB_SCHEMA` | Database schema | `kastle_banking` |
| `DB_SSL` | Enable SSL | `true` |
| `RBAC_ENABLED` | Enable RBAC | `true` |
| `RBAC_DEV_BYPASS` | Allow dev role bypass | `true` |
