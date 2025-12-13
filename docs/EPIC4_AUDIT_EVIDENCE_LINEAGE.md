# EPIC 4: Audit, Evidence, Lineage

## Overview

This epic implements a comprehensive audit, evidence management, and decision lineage system for the OSOL platform. The system ensures compliance, traceability, and accountability for all material operations.

## Non-Negotiables

1. **Audit is Immutable**: Audit events are append-only. No UPDATE or DELETE operations are allowed on audit records.
2. **Every Material Write Emits Audit Event**: All significant data changes are automatically logged.
3. **Evidence has Integrity Hash + Chain of Custody**: Every evidence file has a SHA256 hash and a complete chain of custody.
4. **Decision Lineage Links PDP Decisions**: All policy decisions are traced and linked to affected entities.

## Architecture

### Schema Design

#### `audit` Schema

| Table | Purpose |
|-------|---------|
| `audit_events` | Immutable append-only audit log for all material writes |
| `security_events` | Security-related event log (login, access attempts, etc.) |
| `evidence_items` | Evidence file metadata with integrity verification |
| `evidence_chain` | Chain of custody tracking for evidence items |

#### `lineage` Schema

| Table | Purpose |
|-------|---------|
| `decision_traces` | Decision traces from PDP, allocation systems, AI |
| `trace_links` | Links between traces and affected entities |
| `trace_dependencies` | Dependencies between decision traces |

### Immutability Enforcement

Audit immutability is enforced at the database level using PostgreSQL triggers:

```sql
CREATE OR REPLACE FUNCTION audit.prevent_modification()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        RAISE EXCEPTION 'UPDATE operation not allowed on audit.audit_events table. Audit records are immutable.';
    ELSIF TG_OP = 'DELETE' THEN
        RAISE EXCEPTION 'DELETE operation not allowed on audit.audit_events table. Audit records are immutable.';
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;
```

## API Endpoints

### Audit Events

```javascript
// GET /audit/events?entity_type=&entity_id=
import { AuditService } from '@/services/auditService';

const events = await AuditService.getEvents({
  entityType: 'LOAN_APPLICATION',
  entityId: 'loan-123',
  limit: 50
});
```

### Evidence Upload

```javascript
// POST /evidence/upload
import { EvidenceService } from '@/services/evidenceService';

const result = await EvidenceService.upload({
  file: fileObject,
  tenantId: 'tenant-uuid',
  entityType: 'COLLECTION_CASE',
  entityId: 'case-456',
  description: 'Payment proof',
  uploadedBy: 'user-uuid'
});

// Result includes sha256Hash and evidenceId
console.log(result.sha256Hash); // 64-character hex hash
```

### Lineage Traces

```javascript
// POST /lineage/trace (internal use from PDP)
import { LineageService } from '@/services/lineageService';

const trace = await LineageService.createTrace({
  tenantId: 'tenant-uuid',
  traceType: 'POLICY',
  input: { subject, resource, action },
  output: { decision: 'APPROVED' },
  explanation: 'Access granted based on admin role',
  entityLinks: [
    { entityType: 'USER', entityId: 'user-123', linkType: 'TRIGGERED_BY' },
    { entityType: 'LOAN', entityId: 'loan-456', linkType: 'AFFECTS' }
  ]
});

// GET /lineage/trace/{id}
const fullTrace = await LineageService.getFullTrace(trace.traceId);
```

## Services

### AuditEmitter (`/packages/common/auditEmitter.js`)

Central utility for emitting audit events from any service:

```javascript
import auditEmitter from '@osol/common/auditEmitter';

// Initialize with Supabase client
auditEmitter.init({
  supabaseClient: supabase,
  tenantId: 'default-tenant',
  source: 'my-service'
});

// Emit events
await auditEmitter.emit({
  eventType: 'CREATE',
  entityType: 'CUSTOMER',
  entityId: 'cust-123',
  after: { name: 'John Doe' },
  actorUserId: 'user-uuid'
});

// Convenience methods
await auditEmitter.emitCreate('CUSTOMER', 'cust-123', { name: 'John' });
await auditEmitter.emitUpdate('CUSTOMER', 'cust-123', oldData, newData);
await auditEmitter.emitDelete('CUSTOMER', 'cust-123', oldData);
```

### LineageEmitter (`/packages/common/lineageEmitter.js`)

Utility for creating decision traces:

```javascript
import lineageEmitter from '@osol/common/lineageEmitter';

await lineageEmitter.createPolicyTrace({
  tenantId: 'tenant-uuid',
  input: { ... },
  output: { decision: 'APPROVED' },
  explanation: 'Policy conditions met'
});
```

### PDPService (`/src/services/pdpService.js`)

Policy Decision Point with automatic lineage integration:

```javascript
import { PDPService } from '@/services/pdpService';

const result = await PDPService.evaluatePolicy({
  tenantId: 'tenant-uuid',
  policyId: 'access-control',
  subject: { userId: 'user-123', role: 'manager' },
  resource: { type: 'LOAN_APPLICATION', id: 'loan-456' },
  action: 'approve'
});

// Result includes decision, explanation, factors, and traceId
console.log(result.decision); // 'APPROVED' | 'DENIED' | etc.
console.log(result.traceId); // UUID of lineage trace
```

## Database Migrations

### Running Migrations

1. **Via Supabase Dashboard**:
   - Open SQL Editor
   - Execute in order:
     - `scripts/migrations/001_create_audit_schema.sql`
     - `scripts/migrations/002_create_lineage_schema.sql`
     - `scripts/migrations/003_create_rpc_functions.sql`

