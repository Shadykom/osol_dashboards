/**
 * =====================================================
 * EPIC 3: Policy Decision Point (PDP) Service
 * =====================================================
 * 
 * This service implements the regulatory policy engine that evaluates
 * collection contact rules and returns decisions (ALLOW/BLOCK/APPROVAL_REQUIRED).
 * 
 * Key Features:
 * - Policy lookup by tenant/customer type/secured flag
 * - Rule evaluation engine with support for multiple rule types
 * - Explainable decisions with reason codes and details
 * - Audit logging for compliance
 * - Tenant isolation via RLS
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// Constants and Rule Types
// =====================================================

export const DECISIONS = {
  ALLOW: 'ALLOW',
  BLOCK: 'BLOCK',
  APPROVAL_REQUIRED: 'APPROVAL_REQUIRED'
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

// =====================================================
// PDP Service Class
// =====================================================

export class PDPService {
  constructor() {
    this.defaultTenantId = '00000000-0000-0000-0000-000000000000';
  }

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
      
      // Emit to audit hook if configured
      await this.emitAuditEvent(request, response, rulesEvaluated);
      
      return response;
      
    } catch (error) {
      console.error('PDP evaluation error:', error);
      
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
      // First try to get policy with exact secured_flag match
      let query = supabase
        .from('policy_profiles')
        .select(`
          id,
          name,
          customer_type,
          secured_flag,
          priority,
          policy_versions!inner (
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
        .eq('policy_versions.status', 'PUBLISHED')
        .order('priority', { ascending: true })
        .limit(1);
      
      // Handle secured_flag matching
      if (securedFlag !== null && securedFlag !== undefined) {
        query = query.or(`secured_flag.is.null,secured_flag.eq.${securedFlag}`);
      }
      
      const { data, error } = await query;
      
      if (error) {
        console.error('Error fetching policy:', error);
        return null;
      }
      
      if (!data || data.length === 0) {
        return null;
      }
      
      const profile = data[0];
      const version = profile.policy_versions[0];
      
      // Check effective dates
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
      console.error('Error in getActivePolicy:', error);
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
        console.warn(`Unknown rule type: ${rule.type}`);
        return { passed: true, reason_code: null, reason_details: [] };
    }
  }

  /**
   * Evaluate max attempts per window rule
   */
  async evaluateMaxAttemptsRule(rule, request, contactHistory) {
    const { max_attempts, window, action_types, channels } = rule;
    
    // Check if this rule applies to the current action/channel
    if (action_types && !action_types.includes(request.action_type)) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    if (channels && !channels.includes(request.channel)) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    
    // Get attempts from contact history or database
    let attempts = 0;
    let lastAttemptAt = null;
    
    if (contactHistory) {
      // Use provided contact history
      attempts = contactHistory.attempts || 0;
      lastAttemptAt = contactHistory.last_attempt_at;
      
      // Validate window matches
      if (contactHistory.window !== window) {
        // Fetch from database if window doesn't match
        const dbHistory = await this.getContactHistory(
          request.tenant_id, 
          request.customer_id, 
          request.action_type, 
          window
        );
        attempts = dbHistory.attempts;
        lastAttemptAt = dbHistory.last_attempt_at;
      }
    } else {
      // Fetch from database
      const dbHistory = await this.getContactHistory(
        request.tenant_id, 
        request.customer_id, 
        request.action_type, 
        window
      );
      attempts = dbHistory.attempts;
      lastAttemptAt = dbHistory.last_attempt_at;
    }
    
    // Check if limit exceeded
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
    
    // Check if approaching limit (80% threshold for warning)
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
    const { allowed_windows, timezone = 'UTC' } = rule;
    
    // Get current time in the specified timezone
    const requestTime = request.timestamp 
      ? new Date(request.timestamp) 
      : new Date();
    
    const currentHour = requestTime.getHours();
    const currentMinute = requestTime.getMinutes();
    const currentDay = requestTime.getDay(); // 0 = Sunday
    
    // Check if current time falls within any allowed window
    for (const window of allowed_windows) {
      // Check day of week if specified
      if (window.days && !window.days.includes(currentDay)) {
        continue;
      }
      
      // Parse time range
      const [startHour, startMin] = window.start_time.split(':').map(Number);
      const [endHour, endMin] = window.end_time.split(':').map(Number);
      
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const startTimeInMinutes = startHour * 60 + startMin;
      const endTimeInMinutes = endHour * 60 + endMin;
      
      // Check if current time is within window
      if (currentTimeInMinutes >= startTimeInMinutes && 
          currentTimeInMinutes <= endTimeInMinutes) {
        return { passed: true, reason_code: null, reason_details: [] };
      }
    }
    
    // Time is outside allowed windows
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
    const { cooling_period, trigger_condition } = rule;
    
    // Get last contact attempt
    let lastAttemptAt = contactHistory?.last_attempt_at;
    
    if (!lastAttemptAt) {
      const dbHistory = await this.getContactHistory(
        request.tenant_id,
        request.customer_id,
        request.action_type,
        '30d'  // Look back 30 days for last attempt
      );
      lastAttemptAt = dbHistory.last_attempt_at;
    }
    
    if (!lastAttemptAt) {
      // No previous attempts, cooling period doesn't apply
      return { passed: true, reason_code: null, reason_details: [] };
    }
    
    // Parse cooling period (e.g., "24h", "2d", "48h")
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
    
    // Check if channel requires consent
    if (channels_requiring_consent && !channels_requiring_consent.includes(request.channel)) {
      return { passed: true, reason_code: null, reason_details: [] };
    }
    
    // Check consent status
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
    
    // Check if specific consent type is required
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
    
    // Check blocked channels
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
    
    // Check allowed channels (whitelist mode)
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
    
    // Check blocked action types
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
    
    // Check if action is allowed for this bucket
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
    
    // Check if bucket is completely blocked
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

  /**
   * Get contact history from database
   */
  async getContactHistory(tenantId, customerId, actionType, window) {
    try {
      const windowInterval = this.parseTimeIntervalForPostgres(window);
      
      const { data, error } = await supabase.rpc('count_contact_attempts', {
        p_tenant_id: tenantId,
        p_customer_id: customerId,
        p_action_type: actionType,
        p_window_interval: windowInterval
      });
      
      if (error) {
        console.error('Error fetching contact history:', error);
        return { attempts: 0, last_attempt_at: null };
      }
      
      return {
        attempts: data?.[0]?.attempt_count || 0,
        last_attempt_at: data?.[0]?.last_attempt_at || null
      };
      
    } catch (error) {
      console.error('Error in getContactHistory:', error);
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
      'h': 60 * 60 * 1000,        // hours
      'd': 24 * 60 * 60 * 1000,   // days
      'w': 7 * 24 * 60 * 60 * 1000,  // weeks
      'm': 30 * 24 * 60 * 60 * 1000  // months (approx)
    };
    
    return value * msMultipliers[unit];
  }

  /**
   * Parse time interval for PostgreSQL
   */
  parseTimeIntervalForPostgres(interval) {
    const match = interval.match(/^(\d+)(h|d|w|m)$/);
    if (!match) {
      return '7 days';  // default
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
        .from('pdp_decision_log')
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
        console.error('Error logging PDP decision:', error);
      }
    } catch (error) {
      console.error('Error in logDecision:', error);
    }
  }

  /**
   * Emit audit event to external hook (if configured)
   */
  async emitAuditEvent(request, response, rulesEvaluated) {
    // This can be extended to emit to:
    // - Webhook endpoints
    // - Message queues (Kafka, RabbitMQ)
    // - Event bus
    // - External audit systems
    
    const auditEvent = {
      event_type: 'PDP_DECISION',
      timestamp: new Date().toISOString(),
      tenant_id: request.tenant_id,
      request: {
        customer_id: request.customer_id,
        action_type: request.action_type,
        channel: request.channel,
        customer_type: request.customer_type
      },
      response: {
        decision: response.decision,
        reason_code: response.reason_code
      },
      rules_count: rulesEvaluated.length,
      rules_passed: rulesEvaluated.filter(r => r.result.passed).length
    };
    
    // Log to console for now (can be replaced with actual emission)
    if (process.env.NODE_ENV === 'development') {
      console.log('PDP Audit Event:', JSON.stringify(auditEvent, null, 2));
    }
    
    // TODO: Emit to configured webhook/event system
    // await this.emitToWebhook(auditEvent);
    
    return auditEvent;
  }

  /**
   * Record a contact attempt (for updating attempt cache)
   */
  async recordContactAttempt(tenantId, customerId, actionType, channel, outcome, metadata = {}) {
    try {
      const { error } = await supabase
        .from('contact_attempt_cache')
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
        console.error('Error recording contact attempt:', error);
      }
    } catch (error) {
      console.error('Error in recordContactAttempt:', error);
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
 * Quick decision check - simplified API
 */
export async function checkPolicyDecision(request) {
  return pdpService.evaluateDecision(request);
}

/**
 * Record a contact attempt after execution
 */
export async function recordAttempt(tenantId, customerId, actionType, channel, outcome) {
  return pdpService.recordContactAttempt(tenantId, customerId, actionType, channel, outcome);
}

export default pdpService;
