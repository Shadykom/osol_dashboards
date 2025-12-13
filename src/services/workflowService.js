/**
 * EPIC 2: Workflow Service
 * 
 * Provides API functions for managing maker-checker approval workflows.
 * 
 * Features:
 * - Approval request management
 * - Multi-step approval chains
 * - Role-based approval steps
 * - Approval history and audit trail
 */

import { supabase, getWorkflowClient, getConfigClient, getAuditClient } from '@/lib/supabase';

// ============================================================================
// API RESPONSE FORMATTER
// ============================================================================

function formatApiResponse(data, error = null, pagination = null) {
  if (error) {
    return {
      success: false,
      data: null,
      error: {
        message: error.message || 'An error occurred',
        code: error.code || 'UNKNOWN_ERROR',
        details: error.details || null
      },
      pagination: null
    };
  }

  return {
    success: true,
    data,
    error: null,
    pagination
  };
}

// ============================================================================
// APPROVALS API
// ============================================================================

/**
 * Get pending approvals for a tenant
 * GET /workflow/approvals
 */
export async function getApprovals({
  tenantId,
  status = null,
  objectType = null,
  requestedBy = null,
  page = 1,
  limit = 20
}) {
  try {
    const workflowClient = getWorkflowClient();
    let query = workflowClient
      .from('approvals')
      .select(`
        *,
        steps:approval_steps(*)
      `, { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('requested_at', { ascending: false });

    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    if (objectType) {
      query = query.eq('object_type', objectType);
    }

    if (requestedBy) {
      query = query.eq('requested_by', requestedBy);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return formatApiResponse(data, null, {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Get pending approvals that a user can act on (based on their role)
 * GET /workflow/approvals/pending
 */
export async function getPendingApprovalsForRole({ tenantId, userRole, page = 1, limit = 20 }) {
  try {
    const workflowClient = getWorkflowClient();
    const { data, error, count } = await workflowClient
      .from('pending_approvals_view')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('role_required', userRole)
      .eq('step_status', 'PENDING')
      .order('priority', { ascending: false })
      .order('requested_at', { ascending: true })
      .range((page - 1) * limit, page * limit - 1);

    if (error) throw error;

    return formatApiResponse(data, null, {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Get a single approval with full details
 * GET /workflow/approvals/:id
 */
export async function getApproval(approvalId) {
  try {
    const workflowClient = getWorkflowClient();
    const { data, error } = await workflowClient
      .from('approvals')
      .select(`
        *,
        steps:approval_steps(*)
      `)
      .eq('id', approvalId)
      .single();

    if (error) throw error;

    // Sort steps by step_no
    if (data.steps) {
      data.steps.sort((a, b) => a.step_no - b.step_no);
    }

    return formatApiResponse(data);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Approve a pending step (checker action)
 * POST /workflow/approvals/:id/approve
 */
export async function approveStep({ approvalId, userId, userRole, comments = null }) {
  try {
    if (!approvalId) {
      return formatApiResponse(null, { message: 'approval_id is required', code: 'VALIDATION_ERROR' });
    }
    if (!userId) {
      return formatApiResponse(null, { message: 'user_id is required', code: 'VALIDATION_ERROR' });
    }
    if (!userRole) {
      return formatApiResponse(null, { message: 'user_role is required', code: 'VALIDATION_ERROR' });
    }

    const workflowClient = getWorkflowClient();
    
    // Use the database function to approve
    const { data: allApproved, error } = await workflowClient
      .rpc('approve_step', {
        p_approval_id: approvalId,
        p_user_id: userId,
        p_user_role: userRole,
        p_comments: comments
      });

    if (error) throw error;

    // Fetch the updated approval
    const approvalResult = await getApproval(approvalId);

    return formatApiResponse({
      approval: approvalResult.data,
      allStepsApproved: allApproved,
      message: allApproved 
        ? 'All approval steps completed. Object is now approved.'
        : 'Approval step completed successfully.'
    });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Reject an approval (checker action)
 * POST /workflow/approvals/:id/reject
 */
export async function rejectApproval({ approvalId, userId, reason }) {
  try {
    if (!approvalId) {
      return formatApiResponse(null, { message: 'approval_id is required', code: 'VALIDATION_ERROR' });
    }
    if (!userId) {
      return formatApiResponse(null, { message: 'user_id is required', code: 'VALIDATION_ERROR' });
    }
    if (!reason) {
      return formatApiResponse(null, { message: 'reason is required for rejection', code: 'VALIDATION_ERROR' });
    }

    const workflowClient = getWorkflowClient();
    
    // Use the database function to reject
    const { error } = await workflowClient
      .rpc('reject_approval', {
        p_approval_id: approvalId,
        p_user_id: userId,
        p_reason: reason
      });

    if (error) throw error;

    // Fetch the updated approval
    const approvalResult = await getApproval(approvalId);

    return formatApiResponse({
      approval: approvalResult.data,
      message: 'Approval has been rejected.'
    });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Cancel a pending approval (requester action)
 * POST /workflow/approvals/:id/cancel
 */
export async function cancelApproval({ approvalId, userId, reason = null }) {
  try {
    const workflowClient = getWorkflowClient();
    
    // Verify the approval is still pending
    const { data: approval, error: fetchError } = await workflowClient
      .from('approvals')
      .select('status, requested_by')
      .eq('id', approvalId)
      .single();

    if (fetchError) throw fetchError;

    if (!['PENDING', 'IN_PROGRESS'].includes(approval.status)) {
      return formatApiResponse(null, {
        message: `Cannot cancel approval in ${approval.status} status`,
        code: 'INVALID_STATE'
      });
    }

    // Only the requester can cancel
    if (approval.requested_by !== userId) {
      return formatApiResponse(null, {
        message: 'Only the requester can cancel an approval',
        code: 'FORBIDDEN'
      });
    }

    // Update approval status
    const { data, error } = await workflowClient
      .from('approvals')
      .update({
        status: 'CANCELLED',
        rejection_reason: reason || 'Cancelled by requester'
      })
      .eq('id', approvalId)
      .select()
      .single();

    if (error) throw error;

    // Update all pending steps to skipped
    await workflowClient
      .from('approval_steps')
      .update({
        status: 'SKIPPED',
        comments: 'Approval cancelled'
      })
      .eq('approval_id', approvalId)
      .eq('status', 'PENDING');

    return formatApiResponse({
      approval: data,
      message: 'Approval has been cancelled.'
    });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Create a custom approval request
 * POST /workflow/approvals
 */
export async function createApproval({
  tenantId,
  objectType,
  objectId,
  requestedBy,
  approvalRoles = ['checker'],
  priority = 'normal',
  expiresAt = null,
  metadata = null
}) {
  try {
    if (!tenantId || !objectType || !objectId || !requestedBy) {
      return formatApiResponse(null, {
        message: 'tenant_id, object_type, object_id, and requested_by are required',
        code: 'VALIDATION_ERROR'
      });
    }

    const workflowClient = getWorkflowClient();
    
    // Create the approval
    const { data: approval, error: approvalError } = await workflowClient
      .from('approvals')
      .insert({
        tenant_id: tenantId,
        object_type: objectType,
        object_id: objectId,
        status: 'PENDING',
        priority,
        requested_by: requestedBy,
        expires_at: expiresAt,
        metadata
      })
      .select()
      .single();

    if (approvalError) throw approvalError;

    // Create approval steps
    const steps = approvalRoles.map((role, index) => ({
      tenant_id: tenantId,
      approval_id: approval.id,
      step_no: index + 1,
      role_required: role,
      status: 'PENDING'
    }));

    const { error: stepsError } = await workflowClient
      .from('approval_steps')
      .insert(steps);

    if (stepsError) throw stepsError;

    // Fetch the complete approval
    const result = await getApproval(approval.id);
    return result;
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// ============================================================================
// APPROVAL STEPS API
// ============================================================================

/**
 * Get steps for an approval
 * GET /workflow/approvals/:id/steps
 */
export async function getApprovalSteps(approvalId) {
  try {
    const workflowClient = getWorkflowClient();
    const { data, error } = await workflowClient
      .from('approval_steps')
      .select('*')
      .eq('approval_id', approvalId)
      .order('step_no');

    if (error) throw error;
    return formatApiResponse(data);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// ============================================================================
// APPROVAL STATISTICS
// ============================================================================

/**
 * Get approval statistics for a tenant
 * GET /workflow/approvals/stats
 */
export async function getApprovalStats({ tenantId, startDate = null, endDate = null }) {
  try {
    const workflowClient = getWorkflowClient();
    
    // Get counts by status
    let query = workflowClient
      .from('approvals')
      .select('status', { count: 'exact' })
      .eq('tenant_id', tenantId);

    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const { data: allApprovals, error: countError } = await query;

    if (countError) throw countError;

    // Calculate stats
    const stats = {
      total: allApprovals?.length || 0,
      byStatus: {
        PENDING: 0,
        IN_PROGRESS: 0,
        APPROVED: 0,
        REJECTED: 0,
        CANCELLED: 0,
        EXPIRED: 0
      }
    };

    allApprovals?.forEach(approval => {
      if (stats.byStatus[approval.status] !== undefined) {
        stats.byStatus[approval.status]++;
      }
    });

    return formatApiResponse(stats);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Get average approval time by object type
 * GET /workflow/approvals/metrics
 */
export async function getApprovalMetrics({ tenantId, objectType = null }) {
  try {
    const workflowClient = getWorkflowClient();
    let query = workflowClient
      .from('approvals')
      .select('object_type, requested_at, approved_at')
      .eq('tenant_id', tenantId)
      .eq('status', 'APPROVED')
      .not('approved_at', 'is', null);

    if (objectType) {
      query = query.eq('object_type', objectType);
    }

    const { data, error } = await query;

    if (error) throw error;

    // Calculate average approval time
    const metricsByType = {};

    data?.forEach(approval => {
      const type = approval.object_type;
      const requestedAt = new Date(approval.requested_at);
      const approvedAt = new Date(approval.approved_at);
      const durationMs = approvedAt - requestedAt;
      const durationHours = durationMs / (1000 * 60 * 60);

      if (!metricsByType[type]) {
        metricsByType[type] = {
          count: 0,
          totalHours: 0
        };
      }

      metricsByType[type].count++;
      metricsByType[type].totalHours += durationHours;
    });

    // Calculate averages
    const metrics = Object.entries(metricsByType).map(([type, data]) => ({
      objectType: type,
      approvalCount: data.count,
      averageHours: Math.round((data.totalHours / data.count) * 100) / 100
    }));

    return formatApiResponse(metrics);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// ============================================================================
// WORKFLOW AUDIT LOG
// ============================================================================

/**
 * Get workflow-related audit entries
 * GET /workflow/audit
 */
export async function getWorkflowAuditLog({
  tenantId,
  approvalId = null,
  eventType = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 50
}) {
  try {
    const auditClient = getAuditClient();
    let query = auditClient
      .from('config_audit_log')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .eq('object_type', 'approval')
      .order('created_at', { ascending: false });

    if (approvalId) {
      query = query.eq('object_id', approvalId);
    }
    if (eventType) {
      query = query.eq('event_type', eventType);
    }
    if (startDate) {
      query = query.gte('created_at', startDate);
    }
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const offset = (page - 1) * limit;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) throw error;

    return formatApiResponse(data, null, {
      page,
      limit,
      total: count,
      totalPages: Math.ceil(count / limit)
    });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// ============================================================================
// WORKFLOW CONFIGURATION
// ============================================================================

/**
 * Get workflow configuration from config system
 * This demonstrates integration between workflow and config services
 */
export async function getWorkflowConfig(tenantId) {
  try {
    // Import config service to resolve workflow settings
    const { resolveConfig } = await import('./configService.js');
    
    const result = await resolveConfig({
      tenantId,
      keys: [
        'workflow.approval.config_change_roles',
        'workflow.approval.policy_change_roles',
        'workflow.approval.expiry_hours'
      ]
    });

    if (!result.success) {
      // Return defaults if config not found
      return formatApiResponse({
        configChangeRoles: ['config_checker'],
        policyChangeRoles: ['policy_checker'],
        expiryHours: 72
      });
    }

    return formatApiResponse({
      configChangeRoles: result.data.values['workflow.approval.config_change_roles'] || ['config_checker'],
      policyChangeRoles: result.data.values['workflow.approval.policy_change_roles'] || ['policy_checker'],
      expiryHours: result.data.values['workflow.approval.expiry_hours'] || 72
    });
  } catch (error) {
    // Return defaults on error
    return formatApiResponse({
      configChangeRoles: ['config_checker'],
      policyChangeRoles: ['policy_checker'],
      expiryHours: 72
    });
  }
}

// ============================================================================
// EXPORT DEFAULT SERVICE OBJECT
// ============================================================================

export const WorkflowService = {
  // Approvals
  getApprovals,
  getPendingApprovalsForRole,
  getApproval,
  createApproval,
  approveStep,
  rejectApproval,
  cancelApproval,
  
  // Steps
  getApprovalSteps,
  
  // Statistics
  getApprovalStats,
  getApprovalMetrics,
  
  // Audit
  getWorkflowAuditLog,
  
  // Configuration
  getWorkflowConfig
};

export default WorkflowService;
