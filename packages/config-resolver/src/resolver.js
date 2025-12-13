/**
 * Configuration Resolver
 * Resolves effective configuration values based on tenant, keys, and context scope
 */

import { getScopePriority, parseValue, CONFIG_STATUS, SCOPE_PRIORITY } from './types.js';
import { getOrCreateCache } from './cache.js';

/**
 * Default configuration for the resolver
 */
const DEFAULT_CONFIG = {
  tableName: 'config_values',
  schema: 'kastle_banking'
};

/**
 * Create a config resolver instance
 * @param {Object} supabaseClient - Supabase client instance
 * @param {Object} [options] - Resolver options
 * @param {string} [options.tableName] - Configuration table name
 * @param {string} [options.schema] - Database schema
 * @returns {ConfigResolver}
 */
export function createConfigResolver(supabaseClient, options = {}) {
  return new ConfigResolver(supabaseClient, options);
}

/**
 * Configuration Resolver class
 */
export class ConfigResolver {
  /**
   * @param {Object} supabaseClient - Supabase client instance
   * @param {Object} [options] - Resolver options
   */
  constructor(supabaseClient, options = {}) {
    this.client = supabaseClient;
    this.tableName = options.tableName || DEFAULT_CONFIG.tableName;
    this.schema = options.schema || DEFAULT_CONFIG.schema;
  }

  /**
   * Resolve configuration values for given keys
   * 
   * @param {string} tenantId - Tenant identifier
   * @param {string[]} keys - Configuration keys to resolve
   * @param {Object} [contextScope] - Context scope for resolution
   * @param {string} [contextScope.userId] - User ID for user-level scope
   * @param {string} [contextScope.branchId] - Branch ID for branch-level scope
   * @param {string} [contextScope.regionId] - Region ID for region-level scope
   * @param {Object} [requestContext] - Request context for caching
   * @returns {Promise<Map<string, ResolvedConfigValue>>}
   */
  async resolveConfig(tenantId, keys, contextScope = {}, requestContext = null) {
    if (!tenantId) {
      throw new Error('tenantId is required');
    }

    if (!Array.isArray(keys) || keys.length === 0) {
      throw new Error('keys must be a non-empty array');
    }

    // Get or create request-scoped cache
    const cache = getOrCreateCache(requestContext);

    // Check cache for already resolved values
    const { cached, missing } = cache.getMany(tenantId, keys, contextScope);

    // If all values are cached, return them
    if (missing.length === 0) {
      return cached;
    }

    // Fetch missing values from database
    const fetchedValues = await this._fetchConfigs(tenantId, missing, contextScope);

    // Cache the fetched values
    cache.setMany(tenantId, fetchedValues, contextScope);

    // Merge cached and fetched values
    const result = new Map([...cached, ...fetchedValues]);

    return result;
  }

  /**
   * Resolve a single configuration value
   * 
   * @param {string} tenantId - Tenant identifier
   * @param {string} key - Configuration key to resolve
   * @param {Object} [contextScope] - Context scope for resolution
   * @param {Object} [requestContext] - Request context for caching
   * @returns {Promise<ResolvedConfigValue | null>}
   */
  async resolveOne(tenantId, key, contextScope = {}, requestContext = null) {
    const result = await this.resolveConfig(tenantId, [key], contextScope, requestContext);
    return result.get(key) || null;
  }

  /**
   * Fetch configurations from the database
   * @private
   * @param {string} tenantId
   * @param {string[]} keys
   * @param {Object} contextScope
   * @returns {Promise<Map<string, ResolvedConfigValue>>}
   */
  async _fetchConfigs(tenantId, keys, contextScope) {
    const now = new Date().toISOString();

    // Build the combined filter conditions
    // We need configs where:
    // 1. tenant_id matches
    // 2. key is in the requested keys
    // 3. status is PUBLISHED
    // 4. effective_from <= now
    // 5. effective_to is null OR effective_to > now
    // 6. scope matches context (global, tenant, or specific scope with matching scope_id)
    const scopeConditions = this._buildScopeConditions(contextScope);
    
    // Combine effective_to and scope conditions into a single OR filter
    // The scope conditions already include all valid scopes
    const combinedFilter = scopeConditions.join(',');

    // Query for all matching configurations
    const { data, error } = await this.client
      .from(this.tableName)
      .select('*')
      .eq('tenant_id', tenantId)
      .in('key', keys)
      .eq('status', CONFIG_STATUS.PUBLISHED)
      .lte('effective_from', now)
      .or(combinedFilter);

    if (error) {
      throw new Error(`Failed to fetch configurations: ${error.message}`);
    }

    // Filter by effective_to in memory (simpler than complex OR conditions)
    const validData = (data || []).filter(row => {
      if (!row.effective_to) return true;
      return new Date(row.effective_to) > new Date(now);
    });

    // Process and select the best match for each key
    return this._selectBestConfigs(validData, keys, contextScope);
  }

