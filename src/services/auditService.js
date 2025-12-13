/**
 * EPIC 4: Audit, Evidence, Lineage
 * Audit Service - API operations for audit events
 * 
 * Provides methods for querying and managing audit events.
 */

import { supabase } from '@/lib/supabase';

// Event types enum (duplicated here for backwards compatibility)
export const AuditEventTypes = {
  CREATE: 'CREATE',
  READ: 'READ',
  UPDATE: 'UPDATE',
  DELETE: 'DELETE',
  SOFT_DELETE: 'SOFT_DELETE',
  RESTORE: 'RESTORE',
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  PASSWORD_RESET: 'PASSWORD_RESET',
  MFA_ENABLED: 'MFA_ENABLED',
  MFA_DISABLED: 'MFA_DISABLED',
  PERMISSION_GRANTED: 'PERMISSION_GRANTED',
  PERMISSION_REVOKED: 'PERMISSION_REVOKED',
  ROLE_ASSIGNED: 'ROLE_ASSIGNED',
  ROLE_REMOVED: 'ROLE_REMOVED',
  APPROVAL: 'APPROVAL',
  REJECTION: 'REJECTION',
  SUBMISSION: 'SUBMISSION',
  ESCALATION: 'ESCALATION',
  TRANSFER: 'TRANSFER',
  POLICY_EVALUATION: 'POLICY_EVALUATION',
  ALLOCATION_DECISION: 'ALLOCATION_DECISION',
  AI_DECISION: 'AI_DECISION',
  EVIDENCE_UPLOADED: 'EVIDENCE_UPLOADED',
  EVIDENCE_VIEWED: 'EVIDENCE_VIEWED',
  EVIDENCE_DOWNLOADED: 'EVIDENCE_DOWNLOADED',
  EVIDENCE_VERIFIED: 'EVIDENCE_VERIFIED',
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE',
  SYSTEM_ERROR: 'SYSTEM_ERROR',
  DATA_EXPORT: 'DATA_EXPORT',
  DATA_IMPORT: 'DATA_IMPORT'
};

// Entity types enum
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

/**
 * AuditService class for audit operations
 */
export class AuditService {
  constructor() {
    // Use supabase client with audit schema
    this.client = supabase;
  }

