/**
 * OSOL API Server
 * 
 * Main entry point for the multi-tenant API service.
 * 
 * Middleware order:
 * 1. request-id     - Generate unique request identifier
 * 2. auth           - Authenticate user (stub for now)
 * 3. tenant-context - Extract tenant from headers/JWT
 * 4. db-context     - Create tenant-scoped DB client with set_config
 * 5. routes         - Handle API requests
 */

import express from 'express';
import config from './config/index.js';
import { shutdown as shutdownDb } from './db/pool.js';

// Middleware
import { requestIdMiddleware } from './middleware/request-id.js';
import { authMiddleware } from './middleware/auth.js';
import { tenantContextMiddleware, strictTenantValidation } from './middleware/tenant-context.js';
import { dbContextMiddleware } from './middleware/db-context.js';

// Routes
import routes from './routes/index.js';

const app = express();

// Parse JSON bodies
app.use(express.json());

// Apply middleware chain in order
app.use(requestIdMiddleware);        // Priority 1: Request ID
app.use(authMiddleware);             // Priority 2: Authentication (stub)
app.use(tenantContextMiddleware);    // Priority 3: Tenant context extraction
app.use(strictTenantValidation);     // Priority 3.5: Validate tenant ID format
app.use(dbContextMiddleware);        // Priority 4: DB context with set_config

// Mount routes
app.use('/', routes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'NotFound',
    message: `Route not found: ${req.method} ${req.path}`,
    requestId: req.requestId,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(`[${req.requestId}] Unhandled error:`, err);
  
  res.status(err.status || 500).json({
    error: err.name || 'InternalServerError',
    message: config.isDev ? err.message : 'An unexpected error occurred',
    requestId: req.requestId,
    ...(config.isDev && { stack: err.stack }),
  });
});

// Start server
const server = app.listen(config.port, () => {
  console.log(`
╔══════════════════════════════════════════════════════════════╗
║                      OSOL API Server                         ║
╠══════════════════════════════════════════════════════════════╣
║  Port:        ${String(config.port).padEnd(46)}║
║  Environment: ${config.nodeEnv.padEnd(46)}║
║  RBAC:        ${(config.rbac.enabled ? 'enabled' : 'disabled').padEnd(46)}║
║  Dev Bypass:  ${(config.rbac.devBypassEnabled ? 'enabled' : 'disabled').padEnd(46)}║
╚══════════════════════════════════════════════════════════════╝

Endpoints:
  GET  /health                    - Health check
  GET  /platform/tenants/me       - Current tenant info
  GET  /platform/org-units/tree   - Org structure (ADMIN)

Tenant Context:
  Set via header: x-tenant-id: <uuid>
  
RBAC Bypass (development only):
  Set via header: x-dev-role: ADMIN
`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Starting graceful shutdown...`);
  
  server.close(async () => {
    console.log('HTTP server closed');
    
    try {
      await shutdownDb();
      console.log('Database pool closed');
    } catch (error) {
      console.error('Error closing database pool:', error);
    }
    
    process.exit(0);
  });
  
  // Force shutdown after 30 seconds
  setTimeout(() => {
    console.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export { app, server };
export default app;
