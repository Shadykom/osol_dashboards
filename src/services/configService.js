/**
 * EPIC 2: Configuration Service
 * 
 * Provides API functions for managing versioned configuration packages
 * with maker-checker workflow support.
 * 
 * Features:
 * - CRUD operations for config packages, versions, and items
 * - Maker-checker workflow integration
 * - Effective dating support
 * - Config resolution with scope filtering
 * - Validation for namespaced keys and JSON values
 */

import { supabase, getConfigClient, getAuditClient } from '@/lib/supabase';

// ============================================================================
// VALIDATION UTILITIES
// ============================================================================

/**
 * Validate config key format (must be namespaced)
 * Pattern: namespace.category.name or namespace.name
 * @param {string} key - The config key to validate
 * @returns {boolean} Whether the key is valid
 */
export function validateConfigKey(key) {
  if (!key || typeof key !== 'string') return false;
  const pattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  return pattern.test(key);
}

/**
 * Validate and parse JSON value
 * @param {*} value - The value to validate
 * @returns {{ valid: boolean, parsed: any, type: string, error?: string }}
 */
export function validateJsonValue(value) {
  try {
    let parsed;
    let valueType;

    if (typeof value === 'string') {
      // Try to parse as JSON
      try {
        parsed = JSON.parse(value);
      } catch {
        // If it's not valid JSON, treat it as a string value
        parsed = value;
        valueType = 'string';
      }
    } else {
      parsed = value;
    }

    // Determine type if not already set
    if (!valueType) {
      if (parsed === null) {
        valueType = 'object';
      } else if (Array.isArray(parsed)) {
        valueType = 'array';
      } else if (typeof parsed === 'boolean') {
        valueType = 'boolean';
      } else if (typeof parsed === 'number') {
        valueType = 'number';
      } else if (typeof parsed === 'object') {
        valueType = 'object';
      } else {
        valueType = 'string';
      }
    }

    return {
      valid: true,
      parsed,
      type: valueType,
      json: JSON.stringify(parsed)
    };
  } catch (error) {
    return {
      valid: false,
      error: error.message
    };
  }
}

/**
 * Validate scope JSON
 * @param {*} scope - The scope to validate
 * @returns {{ valid: boolean, parsed?: object, error?: string }}
 */
export function validateScope(scope) {
  if (scope === null || scope === undefined) {
    return { valid: true, parsed: null };
  }

  try {
    let parsed;
    if (typeof scope === 'string') {
      parsed = JSON.parse(scope);
    } else {
      parsed = scope;
    }

    if (typeof parsed !== 'object' || Array.isArray(parsed)) {
      return { valid: false, error: 'Scope must be an object' };
    }

    // Validate scope keys (common: portfolio, product, bucket, branch)
    const validScopeKeys = ['portfolio', 'product', 'bucket', 'branch', 'region', 'channel'];
    const scopeKeys = Object.keys(parsed);
    
    for (const key of scopeKeys) {
      if (!validScopeKeys.includes(key)) {
        console.warn(`Unknown scope key: ${key}. Valid keys are: ${validScopeKeys.join(', ')}`);
      }
    }

    return { valid: true, parsed };
  } catch (error) {
    return { valid: false, error: `Invalid scope JSON: ${error.message}` };
  }
}

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
// CONFIG PACKAGES API
// ============================================================================

/**
 * Create a new config package
 * POST /config/packages
 */