  /**
   * Get audit events with filters
   * GET /audit/events?entity_type=&entity_id=
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Audit events
   */
  static async getEvents(params = {}) {
    try {
      const {
        entityType,
        entityId,
        eventType,
        actorUserId,
        correlationId,
        source,
        tenantId,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = params;

      // Build query against audit schema
      // Note: We need to use RPC or direct SQL since Supabase JS doesn't easily switch schemas
      // For now, we'll try accessing the view in the audit schema
      let query = supabase
        .from('audit.audit_events')
        .select('*', { count: 'exact' });

      // Apply filters
      if (entityType) {
        query = query.eq('entity_type', entityType);
      }
      if (entityId) {
        query = query.eq('entity_id', entityId);
      }
      if (eventType) {
        query = query.eq('event_type', eventType);
      }
      if (actorUserId) {
        query = query.eq('actor_user_id', actorUserId);
      }
      if (correlationId) {
        query = query.eq('correlation_id', correlationId);
      }
      if (source) {
        query = query.eq('source', source);
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      // Pagination and ordering
      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        // If audit schema table access fails, try using RPC
        console.warn('[AuditService] Direct table access failed, trying RPC:', error);
        return await this.getEventsViaRPC(params);
      }

      return {
        success: true,
        data: data || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (err) {
      console.error('[AuditService] Error fetching audit events:', err);
      return {
        success: false,
        error: err.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get audit events via RPC (fallback method)
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Audit events
   */
  static async getEventsViaRPC(params = {}) {
    try {
      const { data, error } = await supabase.rpc('get_audit_events', {
        p_entity_type: params.entityType || null,
        p_entity_id: params.entityId || null,
        p_event_type: params.eventType || null,
        p_actor_user_id: params.actorUserId || null,
        p_tenant_id: params.tenantId || null,
        p_limit: params.limit || 50,
        p_offset: params.offset || 0
      });

      if (error) {
        console.error('[AuditService] RPC error:', error);
        return {
          success: false,
          error: error.message,
          data: [],
          total: 0
        };
      }

      return {
        success: true,
        data: data || [],
        total: data?.length || 0,
        limit: params.limit || 50,
        offset: params.offset || 0
      };
    } catch (err) {
      console.error('[AuditService] Exception in RPC:', err);
      return {
        success: false,
        error: err.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Get audit events for a specific entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Audit events
   */
  static async getEntityAuditTrail(entityType, entityId, options = {}) {
    return this.getEvents({
      entityType,
      entityId,
      ...options
    });
  }

  /**
   * Get audit events by correlation ID (for tracking related events)
   * @param {string} correlationId - Correlation UUID
   * @returns {Promise<Object>} - Related audit events
   */
  static async getCorrelatedEvents(correlationId) {
    return this.getEvents({ correlationId });
  }

  /**
   * Get audit events by actor
   * @param {string} actorUserId - Actor user UUID
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} - Audit events
   */
  static async getActorEvents(actorUserId, options = {}) {
    return this.getEvents({
      actorUserId,
      ...options
    });
  }

  /**
   * Get security events
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} - Security events
   */
  static async getSecurityEvents(params = {}) {
    try {
      const {
        type,
        severity,
        actorUserId,
        tenantId,
        startDate,
        endDate,
        limit = 50,
        offset = 0
      } = params;

      let query = supabase
        .from('audit.security_events')
        .select('*', { count: 'exact' });

      if (type) {
        query = query.eq('type', type);
      }
      if (severity) {
        query = query.eq('severity', severity);
      }
      if (actorUserId) {
        query = query.eq('actor_user_id', actorUserId);
      }
      if (tenantId) {
        query = query.eq('tenant_id', tenantId);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }

      query = query
        .order('created_at', { ascending: false })
        .range(offset, offset + limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('[AuditService] Error fetching security events:', error);
        return {
          success: false,
          error: error.message,
          data: [],
          total: 0
        };
      }

      return {
        success: true,
        data: data || [],
        total: count || 0,
        limit,
        offset
      };
    } catch (err) {
      console.error('[AuditService] Exception fetching security events:', err);
      return {
        success: false,
        error: err.message,
        data: [],
        total: 0
      };
    }
  }

  /**
   * Emit an audit event
   * @param {Object} event - Audit event data
   * @returns {Promise<Object>} - Result with event ID
   */
  static async emitEvent(event) {
    try {
      const auditEvent = {
        tenant_id: event.tenantId,
        event_type: event.eventType || AuditEventTypes.UPDATE,
        actor_user_id: event.actorUserId || null,
        actor_role: event.actorRole || null,
        entity_type: event.entityType,
        entity_id: String(event.entityId),
        correlation_id: event.correlationId || crypto.randomUUID(),
        source: event.source || 'application',
        before_json: event.before || null,
        after_json: event.after || null,
        metadata: event.metadata || {}
      };

      // Validate required fields
      if (!auditEvent.tenant_id) {
        return { success: false, error: 'tenant_id is required' };
      }
      if (!auditEvent.entity_type) {
        return { success: false, error: 'entity_type is required' };
      }
      if (!auditEvent.entity_id) {
        return { success: false, error: 'entity_id is required' };
      }

      const { data, error } = await supabase
        .from('audit.audit_events')
        .insert([auditEvent])
        .select('id')
        .single();

      if (error) {
        // Try using RPC as fallback
        const rpcResult = await supabase.rpc('audit_emit_event', {
          p_tenant_id: auditEvent.tenant_id,
          p_event_type: auditEvent.event_type,
          p_actor_user_id: auditEvent.actor_user_id,
          p_actor_role: auditEvent.actor_role,
          p_entity_type: auditEvent.entity_type,
          p_entity_id: auditEvent.entity_id,
          p_source: auditEvent.source,
          p_before_json: auditEvent.before_json,
          p_after_json: auditEvent.after_json,
          p_correlation_id: auditEvent.correlation_id,
          p_metadata: auditEvent.metadata
        });

        if (rpcResult.error) {
          console.error('[AuditService] Error emitting audit event:', error);
          return { success: false, error: error.message };
        }

        return {
          success: true,
          eventId: rpcResult.data,
          correlationId: auditEvent.correlation_id
        };
      }

      return {
        success: true,
        eventId: data.id,
        correlationId: auditEvent.correlation_id
      };
    } catch (err) {
      console.error('[AuditService] Exception emitting audit event:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Log a security event
   * @param {Object} event - Security event data
   * @returns {Promise<Object>} - Result with event ID
   */
  static async logSecurityEvent(event) {
    try {
      const securityEvent = {
        tenant_id: event.tenantId,
        type: event.type,
        severity: event.severity || 'INFO',
        payload_json: event.payload || {},
        actor_user_id: event.actorUserId || null,
        ip_address: event.ipAddress || null,
        user_agent: event.userAgent || null
      };

      const { data, error } = await supabase
        .from('audit.security_events')
        .insert([securityEvent])
        .select('id')
        .single();

      if (error) {
        console.error('[AuditService] Error logging security event:', error);
        return { success: false, error: error.message };
      }

      return { success: true, eventId: data.id };
    } catch (err) {
      console.error('[AuditService] Exception logging security event:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get audit summary for an entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object>} - Audit summary
   */
  static async getEntityAuditSummary(entityType, entityId) {
    try {
      const { data, error } = await supabase
        .from('audit.audit_events_summary')
        .select('*')
        .eq('entity_type', entityType)
        .eq('entity_id', entityId)
        .single();

      if (error) {
        // Compute summary manually if view not available
        const events = await this.getEntityAuditTrail(entityType, entityId, { limit: 1000 });
        
        if (!events.success) {
          return { success: false, error: events.error };
        }

        const summary = {
          total_events: events.data.length,
          unique_actors: [...new Set(events.data.map(e => e.actor_user_id).filter(Boolean))].length,
          first_event: events.data[events.data.length - 1]?.created_at,
          last_event: events.data[0]?.created_at,
          event_types: [...new Set(events.data.map(e => e.event_type))]
        };

        return { success: true, data: summary };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[AuditService] Exception getting audit summary:', err);
      return { success: false, error: err.message };
    }
  }
}

export default AuditService;
