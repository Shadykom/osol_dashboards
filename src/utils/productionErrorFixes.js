// Production Error Fixes
// Comprehensive error handling and suppression for production

export const productionErrorFixes = {
  initialize() {
    console.log('[EALAANI] Initializing production error fixes...');
    
    // 1. Handle CORS errors
    this.handleCORSErrors();
    
    // 2. Handle Auth Session errors
    this.handleAuthErrors();
    
    // 3. Handle duplicate Google Maps scripts
    this.cleanupGoogleMaps();
    
    // 4. Handle image loading errors
    this.handleImageErrors();
    
    // 5. Setup global error handlers
    this.setupGlobalErrorHandlers();
    
    console.log('[EALAANI] Production error fixes initialized');
  },

  handleCORSErrors() {
    // Override fetch to handle CORS errors gracefully
    const originalFetch = window.fetch;
    window.fetch = async function(...args) {
      try {
        const response = await originalFetch.apply(this, args);
        return response;
      } catch (error) {
        // Check if it's a CORS error
        if (error.message && (error.message.includes('CORS') || error.message.includes('NetworkError'))) {
          const url = args[0];
          
          // Special handling for AI status endpoint
          if (url && url.includes('/api/ai/status')) {
            console.warn('[EALAANI AI] AI service unavailable due to CORS. Features will be disabled.');
            // Return a mock response to prevent app crashes
            return new Response(JSON.stringify({ available: false }), {
              status: 200,
              headers: { 'Content-Type': 'application/json' }
            });
          }
          
          // Log other CORS errors but don't throw
          console.warn(`CORS error for ${url}:`, error.message);
          throw error;
        }
        throw error;
      }
    };
  },

  handleAuthErrors() {
    // Intercept Supabase auth errors
    window.addEventListener('error', (event) => {
      if (event.error && event.error.message && event.error.message.includes('AuthSessionMissingError')) {
        console.warn('[EALAANI] Auth session missing - user may need to log in');
        // Prevent the error from bubbling up
        event.preventDefault();
        event.stopPropagation();
        
        // Optionally redirect to login or show a notification
        // window.location.href = '/login';
      }
    });

    // Handle unhandled promise rejections for auth errors
    window.addEventListener('unhandledrejection', (event) => {
      if (event.reason && event.reason.message && event.reason.message.includes('AuthSessionMissingError')) {
        console.warn('[EALAANI] Handled auth session error in promise');
        event.preventDefault();
      }
    });
  },

  cleanupGoogleMaps() {
    // Clean up duplicate Google Maps scripts periodically
    const cleanupDuplicates = () => {
      const scripts = document.querySelectorAll('script[src*="maps.googleapis.com"]');
      if (scripts.length > 1) {
        console.log(`[EALAANI] Found ${scripts.length} Google Maps scripts, cleaning up duplicates...`);
        
        // Keep the first script, remove others
        for (let i = 1; i < scripts.length; i++) {
          console.log(`[EALAANI] Removed duplicate Google Maps script ${i}`);
          scripts[i].remove();
        }
      }
    };

    // Run cleanup after a delay to ensure all scripts are loaded
    setTimeout(cleanupDuplicates, 5000);
    
    // Also run periodically in case new duplicates are added
    setInterval(cleanupDuplicates, 30000);
  },

  handleImageErrors() {
    // Handle image loading errors
    window.addEventListener('error', (event) => {
      if (event.target && event.target.tagName === 'IMG') {
        const img = event.target;
        console.warn(`[EALAANI] Image failed to load: ${img.src}`);
        
        // Set a fallback image or hide the broken image
        if (img.src.includes('mall-entrance-display.jpg')) {
          // Use a placeholder or default image
          img.src = '/placeholder-image.svg';
          img.alt = 'Image unavailable';
        }
        
        // Prevent the error from showing in console
        event.preventDefault();
      }
    }, true);
  },

  setupGlobalErrorHandlers() {
    // Centralized console error suppressor
    console.log('[EALAANI] Centralized console error suppressor activated from production fixes');
    
    // Store original console methods
    const originalError = console.error;
    const originalWarn = console.warn;
    
    // Override console.error to filter out known issues
    console.error = function(...args) {
      const errorString = args.join(' ');
      
      // List of errors to suppress
      const suppressedErrors = [
        'Cross-Origin Request Blocked',
        'CORS header',
        'NetworkError when attempting to fetch resource',
        'AuthSessionMissingError',
        'NS_BINDING_ABORTED',
        'OpaqueResponseBlocking',
        '__cf_bm.*has been rejected'
      ];
      
      // Check if this error should be suppressed
      const shouldSuppress = suppressedErrors.some(pattern => 
        new RegExp(pattern, 'i').test(errorString)
      );
      
      if (!shouldSuppress) {
        originalError.apply(console, args);
      } else {
        // Log as warning instead for debugging
        originalWarn.apply(console, ['[Suppressed Error]', ...args]);
      }
    };

    // Global error handler
    window.addEventListener('error', (event) => {
      const error = event.error || {};
      const message = error.message || event.message || '';
      
      // List of errors to handle silently
      const silentErrors = [
        'ethereum',
        'wallet',
        'metamask',
        'phantom',
        'solana'
      ];
      
      if (silentErrors.some(term => message.toLowerCase().includes(term))) {
        event.preventDefault();
        console.warn('[EALAANI] Suppressed wallet-related error:', message);
      }
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      const reason = event.reason || {};
      const message = reason.message || String(reason);
      
      // Handle specific promise rejections
      if (message.includes('CORS') || message.includes('NetworkError')) {
        event.preventDefault();
        console.warn('[EALAANI] Suppressed CORS-related promise rejection');
      }
    });
  }
};

// Auto-initialize in production
if (import.meta.env.PROD) {
  productionErrorFixes.initialize();
}