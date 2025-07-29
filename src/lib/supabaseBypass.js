// Temporary Supabase bypass configuration
import { createClient } from '@supabase/supabase-js';

// Use a mock client that bypasses authentication
export const supabaseBypass = {
  from: (table) => ({
    select: async () => ({ data: [], error: null }),
    insert: async () => ({ data: null, error: null }),
    update: async () => ({ data: null, error: null }),
    delete: async () => ({ data: null, error: null }),
  }),
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    signIn: async () => ({ data: null, error: null }),
    signOut: async () => ({ error: null }),
  },
};

// Export as default
export default supabaseBypass;
