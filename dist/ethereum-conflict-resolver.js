// Ethereum Provider Conflict Resolver
// This script prevents conflicts when multiple crypto wallet extensions try to inject window.ethereum

(function() {
  'use strict';
  
  // Store the original Object.defineProperty
  const originalDefineProperty = Object.defineProperty;
  
  // Track if ethereum has been defined
  let ethereumDefined = false;
  let ethereumValue = undefined;
  
  // Pre-define ethereum to prevent conflicts
  try {
    // Check if ethereum already exists and is not configurable
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    
    if (!descriptor || descriptor.configurable !== false) {
      // Only define if it doesn't exist or is configurable
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
        configurable: true,
        enumerable: true
      });
      ethereumDefined = true;
    } else {
      console.log('Ethereum already defined and not configurable, skipping pre-definition');
      ethereumDefined = true;
      ethereumValue = window.ethereum;
    }
  } catch(e) {
    console.warn('Failed to pre-define ethereum property:', e);
  }
  
  // Override Object.defineProperty to intercept ethereum definitions
  Object.defineProperty = function(obj, prop, descriptor) {
    // Special handling for window.ethereum
    if (obj === window && prop === 'ethereum') {
      if (ethereumDefined) {
        console.warn('Attempted to redefine window.ethereum, ignoring...');
        // Update the value if we don't have one yet
        if (!ethereumValue && descriptor.value) {
          ethereumValue = descriptor.value;
        }
        return obj;
      }
    }
    
    // For all other properties, use the original defineProperty
    try {
      return originalDefineProperty.call(Object, obj, prop, descriptor);
    } catch(e) {
      if (prop === 'ethereum') {
        console.warn('Failed to define ethereum property:', e);
        return obj;
      }
      // Re-throw for non-ethereum properties
      throw e;
    }
  };
  
  console.log('Ethereum conflict resolver initialized');
})();