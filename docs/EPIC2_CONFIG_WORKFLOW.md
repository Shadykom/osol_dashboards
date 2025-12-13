# EPIC 2: Configuration & Maker-Checker System

## Overview

EPIC 2 implements a comprehensive configuration management system with maker-checker workflow support. This system ensures:

- **Versioned Configuration**: All configuration changes are versioned and auditable
- **Maker-Checker Workflow**: Changes require approval before becoming effective
- **Effective Dating**: Published versions can have future effective dates
- **Tenant Isolation**: All data is isolated by tenant via RLS policies
- **Audit Trail**: Every state transition is recorded for compliance

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CONFIGURATION SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐                   │
│  │   Package    │───▶│   Version    │───▶│    Items     │                   │
│  │   (core)     │    │   (v1, v2)   │    │  key=value   │                   │
│  └──────────────┘    └──────────────┘    └──────────────┘                   │
│                             │                                                │
│                             ▼                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │                    VERSION LIFECYCLE                                 │    │
│  │                                                                      │    │
│  │   DRAFT ──▶ SUBMITTED ──▶ APPROVED ──▶ PUBLISHED ──▶ SUPERSEDED    │    │
│  │     │           │             │                                      │    │
│  │     │           ▼             │                                      │    │
│  │     │       REJECTED          │                                      │    │
│  │     │                         │                                      │    │
│  │     └──────── Maker ──────────┴─────── Checker ──────────────────    │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│                              APPROVAL WORKFLOW                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐    ┌──────────────────────────────────────────────────┐   │
│  │   Approval   │───▶│                  Steps                           │   │
│  │   Request    │    │  [1] config_checker ──▶ [2] config_admin        │   │
│  └──────────────┘    └──────────────────────────────────────────────────┘   │
│                                                                              │
│  Statuses: PENDING → IN_PROGRESS → APPROVED/REJECTED/CANCELLED/EXPIRED     │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Database Schema

### Schema: `config`

#### `config.config_packages`
Top-level grouping of related configuration items.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Tenant identifier for isolation |
| name | VARCHAR(100) | Unique package name (e.g., 'core', 'collections') |
| description | TEXT | Package description |
| status | VARCHAR(20) | active, inactive, archived |
| created_at | TIMESTAMPTZ | Creation timestamp |
| updated_at | TIMESTAMPTZ | Last update timestamp |

#### `config.config_versions`
Version tracking with maker-checker workflow states.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Tenant identifier |
| package_id | UUID | Reference to config_packages |
| version_no | INTEGER | Sequential version number |
| status | VARCHAR(20) | DRAFT, SUBMITTED, APPROVED, PUBLISHED, REJECTED, SUPERSEDED |
| effective_from | TIMESTAMPTZ | When version becomes active |
| effective_to | TIMESTAMPTZ | When version is superseded |
| submitted_at | TIMESTAMPTZ | Submission timestamp |
| submitted_by | UUID | User who submitted |
| approved_at | TIMESTAMPTZ | Approval timestamp |
| approved_by | UUID | User who approved |
| published_at | TIMESTAMPTZ | Publication timestamp |
| published_by | UUID | User who published |
| rejection_reason | TEXT | Reason if rejected |

#### `config.config_items`
Individual configuration key-value pairs.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Tenant identifier |
| version_id | UUID | Reference to config_versions |
| key | VARCHAR(255) | Namespaced config key |
| value_json | JSONB | Configuration value |
| value_type | VARCHAR(50) | string, number, boolean, object, array |
| scope_json | JSONB | Optional scope filter |
| description | TEXT | Item description |
| validation_rules | JSONB | Optional validation rules |
| is_sensitive | BOOLEAN | Whether value is sensitive |

### Schema: `workflow`

#### `workflow.approvals`
Approval requests for maker-checker workflow.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Tenant identifier |
| object_type | VARCHAR(100) | Type of object (e.g., 'config_version') |
| object_id | UUID | ID of object being approved |
| status | VARCHAR(20) | PENDING, IN_PROGRESS, APPROVED, REJECTED, CANCELLED, EXPIRED |
| priority | VARCHAR(20) | low, normal, high, urgent |
| requested_by | UUID | User who requested |
| approved_by | UUID | User who approved/rejected |
| rejection_reason | TEXT | Reason if rejected |
| expires_at | TIMESTAMPTZ | Expiration time |

