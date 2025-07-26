// Wallet Provider Handler
// This module helps manage multiple wallet extensions gracefully

class WalletProviderHandler {
  constructor() {
    this.providers = new Map();
    this.primaryProvider = null;
  }

  // Initialize and detect available providers
  async initialize() {
    // Wait a bit for all providers to inject
    await new Promise(resolve => setTimeout(resolve, 100));

    // Check for different wallet providers
    if (typeof window.ethereum !== 'undefined') {
      // Handle MetaMask
      if (window.ethereum.isMetaMask) {
        this.providers.set('metamask', window.ethereum);
      }
      
      // Handle multiple providers
      if (window.ethereum.providers?.length > 0) {
        window.ethereum.providers.forEach(provider => {
          if (provider.isMetaMask) {
            this.providers.set('metamask', provider);
          } else if (provider.isCoinbaseWallet) {
            this.providers.set('coinbase', provider);
          } else if (provider.isTrust) {
            this.providers.set('trust', provider);
          }
        });
      }
    }

    // Check for other common providers
    if (window.coinbaseWalletExtension) {
      this.providers.set('coinbase', window.coinbaseWalletExtension);
    }

    return this.providers;
  }

  // Get a specific provider
  getProvider(walletName) {
    return this.providers.get(walletName);
  }

  // Set primary provider
  setPrimaryProvider(walletName) {
    const provider = this.providers.get(walletName);
    if (provider) {
      this.primaryProvider = provider;
      return provider;
    }
    throw new Error(`Provider ${walletName} not found`);
  }

  // Get primary provider or first available
  getPrimaryProvider() {
    if (this.primaryProvider) {
      return this.primaryProvider;
    }
    
    // Return first available provider
    const firstProvider = this.providers.values().next().value;
    if (firstProvider) {
      this.primaryProvider = firstProvider;
      return firstProvider;
    }
    
    throw new Error('No wallet provider found');
  }

  // List available providers
  listProviders() {
    return Array.from(this.providers.keys());
  }
}

// Usage example:
async function connectWallet() {
  const walletHandler = new WalletProviderHandler();
  
  try {
    await walletHandler.initialize();
    const availableWallets = walletHandler.listProviders();
    console.log('Available wallets:', availableWallets);
    
    // Use MetaMask if available, otherwise use first available
    let provider;
    if (availableWallets.includes('metamask')) {
      provider = walletHandler.setPrimaryProvider('metamask');
    } else {
      provider = walletHandler.getPrimaryProvider();
    }
    
    // Now use the provider
    const accounts = await provider.request({ method: 'eth_requestAccounts' });
    console.log('Connected accounts:', accounts);
    
    return provider;
  } catch (error) {
    console.error('Failed to connect wallet:', error);
    throw error;
  }
}

export { WalletProviderHandler, connectWallet };