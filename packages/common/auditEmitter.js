/**
 * EPIC 4: Audit, Evidence, Lineage
 * Audit Emitter - Common utility for emitting audit events from any service
 * 
 * This module provides a centralized way to emit audit events across the application.
 * All material writes should use this emitter to ensure consistent audit logging.
 */

import { createClient } from '@supabase/supabase-js';

// Event types enum for consistency
export const AuditEventTypes = {
  // CRUD operations
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SOFT_DELETE: 'SOFT_DELETE',
  RESTORE: 'RESTORE',
  
  // Authentication events
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  
  // Authorization events
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',
  
  // Business events
  APPROVAL: 'APPROVAL',
  REJECTION: 'REJECTION',
  SUBMISSION: 'SUBMISSION',
  ESCALATION: 'ESCALATION',
  TRANSFER: 'TRANSFER',
  
  // Policy/Decision events
  POLICY_EVALUATION: 'POLICY_EVALUATION',
  ALLOCATION_DECISION: 'ALLOCATION_DECISION',
  AI_DECISION: 'AI_DECISION',
  
  // Evidence events
  EVIDENCE_UPLOADED: 'EVIDENCE_UPLOADED',
  EVIDENCE_VIEWED: 'EVIDENCE_VIEWED',
  EVIDENCE_DOWNLOADED: 'EVIDENCE_DOWNLOADED',
  EVIDENCE_VERIFIED: 'EVIDENCE_VERIFIED',
  
  // System events
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT'
};

// Security event types
export const SecurityEventTypes = {
  LOGIN_SUCCESS: 'LOGIN_SUCCESS',
  LOGIN_FAILURE: 'LOGIN_FAILURE',
  LOGOUT: 'LOGOUT',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  SUSPICIOUS_ACTIVITY: 'SUSPICIOUS_ACTIVITY',
  BRUTE_FORCE_ATTEMPT: 'BRUTE_FORCE_ATTEMPT',
  UNAUTHORIZED_ACCESS: 'UNAUTHORIZED_ACCESS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  API_KEY_INVALID: 'API_KEY_INVALID',
  TOKEN_REFRESH: 'TOKEN_REFRESH',
  ACCOUNT_LOCKED: 'ACCOUNT_LOCKED',
  ACCOUNT_UNLOCKED: 'ACCOUNT_UNLOCKED',
  DATA_BREACH_ATTEMPT: 'DATA_BREACH_ATTEMPT'
};

// Severity levels
export const Severity = {
  DEBUG: 'DEBUG',
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL'
};

// Entity types for consistency
export const EntityTypes = {
  USER: 'USER',
  CUSTOMER: 'CUSTOMER',
  ACCOUNT: 'ACCOUNT',
  TRANSACTION: 'TRANSACTION',
  LOAN: 'LOAN',
  LOAN_APPLICATION: 'LOAN_APPLICATION',
  COLLECTION_CASE: 'COLLECTION_CASE',
  EVIDENCE: 'EVIDENCE',
  POLICY: 'POLICY',
  ROLE: 'ROLE',
  PERMISSION: 'PERMISSION',
  BRANCH: 'BRANCH',
  PRODUCT: 'PRODUCT',
  REPORT: 'REPORT',
  DASHBOARD: 'DASHBOARD',
  CONFIGURATION: 'CONFIGURATION'
};

// Trace types for lineage
export const TraceTypes = {
  POLICY: 'POLICY',
  ALLOCATION: 'ALLOCATION',
  AI: 'AI',
  WORKFLOW: 'WORKFLOW',
  APPROVAL: 'APPROVAL',
  CALCULATION: 'CALCULATION'
};

/**
 * AuditEmitter class for emitting audit events
 */
class AuditEmitter {
  constructor(supabaseClient = null) {
    this.supabase = supabaseClient;
    this.defaultTenantId = null;
    this.defaultSource = 'application';
    this.batchQueue = [];
    this.batchTimeout = null;
    this.batchSize = 10;
    this.batchDelayMs = 1000;
  }

  /**
   * Initialize the emitter with Supabase client
   * @param {Object} config - Configuration object
   */
  init(config = {}) {
    if (config.supabaseUrl && config.supabaseKey) {
      this.supabase = createClient(config.supabaseUrl, config.supabaseKey, {
        db: { schema: 'audit' }
      });
    } else if (config.supabaseClient) {
      this.supabase = config.supabaseClient;
    }
    
    this.defaultTenantId = config.tenantId || null;
    this.defaultSource = config.source || 'application';
    this.batchSize = config.batchSize || 10;
    this.batchDelayMs = config.batchDelayMs || 1000;
  }

