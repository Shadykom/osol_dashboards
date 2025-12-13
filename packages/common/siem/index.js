/**
 * SIEM (Security Information and Event Management) Forwarding Module
 * 
 * This module provides security event emission capabilities for audit logging
 * and SIEM integration. Events are written to the audit.security_events table
 * and logged as structured JSON for collection by external systems.
 * 
 * Future enhancements:
 * - Forward to syslog (RFC 5424)
 * - Forward to HTTP collectors (Splunk, Datadog, ELK, etc.)
 * - Forward to cloud SIEM services (Azure Sentinel, AWS Security Hub, etc.)
 */

// Supabase client will be injected via configure()
let supabaseClient = null;

/**
 * Configure the SIEM module with a Supabase client
 * @param {Object} client - Supabase client instance
 */
export function configureSIEM(client) {
  supabaseClient = client;
}

/**
 * Security Event Types - Categorizes security-relevant events
 */
export const SecurityEventTypes = {
  // Authentication events
  LOGIN_ATTEMPT: 'auth.login_attempt',
  LOGIN_SUCCESS: 'auth.login_success',
  LOGIN_FAILURE: 'auth.login_failure',
  LOGOUT: 'auth.logout',
  SESSION_EXPIRED: 'auth.session_expired',
  PASSWORD_CHANGE: 'auth.password_change',
  PASSWORD_RESET_REQUEST: 'auth.password_reset_request',
  MFA_CHALLENGE: 'auth.mfa_challenge',
  MFA_SUCCESS: 'auth.mfa_success',
  MFA_FAILURE: 'auth.mfa_failure',
  
  // Authorization events
  ROLE_CHANGE: 'authz.role_change',
  PERMISSION_CHANGE: 'authz.permission_change',
  ACCESS_GRANTED: 'authz.access_granted',
  ACCESS_DENIED: 'authz.access_denied',
  POLICY_BLOCK: 'authz.policy_block',
  PRIVILEGE_ESCALATION: 'authz.privilege_escalation',
  
  // Approval workflow events
  APPROVAL_REQUESTED: 'workflow.approval_requested',
  APPROVAL_GRANTED: 'workflow.approval_granted',
  APPROVAL_DENIED: 'workflow.approval_denied',
  APPROVAL_ESCALATED: 'workflow.approval_escalated',
  APPROVAL_TIMEOUT: 'workflow.approval_timeout',
  
  // Data access events
  SENSITIVE_DATA_ACCESS: 'data.sensitive_access',
  BULK_DATA_EXPORT: 'data.bulk_export',
  DATA_MODIFICATION: 'data.modification',
  DATA_DELETION: 'data.deletion',
  
  // System events
  CONFIG_CHANGE: 'system.config_change',
  SECURITY_POLICY_UPDATE: 'system.policy_update',
  ANOMALY_DETECTED: 'system.anomaly',
  RATE_LIMIT_EXCEEDED: 'system.rate_limit',
};

/**
 * Severity levels for security events (aligned with syslog severity)
 */
export const SeverityLevels = {
  EMERGENCY: 0,   // System is unusable
  ALERT: 1,       // Action must be taken immediately
  CRITICAL: 2,    // Critical conditions
  ERROR: 3,       // Error conditions
  WARNING: 4,     // Warning conditions
  NOTICE: 5,      // Normal but significant condition
  INFO: 6,        // Informational messages
  DEBUG: 7,       // Debug-level messages
};

/**
 * SIEM Configuration - can be extended for different backends
 */
const isDevelopment = () => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env.DEV === true || import.meta.env.MODE === 'development';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env.NODE_ENV === 'development';
  }
  return false;
};

export const SIEMConfig = {
  // Enable/disable different output methods
  enableDatabaseLogging: true,
  enableConsoleLogging: isDevelopment(), // Only log to console in development
  enableSyslog: false,        // Future: syslog forwarding
  enableHttpCollector: false, // Future: HTTP collector forwarding
  
  // Syslog configuration (future use)
  syslog: {
    host: typeof process !== 'undefined' ? (process.env?.SIEM_SYSLOG_HOST || 'localhost') : 'localhost',
    port: typeof process !== 'undefined' ? parseInt(process.env?.SIEM_SYSLOG_PORT || '514', 10) : 514,
    protocol: typeof process !== 'undefined' ? (process.env?.SIEM_SYSLOG_PROTOCOL || 'udp') : 'udp',
    facility: 16, // local0
    appName: 'osol-banking',
  },
  
  // HTTP collector configuration (future use)
  httpCollector: {
    endpoint: typeof process !== 'undefined' ? (process.env?.SIEM_HTTP_ENDPOINT || '') : '',
    apiKey: typeof process !== 'undefined' ? (process.env?.SIEM_HTTP_API_KEY || '') : '',
    batchSize: typeof process !== 'undefined' ? parseInt(process.env?.SIEM_BATCH_SIZE || '100', 10) : 100,
    flushInterval: typeof process !== 'undefined' ? parseInt(process.env?.SIEM_FLUSH_INTERVAL || '5000', 10) : 5000,
  },
};

