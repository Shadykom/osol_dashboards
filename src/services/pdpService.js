/**
 * =====================================================
 * EPIC 3 + EPIC 4: Policy Decision Point (PDP) Service
 * =====================================================
 * 
 * This service combines:
 * - EPIC 3: Regulatory policy engine for collection contact rules
 * - EPIC 4: Lineage tracing for audit and compliance
 * 
 * Key Features:
 * - Policy lookup by tenant/customer type/secured flag
 * - Rule evaluation engine with support for multiple rule types
 * - Explainable decisions with reason codes and details
 * - Decision lineage tracing for compliance
 * - Audit logging
 * - Tenant isolation via RLS
 */

import { supabase } from '@/lib/supabase';

// Try to import lineage service if available
let LineageService = null;
let AuditService = null;
try {
  const lineageModule = await import('./lineageService.js');
  LineageService = lineageModule.LineageService;
  const auditModule = await import('./auditService.js');
  AuditService = auditModule.AuditService;
} catch (e) {
}

// =====================================================
// Constants and Rule Types
// =====================================================

export const DECISIONS = {
  ALLOW: 'ALLOW',
  BLOCK: 'BLOCK',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED',
  // EPIC 4 compatible decision types
  APPROVED: 'APPROVED',
  DENIED: 'DENIED',
  PENDING: 'PENDING',
  CONDITIONALLY_APPROVED: 'CONDITIONALLY_APPROVED'
};

export const REASON_CODES = {
  // Allow reasons
  POLICY_COMPLIANT: 'POLICY_COMPLIANT',
  NO_POLICY_FOUND: 'NO_POLICY_FOUND',
  
  // Block reasons
  MAX_ATTEMPTS_EXCEEDED: 'MAX_ATTEMPTS_EXCEEDED',
  OUTSIDE_TIME_WINDOW: 'OUTSIDE_TIME_WINDOW',
  COOLING_PERIOD_ACTIVE: 'COOLING_PERIOD_ACTIVE',
  CONSENT_REQUIRED: 'CONSENT_REQUIRED',
  CHANNEL_BLOCKED: 'CHANNEL_BLOCKED',
  BUCKET_RESTRICTED: 'BUCKET_RESTRICTED',
  
  // Approval required reasons
  LIMIT_APPROACHING: 'LIMIT_APPROACHING',
  MANUAL_REVIEW_REQUIRED: 'MANUAL_REVIEW_REQUIRED',
  SPECIAL_HANDLING: 'SPECIAL_HANDLING'
};

export const RULE_TYPES = {
  MAX_ATTEMPTS: 'max_attempts',
  TIME_WINDOW: 'time_window',
  COOLING_PERIOD: 'cooling_period',
  CONSENT_CHECK: 'consent_check',
  CHANNEL_RESTRICTION: 'channel_restriction',
  BUCKET_RULE: 'bucket_rule'
};

// Trace types for lineage (EPIC 4)
export const TRACE_TYPES = {
  POLICY: 'POLICY',
  ALLOCATION: 'ALLOCATION',
  AI: 'AI'
};

// Link types for lineage (EPIC 4)
export const LINK_TYPES = {
  AFFECTS: 'AFFECTS',
  TRIGGERED_BY: 'TRIGGERED_BY',
  REFERENCES: 'REFERENCES'
};

// PDP Tables
const PDP_TABLES = {
  POLICY_PROFILES: 'pdp_policy_profiles',
  POLICY_VERSIONS: 'pdp_policy_versions',
  DECISION_LOG: 'pdp_decision_log',
  CONTACT_ATTEMPT_CACHE: 'pdp_contact_attempt_cache'
};

// =====================================================
// PDP Service Class
// =====================================================

export class PDPService {
  constructor() {
    this.defaultTenantId = '00000000-0000-0000-0000-000000000000';
  }

  // =====================================================
  // EPIC 3: Regulatory Policy Evaluation
  // =====================================================

