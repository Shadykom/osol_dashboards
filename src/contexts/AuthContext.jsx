import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { emitSecurityEvent, SecurityEventTypes } from '../../packages/common/siem';

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
    // Emit login attempt event
    emitSecurityEvent(
      SecurityEventTypes.LOGIN_ATTEMPT,
      { email, timestamp: new Date().toISOString() },
      { component: 'AuthContext', userEmail: email }
    );

    try {
      // Find user in mock data
      const userData = MOCK_USERS.find(u => u.email === email);

      if (!userData) {
        // Emit login failure - user not found
        emitSecurityEvent(
          SecurityEventTypes.LOGIN_FAILURE,
          { 
            email, 
            success: false, 
            reason: 'User not found',
            timestamp: new Date().toISOString()
          },
          { component: 'AuthContext', userEmail: email }
        );
        return { data: null, error: { message: 'Invalid email or password' } };
      }

      // Check if account is active
      if (!userData.is_active) {
        // Emit login failure - account deactivated
        emitSecurityEvent(
          SecurityEventTypes.LOGIN_FAILURE,
          { 
            email, 
            success: false, 
            reason: 'Account deactivated',
            userId: userData.id,
            timestamp: new Date().toISOString()
          },
          { 
            component: 'AuthContext', 
            userId: userData.id, 
            userEmail: email 
          }
        );
        return { data: null, error: { message: 'Account is deactivated. Please contact support.' } };
      }

      // Verify password (in mock mode, just compare directly)
      if (password !== userData.password) {
        // Emit login failure - invalid password
        emitSecurityEvent(
          SecurityEventTypes.LOGIN_FAILURE,
          { 
            email, 
            success: false, 
            reason: 'Invalid password',
            userId: userData.id,
            timestamp: new Date().toISOString()
          },
          { 
            component: 'AuthContext', 
            userId: userData.id, 
            userEmail: email 
          }
        );
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

      // Emit login success
      emitSecurityEvent(
        SecurityEventTypes.LOGIN_SUCCESS,
        { 
          email, 
          success: true, 
          roles: userData.roles,
          timestamp: new Date().toISOString()
        },
        { 
          component: 'AuthContext', 
          userId: userData.id, 
          userEmail: email,
          sessionId: sessionData.access_token
        }
      );

      return { data: { user: userData, session: sessionData }, error: null };
    } catch (error) {
      console.error('Sign in error:', error);
      // Emit login failure - exception
      emitSecurityEvent(
        SecurityEventTypes.LOGIN_FAILURE,
        { 
          email, 
          success: false, 
          reason: 'System error',
          error: error.message,
          timestamp: new Date().toISOString()
        },
        { component: 'AuthContext', userEmail: email }
      );
      return { data: null, error: { message: 'Failed to sign in' } };
    }
  };

  const signOut = async () => {
    try {
      // Emit logout event before clearing session
      if (user) {
        emitSecurityEvent(
          SecurityEventTypes.LOGOUT,
          { 
            timestamp: new Date().toISOString()
          },
          { 
            component: 'AuthContext', 
            userId: user.id, 
            userEmail: user.email,
            sessionId: session?.access_token
          }
        );
      }

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

  // Function to emit role change events (for admin operations)
  const emitRoleChangeEvent = async (targetUserId, targetUserEmail, previousRoles, newRoles, changedBy) => {
    return emitSecurityEvent(
      SecurityEventTypes.ROLE_CHANGE,
      {
        previousRoles,
        newRoles,
        changedBy: changedBy || user?.email,
        timestamp: new Date().toISOString()
      },
      {
        component: 'AuthContext',
        userId: targetUserId,
        userEmail: targetUserEmail,
        resourceType: 'user_role',
        resourceId: targetUserId,
        resourceName: targetUserEmail
      }
    );
  };

  // Function to emit approval action events
  const emitApprovalEvent = async (action, resourceType, resourceId, resourceName, details = {}) => {
    const eventType = action === 'granted' 
      ? SecurityEventTypes.APPROVAL_GRANTED 
      : action === 'denied'
      ? SecurityEventTypes.APPROVAL_DENIED
      : SecurityEventTypes.APPROVAL_REQUESTED;

    return emitSecurityEvent(
      eventType,
      {
        action,
        ...details,
        timestamp: new Date().toISOString()
      },
      {
        component: 'ApprovalWorkflow',
        userId: user?.id,
        userEmail: user?.email,
        resourceType,
        resourceId,
        resourceName,
        sessionId: session?.access_token
      }
    );
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
    // SIEM event emitters for security logging
    emitRoleChangeEvent,
    emitApprovalEvent,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
