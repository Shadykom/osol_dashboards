/**
 * Role-Based Access Control (RBAC) Middleware
 * 
 * Provides role-based authorization for API endpoints.
 * In development mode, allows bypass with x-dev-role header.
 * 
 * Roles hierarchy (highest to lowest):
 * - SUPER_ADMIN: Platform-level administrator
 * - ADMIN: Tenant administrator
 * - MANAGER: Department/branch manager
 * - USER: Regular user
 * - VIEWER: Read-only access
 */

import config from '../config/index.js';

const DEV_ROLE_HEADER = 'x-dev-role';

/**
 * Role hierarchy for permission checking
 * Higher number = more permissions
 */
const ROLE_LEVELS = {
  VIEWER: 1,
  USER: 2,
  MANAGER: 3,
  ADMIN: 4,
  SUPER_ADMIN: 5,
};

/**
 * Check if a user has the required role level
 * 
 * @param {string[]} userRoles - User's assigned roles
 * @param {string} requiredRole - Required role for access
 * @returns {boolean}
 */
export function hasRole(userRoles, requiredRole) {
  if (!userRoles || userRoles.length === 0) {
    return false;
  }
  
  const requiredLevel = ROLE_LEVELS[requiredRole] || 0;
  
  return userRoles.some(role => {
    const userLevel = ROLE_LEVELS[role] || 0;
    return userLevel >= requiredLevel;
  });
}

/**
 * Create a role requirement middleware
 * 
 * @param {string|string[]} roles - Required role(s)
 * @returns {import('express').RequestHandler}
 * 
 * @example
 * router.get('/admin', requireRole('ADMIN'), adminHandler);
 * router.post('/manage', requireRole(['ADMIN', 'MANAGER']), manageHandler);
 */
export function requireRole(roles) {
  const requiredRoles = Array.isArray(roles) ? roles : [roles];
  
  return (req, res, next) => {
    // Check for dev bypass header in development mode
    if (config.isDev && config.rbac.devBypassEnabled) {
      const devRole = req.get(DEV_ROLE_HEADER);
      if (devRole && requiredRoles.some(r => hasRole([devRole], r))) {
        // Inject dev role into user object
        if (req.user) {
          req.user.roles = [devRole];
        }
        return next();
      }
    }
    
    // Check if RBAC is enabled
    if (!config.rbac.enabled) {
      return next();
    }
    
    // Require authentication
    if (!req.isAuthenticated || !req.user) {
      return res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
        requestId: req.requestId,
      });
    }
    
    // Check user roles
    const userRoles = req.user.roles || [];
    const hasRequiredRole = requiredRoles.some(role => hasRole(userRoles, role));
    
    if (!hasRequiredRole) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `Insufficient permissions. Required role: ${requiredRoles.join(' or ')}`,
        requestId: req.requestId,
        hint: config.isDev ? `Use header 'x-dev-role: ADMIN' to bypass in development` : undefined,
      });
    }
    
    next();
  };
}

/**
 * Require ADMIN role middleware
 */
export const requireAdmin = requireRole('ADMIN');

/**
 * Require MANAGER role middleware
 */
export const requireManager = requireRole('MANAGER');

/**
 * Require SUPER_ADMIN role middleware
 */
export const requireSuperAdmin = requireRole('SUPER_ADMIN');

export default {
  hasRole,
  requireRole,
  requireAdmin,
  requireManager,
  requireSuperAdmin,
  ROLE_LEVELS,
};
