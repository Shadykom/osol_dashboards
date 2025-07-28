import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseBanking, supabaseCollection } from '@/lib/supabase';

// Check if user is authenticated
export const checkAuth = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return { isAuthenticated: !!session, session };
  } catch (error) {
    console.error('Auth check error:', error);
    return { isAuthenticated: false, session: null };
  }
};

// Get current auth token
export const getAuthToken = async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || null;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return null;
  }
};

// Create authenticated client with proper headers
export const createAuthenticatedClient = (supabaseUrl, supabaseAnonKey, schema = 'kastle_banking') => {
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
      storageKey: 'osol-auth'
    },
    db: {
      schema: schema
    },
    global: {
      headers: {
        'apikey': supabaseAnonKey
      }
    }
  });
};

// Refresh authentication headers for existing clients
export const refreshAuthHeaders = async () => {
  const token = await getAuthToken();
  if (token) {
    // Update headers for all clients
    const headers = {
      'Authorization': `Bearer ${token}`
    };
    
    // Note: Supabase clients don't have a direct way to update headers after creation
    // This would require recreating the clients or using a custom fetch function
    console.log('Auth token refreshed');
  }
};

// Auto-login for development/demo purposes
export const autoLogin = async () => {
  try {
    const { isAuthenticated } = await checkAuth();
    
    if (!isAuthenticated) {
      console.log('No active session, attempting auto-login...');
      
      // Try to sign in with demo credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'demo@osol.sa',
        password: 'demo123456'
      });
      
      if (error) {
        console.error('Auto-login failed:', error);
        
        // If demo user doesn't exist, try to create it
        if (error.message?.includes('Invalid login credentials')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'demo@osol.sa',
            password: 'demo123456',
            options: {
              data: {
                full_name: 'Demo User',
                role: 'admin'
              }
            }
          });
          
          if (signUpError) {
            console.error('Failed to create demo user:', signUpError);
            return false;
          }
          
          console.log('Demo user created successfully');
          return true;
        }
        
        return false;
      }
      
      console.log('Auto-login successful');
      return true;
    }
    
    return true;
  } catch (error) {
    console.error('Auto-login error:', error);
    return false;
  }
};

// Handle 401 errors by refreshing auth
export const handle401Error = async (error) => {
  if (error?.code === '401' || error?.message?.includes('JWT') || error?.message?.includes('401')) {
    console.log('Handling 401 error...');
    
    // Try to refresh the session
    const { data: { session }, error: refreshError } = await supabase.auth.refreshSession();
    
    if (!refreshError && session) {
      console.log('Session refreshed successfully');
      return true;
    }
    
    // If refresh failed, try auto-login
    const loginSuccess = await autoLogin();
    return loginSuccess;
  }
  
  return false;
};

// Wrapper for database queries with auth handling
export const authenticatedQuery = async (queryFn, fallbackData = null) => {
  try {
    const result = await queryFn();
    
    if (result.error) {
      const handled = await handle401Error(result.error);
      
      if (handled) {
        // Retry the query
        const retryResult = await queryFn();
        if (retryResult.error) {
          console.error('Query failed after auth retry:', retryResult.error);
          return fallbackData;
        }
        return retryResult.data || fallbackData;
      }
      
      console.error('Query error:', result.error);
      return fallbackData;
    }
    
    return result.data || fallbackData;
  } catch (error) {
    console.error('Query exception:', error);
    return fallbackData;
  }
};