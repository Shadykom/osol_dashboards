/**
 * Auth Middleware (Placeholder for EPIC 1)
 * 
 * In EPIC 1, this is a stub that:
 * - Allows requests through in development mode
 * - Checks for Authorization header presence in production
 * - Does NOT validate tokens (will be implemented in later epics)
 * 
 * TODO: Implement full JWT validation with:
 * - Token signature verification
 * - Token expiration check
 * - Tenant claim extraction
 * - User permissions extraction
 */

import type { FastifyPluginCallback, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { UnauthorizedError, type AuthPayload, type UserRole } from '@cms/common';
import { isDevelopment } from '../config/index.js';

// ============================================================================
// Extend Fastify Types
// ============================================================================

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthPayload;
    isAuthenticated: boolean;
  }
}

// ============================================================================
// Skip Paths (no auth required)
// ============================================================================

const SKIP_PATHS = new Set([
  '/health',
  '/ready',
  '/metrics',
  '/docs',
  '/openapi.json',
]);

function shouldSkip(path: string): boolean {
  if (SKIP_PATHS.has(path)) {
    return true;
  }
  if (path.startsWith('/docs/')) {
    return true;
  }
  return false;
}

// ============================================================================
// Plugin Implementation
// ============================================================================

const authPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip auth for health endpoints
    if (shouldSkip(request.url)) {
      request.isAuthenticated = false;
      return;
    }

    // In development mode, create a stub user for testing
    if (isDevelopment()) {
      // Check if Authorization header is provided (even in dev)
      const authHeader = request.headers.authorization;
      
      if (authHeader) {
        // In dev mode, attempt to parse token but don't validate signature
        // This is a PLACEHOLDER - real implementation will validate JWT
        request.user = createStubUser(request.tenantId);
        request.isAuthenticated = true;
        request.log.debug({ userId: request.user.userId }, 'Auth stub: user authenticated');
      } else {
        // In dev mode, allow requests without auth for easier testing
        request.user = createStubUser(request.tenantId);
        request.isAuthenticated = true;
        request.log.debug('Auth stub: using development user');
      }
      return;
    }

    // In production, require Authorization header
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header required');
    }

    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format');
    }

    const token = authHeader.substring(7);
    
    if (!token) {
      throw new UnauthorizedError('Token not provided');
    }

    // TODO: Implement actual JWT validation
    // For now in EPIC 1, we just check that a token is present
    // The actual validation will be implemented in a later epic
    
    // Placeholder: create stub user
    // In production, this should be replaced with actual token validation
    request.user = createStubUser(request.tenantId);
    request.isAuthenticated = true;
    
    request.log.warn('Auth middleware is using stub implementation - implement JWT validation');
  });

  done();
};

// ============================================================================
// Stub User Creator (for development/placeholder)
// ============================================================================

function createStubUser(tenantId: string): AuthPayload {
  return {
    userId: '00000000-0000-0000-0000-000000000001',
    tenantId,
    email: 'dev@cms.local',
    role: 'tenant_admin' as UserRole,
    permissions: [
      'read:cases',
      'write:cases',
      'read:customers',
      'write:customers',
      'read:reports',
      'manage:team',
    ],
    exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour from now
    iat: Math.floor(Date.now() / 1000),
  };
}

export const authMiddleware = fp(authPlugin, {
  name: 'auth',
  fastify: '5.x',
  dependencies: ['tenantContext'], // Depends on tenant being set first
});
