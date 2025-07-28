// Table mapping configuration
// This file maps table references to their correct schema-qualified names

export const TABLE_MAPPING = {
  // Public schema tables (these exist in public schema)
  'customers': 'customers',
  'collection_officers': 'collection_officers', 
  'collection_cases': 'collection_cases',
  'promise_to_pay': 'promise_to_pay',
  'payments': 'payments',
  'collection_interactions': 'collection_interactions',
  
  // Tables that need schema qualification
  'products': 'kastle_banking.products',
  'branches': 'kastle_banking.branches',
  'accounts': 'kastle_banking.accounts',
  'loan_accounts': 'kastle_banking.loan_accounts',
  'transactions': 'kastle_banking.transactions',
  'currencies': 'kastle_banking.currencies',
  'countries': 'kastle_banking.countries',
  'customer_types': 'kastle_banking.customer_types',
  'product_categories': 'kastle_banking.product_categories',
  
  // kastle_collection schema tables
  'collection_teams': 'kastle_collection.collection_teams',
  'officer_performance_metrics': 'kastle_collection.officer_performance_metrics',
  'officer_performance_summary': 'kastle_collection.officer_performance_summary'
};

// Helper function to get the correct table name
export function getTableName(tableName) {
  return TABLE_MAPPING[tableName] || tableName;
}