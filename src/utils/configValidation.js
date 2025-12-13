/**
 * EPIC 2: Configuration Validation Utilities
 * 
 * Provides validation functions for configuration management:
 * - Key format validation (namespaced keys)
 * - Value JSON validation
 * - Scope validation
 * - Business rule validation
 */

// ============================================================================
// KEY VALIDATION
// ============================================================================

/**
 * Valid key namespace prefixes and their descriptions
 */
export const KEY_NAMESPACES = {
  'system': 'System-level configuration',
  'policy': 'Business policy settings',
  'scoring': 'Scoring and risk configuration',
  'buckets': 'Delinquency bucket definitions',
  'notification': 'Notification settings',
  'workflow': 'Workflow configuration',
  'audit': 'Audit settings',
  'dialer': 'Auto-dialer settings',
  'agent': 'Agent workload settings',
  'templates': 'Template configurations',
  'product': 'Product-specific settings',
  'integration': 'External integration settings',
  'feature': 'Feature flags and toggles',
  'ui': 'User interface settings',
  'report': 'Reporting configuration'
};

/**
 * Validate config key format
 * Keys must be namespaced with at least two parts separated by dots
 * Pattern: namespace.category.name or namespace.name
 * 
 * @param {string} key - The config key to validate
 * @returns {{ valid: boolean, error?: string, namespace?: string }}
 */
export function validateConfigKey(key) {
  if (!key || typeof key !== 'string') {
    return { valid: false, error: 'Key must be a non-empty string' };
  }

  if (key.length > 255) {
    return { valid: false, error: 'Key must not exceed 255 characters' };
  }

  // Must match pattern: lowercase letters, numbers, underscores, with dots as separators
  const pattern = /^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$/;
  if (!pattern.test(key)) {
    return {
      valid: false,
      error: 'Key must be namespaced (e.g., "policy.retail.max_contact_attempts"). ' +
             'Use lowercase letters, numbers, and underscores, separated by dots.'
    };
  }

  // Extract and validate namespace
  const parts = key.split('.');
  const namespace = parts[0];

  // Warn if using unknown namespace (but allow it)
  const isKnownNamespace = namespace in KEY_NAMESPACES;
  
  return {
    valid: true,
    namespace,
    parts,
    isKnownNamespace,
    warning: !isKnownNamespace ? `Unknown namespace: "${namespace}". Known namespaces: ${Object.keys(KEY_NAMESPACES).join(', ')}` : undefined
  };
}

/**
 * Generate a valid key from parts
 * @param {...string} parts - Key parts to join
 * @returns {string}
 */
export function makeKey(...parts) {
  return parts
    .map(p => p.toLowerCase().replace(/[^a-z0-9_]/g, '_'))
    .join('.');
}

// ============================================================================
// VALUE VALIDATION
// ============================================================================

/**
 * Validate and parse a JSON value
 * @param {*} value - The value to validate
 * @returns {{ valid: boolean, parsed?: any, type?: string, json?: string, error?: string }}
 */
export function validateJsonValue(value) {
  try {
    let parsed;
    let valueType;

    if (value === undefined) {
      return { valid: false, error: 'Value is required' };
    }

    if (value === null) {
      return {
        valid: true,
        parsed: null,
        type: 'object',
        json: 'null'
      };
    }

    if (typeof value === 'string') {
      // Try to parse as JSON
      try {
        parsed = JSON.parse(value);
      } catch {
        // If it's not valid JSON, treat it as a raw string value
        // and wrap it in quotes for storage
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
        if (!Number.isFinite(parsed)) {
          return { valid: false, error: 'Number must be finite (not Infinity or NaN)' };
        }
        valueType = 'number';
      } else if (typeof parsed === 'object') {
        valueType = 'object';
      } else {
        valueType = 'string';
      }
    }

    // Serialize to JSON
    const json = JSON.stringify(parsed);

    // Check size limit (1MB)
    if (json.length > 1024 * 1024) {
      return { valid: false, error: 'Value too large (max 1MB)' };
    }

    return {
      valid: true,
      parsed,
      type: valueType,
      json
    };
  } catch (error) {
    return {
      valid: false,
      error: `Invalid value: ${error.message}`
    };
  }
}

