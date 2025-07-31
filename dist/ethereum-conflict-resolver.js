// Enhanced Ethereum Provider Conflict Resolver with EIP-6963 Support
// This script prevents conflicts when multiple crypto wallet extensions try to inject providers

(function() {
  'use strict';
  
  // Store discovered providers
  const providers = new Map();
  let primaryProvider = null;
  
  // Store the original Object.defineProperty
  const originalDefineProperty = Object.defineProperty;
  
  // Track if ethereum has been defined
  let ethereumDefined = false;
  let ethereumValue = undefined;
  
  // EIP-6963: Listen for provider announcements
  window.addEventListener('eip6963:announceProvider', (event) => {
    const detail = event.detail;
    if (detail && detail.info && detail.provider) {
      console.log(`EIP-6963: Discovered wallet - ${detail.info.name}`);
      providers.set(detail.info.uuid, detail);
      
      // If no primary provider yet, use the first one
      if (!primaryProvider) {
        primaryProvider = detail.provider;
        ethereumValue = detail.provider;
      }
      
      // Dispatch custom event for the app to handle multiple wallets
      window.dispatchEvent(new CustomEvent('walletDiscovered', {
        detail: {
          wallets: Array.from(providers.values()),
          count: providers.size
        }
      }));
    }
  });
  
  // Request providers to announce themselves
  window.dispatchEvent(new Event('eip6963:requestProvider'));
  
  // Pre-define ethereum to prevent conflicts
  try {
    // Check if ethereum already exists
    const descriptor = Object.getOwnPropertyDescriptor(window, 'ethereum');
    
    if (descriptor) {
      // If ethereum already exists, just track it
      console.log('Ethereum already defined with descriptor:', descriptor);
      ethereumDefined = true;
      
      // If it has a getter, try to get the value
      if (descriptor.get) {
        try {
          ethereumValue = descriptor.get();
        } catch (e) {
          console.warn('Could not get ethereum value:', e);
        }
      } else {
        ethereumValue = window.ethereum;
      }
      
      // If the property is not configurable, we can't redefine it
      // So we'll work around it by intercepting provider injections
      if (!descriptor.configurable) {
        console.warn('window.ethereum is not configurable, using workaround mode');
      }
    } else {
      // Only define if it doesn't exist
      originalDefineProperty.call(Object, window, 'ethereum', {
        get() {
          return ethereumValue || primaryProvider;
        },
        set(value) {
          if (!ethereumValue) {
            ethereumValue = value;
            console.log('Ethereum provider set successfully');
            
            // If this is the first provider and we don't have EIP-6963 support,
            // treat it as the primary provider
            if (!primaryProvider) {
              primaryProvider = value;
            }
          } else {
            console.warn('Attempted to overwrite ethereum provider, storing as alternative...');
            // Store the provider even if we can't set it as primary
            if (value && value.isMetaMask) {
              providers.set('metamask-legacy', { 
                info: { 
                  uuid: 'metamask-legacy', 
                  name: 'MetaMask', 
                  icon: '' 
                }, 
                provider: value 
              });
            } else if (value && value.isCoinbaseWallet) {
              providers.set('coinbase-legacy', { 
                info: { 
                  uuid: 'coinbase-legacy', 
                  name: 'Coinbase Wallet', 
                  icon: '' 
                }, 
                provider: value 
              });
            } else if (value && value.isRabby) {
              providers.set('rabby-legacy', { 
                info: { 
                  uuid: 'rabby-legacy', 
                  name: 'Rabby Wallet', 
                  icon: '' 
                }, 
                provider: value 
              });
            } else if (value && value.isOkxWallet) {
              providers.set('okx-legacy', { 
                info: { 
                  uuid: 'okx-legacy', 
                  name: 'OKX Wallet', 
                  icon: '' 
                }, 
                provider: value 
              });
            }
          }
        },
        configurable: true,
        enumerable: true
      });
      ethereumDefined = true;
    }
  } catch(e) {
    console.warn('Failed to handle ethereum property:', e);
    ethereumDefined = true; // Mark as defined to prevent further attempts
  }
  
  // Override Object.defineProperty to intercept ethereum definitions
  Object.defineProperty = function(obj, prop, descriptor) {
    // Special handling for window.ethereum
    if (obj === window && prop === 'ethereum') {
      if (ethereumDefined) {
        console.warn('Attempted to redefine window.ethereum, handling gracefully...');
        
        // Try to extract the provider value
        let providerValue = null;
        if (descriptor) {
          if (descriptor.value) {
            providerValue = descriptor.value;
          } else if (descriptor.get) {
            try {
              providerValue = descriptor.get();
            } catch (e) {
              console.warn('Could not get provider value from getter:', e);
            }
          }
        }
        
        // Update the value if we don't have one yet
        if (!ethereumValue && providerValue) {
          ethereumValue = providerValue;
          if (!primaryProvider) {
            primaryProvider = providerValue;
          }
        }
        
        // Store the provider as an alternative
        if (providerValue) {
          if (providerValue.isMetaMask) {
            providers.set('metamask-redefine', { 
              info: { uuid: 'metamask-redefine', name: 'MetaMask', icon: '' }, 
              provider: providerValue 
            });
          } else if (providerValue.isRabby) {
            providers.set('rabby-redefine', { 
              info: { uuid: 'rabby-redefine', name: 'Rabby Wallet', icon: '' }, 
              provider: providerValue 
            });
          }
        }
        
        return obj;
      }
    }
    
    // For all other properties, use the original defineProperty
    try {
      return originalDefineProperty.call(Object, obj, prop, descriptor);
    } catch(e) {
      if (prop === 'ethereum') {
        console.warn('Failed to define ethereum property:', e);
        return obj;
      }
      // Re-throw for non-ethereum properties
      throw e;
    }
  };
  
  // Expose a method to get all discovered providers
  window.getAllWalletProviders = function() {
    return Array.from(providers.values());
  };
  
  // Expose a method to switch providers
  window.switchWalletProvider = function(uuid) {
    const provider = providers.get(uuid);
    if (provider && provider.provider) {
      ethereumValue = provider.provider;
      primaryProvider = provider.provider;
      console.log(`Switched to wallet: ${provider.info.name}`);
      return true;
    }
    return false;
  };
  
  console.log('Enhanced Ethereum conflict resolver with EIP-6963 support initialized');
})();