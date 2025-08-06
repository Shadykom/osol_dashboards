import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { motion } from 'framer-motion';
import { FiLock, FiAlertCircle } from 'react-icons/fi';

const ProtectedRoute = ({ 
  children, 
  requiredRoles = [], 
  requiredPermissions = [],
  fallbackPath = '/login' 
}) => {
  const { user, loading, hasRole, hasAnyRole, hasPermission } = useAuth();
  const location = useLocation();

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
  if (!user) {
    return <Navigate to={fallbackPath} state={{ from: location }} replace />;
  }

  // Check role-based access
  if (requiredRoles.length > 0) {
    const hasRequiredRole = hasAnyRole(requiredRoles);
    if (!hasRequiredRole) {
      return <AccessDenied reason="role" requiredRoles={requiredRoles} />;
    }
  }

  // Check permission-based access
  if (requiredPermissions.length > 0) {
    const hasAllPermissions = requiredPermissions.every(
      ({ resource, action }) => hasPermission(resource, action)
    );
    if (!hasAllPermissions) {
      return <AccessDenied reason="permission" requiredPermissions={requiredPermissions} />;
    }
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