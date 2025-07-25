// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if environment variables are loaded
console.log('Supabase URL:', supabaseUrl ? 'Configured' : 'Missing');
console.log('Supabase Anon Key:', supabaseAnonKey ? 'Configured' : 'Missing');

// Create Supabase clients
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'kastle_banking' // Default to banking schema
      }
    })
  : null;

// Collection database client (using collection schema)
export const supabaseCollection = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      db: {
        schema: 'kastle_collection' // Collection schema
      }
    })
  : null;

// Banking database client (alias for consistency)
export const supabaseBanking = supabase;

// Check configuration status
export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && supabase);

if (!isSupabaseConfigured) {
  console.warn('⚠️ Supabase is not configured. Running in mock data mode.');
  console.warn('Please ensure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in your .env file');
}

// Table names with schema prefixes
export const TABLES = {
  // Banking tables (kastle_banking schema)
  CUSTOMERS: 'customers',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  BRANCHES: 'branches',
  LOAN_ACCOUNTS: 'loan_accounts',
  LOAN_APPLICATIONS: 'loan_applications',
  ACCOUNT_TYPES: 'account_types',
  CUSTOMER_TYPES: 'customer_types',
  CUSTOMER_ADDRESSES: 'customer_addresses',
  CUSTOMER_CONTACTS: 'customer_contacts',
  CUSTOMER_DOCUMENTS: 'customer_documents',
  CURRENCIES: 'currencies',
  COUNTRIES: 'countries',
  PRODUCTS: 'products',
  PRODUCT_CATEGORIES: 'product_categories',
  TRANSACTION_TYPES: 'transaction_types',
  AUDIT_TRAIL: 'audit_trail',
  AUTH_USER_PROFILES: 'auth_user_profiles',
  BANK_CONFIG: 'bank_config',
  REALTIME_NOTIFICATIONS: 'realtime_notifications',
  
  // Collection tables (kastle_collection schema)
  COLLECTION_CASES: 'collection_cases', // Note: This is in kastle_banking schema
  COLLECTION_BUCKETS: 'collection_buckets', // Note: This is in kastle_banking schema
  COLLECTION_CASE_DETAILS: 'collection_case_details',
  COLLECTION_INTERACTIONS: 'collection_interactions',
  COLLECTION_OFFICERS: 'collection_officers',
  COLLECTION_TEAMS: 'collection_teams',
  PROMISE_TO_PAY: 'promise_to_pay',
  FIELD_VISITS: 'field_visits',
  LEGAL_CASES: 'legal_cases',
  DAILY_COLLECTION_SUMMARY: 'daily_collection_summary',
  OFFICER_PERFORMANCE_METRICS: 'officer_performance_metrics',
  COLLECTION_CAMPAIGNS: 'collection_campaigns',
  COLLECTION_STRATEGIES: 'collection_strategies',
  COLLECTION_SCORES: 'collection_scores',
  COLLECTION_SETTLEMENT_OFFERS: 'collection_settlement_offers',
  COLLECTION_WRITE_OFFS: 'collection_write_offs',
  LOAN_RESTRUCTURING: 'loan_restructuring',
  HARDSHIP_APPLICATIONS: 'hardship_applications',
  REPOSSESSED_ASSETS: 'repossessed_assets',
  SHARIA_COMPLIANCE_LOG: 'sharia_compliance_log',
  COLLECTION_AUTOMATION_METRICS: 'collection_automation_metrics',
  COLLECTION_BENCHMARKS: 'collection_benchmarks',
  COLLECTION_BUCKET_MOVEMENT: 'collection_bucket_movement',
  COLLECTION_CALL_RECORDS: 'collection_call_records',
  COLLECTION_COMPLIANCE_VIOLATIONS: 'collection_compliance_violations',
  COLLECTION_CONTACT_ATTEMPTS: 'collection_contact_attempts',
  COLLECTION_CUSTOMER_SEGMENTS: 'collection_customer_segments',
  COLLECTION_FORECASTS: 'collection_forecasts',
  COLLECTION_PROVISIONS: 'collection_provisions',
  COLLECTION_QUEUE_MANAGEMENT: 'collection_queue_management',
  COLLECTION_RISK_ASSESSMENT: 'collection_risk_assessment',
  COLLECTION_VINTAGE_ANALYSIS: 'collection_vintage_analysis',
  COLLECTION_WORKFLOW_TEMPLATES: 'collection_workflow_templates',
  DIGITAL_COLLECTION_ATTEMPTS: 'digital_collection_attempts',
  IVR_PAYMENT_ATTEMPTS: 'ivr_payment_attempts',
  COLLECTION_SYSTEM_PERFORMANCE: 'collection_system_performance',
  COLLECTION_AUDIT_TRAIL: 'collection_audit_trail',
  USER_ROLES: 'user_roles',
  USER_ROLE_ASSIGNMENTS: 'user_role_assignments',
  ACCESS_LOG: 'access_log',
  AUDIT_LOG: 'audit_log',
  DATA_MASKING_RULES: 'data_masking_rules',
  PERFORMANCE_METRICS: 'performance_metrics'
};

