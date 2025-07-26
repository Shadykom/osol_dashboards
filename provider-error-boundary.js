// React Error Boundary for Provider Issues
import React from 'react';

class ProviderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log the error to an error reporting service
    console.error('Provider Error:', error, errorInfo);
    
    // Check if it's a provider-related error
    if (error.message?.includes('ethereum') || 
        error.message?.includes('provider') ||
        error.message?.includes('wallet')) {
      console.warn('Wallet provider conflict detected. Please disable conflicting wallet extensions.');
    }
  }

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div className="error-boundary">
          <h2>Wallet Connection Issue</h2>
          <p>We detected a conflict between multiple wallet extensions.</p>
          <p>To fix this issue:</p>
          <ol>
            <li>Keep only one wallet extension enabled (preferably MetaMask)</li>
            <li>Disable other wallet extensions temporarily</li>
            <li>Refresh the page</li>
          </ol>
          <button onClick={() => window.location.reload()}>
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Vue 3 Error Handler
export function setupVueErrorHandler(app) {
  app.config.errorHandler = (error, instance, info) => {
    console.error('Vue Error:', error, info);
    
    // Check for provider-related errors
    if (error.message?.includes('ethereum') || 
        error.message?.includes('provider') ||
        error.message?.includes('Cannot set property')) {
      console.warn('Wallet provider conflict detected.');
      
      // Show user-friendly notification
      if (window.alert) {
        alert('Multiple wallet extensions detected. Please disable all except one and refresh the page.');
      }
    }
  };
}

export default ProviderErrorBoundary;