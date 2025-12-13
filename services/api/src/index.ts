/**
 * CMS API Server Entry Point
 * 
 * Multi-tenant REST API with:
 * - Request ID/Correlation ID tracking
 * - Tenant context middleware
 * - Auth placeholder (EPIC 1)
 * - RBAC placeholder (EPIC 1)
 * - Health endpoints
 */

import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import sensible from '@fastify/sensible';
import { 
  initializeLogger, 
  formatErrorForResponse, 
  isCMSError,
  getHttpStatusCode,
} from '@cms/common';
import { loadConfig, isDevelopment } from './config/index.js';
import { closePool } from './db/index.js';
import { 
  requestIdMiddleware, 
  tenantContextMiddleware,
  authMiddleware,
  rbacMiddleware,
} from './middleware/index.js';
import { registerRoutes } from './routes/index.js';

// ============================================================================
// Load Configuration
// ============================================================================

const config = loadConfig();

// ============================================================================
// Initialize Logger
// ============================================================================

const logger = initializeLogger({
  level: config.logLevel,
  serviceName: 'cms-api',
  environment: config.env,
  prettyPrint: isDevelopment(),
});

// ============================================================================
// Create Fastify Instance
// ============================================================================

const fastify = Fastify({
  logger: {
    level: config.logLevel,
    transport: isDevelopment() 
      ? { target: 'pino-pretty', options: { colorize: true } }
      : undefined,
  },
  genReqId: () => '', // We handle request IDs in middleware
  disableRequestLogging: false,
});

// ============================================================================
// Register Plugins
// ============================================================================

async function registerPlugins(): Promise<void> {
  // Security headers
  await fastify.register(helmet, {
    contentSecurityPolicy: false, // Allow for API responses
  });

  // CORS
  await fastify.register(cors, {
    origin: config.cors.origin,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type', 
      'Authorization', 
      'x-tenant-id', 
      'x-request-id',
      'x-correlation-id',
    ],
  });

  // Sensible defaults (not found, errors, etc.)
  await fastify.register(sensible);

  // Custom middleware (order matters!)
  await fastify.register(requestIdMiddleware);
  await fastify.register(tenantContextMiddleware);
  await fastify.register(authMiddleware);
  await fastify.register(rbacMiddleware);
}

// ============================================================================
// Error Handler
// ============================================================================

fastify.setErrorHandler((error, request, reply) => {
  const includeStack = isDevelopment();
  const statusCode = getHttpStatusCode(error);
  const apiError = formatErrorForResponse(error, includeStack);

  // Log error with request context
  if (statusCode >= 500) {
    request.log.error({ err: error, requestId: request.requestId }, 'Server error');
  } else if (statusCode >= 400) {
    request.log.warn({ err: error, requestId: request.requestId }, 'Client error');
  }

  reply.status(statusCode).send({
    success: false,
    error: apiError,
    meta: {
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================================
// Not Found Handler
// ============================================================================

fastify.setNotFoundHandler((request, reply) => {
  reply.status(404).send({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${request.method} ${request.url} not found`,
    },
    meta: {
      requestId: request.requestId,
      timestamp: new Date().toISOString(),
    },
  });
});

// ============================================================================
// Graceful Shutdown
// ============================================================================

async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown signal received');

  try {
    await fastify.close();
    await closePool();
    logger.info('Server shutdown complete');
    process.exit(0);
  } catch (error) {
    logger.error({ error }, 'Error during shutdown');
    process.exit(1);
  }
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason) => {
  logger.fatal({ reason }, 'Unhandled rejection');
  process.exit(1);
});

// ============================================================================
// Start Server
// ============================================================================

async function start(): Promise<void> {
  try {
    // Register plugins
    await registerPlugins();

    // Register routes
    await registerRoutes(fastify);

    // Start listening
    await fastify.listen({ 
      port: config.port, 
      host: config.host,
    });

    logger.info(
      { 
        port: config.port, 
        host: config.host,
        env: config.env,
      }, 
      'CMS API server started'
    );

    // Log registered routes in development
    if (isDevelopment()) {
      logger.info('Registered routes:');
      const routes = fastify.printRoutes();
      console.log(routes);
    }
  } catch (error) {
    logger.fatal({ error }, 'Failed to start server');
    process.exit(1);
  }
}

// Start the server
start();
