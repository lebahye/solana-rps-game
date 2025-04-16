import React from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

export const HomeView: React.FC = () => {
  const { connected } = useWallet();
  
  return (
    <div className="container mx-auto p-4">
      <h1>Welcome to Solana RPS Game</h1>
      <WalletMultiButton />
      {connected && (
        <div className="mt-4">
          <button className="btn-primary">Create Game</button>
          <button className="btn-secondary">Join Game</button>
        </div>
      )}
    </div>
  );
};