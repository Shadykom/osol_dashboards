// Helper utilities for Supabase queries with kastle_banking schema

import { supabase, supabaseBanking, supabaseCollection } from '@/lib/supabase';

/**
 * Execute a query with proper error handling for kastle_banking schema
 * @param {string} tableName - The table name
 * @param {Function} queryBuilder - Function that builds the query
 * @param {Object} client - The Supabase client to use
 * @returns {Promise} - Query result
 */
export async function executeWithSchemaFallback(tableName, queryBuilder, client = supabaseBanking) {
  try {
    // Execute with the kastle_banking client
    const query = client.from(tableName);
    const result = await queryBuilder(query);
    
    // If we get a "relation does not exist" error, it means schema is not exposed
    if (result.error && result.error.code === '42P01') {
      console.error(`Table ${tableName} not accessible in kastle_banking schema.`);
      console.error('Please ensure kastle_banking schema is exposed in Supabase Dashboard.');
      console.error('Go to: Settings > API > Exposed schemas and add "kastle_banking"');
      
      // Return the error with helpful message
      return {
        ...result,
        error: {
          ...result.error,
          hint: 'kastle_banking schema needs to be exposed in Supabase Dashboard settings'
        }
      };
    }
    
    return result;
  } catch (error) {
    console.error(`Error querying ${tableName}:`, error);
    throw error;
  }
}

/**
 * Helper function to ensure we're using the correct client for kastle_banking
 * @param {string} tableName - The table name to query
 * @returns {Object} - Supabase query builder
 */
export function getKastleBankingTable(tableName) {
  // Always use supabaseBanking which has the correct schema headers
  return supabaseBanking.from(tableName);
}

/**
 * Check if kastle_banking schema is properly exposed
 * @returns {Promise<boolean>} - True if schema is accessible
 */
export async function checkSchemaAccess() {
  try {
    // Try a simple query to test access
    const { data, error } = await supabaseBanking
      .from('customers')
      .select('customer_id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.error('kastle_banking schema is not exposed!');
      console.error('Please follow these steps:');
      console.error('1. Go to https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api');
      console.error('2. In "Exposed schemas" add: kastle_banking');
      console.error('3. Save the changes');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking schema access:', error);
    return false;
  }
}

/**
 * Manually join data from related tables when foreign key syntax is not available
 * @param {Array} primaryData - The main dataset
 * @param {Object} joinConfig - Configuration for the join
 * @returns {Promise<Array>} - Joined data
 */
export async function manualJoin(primaryData, joinConfig) {
  const { 
    foreignKey, 
    targetTable, 
    targetKey, 
    targetFields = '*',
    targetClient = supabaseBanking 
  } = joinConfig;

  if (!primaryData || primaryData.length === 0) return primaryData;

  // Get unique foreign key values
  const foreignKeyValues = [...new Set(primaryData.map(item => item[foreignKey]).filter(Boolean))];
  
  if (foreignKeyValues.length === 0) return primaryData;

  // Fetch related data
  const { data: relatedData, error } = await targetClient
    .from(targetTable)
    .select(targetFields)
    .in(targetKey, foreignKeyValues);

  if (error) {
    console.error(`Error fetching related data from ${targetTable}:`, error);
    return primaryData;
  }

  // Create lookup map
  const relatedMap = (relatedData || []).reduce((map, item) => {
    map[item[targetKey]] = item;
    return map;
  }, {});

  // Join data
  return primaryData.map(item => ({
    ...item,
    [targetTable]: relatedMap[item[foreignKey]] || null
  }));
}