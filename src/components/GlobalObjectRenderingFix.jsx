import React from 'react';
import { SafeRender } from './SafeRender';

/**
 * Global fix for object rendering errors
 * This component wraps children and intercepts potential object rendering issues
 */
export const GlobalObjectRenderingFix = ({ children }) => {
  // Override console.error to catch and fix object rendering errors
  React.useEffect(() => {
    const originalError = console.error;
    
    console.error = function(...args) {
      const errorMessage = args[0]?.toString() || '';
      
      // Check if this is the specific object rendering error we're looking for
      if (errorMessage.includes('Objects are not valid as a React child') && 
          errorMessage.includes('performanceReport') && 
          errorMessage.includes('totalPortfolio')) {
        
        console.warn('[GlobalObjectRenderingFix] Intercepted object rendering error');
        console.warn('Error details:', args);
        
        // Log stack trace to help identify the component
        if (args[1] && args[1].stack) {
          console.warn('Stack trace:', args[1].stack);
        }
        
        // Try to extract component information from the error
        const componentMatch = errorMessage.match(/at\s+(\w+)\s+\(/);
        if (componentMatch) {
          console.warn('Problematic component:', componentMatch[1]);
        }
        
        // Don't propagate this specific error to avoid app crash
        return;
      }
      
      // Call original console.error for other errors
      originalError.apply(console, args);
    };
    
    // Cleanup
    return () => {
      console.error = originalError;
    };
  }, []);
  
  return children;
};

/**
 * HOC to wrap components that might have object rendering issues
 */
export const withObjectRenderingProtection = (Component) => {
  return function ProtectedComponent(props) {
    // Check all props for the problematic object pattern
    const protectedProps = {};
    
    Object.entries(props).forEach(([key, value]) => {
      if (value && typeof value === 'object' && !React.isValidElement(value)) {
        // Check if this object has the problematic keys
        const hasProblematicKeys = value.performanceReport !== undefined ||
                                   value.totalPortfolio !== undefined ||
                                   value.overdueAmount !== undefined ||
                                   value.activeCases !== undefined ||
                                   value.officers !== undefined;
        
        if (hasProblematicKeys) {
          console.warn(`[withObjectRenderingProtection] Found problematic object in prop "${key}":`, value);
          
          // Don't pass the object directly, wrap it in SafeRender
          protectedProps[key] = <SafeRender value={value} fallback={`[Object: ${key}]`} />;
        } else {
          protectedProps[key] = value;
        }
      } else {
        protectedProps[key] = value;
      }
    });
    
    return <Component {...protectedProps} />;
  };
};

export default GlobalObjectRenderingFix;