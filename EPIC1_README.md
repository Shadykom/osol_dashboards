# CMS Platform Foundation (EPIC 1)

Collection Management System - Multi-tenant Platform Foundation

## Overview

This is the EPIC 1 implementation of the CMS platform foundation, providing:

- **Multi-tenant architecture** with Postgres RLS
- **Monorepo structure** with pnpm workspaces
- **REST API** with Fastify
- **Request context** and correlation tracking
- **Placeholder auth/RBAC** for future implementation

## Architecture

```
/workspace
├── apps/
│   └── web/                  # Future: Next.js web app
├── services/
│   └── api/                  # Fastify REST API
│       ├── src/
│       │   ├── config/       # Environment configuration
│       │   ├── db/           # Database client with tenant context
│       │   ├── middleware/   # Request-id, tenant, auth, RBAC
│       │   └── routes/       # Health endpoints
│       └── package.json
├── packages/
│   └── common/               # Shared types, logging, errors, context
│       ├── src/
│       │   ├── types/        # TypeScript types
│       │   ├── logging/      # Pino-based structured logging
│       │   ├── errors/       # Error classes and handling
│       │   └── context/      # AsyncLocalStorage request context
│       └── package.json
├── infra/
│   └── db/                   # Database infrastructure
│       ├── migrations/       # SQL migrations
│       ├── seeds/            # Development seed data
│       ├── policies/         # RLS policy documentation
│       └── run-migrations.js # Migration runner
├── openapi/
│   └── cms-api.yaml          # OpenAPI 3.1 specification
├── pnpm-workspace.yaml       # Workspace configuration
└── package.json              # Root package with scripts
```

## Non-Negotiables Implemented

| Requirement | Implementation |
|------------|---------------|
| Multi-tenant: `tenant_id` on all tables | ✅ All tenant tables have `tenant_id UUID NOT NULL` |
| Postgres RLS enabled | ✅ RLS enabled on `users`, `audit_log`, `tenant_config`, `feature_flags` |
| RLS rule: `tenant_id = current_setting('app.current_tenant')::uuid` | ✅ Standard policy on all tenant tables |
| API sets tenant per request | ✅ `queryWithTenant()` calls `set_config('app.current_tenant', ...)` |
| No hardcoded tenant routing | ✅ Tenant from `x-tenant-id` header or JWT claim |
| Prepare for SaaS + On-Prem | ✅ No SaaS-only assumptions |
| Logging + error handling | ✅ Pino structured logging, custom error classes |
| RBAC placeholders | ✅ Stub middleware with role hierarchy |

## Prerequisites

- Node.js 20+
- pnpm 10+
- PostgreSQL 15+ (or Supabase)

## Quick Start

### 1. Install Dependencies

```bash
pnpm install
```

### 2. Configure Environment

```bash
# Copy API environment file
cp services/api/.env.example services/api/.env

# Edit with your database credentials
# For Supabase: Get connection string from Project Settings -> Database
```

### 3. Run Database Migrations

```bash
# Run migrations only
pnpm db:migrate

# Run migrations + seed development data
pnpm db:seed
```

### 4. Start the API Server

```bash
# Development mode with hot reload
pnpm dev:api
```

### 5. Start the Web App (existing Vite app)

```bash
# In a new terminal
pnpm dev:web
```

## API Endpoints

### Health Check

```bash
# Liveness probe
curl http://localhost:3001/health

# Readiness probe (checks database)
curl http://localhost:3001/ready
```

### Tenant-Scoped Requests

All non-health endpoints require tenant context:

```bash
# Development: Use x-tenant-id header
curl -H "x-tenant-id: 00000000-0000-0000-0000-000000000001" \
     http://localhost:3001/api/v1/users

# Or set DEFAULT_TENANT_FOR_DEV in .env
```

## Development

### Available Scripts

| Script | Description |
|--------|-------------|
| `pnpm dev:web` | Start Vite web app |
| `pnpm dev:api` | Start API with hot reload |
| `pnpm build:all` | Build all packages |
| `pnpm db:migrate` | Run database migrations |
| `pnpm db:seed` | Run migrations + seed data |
| `pnpm typecheck` | TypeScript type checking |
| `pnpm lint` | ESLint |

### Adding New Tenant Tables

1. Create migration in `infra/db/migrations/`:

```sql
-- migrations/XXX_create_my_table.sql

CREATE TABLE IF NOT EXISTS my_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    -- ... other columns
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE my_table ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY my_table_tenant_isolation ON my_table
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid);
```

2. Use `queryWithTenant()` in your code:

```typescript
import { queryWithTenant } from '../db/index.js';

const result = await queryWithTenant(
  tenantId,
  'SELECT * FROM my_table WHERE status = $1',
  ['active']
);
```

### Request Context

The API uses AsyncLocalStorage for request-scoped context:

```typescript
import { 
  getRequiredTenantId, 
  getRequestId,
  withTenantContext 
} from './middleware/tenantContext.js';

// In a route handler
fastify.get('/example', async (request) => {
  return withTenantContext(request, async () => {
    const tenantId = getRequiredTenantId();
    // ... your logic
  });
});
```

## Database Schema

### Core Tables

| Table | Description | RLS |
|-------|-------------|-----|
| `tenants` | Tenant configuration | No (global) |
| `users` | User accounts | Yes |
| `audit_log` | Audit trail | Yes |
| `system_config` | Global settings | No |
| `tenant_config` | Per-tenant settings | Yes |
| `feature_flags` | Feature toggles | Yes |

### Seed Data

Development seed creates:
- 3 test tenants (dev, demo-bank, test-cu)
- 6 test users across tenants
- Feature flags and configuration

Default development tenant: `00000000-0000-0000-0000-000000000001`

## Error Handling

Custom error classes with automatic HTTP status codes:

```typescript
import { 
  BadRequestError,      // 400
  UnauthorizedError,    // 401
  ForbiddenError,       // 403
  NotFoundError,        // 404
  ValidationError,      // 422
  TenantRequiredError,  // 400
  DatabaseError,        // 500
} from '@cms/common';

// Throw anywhere in code
throw new NotFoundError('User', userId);
// Response: { "code": "NOT_FOUND", "message": "User with id 'xxx' not found" }
```

## Logging

Structured JSON logging with Pino:

```typescript
import { getLogger, logError } from '@cms/common';

const logger = getLogger();

// Standard logging
logger.info({ tenantId, userId }, 'User logged in');

// Error logging with context
logError(logger, error, 'Operation failed', { context: 'extra data' });
```

## Next Steps (Future EPICs)

- **EPIC 2**: Authentication (JWT, SSO)
- **EPIC 3**: Full RBAC implementation
- **EPIC 4**: Collection case management
- **EPIC 5**: Customer management
- **EPIC 6**: Reporting and analytics
- **EPIC 7**: AI recommendations (governed)

## Troubleshooting

### Database Connection Issues

```bash
# Check your DATABASE_URL in services/api/.env
# For Supabase, ensure SSL is enabled:
DATABASE_SSL=true
```

### RLS Policy Errors

```sql
-- Verify RLS is enabled
SELECT tablename, rowsecurity FROM pg_tables WHERE schemaname = 'public';

-- Verify tenant context is set
SELECT current_setting('app.current_tenant', true);
```

### Missing Tenant Context

```
Error: Tenant ID is required for this operation
```

Solution: Add `x-tenant-id` header or set `DEFAULT_TENANT_FOR_DEV` in `.env`

## License

Proprietary - All rights reserved
