/**
 * Request-scoped cache for configuration resolution
 * This cache is NOT global - each request context gets its own cache instance
 * to ensure consistency within a single request/transaction
 */

/**
 * Create a new request-scoped cache
 * @returns {ConfigCache}
 */
export function createRequestCache() {
  return new ConfigCache();
}

/**
 * Request-scoped configuration cache
 * Ensures that within a single request, the same config key always returns
 * the same value, even if the underlying data changes during the request
 */
export class ConfigCache {
  constructor() {
    /** @type {Map<string, *>} */
    this._cache = new Map();
    /** @type {Date} */
    this._createdAt = new Date();
    /** @type {boolean} */
    this._isInvalidated = false;
  }

  /**
   * Generate a cache key from tenant, config key, and context
   * @param {string} tenantId
   * @param {string} configKey
   * @param {Object} [contextScope]
   * @returns {string}
   */
  _generateCacheKey(tenantId, configKey, contextScope = {}) {
    const scopeParts = [
      tenantId,
      configKey,
      contextScope.userId || '',
      contextScope.branchId || '',
      contextScope.regionId || ''
    ];
    return scopeParts.join('::');
  }

  /**
   * Get a cached value
   * @param {string} tenantId
   * @param {string} configKey
   * @param {Object} [contextScope]
   * @returns {* | undefined}
   */
  get(tenantId, configKey, contextScope) {
    if (this._isInvalidated) {
      return undefined;
    }
    const cacheKey = this._generateCacheKey(tenantId, configKey, contextScope);
    return this._cache.get(cacheKey);
  }

  /**
   * Set a cached value
   * @param {string} tenantId
   * @param {string} configKey
   * @param {Object} [contextScope]
   * @param {*} value
   */
  set(tenantId, configKey, contextScope, value) {
    if (this._isInvalidated) {
      return;
    }
    const cacheKey = this._generateCacheKey(tenantId, configKey, contextScope);
    this._cache.set(cacheKey, value);
  }

  /**
   * Check if a value is cached
   * @param {string} tenantId
   * @param {string} configKey
   * @param {Object} [contextScope]
   * @returns {boolean}
   */
  has(tenantId, configKey, contextScope) {
    if (this._isInvalidated) {
      return false;
    }
    const cacheKey = this._generateCacheKey(tenantId, configKey, contextScope);
    return this._cache.has(cacheKey);
  }

  /**
   * Get multiple cached values at once
   * @param {string} tenantId
   * @param {string[]} configKeys
   * @param {Object} [contextScope]
   * @returns {{ cached: Map<string, *>, missing: string[] }}
   */
  getMany(tenantId, configKeys, contextScope) {
    const cached = new Map();
    const missing = [];

    for (const key of configKeys) {
      if (this.has(tenantId, key, contextScope)) {
        cached.set(key, this.get(tenantId, key, contextScope));
      } else {
        missing.push(key);
      }
    }

    return { cached, missing };
  }

  /**
   * Set multiple cached values at once
   * @param {string} tenantId
   * @param {Map<string, *>} values - Map of configKey to value
   * @param {Object} [contextScope]
   */
  setMany(tenantId, values, contextScope) {
    for (const [key, value] of values) {
      this.set(tenantId, key, contextScope, value);
    }
  }

  /**
   * Invalidate the entire cache
   * Once invalidated, the cache will not return any values
   */
  invalidate() {
    this._isInvalidated = true;
    this._cache.clear();
  }

  /**
   * Clear all cached values without invalidating
   */
  clear() {
    this._cache.clear();
  }

  /**
   * Get cache statistics
   * @returns {{ size: number, createdAt: Date, isInvalidated: boolean }}
   */
  getStats() {
    return {
      size: this._cache.size,
      createdAt: this._createdAt,
      isInvalidated: this._isInvalidated
    };
  }
}

/**
 * Symbol used to store cache on request context
 */
export const CONFIG_CACHE_SYMBOL = Symbol('configResolverCache');

/**
 * Get or create a cache from a request context object
 * @param {Object} [context] - Request context object
 * @returns {ConfigCache}
 */
export function getOrCreateCache(context) {
  if (!context) {
    // No context provided, create a new cache for this call
    return createRequestCache();
  }

  if (!context[CONFIG_CACHE_SYMBOL]) {
    context[CONFIG_CACHE_SYMBOL] = createRequestCache();
  }

  return context[CONFIG_CACHE_SYMBOL];
}
