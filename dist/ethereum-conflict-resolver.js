// Ethereum Provider Conflict Resolver
// This script prevents conflicts when multiple crypto wallet extensions try to inject window.ethereum

(function() {
  'use strict';
  
  // Store the original defineProperty method
  const originalDefineProperty = Object.defineProperty;
  
  // Track if ethereum has been defined
  let ethereumDefined = false;
  let ethereumValue = undefined;
  
  // Pre-define ethereum to prevent conflicts
  try {
    originalDefineProperty.call(Object, window, 'ethereum', {
      get() {
        return ethereumValue;
      },
      set(value) {
        if (!ethereumValue) {
          ethereumValue = value;
          console.log('Ethereum provider set successfully');
        } else {
          console.warn('Attempted to overwrite ethereum provider, ignoring...');
        }
      },
      configurable: true
    });
    ethereumDefined = true;
  } catch (e) {
    console.warn('Failed to pre-define ethereum property:', e);
  }
  
  // Override Object.defineProperty to prevent redefinition errors
  Object.defineProperty = function(obj, prop, descriptor) {
    // Special handling for window.ethereum
    if (obj === window && prop === 'ethereum') {
      if (ethereumDefined) {
        console.warn('Attempted to redefine window.ethereum, ignoring...');
        // Update the value if it's the first real provider
        if (!ethereumValue && descriptor.value) {
          ethereumValue = descriptor.value;
        }
        return obj;
      }
    }
    
    // Call the original method
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      if (prop === 'ethereum') {
        console.warn(`Failed to define property ${prop}:`, error.message);
        return obj;
      }
      // Re-throw for non-ethereum properties
      throw error;
    }
  };
  
  console.log('Ethereum conflict resolver initialized');
})();