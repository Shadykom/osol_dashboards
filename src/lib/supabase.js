import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client without schema specification to use public schema
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

