/**
 * MDM (Master Data Management) Routes
 * EPIC 5 - Integration & Comprehensive MDM
 */

import type { FastifyInstance } from 'fastify';
import { sourceSystemRoutes } from './source-systems.js';
import { referenceDataRoutes } from './reference-data.js';
import { partyRoutes } from './parties.js';
import { contractRoutes } from './contracts.js';
import { userProfileRoutes } from './user-profiles.js';
import { dataQualityRoutes } from './data-quality.js';

export async function mdmRoutes(fastify: FastifyInstance): Promise<void> {
  // Source Systems
  await fastify.register(sourceSystemRoutes, { prefix: '/sources' });
  
  // Reference Data
  await fastify.register(referenceDataRoutes, { prefix: '/reference-data' });
  
  // Parties (Golden Records)
  await fastify.register(partyRoutes, { prefix: '/parties' });
  
  // Contracts (Golden Records)
  await fastify.register(contractRoutes, { prefix: '/contracts' });
  
  // User Profiles
  await fastify.register(userProfileRoutes, { prefix: '/users' });
  
  // Data Quality
  await fastify.register(dataQualityRoutes, { prefix: '/data-quality' });
}