  /**
   * Main entry point: Evaluate a policy decision request
   * @param {Object} request - The PDP request object
   * @returns {Object} - The PDP decision response
   */
  async evaluateDecision(request) {
    const startTime = Date.now();
    const rulesEvaluated = [];
    
    try {
      // Validate required fields
      this.validateRequest(request);
      
      const {
        tenant_id,
        customer_type,
        secured_flag,
        action_type,
        channel,
        customer_id,
        contract_id,
        portfolio_id,
        bucket,
        timestamp,
        consent_status,
        contact_history,
        additional_context
      } = request;
      
      // Get active policy for this tenant/customer type
      const policy = await this.getActivePolicy(tenant_id, customer_type, secured_flag);
      
      // If no policy found, allow by default with warning
      if (!policy) {
        const response = this.createResponse({
          decision: DECISIONS.ALLOW,
          reason_code: REASON_CODES.NO_POLICY_FOUND,
          reason_details: ['No active policy found for this customer type. Allowing by default.'],
          policy_profile_id: null,
          policy_version_id: null
        });
        
        await this.logDecision(request, response, rulesEvaluated, Date.now() - startTime);
        return response;
      }
      
      const rules = policy.rules_json?.rules || [];
      
      // Evaluate each rule
      let decision = DECISIONS.ALLOW;
      let reason_code = REASON_CODES.POLICY_COMPLIANT;
      let reason_details = [];
      let cooling_period_until = null;
      let max_attempts = null;
      let window = null;
      let required_evidence = [];
      
      for (const rule of rules) {
        const ruleResult = await this.evaluateRule(rule, request, contact_history);
        rulesEvaluated.push({
          rule_type: rule.type,
          rule_config: rule,
          result: ruleResult
        });
        
        // If rule fails, determine the action
        if (!ruleResult.passed) {
          // Determine if this should block or require approval
          const ruleDecision = rule.on_violation === 'APPROVAL_REQUIRED' 
            ? DECISIONS.APPROVAL_REQUIRED 
            : DECISIONS.BLOCK;
          
          // BLOCK takes precedence over APPROVAL_REQUIRED
          if (ruleDecision === DECISIONS.BLOCK || decision === DECISIONS.ALLOW) {
            decision = ruleDecision;
            reason_code = ruleResult.reason_code;
            reason_details = [...reason_details, ...ruleResult.reason_details];
            
            if (ruleResult.cooling_period_until) {
              cooling_period_until = ruleResult.cooling_period_until;
            }
            if (ruleResult.max_attempts !== undefined) {
              max_attempts = ruleResult.max_attempts;
            }
            if (ruleResult.window) {
              window = ruleResult.window;
            }
            if (ruleResult.required_evidence) {
              required_evidence = [...required_evidence, ...ruleResult.required_evidence];
            }
          }
        }
      }
      
      const response = this.createResponse({
        decision,
        reason_code,
        reason_details: [...new Set(reason_details)],  // Remove duplicates
        policy_profile_id: policy.profile_id,
        policy_version_id: policy.version_id,
        required_evidence: [...new Set(required_evidence)],
        cooling_period_until,
        max_attempts,
        window
      });
      
      // Log the decision for audit
      await this.logDecision(request, response, rulesEvaluated, Date.now() - startTime);
      
      // Create lineage trace (EPIC 4)
      await this.createDecisionTrace(request, response, rulesEvaluated, Date.now() - startTime);
      
      return response;
      
    } catch (error) {
      // Log error but return safe default (BLOCK for safety)
      const errorResponse = this.createResponse({
        decision: DECISIONS.BLOCK,
        reason_code: 'EVALUATION_ERROR',
        reason_details: [error.message || 'An error occurred during policy evaluation'],
        policy_profile_id: null,
        policy_version_id: null
      });
      
      await this.logDecision(request, errorResponse, rulesEvaluated, Date.now() - startTime);
      
      return errorResponse;
    }
  }

  // =====================================================
  // EPIC 4: Generic Access Control with Lineage
  // =====================================================

