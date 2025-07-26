// Example integration for your React/Vue app
import { WalletProviderHandler } from './wallet-provider-handler.js';

// Initialize wallet handler on app load
let walletHandler;
let currentProvider;

async function initializeWalletConnection() {
  try {
    // Create handler instance
    walletHandler = new WalletProviderHandler();
    
    // Wait for providers to be injected
    await walletHandler.initialize();
    
    // Get available wallets
    const availableWallets = walletHandler.listProviders();
    console.log('Available wallet extensions:', availableWallets);
    
    // Check if we have any wallets
    if (availableWallets.length === 0) {
      console.warn('No wallet extensions detected. Please install MetaMask or another wallet.');
      return null;
    }
    
    // Prefer MetaMask if available
    if (availableWallets.includes('metamask')) {
      currentProvider = walletHandler.setPrimaryProvider('metamask');
      console.log('Using MetaMask as primary wallet');
    } else {
      // Use first available wallet
      currentProvider = walletHandler.getPrimaryProvider();
      console.log('Using available wallet provider');
    }
    
    // Set up event listeners
    if (currentProvider) {
      currentProvider.on('accountsChanged', handleAccountsChanged);
      currentProvider.on('chainChanged', handleChainChanged);
    }
    
    return currentProvider;
  } catch (error) {
    console.error('Failed to initialize wallet connection:', error);
    return null;
  }
}

// Handle account changes
function handleAccountsChanged(accounts) {
  console.log('Accounts changed:', accounts);
  if (accounts.length === 0) {
    // User disconnected wallet
    console.log('Wallet disconnected');
  } else {
    // Update UI with new account
    console.log('Active account:', accounts[0]);
  }
}

// Handle chain changes
function handleChainChanged(chainId) {
  console.log('Chain changed to:', chainId);
  // Reload the page or update app state
  window.location.reload();
}

// Connect wallet function
async function connectWallet() {
  try {
    if (!currentProvider) {
      currentProvider = await initializeWalletConnection();
      if (!currentProvider) {
        throw new Error('No wallet provider available');
      }
    }
    
    // Request account access
    const accounts = await currentProvider.request({ 
      method: 'eth_requestAccounts' 
    });
    
    console.log('Connected to wallet:', accounts[0]);
    return accounts[0];
  } catch (error) {
    if (error.code === 4001) {
      // User rejected request
      console.log('User rejected wallet connection');
    } else {
      console.error('Failed to connect wallet:', error);
    }
    throw error;
  }
}

// Disconnect wallet
async function disconnectWallet() {
  if (currentProvider) {
    // Remove event listeners
    currentProvider.removeListener('accountsChanged', handleAccountsChanged);
    currentProvider.removeListener('chainChanged', handleChainChanged);
    
    // Some wallets support disconnect method
    if (currentProvider.disconnect) {
      await currentProvider.disconnect();
    }
    
    currentProvider = null;
    console.log('Wallet disconnected');
  }
}

// Export functions for use in your app
export {
  initializeWalletConnection,
  connectWallet,
  disconnectWallet,
  walletHandler,
  currentProvider
};