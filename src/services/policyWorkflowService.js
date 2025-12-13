/**
 * =====================================================
 * EPIC 3: Policy Workflow Service (Maker-Checker)
 * =====================================================
 * 
 * This service implements the maker-checker workflow for policy management.
 * It integrates with the workflow tables from EPIC 2.
 * 
 * Key Features:
 * - Create, update, submit, approve, reject policy versions
 * - Multi-level approval support
 * - Audit trail for all workflow actions
 * - Tenant isolation
 */

import { supabasePolicy, PDP_TABLES } from '@/lib/supabasePolicy';

// =====================================================
// Workflow Status Constants
// =====================================================

export const WORKFLOW_STATUS = {
  PENDING: 'PENDING',
  APPROVED: 'APPROVED',
  REJECTED: 'REJECTED',
  CANCELLED: 'CANCELLED'
};

export const VERSION_STATUS = {
  DRAFT: 'DRAFT',
  SUBMITTED: 'SUBMITTED',
  APPROVED: 'APPROVED',
  PUBLISHED: 'PUBLISHED',
  REJECTED: 'REJECTED',
  ARCHIVED: 'ARCHIVED'
};

// =====================================================
// Policy Workflow Service Class
// =====================================================

export class PolicyWorkflowService {
  
  /**
   * Create a new policy profile
   */
  async createPolicyProfile({
    tenantId,
    name,
    description,
    customerType,
    securedFlag,
    priority = 100,
    metadata = {},
    createdBy
  }) {
    try {
      const { data, error } = await supabasePolicy
        .from(PDP_TABLES.POLICY_PROFILES)
        .insert({
          tenant_id: tenantId,
          name,
          description,
          customer_type: customerType,
          secured_flag: securedFlag,
          status: 'ACTIVE',
          priority,
          metadata,
          created_by: createdBy,
          updated_by: createdBy
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get all policy profiles for a tenant
   */
  async getPolicyProfiles(tenantId, filters = {}) {
    try {
      let query = supabase
        .from('policy_profiles')
        .select(`
          *,
          policy_versions (
            id,
            version_no,
            status,
            effective_from,
            effective_to,
            created_at
          )
        `)
        .eq('tenant_id', tenantId)
        .order('priority', { ascending: true });
      
      if (filters.customerType) {
        query = query.eq('customer_type', filters.customerType);
      }
      
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get a single policy profile with all versions
   */
  async getPolicyProfile(profileId) {
    try {
      const { data, error } = await supabasePolicy
        .from(PDP_TABLES.POLICY_PROFILES)
        .select(`
          *,
          policy_versions (
            id,
            version_no,
            status,
            effective_from,
            effective_to,
            rules_json,
            change_reason,
            created_by,
            submitted_by,
            submitted_at,
            reviewed_by,
            reviewed_at,
            review_comments,
            approved_by,
            approved_at,
            published_by,
            published_at,
            created_at,
            updated_at
          )
        `)
        .eq('id', profileId)
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Create a new policy version (DRAFT)
   */
  async createPolicyVersion({
    tenantId,
    profileId,
    rulesJson,
    changeReason,
    effectiveFrom = null,
    createdBy
  }) {
    try {
      // Get next version number
      const { data: existingVersions } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .select('version_no')
        .eq('profile_id', profileId)
        .order('version_no', { ascending: false })
        .limit(1);
      
      const nextVersionNo = (existingVersions?.[0]?.version_no || 0) + 1;
      
      // Create new version in DRAFT status
      const { data, error } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .insert({
          tenant_id: tenantId,
          profile_id: profileId,
          version_no: nextVersionNo,
          status: VERSION_STATUS.DRAFT,
          rules_json: rulesJson,
          change_reason: changeReason,
          effective_from: effectiveFrom,
          created_by: createdBy
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Update a DRAFT policy version
   */
  async updatePolicyVersion(versionId, {
    rulesJson,
    changeReason,
    effectiveFrom,
    updatedBy
  }) {
    try {
      // Verify version is in DRAFT status
      const { data: existingVersion } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .select('status')
        .eq('id', versionId)
        .single();
      
      if (existingVersion?.status !== VERSION_STATUS.DRAFT) {
        return { 
          success: false, 
          error: `Cannot update version in ${existingVersion?.status} status. Only DRAFT versions can be edited.` 
        };
      }
      
      const updateData = { updated_by: updatedBy };
      if (rulesJson) updateData.rules_json = rulesJson;
      if (changeReason) updateData.change_reason = changeReason;
      if (effectiveFrom !== undefined) updateData.effective_from = effectiveFrom;
      
      const { data, error } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .update(updateData)
        .eq('id', versionId)
        .select()
        .single();
      
      if (error) throw error;
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Submit a DRAFT version for approval (Maker action)
   */
  async submitForApproval(versionId, { submittedBy, comments }) {
    try {
      // Verify version is in DRAFT status
      const { data: existingVersion } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .select('status, tenant_id, profile_id')
        .eq('id', versionId)
        .single();
      
      if (existingVersion?.status !== VERSION_STATUS.DRAFT) {
        return { 
          success: false, 
          error: `Cannot submit version in ${existingVersion?.status} status. Only DRAFT versions can be submitted.` 
        };
      }
      
      // Update version status
      const { error: updateError } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .update({
          status: VERSION_STATUS.SUBMITTED,
          submitted_by: submittedBy,
          submitted_at: new Date().toISOString()
        })
        .eq('id', versionId);
      
      if (updateError) throw updateError;
      
      // Create workflow approval record
      const { data: workflow, error: workflowError } = await supabasePolicy
        .from(PDP_TABLES.WORKFLOW_APPROVALS)
        .insert({
          tenant_id: existingVersion.tenant_id,
          entity_type: 'POLICY_VERSION',
          entity_id: versionId,
          workflow_status: WORKFLOW_STATUS.PENDING,
          maker_id: submittedBy,
          maker_comments: comments,
          made_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (workflowError) throw workflowError;
      
      return { success: true, data: { version_id: versionId, workflow_id: workflow.id } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Approve a SUBMITTED version (Checker action)
   */
  async approveVersion(versionId, { approvedBy, comments }) {
    try {
      // Verify version is in SUBMITTED status
      const { data: existingVersion } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .select('status, tenant_id')
        .eq('id', versionId)
        .single();
      
      if (existingVersion?.status !== VERSION_STATUS.SUBMITTED) {
        return { 
          success: false, 
          error: `Cannot approve version in ${existingVersion?.status} status. Only SUBMITTED versions can be approved.` 
        };
      }
      
      // Update version status
      const { error: updateError } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .update({
          status: VERSION_STATUS.APPROVED,
          reviewed_by: approvedBy,
          reviewed_at: new Date().toISOString(),
          review_comments: comments,
          approved_by: approvedBy,
          approved_at: new Date().toISOString()
        })
        .eq('id', versionId);
      
      if (updateError) throw updateError;
      
      // Update workflow approval record
      const { error: workflowError } = await supabasePolicy
        .from(PDP_TABLES.WORKFLOW_APPROVALS)
        .update({
          workflow_status: WORKFLOW_STATUS.APPROVED,
          checker_id: approvedBy,
          checker_comments: comments,
          checked_at: new Date().toISOString(),
          current_approvals: 1
        })
        .eq('entity_type', 'POLICY_VERSION')
        .eq('entity_id', versionId)
        .eq('workflow_status', WORKFLOW_STATUS.PENDING);
      
      if (workflowError) throw workflowError;
      
      return { success: true, data: { version_id: versionId, status: VERSION_STATUS.APPROVED } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Reject a SUBMITTED version (Checker action)
   */
  async rejectVersion(versionId, { rejectedBy, comments }) {
    try {
      // Verify version is in SUBMITTED status
      const { data: existingVersion } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .select('status, tenant_id')
        .eq('id', versionId)
        .single();
      
      if (existingVersion?.status !== VERSION_STATUS.SUBMITTED) {
        return { 
          success: false, 
          error: `Cannot reject version in ${existingVersion?.status} status. Only SUBMITTED versions can be rejected.` 
        };
      }
      
      // Update version status back to DRAFT for corrections
      const { error: updateError } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .update({
          status: VERSION_STATUS.REJECTED,
          reviewed_by: rejectedBy,
          reviewed_at: new Date().toISOString(),
          review_comments: comments
        })
        .eq('id', versionId);
      
      if (updateError) throw updateError;
      
      // Update workflow approval record
      const { error: workflowError } = await supabasePolicy
        .from(PDP_TABLES.WORKFLOW_APPROVALS)
        .update({
          workflow_status: WORKFLOW_STATUS.REJECTED,
          checker_id: rejectedBy,
          checker_comments: comments,
          checked_at: new Date().toISOString()
        })
        .eq('entity_type', 'POLICY_VERSION')
        .eq('entity_id', versionId)
        .eq('workflow_status', WORKFLOW_STATUS.PENDING);
      
      if (workflowError) throw workflowError;
      
      return { success: true, data: { version_id: versionId, status: VERSION_STATUS.REJECTED } };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Publish an APPROVED version (makes it active)
   */
  async publishVersion(versionId, { publishedBy }) {
    try {
      // Verify version is in APPROVED status
      const { data: existingVersion } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .select('status, tenant_id, profile_id')
        .eq('id', versionId)
        .single();
      
      if (existingVersion?.status !== VERSION_STATUS.APPROVED) {
        return { 
          success: false, 
          error: `Cannot publish version in ${existingVersion?.status} status. Only APPROVED versions can be published.` 
        };
      }
      
      // Archive any currently published version for this profile
      const { error: archiveError } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .update({
          status: VERSION_STATUS.ARCHIVED,
          effective_to: new Date().toISOString()
        })
        .eq('profile_id', existingVersion.profile_id)
        .eq('status', VERSION_STATUS.PUBLISHED);
      
      if (archiveError) throw archiveError;
      
      // Publish the new version
      const { data, error: publishError } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .update({
          status: VERSION_STATUS.PUBLISHED,
          published_by: publishedBy,
          published_at: new Date().toISOString(),
          effective_from: new Date().toISOString()
        })
        .eq('id', versionId)
        .select()
        .single();
      
      if (publishError) throw publishError;
      
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending approvals for a checker
   */
  async getPendingApprovals(tenantId, checkerId = null) {
    try {
      let query = supabase
        .from('workflow_approvals')
        .select(`
          *,
          policy_versions!entity_id (
            id,
            version_no,
            rules_json,
            change_reason,
            created_at,
            policy_profiles!profile_id (
              id,
              name,
              customer_type,
              secured_flag
            )
          )
        `)
        .eq('tenant_id', tenantId)
        .eq('entity_type', 'POLICY_VERSION')
        .eq('workflow_status', WORKFLOW_STATUS.PENDING)
        .order('made_at', { ascending: true });
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Get workflow history for a policy version
   */
  async getWorkflowHistory(versionId) {
    try {
      const { data, error } = await supabasePolicy
        .from(PDP_TABLES.WORKFLOW_APPROVALS)
        .select('*')
        .eq('entity_type', 'POLICY_VERSION')
        .eq('entity_id', versionId)
        .order('made_at', { ascending: true });
      
      if (error) throw error;
      
      return { success: true, data: data || [] };
    } catch (error) {
      return { success: false, error: error.message, data: [] };
    }
  }

  /**
   * Clone an existing version as a new DRAFT
   */
  async cloneVersion(sourceVersionId, { tenantId, createdBy, changeReason }) {
    try {
      // Get source version
      const { data: sourceVersion } = await supabasePolicy
        .from(PDP_TABLES.POLICY_VERSIONS)
        .select('*')
        .eq('id', sourceVersionId)
        .single();
      
      if (!sourceVersion) {
        return { success: false, error: 'Source version not found' };
      }
      
      // Create new version with cloned rules
      return this.createPolicyVersion({
        tenantId: tenantId || sourceVersion.tenant_id,
        profileId: sourceVersion.profile_id,
        rulesJson: sourceVersion.rules_json,
        changeReason: changeReason || `Cloned from version ${sourceVersion.version_no}`,
        createdBy
      });
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Validate rules JSON structure
   */
  validateRulesJson(rulesJson) {
    const errors = [];
    
    if (!rulesJson || typeof rulesJson !== 'object') {
      return { valid: false, errors: ['Rules must be a valid JSON object'] };
    }
    
    if (!rulesJson.rules || !Array.isArray(rulesJson.rules)) {
      return { valid: false, errors: ['Rules must contain a "rules" array'] };
    }
    
    const validRuleTypes = [
      'max_attempts', 
      'time_window', 
      'cooling_period', 
      'consent_check', 
      'channel_restriction',
      'bucket_rule'
    ];
    
    for (let i = 0; i < rulesJson.rules.length; i++) {
      const rule = rulesJson.rules[i];
      
      if (!rule.type) {
        errors.push(`Rule ${i + 1}: Missing "type" field`);
        continue;
      }
      
      if (!validRuleTypes.includes(rule.type)) {
        errors.push(`Rule ${i + 1}: Invalid type "${rule.type}". Must be one of: ${validRuleTypes.join(', ')}`);
      }
      
      // Validate specific rule types
      switch (rule.type) {
        case 'max_attempts':
          if (typeof rule.max_attempts !== 'number' || rule.max_attempts < 1) {
            errors.push(`Rule ${i + 1}: max_attempts must be a positive number`);
          }
          if (!rule.window || !/^\d+[hdwm]$/.test(rule.window)) {
            errors.push(`Rule ${i + 1}: window must be in format "7d", "24h", "1w", or "1m"`);
          }
          break;
        
        case 'time_window':
          if (!rule.allowed_windows || !Array.isArray(rule.allowed_windows)) {
            errors.push(`Rule ${i + 1}: time_window must have "allowed_windows" array`);
          } else {
            for (let j = 0; j < rule.allowed_windows.length; j++) {
              const win = rule.allowed_windows[j];
              if (!win.start_time || !win.end_time) {
                errors.push(`Rule ${i + 1}, Window ${j + 1}: must have start_time and end_time`);
              }
            }
          }
          break;
        
        case 'cooling_period':
          if (!rule.cooling_period || !/^\d+[hdwm]$/.test(rule.cooling_period)) {
            errors.push(`Rule ${i + 1}: cooling_period must be in format "24h", "2d", etc.`);
          }
          break;
        
        case 'consent_check':
          if (!rule.channels_requiring_consent || !Array.isArray(rule.channels_requiring_consent)) {
            errors.push(`Rule ${i + 1}: consent_check must have "channels_requiring_consent" array`);
          }
          break;
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}

// =====================================================
// Singleton Export
// =====================================================

export const policyWorkflowService = new PolicyWorkflowService();

export default policyWorkflowService;