export async function createConfigPackage({ tenantId, name, description }) {
  try {
    if (!tenantId) {
      return formatApiResponse(null, { message: 'tenant_id is required', code: 'VALIDATION_ERROR' });
    }
    if (!name) {
      return formatApiResponse(null, { message: 'name is required', code: 'VALIDATION_ERROR' });
    }

    const configClient = getConfigClient();
    const { data, error } = await configClient
      .from('config_packages')
      .insert({
        tenant_id: tenantId,
        name,
        description,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;
    return formatApiResponse(data);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Get all config packages for a tenant
 * GET /config/packages
 */
export async function getConfigPackages({ tenantId, status = null, page = 1, limit = 50 }) {
  try {
    const configClient = getConfigClient();
    let query = configClient
      .from('config_packages')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('name');

    if (status) {
      query = query.eq('status', status);
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
 * Get a single config package by ID
 * GET /config/packages/:id
 */
export async function getConfigPackage(packageId) {
  try {
    const configClient = getConfigClient();
    const { data, error } = await configClient
      .from('config_packages')
      .select(`
        *,
        versions:config_versions(
          id,
          version_no,
          status,
          effective_from,
          created_at
        )
      `)
      .eq('id', packageId)
      .single();

    if (error) throw error;
    return formatApiResponse(data);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Update a config package
 * PATCH /config/packages/:id
 */
export async function updateConfigPackage(packageId, updates) {
  try {
    const allowedFields = ['name', 'description', 'status'];
    const filteredUpdates = {};
    
    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        filteredUpdates[field] = updates[field];
      }
    }

    const configClient = getConfigClient();
    const { data, error } = await configClient
      .from('config_packages')
      .update(filteredUpdates)
      .eq('id', packageId)
      .select()
      .single();

    if (error) throw error;
    return formatApiResponse(data);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// ============================================================================
// CONFIG VERSIONS API
// ============================================================================

/**
 * Create a new draft version for a package
 * POST /config/packages/:id/versions
 */
export async function createConfigVersion({ tenantId, packageId, copyFromVersionId = null, createdBy = null }) {
  try {
    if (!tenantId || !packageId) {
      return formatApiResponse(null, { message: 'tenant_id and package_id are required', code: 'VALIDATION_ERROR' });
    }

    const configClient = getConfigClient();
    
    // Get next version number using the database function
    const { data: nextVersionData, error: versionError } = await configClient
      .rpc('get_next_version_number', { p_package_id: packageId });

    if (versionError) throw versionError;
    const nextVersionNo = nextVersionData;

    // Create the new version
    const { data: newVersion, error: insertError } = await configClient
      .from('config_versions')
      .insert({
        tenant_id: tenantId,
        package_id: packageId,
        version_no: nextVersionNo,
        status: 'DRAFT',
        created_by: createdBy
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // If copying from existing version, copy the items
    if (copyFromVersionId) {
      const { error: copyError } = await configClient
        .rpc('copy_version_items', {
          p_source_version_id: copyFromVersionId,
          p_target_version_id: newVersion.id,
          p_user_id: createdBy
        });

      if (copyError) {
      }
    }

    return formatApiResponse(newVersion);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Get all versions for a package
 * GET /config/packages/:id/versions
 */
export async function getConfigVersions({ packageId, status = null, page = 1, limit = 20 }) {
  try {
    const configClient = getConfigClient();
    let query = configClient
      .from('config_versions')
      .select('*', { count: 'exact' })
      .eq('package_id', packageId)
      .order('version_no', { ascending: false });

    if (status) {
      query = query.eq('status', status);
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
 * Get a single config version with items
 * GET /config/versions/:id
 */
export async function getConfigVersion(versionId) {
  try {
    const configClient = getConfigClient();
    const { data, error } = await configClient
      .from('config_versions')
      .select(`
        *,
        package:config_packages(id, name, description),
        items:config_items(*)
      `)
      .eq('id', versionId)
      .single();

    if (error) throw error;
    return formatApiResponse(data);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Submit a draft version for approval (maker action)
 * POST /config/versions/:id/submit
 */
export async function submitConfigVersion({ versionId, submittedBy, approvalRoles = ['config_checker'] }) {
  try {
    const configClient = getConfigClient();
    
    // Get the version and verify it's in DRAFT status
    const { data: version, error: fetchError } = await configClient
      .from('config_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (fetchError) throw fetchError;

    if (version.status !== 'DRAFT') {
      return formatApiResponse(null, {
        message: `Cannot submit version in ${version.status} status. Only DRAFT versions can be submitted.`,
        code: 'INVALID_STATE'
      });
    }

    // Update version status to SUBMITTED
    const { data: updatedVersion, error: updateError } = await configClient
      .from('config_versions')
      .update({
        status: 'SUBMITTED',
        submitted_at: new Date().toISOString(),
        submitted_by: submittedBy
      })
      .eq('id', versionId)
      .select()
      .single();

    if (updateError) throw updateError;

    // Create approval workflow using workflow schema RPC
    // Note: Using supabase client with schema override for workflow RPC
    const { data: approval, error: approvalError } = await supabase.rpc('workflow.create_config_version_approval', {
      p_tenant_id: version.tenant_id,
      p_version_id: versionId,
      p_requested_by: submittedBy,
      p_approval_roles: approvalRoles
    });

    if (approvalError) {
    }

    return formatApiResponse({
      version: updatedVersion,
      approval_id: approval
    });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Publish an approved version
 * POST /config/versions/:id/publish
 */
export async function publishConfigVersion({ versionId, publishedBy, effectiveFrom = null }) {
  try {
    const configClient = getConfigClient();
    
    // Get the version and verify it's APPROVED
    const { data: version, error: fetchError } = await configClient
      .from('config_versions')
      .select('*')
      .eq('id', versionId)
      .single();

    if (fetchError) throw fetchError;

    if (version.status !== 'APPROVED') {
      return formatApiResponse(null, {
        message: `Cannot publish version in ${version.status} status. Only APPROVED versions can be published.`,
        code: 'INVALID_STATE'
      });
    }

    const effectiveFromDate = effectiveFrom || new Date().toISOString();

    // Mark any previously published versions as SUPERSEDED
    await configClient
      .from('config_versions')
      .update({
        status: 'SUPERSEDED',
        effective_to: effectiveFromDate
      })
      .eq('package_id', version.package_id)
      .eq('status', 'PUBLISHED');

    // Publish the new version
    const { data: publishedVersion, error: publishError } = await configClient
      .from('config_versions')
      .update({
        status: 'PUBLISHED',
        effective_from: effectiveFromDate,
        published_at: new Date().toISOString(),
        published_by: publishedBy
      })
      .eq('id', versionId)
      .select()
      .single();

    if (publishError) throw publishError;

    return formatApiResponse(publishedVersion);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// ============================================================================
// CONFIG ITEMS API
// ============================================================================

/**
 * Add or update a config item in a draft version
 * POST /config/versions/:id/items
 */
export async function upsertConfigItem({
  tenantId,
  versionId,
  key,
  value,
  scope = null,
  description = null,
  validationRules = null,
  isSensitive = false,
  updatedBy = null
}) {
  try {
    // Validate the key format
    if (!validateConfigKey(key)) {
      return formatApiResponse(null, {
        message: `Invalid config key format: "${key}". Keys must be namespaced (e.g., policy.retail.max_contact_attempts)`,
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate and parse the value
    const valueResult = validateJsonValue(value);
    if (!valueResult.valid) {
      return formatApiResponse(null, {
        message: `Invalid value: ${valueResult.error}`,
        code: 'VALIDATION_ERROR'
      });
    }

    // Validate scope if provided
    if (scope) {
      const scopeResult = validateScope(scope);
      if (!scopeResult.valid) {
        return formatApiResponse(null, {
          message: scopeResult.error,
          code: 'VALIDATION_ERROR'
        });
      }
    }

    const configClient = getConfigClient();
    
    // Verify the version is in DRAFT status
    const { data: version, error: versionError } = await configClient
      .from('config_versions')
      .select('status')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    if (version.status !== 'DRAFT') {
      return formatApiResponse(null, {
        message: `Cannot modify config items in ${version.status} version. Only DRAFT versions can be edited.`,
        code: 'INVALID_STATE'
      });
    }

    // Upsert the config item
    const { data, error } = await configClient
      .from('config_items')
      .upsert(
        {
          tenant_id: tenantId,
          version_id: versionId,
          key,
          value_json: valueResult.json,
          value_type: valueResult.type,
          scope_json: scope,
          description,
          validation_rules: validationRules,
          is_sensitive: isSensitive,
          updated_by: updatedBy
        },
        {
          onConflict: 'tenant_id,version_id,key'
        }
      )
      .select()
      .single();

    if (error) throw error;
    return formatApiResponse(data);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Get all items for a version
 * GET /config/versions/:id/items
 */
export async function getConfigItems({ versionId, keyPrefix = null, page = 1, limit = 100 }) {
  try {
    const configClient = getConfigClient();
    let query = configClient
      .from('config_items')
      .select('*', { count: 'exact' })
      .eq('version_id', versionId)
      .order('key');

    if (keyPrefix) {
      query = query.like('key', `${keyPrefix}%`);
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
 * Delete a config item from a draft version
 * DELETE /config/versions/:versionId/items/:itemId
 */
export async function deleteConfigItem({ versionId, itemId }) {
  try {
    const configClient = getConfigClient();
    
    // Verify the version is in DRAFT status
    const { data: version, error: versionError } = await configClient
      .from('config_versions')
      .select('status')
      .eq('id', versionId)
      .single();

    if (versionError) throw versionError;

    if (version.status !== 'DRAFT') {
      return formatApiResponse(null, {
        message: `Cannot delete config items from ${version.status} version. Only DRAFT versions can be edited.`,
        code: 'INVALID_STATE'
      });
    }

    const { error } = await configClient
      .from('config_items')
      .delete()
      .eq('id', itemId)
      .eq('version_id', versionId);

    if (error) throw error;
    return formatApiResponse({ deleted: true });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// ============================================================================
// CONFIG RESOLUTION API
// ============================================================================

/**
 * Resolve effective config values for specified keys
 * GET /config/resolve
 * 
 * Returns the currently effective config values based on:
 * - Published versions
 * - Effective dating
 * - Scope filtering (optional)
 */
export async function resolveConfig({
  tenantId,
  keys = null,
  effectiveAt = null,
  scope = null
}) {
  try {
    const configClient = getConfigClient();
    
    // Use the database function for resolution
    const { data, error } = await configClient
      .rpc('resolve_config', {
        p_tenant_id: tenantId,
        p_keys: keys,
        p_effective_at: effectiveAt || new Date().toISOString(),
        p_scope_filter: scope
      });

    if (error) throw error;

    // Transform to a key-value map for easier consumption
    const configMap = {};
    const configDetails = [];

    for (const item of data || []) {
      configMap[item.key] = item.value_json;
      configDetails.push({
        key: item.key,
        value: item.value_json,
        type: item.value_type,
        scope: item.scope_json,
        package: item.package_name,
        version: item.version_no,
        effectiveFrom: item.effective_from
      });
    }

    return formatApiResponse({
      values: configMap,
      details: configDetails,
      resolvedAt: new Date().toISOString(),
      effectiveAt: effectiveAt || new Date().toISOString()
    });
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

/**
 * Get a single config value by key
 * GET /config/resolve/:key
 */
export async function resolveConfigKey({ tenantId, key, effectiveAt = null, scope = null }) {
  try {
    const result = await resolveConfig({
      tenantId,
      keys: [key],
      effectiveAt,
      scope
    });

    if (!result.success) {
      return result;
    }

    const item = result.data.details[0];
    if (!item) {
      return formatApiResponse(null, {
        message: `Config key "${key}" not found`,
        code: 'NOT_FOUND'
      });
    }

    return formatApiResponse(item);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// ============================================================================
// EFFECTIVE CONFIG VIEW
// ============================================================================

/**
 * Get all effective config for a tenant (using the materialized view)
 * GET /config/effective
 */
export async function getEffectiveConfig({ tenantId, keyPrefix = null, page = 1, limit = 100 }) {
  try {
    const configClient = getConfigClient();
    let query = configClient
      .from('effective_config_view')
      .select('*', { count: 'exact' })
      .eq('tenant_id', tenantId)
      .order('key');

    if (keyPrefix) {
      query = query.like('key', `${keyPrefix}%`);
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
// AUDIT LOG API
// ============================================================================

/**
 * Get config audit log
 * GET /config/audit
 */
export async function getConfigAuditLog({
  tenantId,
  objectType = null,
  objectId = null,
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
      .order('created_at', { ascending: false });

    if (objectType) {
      query = query.eq('object_type', objectType);
    }
    if (objectId) {
      query = query.eq('object_id', objectId);
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
// EXPORT DEFAULT SERVICE OBJECT
// ============================================================================

export const ConfigService = {
  // Packages
  createConfigPackage,
  getConfigPackages,
  getConfigPackage,
  updateConfigPackage,
  
  // Versions
  createConfigVersion,
  getConfigVersions,
  getConfigVersion,
  submitConfigVersion,
  publishConfigVersion,
  
  // Items
  upsertConfigItem,
  getConfigItems,
  deleteConfigItem,
  
  // Resolution
  resolveConfig,
  resolveConfigKey,
  getEffectiveConfig,
  
  // Audit
  getConfigAuditLog,
  
  // Validation utilities
  validateConfigKey,
  validateJsonValue,
  validateScope
};

export default ConfigService;
