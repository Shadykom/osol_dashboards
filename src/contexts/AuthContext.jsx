import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import bcrypt from 'bcryptjs';

const AuthContext = createContext({});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState(null);
  const [userRoles, setUserRoles] = useState([]);
  const [userPermissions, setUserPermissions] = useState([]);

  // Check if user has a specific permission
  const hasPermission = (resource, action) => {
    return userPermissions.some(
      perm => perm.resource === resource && perm.action === action && perm.is_granted
    );
  };

  // Check if user has a specific role
  const hasRole = (roleName) => {
    return userRoles.some(role => role.name === roleName);
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roleNames) => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  // Fetch user roles and permissions
  const fetchUserRolesAndPermissions = async (userId) => {
    try {
      // Fetch user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          role_id,
          roles (
            id,
            name,
            display_name,
            description
          )
        `)
        .eq('user_id', userId)
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      const roles = rolesData?.map(item => item.roles) || [];
      setUserRoles(roles);

      // Fetch user permissions from the view
      const { data: permissionsData, error: permissionsError } = await supabase
        .from('user_permissions_view')
        .select('*')
        .eq('user_id', userId)
        .eq('is_granted', true);

      if (permissionsError) throw permissionsError;

      setUserPermissions(permissionsData || []);
    } catch (error) {
      console.error('Error fetching user roles and permissions:', error);
    }
  };

  // Update user last login
  const updateLastLogin = async (userId) => {
    try {
      await supabase
        .from('users')
        .update({ 
          last_login: new Date().toISOString(),
          failed_login_attempts: 0
        })
        .eq('id', userId);
    } catch (error) {
      console.error('Error updating last login:', error);
    }
  };

  // Handle failed login attempt
  const handleFailedLogin = async (email) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('id, failed_login_attempts')
        .eq('email', email)
        .single();

      if (userData) {
        const attempts = (userData.failed_login_attempts || 0) + 1;
        const updates = { failed_login_attempts: attempts };
        
        // Lock account after 5 failed attempts for 30 minutes
        if (attempts >= 5) {
          updates.locked_until = new Date(Date.now() + 30 * 60 * 1000).toISOString();
        }

        await supabase
          .from('users')
          .update(updates)
          .eq('id', userData.id);
      }
    } catch (error) {
      console.error('Error handling failed login:', error);
    }
  };

  useEffect(() => {
    // Check for existing session
    const checkSession = async () => {
      try {
        const storedSession = localStorage.getItem('osol_session');
        if (storedSession) {
          const sessionData = JSON.parse(storedSession);
          
          // Verify session is still valid
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', sessionData.user.id)
            .single();

          if (!error && userData && userData.is_active) {
            setUser(userData);
            setSession(sessionData);
            await fetchUserRolesAndPermissions(userData.id);
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
    try {
      // Check if user already exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('email', email)
        .single();

      if (existingUser) {
        return { data: null, error: { message: 'User already exists' } };
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);

      // Create user
      const { data: newUser, error: createError } = await supabase
        .from('users')
        .insert({
          email,
          password_hash: passwordHash,
          full_name: metadata?.full_name || email.split('@')[0],
          phone_number: metadata?.phone_number,
          department: metadata?.department,
          position: metadata?.position,
          is_active: true,
          is_verified: false
        })
        .select()
        .single();

      if (createError) {
        return { data: null, error: createError };
      }

      // Assign default role (viewer)
      const { data: viewerRole } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'viewer')
        .single();

      if (viewerRole) {
        await supabase
          .from('user_roles')
          .insert({
            user_id: newUser.id,
            role_id: viewerRole.id
          });
      }

      // Create session
      const sessionData = {
        access_token: btoa(`${newUser.id}:${Date.now()}`),
        token_type: 'bearer',
        expires_in: 3600,
        user: newUser
      };

      setUser(newUser);
      setSession(sessionData);
      localStorage.setItem('osol_session', JSON.stringify(sessionData));
      await fetchUserRolesAndPermissions(newUser.id);

      return { data: { user: newUser, session: sessionData }, error: null };
    } catch (error) {
      console.error('Sign up error:', error);
      return { data: null, error: { message: 'Failed to create account' } };
    }
  };

  const signIn = async ({ email, password }) => {
    try {
      // Get user by email
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      if (userError || !userData) {
        await handleFailedLogin(email);
        return { data: null, error: { message: 'Invalid email or password' } };
      }

      // Check if account is locked
      if (userData.locked_until && new Date(userData.locked_until) > new Date()) {
        const minutesLeft = Math.ceil((new Date(userData.locked_until) - new Date()) / 60000);
        return { 
          data: null, 
          error: { message: `Account is locked. Please try again in ${minutesLeft} minutes.` } 
        };
      }

      // Check if account is active
      if (!userData.is_active) {
        return { data: null, error: { message: 'Account is deactivated. Please contact support.' } };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, userData.password_hash);
      if (!passwordValid) {
        await handleFailedLogin(email);
        return { data: null, error: { message: 'Invalid email or password' } };
      }

      // Update last login
      await updateLastLogin(userData.id);

      // Create session
      const sessionData = {
        access_token: btoa(`${userData.id}:${Date.now()}`),
        token_type: 'bearer',
        expires_in: 3600,
        user: userData
      };

      setUser(userData);
      setSession(sessionData);
      localStorage.setItem('osol_session', JSON.stringify(sessionData));
      await fetchUserRolesAndPermissions(userData.id);

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

      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)
        .select()
        .single();

      if (updateError) {
        return { data: null, error: updateError };
      }

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
      // For now, we'll just return success
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

      // Verify current password
      const passwordValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!passwordValid) {
        return { data: null, error: { message: 'Current password is incorrect' } };
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      const { error: updateError } = await supabase
        .from('users')
        .update({
          password_hash: newPasswordHash,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (updateError) {
        return { data: null, error: updateError };
      }

      return { data: {}, error: null };
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
