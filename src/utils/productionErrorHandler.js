// Production error handler for better error tracking
export const productionErrorHandler = {
  activate() {
    if (typeof window === 'undefined') return;

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);
      
      // Log to error tracking service in production
      if (process.env.NODE_ENV === 'production') {
        this.logError({
          type: 'unhandledrejection',
          error: event.reason,
          promise: event.promise,
        });
      }
      
      // Prevent the default browser behavior
      event.preventDefault();
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);
      
      // Log to error tracking service in production
      if (process.env.NODE_ENV === 'production') {
        this.logError({
          type: 'error',
          error: event.error,
          message: event.message,
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        });
      }
    });
  },

  logError(errorInfo) {
    // In a real application, this would send errors to a service like Sentry
    // For now, we'll just log them
    const errorData = {
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...errorInfo,
    };

    // Store errors in localStorage for debugging
    try {
      const errors = JSON.parse(localStorage.getItem('app_errors') || '[]');
      errors.push(errorData);
      
      // Keep only the last 50 errors
      if (errors.length > 50) {
        errors.splice(0, errors.length - 50);
      }
      
      localStorage.setItem('app_errors', JSON.stringify(errors));
    } catch (e) {
      // Fail silently if localStorage is not available
    }

    // You could also send to an external service here
    // Example: sendToErrorTrackingService(errorData);
  },

  getStoredErrors() {
    try {
      return JSON.parse(localStorage.getItem('app_errors') || '[]');
    } catch (e) {
      return [];
    }
  },

  clearStoredErrors() {
    try {
      localStorage.removeItem('app_errors');
    } catch (e) {
      // Fail silently
    }
  },
};
