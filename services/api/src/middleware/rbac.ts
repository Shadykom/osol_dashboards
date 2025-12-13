/**
 * RBAC Middleware (Placeholder for EPIC 1)
 * 
 * Role-Based Access Control placeholder that:
 * - Provides permission checking helpers
 * - Logs permission checks
 * - Does NOT enforce permissions in EPIC 1 (stubbed)
 * 
 * TODO: Implement full RBAC with:
 * - Role definitions from database
 * - Permission hierarchy
 * - Resource-level access control
 * - Audit logging for access decisions
 */

import type { FastifyPluginCallback, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { ForbiddenError, type UserRole } from '@cms/common';
import { isDevelopment } from '../config/index.js';

// ============================================================================
// Permission Types
// ============================================================================

export type Permission = string; // Format: "action:resource" e.g., "read:cases"

export interface RBACOptions {
  /**
   * Required permissions for access (OR logic - any one is sufficient)
   */
  permissions?: Permission[];
  
  /**
   * Required roles for access (OR logic - any one is sufficient)
   */
  roles?: UserRole[];
  
  /**
   * If true, all permissions must be present (AND logic)
   */
  requireAll?: boolean;
}

// ============================================================================
// Role Hierarchy (placeholder)
// ============================================================================

const ROLE_HIERARCHY: Record<UserRole, UserRole[]> = {
  super_admin: ['tenant_admin', 'manager', 'supervisor', 'officer', 'readonly'],
  tenant_admin: ['manager', 'supervisor', 'officer', 'readonly'],
  manager: ['supervisor', 'officer', 'readonly'],
  supervisor: ['officer', 'readonly'],
  officer: ['readonly'],
  readonly: [],
};

// ============================================================================
// Permission Check Helpers
// ============================================================================

export function hasRole(userRole: UserRole | undefined, requiredRole: UserRole): boolean {
  if (!userRole) return false;
  if (userRole === requiredRole) return true;
  return ROLE_HIERARCHY[userRole]?.includes(requiredRole) ?? false;
}

export function hasPermission(
  userPermissions: string[] | undefined,
  requiredPermission: Permission
): boolean {
  if (!userPermissions) return false;
  return userPermissions.includes(requiredPermission) || userPermissions.includes('*');
}

export function hasAnyPermission(
  userPermissions: string[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some(p => hasPermission(userPermissions, p));
}

export function hasAllPermissions(
  userPermissions: string[] | undefined,
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every(p => hasPermission(userPermissions, p));
}

// ============================================================================
// Plugin Implementation
// ============================================================================

const rbacPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  // Decorate fastify with RBAC helpers
  fastify.decorate('checkPermissions', (request: FastifyRequest, options: RBACOptions) => {
    return checkPermissions(request, options);
  });

  fastify.decorate('requirePermissions', (options: RBACOptions) => {
    return requirePermissions(options);
  });

  done();
};

// ============================================================================
// Extend Fastify Types
// ============================================================================

declare module 'fastify' {
  interface FastifyInstance {
    checkPermissions: (request: FastifyRequest, options: RBACOptions) => boolean;
    requirePermissions: (options: RBACOptions) => (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
}

// ============================================================================
// Permission Check Implementation
// ============================================================================

function checkPermissions(request: FastifyRequest, options: RBACOptions): boolean {
  const { permissions, roles, requireAll } = options;
  const user = request.user;

  // No user = no permissions (unless in dev mode and we're lenient)
  if (!user) {
    if (isDevelopment()) {
      request.log.warn('RBAC: No user in request, allowing in development mode');
      return true;
    }
    return false;
  }

  // Check roles if specified
  if (roles && roles.length > 0) {
    const hasRequiredRole = roles.some(role => hasRole(user.role, role));
    if (hasRequiredRole) {
      request.log.debug({ role: user.role }, 'RBAC: Role check passed');
      return true;
    }
  }

  // Check permissions if specified
  if (permissions && permissions.length > 0) {
    const hasPerms = requireAll
      ? hasAllPermissions(user.permissions, permissions)
      : hasAnyPermission(user.permissions, permissions);
    
    if (hasPerms) {
      request.log.debug({ permissions: user.permissions }, 'RBAC: Permission check passed');
      return true;
    }
  }

  // If no roles or permissions specified, allow access
  if (!roles?.length && !permissions?.length) {
    return true;
  }

  // EPIC 1 STUB: In development, log warning but allow access
  if (isDevelopment()) {
    request.log.warn(
      { 
        userRole: user.role, 
        userPermissions: user.permissions,
        requiredRoles: roles,
        requiredPermissions: permissions,
      },
      'RBAC: Permission check failed, but allowing in development mode'
    );
    return true;
  }

  return false;
}

function requirePermissions(options: RBACOptions) {
  return async (request: FastifyRequest, reply: FastifyReply): Promise<void> => {
    const allowed = checkPermissions(request, options);
    
    if (!allowed) {
      throw new ForbiddenError('Insufficient permissions', {
        required: options.permissions || options.roles,
      });
    }
  };
}

export const rbacMiddleware = fp(rbacPlugin, {
  name: 'rbac',
  fastify: '5.x',
  dependencies: ['auth'], // Depends on auth being set first
});
