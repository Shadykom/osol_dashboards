// Wallet Conflict Resolver
// This utility helps prevent conflicts between multiple wallet extensions

export const resolveWalletConflicts = () => {
  try {
    // Check if ethereum is already defined
    if (window.ethereum) {
      console.log('Ethereum provider already exists, preventing conflicts...');
      
      // Freeze the ethereum object to prevent redefinition
      Object.freeze(window.ethereum);
      
      // Create a non-configurable property descriptor
      Object.defineProperty(window, 'ethereum', {
        configurable: false,
        writable: false,
        value: window.ethereum
      });
    }
  } catch (error) {
    console.warn('Failed to resolve wallet conflicts:', error);
  }
};

// Call this early in your app initialization
export const initializeWalletProtection = () => {
  // Run immediately
  resolveWalletConflicts();
  
  // Also run on DOMContentLoaded to catch late injections
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', resolveWalletConflicts);
  }
};