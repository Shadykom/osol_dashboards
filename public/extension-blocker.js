// Extension Blocker Script
// This script logs warnings about browser extensions but doesn't block them

(function() {
  'use strict';
  
  // Log if extensions are trying to inject providers
  const providers = ['ethereum', 'web3', 'solana', 'phantom', 'metamask'];
  
  providers.forEach(function(prop) {
    if (window[prop]) {
      console.warn(`Extension detected: ${prop} provider found. This banking application does not use Web3.`);
    }
  });
  
  // Monitor for late injections
  setTimeout(function() {
    providers.forEach(function(prop) {
      if (window[prop]) {
        console.warn(`Late injection detected: ${prop} provider was injected after page load.`);
      }
    });
  }, 2000);
})();