/**
 * Generate a unique event ID
 * @returns {string} UUID or fallback unique ID
 */
function generateEventId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Formats a security event into structured JSON for logging/forwarding
 * @param {string} type - Event type from SecurityEventTypes
 * @param {Object} payload - Event-specific data
 * @param {Object} context - Additional context (user, session, etc.)
 * @returns {Object} Structured security event
 */
function formatSecurityEvent(type, payload, context = {}) {
  const timestamp = new Date().toISOString();
  const eventId = generateEventId();
  
  // Safely get environment mode
  const getEnvironment = () => {
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      return import.meta.env.MODE || 'development';
    }
    if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV || 'development';
    }
    return 'development';
  };
  
  return {
    // CEF-like structured format
    event_id: eventId,
    timestamp,
    event_type: type,
    severity: getSeverityForEventType(type),
    version: '1.0',
    
    // Source information
    source: {
      application: 'osol-banking',
      component: context.component || 'unknown',
      environment: getEnvironment(),
    },
    
    // Actor information (who triggered the event)
    actor: {
      user_id: context.userId || null,
      email: context.userEmail || null,
      ip_address: context.ipAddress || getClientIP(),
      user_agent: context.userAgent || getUserAgent(),
      session_id: context.sessionId || null,
    },
    
    // Target information (what was affected)
    target: {
      resource_type: context.resourceType || null,
      resource_id: context.resourceId || null,
      resource_name: context.resourceName || null,
    },
    
    // Event-specific payload
    payload: {
      ...payload,
      outcome: payload.success !== undefined ? (payload.success ? 'success' : 'failure') : null,
    },
    
    // Additional metadata
    metadata: {
      correlation_id: context.correlationId || null,
      parent_event_id: context.parentEventId || null,
      tags: context.tags || [],
    },
  };
}

/**
 * Determines severity level based on event type
 * @param {string} eventType - Event type from SecurityEventTypes
 * @returns {number} Severity level
 */
function getSeverityForEventType(eventType) {
  const severityMap = {
    // Critical events
    [SecurityEventTypes.PRIVILEGE_ESCALATION]: SeverityLevels.CRITICAL,
    [SecurityEventTypes.ANOMALY_DETECTED]: SeverityLevels.CRITICAL,
    
    // Warning events
    [SecurityEventTypes.LOGIN_FAILURE]: SeverityLevels.WARNING,
    [SecurityEventTypes.ACCESS_DENIED]: SeverityLevels.WARNING,
    [SecurityEventTypes.POLICY_BLOCK]: SeverityLevels.WARNING,
    [SecurityEventTypes.MFA_FAILURE]: SeverityLevels.WARNING,
    [SecurityEventTypes.RATE_LIMIT_EXCEEDED]: SeverityLevels.WARNING,
    [SecurityEventTypes.APPROVAL_DENIED]: SeverityLevels.WARNING,
    
    // Notice events
    [SecurityEventTypes.ROLE_CHANGE]: SeverityLevels.NOTICE,
    [SecurityEventTypes.PERMISSION_CHANGE]: SeverityLevels.NOTICE,
    [SecurityEventTypes.PASSWORD_CHANGE]: SeverityLevels.NOTICE,
    [SecurityEventTypes.CONFIG_CHANGE]: SeverityLevels.NOTICE,
    [SecurityEventTypes.SECURITY_POLICY_UPDATE]: SeverityLevels.NOTICE,
    [SecurityEventTypes.BULK_DATA_EXPORT]: SeverityLevels.NOTICE,
    [SecurityEventTypes.DATA_DELETION]: SeverityLevels.NOTICE,
    [SecurityEventTypes.APPROVAL_GRANTED]: SeverityLevels.NOTICE,
    
    // Info events (default)
    [SecurityEventTypes.LOGIN_SUCCESS]: SeverityLevels.INFO,
    [SecurityEventTypes.LOGIN_ATTEMPT]: SeverityLevels.INFO,
    [SecurityEventTypes.LOGOUT]: SeverityLevels.INFO,
    [SecurityEventTypes.ACCESS_GRANTED]: SeverityLevels.INFO,
    [SecurityEventTypes.APPROVAL_REQUESTED]: SeverityLevels.INFO,
  };
  
  return severityMap[eventType] ?? SeverityLevels.INFO;
}

/**
 * Gets client IP address (best effort in browser environment)
 * @returns {string|null} IP address or null
 */
function getClientIP() {
  // In browser environment, we can't get the real IP
  // This would be populated by the server in a real implementation
  return null;
}

/**
 * Gets user agent string
 * @returns {string} User agent
 */
function getUserAgent() {
  if (typeof navigator !== 'undefined') {
    return navigator.userAgent;
  }
  return 'unknown';
}

/**
 * Logs the security event to console in structured JSON format
 * @param {Object} event - Formatted security event
 */
