/**
 * Configuration value types
 * @typedef {'string' | 'number' | 'boolean' | 'object' | 'array'} ConfigValueType
 */

/**
 * Configuration scope levels (from most specific to least specific)
 * @typedef {'user' | 'branch' | 'region' | 'tenant' | 'global'} ConfigScope
 */

/**
 * Configuration status
 * @typedef {'DRAFT' | 'PUBLISHED' | 'ARCHIVED'} ConfigStatus
 */

/**
 * Context scope for resolving configuration
 * @typedef {Object} ContextScope
 * @property {string} [userId] - User ID for user-level scope
 * @property {string} [branchId] - Branch ID for branch-level scope
 * @property {string} [regionId] - Region ID for region-level scope
 */

/**
 * Resolved configuration value
 * @typedef {Object} ResolvedConfigValue
 * @property {string} key - Configuration key
 * @property {*} value - Parsed configuration value
 * @property {ConfigValueType} type - Type of the configuration value
 * @property {ConfigScope} scope - Scope at which the value was resolved
 * @property {string} version - Version identifier
 * @property {Date} effectiveFrom - When this configuration became effective
 * @property {Object} [metadata] - Additional metadata about the configuration
 */

/**
 * Raw configuration row from database
 * @typedef {Object} ConfigRow
 * @property {string} id - Configuration ID
 * @property {string} tenant_id - Tenant ID
 * @property {string} key - Configuration key
 * @property {*} value_json - JSON value
 * @property {ConfigValueType} value_type - Type of the value
 * @property {ConfigScope} scope - Scope level
 * @property {string} [scope_id] - ID for the scope (e.g., user_id, branch_id)
 * @property {string} status - Configuration status (DRAFT, PUBLISHED, ARCHIVED)
 * @property {number} version - Version number
 * @property {string} effective_from - Effective from date/time
 * @property {string} [effective_to] - Effective to date/time (optional)
 * @property {Object} [metadata] - Additional metadata
 * @property {string} created_at - Creation timestamp
 * @property {string} updated_at - Update timestamp
 */

/**
 * Scope priority order (lower index = higher priority)
 */
export const SCOPE_PRIORITY = ['user', 'branch', 'region', 'tenant', 'global'];

/**
 * Valid configuration statuses
 */
export const CONFIG_STATUS = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED'
};

/**
 * Get scope priority (lower = more specific)
 * @param {ConfigScope} scope
 * @returns {number}
 */
export function getScopePriority(scope) {
  const index = SCOPE_PRIORITY.indexOf(scope);
  return index === -1 ? SCOPE_PRIORITY.length : index;
}

/**
 * Detect the type of a value
 * @param {*} value
 * @returns {ConfigValueType}
 */
export function detectValueType(value) {
  if (value === null || value === undefined) {
    return 'object';
  }
  if (Array.isArray(value)) {
    return 'array';
  }
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') {
    return type;
  }
  return 'object';
}

/**
 * Parse a value according to its type
 * @param {*} valueJson - The raw JSON value
 * @param {ConfigValueType} [declaredType] - The declared type (optional)
 * @returns {{ value: *, type: ConfigValueType }}
 */
export function parseValue(valueJson, declaredType) {
  const detectedType = detectValueType(valueJson);
  const type = declaredType || detectedType;
  
  // Coerce value to declared type if needed
  let value = valueJson;
  
  if (declaredType && declaredType !== detectedType) {
    switch (declaredType) {
      case 'string':
        value = String(valueJson);
        break;
      case 'number':
        value = Number(valueJson);
        if (isNaN(value)) value = 0;
        break;
      case 'boolean':
        value = Boolean(valueJson);
        break;
      case 'array':
        value = Array.isArray(valueJson) ? valueJson : [valueJson];
        break;
      case 'object':
        value = typeof valueJson === 'object' ? valueJson : { value: valueJson };
        break;
    }
  }
  
  return { value, type };
}
