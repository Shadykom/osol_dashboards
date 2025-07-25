// Console error suppressor for production
/* global process */
export const consoleErrorSuppressor = {
  activate: () => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
      const originalError = console.error;
      console.error = (...args) => {
        // Filter out specific errors we want to suppress
        const errorString = args.join(' ');
        const suppressPatterns = [
          'ResizeObserver loop limit exceeded',
          'ResizeObserver loop completed with undelivered notifications',
          'Non-Error promise rejection captured',
        ];
        
        const shouldSuppress = suppressPatterns.some(pattern => 
          errorString.includes(pattern)
        );
        
        if (!shouldSuppress) {
          originalError.apply(console, args);
        }
      };
    }
  }
};
