/**
 * Integration Routes
 * EPIC 5 - Integration & Data Ingestion APIs
 */

import type { FastifyInstance } from 'fastify';
import { ingestRoutes } from './ingest.js';
import { runsRoutes } from './runs.js';
import { freshnessRoutes } from './freshness.js';
import { mappingRoutes } from './mappings.js';
import { configRoutes } from './config.js';

export async function integrationRoutes(fastify: FastifyInstance): Promise<void> {
  // Ingestion endpoint
  await fastify.register(ingestRoutes, { prefix: '/ingest' });
  
  // Ingestion runs
  await fastify.register(runsRoutes, { prefix: '/runs' });
  
  // Data freshness
  await fastify.register(freshnessRoutes, { prefix: '/freshness' });
  
  // Mapping templates
  await fastify.register(mappingRoutes, { prefix: '/mappings' });
  
  // Integration config
  await fastify.register(configRoutes, { prefix: '/config' });
}
