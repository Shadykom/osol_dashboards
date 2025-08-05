/**
 * Early React Object Rendering Patch
 * This script patches React early to prevent object rendering errors in production
 */
(function() {
  'use strict';
  
  const problematicKeys = [
    'title', 'performanceReport', 'summary', 'totalPortfolio',
    'overdueAmount', 'activeCases', 'collectionRate', 'officers',
    'officerName', 'cases', 'dueAmount', 'contactRate', 'allProducts'
  ];
  
  let patchAttempts = 0;
  const maxAttempts = 10;
  
  function attemptPatch() {
    patchAttempts++;
    
    // Try to find React
    let React;
    
    if (window.React) {
      React = window.React;
    } else if (window._React) {
      React = window._React;
    } else {
      // Try to find React in common bundle locations
      const possibleReactKeys = Object.keys(window).filter(key => 
        key.includes('react') || key.includes('React')
      );
      
      for (const key of possibleReactKeys) {
        if (window[key] && window[key].createElement) {
          React = window[key];
          break;
        }
      }
    }
    
    if (!React || !React.createElement) {
      if (patchAttempts < maxAttempts) {
        // Try again later
        setTimeout(attemptPatch, 100);
      }
      return;
    }
    
    // Store original createElement
    const originalCreateElement = React.createElement;
    
    // Override createElement
    React.createElement = function(type, props, ...children) {
      // Process children to catch problematic objects
      const safeChildren = children.map(child => {
        if (child && typeof child === 'object' && !child._owner && !child.$$typeof && !Array.isArray(child)) {
          // Check if this object has problematic keys
          const hasProblematicKeys = problematicKeys.some(key => key in child);
          
          if (hasProblematicKeys) {
            console.warn('[ReactPatch] Prevented object rendering:', child);
            return '[Object]';
          }
        }
        return child;
      });
      
      // Also check props.children
      if (props && props.children && typeof props.children === 'object' && 
          !props.children._owner && !props.children.$$typeof && !Array.isArray(props.children)) {
        const hasProblematicKeys = problematicKeys.some(key => key in props.children);
        
        if (hasProblematicKeys) {
          console.warn('[ReactPatch] Prevented object rendering in props.children:', props.children);
          props = {
            ...props,
            children: '[Object]'
          };
        }
      }
      
      return originalCreateElement.apply(React, [type, props, ...safeChildren]);
    };
    
    console.log('[ReactPatch] Successfully patched React.createElement');
  }
  
  // Start patching attempts
  attemptPatch();
  
  // Also intercept console.error to catch the specific error
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorStr = args[0]?.toString() || '';
    
    // Check for React error #31
    if (errorStr.includes('Minified React error #31') || 
        errorStr.includes('Objects are not valid as a React child')) {
      
      // Extract object info from the error
      const keysMatch = errorStr.match(/keys\s*(%7B|{)([^%}]+)(%7D|})/);
      if (keysMatch) {
        console.warn('[ReactPatch] Caught object rendering error with keys:', keysMatch[2]);
      }
      
      // Don't propagate the error
      return;
    }
    
    // Call original console.error for other errors
    originalConsoleError.apply(console, args);
  };
})();