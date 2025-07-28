// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Get environment variables with better debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables (only in development)
if (import.meta.env.DEV) {
  console.log('Environment variables check:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set');
}

// Check if Supabase credentials are configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
                            supabaseUrl !== 'https://your-project.supabase.co' && 
                            supabaseAnonKey !== 'your-anon-key';

console.log('Supabase configuration status:', isSupabaseConfigured ? 'Configured' : 'Missing credentials');

if (!isSupabaseConfigured) {
  console.error('❌ Supabase credentials are missing or invalid');
  console.error('VITE_SUPABASE_URL:', supabaseUrl || 'Missing');
  console.error('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Present' : 'Missing');
  throw new Error('Supabase configuration is required. Please check your environment variables.');
}

// Create main Supabase client (uses public schema by default)
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'osol-auth'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });

// Create a client specifically for kastle_banking schema
// Share the auth instance to avoid multiple GoTrueClient warnings
export const supabaseBanking = createClient(supabaseUrl, supabaseAnonKey, {
  auth: supabase.auth,
  db: {
    schema: 'kastle_banking'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Create a client specifically for kastle_collection schema
// Share the auth instance to avoid multiple GoTrueClient warnings
export const supabaseCollection = createClient(supabaseUrl, supabaseAnonKey, {
  auth: supabase.auth,
  db: {
    schema: 'kastle_collection'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Database schema constants - using schema-qualified table names
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
  PRODUCTS: 'products',
  PRODUCT_CATEGORIES: 'product_categories',
  BANK_CONFIG: 'bank_config',
  COLLECTION_CASES: 'collection_cases',
  COLLECTION_BUCKETS: 'collection_buckets',
  COLLECTION_RATES: 'collection_rates',
  
  // kastle_collection schema tables
  COLLECTION_AUDIT_TRAIL: 'audit_trail',
  COLLECTION_CALL_RECORDS: 'call_records',
  COLLECTION_CAMPAIGNS: 'collection_campaigns',
  COLLECTION_INTERACTIONS: 'collection_interactions',
  COLLECTION_OFFICERS: 'collection_officers',
  COLLECTION_SCORES: 'collection_scores',
  COLLECTION_STRATEGIES: 'collection_strategies',
  COLLECTION_SYSTEM_PERFORMANCE: 'system_performance',
  COLLECTION_TEAMS: 'collection_teams',
  PROMISE_TO_PAY: 'promise_to_pay',
  LEGAL_CASES: 'legal_cases',
  DAILY_COLLECTION_SUMMARY: 'daily_collection_summary',
  DIGITAL_COLLECTION_ATTEMPTS: 'digital_collection_attempts',
  FIELD_VISITS: 'field_visits',
  HARDSHIP_APPLICATIONS: 'hardship_applications',
  OFFICER_PERFORMANCE_METRICS: 'officer_performance_metrics',
  OFFICER_PERFORMANCE_SUMMARY: 'officer_performance_summary',
  CASE_BUCKET_HISTORY: 'case_bucket_history'
};

// Helper function to get the appropriate client for a table
export function getClientForTable(tableName) {
  // Determine which client to use based on the table name
  if (tableName.startsWith('kastle_banking.') || 
      ['customers', 'accounts', 'transactions', 'loan_accounts', 'branches', 
       'products', 'collection_cases', 'collection_buckets'].includes(tableName)) {
    return supabaseBanking;
  } else if (tableName.startsWith('kastle_collection.') || 
             ['collection_officers', 'collection_teams', 'collection_interactions',
              'promise_to_pay', 'officer_performance_metrics'].includes(tableName)) {
    return supabaseCollection;
  } else if (tableName.startsWith('auth.')) {
    return supabase;
  }
  // Default to the main client
  return supabase;
}