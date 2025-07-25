// Extension Blocker Script
// This script prevents browser extensions from interfering with the application

(function() {
  'use strict';
  
  // Prevent extensions from modifying window.ethereum
  if (Object.prototype.hasOwnProperty.call(window, 'ethereum')) {
    try {
      Object.defineProperty(window, 'ethereum', {
        get: function() { return undefined; },
        set: function() { return false; },
        configurable: false
      });
    } catch (e) {
      // Silently fail if already defined
    }
  }
  
  // Block common extension injection points
  const blockList = ['ethereum', 'web3', 'solana', 'phantom', 'metamask'];
  
  blockList.forEach(function(prop) {
    try {
      Object.defineProperty(window, prop, {
        value: undefined,
        writable: false,
        configurable: false
      });
    } catch (e) {
      // Property might already be defined
    }
  });
  
  // Override postMessage to filter out extension messages
  const originalPostMessage = window.postMessage;
  window.postMessage = function(message, targetOrigin, transfer) {
    // Filter out known extension messages
    if (typeof message === 'object' && message !== null) {
      const msgStr = JSON.stringify(message);
      if (msgStr.includes('metamask') || 
          msgStr.includes('ethereum') || 
          msgStr.includes('web3') ||
          msgStr.includes('polkadot') ||
          msgStr.includes('namada')) {
        return;
      }
    }
    return originalPostMessage.apply(window, arguments);
  };
})();