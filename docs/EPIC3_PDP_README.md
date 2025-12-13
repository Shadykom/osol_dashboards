# EPIC 3: Regulatory Policy Engine (PDP)

## Overview

The Policy Decision Point (PDP) is a regulatory compliance engine that evaluates contact actions against configurable policies before they are executed. It ensures collection activities comply with regulatory requirements and internal policies.

## Key Features

- **Policy Decision Evaluation**: Returns `ALLOW`, `BLOCK`, or `APPROVAL_REQUIRED` decisions
- **Explainable Decisions**: Every decision includes reason codes and human-readable details
- **Data-Driven Policies**: Rules are stored as JSON, not hardcoded
- **Maker-Checker Workflow**: Policy changes require approval before going live
- **Tenant Isolation**: Full RLS support for multi-tenant deployments
- **Audit Trail**: All decisions are logged for compliance reporting

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Collection System                       │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐             │
│  │  Agent   │    │   IVR    │    │ WhatsApp │             │
│  │ Desktop  │    │ System   │    │   Bot    │  ...        │
│  └────┬─────┘    └────┬─────┘    └────┬─────┘             │
│       │               │               │                    │
│       └───────────────┼───────────────┘                    │
│                       ▼                                    │
│              ┌────────────────┐                           │
│              │  PDP Service   │ ◄─── Called BEFORE action │
│              │ POST /decision │                           │
│              └────────┬───────┘                           │
│                       │                                    │
│         ┌─────────────┼─────────────┐                     │
│         ▼             ▼             ▼                     │
│    ┌─────────┐  ┌──────────┐  ┌───────────────┐          │
│    │  ALLOW  │  │  BLOCK   │  │   APPROVAL    │          │
│    │ Execute │  │  Reject  │  │   REQUIRED    │          │
│    └─────────┘  └──────────┘  └───────────────┘          │
│                                                           │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### Tables

| Table | Description |
|-------|-------------|
| `policy.policy_profiles` | Policy profile definitions per tenant/customer type |
| `policy.policy_versions` | Versioned policy rules with maker-checker workflow |
| `policy.pdp_decision_log` | Audit trail for all PDP decisions |
| `policy.workflow_approvals` | Tracks approval workflow for policy changes |
| `policy.contact_attempt_cache` | Cached contact attempts for window calculations |

### Schema Location
- Migration: `/workspace/scripts/migrations/001_create_policy_schema.sql`
- Seed Data: `/workspace/scripts/migrations/002_seed_policy_data.sql`

## Rule Types

### 1. Max Attempts (`max_attempts`)
Limits contact attempts per time window.

```json
{
  "type": "max_attempts",
  "max_attempts": 10,
  "window": "7d",
  "action_types": ["CALL", "SMS", "EMAIL"],
  "on_violation": "BLOCK"
}
```

### 2. Time Window (`time_window`)
Restricts contact to specific hours/days.

```json
{
  "type": "time_window",
  "allowed_windows": [
    {
      "days": [0, 1, 2, 3, 4],
      "start_time": "09:00",
      "end_time": "18:00"
    }
  ],
  "timezone": "Asia/Riyadh",
  "on_violation": "BLOCK"
}
```

### 3. Cooling Period (`cooling_period`)
Enforces waiting period between contacts.

```json
{
  "type": "cooling_period",
  "cooling_period": "24h",
  "on_violation": "BLOCK"
}
```

### 4. Consent Check (`consent_check`)
Verifies consent for specific channels.

```json
{
  "type": "consent_check",
  "channels_requiring_consent": ["WHATSAPP", "EMAIL"],
  "on_violation": "BLOCK"
}
```

### 5. Channel Restriction (`channel_restriction`)
Blocks or whitelists specific channels.

```json
{
  "type": "channel_restriction",
  "allowed_channels": ["CALL", "EMAIL"],
  "blocked_channels": ["SMS", "WHATSAPP"],
  "on_violation": "BLOCK"
}
```

### 6. Bucket Rule (`bucket_rule`)
Applies rules based on delinquency bucket.

```json
{
  "type": "bucket_rule",
  "bucket_restrictions": {
    "CURRENT": { "blocked": true },
    "1-30": { "allowed_actions": ["SMS", "EMAIL"] },
    "31-60": { "allowed_actions": ["CALL", "SMS", "EMAIL"] }
  },
  "on_violation": "BLOCK"
}
```

## API Usage

### Evaluate Decision

