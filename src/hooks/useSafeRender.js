import { useEffect, useRef } from 'react';

/**
 * Custom hook to detect and warn about potential object rendering issues
 * @param {any} value - The value to check
 * @param {string} componentName - Name of the component for debugging
 */
export const useSafeRender = (value, componentName = 'Unknown') => {
  const previousValueRef = useRef();
  
  useEffect(() => {
    if (value === previousValueRef.current) return;
    
    previousValueRef.current = value;
    
    // Check if value is an object that might cause rendering issues
    if (value && typeof value === 'object' && !value.$$typeof) {
      if (Array.isArray(value)) {
        // Check if array contains objects
        const hasObjects = value.some(item => 
          item && typeof item === 'object' && !item.$$typeof
        );
        
        if (hasObjects) {
          console.warn(
            `[useSafeRender] Component "${componentName}" has an array with objects that might cause rendering issues:`,
            value
          );
        }
      } else if (value instanceof Date) {
        console.warn(
          `[useSafeRender] Component "${componentName}" has a Date object that needs to be converted to string:`,
          value
        );
      } else {
        // Regular object
        console.warn(
          `[useSafeRender] Component "${componentName}" has an object that might cause rendering issues:`,
          value
        );
        console.warn('Object keys:', Object.keys(value));
        
        // Check for specific problematic keys
        const problematicKeys = [
          'title', 'performanceReport', 'summary', 'totalPortfolio',
          'overdueAmount', 'activeCases', 'collectionRate', 'officers',
          'officerName', 'cases', 'dueAmount', 'contactRate', 'allProducts'
        ];
        
        const foundKeys = problematicKeys.filter(key => key in value);
        if (foundKeys.length > 0) {
          console.error(
            `[useSafeRender] CRITICAL: Found object with keys matching the error pattern:`,
            foundKeys
          );
          console.error('This object is likely causing the "Objects are not valid as a React child" error');
          console.error('Full object:', value);
          
          // Try to trace the component stack
          const stack = new Error().stack;
          console.error('Component stack:', stack);
        }
      }
    }
  }, [value, componentName]);
  
  // Return a safe version of the value
  if (value === null || value === undefined) return '';
  
  const type = typeof value;
  if (type === 'string' || type === 'number' || type === 'boolean') return value;
  
  if (value.$$typeof) return value; // React element
  
  if (Array.isArray(value)) {
    return `[Array with ${value.length} items]`;
  }
  
  if (value instanceof Date) {
    return value.toLocaleString();
  }
  
  if (type === 'object') {
    return `[Object with keys: ${Object.keys(value).join(', ')}]`;
  }
  
  return String(value);
};

/**
 * HOC to wrap components with safe render checking
 */
export const withSafeRenderCheck = (Component, componentName = Component.name) => {
  return function SafeRenderWrapper(props) {
    // Check all props for potential issues
    useEffect(() => {
      Object.entries(props).forEach(([key, value]) => {
        if (value && typeof value === 'object' && !value.$$typeof && !Array.isArray(value)) {
          // Check for the specific error pattern
          const hasProblematicKeys = [
            'title', 'performanceReport', 'summary', 'totalPortfolio',
            'overdueAmount', 'activeCases', 'collectionRate', 'officers'
          ].some(k => k in value);
          
          if (hasProblematicKeys) {
            console.error(
              `[withSafeRenderCheck] Component "${componentName}" received problematic object in prop "${key}":`,
              value
            );
          }
        }
      });
    }, [props]);
    
    return <Component {...props} />;
  };
};

export default useSafeRender;