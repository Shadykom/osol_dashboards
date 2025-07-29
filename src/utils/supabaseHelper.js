// Helper utilities for Supabase queries when schemas are not exposed

import { supabase, supabaseBanking, supabaseCollection } from '@/lib/supabase';

/**
 * Helper function to query with schema fallback
 * Tries kastle_banking schema first, then falls back to public schema
 * @param {string} tableName - The table name to query
 * @param {Object} client - The Supabase client to use (default: supabaseBanking)
 * @returns {Object} - Supabase query builder
 */
export function queryWithSchemaFallback(tableName, client = supabaseBanking) {
  const query = client.from(tableName);
  
  // List of methods that execute queries
  const executeMethods = ['select', 'insert', 'upsert', 'update', 'delete'];
  
  // Override each execute method to handle schema errors
  executeMethods.forEach(method => {
    const original = query[method];
    if (typeof original === 'function') {
      query[method] = function(...args) {
        const result = original.apply(this, args);
        
        // Override the promise resolution
        const originalThen = result.then.bind(result);
        result.then = async function(onFulfilled, onRejected) {
          try {
            const response = await originalThen();
            
            // If we get a "relation does not exist" error, try public schema
            if (response.error && response.error.code === '42P01') {
              console.log(`Table ${tableName} not found in kastle_banking, trying public schema`);
              
              // Use the base supabase client which defaults to public schema
              const publicQuery = supabase.from(tableName)[method](...args);
              
              // Copy any additional query modifiers
              if (result._query) {
                Object.assign(publicQuery._query, result._query);
              }
              
              return publicQuery.then();
            }
            
            return response;
          } catch (error) {
            if (onRejected) {
              return onRejected(error);
            }
            throw error;
          }
        };
        
        return result;
      };
    }
  });
  
  return query;
}

/**
 * Execute a query with automatic schema fallback
 * @param {string} tableName - The table name
 * @param {Function} queryBuilder - Function that builds the query
 * @param {Object} client - The Supabase client to use
 * @returns {Promise} - Query result
 */
export async function executeWithSchemaFallback(tableName, queryBuilder, client = supabaseBanking) {
  try {
    // Try with the specified client (kastle_banking schema)
    const query = client.from(tableName);
    const result = await queryBuilder(query);
    
    // If we get a "relation does not exist" error, try public schema
    if (result.error && result.error.code === '42P01') {
      console.log(`Table ${tableName} not found in kastle_banking, trying public schema`);
      const publicQuery = supabase.from(tableName);
      return await queryBuilder(publicQuery);
    }
    
    return result;
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
}

/**
 * Get the appropriate client for a table with fallback support
 * @param {string} tableName - The table name
 * @returns {Object} - Supabase client
 */
export function getClientWithFallback(tableName) {
  // For auth tables, always use the default client
  if (tableName.startsWith('auth.')) {
    return supabase;
  }
  
  // For all other tables, return a proxy that handles fallbacks
  return new Proxy(supabaseBanking, {
    get(target, prop) {
      if (prop === 'from') {
        return (table) => queryWithSchemaFallback(table, target);
      }
      return target[prop];
    }
  });
}

/**
 * Manually join data from related tables when foreign key syntax is not available
 * @param {Array} primaryData - The main dataset
 * @param {Object} joinConfig - Configuration for the join
 * @param {string} joinConfig.foreignKey - The foreign key field in primary data
 * @param {string} joinConfig.tableName - The table to join from
 * @param {string} joinConfig.joinKey - The key field in the join table
 * @param {string} joinConfig.fields - Fields to select from join table
 * @param {Object} joinConfig.client - Supabase client to use
 * @param {string} joinConfig.resultKey - Key to store joined data in primary records
 * @returns {Promise<Array>} Primary data with joined records
 */
export async function manualJoin(primaryData, joinConfig) {
  const {
    foreignKey,
    tableName,
    joinKey = 'id',
    fields = '*',
    client,
    resultKey
  } = joinConfig;

  if (!primaryData || primaryData.length === 0) {
    return primaryData;
  }

  try {
    // Get unique foreign key values
    const foreignKeyValues = [...new Set(
      primaryData
        .map(item => item[foreignKey])
        .filter(value => value != null)
    )];

    if (foreignKeyValues.length === 0) {
      return primaryData;
    }

    // Fetch related data
    const { data: joinedData, error } = await client
      .from(tableName)
      .select(fields)
      .in(joinKey, foreignKeyValues);

    if (error) {
      console.error(`Error fetching data from ${tableName}:`, error);
      return primaryData; // Return original data on error
    }

    if (!joinedData) {
      return primaryData;
    }

    // Create lookup map
    const joinedDataMap = joinedData.reduce((acc, item) => {
      acc[item[joinKey]] = item;
      return acc;
    }, {});

    // Merge data
    return primaryData.map(item => {
      const foreignKeyValue = item[foreignKey];
      if (foreignKeyValue && joinedDataMap[foreignKeyValue]) {
        return {
          ...item,
          [resultKey]: joinedDataMap[foreignKeyValue]
        };
      }
      return item;
    });
  } catch (error) {
    console.error('Manual join error:', error);
    return primaryData;
  }
}

/**
 * Perform multiple manual joins sequentially
 * @param {Array} data - Initial dataset
 * @param {Array<Object>} joins - Array of join configurations
 * @returns {Promise<Array>} Data with all joins applied
 */
export async function multipleManualJoins(data, joins) {
  let result = data;
  
  for (const joinConfig of joins) {
    result = await manualJoin(result, joinConfig);
  }
  
  return result;
}

/**
 * Check if schemas are exposed by attempting a simple query
 * @param {Object} client - Supabase client
 * @param {string} schema - Schema name to check
 * @returns {Promise<boolean>} True if schema is accessible
 */
export async function isSchemaExposed(client, schema) {
  try {
    // Try to query a system table in the schema
    const { error } = await client
      .from(`${schema}.collection_officers`)
      .select('officer_id')
      .limit(1);
    
    return !error;
  } catch (error) {
    return false;
  }
}

/**
 * Get appropriate query based on schema exposure
 * @param {Object} client - Supabase client
 * @param {string} tableName - Full table name with schema
 * @param {string} selectQuery - Query with foreign key syntax
 * @param {string} fallbackQuery - Query without foreign key syntax
 * @returns {Promise<Object>} Query builder
 */
export async function getAdaptiveQuery(client, tableName, selectQuery, fallbackQuery) {
  const schema = tableName.split('.')[0];
  const schemasExposed = await isSchemaExposed(client, schema);
  
  return client
    .from(tableName)
    .select(schemasExposed ? selectQuery : fallbackQuery);
}