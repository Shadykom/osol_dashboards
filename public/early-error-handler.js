// Early Error Handler - Prevents white screen from initialization errors
(function() {
  'use strict';
  
  console.log('Early error handler initializing...');
  
  // Store original console.error
  const originalError = console.error;
  
  // Override console.error to catch and log errors without breaking execution
  console.error = function(...args) {
    // Call original error
    originalError.apply(console, args);
    
    // Check if this is a critical error that might break the app
    const errorString = args.join(' ');
    if (errorString.includes('Cannot access') && errorString.includes('before initialization')) {
      console.warn('Caught initialization error, attempting to continue...');
      
      // Try to prevent the error from propagating
      if (window.event) {
        try {
          window.event.stopPropagation();
          window.event.preventDefault();
        } catch (e) {
          // Ignore
        }
      }
    }
  };
  
  // Add global error handler to prevent white screen
  window.addEventListener('error', function(event) {
    const error = event.error || {};
    const message = error.message || event.message || '';
    
    console.warn('Global error caught:', message);
    
    // Check for specific errors that shouldn't break the app
    if (message.includes('Cannot access') && message.includes('before initialization')) {
      console.warn('Preventing initialization error from breaking the app');
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Check for ethereum-related errors
    if (message.includes('ethereum') || message.includes('Cannot redefine property')) {
      console.warn('Preventing ethereum error from breaking the app');
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // For other errors, let them through but log them
    console.warn('Allowing error to propagate:', message);
  }, true);
  
  // Add unhandled rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    console.warn('Unhandled promise rejection:', event.reason);
    
    // Prevent ethereum-related rejections from breaking the app
    const reason = String(event.reason);
    if (reason.includes('ethereum') || reason.includes('Cannot redefine property')) {
      event.preventDefault();
      return false;
    }
  });
  
  // Wrap setTimeout to catch async errors
  const originalSetTimeout = window.setTimeout;
  window.setTimeout = function(callback, delay, ...args) {
    const wrappedCallback = function() {
      try {
        return callback.apply(this, args);
      } catch (error) {
        console.error('Error in setTimeout callback:', error);
        // Don't re-throw to prevent breaking the app
      }
    };
    return originalSetTimeout.call(this, wrappedCallback, delay);
  };
  
  console.log('Early error handler initialized');
})();