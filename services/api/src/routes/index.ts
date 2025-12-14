/**
 * Route Registration
 */

import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';
import { mdmRoutes } from './mdm/index.js';
import { integrationRoutes } from './integration/index.js';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check routes (no prefix, no auth)
  await fastify.register(healthRoutes);

  // API v1 routes
  await fastify.register(async (api) => {
    // MDM routes - EPIC 5
    await api.register(mdmRoutes, { prefix: '/mdm' });
    
    // Integration routes - EPIC 5
    await api.register(integrationRoutes, { prefix: '/integration' });
  }, { prefix: '/api/v1' });
}