```javascript
// Before making any contact attempt
const response = await fetch('/api/v1/pdp/decision', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: "00000000-0000-0000-0000-000000000001",
    customer_type: "RETAIL",
    action_type: "CALL",
    channel: "PHONE",
    customer_id: "CUST-001",
    contract_id: "CONT-001",
    bucket: "31-60",
    consent_status: "GIVEN",
    contact_history: {
      window: "7d",
      attempts: 5,
      last_attempt_at: "2024-01-14T14:00:00Z"
    }
  })
});

const result = await response.json();

if (result.decision === 'ALLOW') {
  // Proceed with contact
} else if (result.decision === 'BLOCK') {
  // Show blocked reason to agent
  console.log(result.reason_details);
} else if (result.decision === 'APPROVAL_REQUIRED') {
  // Request manager approval
  console.log(result.required_evidence);
}
```

### Record Contact Attempt

```javascript
// After contact attempt is made
await fetch('/api/v1/pdp/record-attempt', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    tenant_id: "00000000-0000-0000-0000-000000000001",
    customer_id: "CUST-001",
    action_type: "CALL",
    channel: "PHONE",
    outcome: "ANSWERED"
  })
});
```

## Maker-Checker Workflow

### Policy Lifecycle

```
┌──────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐
│  DRAFT   │───►│ SUBMITTED │───►│ APPROVED │───►│ PUBLISHED │
└──────────┘    └───────────┘    └──────────┘    └───────────┘
     ▲               │                                  │
     │               ▼                                  ▼
     │          ┌──────────┐                     ┌──────────┐
     └──────────│ REJECTED │                     │ ARCHIVED │
                └──────────┘                     └──────────┘
```

### Workflow Actions

1. **Create Version (Maker)**: Create a new policy version in DRAFT status
2. **Submit for Approval (Maker)**: Submit DRAFT for review
3. **Approve (Checker)**: Approve the submitted version
4. **Reject (Checker)**: Reject with comments, returns to DRAFT
5. **Publish**: Make the approved version active

## Service Files

| File | Description |
|------|-------------|
| `/src/services/pdpService.js` | Core PDP rule evaluation engine |
| `/src/services/policyWorkflowService.js` | Maker-checker workflow service |
| `/src/api/pdp.js` | API route handlers |
| `/docs/openapi-pdp.yaml` | OpenAPI specification |

## Testing

### Run Tests

```bash
npm test -- src/services/__tests__/pdpService.test.js
```

### Test Coverage

- Request validation
- Max attempts rule (within limit, exceeded, approaching)
- Time window rule (allowed hours, blocked hours, weekends)
- Cooling period rule (elapsed, active, no previous)
- Consent rule (given, not given, withdrawn)
- Channel restriction rule (blocked, allowed)
- Bucket rule (blocked, allowed actions)

## Configuration

### Environment Variables

```env
# Supabase connection
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### RLS Configuration

All tables use RLS with tenant isolation based on `app.current_tenant_id`:

```sql
-- Example RLS policy
CREATE POLICY policy_profiles_tenant_isolation ON policy.policy_profiles
    FOR ALL
    USING (tenant_id = current_setting('app.current_tenant_id')::UUID);
```

## Default Policies

The seed data creates three default policies:

### Retail Policy
- Max 10 attempts per 7 days
- Contact hours: Sun-Thu 9AM-6PM, Sat 9AM-2PM
- 24-hour cooling period
- WhatsApp/Email require consent
- No contact for CURRENT bucket

### SME Policy
- Max 15 attempts per 7 days (APPROVAL_REQUIRED on exceed)
- Extended hours: Sun-Thu 8AM-8PM, Sat 9AM-5PM
- 12-hour cooling period

### Corporate Policy
- Max 5 attempts per 7 days
- Business hours only: Sun-Thu 9AM-5PM
- Formal channels only (CALL, EMAIL)
- 48-hour cooling period

## Audit Trail

All decisions are logged to `policy.pdp_decision_log` with:
- Full request context
- Decision result and reason
- Rules evaluated and their results
- Evaluation performance metrics
- Timestamp and metadata

Query audit log:
```sql
SELECT * FROM policy.pdp_decision_log
WHERE tenant_id = 'your-tenant-id'
  AND customer_id = 'CUST-001'
ORDER BY created_at DESC;
```

## Integration Points

### Before Contact Actions
Call PDP decision endpoint before:
- Dialer initiates call
- SMS/WhatsApp message sent
- Email sent
- IVR campaign launched
- Field visit scheduled

### After Contact Actions
Record attempt after:
- Call completed (with outcome)
- Message delivered
- Visit completed

## Security

- **RLS**: All queries filtered by tenant_id
- **Service Role**: Bypass RLS for internal operations
- **Audit**: All decisions logged with user context
- **Validation**: Request payload validated before processing

## Performance

- **Caching**: Contact attempts cached for fast window calculations
- **Indexes**: Optimized indexes for common query patterns
- **Evaluation Time**: Logged for performance monitoring

## Support

For issues or questions:
1. Check the OpenAPI spec: `/docs/openapi-pdp.yaml`
2. Review test cases: `/src/services/__tests__/pdpService.test.js`
3. Contact API support team
