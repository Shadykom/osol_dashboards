/**
 * =====================================================
 * EPIC 3: PDP API Routes
 * =====================================================
 * 
 * This module exposes the Policy Decision Point (PDP) API endpoints.
 * 
 * Endpoints:
 * - POST /pdp/decision - Evaluate a policy decision
 * - POST /pdp/record-attempt - Record a contact attempt
 * - GET /pdp/decision-log - Get decision audit log
 * 
 * Policy Management:
 * - GET /pdp/profiles - List policy profiles
 * - POST /pdp/profiles - Create policy profile
 * - GET /pdp/profiles/:id - Get policy profile details
 * - POST /pdp/versions - Create policy version
 * - PUT /pdp/versions/:id - Update policy version
 * - POST /pdp/versions/:id/submit - Submit for approval
 * - POST /pdp/versions/:id/approve - Approve version
 * - POST /pdp/versions/:id/reject - Reject version
 * - POST /pdp/versions/:id/publish - Publish version
 */

import { pdpService, DECISIONS, REASON_CODES } from '@/services/pdpService';
import { policyWorkflowService } from '@/services/policyWorkflowService';
import { supabasePolicy, PDP_TABLES } from '@/lib/supabasePolicy';

// =====================================================
// PDP Decision Endpoints
// =====================================================

/**
 * POST /pdp/decision
 * Evaluate a policy decision for a contact action
 */
export async function evaluateDecision(request) {
  try {
    // Validate request body
    if (!request) {
      return {
        success: false,
        error: 'Request body is required',
        status: 400
      };
    }
    
    // Call PDP service
    const response = await pdpService.evaluateDecision(request);
    
    return {
      success: true,
      data: response,
      status: 200
    };
    
  } catch (error) {
    console.error('PDP decision error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred during policy evaluation',
      status: 500
    };
  }
}

/**
 * POST /pdp/record-attempt
 * Record a contact attempt for tracking
 */
export async function recordContactAttempt(request) {
  try {
    const { tenant_id, customer_id, action_type, channel, outcome, metadata } = request;
    
    if (!tenant_id || !customer_id || !action_type) {
      return {
        success: false,
        error: 'tenant_id, customer_id, and action_type are required',
        status: 400
      };
    }
    
    await pdpService.recordContactAttempt(
      tenant_id,
      customer_id,
      action_type,
      channel,
      outcome,
      metadata
    );
    
    return {
      success: true,
      data: { recorded: true },
      status: 201
    };
    
  } catch (error) {
    console.error('Record attempt error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred recording the contact attempt',
      status: 500
    };
  }
}

/**
 * GET /pdp/decision-log
 * Get decision audit log with filtering
 */
export async function getDecisionLog(params = {}) {
  try {
    const {
      tenant_id,
      customer_id,
      contract_id,
      decision,
      start_date,
      end_date,
      page = 1,
      limit = 50
    } = params;
    
    if (!tenant_id) {
      return {
        success: false,
        error: 'tenant_id is required',
        status: 400
      };
    }
    
    let query = supabasePolicy
      .from(PDP_TABLES.DECISION_LOG)
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false });
    
    if (customer_id) {
      query = query.eq('customer_id', customer_id);
    }
    
    if (contract_id) {
      query = query.eq('contract_id', contract_id);
    }
    
    if (decision) {
      query = query.eq('decision', decision);
    }
    
    if (start_date) {
      query = query.gte('created_at', start_date);
    }
    
    if (end_date) {
      query = query.lte('created_at', end_date);
    }
    
    // Pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);
    
    const { data, error, count } = await query;
    
    if (error) throw error;
    
    return {
      success: true,
      data: data || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit)
      },
      status: 200
    };
    
  } catch (error) {
    console.error('Get decision log error:', error);
    return {
      success: false,
      error: error.message || 'An error occurred fetching the decision log',
      status: 500
    };
  }
}

// =====================================================
// Policy Profile Endpoints
// =====================================================

