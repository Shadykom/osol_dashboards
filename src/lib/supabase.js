import { createClient } from '@supabase/supabase-js';

// Check if we're in mock mode
const ENABLE_MOCK_DATA = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Check if credentials are properly configured
const isConfigured = supabaseUrl !== 'https://your-project.supabase.co' && 
                    supabaseAnonKey !== 'your-anon-key' &&
                    supabaseAnonKey !== 'your-anon-key-here';

// Create a mock client for development when credentials are not configured
const createMockClient = () => {
  console.warn('Supabase credentials not configured. Using mock data mode.');
  
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: null, count: 0 }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({ 
        select: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null })
      }),
      gte: () => ({ select: () => Promise.resolve({ data: [], error: null, count: 0 }) }),
      in: () => ({ select: () => Promise.resolve({ data: [], error: null }) })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: { message: 'Mock mode active' } }),
      signOut: () => Promise.resolve({ error: null })
    },
    realtime: {
      channel: () => ({
        on: () => ({ subscribe: () => {} }),
        unsubscribe: () => {}
      })
    }
  };
};

// Create Supabase client or mock client
export const supabase = (isConfigured && !ENABLE_MOCK_DATA) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
    })
  : createMockClient();

// Export a flag to indicate if we're in mock mode
export const isMockMode = !isConfigured || ENABLE_MOCK_DATA;

// Database schema constants - using full schema.table names for kastle_banking schema
export const TABLES = {
  CUSTOMERS: 'kastle_banking.customers',
  ACCOUNTS: 'kastle_banking.accounts',
  TRANSACTIONS: 'kastle_banking.transactions',
  LOAN_ACCOUNTS: 'kastle_banking.loan_accounts',
  ACCOUNT_TYPES: 'kastle_banking.account_types',
  TRANSACTION_TYPES: 'kastle_banking.transaction_types',
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
  COLLECTION_AUDIT_TRAIL: 'kastle_collection.collection_audit_trail',
  COLLECTION_CALL_RECORDS: 'kastle_collection.collection_call_records',
  COLLECTION_CAMPAIGNS: 'kastle_collection.collection_campaigns',
  COLLECTION_CASE_DETAILS: 'kastle_collection.collection_case_details',
  COLLECTION_INTERACTIONS: 'kastle_collection.collection_interactions',
  COLLECTION_OFFICERS: 'kastle_collection.collection_officers',
  COLLECTION_SCORES: 'kastle_collection.collection_scores',
  COLLECTION_STRATEGIES: 'kastle_collection.collection_strategies',
  COLLECTION_SYSTEM_PERFORMANCE: 'kastle_collection.collection_system_performance',
  COLLECTION_TEAMS: 'kastle_collection.collection_teams',
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
  
  if (error?.code === '23505') {
    return { error: 'Record already exists', code: 'DUPLICATE' };
  }
  
  if (error?.code === '23503') {
    return { error: 'Referenced record not found', code: 'FOREIGN_KEY_VIOLATION' };
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

