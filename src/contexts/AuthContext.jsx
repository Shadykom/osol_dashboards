import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Always set a demo user - no authentication required
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
    },
    created_at: new Date().toISOString()
  };

  const demoSession = {
    access_token: import.meta.env.VITE_SUPABASE_ANON_KEY || 'demo-token',
    token_type: 'bearer',
    expires_in: 3600,
    refresh_token: 'demo-refresh-token',
    user: demoUser
  };

  const [user, setUser] = useState(demoUser);
  const [loading, setLoading] = useState(false);
  const [session, setSession] = useState(demoSession);

  useEffect(() => {
    // No need to check for actual authentication
    // Always use demo user
    setUser(demoUser);
    setSession(demoSession);
    setLoading(false);
  }, []);

  // Mock functions that always succeed
  const signUp = async ({ email, password, metadata }) => {
    console.log('Sign up bypassed - using demo user');
    return { data: { user: demoUser, session: demoSession }, error: null };
  };

  const signIn = async ({ email, password }) => {
    console.log('Sign in bypassed - using demo user');
    return { data: { user: demoUser, session: demoSession }, error: null };
  };

  const signOut = async () => {
    console.log('Sign out bypassed - keeping demo user');
    // Don't actually sign out, keep the demo user
    return { error: null };
  };

  const updateProfile = async (updates) => {
    console.log('Profile update bypassed');
    return { data: { ...demoUser, ...updates }, error: null };
  };

  const resetPassword = async (email) => {
    console.log('Password reset bypassed');
    return { data: {}, error: null };
  };

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
