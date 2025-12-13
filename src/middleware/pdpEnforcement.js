/**
 * =====================================================
 * EPIC 3: PDP Enforcement Middleware (PEP Pattern)
 * =====================================================
 * 
 * This middleware implements the Policy Enforcement Point (PEP) pattern.
 * It intercepts action requests and enforces PDP decisions before execution.
 * 
 * Usage:
 * const enforcer = createPDPEnforcer({
 *   actionType: 'CALL',
 *   contextBuilder: (req) => ({ customer_id: req.body.customer_id, ... })
 * });
 * 
 * Decision Handling:
 * - ALLOW -> proceed with the action
 * - BLOCK -> return 403 Forbidden with reason
 * - APPROVAL_REQUIRED -> create workflow approval, return 202 Accepted
 */

import { pdpService, DECISIONS } from '@/services/pdpService';
import { supabasePolicy, PDP_TABLES } from '@/lib/supabasePolicy';

// =====================================================
// Workflow Approval Creator
// =====================================================

/**
 * Creates a workflow approval record for actions requiring approval
 * @param {Object} params - Approval parameters
 * @returns {Object} - Created approval record
 */
async function createActionApproval({
  tenantId,
  entityType,
  entityId,
  actionType,
  channel,
  customerId,
  contractId,
  requesterId,
  pdpDecision,
  requestContext
}) {
  try {
    const { data, error } = await supabasePolicy
      .from(PDP_TABLES.WORKFLOW_APPROVALS)
      .insert({
        tenant_id: tenantId,
        entity_type: entityType || 'CONTACT_ACTION',
        entity_id: entityId || `${actionType}-${customerId}-${Date.now()}`,
        workflow_status: 'PENDING',
        maker_id: requesterId,
        maker_comments: `Action ${actionType} requires approval: ${pdpDecision.reason_code}`,
        made_at: new Date().toISOString(),
        required_approvals: 1,
        current_approvals: 0,
        metadata: {
          action_type: actionType,
          channel: channel,
          customer_id: customerId,
          contract_id: contractId,
          pdp_decision: {
            reason_code: pdpDecision.reason_code,
            reason_details: pdpDecision.reason_details,
            policy_profile_id: pdpDecision.policy_profile_id,
            policy_version_id: pdpDecision.policy_version_id,
            required_evidence: pdpDecision.required_evidence
          },
          request_context: requestContext
        }
      })
      .select()
      .single();
    
    if (error) throw error;
    
    return { success: true, data };
  } catch (error) {
    console.error('Error creating action approval:', error);
    return { success: false, error: error.message };
  }
}

// =====================================================
// PDP Enforcer Factory
// =====================================================

/**
 * Creates a PDP enforcement middleware
 * @param {Object} config - Configuration options
 * @param {string} config.actionType - The action type (CALL, SMS, EMAIL, etc.)
 * @param {Function} config.contextBuilder - Function to build PDP context from request
 * @param {Function} [config.onAllow] - Optional callback when action is allowed
 * @param {Function} [config.onBlock] - Optional callback when action is blocked
 * @param {Function} [config.onApprovalRequired] - Optional callback when approval is required
 * @returns {Function} - Middleware function
 */
