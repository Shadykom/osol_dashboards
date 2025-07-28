// Extension Blocker Script
// This script prevents browser extensions from interfering with the application

(function() {
  'use strict';
  
  console.log('Extension blocker initializing...');
  
  // List of properties that extensions commonly try to inject
  const blockedProperties = [
    'ethereum', 'web3', 'solana', 'phantom', 'metamask',
    'tronLink', 'tronWeb', 'okxwallet', 'coin98',
    'trustwallet', 'brave', 'opera', 'binanceChain',
    'keplr', 'cosmosJSWalletConnect', 'terraStation',
    'starknet', 'starknet_braavos', 'argentX',
    'pontem', 'petra', 'martian', 'fewcha', 'spika',
    'rise', 'nami', 'eternl', 'flint', 'yoroi',
    'gerowallet', 'typhoncip30', 'cardano', 'nufi',
    'penumbra', 'evmAsk'
  ];
  
  // Create a frozen dummy object that can't be modified
  const dummyProvider = Object.freeze({
    isMetaMask: false,
    isPhantom: false,
    isBraveWallet: false,
    isExodus: false,
    isTokenPocket: false,
    request: () => Promise.reject(new Error('This application does not support Web3')),
    send: () => Promise.reject(new Error('This application does not support Web3')),
    sendAsync: () => Promise.reject(new Error('This application does not support Web3')),
    on: () => {},
    removeListener: () => {},
    removeAllListeners: () => {}
  });
  
  // Block all the properties
  blockedProperties.forEach(prop => {
    try {
      // First, try to delete any existing property
      delete window[prop];
      
      // Then define it as non-configurable and non-writable
      Object.defineProperty(window, prop, {
        value: dummyProvider,
        writable: false,
        configurable: false,
        enumerable: false
      });
      
      console.log(`Blocked property: ${prop}`);
    } catch (e) {
      // If the property already exists and can't be redefined, try to freeze it
      try {
        if (window[prop] && typeof window[prop] === 'object') {
          Object.freeze(window[prop]);
          console.log(`Froze existing property: ${prop}`);
        }
      } catch (freezeError) {
        console.warn(`Could not block or freeze ${prop}:`, e.message);
      }
    }
  });
  
  // Override Object.defineProperty to prevent extensions from defining these properties
  const originalDefineProperty = Object.defineProperty;
  Object.defineProperty = new Proxy(originalDefineProperty, {
    apply(target, thisArg, argumentsList) {
      const [obj, prop] = argumentsList;
      
      // Block attempts to define blocked properties on window
      if (obj === window && blockedProperties.includes(prop)) {
        console.warn(`Blocked attempt to define window.${prop}`);
        return obj;
      }
      
      // Allow other property definitions
      try {
        return Reflect.apply(target, thisArg, argumentsList);
      } catch (error) {
        console.warn(`Error defining property ${prop}:`, error.message);
        return obj;
      }
    }
  });
  
  // Block postMessage from extensions
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    // Check if the message is from an extension
    if (typeof message === 'object' && message !== null) {
      const messageStr = JSON.stringify(message).toLowerCase();
      const extensionKeywords = ['metamask', 'ethereum', 'wallet', 'web3', 'phantom', 'solana', 'penumbra', 'evmask'];
      
      if (extensionKeywords.some(keyword => messageStr.includes(keyword))) {
        console.warn('Blocked extension postMessage:', message.type || 'unknown');
        return;
      }
    }
    
    // Allow other messages
    return originalPostMessage.call(this, message, targetOrigin, transfer);
  };
  
  // Prevent script injection
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.addedNodes.forEach((node) => {
        if (node.tagName === 'SCRIPT' && node.src) {
          // Check if it's an extension script
          if (node.src.includes('chrome-extension://') || 
              node.src.includes('moz-extension://') ||
              node.src.includes('extension://')) {
            console.warn('Blocked extension script injection:', node.src);
            node.remove();
          }
        }
      });
    });
  });
  
  // Start observing as soon as possible
  if (document.body) {
    observer.observe(document.body, { childList: true, subtree: true });
  } else {
    document.addEventListener('DOMContentLoaded', () => {
      observer.observe(document.body, { childList: true, subtree: true });
    });
  }
  
  // Set flag to indicate extension blocker is active
  window.__extensionBlockerActive = true;
  
  console.log('Extension blocker initialized successfully');
})();