/**
 * GET /pdp/profiles
 * List policy profiles for a tenant
 */
export async function getPolicyProfiles(tenantId, filters = {}) {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: 'tenant_id is required',
        status: 400
      };
    }
    
    const result = await policyWorkflowService.getPolicyProfiles(tenantId, filters);
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 200 : 500
    };
    
  } catch (error) {
    console.error('Get policy profiles error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * POST /pdp/profiles
 * Create a new policy profile
 */
export async function createPolicyProfile(request) {
  try {
    const {
      tenant_id,
      name,
      description,
      customer_type,
      secured_flag,
      priority,
      metadata,
      created_by
    } = request;
    
    if (!tenant_id || !name || !customer_type) {
      return {
        success: false,
        error: 'tenant_id, name, and customer_type are required',
        status: 400
      };
    }
    
    const result = await policyWorkflowService.createPolicyProfile({
      tenantId: tenant_id,
      name,
      description,
      customerType: customer_type,
      securedFlag: secured_flag,
      priority,
      metadata,
      createdBy: created_by
    });
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 201 : 400
    };
    
  } catch (error) {
    console.error('Create policy profile error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * GET /pdp/profiles/:id
 * Get policy profile details with all versions
 */
export async function getPolicyProfile(profileId) {
  try {
    if (!profileId) {
      return {
        success: false,
        error: 'profile_id is required',
        status: 400
      };
    }
    
    const result = await policyWorkflowService.getPolicyProfile(profileId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 200 : 404
    };
    
  } catch (error) {
    console.error('Get policy profile error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

// =====================================================
// Policy Version Endpoints
// =====================================================

/**
 * POST /pdp/versions
 * Create a new policy version (DRAFT)
 */
export async function createPolicyVersion(request) {
  try {
    const {
      tenant_id,
      profile_id,
      rules_json,
      change_reason,
      effective_from,
      created_by
    } = request;
    
    if (!tenant_id || !profile_id || !rules_json) {
      return {
        success: false,
        error: 'tenant_id, profile_id, and rules_json are required',
        status: 400
      };
    }
    
    // Validate rules JSON
    const validation = policyWorkflowService.validateRulesJson(rules_json);
    if (!validation.valid) {
      return {
        success: false,
        error: 'Invalid rules_json structure',
        details: validation.errors,
        status: 400
      };
    }
    
    const result = await policyWorkflowService.createPolicyVersion({
      tenantId: tenant_id,
      profileId: profile_id,
      rulesJson: rules_json,
      changeReason: change_reason,
      effectiveFrom: effective_from,
      createdBy: created_by
    });
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 201 : 400
    };
    
  } catch (error) {
    console.error('Create policy version error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * PUT /pdp/versions/:id
 * Update a DRAFT policy version
 */
export async function updatePolicyVersion(versionId, request) {
  try {
    if (!versionId) {
      return {
        success: false,
        error: 'version_id is required',
        status: 400
      };
    }
    
    const { rules_json, change_reason, effective_from, updated_by } = request;
    
    // Validate rules JSON if provided
    if (rules_json) {
      const validation = policyWorkflowService.validateRulesJson(rules_json);
      if (!validation.valid) {
        return {
          success: false,
          error: 'Invalid rules_json structure',
          details: validation.errors,
          status: 400
        };
      }
    }
    
    const result = await policyWorkflowService.updatePolicyVersion(versionId, {
      rulesJson: rules_json,
      changeReason: change_reason,
      effectiveFrom: effective_from,
      updatedBy: updated_by
    });
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 200 : 400
    };
    
  } catch (error) {
    console.error('Update policy version error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * POST /pdp/versions/:id/submit
 * Submit a DRAFT version for approval (Maker action)
 */
export async function submitForApproval(versionId, request) {
  try {
    if (!versionId) {
      return {
        success: false,
        error: 'version_id is required',
        status: 400
      };
    }
    
    const { submitted_by, comments } = request;
    
    if (!submitted_by) {
      return {
        success: false,
        error: 'submitted_by is required',
        status: 400
      };
    }
    
    const result = await policyWorkflowService.submitForApproval(versionId, {
      submittedBy: submitted_by,
      comments
    });
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 200 : 400
    };
    
  } catch (error) {
    console.error('Submit for approval error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * POST /pdp/versions/:id/approve
 * Approve a SUBMITTED version (Checker action)
 */
export async function approveVersion(versionId, request) {
  try {
    if (!versionId) {
      return {
        success: false,
        error: 'version_id is required',
        status: 400
      };
    }
    
    const { approved_by, comments } = request;
    
    if (!approved_by) {
      return {
        success: false,
        error: 'approved_by is required',
        status: 400
      };
    }
    
    const result = await policyWorkflowService.approveVersion(versionId, {
      approvedBy: approved_by,
      comments
    });
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 200 : 400
    };
    
  } catch (error) {
    console.error('Approve version error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * POST /pdp/versions/:id/reject
 * Reject a SUBMITTED version (Checker action)
 */
export async function rejectVersion(versionId, request) {
  try {
    if (!versionId) {
      return {
        success: false,
        error: 'version_id is required',
        status: 400
      };
    }
    
    const { rejected_by, comments } = request;
    
    if (!rejected_by) {
      return {
        success: false,
        error: 'rejected_by is required',
        status: 400
      };
    }
    
    const result = await policyWorkflowService.rejectVersion(versionId, {
      rejectedBy: rejected_by,
      comments
    });
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 200 : 400
    };
    
  } catch (error) {
    console.error('Reject version error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * POST /pdp/versions/:id/publish
 * Publish an APPROVED version
 */
export async function publishVersion(versionId, request) {
  try {
    if (!versionId) {
      return {
        success: false,
        error: 'version_id is required',
        status: 400
      };
    }
    
    const { published_by } = request;
    
    if (!published_by) {
      return {
        success: false,
        error: 'published_by is required',
        status: 400
      };
    }
    
    const result = await policyWorkflowService.publishVersion(versionId, {
      publishedBy: published_by
    });
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 200 : 400
    };
    
  } catch (error) {
    console.error('Publish version error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * GET /pdp/pending-approvals
 * Get pending approvals for a checker
 */
export async function getPendingApprovals(tenantId) {
  try {
    if (!tenantId) {
      return {
        success: false,
        error: 'tenant_id is required',
        status: 400
      };
    }
    
    const result = await policyWorkflowService.getPendingApprovals(tenantId);
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 200 : 500
    };
    
  } catch (error) {
    console.error('Get pending approvals error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

/**
 * POST /pdp/versions/:id/clone
 * Clone an existing version as a new DRAFT
 */
export async function cloneVersion(sourceVersionId, request) {
  try {
    if (!sourceVersionId) {
      return {
        success: false,
        error: 'source_version_id is required',
        status: 400
      };
    }
    
    const { tenant_id, created_by, change_reason } = request;
    
    const result = await policyWorkflowService.cloneVersion(sourceVersionId, {
      tenantId: tenant_id,
      createdBy: created_by,
      changeReason: change_reason
    });
    
    return {
      success: result.success,
      data: result.data,
      error: result.error,
      status: result.success ? 201 : 400
    };
    
  } catch (error) {
    console.error('Clone version error:', error);
    return {
      success: false,
      error: error.message,
      status: 500
    };
  }
}

// =====================================================
// Export all endpoints
// =====================================================

export const pdpAPI = {
  // Decision endpoints
  evaluateDecision,
  recordContactAttempt,
  getDecisionLog,
  
  // Profile management
  getPolicyProfiles,
  createPolicyProfile,
  getPolicyProfile,
  
  // Version management
  createPolicyVersion,
  updatePolicyVersion,
  submitForApproval,
  approveVersion,
  rejectVersion,
  publishVersion,
  cloneVersion,
  
  // Workflow
  getPendingApprovals
};

export default pdpAPI;
