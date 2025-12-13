/**
 * Route Registration
 */

import type { FastifyInstance } from 'fastify';
import { healthRoutes } from './health.js';

export async function registerRoutes(fastify: FastifyInstance): Promise<void> {
  // Health check routes (no prefix, no auth)
  await fastify.register(healthRoutes);

  // API v1 routes will be added here
  // await fastify.register(apiV1Routes, { prefix: '/api/v1' });
}