/**
 * Validate that a value matches a specific type
 * @param {*} value - The value to check
 * @param {string} expectedType - Expected type (string, number, boolean, object, array)
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateValueType(value, expectedType) {
  const result = validateJsonValue(value);
  if (!result.valid) {
    return result;
  }

  if (result.type !== expectedType) {
    return {
      valid: false,
      error: `Expected ${expectedType} but got ${result.type}`
    };
  }

  return { valid: true };
}

// ============================================================================
// SCOPE VALIDATION
// ============================================================================

/**
 * Valid scope keys and their descriptions
 */
export const SCOPE_KEYS = {
  'portfolio': 'Portfolio type (e.g., retail, corporate, sme)',
  'product': 'Product identifier (e.g., personal_loan, credit_card)',
  'bucket': 'Delinquency bucket (e.g., B1, B2, B3)',
  'branch': 'Branch identifier',
  'region': 'Geographic region',
  'channel': 'Collection channel (e.g., call, sms, email)'
};

/**
 * Validate scope JSON
 * @param {*} scope - The scope to validate
 * @returns {{ valid: boolean, parsed?: object, error?: string, warnings?: string[] }}
 */
export function validateScope(scope) {
  if (scope === null || scope === undefined || scope === '') {
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
      return { valid: false, error: 'Scope must be a JSON object (not an array)' };
    }

    // Collect warnings for unknown keys
    const warnings = [];
    const scopeKeys = Object.keys(parsed);
    
    for (const key of scopeKeys) {
      if (!(key in SCOPE_KEYS)) {
        warnings.push(`Unknown scope key: "${key}". Valid keys: ${Object.keys(SCOPE_KEYS).join(', ')}`);
      }
      
      // Scope values should be strings or arrays of strings
      const value = parsed[key];
      if (value !== null && typeof value !== 'string' && !Array.isArray(value)) {
        return {
          valid: false,
          error: `Scope value for "${key}" must be a string or array of strings`
        };
      }
      
      if (Array.isArray(value)) {
        for (const item of value) {
          if (typeof item !== 'string') {
            return {
              valid: false,
              error: `Scope array for "${key}" must contain only strings`
            };
          }
        }
      }
    }

    return {
      valid: true,
      parsed,
      warnings: warnings.length > 0 ? warnings : undefined
    };
  } catch (error) {
    return { valid: false, error: `Invalid scope JSON: ${error.message}` };
  }
}

/**
 * Check if a scope matches a filter
 * @param {object} itemScope - The scope on the config item
 * @param {object} filterScope - The filter scope to match against
 * @returns {boolean}
 */
export function scopeMatches(itemScope, filterScope) {
  // No scope on item means it matches everything
  if (!itemScope) return true;
  
  // No filter means match everything
  if (!filterScope) return true;

  // Check each filter key
  for (const [key, filterValue] of Object.entries(filterScope)) {
    const itemValue = itemScope[key];
    
    // If item doesn't have this scope key, it matches (less specific)
    if (itemValue === undefined || itemValue === null) continue;

    // Handle array values
    if (Array.isArray(itemValue)) {
      if (Array.isArray(filterValue)) {
        // Both arrays - check for intersection
        if (!itemValue.some(v => filterValue.includes(v))) {
          return false;
        }
      } else {
        // Item is array, filter is single value
        if (!itemValue.includes(filterValue)) {
          return false;
        }
      }
    } else {
      if (Array.isArray(filterValue)) {
        // Item is single value, filter is array
        if (!filterValue.includes(itemValue)) {
          return false;
        }
      } else {
        // Both single values
        if (itemValue !== filterValue) {
          return false;
        }
      }
    }
  }

  return true;
}

// ============================================================================
// VALIDATION RULES
// ============================================================================

/**
 * Built-in validation rules for config values
 */
