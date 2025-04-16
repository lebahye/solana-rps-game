import React, { useState, useEffect } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import './App.css';
import { RPSGameClient } from './rps-client';
import { GameView } from './types';

// Create placeholder components until you implement them
const HomeView: React.FC<any> = () => <div>Home View</div>;
const CreateGameView: React.FC<any> = () => <div>Create Game View</div>;
const AutoPlayView: React.FC<any> = () => <div>Auto Play View</div>;
const WelcomeView: React.FC<any> = () => <div>Welcome View</div>;
const SoundControl: React.FC = () => <div>Sound Control</div>;

const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter({ network }),
];

const RPS_PROGRAM_ID = new PublicKey('7Y9dRMY6V9cmVkXNFrHeUZmYf2tAV5wSVFcYyD5bLQpZ');

const App: React.FC = () => {
  return (
    <ConnectionProvider endpoint={endpoint}>
      <WalletProvider wallets={wallets} autoConnect>
        <WalletModalProvider>
          <RPSGame />
        </WalletModalProvider>
      </WalletProvider>
    </ConnectionProvider>
  );
};

const RPSGame: React.FC = () => {
  const { connected, publicKey } = useWallet();
  const [currentView, setCurrentView] = useState<GameView>(GameView.HOME);
  const [gameClient, setGameClient] = useState<RPSGameClient | null>(null);
  const [gameId, setGameId] = useState<string>('');

  useEffect(() => {
    if (connected && publicKey) {
      const client = new RPSGameClient(publicKey, RPS_PROGRAM_ID);
      setGameClient(client);
    }
  }, [connected, publicKey]);

  const renderCurrentView = () => {
    switch (currentView) {
      case GameView.HOME:
        return (
          <HomeView
            onCreateGame={() => setCurrentView(GameView.CREATE_GAME)}
            onJoinGame={() => setCurrentView(GameView.JOIN_GAME)}
            onAutoPlay={() => setCurrentView(GameView.AUTO_PLAY)}
          />
        );
      case GameView.CREATE_GAME:
        return (
          <CreateGameView
            gameClient={gameClient!}
            onGameCreated={(id) => {
              setGameId(id);
              setCurrentView(GameView.GAME_LOBBY);
            }}
            onBack={() => setCurrentView(GameView.HOME)}
          />
        );
      case GameView.AUTO_PLAY:
        return (
          <AutoPlayView
            gameClient={gameClient!}
            onBackToHome={() => setCurrentView(GameView.HOME)}
          />
        );
      // Add other view cases here
      default:
        return <WelcomeView onConnect={() => setCurrentView(GameView.HOME)} />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-800 text-white">
      <div className="container mx-auto px-4 py-8">
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-4xl font-bold">Solana Rock Paper Scissors</h1>
          <WalletMultiButton />
        </header>
        {connected && <SoundControl />}
        {renderCurrentView()}
      </div>
    </div>
  );
};

export default App;