function logToConsole(event) {
  const logLevel = event.severity <= SeverityLevels.ERROR ? 'error' 
    : event.severity <= SeverityLevels.WARNING ? 'warn' 
    : 'info';
  
  // Log structured JSON for SIEM collection from stdout/stderr
  console[logLevel](
    JSON.stringify({
      '@timestamp': event.timestamp,
      '@version': '1',
      level: logLevel.toUpperCase(),
      logger: 'security-events',
      message: `Security Event: ${event.event_type}`,
      ...event,
    })
  );
}

/**
 * Writes security event to database
 * @param {Object} event - Formatted security event
 * @returns {Promise<{data: Object|null, error: Error|null}>}
 */
async function writeToDatabase(event) {
  if (!supabaseClient) {
    return { data: null, error: new Error('Supabase client not configured') };
  }

  try {
    // Try to insert into the security_events table
    const { data, error } = await supabaseClient
      .from('security_events')
      .insert({
        event_id: event.event_id,
        event_type: event.event_type,
        severity: event.severity,
        timestamp: event.timestamp,
        actor_user_id: event.actor.user_id,
        actor_email: event.actor.email,
        actor_ip_address: event.actor.ip_address,
        actor_user_agent: event.actor.user_agent,
        actor_session_id: event.actor.session_id,
        target_resource_type: event.target.resource_type,
        target_resource_id: event.target.resource_id,
        target_resource_name: event.target.resource_name,
        payload: event.payload,
        metadata: event.metadata,
        source_application: event.source.application,
        source_component: event.source.component,
        source_environment: event.source.environment,
      });
    
    if (error) {
      // Don't throw - security logging should be resilient
      return { data: null, error };
    }
    
    return { data, error: null };
  } catch (err) {
    // Silently handle database write exceptions
    return { data: null, error: err };
  }
}

/**
 * Stub for future syslog forwarding
 * @param {Object} event - Formatted security event
 */
function forwardToSyslog(event) {
  // TODO: Implement syslog forwarding (RFC 5424)
  // This would use a UDP/TCP socket to send to syslog server
  // Format: <PRI>VERSION TIMESTAMP HOSTNAME APP-NAME PROCID MSGID STRUCTURED-DATA MSG
}

/**
 * Stub for future HTTP collector forwarding
 * @param {Object} event - Formatted security event
 */
function forwardToHttpCollector(event) {
  // TODO: Implement HTTP collector forwarding
  // This would batch events and send to endpoints like:
  // - Splunk HEC
  // - Datadog Logs API
  // - Elasticsearch
  // - Azure Log Analytics
}

/**
 * Emits a security event for audit logging and SIEM integration
 * 
 * @param {string} type - Event type from SecurityEventTypes
 * @param {Object} payload - Event-specific data
 * @param {Object} [context={}] - Additional context
 * @param {string} [context.userId] - ID of the user who triggered the event
 * @param {string} [context.userEmail] - Email of the user
 * @param {string} [context.sessionId] - Current session ID
 * @param {string} [context.component] - Source component/module name
 * @param {string} [context.resourceType] - Type of affected resource
 * @param {string} [context.resourceId] - ID of affected resource
 * @param {string} [context.resourceName] - Name of affected resource
 * @param {string} [context.correlationId] - ID to correlate related events
 * @param {string[]} [context.tags] - Additional tags for filtering
 * 
 * @returns {Promise<{success: boolean, eventId: string, error?: Error}>}
 * 
 * @example
 * // Login attempt
 * await emitSecurityEvent(
 *   SecurityEventTypes.LOGIN_ATTEMPT,
 *   { email: 'user@example.com', success: false, reason: 'Invalid password' },
 *   { component: 'AuthContext', ipAddress: '192.168.1.1' }
 * );
 * 
 * @example
 * // Role change
 * await emitSecurityEvent(
 *   SecurityEventTypes.ROLE_CHANGE,
 *   { 
 *     previousRoles: ['user'], 
 *     newRoles: ['user', 'admin'],
 *     changedBy: 'admin@example.com'
 *   },
 *   { 
 *     userId: 'user-123',
 *     userEmail: 'user@example.com',
 *     component: 'UserManagement'
 *   }
 * );
 */
export async function emitSecurityEvent(type, payload = {}, context = {}) {
  try {
    // Format the event
    const event = formatSecurityEvent(type, payload, context);
    
    // Array to track async operations
    const operations = [];
    
    // Log to console (structured JSON for log collection)
    if (SIEMConfig.enableConsoleLogging) {
      logToConsole(event);
    }
    
    // Write to database
    if (SIEMConfig.enableDatabaseLogging && supabaseClient) {
      operations.push(writeToDatabase(event));
    }
    
    // Future: Forward to syslog
    if (SIEMConfig.enableSyslog) {
      forwardToSyslog(event);
    }
    
    // Future: Forward to HTTP collector
    if (SIEMConfig.enableHttpCollector) {
      forwardToHttpCollector(event);
    }
    
    // Wait for async operations (non-blocking for UX)
    await Promise.allSettled(operations);
    
    return {
      success: true,
      eventId: event.event_id,
    };
  } catch (error) {
    // Security event emission should never break the application
    return {
      success: false,
      eventId: null,
      error,
    };
  }
}

export default emitSecurityEvent;
