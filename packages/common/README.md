# @osol/common - SIEM Forwarding Module

This package provides Security Information and Event Management (SIEM) capabilities for the OSOL banking platform. It implements a security event emission system that writes to the database and logs structured JSON for collection by external SIEM systems.

## Features

- **Security Event Emission**: Centralized function for emitting security-relevant events
- **Database Logging**: Writes events to `kastle_banking.security_events` table
- **Structured JSON Logging**: Console output in structured format for log collection
- **Extensible Design**: Stubs for syslog and HTTP collector forwarding (future implementation)

## Installation

The module is already integrated into the OSOL codebase. No additional installation required.

## Database Setup

Run the SQL migration script to create the security_events table:

```bash
# In your Supabase SQL editor, run:
# scripts/create_security_events_table.sql
```

## Usage

### Basic Usage

```javascript
import { emitSecurityEvent, SecurityEventTypes } from '@packages/common/siem';

// Emit a security event
await emitSecurityEvent(
  SecurityEventTypes.LOGIN_SUCCESS,
  { email: 'user@example.com', success: true },
  { 
    component: 'LoginPage',
    userId: 'user-123',
    userEmail: 'user@example.com'
  }
);
```

### Security Event Types

#### Authentication Events
- `LOGIN_ATTEMPT` - User attempts to log in
- `LOGIN_SUCCESS` - Successful login
- `LOGIN_FAILURE` - Failed login attempt
- `LOGOUT` - User logs out
- `SESSION_EXPIRED` - Session timeout
- `PASSWORD_CHANGE` - Password changed
- `PASSWORD_RESET_REQUEST` - Password reset requested
- `MFA_CHALLENGE` - MFA challenge issued
- `MFA_SUCCESS` - MFA verification successful
- `MFA_FAILURE` - MFA verification failed

#### Authorization Events
- `ROLE_CHANGE` - User role modified
- `PERMISSION_CHANGE` - Permission modified
- `ACCESS_GRANTED` - Access to resource granted
- `ACCESS_DENIED` - Access to resource denied
- `POLICY_BLOCK` - Policy blocked the action
- `PRIVILEGE_ESCALATION` - Potential privilege escalation

#### Approval Workflow Events
- `APPROVAL_REQUESTED` - Approval request submitted
- `APPROVAL_GRANTED` - Approval granted
- `APPROVAL_DENIED` - Approval denied
- `APPROVAL_ESCALATED` - Approval escalated
- `APPROVAL_TIMEOUT` - Approval request timed out

#### Data Access Events
- `SENSITIVE_DATA_ACCESS` - Sensitive data accessed
- `BULK_DATA_EXPORT` - Bulk data exported
- `DATA_MODIFICATION` - Data modified
- `DATA_DELETION` - Data deleted

#### System Events
- `CONFIG_CHANGE` - Configuration changed
- `SECURITY_POLICY_UPDATE` - Security policy updated
- `ANOMALY_DETECTED` - Anomaly detected
- `RATE_LIMIT_EXCEEDED` - Rate limit exceeded

### Using Auth Context Helpers

The AuthContext provides convenience methods for common security events:

```javascript
import { useAuth } from '../contexts/AuthContext';

const { emitRoleChangeEvent, emitApprovalEvent } = useAuth();

// Emit role change event
await emitRoleChangeEvent(
  'user-123',              // target user ID
  'user@example.com',      // target user email
  ['user'],                // previous roles
  ['user', 'admin'],       // new roles
  'admin@example.com'      // changed by
);

// Emit approval event
await emitApprovalEvent(
  'granted',               // action: 'granted', 'denied', or 'requested'
  'loan_application',      // resource type
  'loan-456',              // resource ID
  'Loan #456',             // resource name
  { amount: 50000, term: 12 } // additional details
);
```

## Integrated Hook Locations

The SIEM hooks are automatically called in the following locations:

1. **Login Attempts** (`src/contexts/AuthContext.jsx`)
   - `LOGIN_ATTEMPT` on sign in start
   - `LOGIN_SUCCESS` on successful authentication
   - `LOGIN_FAILURE` on failed authentication

2. **Logout** (`src/contexts/AuthContext.jsx`)
   - `LOGOUT` on sign out

3. **Access Control** (`src/components/auth/ProtectedRoute.jsx`)
   - `ACCESS_GRANTED` when user accesses protected route
   - `POLICY_BLOCK` when access is denied (role or permission)

4. **Role Changes** (via `emitRoleChangeEvent`)
   - Call manually when changing user roles

5. **Approval Actions** (via `emitApprovalEvent`)
   - Call manually when processing approvals

## Event Structure

Each security event contains:

```json
{
  "event_id": "uuid",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "event_type": "auth.login_success",
  "severity": 6,
  "version": "1.0",
  "source": {
    "application": "osol-banking",
    "component": "AuthContext",
    "environment": "production"
  },
  "actor": {
    "user_id": "user-123",
    "email": "user@example.com",
    "ip_address": null,
    "user_agent": "Mozilla/5.0...",
    "session_id": "session-abc"
  },
  "target": {
    "resource_type": "route",
    "resource_id": "/dashboard",
    "resource_name": "/dashboard"
  },
  "payload": {
    "success": true,
    "outcome": "success"
  },
  "metadata": {
    "correlation_id": null,
    "parent_event_id": null,
    "tags": []
  }
}
```

## Severity Levels

Aligned with syslog severity (RFC 5424):

| Level | Name | Description |
|-------|------|-------------|
| 0 | Emergency | System is unusable |
| 1 | Alert | Action must be taken immediately |
| 2 | Critical | Critical conditions |
| 3 | Error | Error conditions |
| 4 | Warning | Warning conditions |
| 5 | Notice | Normal but significant |
| 6 | Info | Informational |
| 7 | Debug | Debug messages |

## Future Enhancements

The module includes stubs for:

1. **Syslog Forwarding** (RFC 5424)
   - Configure via `SIEM_SYSLOG_HOST`, `SIEM_SYSLOG_PORT`, `SIEM_SYSLOG_PROTOCOL`

2. **HTTP Collector Forwarding**
   - Splunk HEC
   - Datadog Logs API
   - Elasticsearch
   - Azure Log Analytics
   - Configure via `SIEM_HTTP_ENDPOINT`, `SIEM_HTTP_API_KEY`

## Configuration

Edit `SIEMConfig` in `packages/common/siem/index.js`:

```javascript
export const SIEMConfig = {
  enableDatabaseLogging: true,  // Write to database
  enableConsoleLogging: true,   // Log to console
  enableSyslog: false,          // Forward to syslog (future)
  enableHttpCollector: false,   // Forward to HTTP collector (future)
  // ...
};
```

## Database Views

The SQL migration creates helpful views:

- `recent_security_events` - Last 24 hours of events
- `security_alerts` - Events with severity <= WARNING

## Retention Policy

Use the cleanup function to manage data retention:

```sql
SELECT kastle_banking.cleanup_old_security_events(90); -- Delete events older than 90 days
```
