import React, { useEffect, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';

interface Player {
  wallet: PublicKey;
  status: 'available' | 'in-game' | 'auto-play';
  lastSeen: number;
}

interface ConnectionStatusProps {
  maxDisplayPlayers?: number;
  showDropdown?: boolean;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  maxDisplayPlayers = 5,
  showDropdown = true,
}) => {
  const { connected, publicKey } = useWallet();
  const [players, setPlayers] = useState<Player[]>([]);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // TODO: Replace with actual player tracking logic
    // This is temporary mock data for testing
    if (connected && publicKey) {
      setPlayers([
        {
          wallet: publicKey,
          status: 'available',
          lastSeen: Date.now(),
        },
      ]);
    }
  }, [connected, publicKey]);

  const visiblePlayers = isExpanded ? players : players.slice(0, maxDisplayPlayers);
  const hasMorePlayers = players.length > maxDisplayPlayers;

  return (
    <div className="connection-status bg-gray-800 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-semibold text-white">
          Players Online: {players.length}
        </h3>
        {showDropdown && hasMorePlayers && (
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-blue-400 hover:text-blue-300"
          >
            {isExpanded ? 'Show Less' : 'Show More'}
          </button>
        )}
      </div>
      <div className="space-y-2">
        {visiblePlayers.map((player) => (
          <div
            key={player.wallet.toString()}
            className="flex items-center justify-between bg-gray-700 p-2 rounded"
          >
            <div className="flex items-center">
              <div
                className={`w-2 h-2 rounded-full mr-2 ${
                  player.status === 'available'
                    ? 'bg-green-500'
                    : player.status === 'in-game'
                    ? 'bg-yellow-500'
                    : 'bg-blue-500'
                }`}
              />
              <span className="text-white font-mono text-sm">
                {player.wallet.toString().slice(0, 4)}...
                {player.wallet.toString().slice(-4)}
              </span>
            </div>
            <span
              className={`text-sm ${
                player.status === 'available'
                  ? 'text-green-400'
                  : player.status === 'in-game'
                  ? 'text-yellow-400'
                  : 'text-blue-400'
              }`}
            >
              {player.status.replace('-', ' ')}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};