  /**
   * Evaluate a generic policy decision (EPIC 4 style)
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
      const evaluationResult = await PDPService.performPolicyEvaluation({
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

      // Create lineage trace for this policy decision (if LineageService available)
      let traceId = null;
      if (LineageService) {
        const traceResult = await LineageService.createTrace({
          tenantId,
          traceType: TRACE_TYPES.POLICY,
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
            subject?.userId ? {
              entityType: 'USER',
              entityId: subject.userId,
              linkType: LINK_TYPES.TRIGGERED_BY
            } : null,
            resource?.type && resource?.id ? {
              entityType: resource.type,
              entityId: resource.id,
              linkType: LINK_TYPES.AFFECTS
            } : null,
            ...entityLinks
          ].filter(Boolean),
          metadata: {
            policyName,
            evaluationContext: context
          }
        });
        traceId = traceResult.traceId;
      }

      // Emit audit event (if AuditService available)
      if (AuditService) {
        await AuditService.emitEvent({
          tenantId,
          eventType: 'POLICY_EVALUATION',
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
            traceId
          },
          metadata: {
            durationMs,
            factors: factors.length
          }
        });
      }

      return {
        success: true,
        decision,
        explanation,
        factors,
        traceId,
        durationMs,
        timestamp: new Date().toISOString()
      };
    } catch (err) {
      // Create trace even for errors (if LineageService available)
      if (LineageService) {
        await LineageService.createTrace({
          tenantId,
          traceType: TRACE_TYPES.POLICY,
          traceRefId: policyId,
          input: { policyId, subject, resource, action, context },
          output: { error: err.message },
          decisionResult: DECISIONS.DENIED,
          explanation: `Policy evaluation failed: ${err.message}`,
          actorSystem: 'PDP',
          status: 'FAILED',
          metadata: { error: err.message }
        });
      }

      return {
        success: false,
        decision: DECISIONS.DENIED,
        explanation: `Policy evaluation error: ${err.message}`,
        error: err.message
      };
    }
  }

  /**
   * Perform the actual policy evaluation logic (EPIC 4 style)
   */
  static async performPolicyEvaluation(params) {
    const { subject, resource, action, context } = params;

    const factors = [];
    let decision = DECISIONS.DENIED;
    let explanation = '';
    const reasoning = {
      rules_evaluated: [],
      conditions_met: [],
      conditions_failed: []
    };

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
        decision: DECISIONS.DENIED,
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
      decision = DECISIONS.APPROVED;
      explanation = 'Access approved: All policy conditions met';
    } else if (score >= 0.5) {
      decision = DECISIONS.CONDITIONALLY_APPROVED;
      explanation = 'Access conditionally approved: Some conditions not met';
    } else {
      decision = DECISIONS.DENIED;
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

  // =====================================================
  // EPIC 3: Rule Evaluation Methods
  // =====================================================

  /**
   * Validate the request object
   */
  validateRequest(request) {
    const required = ['tenant_id', 'customer_type', 'action_type', 'customer_id'];
    const missing = required.filter(field => !request[field]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required fields: ${missing.join(', ')}`);
    }
    
    const validCustomerTypes = ['RETAIL', 'SME', 'CORP'];
    if (!validCustomerTypes.includes(request.customer_type)) {
      throw new Error(`Invalid customer_type: ${request.customer_type}. Must be one of: ${validCustomerTypes.join(', ')}`);
    }
  }

  /**
   * Get the active policy for a tenant/customer type combination
   */
  async getActivePolicy(tenantId, customerType, securedFlag) {
    try {
      let query = supabase
        .from(PDP_TABLES.POLICY_PROFILES)
        .select(`
          id,
          name,
          customer_type,
          secured_flag,
          priority,
          ${PDP_TABLES.POLICY_VERSIONS}!inner (
            id,
            version_no,
            rules_json,
            effective_from,
            effective_to
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('customer_type', customerType)
        .eq('status', 'ACTIVE')
        .eq(`${PDP_TABLES.POLICY_VERSIONS}.status`, 'PUBLISHED')
        .order('priority', { ascending: true })
        .limit(1);
      
      if (securedFlag !== null && securedFlag !== undefined) {
        query = query.or(`secured_flag.is.null,secured_flag.eq.${securedFlag}`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return null;
      }
      
      if (!data || data.length === 0) {
        return null;
      }
      
      const profile = data[0];
      const versions = profile[PDP_TABLES.POLICY_VERSIONS] || profile.pdp_policy_versions || [];
      const version = versions[0];
      
      const now = new Date();
      if (version.effective_from && new Date(version.effective_from) > now) {
        return null;
      }
      if (version.effective_to && new Date(version.effective_to) < now) {
        return null;
      }
      
      return {
        profile_id: profile.id,
        profile_name: profile.name,
        version_id: version.id,
        version_no: version.version_no,
        rules_json: version.rules_json
      };
      
    } catch (error) {
      return null;
    }
  }

  /**
   * Evaluate a single rule
   */
  async evaluateRule(rule, request, contactHistory) {
    switch (rule.type) {
      case RULE_TYPES.MAX_ATTEMPTS:
        return await this.evaluateMaxAttemptsRule(rule, request, contactHistory);
      case RULE_TYPES.TIME_WINDOW:
        return this.evaluateTimeWindowRule(rule, request);
      case RULE_TYPES.COOLING_PERIOD:
        return await this.evaluateCoolingPeriodRule(rule, request, contactHistory);
      case RULE_TYPES.CONSENT_CHECK:
        return this.evaluateConsentRule(rule, request);
      case RULE_TYPES.CHANNEL_RESTRICTION:
        return this.evaluateChannelRestrictionRule(rule, request);
      case RULE_TYPES.BUCKET_RULE:
        return this.evaluateBucketRule(rule, request);
      default:
        return { passed: true, reason_code: null, reason_details: [] };
    }
  }

  /**
   * Evaluate max attempts per window rule
   */
  async evaluateMaxAttemptsRule(rule, request, contactHistory) {
    const { max_attempts, window, action_types, channels } = rule;
    
    if (action_types && !action_types.includes(request.action_type)) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    if (channels && !channels.includes(request.channel)) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    
    let attempts = 0;
    
    if (contactHistory) {
      attempts = contactHistory.attempts || 0;
      
      if (contactHistory.window !== window) {
        const dbHistory = await this.getContactHistory(
          request.tenant_id, 
          request.customer_id, 
          request.action_type, 
          window
        );
        attempts = dbHistory.attempts;
      }
    } else {
      const dbHistory = await this.getContactHistory(
        request.tenant_id, 
        request.customer_id, 
        request.action_type, 
        window
      );
      attempts = dbHistory.attempts;
    }
    
    if (attempts >= max_attempts) {
      return {
        passed: false,
        reason_code: REASON_CODES.MAX_ATTEMPTS_EXCEEDED,
        reason_details: [
          `Maximum ${max_attempts} attempts per ${window} exceeded. Current: ${attempts}`
        ],
        max_attempts,
        window,
        required_evidence: rule.on_violation === 'APPROVAL_REQUIRED' 
          ? ['manager_approval', 'justification_required'] 
          : []
      };
    }
    
    const threshold = Math.floor(max_attempts * 0.8);
    if (attempts >= threshold && rule.on_violation !== 'BLOCK') {
      return {
        passed: true,
        reason_code: REASON_CODES.LIMIT_APPROACHING,
        reason_details: [
          `Approaching limit: ${attempts}/${max_attempts} attempts in ${window}`
        ],
        max_attempts,
        window
      };
    }
    
    return { 
      passed: true, 
      reason_code: null, 
      reason_details: [],
      max_attempts,
      window 
    };
  }

  /**
   * Evaluate time window rule (allowed contact hours)
   */
  evaluateTimeWindowRule(rule, request) {
    const { allowed_windows } = rule;
    
    const requestTime = request.timestamp 
      ? new Date(request.timestamp) 
      : new Date();
    
    const currentHour = requestTime.getHours();
    const currentMinute = requestTime.getMinutes();
    const currentDay = requestTime.getDay();
    
    for (const window of allowed_windows) {
      if (window.days && !window.days.includes(currentDay)) {
        continue;
      }
      
      const [startHour, startMin] = window.start_time.split(':').map(Number);
      const [endHour, endMin] = window.end_time.split(':').map(Number);
      
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const startTimeInMinutes = startHour * 60 + startMin;
      const endTimeInMinutes = endHour * 60 + endMin;
      
      if (currentTimeInMinutes >= startTimeInMinutes && 
          currentTimeInMinutes <= endTimeInMinutes) {
        return { passed: true, reason_code: null, reason_details: [] };
      }
    }
    
    const windowDescriptions = allowed_windows.map(w => {
      const days = w.days ? w.days.map(d => ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d]).join(',') : 'All days';
      return `${days}: ${w.start_time}-${w.end_time}`;
    });
    
    return {
      passed: false,
      reason_code: REASON_CODES.OUTSIDE_TIME_WINDOW,
      reason_details: [
        `Current time ${currentHour}:${currentMinute.toString().padStart(2, '0')} is outside allowed contact windows`,
        `Allowed windows: ${windowDescriptions.join('; ')}`
      ]
    };
  }

  /**
   * Evaluate cooling period rule
   */
  async evaluateCoolingPeriodRule(rule, request, contactHistory) {
    const { cooling_period } = rule;
    
    let lastAttemptAt = contactHistory?.last_attempt_at;
    
    if (!lastAttemptAt) {
      const dbHistory = await this.getContactHistory(
        request.tenant_id,
        request.customer_id,
        request.action_type,
        '30d'
      );
      lastAttemptAt = dbHistory.last_attempt_at;
    }
    
    if (!lastAttemptAt) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    
    const coolingMs = this.parseTimeInterval(cooling_period);
    const lastAttemptTime = new Date(lastAttemptAt).getTime();
    const currentTime = new Date(request.timestamp || Date.now()).getTime();
    const coolingEndTime = lastAttemptTime + coolingMs;
    
    if (currentTime < coolingEndTime) {
      return {
        passed: false,
        reason_code: REASON_CODES.COOLING_PERIOD_ACTIVE,
        reason_details: [
          `Cooling period of ${cooling_period} is still active`,
          `Last attempt: ${new Date(lastAttemptAt).toISOString()}`,
          `Can retry after: ${new Date(coolingEndTime).toISOString()}`
        ],
        cooling_period_until: new Date(coolingEndTime).toISOString()
      };
    }
    
    return { passed: true, reason_code: null, reason_details: [] };
  }

  /**
   * Evaluate consent requirement rule
   */
  evaluateConsentRule(rule, request) {
    const { required_consent_types, channels_requiring_consent } = rule;
    
    if (channels_requiring_consent && !channels_requiring_consent.includes(request.channel)) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    
    const consentStatus = request.consent_status;
    
    if (!consentStatus || consentStatus === 'NOT_GIVEN' || consentStatus === 'WITHDRAWN') {
      return {
        passed: false,
        reason_code: REASON_CODES.CONSENT_REQUIRED,
        reason_details: [
          `Channel ${request.channel} requires consent for ${request.action_type}`,
          `Current consent status: ${consentStatus || 'unknown'}`,
          `Required consent types: ${required_consent_types?.join(', ') || 'any'}`
        ],
        required_evidence: ['consent_document', 'consent_timestamp']
      };
    }
    
    if (required_consent_types && required_consent_types.length > 0) {
      const consentType = request.additional_context?.consent_type;
      if (!consentType || !required_consent_types.includes(consentType)) {
        return {
          passed: false,
          reason_code: REASON_CODES.CONSENT_REQUIRED,
          reason_details: [
            `Specific consent type required: ${required_consent_types.join(' or ')}`,
            `Current consent type: ${consentType || 'none'}`
          ],
          required_evidence: ['consent_document', 'consent_type_verification']
        };
      }
    }
    
    return { passed: true, reason_code: null, reason_details: [] };
  }

  /**
   * Evaluate channel restriction rule
   */
  evaluateChannelRestrictionRule(rule, request) {
    const { blocked_channels, allowed_channels, blocked_action_types } = rule;
    
    if (blocked_channels && blocked_channels.includes(request.channel)) {
      return {
        passed: false,
        reason_code: REASON_CODES.CHANNEL_BLOCKED,
        reason_details: [
          `Channel ${request.channel} is blocked for this customer type`,
          `Blocked channels: ${blocked_channels.join(', ')}`
        ]
      };
    }
    
    if (allowed_channels && !allowed_channels.includes(request.channel)) {
      return {
        passed: false,
        reason_code: REASON_CODES.CHANNEL_BLOCKED,
        reason_details: [
          `Channel ${request.channel} is not in the allowed list`,
          `Allowed channels: ${allowed_channels.join(', ')}`
        ]
      };
    }
    
    if (blocked_action_types && blocked_action_types.includes(request.action_type)) {
      return {
        passed: false,
        reason_code: REASON_CODES.CHANNEL_BLOCKED,
        reason_details: [
          `Action type ${request.action_type} is blocked`,
          `Blocked action types: ${blocked_action_types.join(', ')}`
        ]
      };
    }
    
    return { passed: true, reason_code: null, reason_details: [] };
  }

  /**
   * Evaluate bucket-specific rule
   */
  evaluateBucketRule(rule, request) {
    const { bucket_restrictions } = rule;
    
    if (!request.bucket) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    
    const bucketRule = bucket_restrictions?.[request.bucket];
    if (!bucketRule) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    
    if (bucketRule.allowed_actions && !bucketRule.allowed_actions.includes(request.action_type)) {
      return {
        passed: false,
        reason_code: REASON_CODES.BUCKET_RESTRICTED,
        reason_details: [
          `Action ${request.action_type} is not allowed for bucket ${request.bucket}`,
          `Allowed actions: ${bucketRule.allowed_actions.join(', ')}`
        ]
      };
    }
    
    if (bucketRule.blocked === true) {
      return {
        passed: false,
        reason_code: REASON_CODES.BUCKET_RESTRICTED,
        reason_details: [
          `All contact is blocked for bucket ${request.bucket}`,
          bucketRule.reason || 'No reason provided'
        ]
      };
    }
    
    return { passed: true, reason_code: null, reason_details: [] };
  }

  // =====================================================
  // Helper Methods
  // =====================================================

  /**
   * Get contact history from database
   */
  async getContactHistory(tenantId, customerId, actionType, window) {
    try {
      const windowInterval = this.parseTimeIntervalForPostgres(window);
      
      const { data, error } = await supabase.rpc('pdp_count_contact_attempts', {
        p_tenant_id: tenantId,
        p_customer_id: customerId,
        p_action_type: actionType,
        p_window_interval: windowInterval
      });
      
      if (error) {
        return { attempts: 0, last_attempt_at: null };
      }
      
      return {
        attempts: data?.[0]?.attempt_count || 0,
        last_attempt_at: data?.[0]?.last_attempt_at || null
      };
      
    } catch (error) {
      return { attempts: 0, last_attempt_at: null };
    }
  }

  /**
   * Parse time interval string to milliseconds
   */
  parseTimeInterval(interval) {
    const match = interval.match(/^(\d+)(h|d|w|m)$/);
    if (!match) {
      throw new Error(`Invalid time interval: ${interval}`);
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const msMultipliers = {
      'h': 60 * 60 * 1000,
      'd': 24 * 60 * 60 * 1000,
      'w': 7 * 24 * 60 * 60 * 1000,
      'm': 30 * 24 * 60 * 60 * 1000
    };
    
    return value * msMultipliers[unit];
  }

  /**
   * Parse time interval for PostgreSQL
   */
  parseTimeIntervalForPostgres(interval) {
    const match = interval.match(/^(\d+)(h|d|w|m)$/);
    if (!match) {
      return '7 days';
    }
    
    const value = parseInt(match[1]);
    const unit = match[2];
    
    const pgUnits = {
      'h': 'hours',
      'd': 'days',
      'w': 'weeks',
      'm': 'months'
    };
    
    return `${value} ${pgUnits[unit]}`;
  }

  /**
   * Create a standardized response object
   */
  createResponse({
    decision,
    reason_code,
    reason_details,
    policy_profile_id,
    policy_version_id,
    required_evidence = [],
    cooling_period_until = null,
    max_attempts = null,
    window = null
  }) {
    return {
      decision,
      reason_code,
      reason_details,
      policy_profile_id,
      policy_version_id,
      required_evidence,
      cooling_period_until,
      max_attempts,
      window
    };
  }

  /**
   * Log the decision to the audit trail
   */
  async logDecision(request, response, rulesEvaluated, evaluationTimeMs) {
    try {
      const { error } = await supabase
        .from(PDP_TABLES.DECISION_LOG)
        .insert({
          tenant_id: request.tenant_id,
          customer_type: request.customer_type,
          secured_flag: request.secured_flag,
          action_type: request.action_type,
          channel: request.channel,
          customer_id: request.customer_id,
          contract_id: request.contract_id,
          portfolio_id: request.portfolio_id,
          bucket: request.bucket,
          consent_status: request.consent_status,
          request_timestamp: request.timestamp || new Date().toISOString(),
          contact_history: request.contact_history,
          additional_context: request.additional_context,
          decision: response.decision,
          reason_code: response.reason_code,
          reason_details: response.reason_details,
          policy_profile_id: response.policy_profile_id,
          policy_version_id: response.policy_version_id,
          required_evidence: response.required_evidence,
          cooling_period_until: response.cooling_period_until,
          max_attempts: response.max_attempts,
          time_window: response.window,
          rules_evaluated: rulesEvaluated,
          evaluation_time_ms: evaluationTimeMs
        });
      
      if (error) {
      }
    } catch (error) {
    }
  }

  /**
   * Create lineage trace for decision (EPIC 4)
   */
  async createDecisionTrace(request, response, rulesEvaluated, evaluationTimeMs) {
    if (!LineageService) return;
    
    try {
      await LineageService.createTrace({
        tenantId: request.tenant_id,
        traceType: TRACE_TYPES.POLICY,
        traceRefId: response.policy_profile_id,
        input: {
          customer_type: request.customer_type,
          action_type: request.action_type,
          channel: request.channel,
          customer_id: request.customer_id,
          bucket: request.bucket
        },
        output: {
          decision: response.decision,
          reason_code: response.reason_code,
          reason_details: response.reason_details
        },
        decisionResult: response.decision,
        explanation: response.reason_details?.join('; ') || response.reason_code,
        factors: rulesEvaluated.map(r => ({
          name: r.rule_type,
          passed: r.result.passed,
          reason: r.result.reason_code
        })),
        actorSystem: 'PDP',
        metadata: {
          evaluation_time_ms: evaluationTimeMs,
          rules_count: rulesEvaluated.length
        },
        entityLinks: [
          {
            entityType: 'CUSTOMER',
            entityId: request.customer_id,
            linkType: LINK_TYPES.AFFECTS
          }
        ]
      });
    } catch (error) {
    }
  }

  /**
   * Record a contact attempt (for updating attempt cache)
   */
  async recordContactAttempt(tenantId, customerId, actionType, channel, outcome, metadata = {}) {
    try {
      const { error } = await supabase
        .from(PDP_TABLES.CONTACT_ATTEMPT_CACHE)
        .insert({
          tenant_id: tenantId,
          customer_id: customerId,
          action_type: actionType,
          channel,
          outcome,
          metadata,
          attempt_timestamp: new Date().toISOString()
        });
      
      if (error) {
      }
    } catch (error) {
    }
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const pdpService = new PDPService();

// =====================================================
// Helper Functions for External Use
// =====================================================

/**
 * Quick decision check - simplified API (EPIC 3 style)
 */
export async function checkPolicyDecision(request) {
  return pdpService.evaluateDecision(request);
}

/**
 * Generic policy evaluation (EPIC 4 style)
 */
export async function evaluatePolicy(request) {
  return PDPService.evaluatePolicy(request);
}

/**
 * Record a contact attempt after execution
 */
export async function recordAttempt(tenantId, customerId, actionType, channel, outcome) {
  return pdpService.recordContactAttempt(tenantId, customerId, actionType, channel, outcome);
}

export default pdpService;
