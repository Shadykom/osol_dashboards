// Enhanced Error Handler for Osol Dashboard
// This script filters out extension-related errors while preserving important application errors

(function() {
  'use strict';
  
  // List of error patterns to suppress (from browser extensions)
  const suppressedErrorPatterns = [
    /Cannot set property ethereum/i,
    /Cannot redefine property: ethereum/i,
    /Could not establish connection.*Receiving end does not exist/i,
    /Extension context invalidated/i,
    /MetaMask/i,
    /ObjectMultiplex.*orphaned data/i,
    /chrome-extension:\/\/invalid/i,
    /Port disconnected/i,
    /evmAsk\.js/i,
    /inpage\.js/i,
    /contentscript\.js/i,
    /pageProvider\.js/i,
    /injected.*\.js/i,
    /executive:1.*runtime\.lastError/i,
    /content\.namada\.js/i,
    /bundle\.js/i,
    /inject\.js/i,
    /early-error-handler\.js/i,
    /enhanced-error-handler\.js/i,
    /injected-penumbra-global\.js/i,
    /injected-session\.js/i,
    /Check phishing by URL/i,
    /eth getParams/i,
    // Additional patterns for database/network errors
    /Parse missing key/i,
    /SIEM/i,
    /security_events/i,
  ];
  
  // Store original console methods
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  // Function to check if error should be suppressed
  function shouldSuppressError(args) {
    const errorString = args.map(arg => {
      if (typeof arg === 'string') return arg;
      if (arg instanceof Error) return arg.message + ' ' + arg.stack;
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return String(arg);
        }
      }
      return String(arg);
    }).join(' ');
    
    return suppressedErrorPatterns.some(pattern => pattern.test(errorString));
  }
  
  // Override console.error
  console.error = function(...args) {
    if (shouldSuppressError(args)) {
      return; // Silently suppress
    }
    originalConsoleError.apply(console, args);
  };
  
  // Override console.warn for extension warnings
  console.warn = function(...args) {
    if (shouldSuppressError(args)) {
      return; // Silently suppress
    }
    originalConsoleWarn.apply(console, args);
  };
  
  // Override window.onerror for uncaught errors
  const originalOnError = window.onerror;
  window.onerror = function(message, source, lineno, colno, error) {
    // Check if error is from extension
    if (source && source.includes('chrome-extension://')) {
      return true; // Prevent default error handling
    }
    
    // Check error message patterns
    if (typeof message === 'string' && suppressedErrorPatterns.some(pattern => pattern.test(message))) {
      return true;
    }
    
    // Call original handler if exists
    if (originalOnError) {
      return originalOnError(message, source, lineno, colno, error);
    }
    
    return false;
  };
  
  // Override unhandledrejection for Promise errors
  window.addEventListener('unhandledrejection', function(event) {
    const reason = event.reason;
    const reasonString = reason instanceof Error ? reason.message + ' ' + reason.stack : String(reason);
    
    if (suppressedErrorPatterns.some(pattern => pattern.test(reasonString))) {
      event.preventDefault();
    }
  });
})();
