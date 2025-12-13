// Early Error Handler - Prevents white screen from initialization errors
(function() {
  'use strict';
  
  // Determine if we're in production mode
  const isProduction = window.location.hostname !== 'localhost' && 
                       !window.location.hostname.includes('127.0.0.1');
  
  // Store original console methods
  const originalError = console.error;
  const originalWarn = console.warn;
  
  // Patterns to suppress in production
  const suppressedPatterns = [
    /ERR_NAME_NOT_RESOLVED/i,
    /Failed to fetch/i,
    /Error fetching/i,
    /Error loading/i,
    /Query error/i,
    /Get .* error/i,
    /Error in /i,
    /supabase\.co/i,
    /net::/i,
    /Database/i,
    /TypeError: Failed to fetch/i,
  ];
  
  // Check if message should be suppressed
  function shouldSuppress(args) {
    if (!isProduction) return false;
    const message = args.map(a => String(a)).join(' ');
    return suppressedPatterns.some(pattern => pattern.test(message));
  }
  
  // Override console.error to suppress database/network errors in production
  console.error = function(...args) {
    if (shouldSuppress(args)) {
      return; // Silently suppress
    }
    originalError.apply(console, args);
  };
  
  // Override console.warn to suppress database/network warnings in production  
  console.warn = function(...args) {
    if (shouldSuppress(args)) {
      return; // Silently suppress
    }
    originalWarn.apply(console, args);
  };
  
  // Add global error handler to prevent white screen
  window.addEventListener('error', function(event) {
    const error = event.error || {};
    const message = error.message || event.message || '';
    
    // Check for specific errors that shouldn't break the app
    if (message.includes('Cannot access') && message.includes('before initialization')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
    
    // Check for ethereum-related errors
    if (message.includes('ethereum') || message.includes('Cannot redefine property')) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  }, true);
  
  // Add unhandled rejection handler
  window.addEventListener('unhandledrejection', function(event) {
    const reason = String(event.reason);
    
    // Suppress network/database related rejections
    if (isProduction && (
        reason.includes('Failed to fetch') ||
        reason.includes('ERR_NAME_NOT_RESOLVED') ||
        reason.includes('supabase')
    )) {
      event.preventDefault();
      return false;
    }
    
    // Prevent ethereum-related rejections from breaking the app
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
        // Silently handle errors in setTimeout callbacks
      }
    };
    return originalSetTimeout.call(this, wrappedCallback, delay);
  };
})();
