/**
 * Middleware Chain
 * 
 * Exports all middleware in the correct order of execution:
 * 1. request-id     - Generate/extract request ID
 * 2. auth           - Authenticate user (stub for now)
 * 3. tenant-context - Extract tenant ID from request
 * 4. db-context     - Create tenant-scoped DB client with set_config
 * 5. rbac           - Role-based access control
 */

export { requestIdMiddleware } from './request-id.js';
export { authMiddleware, requireAuth } from './auth.js';
export { 
  tenantContextMiddleware, 
  requireTenant, 
  validateTenantId,
  strictTenantValidation 
} from './tenant-context.js';
export { dbContextMiddleware, requireDb } from './db-context.js';
export { 
  requireRole, 
  requireAdmin, 
  requireManager, 
  requireSuperAdmin,
  hasRole,
  ROLE_LEVELS 
} from './rbac.js';

/**
 * Apply the standard middleware chain to an Express app
 * 
 * @param {import('express').Application} app
 */
export function applyMiddlewareChain(app) {
  const { requestIdMiddleware } = require('./request-id.js');
  const { authMiddleware } = require('./auth.js');
  const { tenantContextMiddleware } = require('./tenant-context.js');
  const { dbContextMiddleware } = require('./db-context.js');
  
  // Apply in priority order
  app.use(requestIdMiddleware);      // Priority 1
  app.use(authMiddleware);           // Priority 2
  app.use(tenantContextMiddleware);  // Priority 3
  app.use(dbContextMiddleware);      // Priority 4
  // RBAC is applied per-route, not globally
}
