/**
 * @osol/config-resolver
 * 
 * Service configuration resolver with effective dating and scope-based config selection.
 * 
 * Features:
 * - Resolves configuration values by tenant and keys
 * - Supports effective dating (chooses latest PUBLISHED version with effective_from <= now)
 * - Supports scope specificity (user > branch > region > tenant > global)
 * - Request-scoped caching for consistency within a single request
 * - Returns parsed value_json with type information
 * 
 * @example
 * ```js
 * import { createConfigResolver } from '@osol/config-resolver';
 * import { supabase } from './lib/supabase';
 * 
 * const resolver = createConfigResolver(supabase);
 * 
 * // Resolve multiple config keys
 * const configs = await resolver.resolveConfig(
 *   'tenant-123',
 *   ['feature.enabled', 'ui.theme', 'limits.maxItems'],
 *   { userId: 'user-456', branchId: 'branch-789' }
 * );
 * 
 * // Access resolved values
 * const themeConfig = configs.get('ui.theme');
 * console.log(themeConfig.value); // { primary: '#blue', ... }
 * console.log(themeConfig.type);  // 'object'
 * console.log(themeConfig.scope); // 'branch' (most specific match)
 * ```
 */

// Main resolver exports
export { 
  ConfigResolver, 
  createConfigResolver, 
  resolveConfig 
} from './resolver.js';

// Cache exports
export { 
  ConfigCache, 
  createRequestCache, 
  getOrCreateCache,
  CONFIG_CACHE_SYMBOL 
} from './cache.js';

// Type utilities and constants
export {
  SCOPE_PRIORITY,
  CONFIG_STATUS,
  getScopePriority,
  detectValueType,
  parseValue
} from './types.js';
