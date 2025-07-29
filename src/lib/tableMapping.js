// Table mapping configuration
// This file maps table references to their correct names
// All tables are now in the kastle_banking schema

export const TABLE_MAPPING = {
  // All tables are now in kastle_banking schema without prefix needed
  'customers': 'customers',
  'collection_officers': 'collection_officers', 
  'collection_cases': 'collection_cases',
  'promise_to_pay': 'promise_to_pay',
  'payments': 'payments',
  'collection_interactions': 'collection_interactions',
  'products': 'products',
  'branches': 'branches',
  'accounts': 'accounts',
  'loan_accounts': 'loan_accounts',
  'transactions': 'transactions',
  'currencies': 'currencies',
  'countries': 'countries',
  'customer_types': 'customer_types',
  'product_categories': 'product_categories',
  'collection_teams': 'collection_teams',
  'officer_performance_metrics': 'officer_performance_metrics',
  'officer_performance_summary': 'officer_performance_summary'
};

// Helper function to get the correct table name
export function getTableName(tableName) {
  return TABLE_MAPPING[tableName] || tableName;
}