import { supabaseBanking } from '@/lib/supabase';

// Check if user is authenticated - ALWAYS RETURN TRUE
export const checkAuth = async () => {
  // Always return authenticated with demo session
  const demoUser = {
    id: 'demo-user-' + Date.now(),
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo@osol.sa',
    email_confirmed_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email']
    },
    user_metadata: {
      full_name: 'Demo User',
      avatar_url: null
    }
  };

  const demoSession = {
    access_token: import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'demo-refresh-token',
    user: demoUser
  };

  return { isAuthenticated: true, session: demoSession };
};

// Handle 401 errors - no longer needed but kept for compatibility
export const handle401Error = async (error) => {
  console.log('401 error bypassed - authentication not required');
  return true;
};

// Create authenticated Supabase client - returns regular client
export const createAuthenticatedClient = async () => {
  try {
    // Just return the existing supabase client
    return supabase;
  } catch (error) {
    console.error('Error creating client:', error);
    return supabase;
  }
};

// Execute authenticated query - no authentication required
export const authenticatedQuery = async (queryFn, options = {}) => {
  try {
    // If queryFn is already a query object (has .select, .from, etc.), execute it directly
    if (queryFn && typeof queryFn.then === 'function') {
      const { data, error } = await queryFn;
      if (error) throw error;
      return data;
    }
    
    // If it's a function, call it (but don't pass supabase since queries use supabaseBanking)
    const query = typeof queryFn === 'function' ? queryFn() : queryFn;
    const { data, error } = await query;
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Query error:', error);
    
    // Return empty array on error
    return [];
  }
};

// Refresh authentication headers - no longer needed
export const refreshAuthHeaders = async () => {
  console.log('Authentication refresh bypassed');
  return true;
};

// Auto-login for development/demo purposes - always succeeds
export const autoLogin = async () => {
  console.log('Auto-login bypassed - authentication not required');
  
  // Always return success with demo session
  const demoUser = {
    id: 'demo-user-' + Date.now(),
    aud: 'authenticated',
    role: 'authenticated',
    email: 'demo@osol.sa',
    email_confirmed_at: new Date().toISOString(),
    app_metadata: {
      provider: 'email',
      providers: ['email']
    },
    user_metadata: {
      full_name: 'Demo User',
      avatar_url: null
    }
  };

  const demoSession = {
    access_token: import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'demo-refresh-token',
    user: demoUser
  };

  // Store demo session info
  localStorage.setItem('demo_session', JSON.stringify(demoSession));
  localStorage.setItem('demo_user', JSON.stringify(demoUser));
  
  console.log('Demo session created successfully');
  return true;
};

// Get current user - always returns demo user
export const getCurrentUser = async () => {
  const demoUser = {
    id: 'demo-user',
    email: 'demo@osol.sa',
    user_metadata: {
      full_name: 'Demo User'
    }
  };
  
  return demoUser;
};

// Check if user has role - always returns true
export const hasRole = (user, role) => {
  return true;
};

// Get user roles - returns all roles
export const getUserRoles = (user) => {
  return ['admin', 'user', 'viewer', 'manager'];
};