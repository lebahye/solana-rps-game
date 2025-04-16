import React from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';

function App() {
  return (
    <div>
      <h1>Solana RPS Game</h1>
      <WalletMultiButton />
    </div>
  );
}

export default App;