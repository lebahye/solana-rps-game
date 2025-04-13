import type React from 'react';
import { useState, useEffect, Component, ErrorInfo } from 'react';
import { WalletAdapterNetwork } from '@solana/wallet-adapter-base';
import { ConnectionProvider, WalletProvider, useWallet } from '@solana/wallet-adapter-react';
import { WalletModalProvider, WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { BackpackWalletAdapter } from '@solana/wallet-adapter-backpack';
import { CoinbaseWalletAdapter } from '@solana/wallet-adapter-coinbase';
import { LedgerWalletAdapter } from '@solana/wallet-adapter-ledger';
import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import './App.css';
import { RPSGameClient } from './rps-client';
import { GameView, CurrencyMode, TokenBalance } from './types';
import HomeView from './views/HomeView';
import CreateGameView from './views/CreateGameView';
import JoinGameView from './views/JoinGameView';
import GameLobbyView from './views/GameLobbyView';
import CommitChoiceView from './views/CommitChoiceView';
import RevealChoiceView from './views/RevealChoiceView';
import GameResultsView from './views/GameResultsView';
import AutoPlayView from './views/AutoPlayView';
import WelcomeView from './views/WelcomeView';
import SecurityView from './views/SecurityView';
import TestingView from './views/TestingView'; // Import for TestingView
import ProfileView from './views/ProfileView'; // Import for ProfileView
import ConnectionStatus from './components/ConnectionStatus'; // New import for connection status

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// New imports for token management
import TokenDisplay from './components/TokenDisplay';
import TokenModal from './components/TokenModal';
import { getTokenBalances, getFreeRPSTokens } from './services/token-service';
import SoundControl from './components/SoundControl';
import audioService from './services/audio-service';

// Error boundary component
class ErrorBoundary extends Component<{children: React.ReactNode}, {hasError: boolean, error: Error | null}> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("App error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-container" style={{
          padding: '20px',
          margin: '20px',
          backgroundColor: '#300',
          color: 'white',
          borderRadius: '8px',
          fontFamily: 'sans-serif'
        }}>
          <h2 style={{ color: '#f55' }}>Something went wrong</h2>
          <p>There was an issue loading the application:</p>
          <pre style={{
            backgroundColor: '#222',
            padding: '10px',
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '200px'
          }}>
            {this.state.error?.toString() || 'Unknown error'}
          </pre>
          <p>The most common cause is missing browser polyfills for Node.js built-ins.</p>
          <button
            onClick={() => window.location.reload()}
            style={{
              backgroundColor: '#f55',
              color: 'white',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '4px',
              marginTop: '12px',
              cursor: 'pointer'
            }}
          >
            Reload Application
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

// Default to devnet for development
const network = WalletAdapterNetwork.Devnet;
const endpoint = clusterApiUrl(network);

// Wallet adapters - added more wallet options for better cross-OS support
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter({ network }),
  new BackpackWalletAdapter(),
  new CoinbaseWalletAdapter(),
  new LedgerWalletAdapter(),
];

// RPS Program ID - a valid base58 public key (replace with your actual deployed program ID)
const RPS_PROGRAM_ID = new PublicKey('7Y9dRMY6V9cmVkXNFrHeUZmYf2tAV5wSVFcYyD5bLQpZ');

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ConnectionProvider endpoint={endpoint}>
        <WalletProvider wallets={wallets} autoConnect>
          <WalletModalProvider>
            <RPSGame />
          </WalletModalProvider>
        </WalletProvider>
      </ConnectionProvider>
    </ErrorBoundary>
  );
};

