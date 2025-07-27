// Helper utilities for Supabase queries when schemas are not exposed

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