/**
 * Database connection pool
 * Provides the base PostgreSQL pool for the application
 */

import pg from 'pg';
import config from '../config/index.js';

const { Pool } = pg;

// Create the connection pool
const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
  ssl: config.database.ssl,
  max: config.database.max,
  idleTimeoutMillis: config.database.idleTimeoutMillis,
  connectionTimeoutMillis: config.database.connectionTimeoutMillis,
});

// Log pool errors
pool.on('error', (err) => {
  console.error('[DB Pool] Unexpected error on idle client', err);
});

pool.on('connect', (client) => {
  // Set the search path to our schema for every new connection
  client.query(`SET search_path TO ${config.database.schema}, public`);
});

/**
 * Get a client from the pool
 * @returns {Promise<pg.PoolClient>}
 */
export async function getClient() {
  return pool.connect();
}

/**
 * Execute a query directly on the pool
 * @param {string} text - SQL query
 * @param {Array} params - Query parameters
 * @returns {Promise<pg.QueryResult>}
 */
export async function query(text, params) {
  return pool.query(text, params);
}

/**
 * Shutdown the pool gracefully
 */
export async function shutdown() {
  await pool.end();
}

export { pool };
export default pool;
