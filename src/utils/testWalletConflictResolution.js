// Test script for wallet conflict resolution
export function testWalletConflictResolution() {
  console.log('=== Testing Wallet Conflict Resolution ===');
  
  // Check if conflict resolver is loaded
  if (window.getAllWalletProviders) {
    console.log('✅ Conflict resolver is loaded');
    
    // Get all discovered wallets
    const wallets = window.getAllWalletProviders();
    console.log(`✅ Found ${wallets.length} wallet(s):`);
    
    wallets.forEach((wallet, index) => {
      console.log(`   ${index + 1}. ${wallet.info.name} (UUID: ${wallet.info.uuid})`);
    });
    
    // Check if window.ethereum is available
    if (window.ethereum) {
      console.log('✅ window.ethereum is available');
      
      // Check wallet properties
      const properties = [];
      if (window.ethereum.isMetaMask) properties.push('MetaMask');
      if (window.ethereum.isCoinbaseWallet) properties.push('Coinbase');
      if (window.ethereum.isBraveWallet) properties.push('Brave');
      
      if (properties.length > 0) {
        console.log(`   Detected wallet properties: ${properties.join(', ')}`);
      }
    } else {
      console.log('⚠️  window.ethereum is not available');
    }
    
    // Test switching wallets
    if (wallets.length > 1) {
      console.log('\n🔄 Testing wallet switching...');
      const firstWallet = wallets[0];
      const secondWallet = wallets[1];
      
      console.log(`   Switching to ${secondWallet.info.name}...`);
      const switched = window.switchWalletProvider(secondWallet.info.uuid);
      
      if (switched) {
        console.log('   ✅ Successfully switched wallets');
      } else {
        console.log('   ❌ Failed to switch wallets');
      }
      
      // Switch back
      window.switchWalletProvider(firstWallet.info.uuid);
    }
    
    // Test EIP-6963 support
    console.log('\n🔍 Testing EIP-6963 support...');
    
    // Create a test listener
    const testListener = (event) => {
      console.log('   ✅ Received EIP-6963 announcement:', event.detail.info.name);
    };
    
    window.addEventListener('eip6963:announceProvider', testListener);
    
    // Request providers
    window.dispatchEvent(new Event('eip6963:requestProvider'));
    
    // Clean up
    setTimeout(() => {
      window.removeEventListener('eip6963:announceProvider', testListener);
      console.log('\n✅ Wallet conflict resolution test completed');
    }, 1000);
    
  } else {
    console.log('❌ Conflict resolver not loaded');
    console.log('   Make sure ethereum-conflict-resolver.js is included before other scripts');
  }
  
  // Check for common errors
  console.log('\n🔍 Checking for common errors...');
  
  const originalConsoleError = console.error;
  let errorCount = 0;
  
  console.error = function(...args) {
    const errorMessage = args.join(' ');
    if (errorMessage.includes('Cannot redefine property: ethereum') ||
        errorMessage.includes('Cannot set property ethereum')) {
      errorCount++;
    }
    originalConsoleError.apply(console, args);
  };
  
  setTimeout(() => {
    console.error = originalConsoleError;
    if (errorCount > 0) {
      console.log(`   ⚠️  Detected ${errorCount} wallet conflict error(s)`);
      console.log('   These errors indicate wallets are still fighting over window.ethereum');
    } else {
      console.log('   ✅ No wallet conflict errors detected');
    }
  }, 2000);
}

// Auto-run test if this script is loaded directly
if (typeof window !== 'undefined') {
  window.testWalletConflictResolution = testWalletConflictResolution;
  
  // Run test after page load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setTimeout(testWalletConflictResolution, 1000);
    });
  } else {
    setTimeout(testWalletConflictResolution, 1000);
  }
}