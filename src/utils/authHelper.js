import { createClient } from '@supabase/supabase-js';
import { supabase, supabaseBanking, supabaseCollection } from '@/lib/supabase';

// Check if user is authenticated
export const checkAuth = async () => {
  try {
    // First check for demo session
    const storedAuth = localStorage.getItem('osol-auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.currentSession && authData.expiresAt > Date.now()) {
          return { 
            isAuthenticated: true, 
            session: authData.currentSession 
          };
        }
      } catch (e) {
        // Invalid stored data, continue with regular check
      }
    }
    
    // Regular Supabase session check
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
    // First check for demo session
    const storedAuth = localStorage.getItem('osol-auth');
    if (storedAuth) {
      try {
        const authData = JSON.parse(storedAuth);
        if (authData.currentSession && authData.expiresAt > Date.now()) {
          return authData.currentSession.access_token;
        }
      } catch (e) {
        // Invalid stored data, continue with regular check
      }
    }
    
    // Regular Supabase session check
    const { data: { session } } = await supabase.auth.getSession();
    return session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY;
  } catch (error) {
    console.error('Error getting auth token:', error);
    return import.meta.env.VITE_SUPABASE_ANON_KEY;
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
        
        // For demo purposes, bypass authentication and use anon key
        // This allows the dashboard to work without requiring email confirmation
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('Email not confirmed') ||
            error.message?.includes('Invalid API key')) {
          console.log('Bypassing authentication for demo mode...');
          
          // Create a demo session without actual authentication
          const demoSession = {
            access_token: import.meta.env.VITE_SUPABASE_ANON_KEY,
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'demo-refresh-token',
            user: {
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
                role: 'admin'
              },
              created_at: new Date().toISOString()
            }
          };
          
          // Store the demo session
          localStorage.setItem('osol-auth', JSON.stringify({ 
            currentSession: demoSession,
            expiresAt: Date.now() + 3600000 // 1 hour from now
          }));
          
          console.log('Demo session created successfully');
          return true;
        }
        
        // Original error handling for creating new user
        if (error.message?.includes('Invalid login credentials') || 
            error.message?.includes('Email not confirmed')) {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: 'demo@osol.sa',
            password: 'demo123456',
            options: {
              data: {
                full_name: 'Demo User',
                role: 'admin'
              },
              emailRedirectTo: window.location.origin
            }
          });
          
          if (signUpError) {
            console.error('Failed to create demo user:', signUpError);
            
            // If user already exists but needs confirmation, we can't auto-login
            if (signUpError.message?.includes('User already registered')) {
              console.log('Demo user exists but needs email confirmation');
              // For demo purposes, we'll create a temporary session
              const tempSession = {
                access_token: import.meta.env.VITE_SUPABASE_ANON_KEY,
                user: {
                  id: 'demo-user',
                  email: 'demo@osol.sa',
                  user_metadata: {
                    full_name: 'Demo User',
                    role: 'admin'
                  }
                }
              };
              localStorage.setItem('osol-auth', JSON.stringify(tempSession));
              console.log('Created temporary demo session');
              return true;
            }
            
            return false;
          }
          
          console.log('Demo user created successfully');
          
          // For demo purposes, auto-confirm and sign in
          // Note: In production, this would require email confirmation
          const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
            email: 'demo@osol.sa',
            password: 'demo123456'
          });
          
          if (!signInError) {
            console.log('Auto-login successful after signup');
            return true;
          }
          
          // Create temporary session for demo
          const tempSession = {
            access_token: import.meta.env.VITE_SUPABASE_ANON_KEY,
            user: {
              id: signUpData.user?.id || 'demo-user',
              email: 'demo@osol.sa',
              user_metadata: {
                full_name: 'Demo User',
                role: 'admin'
              }
            }
          };
          localStorage.setItem('osol-auth', JSON.stringify(tempSession));
          console.log('Created temporary demo session');
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