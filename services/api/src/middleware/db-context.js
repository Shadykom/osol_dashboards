/**
 * Database Context Middleware
 * 
 * Creates a tenant-aware database client for each request.
 * This middleware MUST run after tenant-context middleware.
 * 
 * The client automatically sets:
 *   SELECT set_config('app.current_tenant', '<tenant_uuid>', true);
 * 
 * Priority: 4 (runs after tenant-context)
 */

import { createTenantClient } from '../db/tenant-client.js';

/**
 * Database context middleware
 * 
 * Creates a tenant-scoped database client and attaches it to req.db
 * The client is automatically released when the response finishes.
 * 
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 * @param {import('express').NextFunction} next
 */
export async function dbContextMiddleware(req, res, next) {
  // Skip if no tenant context
  if (!req.tenantId) {
    req.db = null;
    return next();
  }
  
  try {
    // Create tenant-aware client
    // This automatically executes set_config('app.current_tenant', tenantId, true)
    const client = await createTenantClient(req.tenantId);
    
    // Attach to request
    req.db = client;
    
    // Release client when response finishes or closes
    const cleanup = () => {
      if (req.db) {
        req.db.release();
        req.db = null;
      }
    };
    
    res.on('finish', cleanup);
    res.on('close', cleanup);
    
    next();
  } catch (error) {
    console.error(`[${req.requestId}] Failed to create DB context:`, error);
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Failed to establish database connection',
      requestId: req.requestId,
    });
  }
}

/**
 * Require database context middleware
 * Returns 500 if no database client is available
 */
export function requireDb(req, res, next) {
  if (!req.db) {
    return res.status(500).json({
      error: 'InternalServerError',
      message: 'Database context not available. Ensure tenant context is set.',
      requestId: req.requestId,
    });
  }
  next();
}

export default dbContextMiddleware;
