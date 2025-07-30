// lib/supabase.js
import { createClient } from '@supabase/supabase-js';

// Get environment variables with better debugging
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug environment variables (only in development)
console.log('🔍 Supabase Configuration Debug:');
console.log('VITE_SUPABASE_URL:', supabaseUrl);
console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 20)}...${supabaseAnonKey.slice(-10)}` : 'NOT SET');
console.log('Key length:', supabaseAnonKey?.length);
console.log('URL valid:', supabaseUrl?.includes('supabase.co'));
console.log('Key looks valid:', supabaseAnonKey?.startsWith('eyJ'));

if (import.meta.env.DEV) {
  console.log('Environment variables check:');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Not set');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? 'Set' : 'Not set');
}

// Check if Supabase credentials are configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
                            supabaseUrl !== 'https://your-project.supabase.co' && 
                            supabaseAnonKey !== 'your-anon-key' &&
                            supabaseAnonKey !== 'YOUR_ANON_KEY_HERE';

console.log('Supabase configuration status:', isSupabaseConfigured ? 'Configured' : 'Missing credentials');

// If credentials are missing, provide helpful instructions
if (!isSupabaseConfigured) {
  console.warn(`
⚠️ Supabase credentials not configured!

To fix the 401 errors:
1. Go to: https://supabase.com/dashboard/project/bzlenegoilnswsbanxgb/settings/api
2. Copy the "anon" key
3. Update your .env file with:
   VITE_SUPABASE_ANON_KEY=<your-anon-key>
4. Restart your dev server

Using mock data mode for now...
  `);
}

// Create a mock client for when Supabase is not configured
const createMockClient = () => {
  return {
    from: () => ({
      select: () => Promise.resolve({ data: [], error: { message: 'Database not configured - using mock data' } }),
      insert: () => Promise.resolve({ data: null, error: { message: 'Database not configured - using mock data' } }),
      update: () => Promise.resolve({ data: null, error: { message: 'Database not configured - using mock data' } }),
      delete: () => Promise.resolve({ data: null, error: { message: 'Database not configured - using mock data' } }),
      upsert: () => Promise.resolve({ data: null, error: { message: 'Database not configured - using mock data' } })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signIn: () => Promise.resolve({ data: null, error: { message: 'Auth not configured' } }),
      signOut: () => Promise.resolve({ error: null })
    },
    rpc: () => Promise.resolve({ data: null, error: { message: 'Database not configured - using mock data' } })
  };
};

// Function to get current auth token
const getAuthToken = () => {
  // For now, always use the anon key to avoid authentication issues
  return supabaseAnonKey;
  
  /* Original complex logic - temporarily disabled
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
  */
};

// Custom fetch function to ensure proper headers
const customFetch = (url, options = {}) => {
  const token = getAuthToken();
  
  // Determine if this is a data-modifying request
  const isDataRequest = ['POST', 'PUT', 'PATCH'].includes(options.method?.toUpperCase());
  
  const headers = {
    ...options.headers,
    'apikey': supabaseAnonKey,
    'Authorization': `Bearer ${token}`,
    // Add Content-Type for data requests if not already set
    ...(isDataRequest && !options.headers?.['Content-Type'] && {
      'Content-Type': 'application/json'
    }),
    // Add schema headers if this is a request to the REST API
    ...(url.includes('/rest/v1/') && {
      'Accept-Profile': 'kastle_banking',
      'Content-Profile': 'kastle_banking'
    })
  };
  return fetch(url, { ...options, headers });
};

// Create main Supabase client or mock if not configured
export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      db: {
        schema: 'kastle_banking'
      },
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
      db: {
        schema: 'kastle_banking'
      },
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
          'apikey': supabaseAnonKey,
          'Prefer': 'return=representation',
          'Accept-Profile': 'kastle_banking',
          'Content-Profile': 'kastle_banking'
        },
        fetch: customFetch
      }
    })
  : createMockClient();

// The supabaseCollection client now also points to kastle_banking schema
// This maintains backward compatibility while using the unified schema
export const supabaseCollection = supabaseBanking;

// Database schema constants - all tables now in kastle_banking schema
export const TABLES = {
  // Core banking tables
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
  DELINQUENCIES: 'delinquencies',
  
  // All collection tables are now in kastle_banking schema
  COLLECTION_AUDIT_TRAIL: 'audit_trail',
  COLLECTION_AUTH_USER_PROFILES: 'auth_user_profiles',
  COLLECTION_CALL_ATTEMPTS: 'call_attempts',
  COLLECTION_CASES_COLL: 'collection_cases',
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
  CASE_BUCKET_HISTORY: 'case_bucket_history',
  COLLECTION_CAMPAIGNS: 'collection_campaigns'
};

// Separate table constants for collection schema (without schema prefix)
// These are now the same as the main TABLES but kept for backward compatibility
export const COLLECTION_TABLES = {
  AUDIT_TRAIL: 'audit_trail',
  AUTH_USER_PROFILES: 'auth_user_profiles',
  CALL_ATTEMPTS: 'call_attempts',
  COLLECTION_CASES: 'collection_cases',
  COLLECTION_INTERACTIONS: 'collection_interactions',
  COLLECTION_OFFICERS: 'collection_officers',
  COLLECTION_TEAMS: 'collection_teams',
  COLLECTION_SCORES: 'collection_scores',
  COLLECTION_STRATEGIES: 'collection_strategies',
  COLLECTION_SYSTEM_PERFORMANCE: 'system_performance',
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
  // All tables now use the kastle_banking client
  if (tableName.startsWith('auth.')) {
    return supabase;
  }
  // Everything else uses the banking client
  return supabaseBanking;
}

// Diagnostic function for debugging
window.checkSupabaseConfig = async () => {
  console.log('=== SUPABASE CONFIGURATION CHECK ===');
  console.log('URL:', supabaseUrl);
  console.log('Key:', supabaseAnonKey ? `${supabaseAnonKey.substring(0, 30)}...${supabaseAnonKey.slice(-20)}` : 'NOT SET');
  console.log('Key Length:', supabaseAnonKey?.length);
  console.log('Is Configured:', isSupabaseConfigured);
  console.log('===================================');
  
  // Test a simple query to kastle_banking schema
  console.log('\n🔍 Testing kastle_banking schema access...');
  const { data, error } = await supabaseBanking.from('customers').select('*').limit(1);
  
  if (error) {
    console.error('❌ Test query failed:', error);
    if (error.code === '42P01') {
      console.error('\n⚠️  SCHEMA NOT EXPOSED!');
      console.error('Please follow these steps:');
      console.error('1. Go to: https://app.supabase.com/project/bzlenegoilnswsbanxgb/settings/api');
      console.error('2. Find "Exposed schemas" section');
      console.error('3. Add "kastle_banking" to the list');
      console.error('4. Click Save');
      console.error('\nCurrent error:', error.message);
    }
  } else {
    console.log('✅ Test query success! Schema is properly exposed.');
    console.log('Sample data:', data);
  }
  
  return !error;
};

// Export checkSchemaAccess function
export async function checkSchemaAccess() {
  try {
    // Try a simple query to test access
    const { data, error } = await supabaseBanking
      .from('customers')
      .select('customer_id')
      .limit(1);
    
    if (error && error.code === '42P01') {
      console.error('kastle_banking schema is not exposed!');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Error checking schema access:', error);
    return false;
  }
}

// Auto-run diagnostic on load
if (import.meta.env.DEV) {
  setTimeout(() => {
    console.log('💡 Run window.checkSupabaseConfig() in console to check configuration');
  }, 1000);
}