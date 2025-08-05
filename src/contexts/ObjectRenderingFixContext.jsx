import React, { createContext, useContext, useEffect } from 'react';
import { SafeRender } from '@/components/SafeRender';

const ObjectRenderingFixContext = createContext();

export const useObjectRenderingFix = () => {
  const context = useContext(ObjectRenderingFixContext);
  if (!context) {
    throw new Error('useObjectRenderingFix must be used within ObjectRenderingFixProvider');
  }
  return context;
};

/**
 * Provider that adds global protection against object rendering errors
 */
export const ObjectRenderingFixProvider = ({ children }) => {
  useEffect(() => {
    // Patch React.createElement to intercept object rendering
    const originalCreateElement = React.createElement;
    
    React.createElement = function(type, props, ...children) {
      // Check children for objects that might cause rendering errors
      const safeChildren = children.map(child => {
        if (child && typeof child === 'object' && !React.isValidElement(child) && !Array.isArray(child)) {
          // Check if this object has the problematic keys
          if (child.performanceReport !== undefined ||
              child.totalPortfolio !== undefined ||
              child.overdueAmount !== undefined ||
              child.activeCases !== undefined ||
              child.collectionRate !== undefined ||
              child.officers !== undefined ||
              child.officerName !== undefined ||
              child.cases !== undefined ||
              child.dueAmount !== undefined ||
              child.contactRate !== undefined ||
              child.allProducts !== undefined ||
              child.summary !== undefined ||
              child.title !== undefined) {
            
            console.warn('[ObjectRenderingFix] Intercepted problematic object:', child);
            console.trace('Stack trace for object rendering:');
            
            // Return a safe representation
            return `[Object with keys: ${Object.keys(child).join(', ')}]`;
          }
        }
        return child;
      });
      
      // Call original createElement with safe children
      return originalCreateElement.call(React, type, props, ...safeChildren);
    };
    
    // Cleanup
    return () => {
      React.createElement = originalCreateElement;
    };
  }, []);
  
  const value = {
    SafeRender,
    wrapValue: (value) => {
      if (value && typeof value === 'object' && !React.isValidElement(value)) {
        return <SafeRender value={value} />;
      }
      return value;
    }
  };
  
  return (
    <ObjectRenderingFixContext.Provider value={value}>
      {children}
    </ObjectRenderingFixContext.Provider>
  );
};

export default ObjectRenderingFixProvider;