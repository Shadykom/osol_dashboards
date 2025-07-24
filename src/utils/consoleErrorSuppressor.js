// Console error suppressor to filter out known non-critical errors
export const consoleErrorSuppressor = {
  activate() {
    const originalError = console.error;
    const suppressedPatterns = [
      // React Router warnings
      /React Router Future Flag Warning/,
      /relative pathnames are not supported/,
      
      // React development warnings
      /Warning: ReactDOM.render is no longer supported/,
      /Warning: Using UNSAFE_componentWillReceiveProps/,
      
      // Google Maps warnings
      /Google Maps JavaScript API warning/,
      
      // Supabase non-critical warnings
      /Supabase client warning/,
      
      // Other known non-critical warnings
      /ResizeObserver loop limit exceeded/,
      /Non-Error promise rejection captured/,
    ];

    console.error = (...args) => {
      const message = args.join(' ');
      
      // Check if this error should be suppressed
      const shouldSuppress = suppressedPatterns.some(pattern => 
        pattern.test(message)
      );

      if (!shouldSuppress) {
        originalError.apply(console, args);
      } else if (process.env.NODE_ENV === 'development') {
        // In development, log suppressed errors with a different style
        console.log('%c[Suppressed Error]', 'color: gray', ...args);
      }
    };

    // Also suppress certain warnings
    const originalWarn = console.warn;
    console.warn = (...args) => {
      const message = args.join(' ');
      const shouldSuppress = suppressedPatterns.some(pattern => 
        pattern.test(message)
      );

      if (!shouldSuppress) {
        originalWarn.apply(console, args);
      }
    };
  }
};
