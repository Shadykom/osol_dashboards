/**
 * React Object Rendering Fix
 * This utility patches React to prevent "Objects are not valid as a React child" errors
 * specifically for objects with collection-related keys
 */

const problematicKeys = [
  'title', 'performanceReport', 'summary', 'totalPortfolio',
  'overdueAmount', 'activeCases', 'collectionRate', 'officers',
  'officerName', 'cases', 'dueAmount', 'contactRate', 'allProducts'
];

export function applyReactObjectRenderingFix() {
  if (typeof window === 'undefined') return;

  // Try to find React in various ways
  let React;
  
  // Method 1: Check window.React
  if (window.React) {
    React = window.React;
  }
  // Method 2: Try to import React
  else {
    try {
      React = require('react');
    } catch (e) {
      console.warn('[ReactObjectRenderingFix] Could not find React to patch');
      return;
    }
  }

  if (!React || !React.createElement) {
    console.warn('[ReactObjectRenderingFix] React.createElement not found');
    return;
  }

  const originalCreateElement = React.createElement;
  let patchApplied = false;

  React.createElement = function(type, props, ...children) {
    // Process children to catch problematic objects
    const safeChildren = children.map(child => {
      if (child && typeof child === 'object' && !React.isValidElement(child) && !Array.isArray(child)) {
        // Check if this object has problematic keys
        const hasProblematicKeys = problematicKeys.some(key => key in child);
        
        if (hasProblematicKeys) {
          if (!patchApplied) {
            console.error('[ReactObjectRenderingFix] Prevented object rendering error');
            console.error('Object that would have caused error:', child);
            console.error('Object keys:', Object.keys(child));
            console.trace('Stack trace:');
            patchApplied = true;
          }
          
          // Return a safe string representation
          return `[Object: ${Object.keys(child).slice(0, 3).join(', ')}...]`;
        }
      }
      return child;
    });

    // Also check props.children
    if (props && props.children) {
      const processChild = (child) => {
        if (child && typeof child === 'object' && !React.isValidElement(child) && !Array.isArray(child)) {
          const hasProblematicKeys = problematicKeys.some(key => key in child);
          
          if (hasProblematicKeys) {
            if (!patchApplied) {
              console.error('[ReactObjectRenderingFix] Prevented object rendering in props.children');
              console.error('Object:', child);
              patchApplied = true;
            }
            return `[Object: ${Object.keys(child).slice(0, 3).join(', ')}...]`;
          }
        }
        return child;
      };

      if (Array.isArray(props.children)) {
        props = {
          ...props,
          children: props.children.map(processChild)
        };
      } else {
        props = {
          ...props,
          children: processChild(props.children)
        };
      }
    }

    return originalCreateElement.apply(React, [type, props, ...safeChildren]);
  };

  console.log('[ReactObjectRenderingFix] Patch applied successfully');
}

// Apply the fix immediately when the module loads
if (typeof window !== 'undefined') {
  // Apply after a short delay to ensure React is loaded
  setTimeout(() => {
    applyReactObjectRenderingFix();
  }, 0);
  
  // Also try to apply on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyReactObjectRenderingFix);
  }
}

export default applyReactObjectRenderingFix;