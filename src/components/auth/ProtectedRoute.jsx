import React, { useEffect, useRef } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { Lock as FiLock, AlertCircle as FiAlertCircle } from 'lucide-react';
import { emitSecurityEvent, SecurityEventTypes } from '../../../packages/common/siem';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallbackPath = '/login' 
}) => {
  const { user, loading, hasRole, hasAnyRole, hasPermission } = useAuth();
  const location = useLocation();
  const lastEmittedPath = useRef(null);

  // Determine access status
  const isAuthenticated = !!user;
  const hasRequiredRole = requiredRoles.length === 0 || hasAnyRole(requiredRoles);
  const hasAllPermissions = requiredPermissions.length === 0 || requiredPermissions.every(
    ({ resource, action }) => hasPermission(resource, action)
  );
  const hasAccess = isAuthenticated && hasRequiredRole && hasAllPermissions;

  // Emit security events for access decisions
  useEffect(() => {
    // Only emit if we have a user and are not in loading state
    if (loading || !user) return;
    
    // Prevent duplicate events for the same path
    if (lastEmittedPath.current === location.pathname) return;

    // Determine if this route has access requirements
    const hasAccessRequirements = requiredRoles.length > 0 || requiredPermissions.length > 0;

    if (!hasRequiredRole && requiredRoles.length > 0) {
      // Emit policy block event for role-based denial
      emitSecurityEvent(
        SecurityEventTypes.POLICY_BLOCK,
        {
          reason: 'role',
          requiredRoles,
          userRoles: user?.roles || [],
          requestedPath: location.pathname,
          success: false,
          timestamp: new Date().toISOString()
        },
        {
          component: 'ProtectedRoute',
          userId: user?.id,
          userEmail: user?.email,
          resourceType: 'route',
          resourceId: location.pathname,
          resourceName: location.pathname
        }
      );
      lastEmittedPath.current = location.pathname;
    } else if (!hasAllPermissions && requiredPermissions.length > 0) {
      // Emit policy block event for permission-based denial
      emitSecurityEvent(
        SecurityEventTypes.POLICY_BLOCK,
        {
          reason: 'permission',
          requiredPermissions,
          requestedPath: location.pathname,
          success: false,
          timestamp: new Date().toISOString()
        },
        {
          component: 'ProtectedRoute',
          userId: user?.id,
          userEmail: user?.email,
          resourceType: 'route',
          resourceId: location.pathname,
          resourceName: location.pathname
        }
      );
      lastEmittedPath.current = location.pathname;
    } else if (hasAccess && hasAccessRequirements) {
      // Emit access granted event for protected routes
      emitSecurityEvent(
        SecurityEventTypes.ACCESS_GRANTED,
        {
          requestedPath: location.pathname,
          requiredRoles: requiredRoles.length > 0 ? requiredRoles : undefined,
          requiredPermissions: requiredPermissions.length > 0 ? requiredPermissions : undefined,
          success: true,
          timestamp: new Date().toISOString()
        },
        {
          component: 'ProtectedRoute',
          userId: user?.id,
          userEmail: user?.email,
          resourceType: 'route',
          resourceId: location.pathname,
          resourceName: location.pathname
        }
      );
      lastEmittedPath.current = location.pathname;
    }
  }, [location.pathname, loading, user, hasRequiredRole, hasAllPermissions, hasAccess, requiredRoles, requiredPermissions]);

  // Show loading spinner while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  // Check if user is authenticated
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (!hasRequiredRole) {
    return <AccessDenied reason="role" requiredRoles={requiredRoles} />;
  }

  // Check permission-based access
  if (!hasAllPermissions) {
    return <AccessDenied reason="permission" requiredPermissions={requiredPermissions} />;
  }

  return children;
};

const AccessDenied = ({ reason, requiredRoles = [], requiredPermissions = [] }) => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="max-w-md w-full bg-white rounded-lg shadow-xl p-8 text-center"
      >
        <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4">
          <FiLock className="h-8 w-8 text-red-600" />
        </div>
        
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
        
        <p className="text-gray-600 mb-6">
          {reason === 'role' 
            ? "You don't have the required role to access this page."
            : "You don't have the required permissions to access this page."}
        </p>

        {reason === 'role' && requiredRoles.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 font-medium mb-2">Required roles:</p>
            <div className="flex flex-wrap gap-2 justify-center">
              {requiredRoles.map(role => (
                <span
                  key={role}
                  className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-sm"
                >
                  {role}
                </span>
              ))}
            </div>
          </div>
        )}

        {reason === 'permission' && requiredPermissions.length > 0 && (
          <div className="mb-6 p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-700 font-medium mb-2">Required permissions:</p>
            <div className="space-y-1">
              {requiredPermissions.map(({ resource, action }) => (
                <div
                  key={`${resource}:${action}`}
                  className="text-sm text-gray-600"
                >
                  <span className="font-medium">{resource}</span>:{action}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex items-center justify-center text-sm text-gray-500 mb-6">
          <FiAlertCircle className="mr-2" />
          <span>Logged in as: {user?.email}</span>
        </div>

        <div className="space-y-3">
          <button
            onClick={() => window.history.back()}
            className="w-full px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
          
          <a
            href="/dashboard"
            className="block w-full px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
          >
            Go to Dashboard
          </a>
        </div>
      </motion.div>
    </div>
  );
};

export default ProtectedRoute;
