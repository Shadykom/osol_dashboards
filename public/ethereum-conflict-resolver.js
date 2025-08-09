// Early Ethereum Conflict Resolver
// This script should be loaded as early as possible to prevent wallet conflicts
(function() {
  'use strict';
  
  let ethereumProviderSet = false;
  let primaryProvider = null;
  let providerQueue = [];
  
  // Override Object.defineProperty to intercept ethereum definitions
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = function(obj, prop, descriptor) {
    if (obj === window && prop === 'ethereum') {
      if (!ethereumProviderSet) {
        console.log('[Ethereum Conflict Resolver] First provider detected');
        ethereumProviderSet = true;
        primaryProvider = descriptor.value || (descriptor.get && descriptor.get());
        
        // Store all providers
        if (primaryProvider) {
          providerQueue.push({
            provider: primaryProvider,
            name: primaryProvider.isMetaMask ? 'MetaMask' : 
                  primaryProvider.isCoinbaseWallet ? 'Coinbase' :
                  primaryProvider.isBraveWallet ? 'Brave' : 'Unknown'
          });
        }
        
        // Create a unified provider
        const unifiedProvider = new Proxy(primaryProvider || {}, {
          get(target, prop) {
            // Special handling for provider detection
            if (prop === 'providers') {
              return providerQueue.map(p => p.provider);
            }
            return target[prop];
          }
        });
        
        // Define ethereum with our unified provider
        return originalDefineProperty.call(this, obj, prop, {
          get() { return unifiedProvider; },
          set(value) {
            console.warn('[Ethereum Conflict Resolver] Blocked attempt to redefine window.ethereum');
            // Store additional providers
            if (value && value !== primaryProvider) {
              providerQueue.push({
                provider: value,
                name: value.isMetaMask ? 'MetaMask' : 
                      value.isCoinbaseWallet ? 'Coinbase' :
                      value.isBraveWallet ? 'Brave' : 'Unknown'
              });
            }
            return true;
          },
          configurable: false,
          enumerable: true
        });
      } else {
        console.warn('[Ethereum Conflict Resolver] Blocked duplicate ethereum definition');
        // Store additional providers
        const newProvider = descriptor.value || (descriptor.get && descriptor.get());
        if (newProvider && newProvider !== primaryProvider) {
          providerQueue.push({
            provider: newProvider,
            name: newProvider.isMetaMask ? 'MetaMask' : 
                  newProvider.isCoinbaseWallet ? 'Coinbase' :
                  newProvider.isBraveWallet ? 'Brave' : 'Unknown'
          });
        }
        return obj;
      }
    }
    return originalDefineProperty.call(this, obj, prop, descriptor);
  };
  
  // Also handle direct assignment attempts
  let ethereumTrapSet = false;
  
  function setEthereumTrap() {
    if (ethereumTrapSet) return;
    ethereumTrapSet = true;
    
    try {
      Object.defineProperty(window, 'ethereum', {
        get() { return primaryProvider; },
        set(value) {
          if (!ethereumProviderSet) {
            console.log('[Ethereum Conflict Resolver] First provider set via assignment');
            ethereumProviderSet = true;
            primaryProvider = value;
            if (value) {
              providerQueue.push({
                provider: value,
                name: value.isMetaMask ? 'MetaMask' : 
                      value.isCoinbaseWallet ? 'Coinbase' :
                      value.isBraveWallet ? 'Brave' : 'Unknown'
              });
            }
          } else {
            console.warn('[Ethereum Conflict Resolver] Blocked ethereum assignment');
            if (value && value !== primaryProvider) {
              providerQueue.push({
                provider: value,
                name: value.isMetaMask ? 'MetaMask' : 
                      value.isCoinbaseWallet ? 'Coinbase' :
                      value.isBraveWallet ? 'Brave' : 'Unknown'
              });
            }
          }
          return true;
        },
        configurable: false,
        enumerable: true
      });
    } catch (e) {
      // If ethereum is already defined, we're too late
      if (window.ethereum && !ethereumProviderSet) {
        console.log('[Ethereum Conflict Resolver] Ethereum already exists');
        ethereumProviderSet = true;
        primaryProvider = window.ethereum;
        providerQueue.push({
          provider: primaryProvider,
          name: primaryProvider.isMetaMask ? 'MetaMask' : 
                primaryProvider.isCoinbaseWallet ? 'Coinbase' :
                primaryProvider.isBraveWallet ? 'Brave' : 'Unknown'
        });
      }
    }
  }
  
  // Set trap immediately
  setEthereumTrap();
  
  // Also set trap on DOMContentLoaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setEthereumTrap);
  }
  
  // Expose resolver info
  window.__ethereumConflictResolver = {
    version: '1.0.0',
    providers: providerQueue,
    primaryProvider: () => primaryProvider
  };
})();