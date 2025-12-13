/**
 * CMS Database Client
 * PostgreSQL connection pool with tenant context support
 */

import pg from 'pg';
import { getLogger, logDatabaseQuery, DatabaseError } from '@cms/common';
import { getConfig } from '../config/index.js';

const { Pool, types } = pg;

// ============================================================================
// Configure pg to return dates as strings (avoid timezone issues)
// ============================================================================

types.setTypeParser(types.builtins.TIMESTAMP, (val: string) => val);
types.setTypeParser(types.builtins.TIMESTAMPTZ, (val: string) => val);
types.setTypeParser(types.builtins.DATE, (val: string) => val);

// ============================================================================
// Pool Instance
// ============================================================================

let pool: pg.Pool | null = null;

export function getPool(): pg.Pool {
  if (!pool) {
    const config = getConfig();
    const logger = getLogger();

    pool = new Pool({
      connectionString: config.database.url,
      min: config.database.poolMin,
      max: config.database.poolMax,
      ssl: config.database.ssl ? { rejectUnauthorized: false } : false,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error({ err }, 'Unexpected database pool error');
    });

    pool.on('connect', () => {
      logger.debug('New database connection established');
    });

    logger.info('Database pool initialized');
  }

  return pool;
}

// ============================================================================
// Query Helpers
// ============================================================================

export interface QueryResult<T = Record<string, unknown>> {
  rows: T[];
  rowCount: number;
}

/**
 * Execute a query without tenant context
 * Use sparingly - most queries should use withTenant
 */
export async function query<T = Record<string, unknown>>(
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const logger = getLogger();
  const startTime = Date.now();

  try {
    const result = await getPool().query(sql, params);
    logDatabaseQuery(logger, {
      duration: Date.now() - startTime,
    });
    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? 0,
    };
  } catch (error) {
    logDatabaseQuery(logger, {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw new DatabaseError(
      'Database query failed',
      error instanceof Error ? error : undefined
    );
  }
}

/**
 * Execute a query with tenant context (RLS)
 * This sets app.current_tenant before executing the query
 */
export async function queryWithTenant<T = Record<string, unknown>>(
  tenantId: string,
  sql: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  const logger = getLogger();
  const startTime = Date.now();
  const client = await getPool().connect();

  try {
    // Set tenant context for RLS - LOCAL ensures it's scoped to this transaction
    await client.query(
      `SELECT set_config('app.current_tenant', $1, true)`,
      [tenantId]
    );

    const result = await client.query(sql, params);
    
    logDatabaseQuery(logger, {
      duration: Date.now() - startTime,
    });

    return {
      rows: result.rows as T[],
      rowCount: result.rowCount ?? 0,
    };
  } catch (error) {
    logDatabaseQuery(logger, {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    throw new DatabaseError(
      'Database query failed',
      error instanceof Error ? error : undefined
    );
  } finally {
    client.release();
  }
}

/**
 * Execute a transaction with tenant context
 */
export async function transactionWithTenant<T>(
  tenantId: string,
  fn: (client: pg.PoolClient) => Promise<T>
): Promise<T> {
  const logger = getLogger();
  const startTime = Date.now();
  const client = await getPool().connect();

  try {
    await client.query('BEGIN');
    
    // Set tenant context for RLS
    await client.query(
      `SELECT set_config('app.current_tenant', $1, true)`,
      [tenantId]
    );

    const result = await fn(client);
    
    await client.query('COMMIT');
    
    logDatabaseQuery(logger, {
      duration: Date.now() - startTime,
    });

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    
    logDatabaseQuery(logger, {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error : new Error(String(error)),
    });
    
    throw new DatabaseError(
      'Database transaction failed',
      error instanceof Error ? error : undefined
    );
  } finally {
    client.release();
  }
}

// ============================================================================
// Health Check
// ============================================================================

export async function checkDatabaseHealth(): Promise<{
  status: 'up' | 'down';
  latency: number;
  message?: string;
}> {
  const startTime = Date.now();

  try {
    await getPool().query('SELECT 1');
    return {
      status: 'up',
      latency: Date.now() - startTime,
    };
  } catch (error) {
    return {
      status: 'down',
      latency: Date.now() - startTime,
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// ============================================================================
// Cleanup
// ============================================================================

export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    getLogger().info('Database pool closed');
  }
}
