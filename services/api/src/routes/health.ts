/**
 * Health Check Routes
 * GET /health - Basic liveness check
 * GET /ready - Readiness check with dependency health
 */

import type { FastifyInstance, FastifyPluginCallback } from 'fastify';
import { checkDatabaseHealth } from '../db/index.js';
import type { HealthStatus, ReadyStatus } from '@cms/common';

// ============================================================================
// Service Version and Start Time
// ============================================================================

const VERSION = process.env.npm_package_version || '1.0.0';
const START_TIME = Date.now();

// ============================================================================
// Health Route
// ============================================================================

const healthRoutes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, done) => {
  /**
   * GET /health
   * Basic liveness check - returns 200 if service is running
   */
  fastify.get('/health', {
    schema: {
      description: 'Liveness probe - returns 200 if service is running',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            uptime: { type: 'number' },
          },
        },
      },
    },
  }, async (_request, _reply): Promise<HealthStatus> => {
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: VERSION,
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
    };
  });

  /**
   * GET /ready
   * Readiness check - verifies all dependencies are available
   */
  fastify.get('/ready', {
    schema: {
      description: 'Readiness probe - checks database and other dependencies',
      tags: ['Health'],
      response: {
        200: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            uptime: { type: 'number' },
            checks: {
              type: 'object',
              properties: {
                database: {
                  type: 'object',
                  properties: {
                    status: { type: 'string', enum: ['up', 'down'] },
                    latency: { type: 'number' },
                    message: { type: 'string' },
                  },
                },
              },
            },
          },
        },
        503: {
          type: 'object',
          properties: {
            status: { type: 'string', enum: ['healthy', 'degraded', 'unhealthy'] },
            timestamp: { type: 'string', format: 'date-time' },
            version: { type: 'string' },
            uptime: { type: 'number' },
            checks: { type: 'object' },
          },
        },
      },
    },
  }, async (_request, reply): Promise<ReadyStatus> => {
    // Check database connectivity
    const dbHealth = await checkDatabaseHealth();

    // Determine overall status
    const isHealthy = dbHealth.status === 'up';
    const status = isHealthy ? 'healthy' : 'unhealthy';

    const response: ReadyStatus = {
      status,
      timestamp: new Date().toISOString(),
      version: VERSION,
      uptime: Math.floor((Date.now() - START_TIME) / 1000),
      checks: {
        database: dbHealth,
      },
    };

    // Return 503 if not ready
    if (!isHealthy) {
      reply.status(503);
    }

    return response;
  });

  done();
};

export { healthRoutes };
