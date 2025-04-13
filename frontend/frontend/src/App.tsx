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
import { Connection, PublicKey } from '@solana/web3.js';
import './App.css';
import { RPSGameClient } from './rps-client';
import { GameView, CurrencyMode, TokenBalance } from './types';
import { BrowserRouter as Router } from 'react-router-dom';

// View imports
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
import TestingView from './views/TestingView';
// Placeholder views for new features - we'll implement these later
const TournamentView: React.FC<any> = () => <div className="placeholder-view">Tournament View Coming Soon</div>;
const LeaderboardView: React.FC<any> = () => <div className="placeholder-view">Leaderboard View Coming Soon</div>;
const ProfileView: React.FC<any> = () => <div className="placeholder-view">Profile View Coming Soon</div>;
const SpectateView: React.FC<any> = () => <div className="placeholder-view">Spectate View Coming Soon</div>;
const AchievementsView: React.FC<any> = () => <div className="placeholder-view">Achievements View Coming Soon</div>;
const SettingsView: React.FC<any> = () => <div className="placeholder-view">Settings View Coming Soon</div>;
const SocialView: React.FC<any> = () => <div className="placeholder-view">Social View Coming Soon</div>;
const NFTGalleryView: React.FC<any> = () => <div className="placeholder-view">NFT Gallery View Coming Soon</div>;

// Import wallet adapter CSS
import '@solana/wallet-adapter-react-ui/styles.css';

// Component imports
import TokenDisplay from './components/TokenDisplay';
import TokenModal from './components/TokenModal';
import SoundControl from './components/SoundControl';
import { DebugTestComponent } from './components/DEBUG_TEST_COMPONENT';
import './DEBUG_TEST_STYLES.css';

// Placeholder components for new features - we'll implement these later
const ThemeToggle = () => <button className="theme-toggle">🌓</button>;
const NotificationCenter = () => <div className="notification-center"></div>;

// Service imports
import { getTokenBalances, getFreeRPSTokens } from './services/token-service';
import audioService from './services/audio-service';

// Context imports
import { ThemeProvider } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { GameProvider } from './contexts/GameContext';

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

// Use a more reliable RPC endpoint
// const endpoint = clusterApiUrl(network); // Default endpoint
const endpoint = 'https://api.devnet.solana.com'; // Direct endpoint

// For better reliability, you could use a custom RPC provider like:
// const endpoint = 'https://solana-devnet.g.alchemy.com/v2/YOUR_API_KEY';
// const endpoint = 'https://devnet.helius.xyz/v0/YOUR_API_KEY';

// Wallet adapters - added more wallet options for better cross-OS support
const wallets = [
  new PhantomWalletAdapter(),
  new SolflareWalletAdapter({ network }),
  new BackpackWalletAdapter(),
  new CoinbaseWalletAdapter(),
  new LedgerWalletAdapter(),
];

// RPS Program ID - a valid base58 public key (replace with your actual deployed program ID)
const RPS_PROGRAM_ID = new PublicKey('RPSzobkNuV1m4Vm3PVcfFKBRSrLjJt9pvU7G1JvXE5C');