2. **Via Script** (requires service role key):
   ```bash
   export SUPABASE_URL="https://your-project.supabase.co"
   export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
   ./scripts/run_epic4_migrations.sh
   ```

### Exposing Schemas

After running migrations, ensure schemas are exposed in Supabase:

1. Go to Settings → API
2. Under "Exposed schemas", add:
   - `audit`
   - `lineage`
3. Save changes

## Testing

### Run All Tests

```javascript
import { runAllTests } from '@/test/audit.test.js';

const results = await runAllTests();
console.log(`Passed: ${results.passed}, Failed: ${results.failed}`);
```

### Test Audit Immutability

```javascript
import { testAuditImmutability } from '@/test/audit.test.js';

// This test attempts to UPDATE and DELETE audit_events
// Both operations should fail due to triggers
await testAuditImmutability();
```

### Test Evidence Upload

```javascript
import { testEvidence } from '@/test/audit.test.js';

// This test verifies SHA256 calculation and chain of custody
await testEvidence();
```

## Event Types

### Audit Event Types

```javascript
const AuditEventTypes = {
  // CRUD
  CREATE, READ, UPDATE, DELETE, SOFT_DELETE, RESTORE,
  // Auth
  LOGIN, LOGOUT, LOGIN_FAILED, PASSWORD_CHANGE,
  // Authorization
  PERMISSION_GRANTED, PERMISSION_REVOKED, ROLE_ASSIGNED,
  // Business
  APPROVAL, REJECTION, SUBMISSION, ESCALATION,
  // Policy
  POLICY_EVALUATION, ALLOCATION_DECISION, AI_DECISION,
  // Evidence
  EVIDENCE_UPLOADED, EVIDENCE_VIEWED, EVIDENCE_VERIFIED
};
```

### Trace Types

```javascript
const TraceTypes = {
  POLICY,      // Policy decision point evaluations
  ALLOCATION,  // Resource allocation decisions
  AI,          // AI/ML model decisions
  WORKFLOW,    // Workflow state transitions
  APPROVAL,    // Approval chain decisions
  CALCULATION  // Complex calculations (risk scoring, etc.)
};
```

### Link Types

```javascript
const LinkTypes = {
  AFFECTS,       // The decision affects this entity
  TRIGGERED_BY,  // The decision was triggered by this entity
  REFERENCES,    // The decision references this entity
  DEPENDS_ON,    // The decision depends on this entity
  SUPERSEDES,    // This decision supersedes another
  RELATED_TO     // General relationship
};
```

## Row Level Security (RLS)

All tables have RLS enabled with tenant isolation:

- Users can only access audit events from their tenant
- Evidence is isolated by tenant
- Lineage traces are tenant-scoped

Policies allow:
- **SELECT**: Tenant isolation or `audit:read` / `lineage:read` permission
- **INSERT**: Authenticated users (append-only)
- **UPDATE**: Only on evidence_items for soft-delete (with `evidence:delete` permission)
- **DELETE**: Blocked by triggers on immutable tables

## Storage Configuration

### Evidence Storage Bucket

Create a storage bucket for evidence files:

1. Go to Supabase Dashboard → Storage
2. Create bucket: `evidence`
3. Set permissions (recommended: private with signed URLs)

For development without S3, the system falls back to stub storage which stores metadata without actual file storage.

## Files Structure

```
/workspace/
├── packages/
│   └── common/
│       ├── index.js              # Main exports
│       ├── auditEmitter.js       # Audit event emitter
│       ├── lineageEmitter.js     # Lineage trace emitter
│       ├── evidenceUtils.js      # Evidence utilities
│       └── package.json
├── scripts/
│   └── migrations/
│       ├── 001_create_audit_schema.sql
│       ├── 002_create_lineage_schema.sql
│       └── 003_create_rpc_functions.sql
├── src/
│   ├── services/
│   │   ├── auditService.js       # Audit API operations
│   │   ├── evidenceService.js    # Evidence upload/management
│   │   ├── lineageService.js     # Lineage trace operations
│   │   └── pdpService.js         # Policy Decision Point
│   └── test/
│       └── audit.test.js         # Test suite
└── docs/
    └── EPIC4_AUDIT_EVIDENCE_LINEAGE.md
```

## Best Practices

1. **Always use auditEmitter for material writes**: Don't insert directly into audit tables.
2. **Include correlation IDs**: Link related events for easier tracing.
3. **Store before/after state**: For UPDATE events, capture both states.
4. **Use meaningful entity types**: Use consistent entity type names across the system.
5. **Add explanation to traces**: Help future auditors understand decisions.
6. **Verify evidence integrity**: Periodically run integrity checks on evidence files.

## Troubleshooting

### "Schema not exposed" Error

```
Error: relation "audit.audit_events" does not exist
```

**Solution**: Expose the `audit` and `lineage` schemas in Supabase API settings.

### "UPDATE not allowed" Error

```
Error: UPDATE operation not allowed on audit.audit_events table
```

**This is expected!** The system correctly prevents modifications to audit records.

### Evidence Upload Fails

If storage upload fails, the system falls back to stub storage. Check:
1. Storage bucket exists
2. Bucket permissions are configured
3. Service role key has storage access

## Version History

- **1.0.0**: Initial implementation of EPIC 4
  - Audit schema with immutability triggers
  - Lineage schema for decision tracing
  - Evidence management with SHA256 hashing
  - PDP integration
  - RLS policies
  - Test suite
