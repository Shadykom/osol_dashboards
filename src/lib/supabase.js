import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, validateSupabaseConfig } from './supabaseConfig';

const config = getSupabaseConfig();

// Create Supabase client with schema configuration
export const supabase = createClient(config.url, config.anonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  db: {
    schema: 'kastle_banking'
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Create a separate client for banking operations (same as main client for now)
export const supabaseBanking = supabase;

// Create a separate client for collection operations (same as main client for now)
export const supabaseCollection = supabase;

// Check if Supabase is configured
export const isSupabaseConfigured = validateSupabaseConfig();

// Update table constants to use just table names (without schema prefix)
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
  REALTIME_NOTIFICATIONS: 'realtime_notifications'
};

// Mock data for when Supabase is not configured
export const MOCK_DATA = {
  enabled: !isSupabaseConfigured,
  message: 'Using mock data - Supabase not configured'
};

// Get the appropriate client for a table (for future multi-schema support)
export function getClientForTable(tableName) {
  // For now, all tables use the same client
  return supabase;
}

// Format API response to a consistent structure
export function formatApiResponse(data, error = null) {
  if (error) {
    return {
      success: false,
      data: null,
      error: error.message || 'An error occurred',
      code: error.code || 'UNKNOWN_ERROR'
    };
  }
  
  return {
    success: true,
    data,
    error: null,
    code: 'SUCCESS'
  };
}

// Handle Supabase errors consistently
export function handleSupabaseError(error) {
  console.error('Supabase Error:', error);
  
  // Common error handling patterns
  if (error.code === 'PGRST116') {
    return {
      message: 'No data found',
      code: 'NOT_FOUND',
      details: error.details
    };
  }
  
  if (error.code === '42P01') {
    return {
      message: 'Table does not exist',
      code: 'TABLE_NOT_FOUND',
      details: error.details
    };
  }
  
  if (error.code === '23505') {
    return {
      message: 'Duplicate entry',
      code: 'DUPLICATE_ENTRY',
      details: error.details
    };
  }
  
  // Default error response
  return {
    message: error.message || 'An unexpected error occurred',
    code: error.code || 'UNKNOWN_ERROR',
    details: error.details || null
  };
}

// Test connection function
export async function testConnection() {
  try {
    if (!config.isConfigured) {
      console.log('Supabase not configured, using mock mode');
      return { success: false, mockMode: true };
    }

    // Try a simple query to test the connection
    const { data, error } = await supabase
      .from(TABLES.CUSTOMERS)
      .select('count', { count: 'exact', head: true });

    if (error) {
      console.error('Supabase connection test failed:', error);
      return { success: false, error: error.message };
    }

    console.log('Supabase connection test successful');
    return { success: true, count: data };
  } catch (err) {
    console.error('Supabase connection test error:', err);
    return { success: false, error: err.message };
  }
}