// Ethereum Provider Conflict Resolver
// This script works with the extension blocker to handle any remaining conflicts

(function() {
  'use strict';
  
  console.log('Ethereum conflict resolver starting...');
  
  // If the extension blocker already handled ethereum, skip
  if (window.__extensionBlockerActive) {
    console.log('Extension blocker is active, skipping ethereum resolver');
    return;
  }
  
  // Simple approach: just log attempts to access ethereum
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    if (descriptor) {
      console.log('Ethereum property exists with descriptor:', {
        configurable: descriptor.configurable,
        enumerable: descriptor.enumerable,
        writable: descriptor.writable,
        hasGetter: !!descriptor.get,
        hasSetter: !!descriptor.set
      });
    }
  } catch (e) {
    console.log('Could not check ethereum property:', e.message);
  }
  
  // Override console.error to catch ethereum-related errors
  const originalConsoleError = console.error;
  console.error = function(...args) {
    const errorString = args.join(' ');
    
    // Filter out ethereum-related errors
    if (errorString.includes('ethereum') || 
        errorString.includes('Cannot redefine property') ||
        errorString.includes('Cannot set property ethereum')) {
      console.warn('Suppressed ethereum error:', errorString);
      return;
    }
    
    // Pass through other errors
    originalConsoleError.apply(console, args);
  };
  
  // Add a flag to indicate this script has run
  window.__ethereumResolverActive = true;
  
  console.log('Ethereum conflict resolver initialized');
})();