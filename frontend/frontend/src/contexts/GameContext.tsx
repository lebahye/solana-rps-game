import React, { createContext, useState, useContext, useEffect } from 'react';
import { 
  Game, 
  Player, 
  Choice, 
  GameVariant, 
  GameOutcome,
  Tournament,
  ChatMessage
} from '../types';
import { PublicKey } from '@solana/web3.js';
import { RPSGameClient } from '../rps-client';
import { v4 as uuidv4 } from 'uuid';

interface GameContextType {
  currentGame: Game | null;
  tournaments: Tournament[];
  gameHistory: Game[];
  chatMessages: ChatMessage[];
  isLoading: boolean;
  determineWinner: (player1Choice: Choice, player2Choice: Choice, gameVariant: GameVariant) => GameOutcome;
  sendChatMessage: (gameId: string, message: string, isSystem?: boolean) => void;
  joinAsSpectator: (gameId: string) => void;
  leaveAsSpectator: (gameId: string) => void;
}

const defaultContext: GameContextType = {
  currentGame: null,
  tournaments: [],
  gameHistory: [],
  chatMessages: [],
  isLoading: false,
  determineWinner: () => 'tie',
  sendChatMessage: () => {},
  joinAsSpectator: () => {},
  leaveAsSpectator: () => {},
};

export const GameContext = createContext<GameContextType>(defaultContext);

export const GameProvider: React.FC<{ 
  children: React.ReactNode;
  publicKey: PublicKey | null;
  gameClient: RPSGameClient | null;
}> = ({ children, publicKey, gameClient }) => {
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [gameHistory, setGameHistory] = useState<Game[]>([]);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // Load game history when wallet connects
  useEffect(() => {
    if (!publicKey) {
      setGameHistory([]);
      return;
    }

    const loadGameHistory = async () => {
      try {
        // In a real implementation, this would fetch from a database or blockchain
        // For now, we'll use localStorage as a mock
        const savedHistory = localStorage.getItem(`rps-game-history-${publicKey.toString()}`);
        if (savedHistory) {
          setGameHistory(JSON.parse(savedHistory));
        }
      } catch (error) {
        console.error('Error loading game history:', error);
      }
    };

    loadGameHistory();
  }, [publicKey]);

  // Determine winner based on choices and game variant
  const determineWinner = (
    player1Choice: Choice, 
    player2Choice: Choice,
    gameVariant: GameVariant = GameVariant.CLASSIC
  ): GameOutcome => {
    // If either player didn't make a choice, it's a tie
    if (player1Choice === Choice.None || player2Choice === Choice.None) {
      return 'tie';
    }

    // If both players made the same choice, it's a tie
    if (player1Choice === player2Choice) {
      return 'tie';
    }

    // Classic Rock-Paper-Scissors logic
    if (gameVariant === GameVariant.CLASSIC) {
      // Rock beats Scissors
      if (player1Choice === Choice.Rock && player2Choice === Choice.Scissors) {
        return 'win';
      }
      // Paper beats Rock
      if (player1Choice === Choice.Paper && player2Choice === Choice.Rock) {
        return 'win';
      }
      // Scissors beats Paper
      if (player1Choice === Choice.Scissors && player2Choice === Choice.Paper) {
        return 'win';
      }
      return 'loss';
    }
    
    // Extended Rock-Paper-Scissors-Lizard-Spock logic
    if (gameVariant === GameVariant.EXTENDED) {
      // Rock beats Scissors and Lizard
      if (player1Choice === Choice.Rock && 
          (player2Choice === Choice.Scissors || player2Choice === Choice.Lizard)) {
        return 'win';
      }
      // Paper beats Rock and Spock
      if (player1Choice === Choice.Paper && 
          (player2Choice === Choice.Rock || player2Choice === Choice.Spock)) {
        return 'win';
      }
      // Scissors beats Paper and Lizard
      if (player1Choice === Choice.Scissors && 
          (player2Choice === Choice.Paper || player2Choice === Choice.Lizard)) {
        return 'win';
      }
      // Lizard beats Paper and Spock
      if (player1Choice === Choice.Lizard && 
          (player2Choice === Choice.Paper || player2Choice === Choice.Spock)) {
        return 'win';
      }
      // Spock beats Rock and Scissors
      if (player1Choice === Choice.Spock && 
          (player2Choice === Choice.Rock || player2Choice === Choice.Scissors)) {
        return 'win';
      }
      return 'loss';
    }
    
    // Default to classic rules for other variants
    return determineWinner(player1Choice, player2Choice, GameVariant.CLASSIC);
  };

  // Send chat message
  const sendChatMessage = (gameId: string, message: string, isSystem: boolean = false) => {
    if (!publicKey) return;
    
    const newMessage: ChatMessage = {
      id: uuidv4(),
      gameId,
      sender: publicKey.toString(),
      senderDisplayName: 'Player', // In a real app, get this from profile
      message,
      timestamp: Date.now(),
      isSystemMessage: isSystem,
    };
    
    setChatMessages(prev => [...prev, newMessage]);
    
    // In a real implementation, this would be sent to a server or blockchain
  };

  // Join as spectator
  const joinAsSpectator = (gameId: string) => {
    if (!publicKey || !gameClient) return;
    
    // In a real implementation, this would update the game on the blockchain
    // For now, we'll just update the local state
    if (currentGame && currentGame.spectators) {
      const updatedGame = {
        ...currentGame,
        spectators: [...currentGame.spectators, publicKey.toString()],
      };
      setCurrentGame(updatedGame);
    }
  };

  // Leave as spectator
  const leaveAsSpectator = (gameId: string) => {
    if (!publicKey || !gameClient) return;
    
    // In a real implementation, this would update the game on the blockchain
    // For now, we'll just update the local state
    if (currentGame && currentGame.spectators) {
      const updatedGame = {
        ...currentGame,
        spectators: currentGame.spectators.filter(s => s !== publicKey.toString()),
      };
      setCurrentGame(updatedGame);
    }
  };

  return (
    <GameContext.Provider
      value={{
        currentGame,
        tournaments,
        gameHistory,
        chatMessages,
        isLoading,
        determineWinner,
        sendChatMessage,
        joinAsSpectator,
        leaveAsSpectator,
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

// Custom hook for using game context
export const useGame = () => useContext(GameContext);
