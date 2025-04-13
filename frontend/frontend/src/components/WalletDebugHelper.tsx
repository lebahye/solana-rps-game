import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletName } from '@solana/wallet-adapter-base';

const WalletDebugHelper: React.FC = () => {
  const { 
    wallets, 
    wallet, 
    publicKey, 
    connecting, 
    connected, 
    disconnect,
    select
  } = useWallet();

  const handleDisconnect = () => {
    disconnect();
    console.log('Wallet disconnected');
  };

  const handleReconnect = (name: WalletName) => {
    disconnect().then(() => {
      setTimeout(() => {
        select(name);
      }, 500);
    });
  };

  return (
    <div className="wallet-debug-helper bg-gray-800 p-4 rounded-lg mt-4">
      <h3 className="text-xl font-bold mb-2 text-white">Wallet Connection Helper</h3>
      
      <div className="mb-4">
        <p className="text-gray-300">Status: {connecting ? 'Connecting...' : connected ? 'Connected' : 'Disconnected'}</p>
        {publicKey && (
          <p className="text-gray-300 text-sm break-all">
            Public Key: {publicKey.toString()}
          </p>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <button 
          onClick={handleDisconnect}
          className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm"
        >
          Disconnect Wallet
        </button>

        {wallet && (
          <button 
            onClick={() => handleReconnect(wallet.adapter.name)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm"
          >
            Reconnect {wallet.adapter.name}
          </button>
        )}
      </div>

      <div className="mt-4">
        <h4 className="text-lg font-semibold text-white mb-2">Available Wallets:</h4>
        <div className="flex flex-wrap gap-2">
          {wallets.map((w) => (
            <button
              key={w.adapter.name}
              onClick={() => select(w.adapter.name)}
              className={`px-3 py-1 rounded text-sm ${
                wallet?.adapter.name === w.adapter.name
                  ? 'bg-purple-600 text-white'
                  : 'bg-gray-600 text-gray-200 hover:bg-gray-700'
              }`}
            >
              {w.adapter.name}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-400">
        <p>If your wallet is stuck connecting:</p>
        <ol className="list-decimal pl-5 mt-1">
          <li>Try disconnecting and reconnecting</li>
          <li>Make sure your wallet is set to Devnet</li>
          <li>Check if the wallet extension is up to date</li>
          <li>Try a different browser or wallet</li>
        </ol>
      </div>
    </div>
  );
};

export default WalletDebugHelper;
