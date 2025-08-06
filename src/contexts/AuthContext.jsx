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

// Mock users data (in production, this would come from the database)
const MOCK_USERS = [
  {
    id: '1',
    email: 'admin@osol.sa',
    password: 'Password123!',
    full_name: 'Admin User',
    department: 'IT',
    position: 'System Administrator',
    roles: ['admin'],
    is_active: true,
    is_verified: true
  },
  {
    id: '2',
    email: 'manager@osol.sa',
    password: 'Password123!',
    full_name: 'Manager User',
    department: 'Operations',
    position: 'Operations Manager',
    roles: ['manager'],
    is_active: true,
    is_verified: true
  },
  {
    id: '3',
    email: 'supervisor1@osol.sa',
    password: 'Password123!',
    full_name: 'Supervisor One',
    department: 'Collections',
    position: 'Collection Supervisor',
    roles: ['supervisor'],
    is_active: true,
    is_verified: true
  },
  {
    id: '4',
    email: 'officer1@osol.sa',
    password: 'Password123!',
    full_name: 'Field Officer 1',
    department: 'Collections',
    position: 'Collection Officer',
    roles: ['officer'],
    is_active: true,
    is_verified: true
  },
  {
    id: '5',
    email: 'analyst@osol.sa',
    password: 'Password123!',
    full_name: 'Data Analyst',
    department: 'Analytics',
    position: 'Senior Analyst',
    roles: ['analyst'],
    is_active: true,
    is_verified: true
  }
];

// Mock permissions by role
const ROLE_PERMISSIONS = {
  admin: ['*:*'], // Full access
  manager: [
    'dashboard:view',
    'dashboard:edit',
    'reports:view',
    'reports:export',
    'collection:view',
    'collection:manage',
    'users:view',
    'analytics:view'
  ],
  supervisor: [
    'dashboard:view',
    'reports:view',
    'collection:view',
    'collection:manage',
    'analytics:view'
  ],
  officer: [
    'dashboard:view',
    'collection:view',
    'collection:update',
    'reports:view'
  ],
  analyst: [
    'dashboard:view',
    'reports:view',
    'reports:export',
    'analytics:view',
    'analytics:export'
  ],
  viewer: [
    'dashboard:view',
    'reports:view'
  ]
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);

  // Check if user has a specific permission
  const hasPermission = (resource, action) => {
    // Check for wildcard permission
    if (userPermissions.includes('*:*')) return true;
    
    // Check specific permission
    return userPermissions.includes(`${resource}:${action}`) || 
           userPermissions.includes(`${resource}:*`);
  };

  // Check if user has a specific role
  const hasRole = (roleName) => {
    return userRoles.includes(roleName);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roleNames) => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  // Set user permissions based on roles
  const setUserPermissionsFromRoles = (roles) => {
    const permissions = new Set();
    roles.forEach(role => {
      const rolePerms = ROLE_PERMISSIONS[role] || [];
      rolePerms.forEach(perm => permissions.add(perm));
    });
    setUserPermissions(Array.from(permissions));
  };

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const storedSession = localStorage.getItem('osol_session');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          
          // Find user in mock data
          const userData = MOCK_USERS.find(u => u.id === sessionData.user.id);
          
          if (userData && userData.is_active) {
            setUser(userData);
            setSession(sessionData);
            setUserRoles(userData.roles || []);
            setUserPermissionsFromRoles(userData.roles || []);
          } else {
            localStorage.removeItem('osol_session');
          }
        }
      } catch (error) {
        console.error('Error checking session:', error);
        localStorage.removeItem('osol_session');
      } finally {
        setLoading(false);
      }
    };

    checkSession();
  }, []);

  const signUp = async ({ email, password, metadata }) => {
    // Mock signup - in production, this would create a new user in the database
    return { data: null, error: { message: 'Sign up is not available in demo mode' } };
  };

  const signIn = async ({ email, password }) => {
    try {
      // Find user in mock data
      const userData = MOCK_USERS.find(u => u.email === email);

      if (!userData) {
        return { data: null, error: { message: 'Invalid email or password' } };
      }

      // Check if account is active
      if (!userData.is_active) {
        return { data: null, error: { message: 'Account is deactivated. Please contact support.' } };
      }

      // Verify password (in mock mode, just compare directly)
      if (password !== userData.password) {
        return { data: null, error: { message: 'Invalid email or password' } };
      }

      // Create session
      const sessionData = {
        access_token: btoa(`${userData.id}:${Date.now()}`),
        token_type: 'bearer',
        expires_in: 3600,
        user: userData
      };

      setUser(userData);
      setSession(sessionData);
      setUserRoles(userData.roles || []);
      setUserPermissionsFromRoles(userData.roles || []);
      localStorage.setItem('osol_session', JSON.stringify(sessionData));

      return { data: { user: userData, session: sessionData }, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      return { data: null, error: { message: 'Failed to sign in' } };
    }
  };

  const signOut = async () => {
    try {
      // Clear session
      setUser(null);
      setSession(null);
      setUserRoles([]);
      setUserPermissions([]);
      localStorage.removeItem('osol_session');
      
      return { error: null };
    } catch (error) {
      console.error('Sign out error:', error);
      return { error: { message: 'Failed to sign out' } };
    }
  };

  const updateProfile = async (updates) => {
    try {
      if (!user) {
        return { data: null, error: { message: 'No user logged in' } };
      }

      // Update user data
      const updatedUser = { ...user, ...updates };
      setUser(updatedUser);
      
      // Update session
      const updatedSession = { ...session, user: updatedUser };
      setSession(updatedSession);
      localStorage.setItem('osol_session', JSON.stringify(updatedSession));

      return { data: updatedUser, error: null };
    } catch (error) {
      console.error('Update profile error:', error);
      return { data: null, error: { message: 'Failed to update profile' } };
    }
  };

  const resetPassword = async (email) => {
    try {
      // In a real application, this would send a password reset email
      console.log('Password reset requested for:', email);
      return { data: {}, error: null };
    } catch (error) {
      console.error('Reset password error:', error);
      return { data: null, error: { message: 'Failed to reset password' } };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        return { data: null, error: { message: 'No user logged in' } };
      }

      // In mock mode, we can't actually change the password
      return { data: {}, error: { message: 'Password change is not available in demo mode' } };
    } catch (error) {
      console.error('Change password error:', error);
      return { data: null, error: { message: 'Failed to change password' } };
    }
  };

  const value = {
    user,
    session,
    loading,
    userRoles,
    userPermissions,
    hasPermission,
    hasRole,
    hasAnyRole,
    signUp,
    signIn,
    signOut,
    updateProfile,
    resetPassword,
    changePassword,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