export function createPDPEnforcer(config) {
  const {
    actionType,
    contextBuilder,
    onAllow,
    onBlock,
    onApprovalRequired
  } = config;
  
  /**
   * The enforcement middleware function
   * @param {Object} request - The incoming request
   * @param {Object} options - Additional options
   * @returns {Object} - The enforcement result
   */
  return async function pdpEnforcer(request, options = {}) {
    const { skipEnforcement = false, requesterId } = options;
    
    // Allow bypassing enforcement for testing/admin
    if (skipEnforcement) {
      return {
        enforced: false,
        decision: DECISIONS.ALLOW,
        proceed: true,
        response: null
      };
    }
    
    try {
      // Build the PDP context from the request
      const context = await contextBuilder(request);
      
      // Construct the full PDP request
      const pdpRequest = {
        tenant_id: context.tenant_id || request.tenant_id,
        customer_type: context.customer_type || 'RETAIL',
        secured_flag: context.secured_flag,
        action_type: actionType,
        channel: context.channel || actionType,
        customer_id: context.customer_id,
        contract_id: context.contract_id,
        portfolio_id: context.portfolio_id,
        bucket: context.bucket,
        timestamp: context.timestamp || new Date().toISOString(),
        consent_status: context.consent_status,
        contact_history: context.contact_history,
        additional_context: context.additional_context || {}
      };
      
      // Call PDP service
      const pdpDecision = await pdpService.evaluateDecision(pdpRequest);
      
      // Handle decision
      switch (pdpDecision.decision) {
        case DECISIONS.ALLOW:
          // Action is allowed - proceed
          if (onAllow) {
            await onAllow(pdpDecision, request);
          }
          
          return {
            enforced: true,
            decision: DECISIONS.ALLOW,
            proceed: true,
            pdpDecision,
            response: null
          };
        
        case DECISIONS.BLOCK:
          // Action is blocked - return 403
          if (onBlock) {
            await onBlock(pdpDecision, request);
          }
          
          return {
            enforced: true,
            decision: DECISIONS.BLOCK,
            proceed: false,
            pdpDecision,
            response: {
              success: false,
              status: 403,
              error: 'Action blocked by policy',
              reason_code: pdpDecision.reason_code,
              reason_details: pdpDecision.reason_details,
              policy_profile_id: pdpDecision.policy_profile_id,
              policy_version_id: pdpDecision.policy_version_id,
              cooling_period_until: pdpDecision.cooling_period_until
            }
          };
        
        case DECISIONS.APPROVAL_REQUIRED:
          // Action requires approval - create workflow and return 202
          const approvalResult = await createActionApproval({
            tenantId: pdpRequest.tenant_id,
            entityType: 'CONTACT_ACTION',
            entityId: `${actionType}-${pdpRequest.customer_id}-${Date.now()}`,
            actionType: actionType,
            channel: pdpRequest.channel,
            customerId: pdpRequest.customer_id,
            contractId: pdpRequest.contract_id,
            requesterId: requesterId || 'system',
            pdpDecision,
            requestContext: {
              original_request: request,
              pdp_request: pdpRequest
            }
          });
          
          if (onApprovalRequired) {
            await onApprovalRequired(pdpDecision, approvalResult, request);
          }
          
          return {
            enforced: true,
            decision: DECISIONS.APPROVAL_REQUIRED,
            proceed: false,
            pdpDecision,
            approval: approvalResult.data,
            response: {
              success: true,
              status: 202,
              message: 'Action requires approval',
              approval_id: approvalResult.data?.id,
              reason_code: pdpDecision.reason_code,
              reason_details: pdpDecision.reason_details,
              required_evidence: pdpDecision.required_evidence,
              policy_profile_id: pdpDecision.policy_profile_id,
              policy_version_id: pdpDecision.policy_version_id
            }
          };
        
        default:
          // Unknown decision - block for safety
          return {
            enforced: true,
            decision: DECISIONS.BLOCK,
            proceed: false,
            pdpDecision,
            response: {
              success: false,
              status: 500,
              error: 'Unknown PDP decision',
              reason_code: 'UNKNOWN_DECISION'
            }
          };
      }
      
    } catch (error) {
      console.error('PDP enforcement error:', error);
      
      // On error, block for safety (fail-closed)
      return {
        enforced: true,
        decision: DECISIONS.BLOCK,
        proceed: false,
        error: error.message,
        response: {
          success: false,
          status: 500,
          error: 'Policy enforcement error',
          reason_code: 'ENFORCEMENT_ERROR',
          reason_details: [error.message]
        }
      };
    }
  };
}

// =====================================================
// Pre-built Enforcers for Common Action Types
// =====================================================

/**
 * Contact action enforcer for CALL actions
 */
export const callActionEnforcer = createPDPEnforcer({
  actionType: 'CALL',
  contextBuilder: (req) => ({
    tenant_id: req.tenant_id,
    customer_type: req.customer_type || 'RETAIL',
    customer_id: req.customer_id,
    contract_id: req.contract_id,
    channel: 'CALL',
    consent_status: req.consent_status,
    bucket: req.bucket,
    contact_history: req.contact_history
  })
});

/**
 * Contact action enforcer for SMS actions
 */
export const smsActionEnforcer = createPDPEnforcer({
  actionType: 'SMS',
  contextBuilder: (req) => ({
    tenant_id: req.tenant_id,
    customer_type: req.customer_type || 'RETAIL',
    customer_id: req.customer_id,
    contract_id: req.contract_id,
    channel: 'SMS',
    consent_status: req.consent_status,
    bucket: req.bucket,
    contact_history: req.contact_history
  })
});

/**
 * Contact action enforcer for EMAIL actions
 */
export const emailActionEnforcer = createPDPEnforcer({
  actionType: 'EMAIL',
  contextBuilder: (req) => ({
    tenant_id: req.tenant_id,
    customer_type: req.customer_type || 'RETAIL',
    customer_id: req.customer_id,
    contract_id: req.contract_id,
    channel: 'EMAIL',
    consent_status: req.consent_status,
    bucket: req.bucket,
    contact_history: req.contact_history
  })
});

