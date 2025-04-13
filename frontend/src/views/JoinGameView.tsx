import type React from 'react';
import { useState, useEffect } from 'react';
import { GameView, CurrencyMode } from '../types';
import ConnectionStatus from '../components/ConnectionStatus';
import { abbreviateAddress } from '../utils/utils';
import audioService from '../services/audio-service';

// Mock data for initial development - will be replaced with blockchain data
const mockAvailableGames = [
  {
    id: '8xMUCJ9AvGGh5Yk4EiXEMcCf7yWbUGrKcCzJQJQgbsLE',
    host: '5xNyA9WRzKVBrFGC9h8NxdGVqaNBJH1kVPiXXpEa7P9t',
    entryFee: 0.01,
    currencyMode: CurrencyMode.SOL,
    playerCount: 2,
    maxPlayers: 4,
    created: new Date().getTime() - 120000, // 2 minutes ago
  },
  {
    id: 'FbGeZS8LiPCZiFpYAY7fQpBYY5EvUy6xbGvAaATT5emc',
    host: 'CsQ4YZXBptAf9DUXVgiAENsYfuH2SFSeEmjVXLyB9X9H',
    entryFee: 0.05,
    currencyMode: CurrencyMode.SOL,
    playerCount: 1,
    maxPlayers: 3,
    created: new Date().getTime() - 60000, // 1 minute ago
  },
  {
    id: 'D35a2Lpm5zvVwsFqS3gQWPrJ7YXkFCvQsgmRb9YUQ4y6',
    host: '5xNyA9WRzKVBrFGC9h8NxdGVqaNBJH1kVPiXXpEa7P9t',
    entryFee: 10,
    currencyMode: CurrencyMode.RPSTOKEN,
    playerCount: 2,
    maxPlayers: 4,
    created: new Date().getTime() - 30000, // 30 seconds ago
  },
];

interface Game {
  id: string;
  host: string;
  entryFee: number;
  currencyMode: CurrencyMode;
  playerCount: number;
  maxPlayers: number;
  created: number;
}

interface JoinGameViewProps {
  setCurrentView: (view: GameView) => void;
  gameClient: any;
  joinGame: (gameIdToJoin: string) => Promise<void>;
  loading: boolean;
  [key: string]: any; // Accept additional props
}

