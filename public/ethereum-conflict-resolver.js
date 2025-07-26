// Ethereum Provider Conflict Resolver
// This script prevents conflicts when multiple crypto wallet extensions try to inject window.ethereum

(function() {
  'use strict';
  
  // Store the original defineProperty method
  const originalDefineProperty = Object.defineProperty;
  
  // Track if ethereum has been defined
  let ethereumDefined = false;
  
  // Override Object.defineProperty to prevent redefinition errors
  Object.defineProperty = function(obj, prop, descriptor) {
    // Special handling for window.ethereum
    if (obj === window && prop === 'ethereum') {
      if (ethereumDefined) {
        console.warn('Attempted to redefine window.ethereum, ignoring...');
        return obj;
      }
      ethereumDefined = true;
    }
    
    // Call the original method
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      console.warn(`Failed to define property ${prop}:`, error.message);
      return obj;
    }
  };
  
  // Also handle direct assignment attempts
  let ethereumProxy = undefined;
  
  Object.defineProperty(window, 'ethereum', {
    get() {
      return ethereumProxy;
    },
    set(value) {
      if (!ethereumProxy) {
        ethereumProxy = value;
        console.log('Ethereum provider set successfully');
      } else {
        console.warn('Attempted to overwrite ethereum provider, ignoring...');
      }
    },
    configurable: true
  });
  
  console.log('Ethereum conflict resolver initialized');
})();