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

// Function to get current auth token
const getAuthToken = () => {
  try {
    const storedAuth = localStorage.getItem('osol-auth');
    if (storedAuth) {
      const authData = JSON.parse(storedAuth);
      // Check for demo session format
      if (authData.currentSession && authData.expiresAt > Date.now()) {
        return authData.currentSession.access_token || supabaseAnonKey;
      }
      // Check for regular session format
      if (authData.access_token) {
        return authData.access_token;
      }
    }
  } catch (e) {
    // Invalid stored data
  }
  return supabaseAnonKey;
};

// Custom fetch function to ensure proper headers
const customFetch = (url, options = {}) => {
  const token = getAuthToken();
  const headers = {
    ...options.headers,
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${token}`
  };
  return fetch(url, { ...options, headers });
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
        },
        fetch: customFetch
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
        },
        fetch: customFetch
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
      },
      global: {
        headers: {
          'apikey': supabaseAnonKey,
          'Prefer': 'return=representation'
        },
        fetch: customFetch
      }
    })
  : createMockClient();

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
  COLLECTION_AUDIT_TRAIL: 'kastle_collection.audit_trail',
  COLLECTION_AUTH_USER_PROFILES: 'kastle_collection.auth_user_profiles',
  COLLECTION_CALL_ATTEMPTS: 'kastle_collection.call_attempts',
  COLLECTION_CASES_COLL: 'kastle_collection.collection_cases',
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

// Separate table constants for collection schema (without schema prefix)
export const COLLECTION_TABLES = {
  AUDIT_TRAIL: 'audit_trail',
  AUTH_USER_PROFILES: 'auth_user_profiles',
  CALL_ATTEMPTS: 'call_attempts',
  COLLECTION_CASES: 'collection_cases',
  COLLECTION_INTERACTIONS: 'collection_interactions',
  COLLECTION_OFFICERS: 'collection_officers',
  COLLECTION_SCORES: 'collection_scores',
  COLLECTION_STRATEGIES: 'collection_strategies',
  SYSTEM_PERFORMANCE: 'system_performance',
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