import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Wallet, ChevronDown } from 'lucide-react';

const WalletSelector = ({ onWalletSelected }) => {
  const [wallets, setWallets] = useState([]);
  const [selectedWallet, setSelectedWallet] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState(null);

  useEffect(() => {
    // Listen for wallet discoveries
    const handleWalletDiscovered = (event) => {
      console.log('Wallets discovered:', event.detail);
      setWallets(event.detail.wallets);
      
      // Auto-select first wallet if none selected
      if (!selectedWallet && event.detail.wallets.length > 0) {
        setSelectedWallet(event.detail.wallets[0]);
      }
    };

    window.addEventListener('walletDiscovered', handleWalletDiscovered);

    // Check for already discovered wallets
    if (window.getAllWalletProviders) {
      const existingWallets = window.getAllWalletProviders();
      if (existingWallets.length > 0) {
        setWallets(existingWallets);
        setSelectedWallet(existingWallets[0]);
      }
    }

    // Request wallet announcements
    window.dispatchEvent(new Event('eip6963:requestProvider'));

    // Fallback: Check for legacy window.ethereum
    setTimeout(() => {
      if (wallets.length === 0 && window.ethereum) {
        console.log('Using legacy window.ethereum');
        const legacyWallet = {
          info: {
            uuid: 'legacy-ethereum',
            name: 'Unknown Wallet',
            icon: ''
          },
          provider: window.ethereum
        };
        setWallets([legacyWallet]);
        setSelectedWallet(legacyWallet);
      }
    }, 1000);

    return () => {
      window.removeEventListener('walletDiscovered', handleWalletDiscovered);
    };
  }, []);

  const connectWallet = async () => {
    if (!selectedWallet || !selectedWallet.provider) {
      console.error('No wallet selected');
      return;
    }

    try {
      const provider = selectedWallet.provider;
      
      // Switch to the selected provider if using our enhanced resolver
      if (window.switchWalletProvider) {
        window.switchWalletProvider(selectedWallet.info.uuid);
      }

      // Request accounts
      const accounts = await provider.request({ 
        method: 'eth_requestAccounts' 
      });

      if (accounts.length > 0) {
        setAccount(accounts[0]);
        setIsConnected(true);
        
        if (onWalletSelected) {
          onWalletSelected({
            wallet: selectedWallet,
            account: accounts[0],
            provider: provider
          });
        }
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      alert(`Failed to connect wallet: ${error.message}`);
    }
  };

  const disconnectWallet = () => {
    setIsConnected(false);
    setAccount(null);
  };

  const selectWallet = (wallet) => {
    setSelectedWallet(wallet);
    // If already connected, disconnect first
    if (isConnected) {
      disconnectWallet();
    }
  };

  const formatAddress = (address) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  if (wallets.length === 0) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Wallet className="h-4 w-4" />
        <span>No wallet detected</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {wallets.length > 1 && !isConnected && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <Wallet className="h-4 w-4 mr-2" />
              {selectedWallet ? selectedWallet.info.name : 'Select Wallet'}
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {wallets.map((wallet) => (
              <DropdownMenuItem
                key={wallet.info.uuid}
                onClick={() => selectWallet(wallet)}
                className="cursor-pointer"
              >
                <Wallet className="h-4 w-4 mr-2" />
                {wallet.info.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {isConnected ? (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">
            {selectedWallet.info.name}: {formatAddress(account)}
          </span>
          <Button variant="outline" size="sm" onClick={disconnectWallet}>
            Disconnect
          </Button>
        </div>
      ) : (
        <Button variant="primary" size="sm" onClick={connectWallet}>
          Connect {wallets.length === 1 ? selectedWallet.info.name : ''}
        </Button>
      )}
    </div>
  );
};

export default WalletSelector;