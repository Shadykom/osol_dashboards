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

// Create a mock client for when Supabase is not configured
const createMockClient = () => {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: { message: 'Database not configured' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } }),
      upsert: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: { message: 'Auth not configured' } }),
      signOut: () => Promise.resolve({ error: null })
    },
    rpc: () => Promise.resolve({ data: null, error: { message: 'Database not configured' } })
  };
};

// Create main Supabase client or mock if not configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
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
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey
        }
      }
    })
  : createMockClient();

// Create a client specifically for kastle_banking schema
export const supabaseBanking = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage,
        storageKey: 'osol-auth'
      },
      db: {
        schema: 'kastle_banking'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey,
          'Prefer': 'return=representation'
        }
      }
    })
  : createMockClient();

// Create a client specifically for kastle_collection schema
export const supabaseCollection = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: supabase.auth,
      db: {
        schema: 'kastle_collection'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })
  : createMockClient();

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
  PRODUCTS: 'kastle_banking.products',
  PRODUCT_CATEGORIES: 'kastle_banking.product_categories',
  BANK_CONFIG: 'kastle_banking.bank_config',
  COLLECTION_CASES: 'kastle_banking.collection_cases',
  COLLECTION_BUCKETS: 'kastle_banking.collection_buckets',
  COLLECTION_RATES: 'kastle_banking.collection_rates',
  
  // kastle_collection schema tables
  COLLECTION_AUDIT_TRAIL: 'kastle_collection.audit_trail',
  COLLECTION_CALL_RECORDS: 'kastle_collection.call_records',
  COLLECTION_CAMPAIGNS: 'kastle_collection.collection_campaigns',
  COLLECTION_INTERACTIONS: 'kastle_collection.collection_interactions',
  COLLECTION_OFFICERS: 'kastle_collection.collection_officers',
  COLLECTION_SCORES: 'kastle_collection.collection_scores',
  COLLECTION_STRATEGIES: 'kastle_collection.collection_strategies',
  COLLECTION_SYSTEM_PERFORMANCE: 'kastle_collection.system_performance',
  COLLECTION_TEAMS: 'kastle_collection.collection_teams',
  PROMISE_TO_PAY: 'kastle_collection.promise_to_pay',
  LEGAL_CASES: 'kastle_collection.legal_cases',
  DAILY_COLLECTION_SUMMARY: 'kastle_collection.daily_collection_summary',
  DIGITAL_COLLECTION_ATTEMPTS: 'kastle_collection.digital_collection_attempts',
  FIELD_VISITS: 'kastle_collection.field_visits',
  HARDSHIP_APPLICATIONS: 'kastle_collection.hardship_applications',
  OFFICER_PERFORMANCE_METRICS: 'kastle_collection.officer_performance_metrics',
  OFFICER_PERFORMANCE_SUMMARY: 'kastle_collection.officer_performance_summary',
  CASE_BUCKET_HISTORY: 'kastle_collection.case_bucket_history'
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