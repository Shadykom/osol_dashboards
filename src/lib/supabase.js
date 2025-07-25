import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if Supabase credentials are configured
const isSupabaseConfigured = supabaseUrl !== 'https://your-project.supabase.co' && 
                            supabaseAnonKey !== 'your-anon-key' &&
                            supabaseUrl && supabaseAnonKey;

console.log('Supabase configuration status:', isSupabaseConfigured ? 'Configured' : 'Using mock data mode');

// Create main Supabase client (uses public schema by default)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Use the main client for all operations since schema-qualified table names work
export const supabaseBanking = supabase;
export const supabaseCollection = supabase;

// Database schema constants - using schema-qualified table names
export const TABLES = {
  // kastle_banking schema tables
  CUSTOMERS: 'kastle_banking.customers',
  ACCOUNTS: 'kastle_banking.accounts',
  TRANSACTIONS: 'kastle_banking.transactions',
  LOAN_ACCOUNTS: 'kastle_banking.loan_accounts',
  BRANCHES: 'kastle_banking.branches',
  CURRENCIES: 'kastle_banking.currencies',
  COUNTRIES: 'kastle_banking.countries',
  AUDIT_TRAIL: 'kastle_banking.audit_trail',
  AUTH_USER_PROFILES: 'kastle_banking.auth_user_profiles',
  REALTIME_NOTIFICATIONS: 'kastle_banking.realtime_notifications',
  CUSTOMER_ADDRESSES: 'kastle_banking.customer_addresses',
  CUSTOMER_CONTACTS: 'kastle_banking.customer_contacts',
  CUSTOMER_DOCUMENTS: 'kastle_banking.customer_documents',
  CUSTOMER_TYPES: 'kastle_banking.customer_types',
  LOAN_APPLICATIONS: 'kastle_banking.loan_applications',
  COLLECTION_BUCKETS: 'kastle_banking.collection_buckets',
  COLLECTION_CASES: 'kastle_banking.collection_cases',
  PRODUCTS: 'kastle_banking.products',
  PRODUCT_CATEGORIES: 'kastle_banking.product_categories',
  BANK_CONFIG: 'kastle_banking.bank_config',
  
  // kastle_collection schema tables
  COLLECTION_AUDIT_TRAIL: 'kastle_collection.audit_trail',
  COLLECTION_CALL_RECORDS: 'kastle_collection.call_records',
  COLLECTION_CAMPAIGNS: 'kastle_collection.campaigns',
  COLLECTION_CASE_DETAILS: 'kastle_collection.case_details',
  COLLECTION_INTERACTIONS: 'kastle_collection.interactions',
  COLLECTION_OFFICERS: 'kastle_collection.officers',
  COLLECTION_SCORES: 'kastle_collection.scores',
  COLLECTION_STRATEGIES: 'kastle_collection.strategies',
  COLLECTION_SYSTEM_PERFORMANCE: 'kastle_collection.system_performance',
  COLLECTION_TEAMS: 'kastle_collection.teams',
  DAILY_COLLECTION_SUMMARY: 'kastle_collection.daily_collection_summary',
  DIGITAL_COLLECTION_ATTEMPTS: 'kastle_collection.digital_collection_attempts',
  FIELD_VISITS: 'kastle_collection.field_visits',
  HARDSHIP_APPLICATIONS: 'kastle_collection.hardship_applications',
  IVR_PAYMENT_ATTEMPTS: 'kastle_collection.ivr_payment_attempts',
  LEGAL_CASES: 'kastle_collection.legal_cases',
  LOAN_RESTRUCTURING: 'kastle_collection.loan_restructuring',
  OFFICER_PERFORMANCE_METRICS: 'kastle_collection.officer_performance_metrics',
  PROMISE_TO_PAY: 'kastle_collection.promise_to_pay',
  REPOSSESSED_ASSETS: 'kastle_collection.repossessed_assets',
  SHARIA_COMPLIANCE_LOG: 'kastle_collection.sharia_compliance_log'
};

// Helper function to handle Supabase errors
export function handleSupabaseError(error) {
  console.error('Supabase error:', error);
  
  if (error?.code === 'PGRST116') {
    return { error: 'No data found', code: 'NOT_FOUND' };
  }
  
  if (error?.code === 'PGRST106') {
    return { error: 'Schema not accessible. Please check Supabase configuration.', code: 'SCHEMA_ERROR' };
  }
  
  if (error?.code === '23505') {
    return { error: 'Record already exists', code: 'DUPLICATE' };
  }
  
  if (error?.code === '23503') {
    return { error: 'Referenced record not found', code: 'FOREIGN_KEY_VIOLATION' };
  }
  
  if (error?.message?.includes('406')) {
    return { error: 'Table not accessible. Please verify schema configuration.', code: 'ACCESS_DENIED' };
  }
  
  return { 
    error: error?.message || 'An unexpected error occurred', 
    code: error?.code || 'UNKNOWN_ERROR' 
  };
}

// Helper function to format API response
export function formatApiResponse(data, error = null, pagination = null) {
  if (error) {
    return {
      success: false,
      data: null,
      error: handleSupabaseError(error),
      pagination: null
    };
  }
  
  return {
    success: true,
    data,
    error: null,
    pagination
  };
}

// Helper function to get appropriate client for table
export function getClientForTable(tableName) {
  // Always use the main client since we're using schema-qualified table names
  return supabase;
}

// Helper function to get table name without schema prefix
export function getTableNameOnly(tableName) {
  return tableName.includes('.') ? tableName.split('.')[1] : tableName;
}

// Mock data for fallback when Supabase is not configured or fails
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
        id: 1,
        customer_name: 'أحمد محمد',
        amount: 15000,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        transaction_datetime: new Date().toISOString()
      },
      {
        id: 2,
        customer_name: 'فاطمة علي',
        amount: 8500,
        type: 'WITHDRAWAL',
        status: 'COMPLETED',
        transaction_datetime: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 3,
        customer_name: 'محمد السعيد',
        amount: 25000,
        type: 'TRANSFER',
        status: 'PENDING',
        transaction_datetime: new Date(Date.now() - 7200000).toISOString()
      }
    ]
  },
  customers: [
    {
      id: 1,
      customer_name: 'أحمد محمد علي',
      customer_type: 'INDIVIDUAL',
      status: 'ACTIVE',
      total_balance: 125000,
      created_at: '2024-01-15'
    },
    {
      id: 2,
      customer_name: 'شركة التجارة الحديثة',
      customer_type: 'CORPORATE',
      status: 'ACTIVE',
      total_balance: 850000,
      created_at: '2024-02-10'
    }
  ]
};

export { isSupabaseConfigured };