  /**
   * Build scope conditions for the query
   * @private
   * @param {Object} contextScope
   * @returns {string[]}
   */
  _buildScopeConditions(contextScope) {
    const conditions = [];

    // Always include global scope
    conditions.push('scope.eq.global');

    // Always include tenant scope (no scope_id needed)
    conditions.push('scope.eq.tenant');

    // Add region scope if regionId provided
    if (contextScope.regionId) {
      conditions.push(`and(scope.eq.region,scope_id.eq.${contextScope.regionId})`);
    }

    // Add branch scope if branchId provided
    if (contextScope.branchId) {
      conditions.push(`and(scope.eq.branch,scope_id.eq.${contextScope.branchId})`);
    }

    // Add user scope if userId provided
    if (contextScope.userId) {
      conditions.push(`and(scope.eq.user,scope_id.eq.${contextScope.userId})`);
    }

    return conditions;
  }

  /**
   * Select the best configuration for each key based on scope specificity and effective date
   * @private
   * @param {ConfigRow[]} rows
   * @param {string[]} keys
   * @param {Object} contextScope
   * @returns {Map<string, ResolvedConfigValue>}
   */
  _selectBestConfigs(rows, keys, contextScope) {
    const result = new Map();

    // Group rows by key
    const rowsByKey = new Map();
    for (const row of rows) {
      if (!rowsByKey.has(row.key)) {
        rowsByKey.set(row.key, []);
      }
      rowsByKey.get(row.key).push(row);
    }

    // For each key, select the best match
    for (const key of keys) {
      const candidates = rowsByKey.get(key) || [];
      
      if (candidates.length === 0) {
        continue;
      }

      // Filter candidates that match the context scope
      const validCandidates = candidates.filter(row => 
        this._isScopeMatch(row, contextScope)
      );

      if (validCandidates.length === 0) {
        continue;
      }

      // Sort by:
      // 1. Scope specificity (most specific first)
      // 2. Effective date (latest first)
      // 3. Version (highest first)
      validCandidates.sort((a, b) => {
        // Compare scope priority (lower = more specific)
        const scopeDiff = getScopePriority(a.scope) - getScopePriority(b.scope);
        if (scopeDiff !== 0) {
          return scopeDiff;
        }

        // Compare effective_from (more recent first)
        const dateA = new Date(a.effective_from);
        const dateB = new Date(b.effective_from);
        const dateDiff = dateB.getTime() - dateA.getTime();
        if (dateDiff !== 0) {
          return dateDiff;
        }

        // Compare version (higher first)
        return (b.version || 0) - (a.version || 0);
      });

      // Select the best candidate
      const bestMatch = validCandidates[0];
      const { value, type } = parseValue(bestMatch.value_json, bestMatch.value_type);

      result.set(key, {
        key: bestMatch.key,
        value,
        type,
        scope: bestMatch.scope,
        scopeId: bestMatch.scope_id,
        version: bestMatch.version,
        effectiveFrom: new Date(bestMatch.effective_from),
        metadata: bestMatch.metadata || {}
      });
    }

    return result;
  }

  /**
   * Check if a configuration row matches the given context scope
   * @private
   * @param {ConfigRow} row
   * @param {Object} contextScope
   * @returns {boolean}
   */
  _isScopeMatch(row, contextScope) {
    switch (row.scope) {
      case 'global':
        // Global scope always matches
        return true;

      case 'tenant':
        // Tenant scope always matches (tenant_id already filtered in query)
        return true;

      case 'region':
        // Region scope matches if regionId matches or no regionId in context
        return !row.scope_id || row.scope_id === contextScope.regionId;

      case 'branch':
        // Branch scope matches if branchId matches
        return row.scope_id === contextScope.branchId;

      case 'user':
        // User scope matches if userId matches
        return row.scope_id === contextScope.userId;

      default:
        return false;
    }
  }
}

/**
 * Standalone function to resolve configuration
 * Creates a one-time resolver for simple use cases
 * 
 * @param {Object} supabaseClient - Supabase client instance
 * @param {string} tenantId - Tenant identifier
 * @param {string[]} keys - Configuration keys to resolve
 * @param {Object} [contextScope] - Context scope for resolution
 * @param {Object} [options] - Resolver options
 * @returns {Promise<Map<string, ResolvedConfigValue>>}
 */
export async function resolveConfig(supabaseClient, tenantId, keys, contextScope = {}, options = {}) {
  const resolver = createConfigResolver(supabaseClient, options);
  return resolver.resolveConfig(tenantId, keys, contextScope);
}