export const VALIDATION_RULES = {
  /**
   * Minimum value (for numbers)
   */
  min: (value, minValue) => {
    if (typeof value !== 'number') return { valid: false, error: 'Value must be a number' };
    return value >= minValue ? { valid: true } : { valid: false, error: `Value must be >= ${minValue}` };
  },

  /**
   * Maximum value (for numbers)
   */
  max: (value, maxValue) => {
    if (typeof value !== 'number') return { valid: false, error: 'Value must be a number' };
    return value <= maxValue ? { valid: true } : { valid: false, error: `Value must be <= ${maxValue}` };
  },

  /**
   * Value in range (for numbers)
   */
  range: (value, [minValue, maxValue]) => {
    if (typeof value !== 'number') return { valid: false, error: 'Value must be a number' };
    return value >= minValue && value <= maxValue
      ? { valid: true }
      : { valid: false, error: `Value must be between ${minValue} and ${maxValue}` };
  },

  /**
   * Minimum length (for strings/arrays)
   */
  minLength: (value, minLen) => {
    const len = value?.length ?? 0;
    return len >= minLen ? { valid: true } : { valid: false, error: `Length must be >= ${minLen}` };
  },

  /**
   * Maximum length (for strings/arrays)
   */
  maxLength: (value, maxLen) => {
    const len = value?.length ?? 0;
    return len <= maxLen ? { valid: true } : { valid: false, error: `Length must be <= ${maxLen}` };
  },

  /**
   * Pattern match (for strings)
   */
  pattern: (value, pattern) => {
    if (typeof value !== 'string') return { valid: false, error: 'Value must be a string' };
    const regex = new RegExp(pattern);
    return regex.test(value) ? { valid: true } : { valid: false, error: `Value must match pattern: ${pattern}` };
  },

  /**
   * Enum validation
   */
  enum: (value, allowedValues) => {
    return allowedValues.includes(value)
      ? { valid: true }
      : { valid: false, error: `Value must be one of: ${allowedValues.join(', ')}` };
  },

  /**
   * Required fields (for objects)
   */
  required: (value, requiredFields) => {
    if (typeof value !== 'object' || value === null) {
      return { valid: false, error: 'Value must be an object' };
    }
    const missing = requiredFields.filter(f => !(f in value));
    return missing.length === 0
      ? { valid: true }
      : { valid: false, error: `Missing required fields: ${missing.join(', ')}` };
  }
};

/**
 * Apply validation rules to a value
 * @param {*} value - The value to validate
 * @param {object} rules - Object of rule name to rule argument
 * @returns {{ valid: boolean, errors?: string[] }}
 */
export function applyValidationRules(value, rules) {
  if (!rules || typeof rules !== 'object') {
    return { valid: true };
  }

  const errors = [];

  for (const [ruleName, ruleArg] of Object.entries(rules)) {
    const ruleFn = VALIDATION_RULES[ruleName];
    if (!ruleFn) {
      console.warn(`Unknown validation rule: ${ruleName}`);
      continue;
    }

    const result = ruleFn(value, ruleArg);
    if (!result.valid) {
      errors.push(result.error);
    }
  }

  return errors.length === 0
    ? { valid: true }
    : { valid: false, errors };
}

// ============================================================================
// BULK VALIDATION
// ============================================================================

/**
 * Validate a batch of config items
 * @param {Array<{key: string, value: any, scope?: object}>} items
 * @returns {{ valid: boolean, results: Array<{key: string, valid: boolean, errors?: string[]}> }}
 */
export function validateConfigBatch(items) {
  const results = items.map(item => {
    const errors = [];
    
    // Validate key
    const keyResult = validateConfigKey(item.key);
    if (!keyResult.valid) {
      errors.push(`Key: ${keyResult.error}`);
    }
    
    // Validate value
    const valueResult = validateJsonValue(item.value);
    if (!valueResult.valid) {
      errors.push(`Value: ${valueResult.error}`);
    }
    
    // Validate scope
    if (item.scope) {
      const scopeResult = validateScope(item.scope);
      if (!scopeResult.valid) {
        errors.push(`Scope: ${scopeResult.error}`);
      }
    }
    
    return {
      key: item.key,
      valid: errors.length === 0,
      errors: errors.length > 0 ? errors : undefined
    };
  });

  return {
    valid: results.every(r => r.valid),
    results
  };
}

// ============================================================================
// EXPORT
// ============================================================================

export default {
  // Key validation
  validateConfigKey,
  makeKey,
  KEY_NAMESPACES,
  
  // Value validation
  validateJsonValue,
  validateValueType,
  
  // Scope validation
  validateScope,
  scopeMatches,
  SCOPE_KEYS,
  
  // Validation rules
  VALIDATION_RULES,
  applyValidationRules,
  
  // Bulk validation
  validateConfigBatch
};
