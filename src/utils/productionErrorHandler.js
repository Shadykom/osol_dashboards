// Production error handler
/* global process */
export const productionErrorHandler = {
  activate: () => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'production') {
      window.addEventListener('error', (event) => {
        // Log errors to console in development
        console.error('Global error:', event.error);
        
        // In production, you might want to send errors to a logging service
        // Example: sendToLoggingService(event.error);
        
        // Prevent the default error handling
        event.preventDefault();
      });
      
      window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        
        // In production, you might want to send errors to a logging service
        // Example: sendToLoggingService(event.reason);
        
        // Prevent the default error handling
        event.preventDefault();
      });
    }
  }
};
