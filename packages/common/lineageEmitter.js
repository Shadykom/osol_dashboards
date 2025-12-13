/**
 * EPIC 4: Audit, Evidence, Lineage
 * Lineage Emitter - Common utility for creating decision traces and lineage
 * 
 * This module provides a centralized way to create decision traces
 * from PDP, allocation systems, and AI components.
 */

import { TraceTypes } from './auditEmitter.js';

// Decision results enum
export const DecisionResults = {
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
  PENDING: 'PENDING',
  ESCALATED: 'ESCALATED',
  CONDITIONALLY_APPROVED: 'CONDITIONALLY_APPROVED',
  REVIEW_REQUIRED: 'REVIEW_REQUIRED',
  EXPIRED: 'EXPIRED',
  CANCELLED: 'CANCELLED'
};

// Link types for trace links
export const LinkTypes = {
  AFFECTS: 'AFFECTS',
  TRIGGERED_BY: 'TRIGGERED_BY',
  REFERENCES: 'REFERENCES',
  DEPENDS_ON: 'DEPENDS_ON',
  SUPERSEDES: 'SUPERSEDES',
  RELATED_TO: 'RELATED_TO'
};

// Trace status
export const TraceStatus = {
  PENDING: 'PENDING',
  PROCESSING: 'PROCESSING',
  COMPLETED: 'COMPLETED',
  FAILED: 'FAILED',
  SUPERSEDED: 'SUPERSEDED'
};

/**
 * LineageEmitter class for creating and managing decision traces
 */
class LineageEmitter {
  constructor(supabaseClient = null) {
    this.supabase = supabaseClient;
    this.defaultTenantId = null;
    this.defaultActorSystem = 'application';
  }