const RPSGame: React.FC = () => {
  const { connected, publicKey, signTransaction, sendTransaction } = useWallet();
  const [gameClient, setGameClient] = useState<RPSGameClient | null>(null);
  const [currentView, setCurrentView] = useState<GameView>(GameView.HOME);
  const [gameId, setGameId] = useState<string>('');
  const [gameData, setGameData] = useState<any>(null);
  const [userChoice, setUserChoice] = useState<number>(0);
  const [salt, setSalt] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // New state for responsive UI
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);

  // State for connection panel
  const [showConnectedPlayers, setShowConnectedPlayers] = useState<boolean>(false);

  // New state for token management
  const [tokenBalance, setTokenBalance] = useState<TokenBalance>({ sol: 0, rpsToken: 0 });
  const [loadingBalance, setLoadingBalance] = useState<boolean>(false);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState<boolean>(false);

  // Initialize game client when wallet is connected
  useEffect(() => {
    const initClient = async () => {
      if (connected && publicKey && signTransaction) {
        try {
          console.log('Initializing game client for wallet:', publicKey.toString());

          const connection = new Connection(endpoint, 'confirmed');

          // Get initial token balances
          setLoadingBalance(true);

          try {
            const balances = await getTokenBalances(connection, publicKey);
            setTokenBalance(balances);
          } catch (balanceError) {
            console.warn('Error fetching token balances:', balanceError);
            // Set default balances to prevent UI errors
            setTokenBalance({ sol: 0, rpsToken: 0 });
          }

          setLoadingBalance(false);

          // Initialize the game client with the wallet info
          const client = new RPSGameClient(
            connection,
            RPS_PROGRAM_ID,
            publicKey,
            sendTransaction,
            signTransaction
          );

          setGameClient(client);

          console.log('Game client initialized successfully');
        } catch (error) {
          console.error('Error initializing game client:', error);
          setErrorMessage('Failed to initialize game client. Please check console for details.');
        }
      } else {
        // Clear game client when wallet disconnects
        setGameClient(null);
        // Reset any error messages
        setErrorMessage('');
        // Set default token balances
        setTokenBalance({ sol: 0, rpsToken: 0 });
      }
    };

    initClient();
  }, [connected, publicKey, signTransaction, sendTransaction]);

  // Function to create a new game
  const createGame = async (betAmount: number, currencyMode: CurrencyMode) => {
    if (!gameClient) {
      setErrorMessage('Game client not initialized');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Creating new game...');

      // Call the game client to create a game
      const result = await gameClient.createGame(betAmount, currencyMode === CurrencyMode.SOL);

      if (result.success) {
        setGameId(result.gameId as string);
        setGameData(result.gameData);
        setCurrentView(GameView.GAME_LOBBY);
      } else {
        setErrorMessage(result.error || 'Failed to create game');
      }
    } catch (error) {
      console.error('Error creating game:', error);
      setErrorMessage('Error creating game');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // Function to join an existing game
  const joinGame = async (gameIdToJoin: string) => {
    if (!gameClient) {
      setErrorMessage('Game client not initialized');
      return;
    }

    try {
      setLoading(true);
      setStatusMessage('Joining game...');

      // Call the game client to join a game
      const result = await gameClient.joinGame(gameIdToJoin);

      if (result.success) {
        setGameId(gameIdToJoin);
        setGameData(result.gameData);
        setCurrentView(GameView.GAME_LOBBY);
      } else {
        setErrorMessage(result.error || 'Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setErrorMessage('Error joining game');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // Additional props needed for the views
  const viewProps = {
    gameClient,
    publicKey,
    connected,
    gameId,
    gameData,
    userChoice,
    salt,
    errorMessage,
    statusMessage,
    loading,
    tokenBalance,
    loadingBalance,
    // Functions
    setCurrentView,
    setGameId,
    setGameData,
    setUserChoice,
    setSalt,
    setErrorMessage,
    setStatusMessage,
    setLoading,
    createGame,
    joinGame,
  };

  // Main rendering logic
  return (
    <div className="app-container">
      {/* Header with wallet connection */}
      <header className="app-header">
        <div className="logo">Solana RPS Game</div>

        <div className="header-actions">
          {/* Sound control */}
          <SoundControl />

          {/* Players online indicator */}
          {connected && (
            <div className="relative">
              <button
                className="flex items-center space-x-1 px-2 py-1 bg-gray-800 bg-opacity-50 rounded hover:bg-opacity-70 transition-colors"
                onClick={() => setShowConnectedPlayers(!showConnectedPlayers)}
              >
                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                <span className="text-xs text-gray-300">Players Online</span>
              </button>

              {showConnectedPlayers && (
                <div className="absolute right-0 mt-1 z-50 w-64">
                  <ConnectionStatus maxDisplayed={5} />
                </div>
              )}
            </div>
          )}

          {/* Token display when wallet is connected */}
          {connected && publicKey && (
            <TokenDisplay
              balance={tokenBalance}
              loading={loadingBalance}
              onClick={() => setIsTokenModalOpen(true)}
            />
          )}

          {/* Wallet connection button */}
          <WalletMultiButton />

          {/* Mobile menu toggle */}
          <button
            className="mobile-menu-toggle"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            ☰
          </button>
        </div>
      </header>

      {/* Navigation menu */}
      <nav className={`app-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <button onClick={() => setCurrentView(GameView.HOME)}>Home</button>
        <button onClick={() => setCurrentView(GameView.CREATE_GAME)}>Create Game</button>
        <button onClick={() => setCurrentView(GameView.JOIN_GAME)}>Join Game</button>
        <button onClick={() => setCurrentView(GameView.AUTO_PLAY)}>Auto Play</button>
        <button onClick={() => setCurrentView(GameView.WELCOME)}>Welcome</button>
        <button onClick={() => setCurrentView(GameView.SECURITY)}>Security</button>
        <button onClick={() => setCurrentView(GameView.TESTING)}>Testing</button>
        <button onClick={() => setCurrentView(GameView.PROFILE)}>Profile</button> {/* New Profile button */}
      </nav>

      {/* Main content */}
      <main className="app-main">
        {/* Render the appropriate view based on currentView */}
        {currentView === GameView.HOME && <HomeView {...viewProps} />}
        {currentView === GameView.CREATE_GAME && <CreateGameView {...viewProps} />}
        {currentView === GameView.JOIN_GAME && <JoinGameView {...viewProps} />}
        {currentView === GameView.GAME_LOBBY && <GameLobbyView {...viewProps} />}
        {currentView === GameView.COMMIT_CHOICE && <CommitChoiceView {...viewProps} />}
        {currentView === GameView.REVEAL_CHOICE && <RevealChoiceView {...viewProps} />}
        {currentView === GameView.GAME_RESULTS && <GameResultsView {...viewProps} />}
        {currentView === GameView.AUTO_PLAY && <AutoPlayView {...viewProps} />}
        {currentView === GameView.WELCOME && <WelcomeView {...viewProps} />}
        {currentView === GameView.SECURITY && <SecurityView {...viewProps} />}
        {currentView === GameView.TESTING && <TestingView />}
        {currentView === GameView.PROFILE && (
          <ProfileView
            publicKey={publicKey}
            connected={connected}
            onBackToHome={() => setCurrentView(GameView.HOME)}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <p>Solana Rock Paper Scissors Game - Built with ♥ for Solana</p>
      </footer>

      {/* Token Modal for managing tokens */}
      {isTokenModalOpen && (
        <TokenModal
          publicKey={publicKey}
          balance={tokenBalance}
          onClose={() => setIsTokenModalOpen(false)}
          onGetFree={async () => {
            if (publicKey && gameClient) {
              const connection = new Connection(endpoint, 'confirmed');
              await getFreeRPSTokens(connection, publicKey);
              const updatedBalance = await getTokenBalances(connection, publicKey);
              setTokenBalance(updatedBalance);
            }
          }}
        />
      )}
    </div>
  );
};

export default App;
