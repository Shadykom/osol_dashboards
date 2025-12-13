/**
 * EPIC 4: Audit, Evidence, Lineage
 * PDP Service - Policy Decision Point with Lineage Integration
 * 
 * This service handles policy evaluations and automatically creates
 * lineage decision traces for audit and compliance purposes.
 */

import { LineageService, TraceTypes, DecisionResults, LinkTypes } from './lineageService';
import { AuditService, AuditEventTypes, EntityTypes } from './auditService';

/**
 * PDPService - Policy Decision Point Service
 * Evaluates policies and creates decision traces
 */
export class PDPService {
  /**
   * Evaluate a policy decision
   * @param {Object} request - Policy evaluation request
   * @returns {Promise<Object>} - Decision result with trace ID
   */
  static async evaluatePolicy(request) {
    const {
      tenantId,
      policyId,
      policyName,
      policyVersion = '1.0',
      subject,        // Who is requesting (user, service, etc.)
      resource,       // What resource is being accessed
      action,         // What action is being performed
      context = {},   // Additional context for the decision
      entityLinks = [] // Entities affected by this decision
    } = request;

    const startTime = Date.now();
    let decision = null;
    let explanation = '';
    let factors = [];
    let reasoning = {};

    try {
      // Perform policy evaluation
      const evaluationResult = await this.performPolicyEvaluation({
        policyId,
        subject,
        resource,
        action,
        context
      });

      decision = evaluationResult.decision;
      explanation = evaluationResult.explanation;
      factors = evaluationResult.factors;
      reasoning = evaluationResult.reasoning;

      const endTime = Date.now();
      const durationMs = endTime - startTime;

      // Create lineage trace for this policy decision
      const traceResult = await LineageService.createTrace({
        tenantId,
        traceType: TraceTypes.POLICY,
        traceRefId: policyId,
        input: {
          policyId,
          policyName,
          subject,
          resource,
          action,
          context
        },
        output: {
          decision,
          details: evaluationResult.details || {}
        },
        decisionResult: decision,
        explanation,
        reasoning,
        factors,
        actorUserId: subject?.userId || null,
        actorSystem: 'PDP',
        policyVersion,
        startedAt: new Date(startTime).toISOString(),
        completedAt: new Date(endTime).toISOString(),
        durationMs,
        entityLinks: [
          // Link to the subject
          subject?.userId ? {
            entityType: EntityTypes.USER,
            entityId: subject.userId,
            linkType: LinkTypes.TRIGGERED_BY
          } : null,
          // Link to the resource
          resource?.type && resource?.id ? {
            entityType: resource.type,
            entityId: resource.id,
            linkType: LinkTypes.AFFECTS
          } : null,
          // Additional custom links
          ...entityLinks
        ].filter(Boolean),
        metadata: {
          policyName,
          evaluationContext: context
        }
      });

      // Emit audit event for the policy evaluation
      await AuditService.emitEvent({
        tenantId,
        eventType: AuditEventTypes.POLICY_EVALUATION,
        actorUserId: subject?.userId,
        actorRole: subject?.role,
        entityType: 'POLICY',
        entityId: policyId,
        source: 'PDP',
        after: {
          decision,
          policyName,
          resource,
          action,
          traceId: traceResult.traceId
        },
        metadata: {
          durationMs,
          factors: factors.length
        }
      });

      return {
        success: true,
        decision,
        explanation,
        factors,
        traceId: traceResult.traceId,
        durationMs,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      console.error('[PDPService] Policy evaluation error:', err);

      // Create trace even for errors
      await LineageService.createTrace({
        tenantId,
        traceType: TraceTypes.POLICY,
        traceRefId: policyId,
        input: { policyId, subject, resource, action, context },
        output: { error: err.message },
        decisionResult: DecisionResults.DENIED,
        explanation: `Policy evaluation failed: ${err.message}`,
        actorSystem: 'PDP',
        status: 'FAILED',
        metadata: { error: err.message }
      });

      return {
        success: false,
        decision: DecisionResults.DENIED,
        explanation: `Policy evaluation error: ${err.message}`,
        error: err.message
      };
    }
  }

  /**
   * Perform the actual policy evaluation logic
   * @param {Object} params - Evaluation parameters
   * @returns {Object} - Evaluation result
   */
  static async performPolicyEvaluation(params) {
    const { subject, resource, action, context } = params;

    // Initialize factors array
    const factors = [];
    let decision = DecisionResults.DENIED;
    let explanation = '';
    const reasoning = {
      rules_evaluated: [],
      conditions_met: [],
      conditions_failed: []
    };

    // Example policy evaluation logic - this should be customized based on actual policies
    
    // Factor 1: Check if subject exists
    if (subject && subject.userId) {
      factors.push({
        name: 'subject_authenticated',
        weight: 0.3,
        value: true,
        description: 'Subject is authenticated'
      });
      reasoning.conditions_met.push('Subject is authenticated');
    } else {
      factors.push({
        name: 'subject_authenticated',
        weight: 0.3,
        value: false,
        description: 'Subject is not authenticated'
      });
      reasoning.conditions_failed.push('Subject not authenticated');
      return {
        decision: DecisionResults.DENIED,
        explanation: 'Access denied: Subject not authenticated',
        factors,
        reasoning
      };
    }

    // Factor 2: Check role-based access
    const allowedRoles = context.allowedRoles || ['admin', 'manager', 'user'];
    const hasRole = allowedRoles.includes(subject.role);
    
    factors.push({
      name: 'role_check',
      weight: 0.3,
      value: hasRole,
      description: `Role '${subject.role}' access check`
    });

    if (hasRole) {
      reasoning.conditions_met.push(`Subject has allowed role: ${subject.role}`);
    } else {
      reasoning.conditions_failed.push(`Subject role '${subject.role}' not in allowed roles`);
    }

    // Factor 3: Check resource access
    const hasResourceAccess = !context.restrictedResources || 
      !context.restrictedResources.includes(resource?.type);
    
    factors.push({
      name: 'resource_access',
      weight: 0.2,
      value: hasResourceAccess,
      description: 'Resource access check'
    });

    if (hasResourceAccess) {
      reasoning.conditions_met.push('Resource is accessible');
    } else {
      reasoning.conditions_failed.push('Resource is restricted');
    }

    // Factor 4: Check action permissions
    const actionPermissions = {
      admin: ['create', 'read', 'update', 'delete', 'approve', 'manage'],
      manager: ['create', 'read', 'update', 'approve'],
      user: ['create', 'read', 'update'],
      viewer: ['read']
    };

    const rolePermissions = actionPermissions[subject.role] || ['read'];
    const hasActionPermission = rolePermissions.includes(action);

    factors.push({
      name: 'action_permission',
      weight: 0.2,
      value: hasActionPermission,
      description: `Action '${action}' permission check for role '${subject.role}'`
    });

    if (hasActionPermission) {
      reasoning.conditions_met.push(`Action '${action}' is permitted for role '${subject.role}'`);
    } else {
      reasoning.conditions_failed.push(`Action '${action}' is not permitted for role '${subject.role}'`);
    }

    // Calculate final decision based on factors
    const totalWeight = factors.reduce((sum, f) => sum + f.weight, 0);
    const positiveScore = factors
      .filter(f => f.value)
      .reduce((sum, f) => sum + f.weight, 0);
    
    const score = positiveScore / totalWeight;

    if (score >= 0.8) {
      decision = DecisionResults.APPROVED;
      explanation = 'Access approved: All policy conditions met';
    } else if (score >= 0.5) {
      decision = DecisionResults.CONDITIONALLY_APPROVED;
      explanation = 'Access conditionally approved: Some conditions not met';
    } else {
      decision = DecisionResults.DENIED;
      explanation = 'Access denied: Policy conditions not satisfied';
    }

    reasoning.rules_evaluated.push({
      rule: 'composite_policy_evaluation',
      score,
      threshold: 0.8
    });

    return {
      decision,
      explanation,
      factors,
      reasoning,
      details: {
        score,
        threshold: 0.8,
        positiveScore,
        totalWeight
      }
    };
  }

  /**
   * Evaluate multiple policies (AND logic - all must pass)
   * @param {Object} request - Multi-policy evaluation request
   * @returns {Promise<Object>} - Combined decision result
   */
  static async evaluateMultiplePolicies(request) {
    const { tenantId, policies, subject, resource, action, context } = request;

    const results = [];
    let allApproved = true;
    const traceIds = [];

    for (const policy of policies) {
      const result = await this.evaluatePolicy({
        tenantId,
        policyId: policy.id,
        policyName: policy.name,
        policyVersion: policy.version,
        subject,
        resource,
        action,
        context: { ...context, ...policy.context }
      });

      results.push({
        policyId: policy.id,
        policyName: policy.name,
        ...result
      });

      if (result.decision !== DecisionResults.APPROVED) {
        allApproved = false;
      }

      if (result.traceId) {
        traceIds.push(result.traceId);
      }
    }

    // Create dependencies between traces
    if (traceIds.length > 1) {
      for (let i = 1; i < traceIds.length; i++) {
        await LineageService.createTraceDependency(
          traceIds[i - 1],
          traceIds[i],
          'SEQUENTIAL',
          tenantId
        );
      }
    }

    return {
      success: true,
      decision: allApproved ? DecisionResults.APPROVED : DecisionResults.DENIED,
      explanation: allApproved 
        ? 'All policies approved'
        : 'One or more policies denied access',
      results,
      traceIds
    };
  }

  /**
   * Get decision history for a resource
   * @param {string} entityType - Entity type
   * @param {string} entityId - Entity ID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - Decision history
   */
  static async getDecisionHistory(entityType, entityId, options = {}) {
    return LineageService.getEntityTraces(entityType, entityId, {
      ...options,
      linkType: LinkTypes.AFFECTS
    });
  }

  /**
   * Get decisions made by a user
   * @param {string} userId - User UUID
   * @param {Object} options - Query options
   * @returns {Promise<Object>} - User's decisions
   */
  static async getUserDecisions(userId, options = {}) {
    return LineageService.queryTraces({
      actorUserId: userId,
      traceType: TraceTypes.POLICY,
      ...options
    });
  }
}

export default PDPService;
