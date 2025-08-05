// Oracle Database Configuration
import oracledb from 'oracledb';

// Initialize Oracle client settings
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT;
oracledb.autoCommit = true;
oracledb.fetchAsString = [oracledb.CLOB];
oracledb.fetchAsBuffer = [oracledb.BLOB];

// Oracle connection configuration from environment variables
const dbConfig = {
  user: process.env.ORACLE_USER || '',
  password: process.env.ORACLE_PASSWORD || '',
  connectString: process.env.ORACLE_CONNECTION_STRING || '', // Format: hostname:port/servicename
  poolMin: parseInt(process.env.ORACLE_POOL_MIN || '4'),
  poolMax: parseInt(process.env.ORACLE_POOL_MAX || '10'),
  poolIncrement: parseInt(process.env.ORACLE_POOL_INCREMENT || '1'),
  poolTimeout: parseInt(process.env.ORACLE_POOL_TIMEOUT || '60'),
  poolPingInterval: parseInt(process.env.ORACLE_POOL_PING_INTERVAL || '60'),
  queueTimeout: parseInt(process.env.ORACLE_QUEUE_TIMEOUT || '60000'),
  queueMax: parseInt(process.env.ORACLE_QUEUE_MAX || '500'),
  // Optional: For Oracle Wallet authentication
  walletLocation: process.env.ORACLE_WALLET_LOCATION,
  walletPassword: process.env.ORACLE_WALLET_PASSWORD,
};

// Connection pool instance
let connectionPool = null;

// Check if Oracle is configured
export const isOracleConfigured = () => {
  return !!(dbConfig.user && dbConfig.password && dbConfig.connectString);
};

// Initialize connection pool
export async function initializeOraclePool() {
  try {
    if (connectionPool) {
      console.log('Oracle connection pool already initialized');
      return connectionPool;
    }

    if (!isOracleConfigured()) {
      console.warn('Oracle database credentials not configured!');
      console.warn('Please set the following environment variables:');
      console.warn('- ORACLE_USER');
      console.warn('- ORACLE_PASSWORD');
      console.warn('- ORACLE_CONNECTION_STRING (format: hostname:port/servicename)');
      return null;
    }

    console.log('Initializing Oracle connection pool...');
    connectionPool = await oracledb.createPool(dbConfig);
    console.log('✅ Oracle connection pool initialized successfully');
    
    // Log pool statistics
    const poolStats = connectionPool.getStatistics();
    console.log('Pool statistics:', poolStats);
    
    return connectionPool;
  } catch (error) {
    console.error('❌ Failed to initialize Oracle connection pool:', error);
    throw error;
  }
}

// Get a connection from the pool
export async function getOracleConnection() {
  try {
    if (!connectionPool) {
      await initializeOraclePool();
    }
    
    if (!connectionPool) {
      throw new Error('Oracle connection pool not available');
    }
    
    return await connectionPool.getConnection();
  } catch (error) {
    console.error('Failed to get Oracle connection:', error);
    throw error;
  }
}

// Execute a query with automatic connection management
export async function executeQuery(sql, binds = {}, options = {}) {
  let connection;
  
  try {
    connection = await getOracleConnection();
    const result = await connection.execute(sql, binds, options);
    return result;
  } catch (error) {
    console.error('Query execution failed:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}

// Execute multiple queries in a transaction
export async function executeTransaction(queries) {
  let connection;
  
  try {
    connection = await getOracleConnection();
    
    // Disable autocommit for transaction
    await connection.execute('SET TRANSACTION READ WRITE');
    
    const results = [];
    for (const { sql, binds = {}, options = {} } of queries) {
      const result = await connection.execute(sql, binds, options);
      results.push(result);
    }
    
    // Commit the transaction
    await connection.commit();
    
    return results;
  } catch (error) {
    // Rollback on error
    if (connection) {
      try {
        await connection.rollback();
      } catch (rollbackError) {
        console.error('Rollback failed:', rollbackError);
      }
    }
    console.error('Transaction failed:', error);
    throw error;
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (error) {
        console.error('Error closing connection:', error);
      }
    }
  }
}

// Close the connection pool
export async function closeOraclePool() {
  try {
    if (connectionPool) {
      await connectionPool.close(10); // 10 seconds drain time
      connectionPool = null;
      console.log('Oracle connection pool closed');
    }
  } catch (error) {
    console.error('Error closing Oracle pool:', error);
    throw error;
  }
}

// Helper function to build INSERT statements
export function buildInsertStatement(tableName, data) {
  const columns = Object.keys(data);
  const values = columns.map((col, index) => `:${index + 1}`);
  
  const sql = `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')})`;
  const binds = Object.values(data);
  
  return { sql, binds };
}

// Helper function to build UPDATE statements
export function buildUpdateStatement(tableName, data, whereClause, whereBinds = {}) {
  const updateColumns = Object.keys(data);
  const setClauses = updateColumns.map((col, index) => `${col} = :${index + 1}`);
  
  const sql = `UPDATE ${tableName} SET ${setClauses.join(', ')} WHERE ${whereClause}`;
  const binds = [...Object.values(data), ...Object.values(whereBinds)];
  
  return { sql, binds };
}

// Helper function to handle CLOB data
export async function readClob(clob) {
  return new Promise((resolve, reject) => {
    let data = '';
    clob.setEncoding('utf8');
    
    clob.on('data', (chunk) => {
      data += chunk;
    });
    
    clob.on('end', () => {
      resolve(data);
    });
    
    clob.on('error', (error) => {
      reject(error);
    });
  });
}

// Helper function to handle BLOB data
export async function readBlob(blob) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    
    blob.on('data', (chunk) => {
      chunks.push(chunk);
    });
    
    blob.on('end', () => {
      resolve(Buffer.concat(chunks));
    });
    
    blob.on('error', (error) => {
      reject(error);
    });
  });
}

// Test Oracle connection
export async function testOracleConnection() {
  try {
    console.log('Testing Oracle connection...');
    
    const result = await executeQuery(
      'SELECT SYSDATE, USER, SYS_CONTEXT(\'USERENV\', \'DB_NAME\') AS DB_NAME FROM DUAL'
    );
    
    if (result.rows && result.rows.length > 0) {
      console.log('✅ Oracle connection test successful!');
      console.log('Connected to:', result.rows[0]);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('❌ Oracle connection test failed:', error);
    return false;
  }
}

// Graceful shutdown handler
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, closing Oracle connection pool...');
  await closeOraclePool();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, closing Oracle connection pool...');
  await closeOraclePool();
  process.exit(0);
});

export default {
  initializeOraclePool,
  getOracleConnection,
  executeQuery,
  executeTransaction,
  closeOraclePool,
  buildInsertStatement,
  buildUpdateStatement,
  readClob,
  readBlob,
  testOracleConnection,
  isOracleConfigured
};