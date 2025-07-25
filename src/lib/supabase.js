import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client using default public schema
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

// Database schema constants - using full table names as they should be in public schema
export const TABLES = {
  CUSTOMERS: 'kastle_banking_customers',
  ACCOUNTS: 'kastle_banking_accounts', 
  TRANSACTIONS: 'kastle_banking_transactions',
  LOAN_ACCOUNTS: 'kastle_banking_loan_accounts',
  BRANCHES: 'kastle_banking_branches',
  CURRENCIES: 'kastle_banking_currencies',
  COUNTRIES: 'kastle_banking_countries',
  AUDIT_TRAIL: 'kastle_banking_audit_trail',
  AUTH_USER_PROFILES: 'kastle_banking_auth_user_profiles',
  REALTIME_NOTIFICATIONS: 'kastle_banking_realtime_notifications',
  CUSTOMER_ADDRESSES: 'kastle_banking_customer_addresses',
  CUSTOMER_CONTACTS: 'kastle_banking_customer_contacts',
  CUSTOMER_DOCUMENTS: 'kastle_banking_customer_documents',
  CUSTOMER_TYPES: 'kastle_banking_customer_types',
  LOAN_APPLICATIONS: 'kastle_banking_loan_applications',
  COLLECTION_BUCKETS: 'kastle_banking_collection_buckets',
  COLLECTION_CASES: 'kastle_banking_collection_cases',
  PRODUCTS: 'kastle_banking_products',
  PRODUCT_CATEGORIES: 'kastle_banking_product_categories',
  BANK_CONFIG: 'kastle_banking_bank_config',
  
  // kastle_collection tables in public schema
  COLLECTION_AUDIT_TRAIL: 'kastle_collection_audit_trail',
  COLLECTION_CALL_RECORDS: 'kastle_collection_call_records',
  COLLECTION_CAMPAIGNS: 'kastle_collection_campaigns',
  COLLECTION_CASE_DETAILS: 'kastle_collection_case_details',
  COLLECTION_INTERACTIONS: 'kastle_collection_interactions',
  COLLECTION_OFFICERS: 'kastle_collection_officers',
  COLLECTION_SCORES: 'kastle_collection_scores',
  COLLECTION_STRATEGIES: 'kastle_collection_strategies',
  COLLECTION_SYSTEM_PERFORMANCE: 'kastle_collection_system_performance',
  COLLECTION_TEAMS: 'kastle_collection_teams',
  DAILY_COLLECTION_SUMMARY: 'kastle_collection_daily_collection_summary',
  DIGITAL_COLLECTION_ATTEMPTS: 'kastle_collection_digital_collection_attempts',
  FIELD_VISITS: 'kastle_collection_field_visits',
  HARDSHIP_APPLICATIONS: 'kastle_collection_hardship_applications',
  IVR_PAYMENT_ATTEMPTS: 'kastle_collection_ivr_payment_attempts',
  LEGAL_CASES: 'kastle_collection_legal_cases',
  LOAN_RESTRUCTURING: 'kastle_collection_loan_restructuring',
  OFFICER_PERFORMANCE_METRICS: 'kastle_collection_officer_performance_metrics',
  PROMISE_TO_PAY: 'kastle_collection_promise_to_pay',
  REPOSSESSED_ASSETS: 'kastle_collection_repossessed_assets',
  SHARIA_COMPLIANCE_LOG: 'kastle_collection_sharia_compliance_log'
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