  /**
   * Initialize the emitter with Supabase client
   * @param {Object} config - Configuration object
   */
  init(config = {}) {
    if (config.supabaseClient) {
      this.supabase = config.supabaseClient;
    }
    
    this.defaultTenantId = config.tenantId || null;
    this.defaultActorSystem = config.actorSystem || 'application';
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
   * Create a decision trace
   * @param {Object} trace - Trace data
   * @returns {Promise<Object>} - Result with trace ID
   */
  async createTrace(trace) {
    if (!this.supabase) {
      console.warn('[LineageEmitter] Supabase client not initialized. Trace not recorded:', trace);
      return { success: false, error: 'Supabase client not initialized' };
    }

    const decisionTrace = {
      tenant_id: trace.tenantId || this.defaultTenantId,
      trace_type: trace.traceType || TraceTypes.POLICY,
      trace_ref_id: trace.traceRefId || trace.refId || null,
      request_id: trace.requestId || null,
      input_json: trace.input || trace.inputJson || {},
      output_json: trace.output || trace.outputJson || {},
      decision_result: trace.decisionResult || trace.result || null,
      confidence_score: trace.confidenceScore || null,
      explanation: trace.explanation || null,
      reasoning_json: trace.reasoning || trace.reasoningJson || {},
      factors_json: trace.factors || trace.factorsJson || [],
      actor_user_id: trace.actorUserId || trace.userId || null,
      actor_role: trace.actorRole || null,
      actor_system: trace.actorSystem || this.defaultActorSystem,
      version: trace.version || null,
      model_version: trace.modelVersion || null,
      policy_version: trace.policyVersion || null,
      metadata: trace.metadata || {},
      tags: trace.tags || [],
      status: trace.status || TraceStatus.COMPLETED,
      started_at: trace.startedAt || new Date().toISOString(),
      completed_at: trace.completedAt || new Date().toISOString(),
      duration_ms: trace.durationMs || null
    };

    // Validate required fields
    if (!decisionTrace.tenant_id) {
      return { success: false, error: 'tenant_id is required' };
    }

    try {
      const { data, error } = await this.supabase
        .schema('lineage')
        .from('decision_traces')
        .insert([decisionTrace])
        .select('id')
        .single();

      if (error) {
        console.error('[LineageEmitter] Error creating trace:', error);
        return { success: false, error: error.message };
      }

      // If entity links provided, create them
      if (trace.entityLinks && Array.isArray(trace.entityLinks) && trace.entityLinks.length > 0) {
        const linkResult = await this.createTraceLinks(data.id, trace.entityLinks, decisionTrace.tenant_id);
        if (!linkResult.success) {
          console.warn('[LineageEmitter] Warning: Failed to create some entity links:', linkResult.error);
        }
      }

      return { 
        success: true, 
        traceId: data.id,
        tenantId: decisionTrace.tenant_id
      };
    } catch (err) {
      console.error('[LineageEmitter] Exception creating trace:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create trace links to entities
   * @param {string} traceId - Trace UUID
   * @param {Array} links - Array of entity links
   * @param {string} tenantId - Tenant UUID
   * @returns {Promise<Object>} - Result
   */
  async createTraceLinks(traceId, links, tenantId) {
    if (!this.supabase || !links || links.length === 0) {
      return { success: true, count: 0 };
    }

    const traceLinks = links.map(link => ({
      tenant_id: link.tenantId || tenantId || this.defaultTenantId,
      trace_id: traceId,
      entity_type: link.entityType,
      entity_id: String(link.entityId),
      link_type: link.linkType || LinkTypes.AFFECTS,
      relationship_metadata: link.metadata || {}
    }));

    try {
      const { data, error } = await this.supabase
        .schema('lineage')
        .from('trace_links')
        .insert(traceLinks)
        .select('id');

      if (error) {
        console.error('[LineageEmitter] Error creating trace links:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data.length, linkIds: data.map(l => l.id) };
    } catch (err) {
      console.error('[LineageEmitter] Exception creating trace links:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create a trace dependency
   * @param {string} parentTraceId - Parent trace UUID
   * @param {string} childTraceId - Child trace UUID
   * @param {string} dependencyType - Type of dependency
   * @param {string} tenantId - Tenant UUID
   * @returns {Promise<Object>} - Result
   */
  async createTraceDependency(parentTraceId, childTraceId, dependencyType = 'SEQUENTIAL', tenantId = null) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await this.supabase
        .schema('lineage')
        .from('trace_dependencies')
        .insert([{
          tenant_id: tenantId || this.defaultTenantId,
          parent_trace_id: parentTraceId,
          child_trace_id: childTraceId,
          dependency_type: dependencyType
        }])
        .select('id')
        .single();

      if (error) {
        console.error('[LineageEmitter] Error creating trace dependency:', error);
        return { success: false, error: error.message };
      }

      return { success: true, dependencyId: data.id };
    } catch (err) {
      console.error('[LineageEmitter] Exception creating trace dependency:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create a policy decision trace (PDP)
   * @param {Object} params - Policy decision parameters
   * @returns {Promise<Object>} - Result with trace ID
   */
  async createPolicyTrace(params) {
    return this.createTrace({
      traceType: TraceTypes.POLICY,
      actorSystem: 'PDP',
      ...params
    });
  }

  /**
   * Create an allocation decision trace
   * @param {Object} params - Allocation decision parameters
   * @returns {Promise<Object>} - Result with trace ID
   */
  async createAllocationTrace(params) {
    return this.createTrace({
      traceType: TraceTypes.ALLOCATION,
      actorSystem: 'ALLOCATION_ENGINE',
      ...params
    });
  }

  /**
   * Create an AI decision trace
   * @param {Object} params - AI decision parameters
   * @returns {Promise<Object>} - Result with trace ID
   */
  async createAITrace(params) {
    return this.createTrace({
      traceType: TraceTypes.AI,
      actorSystem: params.modelName || 'AI_ENGINE',
      ...params
    });
  }

  /**
   * Create a workflow decision trace
   * @param {Object} params - Workflow decision parameters
   * @returns {Promise<Object>} - Result with trace ID
   */
  async createWorkflowTrace(params) {
    return this.createTrace({
      traceType: TraceTypes.WORKFLOW,
      actorSystem: 'WORKFLOW_ENGINE',
      ...params
    });
  }

  /**
   * Get a trace by ID
   * @param {string} traceId - Trace UUID
   * @returns {Promise<Object>} - Trace data
   */
  async getTrace(traceId) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const { data, error } = await this.supabase
        .schema('lineage')
        .from('decision_traces')
        .select('*')
        .eq('id', traceId)
        .single();

      if (error) {
        console.error('[LineageEmitter] Error getting trace:', error);
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[LineageEmitter] Exception getting trace:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get full trace with links and dependencies
   * @param {string} traceId - Trace UUID
   * @returns {Promise<Object>} - Full trace data
   */
  async getFullTrace(traceId) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      // Get trace
      const { data: trace, error: traceError } = await this.supabase
        .schema('lineage')
        .from('decision_traces')
        .select('*')
        .eq('id', traceId)
        .single();

      if (traceError) {
        return { success: false, error: traceError.message };
      }

      // Get links
      const { data: links } = await this.supabase
        .schema('lineage')
        .from('trace_links')
        .select('*')
        .eq('trace_id', traceId);

      // Get parent dependencies
      const { data: parentDeps } = await this.supabase
        .schema('lineage')
        .from('trace_dependencies')
        .select('parent_trace_id, dependency_type')
        .eq('child_trace_id', traceId);

      // Get child dependencies
      const { data: childDeps } = await this.supabase
        .schema('lineage')
        .from('trace_dependencies')
        .select('child_trace_id, dependency_type')
        .eq('parent_trace_id', traceId);

      return {
        success: true,
        data: {
          trace,
          linkedEntities: links || [],
          parentTraces: parentDeps || [],
          childTraces: childDeps || []
        }
      };
    } catch (err) {
      console.error('[LineageEmitter] Exception getting full trace:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get traces for an entity
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Traces
   */
  async getEntityTraces(entityType, entityId, options = {}) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized', data: [] };
    }

    try {
      let query = this.supabase
        .schema('lineage')
        .from('trace_links')
        .select(`
          trace_id,
          link_type,
          created_at,
          decision_traces!inner (
            id,
            trace_type,
            trace_ref_id,
            decision_result,
            explanation,
            actor_system,
            created_at
          )
        `)
        .eq('entity_type', entityType)
        .eq('entity_id', entityId);

      if (options.linkType) {
        query = query.eq('link_type', options.linkType);
      }

      if (options.tenantId) {
        query = query.eq('tenant_id', options.tenantId);
      }

      const limit = options.limit || 50;
      query = query.order('created_at', { ascending: false }).limit(limit);

      const { data, error } = await query;

      if (error) {
        console.error('[LineageEmitter] Error getting entity traces:', error);
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data };
    } catch (err) {
      console.error('[LineageEmitter] Exception getting entity traces:', err);
      return { success: false, error: err.message, data: [] };
    }
  }

  /**
   * Query decision traces
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Query results
   */
  async queryTraces(query = {}) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized', data: [] };
    }

    let queryBuilder = this.supabase
      .schema('lineage')
      .from('decision_traces')
      .select('*');

    // Apply filters
    if (query.traceType) {
      queryBuilder = queryBuilder.eq('trace_type', query.traceType);
    }
    if (query.traceRefId) {
      queryBuilder = queryBuilder.eq('trace_ref_id', query.traceRefId);
    }
    if (query.decisionResult) {
      queryBuilder = queryBuilder.eq('decision_result', query.decisionResult);
    }
    if (query.actorUserId) {
      queryBuilder = queryBuilder.eq('actor_user_id', query.actorUserId);
    }
    if (query.actorSystem) {
      queryBuilder = queryBuilder.eq('actor_system', query.actorSystem);
    }
    if (query.status) {
      queryBuilder = queryBuilder.eq('status', query.status);
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
        console.error('[LineageEmitter] Error querying traces:', error);
        return { success: false, error: error.message, data: [] };
      }

      return { success: true, data, count };
    } catch (err) {
      console.error('[LineageEmitter] Exception querying traces:', err);
      return { success: false, error: err.message, data: [] };
    }
  }

  /**
   * Update trace status
   * @param {string} traceId - Trace UUID
   * @param {string} status - New status
   * @param {string} errorMessage - Error message (if failed)
   * @returns {Promise<Object>} - Result
   */
  async updateTraceStatus(traceId, status, errorMessage = null) {
    if (!this.supabase) {
      return { success: false, error: 'Supabase client not initialized' };
    }

    try {
      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (errorMessage) {
        updateData.error_message = errorMessage;
      }

      if (status === TraceStatus.COMPLETED || status === TraceStatus.FAILED) {
        updateData.completed_at = new Date().toISOString();
      }

      const { error } = await this.supabase
        .schema('lineage')
        .from('decision_traces')
        .update(updateData)
        .eq('id', traceId);

      if (error) {
        console.error('[LineageEmitter] Error updating trace status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('[LineageEmitter] Exception updating trace status:', err);
      return { success: false, error: err.message };
    }
  }
}

// Create singleton instance
const lineageEmitter = new LineageEmitter();

// Export singleton and class
export { LineageEmitter };
export default lineageEmitter;