  /**
   * Set the Supabase client
   * @param {Object} client - Supabase client instance
   */
  setClient(client) {
    this.supabase = client;
  }

  /**
   * Set the default tenant ID
   * @param {string} tenantId - Tenant UUID
   */
  setTenantId(tenantId) {
    this.defaultTenantId = tenantId;
  }

  /**
   * Set the default source
   * @param {string} source - Source identifier
   */
  setSource(source) {
    this.defaultSource = source;
  }

  /**
   * Generate a correlation ID
   * @returns {string} UUID
   */
  generateCorrelationId() {
    return crypto.randomUUID ? crypto.randomUUID() : 
      'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
        const r = Math.random() * 16 | 0;
        const v = c === 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
  }

  /**
   * Emit an audit event
   * @param {Object} event - Audit event data
   * @returns {Promise<Object>} - Result with event ID
   */
  async emit(event) {
    if (!this.supabase) {
      console.warn('[AuditEmitter] Supabase client not initialized. Event not recorded:', event);
      return { success: false, error: 'Supabase client not initialized' };
    }

    const auditEvent = {
      tenant_id: event.tenantId || this.defaultTenantId,
      event_type: event.eventType || event.type || AuditEventTypes.UPDATE,
      actor_user_id: event.actorUserId || event.userId || null,
      actor_role: event.actorRole || event.role || null,
      entity_type: event.entityType,
      entity_id: String(event.entityId),
      correlation_id: event.correlationId || this.generateCorrelationId(),
      source: event.source || this.defaultSource,
      before_json: event.before || event.beforeJson || null,
      after_json: event.after || event.afterJson || null,
      metadata: event.metadata || {}
    };

    // Validate required fields
    if (!auditEvent.tenant_id) {
      console.error('[AuditEmitter] tenant_id is required');
      return { success: false, error: 'tenant_id is required' };
    }
    if (!auditEvent.entity_type) {
      console.error('[AuditEmitter] entity_type is required');
      return { success: false, error: 'entity_type is required' };
    }
    if (!auditEvent.entity_id) {
      console.error('[AuditEmitter] entity_id is required');
      return { success: false, error: 'entity_id is required' };
    }

    try {
      const { data, error } = await this.supabase
        .schema('audit')
        .from('audit_events')
        .insert([auditEvent])
        .select('id')
        .single();

      if (error) {
        console.error('[AuditEmitter] Error emitting audit event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, eventId: data.id, correlationId: auditEvent.correlation_id };
    } catch (err) {
      console.error('[AuditEmitter] Exception emitting audit event:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Emit a batch of audit events
   * @param {Array<Object>} events - Array of audit events
   * @returns {Promise<Object>} - Result with event IDs
   */
  async emitBatch(events) {
    if (!this.supabase) {
      console.warn('[AuditEmitter] Supabase client not initialized. Events not recorded.');
      return { success: false, error: 'Supabase client not initialized' };
    }

    const correlationId = this.generateCorrelationId();
    
    const auditEvents = events.map(event => ({
      tenant_id: event.tenantId || this.defaultTenantId,
      event_type: event.eventType || event.type || AuditEventTypes.UPDATE,
      actor_user_id: event.actorUserId || event.userId || null,
      actor_role: event.actorRole || event.role || null,
      entity_type: event.entityType,
      entity_id: String(event.entityId),
      correlation_id: event.correlationId || correlationId,
      source: event.source || this.defaultSource,
      before_json: event.before || event.beforeJson || null,
      after_json: event.after || event.afterJson || null,
      metadata: event.metadata || {}
    }));

    try {
      const { data, error } = await this.supabase
        .schema('audit')
        .from('audit_events')
        .insert(auditEvents)
        .select('id');

      if (error) {
        console.error('[AuditEmitter] Error emitting batch audit events:', error);
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        eventIds: data.map(e => e.id), 
        correlationId,
        count: data.length 
      };
    } catch (err) {
      console.error('[AuditEmitter] Exception emitting batch audit events:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Queue an event for batch processing
   * @param {Object} event - Audit event data
   */
  queue(event) {
    this.batchQueue.push(event);
    
    if (this.batchQueue.length >= this.batchSize) {
      this.flushQueue();
    } else if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.flushQueue(), this.batchDelayMs);
    }
  }

  /**
   * Flush the batch queue
   * @returns {Promise<Object>} - Result of batch emit
   */
  async flushQueue() {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
      this.batchTimeout = null;
    }

    if (this.batchQueue.length === 0) {
      return { success: true, count: 0 };
    }

    const events = [...this.batchQueue];
    this.batchQueue = [];
    
    return this.emitBatch(events);
  }

  /**
   * Log a security event
   * @param {Object} event - Security event data
   * @returns {Promise<Object>} - Result with event ID
   */
  async logSecurityEvent(event) {
    if (!this.supabase) {
      console.warn('[AuditEmitter] Supabase client not initialized. Security event not recorded.');
      return { success: false, error: 'Supabase client not initialized' };
    }

    const securityEvent = {
      tenant_id: event.tenantId || this.defaultTenantId,
      type: event.type || SecurityEventTypes.SUSPICIOUS_ACTIVITY,
      severity: event.severity || Severity.INFO,
      payload_json: event.payload || {},
      actor_user_id: event.actorUserId || event.userId || null,
      ip_address: event.ipAddress || null,
      user_agent: event.userAgent || null
    };

    try {
      const { data, error } = await this.supabase
        .schema('audit')
        .from('security_events')
        .insert([securityEvent])
        .select('id')
        .single();

      if (error) {
        console.error('[AuditEmitter] Error logging security event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, eventId: data.id };
    } catch (err) {
      console.error('[AuditEmitter] Exception logging security event:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Convenience method for CREATE events
   */
  async emitCreate(entityType, entityId, after, options = {}) {
    return this.emit({
      eventType: AuditEventTypes.CREATE,
      entityType,
      entityId,
      after,
      ...options
    });
  }

  /**
   * Convenience method for UPDATE events
   */
  async emitUpdate(entityType, entityId, before, after, options = {}) {
    return this.emit({
      eventType: AuditEventTypes.UPDATE,
      entityType,
      entityId,
      before,
      after,
      ...options
    });
  }

  /**
   * Convenience method for DELETE events
   */
  async emitDelete(entityType, entityId, before, options = {}) {
    return this.emit({
      eventType: AuditEventTypes.DELETE,
      entityType,
      entityId,
      before,
      ...options
    });
  }

  /**
   * Convenience method for LOGIN events
   */
  async emitLogin(userId, success = true, options = {}) {
    const eventType = success ? AuditEventTypes.LOGIN : AuditEventTypes.LOGIN_FAILED;
    return this.emit({
      eventType,
      entityType: EntityTypes.USER,
      entityId: userId,
      actorUserId: userId,
      ...options
    });
  }

  /**
   * Query audit events
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Query results
   */
  async queryEvents(query = {}) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized', data: [] };
    }

    let queryBuilder = this.supabase
      .schema('audit')
      .from('audit_events')
      .select('*');

    // Apply filters
    if (query.entityType) {
      queryBuilder = queryBuilder.eq('entity_type', query.entityType);
    }
    if (query.entityId) {
      queryBuilder = queryBuilder.eq('entity_id', query.entityId);
    }
    if (query.eventType) {
      queryBuilder = queryBuilder.eq('event_type', query.eventType);
    }
    if (query.actorUserId) {
      queryBuilder = queryBuilder.eq('actor_user_id', query.actorUserId);
    }
    if (query.correlationId) {
      queryBuilder = queryBuilder.eq('correlation_id', query.correlationId);
    }
    if (query.source) {
      queryBuilder = queryBuilder.eq('source', query.source);
    }
    if (query.tenantId) {
      queryBuilder = queryBuilder.eq('tenant_id', query.tenantId);
    }

    // Date range filters
    if (query.startDate) {
      queryBuilder = queryBuilder.gte('created_at', query.startDate);
    }
    if (query.endDate) {
      queryBuilder = queryBuilder.lte('created_at', query.endDate);
    }

    // Pagination
    const limit = query.limit || 50;
    const offset = query.offset || 0;
    queryBuilder = queryBuilder
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    try {
      const { data, error, count } = await queryBuilder;

      if (error) {
        console.error('[AuditEmitter] Error querying events:', error);
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data, count };
    } catch (err) {
      console.error('[AuditEmitter] Exception querying events:', err);
      return { success: false, error: err.message, data: [] };
    }
  }
}

// Create singleton instance
const auditEmitter = new AuditEmitter();

// Export singleton and class
export { AuditEmitter };
export default auditEmitter;