/**
 * Contact action enforcer for WHATSAPP actions
 */
export const whatsappActionEnforcer = createPDPEnforcer({
  actionType: 'WHATSAPP',
  contextBuilder: (req) => ({
    tenant_id: req.tenant_id,
    customer_type: req.customer_type || 'RETAIL',
    customer_id: req.customer_id,
    contract_id: req.contract_id,
    channel: 'WHATSAPP',
    consent_status: req.consent_status,
    bucket: req.bucket,
    contact_history: req.contact_history
  })
});

/**
 * Contact action enforcer for IVR actions
 */
export const ivrActionEnforcer = createPDPEnforcer({
  actionType: 'IVR',
  contextBuilder: (req) => ({
    tenant_id: req.tenant_id,
    customer_type: req.customer_type || 'RETAIL',
    customer_id: req.customer_id,
    contract_id: req.contract_id,
    channel: 'IVR',
    consent_status: req.consent_status,
    bucket: req.bucket,
    contact_history: req.contact_history
  })
});

// =====================================================
// Generic Contact Enforcer (uses action_type from request)
// =====================================================

/**
 * Generic contact enforcer that uses action_type from the request
 */
export const genericContactEnforcer = createPDPEnforcer({
  actionType: 'CONTACT', // Will be overridden by context
  contextBuilder: (req) => ({
    tenant_id: req.tenant_id,
    customer_type: req.customer_type || 'RETAIL',
    customer_id: req.customer_id,
    contract_id: req.contract_id,
    channel: req.channel || req.action_type,
    consent_status: req.consent_status,
    bucket: req.bucket,
    contact_history: req.contact_history,
    additional_context: req.additional_context
  })
});

// Override for generic enforcer to use request's action_type
export async function enforceContactAction(request, options = {}) {
  const enforcer = createPDPEnforcer({
    actionType: request.action_type || 'CONTACT',
    contextBuilder: (req) => ({
      tenant_id: req.tenant_id,
      customer_type: req.customer_type || 'RETAIL',
      customer_id: req.customer_id,
      contract_id: req.contract_id,
      channel: req.channel || req.action_type,
      consent_status: req.consent_status,
      bucket: req.bucket,
      contact_history: req.contact_history,
      additional_context: req.additional_context
    })
  });
  
  return enforcer(request, options);
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Check if an approval is still pending
 */
export async function checkApprovalStatus(approvalId) {
  try {
    const { data, error } = await supabasePolicy
      .from(PDP_TABLES.WORKFLOW_APPROVALS)
      .select('*')
      .eq('id', approvalId)
      .single();
    
    if (error) throw error;
    
    return {
      success: true,
      data: {
        id: data.id,
        status: data.workflow_status,
        is_approved: data.workflow_status === 'APPROVED',
        is_pending: data.workflow_status === 'PENDING',
        is_rejected: data.workflow_status === 'REJECTED',
        approved_by: data.checker_id,
        approved_at: data.checked_at,
        metadata: data.metadata
      }
    };
  } catch (error) {
    console.error('Error checking approval status:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Execute an approved action
 * @param {string} approvalId - The approval ID
 * @param {Function} actionExecutor - Function to execute the action
 */
export async function executeApprovedAction(approvalId, actionExecutor) {
  // Check approval status
  const statusResult = await checkApprovalStatus(approvalId);
  
  if (!statusResult.success) {
    return {
      success: false,
      status: 500,
      error: 'Failed to check approval status'
    };
  }
  
  if (!statusResult.data.is_approved) {
    return {
      success: false,
      status: 403,
      error: `Action cannot proceed. Approval status: ${statusResult.data.status}`
    };
  }
  
  // Execute the action
  try {
    const result = await actionExecutor(statusResult.data.metadata);
    
    // Record the execution in the approval metadata
    await supabasePolicy
      .from(PDP_TABLES.WORKFLOW_APPROVALS)
      .update({
        metadata: {
          ...statusResult.data.metadata,
          execution: {
            executed_at: new Date().toISOString(),
            result: result
          }
        }
      })
      .eq('id', approvalId);
    
    return {
      success: true,
      status: 200,
      data: result
    };
  } catch (error) {
    console.error('Error executing approved action:', error);
    return {
      success: false,
      status: 500,
      error: error.message
    };
  }
}

// =====================================================
// Export
// =====================================================

export default {
  createPDPEnforcer,
  enforceContactAction,
  checkApprovalStatus,
  executeApprovedAction,
  // Pre-built enforcers
  callActionEnforcer,
  smsActionEnforcer,
  emailActionEnforcer,
  whatsappActionEnforcer,
  ivrActionEnforcer,
  genericContactEnforcer
};
