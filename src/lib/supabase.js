import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

// Create Supabase client with kastle_banking schema
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'kastle_banking'  // Specify the kastle_banking schema
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database schema constants - now using just table names without schema prefix
export const TABLES = {
  CUSTOMERS: 'customers',
  ACCOUNTS: 'accounts',
  TRANSACTIONS: 'transactions',
  LOAN_ACCOUNTS: 'loan_accounts',
  ACCOUNT_TYPES: 'account_types',
  TRANSACTION_TYPES: 'transaction_types',
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
  BANK_CONFIG: 'bank_config'
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