const App: React.FC = () => {
  // Initialize audio service when component mounts
  useEffect(() => {
    const initAudio = async () => {
      if (audioService && typeof audioService.initialize === 'function') {
        try {
          await audioService.initialize();
          console.log('Audio service initialized');
        } catch (error) {
          console.error('Failed to initialize audio service:', error);
        }
      }
    };

    initAudio();
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <ConnectionProvider endpoint={endpoint}>
          <WalletProvider wallets={wallets} autoConnect={false}>
            <WalletModalProvider>
              <RPSGame />
            </WalletModalProvider>
          </WalletProvider>
        </ConnectionProvider>
      </ThemeProvider>
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
            {
              publicKey,
              signTransaction,
              sendTransaction
            },
            RPS_PROGRAM_ID
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

      // Call the game client to create a game with proper parameters
      const result = await gameClient.createGame(
        2, // minPlayers
        4, // maxPlayers
        3, // totalRounds
        betAmount, // entryFeeSol
        300, // timeoutSeconds
        true, // losersCanRejoin
        currencyMode // currencyMode
      );

      if (result && result.gameId) {
        setGameId(result.gameId);
        setGameData(result.gameAccount);
        setCurrentView(GameView.GAME_LOBBY);
      } else {
        setErrorMessage('Failed to create game');
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

      if (result) {
        setGameId(gameIdToJoin);
        setGameData(result);
        setCurrentView(GameView.GAME_LOBBY);
      } else {
        setErrorMessage('Failed to join game');
      }
    } catch (error) {
      console.error('Error joining game:', error);
      setErrorMessage('Error joining game');
    } finally {
      setLoading(false);
      setStatusMessage('');
    }
  };

  // Function to handle game started event
  const handleGameStarted = (gameData: any) => {
    setGameData(gameData);
    setCurrentView(GameView.COMMIT_CHOICE);
  };

  // Function to handle leaving a game
  const handleLeaveGame = () => {
    setGameId('');
    setGameData(null);
    setCurrentView(GameView.HOME);
  };

  // Function to handle committing a choice
  const handleCommitChoice = (choice: number) => {
    setUserChoice(choice);
    // In a real implementation, this would call the game client to commit the choice
    setCurrentView(GameView.REVEAL_CHOICE);
  };

  // Function to handle revealing a choice
  const handleRevealChoice = () => {
    // In a real implementation, this would call the game client to reveal the choice
    setCurrentView(GameView.GAME_RESULTS);
  };

  // Function to handle claiming winnings
  const handleClaimWinnings = () => {
    // In a real implementation, this would call the game client to claim winnings
    setCurrentView(GameView.HOME);
  };

  // Function to handle rejoining a game
  const handleRejoinGame = () => {
    // In a real implementation, this would call the game client to rejoin the game
    setCurrentView(GameView.GAME_LOBBY);
  };

  // Function to handle starting a new round
  const handleStartNewRound = () => {
    // In a real implementation, this would call the game client to start a new round
    setCurrentView(GameView.COMMIT_CHOICE);
  };

  // Function to handle going back to home
  const handleBackToHome = () => {
    setCurrentView(GameView.HOME);
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
    // Add missing props for components
    userPublicKey: publicKey?.toString() || '',
    onGameStarted: handleGameStarted,
    onLeaveGame: handleLeaveGame,
    onCommitChoice: handleCommitChoice,
    onRevealChoice: handleRevealChoice,
    onClaimWinnings: handleClaimWinnings,
    onRejoinGame: handleRejoinGame,
    onStartNewRound: handleStartNewRound,
    onBackToHome: handleBackToHome,
    onBack: handleBackToHome,
  };

  // Main rendering logic
  return (
    <UserProvider publicKey={publicKey}>
      <GameProvider publicKey={publicKey} gameClient={gameClient}>
        <div className="app-container">
      {/* Header with wallet connection */}
      <header className="app-header">
        <div className="logo">
          <span className="logo-icon">🎮</span>
          <span className="logo-text">Solana RPS Game</span>
        </div>

        <div className="header-actions">
          {/* Sound control */}
          <SoundControl />

          {/* Theme toggle */}
          <ThemeToggle />

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
            aria-label="Toggle menu"
          >
            ☰
          </button>
        </div>
      </header>

      {/* Navigation menu */}
      <nav className={`app-nav ${isMobileMenuOpen ? 'open' : ''}`}>
        <div className="nav-section">
          <h3 className="nav-title">Play</h3>
          <button
            className={currentView === GameView.HOME ? 'active' : ''}
            onClick={() => setCurrentView(GameView.HOME)}
          >
            <span className="nav-icon">🏠</span> Home
          </button>
          <button
            className={currentView === GameView.CREATE_GAME ? 'active' : ''}
            onClick={() => setCurrentView(GameView.CREATE_GAME)}
          >
            <span className="nav-icon">🎮</span> Create Game
          </button>
          <button
            className={currentView === GameView.JOIN_GAME ? 'active' : ''}
            onClick={() => setCurrentView(GameView.JOIN_GAME)}
          >
            <span className="nav-icon">🎲</span> Join Game
          </button>
          <button
            className={currentView === GameView.AUTO_PLAY ? 'active' : ''}
            onClick={() => setCurrentView(GameView.AUTO_PLAY)}
          >
            <span className="nav-icon">🤖</span> Auto Play
          </button>
          <button
            className={currentView === GameView.SPECTATE ? 'active' : ''}
            onClick={() => setCurrentView(GameView.SPECTATE)}
          >
            <span className="nav-icon">👁️</span> Spectate
          </button>
        </div>

        <div className="nav-section">
          <h3 className="nav-title">Compete</h3>
          <button
            className={currentView === GameView.TOURNAMENT ? 'active' : ''}
            onClick={() => setCurrentView(GameView.TOURNAMENT)}
          >
            <span className="nav-icon">🏆</span> Tournaments
          </button>
          <button
            className={currentView === GameView.LEADERBOARD ? 'active' : ''}
            onClick={() => setCurrentView(GameView.LEADERBOARD)}
          >
            <span className="nav-icon">📊</span> Leaderboard
          </button>
        </div>

        <div className="nav-section">
          <h3 className="nav-title">Personal</h3>
          <button
            className={currentView === GameView.PROFILE ? 'active' : ''}
            onClick={() => setCurrentView(GameView.PROFILE)}
          >
            <span className="nav-icon">👤</span> Profile
          </button>
          <button
            className={currentView === GameView.ACHIEVEMENTS ? 'active' : ''}
            onClick={() => setCurrentView(GameView.ACHIEVEMENTS)}
          >
            <span className="nav-icon">🏅</span> Achievements
          </button>
          <button
            className={currentView === GameView.NFT_GALLERY ? 'active' : ''}
            onClick={() => setCurrentView(GameView.NFT_GALLERY)}
          >
            <span className="nav-icon">🖼️</span> NFT Gallery
          </button>
        </div>

        <div className="nav-section">
          <h3 className="nav-title">Social</h3>
          <button
            className={currentView === GameView.SOCIAL ? 'active' : ''}
            onClick={() => setCurrentView(GameView.SOCIAL)}
          >
            <span className="nav-icon">👥</span> Social Hub
          </button>
        </div>

        <div className="nav-section">
          <h3 className="nav-title">System</h3>
          <button
            className={currentView === GameView.SETTINGS ? 'active' : ''}
            onClick={() => setCurrentView(GameView.SETTINGS)}
          >
            <span className="nav-icon">⚙️</span> Settings
          </button>
          <button
            className={currentView === GameView.SECURITY ? 'active' : ''}
            onClick={() => setCurrentView(GameView.SECURITY)}
          >
            <span className="nav-icon">🔒</span> Security
          </button>
          <button
            className={currentView === GameView.WELCOME ? 'active' : ''}
            onClick={() => setCurrentView(GameView.WELCOME)}
          >
            <span className="nav-icon">👋</span> Welcome
          </button>
          <button
            className={currentView === GameView.TESTING ? 'active' : ''}
            onClick={() => setCurrentView(GameView.TESTING)}
          >
            <span className="nav-icon">🧪</span> Testing
          </button>
        </div>
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
        {currentView === GameView.WELCOME && <WelcomeView />}
        {currentView === GameView.SECURITY && <SecurityView {...viewProps} />}
        {currentView === GameView.TESTING && <TestingView />}
        {currentView === GameView.TOURNAMENT && <TournamentView />}
        {currentView === GameView.LEADERBOARD && <LeaderboardView />}
        {currentView === GameView.PROFILE && <ProfileView />}
        {currentView === GameView.SPECTATE && <SpectateView />}
        {currentView === GameView.ACHIEVEMENTS && <AchievementsView />}
        {currentView === GameView.SETTINGS && <SettingsView />}
        {currentView === GameView.SOCIAL && <SocialView />}
        {currentView === GameView.NFT_GALLERY && <NFTGalleryView />}
      </main>

      {/* Footer */}
      <footer className="app-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4 className="footer-title">Solana RPS Game</h4>
            <p className="footer-tagline">Built with ♥ for Solana</p>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Links</h4>
            <div className="footer-links">
              <a href="#" className="footer-link">Documentation</a>
              <a href="#" className="footer-link">GitHub</a>
              <a href="#" className="footer-link">Discord</a>
            </div>
          </div>

          <div className="footer-section">
            <h4 className="footer-title">Network</h4>
            <div className="network-status">
              <span className="status-indicator online"></span>
              <span className="status-text">Solana {endpoint.includes('devnet') ? 'Devnet' : 'Mainnet'}</span>
            </div>
          </div>
        </div>

        <div className="footer-copyright">
          &copy; {new Date().getFullYear()} Solana RPS Game. All rights reserved.
        </div>
      </footer>

      {/* Notification Center */}
      <NotificationCenter />

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
      </GameProvider>
    </UserProvider>
  );
};

export default App;





