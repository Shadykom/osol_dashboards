/**
 * Database module exports
 */

export { pool, getClient, query, shutdown } from './pool.js';
export { 
  createTenantClient, 
  withTenantClient, 
  withTenantTransaction,
  TenantClient 
} from './tenant-client.js';
