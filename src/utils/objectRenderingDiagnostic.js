/**
 * Diagnostic utility to help find object rendering issues
 */

// Keep track of components that might be rendering objects
const suspiciousComponents = new Set();

/**
 * Monkey-patch React to detect object rendering
 */
export function enableObjectRenderingDiagnostics() {
  if (typeof window === 'undefined' || !window.React) {
    console.warn('[ObjectRenderingDiagnostic] React not found on window');
    return;
  }

  const React = window.React;
  const originalCreateElement = React.createElement;
  
  // Track component stack
  let componentStack = [];
  
  React.createElement = function(type, props, ...children) {
    const componentName = typeof type === 'string' ? type : (type?.displayName || type?.name || 'Unknown');
    
    // Push to stack
    componentStack.push(componentName);
    
    try {
      // Check children for problematic objects
      children.forEach((child, index) => {
        if (child && typeof child === 'object' && !React.isValidElement(child) && !Array.isArray(child)) {
          // Check for the specific pattern from the error
          const hasProblematicKeys = [
            'title', 'performanceReport', 'summary', 'totalPortfolio',
            'overdueAmount', 'activeCases', 'collectionRate', 'officers',
            'officerName', 'cases', 'dueAmount', 'contactRate', 'allProducts'
          ].some(key => key in child);
          
          if (hasProblematicKeys) {
            const currentStack = [...componentStack];
            const componentPath = currentStack.join(' > ');
            
            console.error(`[ObjectRenderingDiagnostic] FOUND IT!`);
            console.error(`Component path: ${componentPath}`);
            console.error(`Object being rendered:`, child);
            console.error(`Object keys:`, Object.keys(child));
            console.error(`Parent component: ${componentName}`);
            console.error(`Child index: ${index}`);
            
            // Log props to help identify the issue
            if (props) {
              console.error(`Component props:`, props);
            }
            
            // Add to suspicious components
            suspiciousComponents.add(componentPath);
            
            // Create a stack trace
            console.trace('Stack trace:');
            
            // Return a safe placeholder
            return `[DIAGNOSTIC: Object with keys: ${Object.keys(child).slice(0, 5).join(', ')}...]`;
          }
        }
      });
      
      // Call original
      const result = originalCreateElement.apply(React, [type, props, ...children]);
      
      // Pop from stack
      componentStack.pop();
      
      return result;
    } catch (error) {
      // Pop from stack even on error
      componentStack.pop();
      throw error;
    }
  };
  
  console.log('[ObjectRenderingDiagnostic] Diagnostics enabled. Monitoring for object rendering...');
  
  // Return cleanup function
  return () => {
    React.createElement = originalCreateElement;
    console.log('[ObjectRenderingDiagnostic] Diagnostics disabled');
    
    if (suspiciousComponents.size > 0) {
      console.log('[ObjectRenderingDiagnostic] Suspicious component paths:');
      suspiciousComponents.forEach(path => console.log(`  - ${path}`));
    }
  };
}

/**
 * Enable diagnostics on window load
 */
if (typeof window !== 'undefined') {
  window.enableObjectRenderingDiagnostics = enableObjectRenderingDiagnostics;
  
  // Auto-enable in development
  if (process.env.NODE_ENV === 'development') {
    setTimeout(() => {
      console.log('[ObjectRenderingDiagnostic] Auto-enabling diagnostics in 2 seconds...');
      enableObjectRenderingDiagnostics();
    }, 2000);
  }
}

export default { enableObjectRenderingDiagnostics };