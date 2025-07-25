import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client with kastle_banking as default schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'kastle_banking'
  },
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

// Create separate client for kastle_collection schema
export const supabaseCollection = createClient(supabaseUrl, supabaseAnonKey, {
  db: {
    schema: 'kastle_collection'
  },
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});

// Database schema constants - using actual table names in their respective schemas
export const TABLES = {
  // kastle_banking schema tables
  CUSTOMERS: 'customers',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  LOAN_ACCOUNTS: 'loan_accounts',
  BRANCHES: 'branches',
  CURRENCIES: 'currencies',
  COUNTRIES: 'countries',
  AUDIT_TRAIL: 'audit_trail',
  AUTH_USER_PROFILES: 'auth_user_profiles',
  REALTIME_NOTIFICATIONS: 'realtime_notifications',
  CUSTOMER_ADDRESSES: 'customer_addresses',
  CUSTOMER_CONTACTS: 'customer_contacts',
  CUSTOMER_DOCUMENTS: 'customer_documents',
  CUSTOMER_TYPES: 'customer_types',
  LOAN_APPLICATIONS: 'loan_applications',
  COLLECTION_BUCKETS: 'collection_buckets',
  COLLECTION_CASES: 'collection_cases',
  PRODUCTS: 'products',
  PRODUCT_CATEGORIES: 'product_categories',
  BANK_CONFIG: 'bank_config',
  
  // kastle_collection schema tables
  COLLECTION_AUDIT_TRAIL: 'audit_trail',
  COLLECTION_CALL_RECORDS: 'call_records',
  COLLECTION_CAMPAIGNS: 'campaigns',
  COLLECTION_CASE_DETAILS: 'case_details',
  COLLECTION_INTERACTIONS: 'interactions',
  COLLECTION_OFFICERS: 'officers',
  COLLECTION_SCORES: 'scores',
  COLLECTION_STRATEGIES: 'strategies',
  COLLECTION_SYSTEM_PERFORMANCE: 'system_performance',
  COLLECTION_TEAMS: 'teams',
  DAILY_COLLECTION_SUMMARY: 'daily_collection_summary',
  DIGITAL_COLLECTION_ATTEMPTS: 'digital_collection_attempts',
  FIELD_VISITS: 'field_visits',
  HARDSHIP_APPLICATIONS: 'hardship_applications',
  IVR_PAYMENT_ATTEMPTS: 'ivr_payment_attempts',
  LEGAL_CASES: 'legal_cases',
  LOAN_RESTRUCTURING: 'loan_restructuring',
  OFFICER_PERFORMANCE_METRICS: 'officer_performance_metrics',
  PROMISE_TO_PAY: 'promise_to_pay',
  REPOSSESSED_ASSETS: 'repossessed_assets',
  SHARIA_COMPLIANCE_LOG: 'sharia_compliance_log'
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