#### `workflow.approval_steps`
Individual steps in multi-level approvals.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Tenant identifier |
| approval_id | UUID | Reference to approvals |
| step_no | INTEGER | Step sequence number |
| role_required | VARCHAR(100) | Role required to approve |
| status | VARCHAR(20) | PENDING, APPROVED, REJECTED, SKIPPED |
| acted_by | UUID | User who acted on step |
| acted_at | TIMESTAMPTZ | Action timestamp |
| comments | TEXT | Approver comments |

### Schema: `audit`

#### `audit.config_audit_log`
Immutable audit trail for all changes.

| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| tenant_id | UUID | Tenant identifier |
| event_type | VARCHAR(50) | CREATE, UPDATE, DELETE, STATE_CHANGE |
| event_subtype | VARCHAR(50) | e.g., DRAFT_TO_SUBMITTED |
| object_type | VARCHAR(100) | Type of object changed |
| object_id | UUID | ID of changed object |
| old_value | JSONB | Previous state |
| new_value | JSONB | New state |
| changed_fields | TEXT[] | List of changed fields |
| user_id | UUID | Acting user |
| correlation_id | UUID | Links related entries |
| created_at | TIMESTAMPTZ | Event timestamp |

## API Endpoints

### Configuration Packages

```
POST   /config/packages                    Create a package
GET    /config/packages                    List packages
GET    /config/packages/{id}               Get package details
PATCH  /config/packages/{id}               Update package
```

### Configuration Versions

```
POST   /config/packages/{id}/versions      Create draft version
GET    /config/packages/{id}/versions      List versions
GET    /config/versions/{id}               Get version with items
POST   /config/versions/{id}/submit        Submit for approval (Maker)
POST   /config/versions/{id}/publish       Publish approved version
```

### Configuration Items

```
POST   /config/versions/{id}/items         Add/update item
GET    /config/versions/{id}/items         List items
DELETE /config/versions/{id}/items/{itemId} Delete item
```

### Configuration Resolution

```
GET    /config/resolve                     Resolve effective values
GET    /config/effective                   Get all effective config
```

### Workflow Approvals

```
POST   /workflow/approvals                 Create approval
GET    /workflow/approvals                 List approvals
GET    /workflow/approvals/pending         Get pending for role
GET    /workflow/approvals/{id}            Get approval details
POST   /workflow/approvals/{id}/approve    Approve step (Checker)
POST   /workflow/approvals/{id}/reject     Reject approval
POST   /workflow/approvals/{id}/cancel     Cancel approval
```

### Audit Log

```
GET    /config/audit                       Get audit log
```

## Key Namespacing

Configuration keys must be namespaced using dot notation:

```
namespace.category.item_name
```

### Standard Namespaces

| Namespace | Description |
|-----------|-------------|
| system | System-level configuration |
| policy | Business policy settings |
| scoring | Scoring and risk configuration |
| buckets | Delinquency bucket definitions |
| notification | Notification settings |
| workflow | Workflow configuration |
| audit | Audit settings |
| dialer | Auto-dialer settings |
| agent | Agent workload settings |
| templates | Template configurations |
| product | Product-specific settings |
| integration | External integration settings |
| feature | Feature flags and toggles |
| ui | User interface settings |
| report | Reporting configuration |

### Examples

```javascript
// Valid keys
"policy.retail.max_contact_attempts"
"policy.corporate.escalation_threshold_days"
"scoring.collection.weights"
"buckets.definitions"
"notification.quiet_hours"
"product.personal_loan.grace_period_days"

// Invalid keys (will be rejected)
"maxContactAttempts"        // Not namespaced
"Policy.Retail.Max"         // Uppercase not allowed
"policy retail max"         // Spaces not allowed
```

## Scope Filtering

Config items can be scoped to specific contexts:

```json
{
  "portfolio": "retail",
  "product": "personal_loan",
  "bucket": "B1",
  "branch": "BRANCH001",
  "region": "CENTRAL",
  "channel": "call"
}
```

### Resolution Priority

When resolving config, more specific scopes take precedence:

1. Exact scope match (all filters match)
2. Partial scope match (some filters match)
3. No scope (global default)

## Usage Examples

### JavaScript Service Usage

