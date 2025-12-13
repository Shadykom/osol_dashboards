/**
 * =====================================================
 * EPIC 3: Actions API with PDP Enforcement
 * =====================================================
 * 
 * This module implements action endpoints that are protected by PDP enforcement.
 * All action endpoints call PDP before execution to ensure regulatory compliance.
 * 
 * Endpoints:
 * - POST /actions/contact - Initiate a customer contact action
 * - POST /actions/contact/execute - Execute an approved contact action
 * - GET /actions/approvals - Get pending action approvals
 * - POST /actions/approvals/:id/approve - Approve a pending action
 * - POST /actions/approvals/:id/reject - Reject a pending action
 * 
 * PDP Decision Handling:
 * - ALLOW -> Execute action and return 200
 * - BLOCK -> Return 403 Forbidden with reason
 * - APPROVAL_REQUIRED -> Create approval workflow, return 202 Accepted
 */

import { 
  enforceContactAction, 
  checkApprovalStatus,
  executeApprovedAction,
  createPDPEnforcer
} from '@/middleware/pdpEnforcement';
import { pdpService } from '@/services/pdpService';
import { supabase } from '@/lib/supabase';

// =====================================================
// Contact Action Endpoint
// =====================================================

/**
 * POST /actions/contact
 * Initiate a customer contact action with PDP enforcement
 * 
 * Request Body:
 * {
 *   tenant_id: string,
 *   customer_id: string,
 *   contract_id?: string,
 *   channel: string (CALL|SMS|EMAIL|WHATSAPP|IVR),
 *   action_type: string,
 *   customer_type?: string (RETAIL|SME|CORP),
 *   consent_status?: string,
 *   bucket?: string,
 *   contact_history?: { window: string, attempts: number, last_attempt_at: string },
 *   requester_id?: string,
 *   message?: string,
 *   metadata?: object
 * }
 * 
 * Responses:
 * - 200: Action allowed and executed (placeholder)
 * - 202: Action requires approval (approval_id returned)
 * - 403: Action blocked by policy
 * - 400: Invalid request
 * - 500: Server error
 */
export async function initiateContactAction(request) {
  try {
    // Validate required fields
    const { tenant_id, customer_id, channel, action_type } = request;
    
    if (!tenant_id) {
      return {
        success: false,
        status: 400,
        error: 'tenant_id is required'
      };
    }
    
    if (!customer_id) {
      return {
        success: false,
        status: 400,
        error: 'customer_id is required'
      };
    }
    
    if (!channel && !action_type) {
      return {
        success: false,
        status: 400,
        error: 'channel or action_type is required'
      };
    }
    
    // Normalize action_type
    const normalizedRequest = {
      ...request,
      action_type: action_type || channel,
      channel: channel || action_type
    };
    
    // Enforce PDP decision
    const enforcement = await enforceContactAction(normalizedRequest, {
      requesterId: request.requester_id || 'system'
    });
    
    // If not allowed to proceed, return the enforcement response
    if (!enforcement.proceed) {
      return enforcement.response;
    }
    
    // Action is ALLOWED - execute (placeholder for now)
    // In a real implementation, this would:
    // - Queue the contact action (call, SMS, email, etc.)
    // - Record the attempt in contact_attempt_cache
    // - Trigger the actual communication channel
    
    const actionResult = await executeContactActionPlaceholder(normalizedRequest);
    
    // Record the contact attempt
    await pdpService.recordContactAttempt(
      normalizedRequest.tenant_id,
      normalizedRequest.customer_id,
      normalizedRequest.action_type,
      normalizedRequest.channel,
      'INITIATED',
      {
        message: normalizedRequest.message,
        metadata: normalizedRequest.metadata,
        contract_id: normalizedRequest.contract_id,
        requester_id: normalizedRequest.requester_id
      }
    );
    
    return {
      success: true,
      status: 200,
      data: {
        action_id: actionResult.action_id,
        action_type: normalizedRequest.action_type,
        channel: normalizedRequest.channel,
        customer_id: normalizedRequest.customer_id,
        contract_id: normalizedRequest.contract_id,
        status: 'INITIATED',
        message: 'Contact action initiated successfully',
        pdp_decision: {
          decision: enforcement.pdpDecision.decision,
          policy_profile_id: enforcement.pdpDecision.policy_profile_id,
          policy_version_id: enforcement.pdpDecision.policy_version_id
        },
        initiated_at: new Date().toISOString()
      }
    };
    
  } catch (error) {
    console.error('Initiate contact action error:', error);
    return {
      success: false,
      status: 500,
      error: error.message || 'An error occurred initiating the contact action'
    };
  }
}

