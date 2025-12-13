# EPIC 1 - Database Layer for CMS

This directory contains SQL migrations for the platform schema as part of EPIC 1 (Database Layer).

## Directory Structure

```
/infra/db/
├── migrations/
│   ├── 001_create_platform_schema_and_tenants.sql
│   ├── 002_create_org_units.sql
│   ├── 003_create_users.sql
│   ├── 004_create_roles.sql
│   ├── 005_create_permissions.sql
│   ├── 006_create_role_permissions.sql
│   ├── 007_create_user_roles.sql
│   └── 008_seed_data.sql
└── README.md
```

## Schema Overview

All tables are created in the `platform` schema.

### Tables

| Table | Description | Has RLS |
|-------|-------------|---------|
| `platform.tenants` | Multi-tenant base table | No (is the tenant reference) |
| `platform.org_units` | Organizational hierarchy (HO/CENTER/BRANCH/TEAM) | Yes |
| `platform.users` | User accounts | Yes |
| `platform.roles` | Role definitions per tenant | Yes |
| `platform.permissions` | Global permission catalog | No (global) |
| `platform.role_permissions` | Maps roles to permissions | Yes |
| `platform.user_roles` | Maps users to roles with optional scope | Yes |

### Entity Relationship

```
tenants (1) ─────┬──── (N) org_units
                 │
                 ├──── (N) users
                 │
                 ├──── (N) roles
                 │
                 └──── (N) role_permissions ──── permissions (global)
                            │
                            └──── user_roles
```

## Multi-Tenancy & Row Level Security (RLS)

### Setting the Current Tenant

Before executing queries on tenant-scoped tables, you **MUST** set the current tenant context:

```sql
-- Set the current tenant for the session/connection
SET app.current_tenant = '11111111-1111-1111-1111-111111111111';
```

Or for a single transaction:

```sql
SET LOCAL app.current_tenant = '11111111-1111-1111-1111-111111111111';
```

### Application Integration

In your application code, set the tenant context at the beginning of each request:

#### Node.js / Supabase Example

```javascript
// At the start of each request, after authentication
const setTenantContext = async (client, tenantId) => {
  await client.rpc('set_config', { 
    setting: 'app.current_tenant', 
    value: tenantId 
  });
  // Or using raw SQL:
  // await client.query(`SET app.current_tenant = '${tenantId}'`);
};
```

#### Express.js Middleware Example

```javascript
const tenantMiddleware = async (req, res, next) => {
  const tenantId = req.user?.tenantId; // Get from JWT or session
  
  if (!tenantId) {
    return res.status(401).json({ error: 'Tenant context required' });
  }
  
  // Set tenant context for this request
  await req.db.query(`SET LOCAL app.current_tenant = '${tenantId}'`);
  
  next();
};
```

#### PostgreSQL Function Helper

```sql
-- Create a helper function to set tenant context
CREATE OR REPLACE FUNCTION platform.set_current_tenant(p_tenant_id UUID)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_tenant', p_tenant_id::text, false);
END;
$$ LANGUAGE plpgsql;

-- Usage:
SELECT platform.set_current_tenant('11111111-1111-1111-1111-111111111111');
```

### RLS Policy Pattern

All tenant-scoped tables use the following RLS pattern:

```sql
ALTER TABLE platform.table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation_policy ON platform.table_name
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant', true)::uuid)
    WITH CHECK (tenant_id = current_setting('app.current_tenant', true)::uuid);
```

The `true` parameter in `current_setting()` returns NULL instead of raising an error if the setting is not defined.

## Running Migrations

### Using psql

```bash
# Run all migrations in order
psql -h <host> -U <user> -d <database> -f migrations/001_create_platform_schema_and_tenants.sql
psql -h <host> -U <user> -d <database> -f migrations/002_create_org_units.sql
psql -h <host> -U <user> -d <database> -f migrations/003_create_users.sql
psql -h <host> -U <user> -d <database> -f migrations/004_create_roles.sql
psql -h <host> -U <user> -d <database> -f migrations/005_create_permissions.sql
psql -h <host> -U <user> -d <database> -f migrations/006_create_role_permissions.sql
psql -h <host> -U <user> -d <database> -f migrations/007_create_user_roles.sql
psql -h <host> -U <user> -d <database> -f migrations/008_seed_data.sql
```

### Using a single command

```bash
# Concatenate and run all migrations
cat migrations/*.sql | psql -h <host> -U <user> -d <database>
```

### Supabase

For Supabase, you can run migrations via the SQL Editor in the dashboard or use the Supabase CLI:

```bash
supabase db push
```

## Seed Data

Migration `008_seed_data.sql` creates:

1. **1 Tenant**: "Demo Organization"
2. **Organizational Hierarchy**:
   - Head Office (HO-001)
     - Central Region (CENTER-001)
       - Downtown Branch (BRANCH-001)
         - Collection Team Alpha (TEAM-001)
3. **3 Roles**: ADMIN, SUPERVISOR, AGENT
4. **24 Permissions**: Covering users, roles, org_units, reports, settings, dashboard, cases
5. **1 Admin User**: admin@demo.org with ADMIN role

### Seed Data IDs (for testing)

| Entity | ID |
|--------|-----|
| Tenant | `11111111-1111-1111-1111-111111111111` |
| HO | `bbbbbbbb-0001-0001-0001-000000000001` |
| CENTER | `bbbbbbbb-0001-0001-0001-000000000002` |
| BRANCH | `bbbbbbbb-0001-0001-0001-000000000003` |
| TEAM | `bbbbbbbb-0001-0001-0001-000000000004` |
| ADMIN Role | `cccccccc-0001-0001-0001-000000000001` |
| SUPERVISOR Role | `cccccccc-0001-0001-0001-000000000002` |
| AGENT Role | `cccccccc-0001-0001-0001-000000000003` |
| Admin User | `dddddddd-0001-0001-0001-000000000001` |

## Indexes

The following indexes are created for optimal query performance:

| Table | Index | Columns |
|-------|-------|---------|
| org_units | `idx_org_units_tenant_parent` | tenant_id, parent_id |
| org_units | `idx_org_units_tenant_type` | tenant_id, type |
| org_units | `idx_org_units_path` | path |
| users | `idx_users_tenant_email` | tenant_id, email |
| users | `idx_users_external_id` | external_id (partial) |
| user_roles | `idx_user_roles_tenant_user` | tenant_id, user_id |
| user_roles | `idx_user_roles_tenant_role` | tenant_id, role_id |

## Common Queries

### Get user permissions

```sql
-- Set tenant context first
SET app.current_tenant = '11111111-1111-1111-1111-111111111111';

-- Get all permissions for a user
SELECT DISTINCT p.code, p.description
FROM platform.user_roles ur
JOIN platform.role_permissions rp ON ur.role_id = rp.role_id
JOIN platform.permissions p ON rp.permission_id = p.id
WHERE ur.user_id = 'dddddddd-0001-0001-0001-000000000001';
```

### Get organization hierarchy

```sql
-- Get full hierarchy as a tree
WITH RECURSIVE org_tree AS (
    SELECT id, parent_id, type, name, code, path, 1 as level
    FROM platform.org_units
    WHERE parent_id IS NULL
    
    UNION ALL
    
    SELECT o.id, o.parent_id, o.type, o.name, o.code, o.path, t.level + 1
    FROM platform.org_units o
    JOIN org_tree t ON o.parent_id = t.id
)
SELECT * FROM org_tree ORDER BY path;
```

### Check if user has permission

```sql
-- Check if user has a specific permission (optionally scoped)
SELECT EXISTS (
    SELECT 1 
    FROM platform.user_roles ur
    JOIN platform.role_permissions rp ON ur.role_id = rp.role_id
    JOIN platform.permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = $1 
      AND p.code = $2
      AND (ur.scope_org_unit_id IS NULL OR ur.scope_org_unit_id = $3)
) as has_permission;
```

## Audit Columns

All tables include standard audit columns:

| Column | Type | Description |
|--------|------|-------------|
| `created_at` | TIMESTAMPTZ | Auto-set on INSERT |
| `updated_at` | TIMESTAMPTZ | Auto-updated on UPDATE via trigger |
| `created_by` | UUID (nullable) | Set by application |
| `updated_by` | UUID (nullable) | Set by application |

The `updated_at` column is automatically maintained by the `platform.update_updated_at_column()` trigger function.

## Security Notes

1. **Always set tenant context** before querying tenant-scoped tables
2. **Never expose tenant IDs** in client-side code unless necessary
3. **Validate tenant membership** in your authentication layer
4. **Use parameterized queries** to prevent SQL injection when setting tenant context
5. **Consider connection pooling** implications - ensure tenant context is set per transaction, not per connection

## Rollback

To completely remove the platform schema:

```sql
-- WARNING: This will delete all data!
DROP SCHEMA platform CASCADE;
```

## Version History

| Version | Date | Description |
|---------|------|-------------|
| 1.0.0 | 2024-12-12 | Initial EPIC 1 database layer |