```javascript
import { ConfigService } from '@/services/configService';
import { WorkflowService } from '@/services/workflowService';

// Create a package
const pkg = await ConfigService.createConfigPackage({
  tenantId: 'tenant-uuid',
  name: 'my_settings',
  description: 'Custom settings package'
});

// Create a draft version
const version = await ConfigService.createConfigVersion({
  tenantId: 'tenant-uuid',
  packageId: pkg.data.id
});

// Add config items
await ConfigService.upsertConfigItem({
  tenantId: 'tenant-uuid',
  versionId: version.data.id,
  key: 'policy.custom.setting1',
  value: 100,
  description: 'Custom setting #1'
});

// Submit for approval (Maker action)
const submission = await ConfigService.submitConfigVersion({
  versionId: version.data.id,
  submittedBy: 'user-uuid',
  approvalRoles: ['config_checker']
});

// Approve (Checker action)
await WorkflowService.approveStep({
  approvalId: submission.data.approval_id,
  userId: 'checker-uuid',
  userRole: 'config_checker',
  comments: 'Approved after review'
});

// Publish
await ConfigService.publishConfigVersion({
  versionId: version.data.id,
  publishedBy: 'publisher-uuid'
});

// Resolve config
const config = await ConfigService.resolveConfig({
  tenantId: 'tenant-uuid',
  keys: ['policy.custom.setting1'],
  scope: { portfolio: 'retail' }
});

console.log(config.data.values['policy.custom.setting1']); // 100
```

### SQL Usage

```sql
-- Resolve config using the database function
SELECT * FROM config.resolve_config(
  '00000000-0000-0000-0000-000000000001',  -- tenant_id
  ARRAY['policy.retail.max_contact_attempts', 'policy.retail.escalation_threshold_days'],
  CURRENT_TIMESTAMP,
  '{"portfolio": "retail"}'::jsonb
);

-- Get effective config view
SELECT * FROM config.effective_config_view
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND key LIKE 'policy.%';

-- Get pending approvals for a role
SELECT * FROM workflow.pending_approvals_view
WHERE tenant_id = '00000000-0000-0000-0000-000000000001'
  AND role_required = 'config_checker';
```

## Installation

### 1. Run Migrations

```bash
# Set database URL
export DATABASE_URL="postgresql://user:pass@host:port/db"

# Run migrations
./scripts/run-epic2-migrations.sh
```

### 2. Expose Schemas (Supabase)

If using Supabase, add the new schemas to the exposed schemas list:

1. Go to Project Settings → API
2. Find "Exposed schemas"
3. Add: `config`, `workflow`, `audit`
4. Save

### 3. Import Services

```javascript
import { ConfigService } from '@/services/configService';
import { WorkflowService } from '@/services/workflowService';
import ConfigValidation from '@/utils/configValidation';
```

## Security

### Row Level Security (RLS)

All tables have RLS enabled with tenant isolation:

- Users can only access data for their tenant
- Tenant ID is extracted from JWT claims or session settings
- Service role bypasses RLS for admin operations

### Audit Trail

Every state transition is automatically logged:

- INSERT, UPDATE, DELETE operations
- State changes (DRAFT → SUBMITTED → APPROVED → PUBLISHED)
- User and timestamp tracking
- Correlation IDs link related entries

## Default Seed Data

The migration creates default configuration:

### Core Package (`core`)
- System settings (name, version, timezone, language, currency)
- Collection policies (contact limits, escalation thresholds)
- PTP settings (max extensions, duration)
- Legal action thresholds
- Scoring configuration
- Bucket definitions
- Notification settings
- Workflow settings
- Audit settings

### Collections Package (`collections`)
- Dialer settings
- Agent workload settings
- SMS template IDs
- Product-specific grace periods

## Files Created

```
/workspace/
├── scripts/
│   └── migrations/
│       ├── 001_epic2_config_workflow_schema.sql  # Schema migration
│       └── 002_epic2_seed_data.sql               # Seed data
│   └── run-epic2-migrations.sh                   # Migration script
├── src/
│   ├── services/
│   │   ├── configService.js                      # Config API service
│   │   └── workflowService.js                    # Workflow API service
│   └── utils/
│       └── configValidation.js                   # Validation utilities
└── docs/
    ├── api/
    │   └── openapi-epic2-config-workflow.yaml    # OpenAPI spec
    └── EPIC2_CONFIG_WORKFLOW.md                  # This file
```

## Future Enhancements (EPIC 4)

- Full audit system with retention policies
- Audit log search and export
- Compliance reporting
- Change comparison tools
