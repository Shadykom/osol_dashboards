/**
 * Tenant Context Middleware
 * Extracts tenant ID from request and establishes tenant context
 * 
 * Multi-tenancy is a NON-NEGOTIABLE requirement:
 * - Every request MUST have a tenant context (except health endpoints)
 * - In development, x-tenant-id header or DEFAULT_TENANT_FOR_DEV is used
 * - In production, tenant comes from JWT token claim
 */

import type { FastifyPluginCallback, FastifyRequest, FastifyReply } from 'fastify';
import fp from 'fastify-plugin';
import { 
  TenantRequiredError, 
  createContext, 
  runWithContextAsync,
  type RequestContext 
} from '@cms/common';
import { getConfig, isDevelopment } from '../config/index.js';

// ============================================================================
// Tenant Header
// ============================================================================

const TENANT_ID_HEADER = 'x-tenant-id';

// ============================================================================
// Extend Fastify Types
// ============================================================================

declare module 'fastify' {
  interface FastifyRequest {
    tenantId: string;
    requestContext: RequestContext;
  }
}

// ============================================================================
// Skip Paths (no tenant context required)
// ============================================================================

const SKIP_PATHS = new Set([
  '/health',
  '/ready',
  '/metrics',
  '/docs',
  '/openapi.json',
]);

function shouldSkip(path: string): boolean {
  // Exact match
  if (SKIP_PATHS.has(path)) {
    return true;
  }
  // Prefix match for docs paths
  if (path.startsWith('/docs/')) {
    return true;
  }
  return false;
}

// ============================================================================
// Plugin Implementation
// ============================================================================

const tenantContextPlugin: FastifyPluginCallback = (fastify, _opts, done) => {
  fastify.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Skip tenant context for health/ready endpoints
    if (shouldSkip(request.url)) {
      return;
    }

    let tenantId: string | undefined;

    // In development mode, allow x-tenant-id header
    if (isDevelopment()) {
      tenantId = request.headers[TENANT_ID_HEADER] as string | undefined;
      
      // Fall back to default tenant for development
      if (!tenantId) {
        const config = getConfig();
        tenantId = config.defaultTenantForDev;
      }
    }

    // In production, tenant comes from auth payload (set by auth middleware)
    // For now, we also check the header in non-dev for testing
    if (!tenantId) {
      tenantId = request.headers[TENANT_ID_HEADER] as string | undefined;
    }

    // TODO: In production, extract tenant from JWT claim
    // if (!tenantId && request.user?.tenantId) {
    //   tenantId = request.user.tenantId;
    // }

    // Tenant is REQUIRED (except for skipped paths)
    if (!tenantId) {
      throw new TenantRequiredError();
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(tenantId)) {
      throw new TenantRequiredError();
    }

    // Create request context
    const requestContext = createContext({
      tenantId,
      requestId: request.requestId,
      correlationId: request.correlationId,
      source: 'api',
      // userId and role will be set by auth middleware
    });

    // Attach to request
    request.tenantId = tenantId;
    request.requestContext = requestContext;

    // Log tenant context
    request.log.info({ tenantId }, 'Tenant context established');
  });

  done();
};

export const tenantContextMiddleware = fp(tenantContextPlugin, {
  name: 'tenantContext',
  fastify: '5.x',
  dependencies: ['requestId'], // Depends on request ID being set first
});

// ============================================================================
// Helper to wrap handlers with async context
// ============================================================================

export function withTenantContext<T>(
  request: FastifyRequest,
  fn: () => Promise<T>
): Promise<T> {
  return runWithContextAsync(request.requestContext, fn);
}
