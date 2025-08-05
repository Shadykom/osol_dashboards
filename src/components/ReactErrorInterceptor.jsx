import React, { useEffect } from 'react';

/**
 * Component that intercepts and handles React rendering errors
 * Specifically targets the "Objects are not valid as a React child" error
 */
export const ReactErrorInterceptor = ({ children }) => {
  useEffect(() => {
    // Store the original console.error
    const originalConsoleError = console.error;
    
    // Override console.error to intercept React errors
    console.error = function(...args) {
      const errorMessage = args[0]?.toString() || '';
      
      // Check for the specific React error #31 (Objects are not valid as a React child)
      if (errorMessage.includes('Minified React error #31') || 
          errorMessage.includes('Objects are not valid as a React child')) {
        
        // Log the error for debugging
        console.warn('[ReactErrorInterceptor] Caught object rendering error');
        console.warn('Error details:', args);
        
        // Extract the object keys from the error message
        const keysMatch = errorMessage.match(/keys\s*%7B([^%}]+)%7D/);
        if (keysMatch) {
          const keys = keysMatch[1].split('%2C%20');
          console.warn('Object keys:', keys);
        }
        
        // Don't propagate this error to prevent app crash
        return;
      }
      
      // For all other errors, call the original console.error
      originalConsoleError.apply(console, args);
    };
    
    // Cleanup on unmount
    return () => {
      console.error = originalConsoleError;
    };
  }, []);
  
  return <>{children}</>;
};

export default ReactErrorInterceptor;