// Helper function to get the appropriate client for a table
export function getClientForTable(tableName) {
  // Tables that are in the banking schema
  const bankingTables = [
    'customers', 'accounts', 'transactions', 'branches', 'loan_accounts',
    'loan_applications', 'account_types', 'customer_types', 'customer_addresses',
    'customer_contacts', 'customer_documents', 'currencies', 'countries',
    'products', 'product_categories', 'transaction_types', 'audit_trail',
    'auth_user_profiles', 'bank_config', 'realtime_notifications',
    'collection_cases', 'collection_buckets' // These two are in banking schema
  ];
  
  // Check if the table is in banking schema
  if (bankingTables.includes(tableName)) {
    return supabaseBanking;
  }
  
  // Otherwise it's in collection schema
  return supabaseCollection;
}

// Get full table name with schema
export function getFullTableName(tableName, schema = null) {
  if (schema) {
    return `${schema}.${tableName}`;
  }
  
  // Determine schema based on table name
  const bankingTables = [
    'customers', 'accounts', 'transactions', 'branches', 'loan_accounts',
    'loan_applications', 'account_types', 'customer_types', 'customer_addresses',
    'customer_contacts', 'customer_documents', 'currencies', 'countries',
    'products', 'product_categories', 'transaction_types', 'audit_trail',
    'auth_user_profiles', 'bank_config', 'realtime_notifications',
    'collection_cases', 'collection_buckets'
  ];
  
  if (bankingTables.includes(tableName)) {
    return `kastle_banking.${tableName}`;
  }
  
  return `kastle_collection.${tableName}`;
}

// Error handling wrapper
export async function handleSupabaseError(error) {
  console.error('Supabase error:', error);
  
  if (error?.message?.includes('JWT')) {
    console.error('Authentication error. Please check your Supabase keys.');
  } else if (error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
    console.error('Table not found. Please check your database schema.');
  } else if (error?.code === 'PGRST301') {
    console.error('Database connection error. Please check your Supabase URL.');
  } else if (error?.message?.includes('permission denied')) {
    console.error('Permission denied. Please check RLS policies.');
  }
  
  return {
    success: false,
    error: error.message || 'An unexpected error occurred',
    data: null
  };
}

// API response formatter
export function formatApiResponse(data, error = null, pagination = null) {
  if (error) {
    return handleSupabaseError(error);
  }
  
  const response = {
    success: true,
    data: data || null,
    error: null
  };
  
  if (pagination) {
    response.pagination = pagination;
  }
  
  return response;
}

// Mock data for fallback
export const MOCK_DATA = {
  dashboard: {
    totalCustomers: 12847,
    totalAccounts: 18293,
    totalDeposits: 2400000000,
    totalLoans: 1800000000,
    dailyTransactions: 8547,
    monthlyRevenue: 45200000,
    recentTransactions: [
      {
        id: 'TRN001',
        customer_name: 'Ahmed Al-Rashid',
        type: 'Transfer',
        amount: 15000,
        status: 'Completed',
        transaction_datetime: new Date().toISOString(),
        description: 'Fund Transfer'
      },
      {
        id: 'TRN002',
        customer_name: 'Fatima Al-Zahra',
        type: 'Deposit',
        amount: 5500,
        status: 'Pending',
        transaction_datetime: new Date(Date.now() - 300000).toISOString(),
        description: 'Cash Deposit'
      }
    ]
  }
};

// Test database connection with schema awareness
export async function testConnection() {
  if (!supabase || !supabaseCollection) {
    return { success: false, error: 'Supabase clients not initialized' };
  }
  
  try {
    // Test banking schema
    const { data: bankingTest, error: bankingError } = await supabaseBanking
      .from(TABLES.CUSTOMERS)
      .select('customer_id')
      .limit(1);
    
    if (bankingError) {
      console.error('❌ Banking schema connection failed:', bankingError);
    } else {
      console.log('✅ Banking schema connection successful');
    }
    
    // Test collection schema
    const { data: collectionTest, error: collectionError } = await supabaseCollection
      .from(TABLES.COLLECTION_OFFICERS)
      .select('officer_id')
      .limit(1);
    
    if (collectionError) {
      console.error('❌ Collection schema connection failed:', collectionError);
    } else {
      console.log('✅ Collection schema connection successful');
    }
    
    const success = !bankingError || !collectionError;
    return { 
      success, 
      banking: !bankingError,
      collection: !collectionError,
      error: bankingError?.message || collectionError?.message 
    };
  } catch (error) {
    console.error('❌ Database connection test failed:', error);
    return { success: false, error: error.message };
  }
}

// Helper to execute queries with proper schema
export async function executeQuery(tableName, query, options = {}) {
  const client = getClientForTable(tableName);
  
  if (!client) {
    return formatApiResponse(null, new Error('Database client not initialized'));
  }
  
  try {
    const result = await query(client.from(tableName));
    return formatApiResponse(result.data, result.error);
  } catch (error) {
    return formatApiResponse(null, error);
  }
}

// Initialize and test connection
if (isSupabaseConfigured) {
  testConnection().then(result => {
    if (!result.success) {
      console.warn('Database connection test failed:', result.error);
    } else {
      console.log('Database schemas connected:', {
        banking: result.banking ? '✅' : '❌',
        collection: result.collection ? '✅' : '❌'
      });
    }
  });
}