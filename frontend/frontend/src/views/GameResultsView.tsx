import type React from 'react';
import { type Game, GameState, Choice } from '../types';

interface GameResultsViewProps {
  gameData: Game;
  userPublicKey: string;
  onClaimWinnings: () => void;
  onRejoinGame: () => void;
  onStartNewRound: () => void;
  onBackToHome: () => void;
  loading: boolean;
}

const GameResultsView: React.FC<GameResultsViewProps> = ({
  gameData,
  userPublicKey,
  onClaimWinnings,
  onRejoinGame,
  onStartNewRound,
  onBackToHome,
  loading
}) => {
  // Format SOL amounts for display
  const formatSol = (lamports: number) => {
    return (lamports / 1000000000).toFixed(2);
  };

  // Get player info
  const currentPlayer = gameData.players.find(
    player => player.pubkey === userPublicKey
  );

  // Determine winners (players with highest score)
  const highestScore = Math.max(...gameData.players.map(p => p.score));
  const winners = gameData.players.filter(p => p.score === highestScore);
  const isWinner = currentPlayer?.score === highestScore;

  // Check if this is the last round or if there are more rounds
  const isLastRound = gameData.currentRound >= gameData.totalRounds;

  // Check if player can claim winnings
  const canClaim = isWinner && isLastRound;

  // Check if player can rejoin (is a loser and losers can rejoin)
  const canRejoin = !isWinner && gameData.losersCanRejoin && isLastRound;

  // Check if game can continue to next round
  const canContinue = !isLastRound && gameData.state === GameState.Finished;

  // Get choice emoji
  const getChoiceEmoji = (choice: number) => {
    switch (choice) {
      case Choice.Rock:
        return '👊';
      case Choice.Paper:
        return '✋';
      case Choice.Scissors:
        return '✌️';
      default:
        return '❓';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold mb-2">Game Results</h2>

          <div className="winner-banner">
            <div className="text-6xl mb-2">
              {isWinner ? '🏆' : '🎮'}
            </div>
            <h3 className="winner-text text-3xl mb-2">
              {isWinner
                ? winners.length > 1
                  ? 'You Tied for First Place!'
                  : 'You Won!'
                : 'You Lost!'}
            </h3>
            <p className="text-gray-300">
              {isLastRound
                ? 'Final Results'
                : `Round ${gameData.currentRound} of ${gameData.totalRounds}`}
            </p>

            {isLastRound && (
              <p className="mt-2 text-xl">
                Prize Pool: {formatSol(gameData.gamePot)} SOL
              </p>
            )}
          </div>
        </div>

        <div className="mb-8">
          <h3 className="text-lg font-semibold mb-3">Player Results</h3>

          {/* Header */}
          <div className="grid grid-cols-8 gap-2 bg-gray-800 p-3 rounded-t-lg font-medium">
            <div className="col-span-3">Player</div>
            <div className="col-span-2 text-center">Choice</div>
            <div className="col-span-1 text-center">Wins</div>
            <div className="col-span-2 text-center">Score</div>
          </div>

          {/* Players */}
          {gameData.players
            .slice()
            .sort((a, b) => b.score - a.score)
            .map((player, index) => (
              <div
                key={index}
                className={`grid grid-cols-8 gap-2 p-3 ${
                  index % 2 === 0 ? 'bg-gray-700' : 'bg-gray-700 bg-opacity-50'
                } ${player.score === highestScore ? 'border-l-4 border-yellow-400' : ''}`}
              >
                <div className="col-span-3 flex items-center">
                  <span className="text-xl mr-2">
                    {player.pubkey === userPublicKey ? '👤' : '👥'}
                  </span>
                  <span>
                    {`Player ${index + 1}`}
                    {player.pubkey === userPublicKey && ' (You)'}
                  </span>
                </div>
                <div className="col-span-2 text-center text-2xl">
                  {getChoiceEmoji(player.choice)}
                </div>
                <div className="col-span-1 text-center">
                  {player.score}
                </div>
                <div
                  className={`col-span-2 text-center font-bold ${
                    player.score === highestScore ? 'text-yellow-400' : ''
                  }`}
                >
                  {player.score === highestScore
                    ? winners.length > 1 ? 'Tied for 1st' : 'Winner'
                    : ''}
                </div>
              </div>
            ))}
        </div>

        <div className="flex flex-col space-y-3">
          {canClaim && (
            <button
              onClick={onClaimWinnings}
              className={`px-6 py-3 rounded-lg font-bold ${
                !loading
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Claim Winnings'}
            </button>
          )}

          {canRejoin && (
            <button
              onClick={onRejoinGame}
              className={`px-6 py-3 rounded-lg font-bold ${
                !loading
                  ? 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Rejoin Game (Pay Entry Fee)'}
            </button>
          )}

          {canContinue && (
            <button
              onClick={onStartNewRound}
              className={`px-6 py-3 rounded-lg font-bold ${
                !loading
                  ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                  : 'bg-gray-600 cursor-not-allowed opacity-50'
              }`}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Continue to Next Round'}
            </button>
          )}

          <button
            onClick={onBackToHome}
            className="px-6 py-3 bg-gray-700 rounded-lg hover:bg-gray-600 font-medium"
            disabled={loading}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default GameResultsView;
