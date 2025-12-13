// Wallet Conflict Resolver
// This utility helps prevent conflicts between multiple wallet extensions

let ethereumProviderSet = false;
let originalProvider = null;

export const resolveWalletConflicts = () => {
  try {
    // If we've already set up protection, don't do it again
    if (ethereumProviderSet) {
      return;
    }

    // Check if ethereum is already defined
    if (window.ethereum) {
      console.log('Ethereum provider already exists, preventing conflicts...');
      originalProvider = window.ethereum;
      ethereumProviderSet = true;
      
      // Store the original provider
      window._originalEthereumProvider = originalProvider;
      
      // Create a proxy to intercept property access
      const ethereumProxy = new Proxy(originalProvider, {
        get(target, prop) {
          return target[prop];
        },
        set(target, prop, value) {
          console.warn(`Attempted to set ethereum.${prop}, ignoring to prevent conflicts`);
          return true; // Pretend the set succeeded
        }
      });
      
      // Delete the existing property first
      try {
        delete window.ethereum;
      } catch (e) {
        // Ignore if we can't delete
      }
      
      // Define ethereum as a non-configurable property
      Object.defineProperty(window, 'ethereum', {
        get() {
          return ethereumProxy;
        },
        set() {
          console.warn('Attempted to redefine window.ethereum, ignoring to prevent conflicts');
        },
        configurable: false,
        enumerable: true
      });
    } else {
      // If ethereum doesn't exist yet, set up a trap for when it's defined
      Object.defineProperty(window, 'ethereum', {
        get() {
          return originalProvider;
        },
        set(value) {
          if (!ethereumProviderSet) {
            console.log('First ethereum provider detected, setting as primary');
            originalProvider = value;
            ethereumProviderSet = true;
            window._originalEthereumProvider = value;
          } else {
            console.warn('Attempted to redefine window.ethereum, ignoring to prevent conflicts');
          }
        },
        configurable: false,
        enumerable: true
      });
    }
  } catch (error) {
    console.warn('Failed to resolve wallet conflicts:', error);
    // As a fallback, try to at least prevent the error from breaking the app
    try {
      const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
      if (descriptor && descriptor.configurable === false) {
        console.log('window.ethereum is already non-configurable');
      }
    } catch (e) {
      // Ignore
    }
  }
};

// Call this early in your app initialization
export const initializeWalletProtection = () => {
  // Run immediately
  resolveWalletConflicts();
  
  // Also run on DOMContentLoaded to catch late injections
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resolveWalletConflicts);
  }
  
  // Intercept defineProperty calls
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (obj === window && prop === 'ethereum' && ethereumProviderSet) {
      console.warn('Blocked attempt to redefine window.ethereum');
      return obj;
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
};