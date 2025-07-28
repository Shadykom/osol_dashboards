// Ethereum Provider Conflict Resolver
// This script prevents conflicts when multiple crypto wallet extensions try to inject window.ethereum

(function() {
  'use strict';
  
  console.log('Ethereum conflict resolver starting...');
  
  // Check if ethereum is already defined
  let ethereumExists = false;
  let ethereumDescriptor = null;
  
  try {
    ethereumDescriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    ethereumExists = ethereumDescriptor !== undefined;
  } catch (e) {
    console.log('Error checking ethereum property:', e);
  }
  
  if (ethereumExists && ethereumDescriptor) {
    console.log('Ethereum already exists with descriptor:', ethereumDescriptor);
    
    // If it's already defined with only a getter, we need to handle it differently
    if (ethereumDescriptor.get && !ethereumDescriptor.set) {
      console.log('Ethereum has only a getter, attempting to make it writable...');
      
      // Store the current value
      let currentValue = undefined;
      try {
        currentValue = window.ethereum;
      } catch (e) {
        console.log('Could not access current ethereum value:', e);
      }
      
      // Try to delete and redefine
      try {
        delete window.ethereum;
        Object.defineProperty(window, 'ethereum', {
          get() {
            return currentValue;
          },
          set(value) {
            if (!currentValue || (value && typeof value === 'object')) {
              currentValue = value;
              console.log('Ethereum provider updated successfully');
            }
          },
          configurable: true,
          enumerable: true
        });
      } catch (e) {
        console.warn('Could not redefine ethereum property:', e);
      }
    }
  } else {
    // Pre-define ethereum to prevent conflicts
    let ethereumValue = undefined;
    
    try {
      Object.defineProperty(window, 'ethereum', {
        get() {
          return ethereumValue;
        },
        set(value) {
          if (!ethereumValue || (value && typeof value === 'object')) {
            ethereumValue = value;
            console.log('Ethereum provider set successfully');
          } else {
            console.warn('Attempted to overwrite ethereum provider, ignoring...');
          }
        },
        configurable: true,
        enumerable: true
      });
      console.log('Ethereum property pre-defined successfully');
    } catch (e) {
      console.warn('Failed to pre-define ethereum property:', e);
    }
  }
  
  // Store the original defineProperty method
  const originalDefineProperty = Object.defineProperty;
  
  // Override Object.defineProperty to prevent redefinition errors
  Object.defineProperty = function(obj, prop, descriptor) {
    // Special handling for window.ethereum
    if (obj === window && prop === 'ethereum') {
      console.log('Attempt to define window.ethereum intercepted');
      
      // Try to get current value
      let currentValue = undefined;
      try {
        currentValue = window.ethereum;
      } catch (e) {
        // Ignore
      }
      
      // If we already have a value and the new descriptor has a value, update it
      if (descriptor && descriptor.value && (!currentValue || typeof descriptor.value === 'object')) {
        try {
          window.ethereum = descriptor.value;
          console.log('Ethereum provider updated via setter');
        } catch (e) {
          console.warn('Could not update ethereum provider:', e);
        }
      }
      
      return obj;
    }
    
    // Call the original method for other properties
    try {
      return originalDefineProperty.call(this, obj, prop, descriptor);
    } catch (error) {
      console.warn(`Failed to define property ${prop}:`, error.message);
      return obj;
    }
  };
  
  // Also intercept direct assignment attempts
  let checkInterval = setInterval(() => {
    try {
      if (window.ethereum && window.ethereum.isMetaMask) {
        console.log('MetaMask detected, stopping ethereum check');
        clearInterval(checkInterval);
      }
    } catch (e) {
      // Ignore errors
    }
  }, 100);
  
  // Stop checking after 5 seconds
  setTimeout(() => {
    clearInterval(checkInterval);
  }, 5000);
  
  console.log('Ethereum conflict resolver initialized');
})();