/**
 * Placeholder function for executing contact action
 * In production, this would integrate with actual communication channels
 */
async function executeContactActionPlaceholder(request) {
  // Generate a unique action ID
  const actionId = `ACT-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // Log the action (placeholder)
  console.log(`[PLACEHOLDER] Contact Action Initiated:`, {
    action_id: actionId,
    action_type: request.action_type,
    channel: request.channel,
    customer_id: request.customer_id,
    contract_id: request.contract_id,
    message: request.message ? '[MESSAGE_CONTENT]' : null
  });
  
  // In production, this would:
  // - For CALL: Queue call to dialer system
  // - For SMS: Send to SMS gateway
  // - For EMAIL: Queue email to email service
  // - For WHATSAPP: Send to WhatsApp Business API
  // - For IVR: Queue to IVR system
  
  return {
    action_id: actionId,
    status: 'QUEUED'
  };
}

// =====================================================
// Execute Approved Action Endpoint
// =====================================================

/**
 * POST /actions/contact/execute
 * Execute a previously approved contact action
 * 
 * Request Body:
 * {
 *   approval_id: string
 * }
 */
export async function executeApprovedContactAction(request) {
  try {
    const { approval_id } = request;
    
    if (!approval_id) {
      return {
        success: false,
        status: 400,
        error: 'approval_id is required'
      };
    }
    
    const result = await executeApprovedAction(approval_id, async (metadata) => {
      // Extract original request from approval metadata
      const originalRequest = metadata?.request_context?.original_request;
      
      if (!originalRequest) {
        throw new Error('Original request not found in approval metadata');
      }
      
      // Execute the action
      const actionResult = await executeContactActionPlaceholder(originalRequest);
      
      // Record the contact attempt
      await pdpService.recordContactAttempt(
        originalRequest.tenant_id,
        originalRequest.customer_id,
        originalRequest.action_type,
        originalRequest.channel,
        'INITIATED_AFTER_APPROVAL',
        {
          approval_id: approval_id,
          metadata: originalRequest.metadata
        }
      );
      
      return actionResult;
    });
    
    return result;
    
  } catch (error) {
    console.error('Execute approved action error:', error);
    return {
      success: false,
      status: 500,
      error: error.message
    };
  }
}

// =====================================================
// Approval Management Endpoints
// =====================================================

/**
 * GET /actions/approvals
 * Get pending action approvals for a tenant
 */
export async function getPendingActionApprovals(params) {
  try {
    const { tenant_id, status = 'PENDING', page = 1, limit = 20 } = params;
    
    if (!tenant_id) {
      return {
        success: false,
        status: 400,
        error: 'tenant_id is required'
      };
    }
    
    let query = supabase
      .from('workflow_approvals')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant_id)
      .eq('entity_type', 'CONTACT_ACTION')
      .order('made_at', { ascending: false });
    
    if (status !== 'ALL') {
      query = query.eq('workflow_status', status);
    }
    
    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    // Transform data for response
    const approvals = (data || []).map(approval => ({
      id: approval.id,
      status: approval.workflow_status,
      action_type: approval.metadata?.action_type,
      channel: approval.metadata?.channel,
      customer_id: approval.metadata?.customer_id,
      contract_id: approval.metadata?.contract_id,
      reason_code: approval.metadata?.pdp_decision?.reason_code,
      reason_details: approval.metadata?.pdp_decision?.reason_details,
      required_evidence: approval.metadata?.pdp_decision?.required_evidence,
      requested_by: approval.maker_id,
      requested_at: approval.made_at,
      reviewed_by: approval.checker_id,
      reviewed_at: approval.checked_at,
      review_comments: approval.checker_comments
    }));
    
    return {
      success: true,
      status: 200,
      data: approvals,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      }
    };
    
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return {
      success: false,
      status: 500,
      error: error.message
    };
  }
}

/**
 * POST /actions/approvals/:id/approve
 * Approve a pending action
 */
export async function approveAction(approvalId, request) {
  try {
    if (!approvalId) {
      return {
        success: false,
        status: 400,
        error: 'approval_id is required'
      };
    }
    
    const { approved_by, comments, evidence } = request;
    
    if (!approved_by) {
      return {
        success: false,
        status: 400,
        error: 'approved_by is required'
      };
    }
    
    // Get current approval
    const { data: approval, error: fetchError } = await supabase
      .from('workflow_approvals')
      .select('*')
      .eq('id', approvalId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!approval) {
      return {
        success: false,
        status: 404,
        error: 'Approval not found'
      };
    }
    
    if (approval.workflow_status !== 'PENDING') {
      return {
        success: false,
        status: 400,
        error: `Cannot approve. Current status: ${approval.workflow_status}`
      };
    }
    
    // Check if evidence is required and provided
    const requiredEvidence = approval.metadata?.pdp_decision?.required_evidence || [];
    if (requiredEvidence.length > 0 && !evidence) {
      return {
        success: false,
        status: 400,
        error: `Evidence required: ${requiredEvidence.join(', ')}`
      };
    }
    
    // Update approval status
    const { data: updatedApproval, error: updateError } = await supabase
      .from('workflow_approvals')
      .update({
        workflow_status: 'APPROVED',
        checker_id: approved_by,
        checker_comments: comments,
        checked_at: new Date().toISOString(),
        current_approvals: 1,
        metadata: {
          ...approval.metadata,
          evidence: evidence,
          approval: {
            approved_by,
            approved_at: new Date().toISOString(),
            comments
          }
        }
      })
      .eq('id', approvalId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      status: 200,
      data: {
        id: updatedApproval.id,
        status: 'APPROVED',
        approved_by,
        approved_at: updatedApproval.checked_at,
        message: 'Action approved. You can now execute it using /actions/contact/execute'
      }
    };
    
  } catch (error) {
    console.error('Approve action error:', error);
    return {
      success: false,
      status: 500,
      error: error.message
    };
  }
}

/**
 * POST /actions/approvals/:id/reject
 * Reject a pending action
 */
export async function rejectAction(approvalId, request) {
  try {
    if (!approvalId) {
      return {
        success: false,
        status: 400,
        error: 'approval_id is required'
      };
    }
    
    const { rejected_by, comments } = request;
    
    if (!rejected_by) {
      return {
        success: false,
        status: 400,
        error: 'rejected_by is required'
      };
    }
    
    if (!comments) {
      return {
        success: false,
        status: 400,
        error: 'comments are required when rejecting'
      };
    }
    
    // Get current approval
    const { data: approval, error: fetchError } = await supabase
      .from('workflow_approvals')
      .select('*')
      .eq('id', approvalId)
      .single();
    
    if (fetchError) throw fetchError;
    
    if (!approval) {
      return {
        success: false,
        status: 404,
        error: 'Approval not found'
      };
    }
    
    if (approval.workflow_status !== 'PENDING') {
      return {
        success: false,
        status: 400,
        error: `Cannot reject. Current status: ${approval.workflow_status}`
      };
    }
    
    // Update approval status
    const { data: updatedApproval, error: updateError } = await supabase
      .from('workflow_approvals')
      .update({
        workflow_status: 'REJECTED',
        checker_id: rejected_by,
        checker_comments: comments,
        checked_at: new Date().toISOString(),
        metadata: {
          ...approval.metadata,
          rejection: {
            rejected_by,
            rejected_at: new Date().toISOString(),
            comments
          }
        }
      })
      .eq('id', approvalId)
      .select()
      .single();
    
    if (updateError) throw updateError;
    
    return {
      success: true,
      status: 200,
      data: {
        id: updatedApproval.id,
        status: 'REJECTED',
        rejected_by,
        rejected_at: updatedApproval.checked_at,
        message: 'Action rejected'
      }
    };
    
  } catch (error) {
    console.error('Reject action error:', error);
    return {
      success: false,
      status: 500,
      error: error.message
    };
  }
}

/**
 * GET /actions/approvals/:id
 * Get details of a specific approval
 */
export async function getApprovalDetails(approvalId) {
  try {
    if (!approvalId) {
      return {
        success: false,
        status: 400,
        error: 'approval_id is required'
      };
    }
    
    const result = await checkApprovalStatus(approvalId);
    
    if (!result.success) {
      return {
        success: false,
        status: 404,
        error: 'Approval not found'
      };
    }
    
    return {
      success: true,
      status: 200,
      data: result.data
    };
    
  } catch (error) {
    console.error('Get approval details error:', error);
    return {
      success: false,
      status: 500,
      error: error.message
    };
  }
}

// =====================================================
// Bulk Actions (with PDP enforcement)
// =====================================================

/**
 * POST /actions/contact/bulk
 * Initiate multiple contact actions with PDP enforcement
 * Each action is individually evaluated against PDP
 */
export async function initiateBulkContactActions(request) {
  try {
    const { tenant_id, actions, requester_id } = request;
    
    if (!tenant_id) {
      return {
        success: false,
        status: 400,
        error: 'tenant_id is required'
      };
    }
    
    if (!actions || !Array.isArray(actions) || actions.length === 0) {
      return {
        success: false,
        status: 400,
        error: 'actions array is required and must not be empty'
      };
    }
    
    const results = {
      allowed: [],
      blocked: [],
      approval_required: [],
      errors: []
    };
    
    // Process each action
    for (const action of actions) {
      try {
        const normalizedAction = {
          ...action,
          tenant_id,
          requester_id
        };
        
        const result = await initiateContactAction(normalizedAction);
        
        if (result.status === 200) {
          results.allowed.push({
            customer_id: action.customer_id,
            action_type: action.action_type,
            result: result.data
          });
        } else if (result.status === 202) {
          results.approval_required.push({
            customer_id: action.customer_id,
            action_type: action.action_type,
            approval_id: result.approval_id,
            reason_code: result.reason_code
          });
        } else if (result.status === 403) {
          results.blocked.push({
            customer_id: action.customer_id,
            action_type: action.action_type,
            reason_code: result.reason_code,
            reason_details: result.reason_details
          });
        } else {
          results.errors.push({
            customer_id: action.customer_id,
            action_type: action.action_type,
            error: result.error
          });
        }
      } catch (actionError) {
        results.errors.push({
          customer_id: action.customer_id,
          action_type: action.action_type,
          error: actionError.message
        });
      }
    }
    
    return {
      success: true,
      status: 200,
      data: {
        summary: {
          total: actions.length,
          allowed: results.allowed.length,
          blocked: results.blocked.length,
          approval_required: results.approval_required.length,
          errors: results.errors.length
        },
        results
      }
    };
    
  } catch (error) {
    console.error('Bulk contact actions error:', error);
    return {
      success: false,
      status: 500,
      error: error.message
    };
  }
}

// =====================================================
// Export API
// =====================================================

export const actionsAPI = {
  // Contact actions
  initiateContactAction,
  executeApprovedContactAction,
  initiateBulkContactActions,
  
  // Approval management
  getPendingActionApprovals,
  approveAction,
  rejectAction,
  getApprovalDetails
};

export default actionsAPI;