const JoinGameView: React.FC<JoinGameViewProps> = ({
  setCurrentView,
  gameClient,
  joinGame,
  loading = false,
}) => {
  const [gameId, setGameId] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [availableGames, setAvailableGames] = useState<Game[]>([]);
  const [isLoadingGames, setIsLoadingGames] = useState(true);
  const [filterCurrency, setFilterCurrency] = useState<string>('all');

  // Load available games
  useEffect(() => {
    // This would be replaced with actual blockchain data in production
    const fetchGames = async () => {
      setIsLoadingGames(true);
      try {
        // Simulate API call delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setAvailableGames(mockAvailableGames);
      } catch (error) {
        console.error("Failed to fetch available games:", error);
      } finally {
        setIsLoadingGames(false);
      }
    };

    fetchGames();

    // In production, we would set up a subscription to game updates here
    const interval = setInterval(() => {
      // Simulate new games being created
      if (Math.random() > 0.7) {
        const newGame = {
          id: Math.random().toString(36).substring(2, 15),
          host: mockAvailableGames[Math.floor(Math.random() * mockAvailableGames.length)].host,
          entryFee: Math.random() * 0.1,
          currencyMode: Math.random() > 0.5 ? CurrencyMode.SOL : CurrencyMode.RPSTOKEN,
          playerCount: Math.floor(Math.random() * 3) + 1,
          maxPlayers: 4,
          created: new Date().getTime(),
        };
        setAvailableGames(prev => [newGame, ...prev.slice(0, 4)]);
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const handleBack = () => {
    setCurrentView(GameView.HOME);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gameId.trim() || !gameClient) {
      alert("Please enter a game ID and make sure your wallet is connected");
      return;
    }

    setIsSubmitting(true);
    try {
      await joinGame(gameId.trim());
    } catch (error: any) {
      console.error("Failed to join game:", error);
      alert(`Failed to join game: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoinClick = async (gameIdToJoin: string) => {
    setGameId(gameIdToJoin);
    audioService.play('click');

    setIsSubmitting(true);
    try {
      await joinGame(gameIdToJoin);
    } catch (error: any) {
      console.error("Failed to join game:", error);
      alert(`Failed to join game: ${error.message || 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time difference
  const getTimeAgo = (timestamp: number): string => {
    const seconds = Math.floor((new Date().getTime() - timestamp) / 1000);

    if (seconds < 60) return `${seconds} seconds ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minutes ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hours ago`;
    return `${Math.floor(seconds / 86400)} days ago`;
  };

  // Format currency
  const formatCurrency = (amount: number, mode: CurrencyMode): string => {
    if (mode === CurrencyMode.SOL) {
      return `${amount.toFixed(4)} SOL`;
    } else {
      return `${amount.toFixed(0)} RPS`;
    }
  };

  // Filter games based on currency selection
  const filteredGames = availableGames.filter(game => {
    if (filterCurrency === 'all') return true;
    if (filterCurrency === 'sol') return game.currencyMode === CurrencyMode.SOL;
    if (filterCurrency === 'rps') return game.currencyMode === CurrencyMode.RPSTOKEN;
    return true;
  });

  // Combined loading state from props and local state
  const isLoading = loading || isSubmitting;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Available Games Section */}
      <div className="card mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold">Available Games</h2>
          <div className="flex items-center space-x-2">
            <select
              className="bg-gray-700 text-white px-2 py-1 rounded text-sm"
              value={filterCurrency}
              onChange={(e) => setFilterCurrency(e.target.value)}
            >
              <option value="all">All Currencies</option>
              <option value="sol">SOL Only</option>
              <option value="rps">RPS Only</option>
            </select>
            <button
              onClick={() => setAvailableGames([...availableGames])}
              className="text-purple-400 hover:text-purple-300"
              title="Refresh Games"
            >
              🔄
            </button>
          </div>
        </div>

        <ConnectionStatus maxDisplayed={3} className="mb-4" />

        {isLoadingGames ? (
          <div className="flex justify-center items-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-purple-500"></div>
          </div>
        ) : filteredGames.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-6 text-center">
            <p className="text-gray-400">No games available at the moment</p>
            <p className="text-sm text-gray-500 mt-2">Try creating your own game or check back later</p>
          </div>
        ) : (
          <div className="space-y-3 mb-4">
            {filteredGames.map((game) => (
              <div key={game.id} className="bg-gray-800 rounded-lg p-4 hover:bg-gray-700 transition-colors">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center">
                    <div className="mr-3">
                      {game.currencyMode === CurrencyMode.SOL ? (
                        <span className="w-8 h-8 bg-yellow-500 rounded-full flex items-center justify-center text-sm text-black">SOL</span>
                      ) : (
                        <span className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center text-sm text-black">RPS</span>
                      )}
                    </div>
                    <div>
                      <p className="font-semibold">
                        {formatCurrency(game.entryFee, game.currencyMode)} Game
                      </p>
                      <p className="text-xs text-gray-400">
                        Host: {abbreviateAddress(game.host)}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center mb-1">
                      <div className="w-20 h-2 bg-gray-700 rounded-full mr-2">
                        <div
                          className="h-2 bg-purple-500 rounded-full"
                          style={{ width: `${(game.playerCount / game.maxPlayers) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-xs text-gray-300">
                        {game.playerCount}/{game.maxPlayers}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{getTimeAgo(game.created)}</p>
                  </div>
                </div>
                <div className="flex justify-between items-center mt-3">
                  <span className="text-xs text-gray-400">ID: {abbreviateAddress(game.id)}</span>
                  <button
                    onClick={() => handleJoinClick(game.id)}
                    className="px-4 py-1 bg-purple-600 hover:bg-purple-700 rounded text-sm font-medium transition-colors"
                    disabled={isLoading}
                  >
                    Join Game
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredGames.length > 0 && (
          <div className="text-center mt-4">
            <button className="text-purple-400 hover:text-purple-300 text-sm">
              View More Games
            </button>
          </div>
        )}
      </div>

      {/* Manual Join Game Form */}
      <div className="card">
        <h2 className="text-2xl font-bold mb-6">Join Game by ID</h2>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Game ID</label>
            <input
              type="text"
              className="form-control"
              value={gameId}
              onChange={(e) => setGameId(e.target.value)}
              placeholder="Enter game ID"
              required
              disabled={isLoading}
            />
            <p className="text-xs text-gray-400 mt-1">
              Enter the ID of the game you want to join
            </p>
          </div>

          <div className="mt-6 p-4 bg-gray-800 rounded-lg">
            <h3 className="text-lg font-semibold mb-2 text-purple-300">Security Features</h3>
            <ul className="text-sm text-gray-300 space-y-2">
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Anti-fraud protection verifies all game transactions</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Secure socket connection with 256-bit encryption</span>
              </li>
              <li className="flex items-start">
                <span className="text-green-400 mr-2">✓</span>
                <span>Load balancing across multiple regions ensures low latency</span>
              </li>
            </ul>
          </div>

          <div className="mt-8 bg-purple-900 bg-opacity-50 p-4 rounded-lg mb-8">
            <h3 className="text-lg font-semibold mb-2">Important Note</h3>
            <p className="text-gray-300 text-sm">
              By joining a game, you agree to pay the entry fee specified by the game creator.
              Make sure you have enough SOL in your wallet to cover the entry fee.
            </p>
          </div>

          <div className="flex justify-between">
            <button
              type="button"
              onClick={handleBack}
              className="btn btn-gray"
              disabled={isLoading}
            >
              Back
            </button>

            <button
              type="submit"
              className="btn btn-secondary"
              disabled={isLoading || !gameId.trim()}
            >
              {isLoading ? 'Joining Game...' : 'Join Game'}
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 card">
        <h3 className="text-lg font-semibold mb-4">How to Join a Game</h3>
        <ol className="list-decimal list-inside space-y-2 text-gray-300">
          <li>Browse the available games above or get a game ID from a friend</li>
          <li>Click "Join Game" on a listed game or enter the game ID manually</li>
          <li>Confirm the transaction in your wallet to pay the entry fee</li>
          <li>Wait for other players to join (games start automatically when full)</li>
          <li>Play and win tokens on the Solana blockchain!</li>
        </ol>
      </div>
    </div>
  );
};

export default JoinGameView;
