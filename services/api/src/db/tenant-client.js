/**
 * Tenant-aware database client wrapper
 * 
 * This module provides a per-request database client that automatically
 * sets the tenant context for Row Level Security (RLS) enforcement.
 * 
 * IMPORTANT: Every database query in the application should use this wrapper
 * to ensure proper tenant isolation.
 */

import { getClient } from './pool.js';
import config from '../config/index.js';

/**
 * Creates a tenant-aware database client
 * 
 * This client automatically executes:
 *   SELECT set_config('app.current_tenant', '<tenant_uuid>', true);
 * 
 * The `true` parameter makes the setting local to the current transaction,
 * ensuring proper isolation between requests.
 * 
 * @param {string} tenantId - The tenant UUID
 * @returns {TenantClient} A client wrapper with tenant context set
 */
export async function createTenantClient(tenantId) {
  if (!tenantId) {
    throw new Error('Tenant ID is required for database access');
  }

  const client = await getClient();
  
  try {
    // Set the search path to our schema
    await client.query(`SET search_path TO ${config.database.schema}, public`);
    
    // Set the tenant context for RLS
    // The 'true' parameter makes it local to the current transaction
    await client.query(
      `SELECT set_config('app.current_tenant', $1, true)`,
      [tenantId]
    );
    
    return new TenantClient(client, tenantId);
  } catch (error) {
    // Release the client if setup fails
    client.release();
    throw error;
  }
}

/**
 * TenantClient wraps a PostgreSQL client with tenant context
 */
export class TenantClient {
  /**
   * @param {import('pg').PoolClient} client - The underlying PG client
   * @param {string} tenantId - The tenant UUID
   */
  constructor(client, tenantId) {
    this._client = client;
    this._tenantId = tenantId;
    this._released = false;
  }

  /**
   * Get the current tenant ID
   */
  get tenantId() {
    return this._tenantId;
  }

  /**
   * Execute a SQL query
   * @param {string} text - SQL query text
   * @param {Array} params - Query parameters
   * @returns {Promise<import('pg').QueryResult>}
   */
  async query(text, params) {
    if (this._released) {
      throw new Error('Cannot use released client');
    }
    return this._client.query(text, params);
  }

  /**
   * Begin a transaction
   */
  async begin() {
    await this._client.query('BEGIN');
  }

  /**
   * Commit the current transaction
   */
  async commit() {
    await this._client.query('COMMIT');
  }

  /**
   * Rollback the current transaction
   */
  async rollback() {
    await this._client.query('ROLLBACK');
  }

  /**
   * Release the client back to the pool
   * IMPORTANT: Always call this when done with the client
   */
  release() {
    if (!this._released) {
      this._client.release();
      this._released = true;
    }
  }

  /**
   * Execute a function within a transaction
   * Automatically handles BEGIN/COMMIT/ROLLBACK
   * 
   * @param {Function} fn - Async function to execute within transaction
   * @returns {Promise<any>} - Result of the function
   */
  async transaction(fn) {
    await this.begin();
    try {
      const result = await fn(this);
      await this.commit();
      return result;
    } catch (error) {
      await this.rollback();
      throw error;
    }
  }
}

/**
 * Higher-order function to execute database operations with tenant context
 * Automatically acquires and releases the client
 * 
 * @param {string} tenantId - The tenant UUID
 * @param {Function} fn - Async function receiving the TenantClient
 * @returns {Promise<any>} - Result of the function
 * 
 * @example
 * const users = await withTenantClient(tenantId, async (client) => {
 *   const result = await client.query('SELECT * FROM users');
 *   return result.rows;
 * });
 */
export async function withTenantClient(tenantId, fn) {
  const client = await createTenantClient(tenantId);
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}

/**
 * Execute database operations within a transaction with tenant context
 * 
 * @param {string} tenantId - The tenant UUID
 * @param {Function} fn - Async function receiving the TenantClient
 * @returns {Promise<any>} - Result of the function
 */
export async function withTenantTransaction(tenantId, fn) {
  const client = await createTenantClient(tenantId);
  try {
    return await client.transaction(fn);
  } finally {
    client.release();
  }
}

export default {
  createTenantClient,
  withTenantClient,
  withTenantTransaction,
  TenantClient,
};
