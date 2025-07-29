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
    // Check if ethereum already exists
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    
    if (descriptor) {
      // If ethereum already exists, just track it
      console.log('Ethereum already defined with descriptor:', descriptor);
      ethereumDefined = true;
      
      // If it has a getter, try to get the value
      if (descriptor.get) {
        try {
          ethereumValue = descriptor.get();
        } catch (e) {
          console.warn('Could not get ethereum value:', e);
        }
      } else {
        ethereumValue = window.ethereum;
      }
    } else {
      // Only define if it doesn't exist
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
    }
  } catch(e) {
    console.warn('Failed to handle ethereum property:', e);
    ethereumDefined = true; // Mark as defined to prevent further attempts
  }
  
  // Override Object.defineProperty to intercept ethereum definitions
  Object.defineProperty = function(obj, prop, descriptor) {
    // Special handling for window.ethereum
    if (obj === window && prop === 'ethereum') {
      if (ethereumDefined) {
        console.warn('Attempted to redefine window.ethereum, ignoring...');
        // Update the value if we don't have one yet
        if (!ethereumValue && descriptor && descriptor.value) {
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
  
  // Also override setter attempts
  try {
    const originalSet = window.__lookupSetter__ ? window.__lookupSetter__.bind(window) : null;
    if (originalSet) {
      window.__defineSetter__('ethereum', function(value) {
        if (!ethereumValue) {
          ethereumValue = value;
          console.log('Ethereum provider set via setter');
        } else {
          console.warn('Attempted to overwrite ethereum provider via setter, ignoring...');
        }
      });
    }
  } catch(e) {
    // Ignore setter override failures
  }
  
  console.log('Ethereum conflict resolver initialized');
})();