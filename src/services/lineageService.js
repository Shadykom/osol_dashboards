/**
 * EPIC 4: Audit, Evidence, Lineage
 * Lineage Service - API operations for decision traces
 * 
 * POST /lineage/trace - Create decision trace (internal use from PDP)
 * GET /lineage/trace/{id} - Get decision trace with full lineage
 */

import { supabase } from '@/lib/supabase';

// Trace types enum
export const TraceTypes = {
  POLICY: 'POLICY',
  ALLOCATION: 'ALLOCATION',
  AI: 'AI',
  WORKFLOW: 'WORKFLOW',
  APPROVAL: 'APPROVAL',
  CALCULATION: 'CALCULATION'
};

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
 * LineageService class for decision trace operations
 */
export class LineageService {
  /**
   * Create a decision trace
   * POST /lineage/trace
   * @param {Object} traceData - Trace data
   * @returns {Promise<Object>} - Result with trace ID
   */
  static async createTrace(traceData) {
    const {
      tenantId,
      traceType = TraceTypes.POLICY,
      traceRefId = null,
      requestId = null,
      input,
      output = {},
      decisionResult = null,
      confidenceScore = null,
      explanation = null,
      reasoning = {},
      factors = [],
      actorUserId = null,
      actorRole = null,
      actorSystem = 'application',
      version = null,
      modelVersion = null,
      policyVersion = null,
      metadata = {},
      tags = [],
      status = TraceStatus.COMPLETED,
      entityLinks = []
    } = traceData;

    // Validate required fields
    if (!tenantId) {
      return { success: false, error: 'tenantId is required' };
    }
    if (!input) {
      return { success: false, error: 'input is required' };
    }

    const startedAt = traceData.startedAt || new Date().toISOString();
    const completedAt = traceData.completedAt || new Date().toISOString();
    const durationMs = traceData.durationMs || 
      (new Date(completedAt) - new Date(startedAt));

    try {
      const decisionTrace = {
        tenant_id: tenantId,
        trace_type: traceType,
        trace_ref_id: traceRefId,
        request_id: requestId,
        input_json: input,
        output_json: output,
        decision_result: decisionResult,
        confidence_score: confidenceScore,
        explanation: explanation,
        reasoning_json: reasoning,
        factors_json: factors,
        actor_user_id: actorUserId,
        actor_role: actorRole,
        actor_system: actorSystem,
        version: version,
        model_version: modelVersion,
        policy_version: policyVersion,
        metadata: metadata,
        tags: tags,
        status: status,
        started_at: startedAt,
        completed_at: completedAt,
        duration_ms: durationMs
      };

      const { data, error } = await supabase
        .from('lineage.decision_traces')
        .insert([decisionTrace])
        .select('id')
        .single();

      if (error) {
        console.warn('[LineageService] Direct insert failed, trying fallback:', error);
        return await this.createTraceWithFallback(decisionTrace, entityLinks);
      }

      // Create entity links if provided
      if (entityLinks && entityLinks.length > 0) {
        await this.createTraceLinks(data.id, entityLinks, tenantId);
      }

      console.log('[LineageService] Trace created:', data.id);

      return {
        success: true,
        traceId: data.id,
        tenantId
      };
    } catch (err) {
      console.error('[LineageService] Exception creating trace:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create trace with fallback (local storage for demo)
   * @param {Object} trace - Trace data
   * @param {Array} entityLinks - Entity links
   * @returns {Promise<Object>} - Result
   */
  static async createTraceWithFallback(trace, entityLinks = []) {
    try {
      // Try RPC call
      const { data: traceId, error: rpcError } = await supabase.rpc('lineage_create_trace', {
        p_tenant_id: trace.tenant_id,
        p_trace_type: trace.trace_type,
        p_input_json: trace.input_json,
        p_output_json: trace.output_json,
        p_explanation: trace.explanation,
        p_decision_result: trace.decision_result,
        p_actor_user_id: trace.actor_user_id,
        p_actor_system: trace.actor_system,
        p_trace_ref_id: trace.trace_ref_id,
        p_confidence_score: trace.confidence_score,
        p_reasoning_json: trace.reasoning_json,
        p_factors_json: trace.factors_json,
        p_version: trace.version,
        p_metadata: trace.metadata
      });

      if (rpcError) {
        console.warn('[LineageService] RPC fallback failed, using local storage:', rpcError);
        
        // Store in local storage as last resort
        const localTraceId = `local_trace_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        const traceRecord = {
          id: localTraceId,
          ...trace,
          entityLinks,
          isLocalStorage: true,
          created_at: new Date().toISOString()
        };

        // Store in localStorage
        const existingTraces = JSON.parse(localStorage.getItem('osol_lineage_traces') || '{}');
        existingTraces[localTraceId] = traceRecord;
        localStorage.setItem('osol_lineage_traces', JSON.stringify(existingTraces));

        return {
          success: true,
          traceId: localTraceId,
          tenantId: trace.tenant_id,
          isLocalStorage: true
        };
      }

      // Create entity links
      if (entityLinks && entityLinks.length > 0) {
        await this.createTraceLinks(traceId, entityLinks, trace.tenant_id);
      }

      return {
        success: true,
        traceId,
        tenantId: trace.tenant_id
      };
    } catch (err) {
      console.error('[LineageService] Fallback error:', err);
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
  static async createTraceLinks(traceId, links, tenantId) {
    if (!links || links.length === 0) {
      return { success: true, count: 0 };
    }

    const traceLinks = links.map(link => ({
      tenant_id: link.tenantId || tenantId,
      trace_id: traceId,
      entity_type: link.entityType,
      entity_id: String(link.entityId),
      link_type: link.linkType || LinkTypes.AFFECTS,
      relationship_metadata: link.metadata || {}
    }));

    try {
      const { data, error } = await supabase
        .from('lineage.trace_links')
        .insert(traceLinks)
        .select('id');

      if (error) {
        console.warn('[LineageService] Error creating trace links:', error);
        return { success: false, error: error.message };
      }

      return { success: true, count: data.length, linkIds: data.map(l => l.id) };
    } catch (err) {
      console.warn('[LineageService] Exception creating trace links:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Get a trace by ID
   * GET /lineage/trace/{id}
   * @param {string} traceId - Trace UUID
   * @returns {Promise<Object>} - Trace data
   */
  static async getTrace(traceId) {
    try {
      // Check local storage first
      const localTraces = JSON.parse(localStorage.getItem('osol_lineage_traces') || '{}');
      if (localTraces[traceId]) {
        return { success: true, data: localTraces[traceId] };
      }

      const { data, error } = await supabase
        .from('lineage.decision_traces')
        .select('*')
        .eq('id', traceId)
        .single();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  }

  /**
   * Get full trace with links and dependencies
   * @param {string} traceId - Trace UUID
   * @returns {Promise<Object>} - Full trace data
   */
  static async getFullTrace(traceId) {
    try {
      // Check local storage first
      const localTraces = JSON.parse(localStorage.getItem('osol_lineage_traces') || '{}');
      if (localTraces[traceId]) {
        return {
          success: true,
          data: {
            trace: localTraces[traceId],
            linkedEntities: localTraces[traceId].entityLinks || [],
            parentTraces: [],
            childTraces: []
          }
        };
      }

      // Get trace
      const { data: trace, error: traceError } = await supabase
        .from('lineage.decision_traces')
        .select('*')
        .eq('id', traceId)
        .single();

      if (traceError) {
        return { success: false, error: traceError.message };
      }

      // Get links
      const { data: links } = await supabase
        .from('lineage.trace_links')
        .select('*')
        .eq('trace_id', traceId);

      // Get parent dependencies
      const { data: parentDeps } = await supabase
        .from('lineage.trace_dependencies')
        .select('parent_trace_id, dependency_type')
        .eq('child_trace_id', traceId);

      // Get child dependencies
      const { data: childDeps } = await supabase
        .from('lineage.trace_dependencies')
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
      console.error('[LineageService] Exception getting full trace:', err);
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
  static async getEntityTraces(entityType, entityId, options = {}) {
    try {
      // Check local storage
      const localTraces = JSON.parse(localStorage.getItem('osol_lineage_traces') || '{}');
      const localMatches = Object.values(localTraces).filter(trace => 
        trace.entityLinks?.some(link => 
          link.entityType === entityType && link.entityId === entityId
        )
      );

      let query = supabase
        .from('lineage.trace_links')
        .select(`
          trace_id,
          link_type,
          created_at
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

      const { data: links, error } = await query;

      if (error) {
        if (localMatches.length > 0) {
          return { success: true, data: localMatches };
        }
        return { success: false, error: error.message, data: [] };
      }

      // Get full trace data for each link
      if (links && links.length > 0) {
        const traceIds = [...new Set(links.map(l => l.trace_id))];
        const { data: traces } = await supabase
          .from('lineage.decision_traces')
          .select('*')
          .in('id', traceIds);

        const combinedData = links.map(link => {
          const trace = traces?.find(t => t.id === link.trace_id);
          return {
            ...link,
            trace
          };
        });

        return { success: true, data: [...combinedData, ...localMatches] };
      }

      return { success: true, data: localMatches };
    } catch (err) {
      console.error('[LineageService] Exception getting entity traces:', err);
      return { success: false, error: err.message, data: [] };
    }
  }

  /**
   * Query decision traces
   * @param {Object} query - Query parameters
   * @returns {Promise<Object>} - Query results
   */
  static async queryTraces(query = {}) {
    try {
      let queryBuilder = supabase
        .from('lineage.decision_traces')
        .select('*', { count: 'exact' });

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

      const { data, error, count } = await queryBuilder;

      if (error) {
        // Fallback to local storage
        const localTraces = JSON.parse(localStorage.getItem('osol_lineage_traces') || '{}');
        let localData = Object.values(localTraces);

        // Apply filters to local data
        if (query.traceType) {
          localData = localData.filter(t => t.trace_type === query.traceType);
        }
        if (query.decisionResult) {
          localData = localData.filter(t => t.decision_result === query.decisionResult);
        }
        if (query.tenantId) {
          localData = localData.filter(t => t.tenant_id === query.tenantId);
        }

        return {
          success: true,
          data: localData.slice(offset, offset + limit),
          total: localData.length,
          isLocalStorage: true
        };
      }

      return { success: true, data, total: count || 0, limit, offset };
    } catch (err) {
      console.error('[LineageService] Exception querying traces:', err);
      return { success: false, error: err.message, data: [], total: 0 };
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
  static async createTraceDependency(parentTraceId, childTraceId, dependencyType = 'SEQUENTIAL', tenantId = null) {
    try {
      const { data, error } = await supabase
        .from('lineage.trace_dependencies')
        .insert([{
          tenant_id: tenantId,
          parent_trace_id: parentTraceId,
          child_trace_id: childTraceId,
          dependency_type: dependencyType
        }])
        .select('id')
        .single();

      if (error) {
        console.error('[LineageService] Error creating trace dependency:', error);
        return { success: false, error: error.message };
      }

      return { success: true, dependencyId: data.id };
    } catch (err) {
      console.error('[LineageService] Exception creating trace dependency:', err);
      return { success: false, error: err.message };
    }
  }

  /**
   * Create a policy decision trace (convenience method for PDP)
   * @param {Object} params - Policy decision parameters
   * @returns {Promise<Object>} - Result with trace ID
   */
  static async createPolicyTrace(params) {
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
  static async createAllocationTrace(params) {
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
  static async createAITrace(params) {
    return this.createTrace({
      traceType: TraceTypes.AI,
      actorSystem: params.modelName || 'AI_ENGINE',
      ...params
    });
  }

  /**
   * Update trace status
   * @param {string} traceId - Trace UUID
   * @param {string} status - New status
   * @param {string} errorMessage - Error message (if failed)
   * @returns {Promise<Object>} - Result
   */
  static async updateTraceStatus(traceId, status, errorMessage = null) {
    try {
      // Check local storage first
      const localTraces = JSON.parse(localStorage.getItem('osol_lineage_traces') || '{}');
      if (localTraces[traceId]) {
        localTraces[traceId].status = status;
        if (errorMessage) {
          localTraces[traceId].error_message = errorMessage;
        }
        localTraces[traceId].updated_at = new Date().toISOString();
        if (status === TraceStatus.COMPLETED || status === TraceStatus.FAILED) {
          localTraces[traceId].completed_at = new Date().toISOString();
        }
        localStorage.setItem('osol_lineage_traces', JSON.stringify(localTraces));
        return { success: true };
      }

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

      const { error } = await supabase
        .from('lineage.decision_traces')
        .update(updateData)
        .eq('id', traceId);

      if (error) {
        console.error('[LineageService] Error updating trace status:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (err) {
      console.error('[LineageService] Exception updating trace status:', err);
      return { success: false, error: err.message };
    }
  }
}

export default LineageService;
