/**
 * =====================================================
 * Supabase Client for Policy Schema (PDP)
 * =====================================================
 * 
 * This client is configured to work with the policy schema tables
 * through public schema views (pdp_* tables).
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Check if Supabase credentials are configured
const isSupabaseConfigured = supabaseUrl && supabaseAnonKey && 
                            supabaseUrl !== 'https://your-project.supabase.co' && 
                            supabaseAnonKey !== 'your-anon-key';

// Create a mock client for when Supabase is not configured
const createMockClient = () => {
  const mockResponse = { data: null, error: { message: 'Database not configured - using mock data' } };
  return {
    from: () => ({
      select: () => ({ 
        eq: () => ({ 
          eq: () => ({ 
            single: () => Promise.resolve(mockResponse),
            order: () => ({ limit: () => Promise.resolve(mockResponse) })
          }),
          single: () => Promise.resolve(mockResponse),
          order: () => ({ limit: () => Promise.resolve(mockResponse) })
        }),
        single: () => Promise.resolve(mockResponse)
      }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve(mockResponse) }) }),
      update: () => ({ eq: () => ({ select: () => ({ single: () => Promise.resolve(mockResponse) }) }) }),
      delete: () => Promise.resolve(mockResponse),
      upsert: () => Promise.resolve(mockResponse)
    }),
    rpc: () => Promise.resolve(mockResponse)
  };
};

// Create Supabase client for public schema (where pdp_ views are)
let supabasePolicyInstance = null;

export const supabasePolicy = (() => {
  if (!supabasePolicyInstance) {
    supabasePolicyInstance = isSupabaseConfigured 
      ? createClient(supabaseUrl, supabaseAnonKey, {
          db: {
            schema: 'public'  // Use public schema where pdp_ views are
          },
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: false
          },
          global: {
            headers: {
              'apikey': supabaseAnonKey
            }
          }
        })
      : createMockClient();
  }
  return supabasePolicyInstance;
})();

// Table name constants for PDP (using public schema views)
export const PDP_TABLES = {
  POLICY_PROFILES: 'pdp_policy_profiles',
  POLICY_VERSIONS: 'pdp_policy_versions',
  DECISION_LOG: 'pdp_decision_log',
  WORKFLOW_APPROVALS: 'pdp_workflow_approvals',
  CONTACT_ATTEMPT_CACHE: 'pdp_contact_attempt_cache'
};

// RPC function names
export const PDP_FUNCTIONS = {
  GET_ACTIVE_POLICY_VERSION: 'pdp_get_active_policy_version',
  COUNT_CONTACT_ATTEMPTS: 'pdp_count_contact_attempts'
};

export default supabasePolicy;
