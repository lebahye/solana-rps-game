import React, { useState, useEffect } from 'react';
import { ErrorDetails, TransactionErrorType } from '../services/error-handler-service';

interface ErrorNotificationProps {
  error: ErrorDetails | null;
  onDismiss: () => void;
  autoClose?: boolean;
  duration?: number;
}

const ErrorNotification: React.FC<ErrorNotificationProps> = ({
  error,
  onDismiss,
  autoClose = true,
  duration = 6000, // 6 seconds
}) => {
  const [visible, setVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (error) {
      setVisible(true);
      setIsExiting(false);

      if (autoClose) {
        const timer = setTimeout(() => {
          handleClose();
        }, duration);

        return () => clearTimeout(timer);
      }
    } else {
      setVisible(false);
    }
  }, [error, autoClose, duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 300); // Animation duration
  };

  const getIconByErrorType = (type: TransactionErrorType) => {
    switch (type) {
      case TransactionErrorType.WALLET_NOT_CONNECTED:
        return '🔌';
      case TransactionErrorType.INSUFFICIENT_FUNDS:
        return '💰';
      case TransactionErrorType.USER_REJECTED:
        return '❌';
      case TransactionErrorType.TIMEOUT:
        return '⏱️';
      case TransactionErrorType.BLOCKCHAIN_ERROR:
        return '🔗';
      case TransactionErrorType.GAME_LOGIC_ERROR:
        return '🎮';
      default:
        return '⚠️';
    }
  };

  const getBackgroundColor = (type: TransactionErrorType) => {
    switch (type) {
      case TransactionErrorType.WALLET_NOT_CONNECTED:
        return 'bg-blue-900 border-blue-700';
      case TransactionErrorType.INSUFFICIENT_FUNDS:
        return 'bg-yellow-900 border-yellow-700';
      case TransactionErrorType.USER_REJECTED:
        return 'bg-gray-800 border-gray-700';
      case TransactionErrorType.TIMEOUT:
        return 'bg-purple-900 border-purple-700';
      case TransactionErrorType.GAME_LOGIC_ERROR:
        return 'bg-orange-900 border-orange-700';
      default:
        return 'bg-red-900 border-red-700';
    }
  };

  if (!error || !visible) {
    return null;
  }

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 max-w-md w-full transform transition-all duration-300 ${
        isExiting ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'
      }`}
    >
      <div
        className={`p-4 rounded-lg border shadow-lg ${getBackgroundColor(
          error.type
        )} text-white flex items-start`}
      >
        <div className="text-2xl mr-3">{getIconByErrorType(error.type)}</div>
        <div className="flex-1">
          <h3 className="font-bold mb-1">Transaction Error</h3>
          <p className="text-sm">{error.message}</p>
          {error.suggestedAction && (
            <p className="text-sm mt-1 font-semibold text-white">
              Suggestion: {error.suggestedAction}
            </p>
          )}
        </div>
        <button onClick={handleClose} className="text-white hover:text-gray-200 ml-2">
          ✕
        </button>
      </div>
    </div>
  );
};

export default ErrorNotification;
