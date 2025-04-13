import React, { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { abbreviateAddress } from '../utils/utils';

// Mock data for initial development - will be replaced with real data
const mockPlayers = [
  { address: '8xMUCJ9AvGGh5Yk4EiXEMcCf7yWbUGrKcCzJQJQgbsLE', status: 'available', lastSeen: new Date() },
  { address: '5xNyA9WRzKVBrFGC9h8NxdGVqaNBJH1kVPiXXpEa7P9t', status: 'in-game', lastSeen: new Date() },
  { address: 'FbGeZS8LiPCZiFpYAY7fQpBYY5EvUy6xbGvAaATT5emc', status: 'auto-play', lastSeen: new Date() },
  { address: 'CsQ4YZXBptAf9DUXVgiAENsYfuH2SFSeEmjVXLyB9X9H', status: 'available', lastSeen: new Date() },
];

interface Player {
  address: string;
  status: 'available' | 'in-game' | 'auto-play';
  lastSeen: Date;
}

interface ConnectionStatusProps {
  maxDisplayed?: number;
  showCollapseButton?: boolean;
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({
  maxDisplayed = 5,
  showCollapseButton = true,
  className = '',
}) => {
  const { publicKey } = useWallet();
  const [onlinePlayers, setOnlinePlayers] = useState<Player[]>(mockPlayers);
  const [expanded, setExpanded] = useState(false);

  // In the future, this will be replaced with real-time data from the blockchain
  useEffect(() => {
    // Mock implementation - will be replaced with subscription to player status
    const interval = setInterval(() => {
      // This simulates getting updated player data
      const updatedPlayers = [...mockPlayers];
      if (Math.random() > 0.7) {
        const randomStatus = Math.random() > 0.5 ? 'in-game' : 'auto-play';
        const randomIndex = Math.floor(Math.random() * updatedPlayers.length);
        updatedPlayers[randomIndex] = {
          ...updatedPlayers[randomIndex],
          status: randomStatus as 'in-game' | 'auto-play',
          lastSeen: new Date()
        };
      }
      setOnlinePlayers(updatedPlayers);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const displayedPlayers = expanded ? onlinePlayers : onlinePlayers.slice(0, maxDisplayed);
  const hasMore = onlinePlayers.length > maxDisplayed;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'text-green-400';
      case 'in-game': return 'text-orange-400';
      case 'auto-play': return 'text-blue-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`connection-status bg-gray-800 bg-opacity-50 rounded-lg p-3 ${className}`}>
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-sm font-semibold text-purple-300">
          Players Online: {onlinePlayers.length}
        </h3>
        {showCollapseButton && hasMore && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-xs text-blue-300 hover:text-blue-200"
          >
            {expanded ? 'Show Less' : 'Show All'}
          </button>
        )}
      </div>

      <div className="player-list">
        {displayedPlayers.map((player) => (
          <div
            key={player.address}
            className={`player-item flex justify-between items-center p-1 rounded ${
              publicKey?.toBase58() === player.address ? 'bg-purple-900 bg-opacity-30' : ''
            }`}
          >
            <div className="flex items-center">
              <span className={`status-dot h-2 w-2 rounded-full mr-2 ${getStatusColor(player.status)}`}></span>
              <span className="text-xs">{abbreviateAddress(player.address)}</span>
            </div>
            <span className={`text-xs ${getStatusColor(player.status)}`}>
              {player.status === 'available' ? 'Available' :
               player.status === 'in-game' ? 'In Game' : 'Auto Play'}
            </span>
          </div>
        ))}
      </div>

      {!expanded && hasMore && (
        <div className="text-center text-xs text-gray-400 mt-1">
          +{onlinePlayers.length - maxDisplayed} more players
        </div>
      )}
    </div>
  );
};

export default ConnectionStatus;
