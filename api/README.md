# CMS API

Backend API for the Collection Management System (CMS) - EPIC 1 Database Layer.

## Quick Start

```bash
# Install dependencies
npm install

# Copy environment config
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run db:migrate

# Seed sample data
npm run db:seed

# Start development server
npm run dev
```

## Environment Configuration

Copy `.env.example` to `.env` and configure:

| Variable | Description | Required |
|----------|-------------|----------|
| `DATABASE_URL` | PostgreSQL connection string | Yes |
| `PORT` | Server port (default: 3001) | No |
| `DEFAULT_TENANT_FOR_DEV` | Tenant ID for development | Dev only |
| `RBAC_ENABLED` | Enable RBAC checks | Yes |
| `RBAC_DEV_BYPASS` | Bypass RBAC in dev mode | Dev only |

## Multi-Tenant Architecture

This API implements strict multi-tenant isolation using PostgreSQL Row Level Security (RLS).

### Setting Tenant Context

Every request must include the tenant ID via the `x-tenant-id` header:

```bash
curl -H "x-tenant-id: 11111111-1111-1111-1111-111111111111" \
     http://localhost:3001/api/users
```

In development, if `DEFAULT_TENANT_FOR_DEV` is set and no header is provided, that tenant will be used.

### RLS Implementation

All queries automatically filter by tenant using PostgreSQL's `current_setting`:

```sql
SET app.current_tenant = '<tenant-uuid>';
-- All subsequent queries are tenant-scoped
```

## Database Schema

The API uses the `platform` schema with these tables:

- `platform.tenants` - Tenant organizations
- `platform.org_units` - Organizational hierarchy (HO/CENTER/BRANCH/TEAM)
- `platform.users` - User accounts
- `platform.roles` - Role definitions
- `platform.permissions` - Global permission catalog
- `platform.role_permissions` - Role-permission mappings
- `platform.user_roles` - User-role assignments with scope

See `/infra/db/README.md` for detailed schema documentation.

## Project Structure

```
api/
├── .env.example      # Environment template
├── package.json      # Dependencies
├── README.md         # This file
└── src/
    ├── index.js      # Entry point
    ├── config/       # Configuration
    ├── middleware/   # Express middleware
    ├── routes/       # API routes
    ├── services/     # Business logic
    └── db/           # Database utilities
```

## API Endpoints (EPIC 1)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/health` | Health check |
| GET | `/api/org-units` | List org units |
| GET | `/api/users` | List users |
| GET | `/api/roles` | List roles |
| GET | `/api/permissions` | List permissions |

## Development

```bash
# Run with auto-reload
npm run dev

# Run linter
npm run lint

# Run tests
npm test
```

## Security Notes

1. **Never commit `.env`** - It contains secrets
2. **Always require `x-tenant-id`** in production
3. **Disable `RBAC_DEV_BYPASS`** in production
4. **Use connection pooling** for production workloads
