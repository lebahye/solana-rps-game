import React, { useEffect, useState } from 'react';
import { GameOutcome } from '../types';
import audioService from '../services/audio-service';

interface GameResultAnimationProps {
  outcome: GameOutcome | null;
  playerChoice: number | null;
  opponentChoice: number | null;
  onAnimationComplete?: () => void;
  size?: 'small' | 'medium' | 'large';
}

const GameResultAnimation: React.FC<GameResultAnimationProps> = ({
  outcome,
  playerChoice,
  opponentChoice,
  onAnimationComplete,
  size = 'medium'
}) => {
  const [animationStage, setAnimationStage] = useState<'start' | 'reveal' | 'result' | 'complete'>('start');
  const [isExiting, setIsExiting] = useState(false);

  // Sizing based on the size prop
  const getSize = () => {
    switch (size) {
      case 'small': return 'w-40 h-40';
      case 'large': return 'w-96 h-96';
      default: return 'w-64 h-64';
    }
  };

  // Get choice emoji
  const getChoiceEmoji = (choice: number | null) => {
    if (choice === null) return '❓';
    switch (choice) {
      case 1: return '👊'; // Rock
      case 2: return '✋'; // Paper
      case 3: return '✌️'; // Scissors
      default: return '❓';
    }
  };

  // Get outcome text and styling
  const getOutcomeStyles = () => {
    if (!outcome) return { text: '', className: '' };

    switch (outcome) {
      case 'win':
        return {
          text: 'YOU WIN!',
          className: 'text-green-400 font-bold',
          emoji: '🏆'
        };
      case 'loss':
        return {
          text: 'YOU LOSE',
          className: 'text-red-400 font-bold',
          emoji: '😢'
        };
      case 'tie':
        return {
          text: 'TIE GAME',
          className: 'text-yellow-400 font-bold',
          emoji: '🤝'
        };
      default:
        return { text: '', className: '', emoji: '' };
    }
  };

  // Run the animation sequence
  useEffect(() => {
    if (outcome === null || playerChoice === null || opponentChoice === null) {
      return;
    }

    // Animation timing
    const startDelay = 500;
    const revealDelay = 1500;
    const resultDelay = 1000;
    const completeDelay = 2000;

    setAnimationStage('start');
    setIsExiting(false);

    // Play reveal sound after start delay
    const startTimer = setTimeout(() => {
      audioService.play('reveal');
      setAnimationStage('reveal');
    }, startDelay);

    // Play outcome sound after reveal
    const revealTimer = setTimeout(() => {
      if (outcome === 'win') {
        audioService.play('win');
      } else if (outcome === 'loss') {
        audioService.play('lose');
      } else {
        audioService.play('tie');
      }
      setAnimationStage('result');
    }, startDelay + revealDelay);

    // End animation after result shown
    const resultTimer = setTimeout(() => {
      setAnimationStage('complete');
    }, startDelay + revealDelay + resultDelay);

    // Exit animation when complete
    const completeTimer = setTimeout(() => {
      setIsExiting(true);
      if (onAnimationComplete) {
        setTimeout(onAnimationComplete, 300); // Allow exit animation to complete
      }
    }, startDelay + revealDelay + resultDelay + completeDelay);

    // Clean up timers
    return () => {
      clearTimeout(startTimer);
      clearTimeout(revealTimer);
      clearTimeout(resultTimer);
      clearTimeout(completeTimer);
    };
  }, [outcome, playerChoice, opponentChoice, onAnimationComplete]);

  if (outcome === null || playerChoice === null || opponentChoice === null) {
    return null;
  }

  const { text, className, emoji } = getOutcomeStyles();

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-50 bg-black bg-opacity-70 transition-opacity duration-300 ${
        isExiting ? 'opacity-0' : 'opacity-100'
      }`}
    >
      <div
        className={`bg-gray-800 rounded-xl p-8 flex flex-col items-center justify-center ${getSize()}
          shadow-2xl border-2 ${
            outcome === 'win'
              ? 'border-green-500'
              : outcome === 'loss'
                ? 'border-red-500'
                : 'border-yellow-500'
          } transform transition-all duration-500 ${
            animationStage === 'start'
              ? 'scale-0'
              : 'scale-100'
          }`}
      >
        {/* VS Animation */}
        <div className="flex items-center justify-around w-full mb-8">
          <div className={`text-5xl transform transition-all duration-500 ${
            animationStage === 'start' ? 'translate-x-20 opacity-0' : 'translate-x-0 opacity-100'
          }`}>
            {getChoiceEmoji(playerChoice)}
          </div>

          <div className={`text-2xl font-bold transition-all duration-300 ${
            animationStage === 'start' ? 'opacity-0 scale-150' : 'opacity-100 scale-100'
          }`}>
            VS
          </div>

          <div className={`text-5xl transform transition-all duration-500 ${
            animationStage === 'start' ? '-translate-x-20 opacity-0' : 'translate-x-0 opacity-100'
          }`}>
            {getChoiceEmoji(opponentChoice)}
          </div>
        </div>

        {/* Result Animation */}
        <div className={`text-center transform transition-all duration-500 ${
          animationStage === 'result' || animationStage === 'complete'
            ? 'opacity-100 scale-100'
            : 'opacity-0 scale-50'
        }`}>
          <div className="text-6xl mb-4">{emoji}</div>
          <div className={`text-3xl ${className}`}>{text}</div>
        </div>
      </div>
    </div>
  );
};

export default GameResultAnimation;
