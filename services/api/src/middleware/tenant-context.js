/**
 * Tenant Context Extraction Middleware
 * 
 * Extracts the tenant ID from the request and attaches it to the request object.
 * The tenant ID can come from:
 * 1. x-tenant-id header (for development/testing)
 * 2. JWT claims (in production)
 * 3. Subdomain (multi-tenant SaaS pattern)
 * 
 * Priority: 3 (runs after auth)
 */

import config from '../config/index.js';

const TENANT_ID_HEADER = 'x-tenant-id';

/**
 * Tenant context extraction middleware
 * 
 * Extracts tenant ID and attaches it to req.tenantId
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export function tenantContextMiddleware(req, res, next) {
  let tenantId = null;
  
  // Priority 1: x-tenant-id header (for development)
  tenantId = req.get(TENANT_ID_HEADER);
  
  // Priority 2: From authenticated user's JWT claims (in production)
  if (!tenantId && req.user && req.user.tenantId) {
    tenantId = req.user.tenantId;
  }
  
  // Priority 3: Default tenant ID from config (for development)
  if (!tenantId && config.defaultTenantId) {
    tenantId = config.defaultTenantId;
  }
  
  // Priority 4: From subdomain (optional pattern)
  // if (!tenantId) {
  //   const host = req.get('host');
  //   const subdomain = host?.split('.')[0];
  //   if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
  //     tenantId = await lookupTenantBySubdomain(subdomain);
  //   }
  // }
  
  // Attach to request
  req.tenantId = tenantId;
  
  // Log tenant context (debug)
  if (config.isDev && tenantId) {
    console.log(`[${req.requestId}] Tenant context: ${tenantId}`);
  }
  
  next();
}

/**
 * Require tenant context middleware
 * Returns 400 if no tenant ID is present
 * 
 * Use this on routes that require tenant isolation
 */
export function requireTenant(req, res, next) {
  if (!req.tenantId) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Tenant context required. Set x-tenant-id header or authenticate with a tenant-scoped token.',
      requestId: req.requestId,
    });
  }
  next();
}

/**
 * Validate tenant ID format
 * Ensures the tenant ID is a valid UUID format
 * (more permissive to allow test UUIDs like 11111111-1111-1111-1111-111111111111)
 */
export function validateTenantId(tenantId) {
  if (!tenantId) return false;
  
  // UUID format: 8-4-4-4-12 hex characters
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  return uuidRegex.test(tenantId);
}

/**
 * Strict tenant validation middleware
 * Validates that tenant ID is a proper UUID format
 */
export function strictTenantValidation(req, res, next) {
  if (req.tenantId && !validateTenantId(req.tenantId)) {
    return res.status(400).json({
      error: 'BadRequest',
      message: 'Invalid tenant ID format. Must be a valid UUID.',
      requestId: req.requestId,
    });
  }
  next();
}

export default tenantContextMiddleware;
