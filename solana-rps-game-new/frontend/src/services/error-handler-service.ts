// Error handling service
import { PublicKey } from '@solana/web3.js';
import audioService from './audio-service';

// Transaction error types
export enum TransactionErrorType {
  WALLET_NOT_CONNECTED = 'WALLET_NOT_CONNECTED',
  INSUFFICIENT_FUNDS = 'INSUFFICIENT_FUNDS',
  USER_REJECTED = 'USER_REJECTED',
  TIMEOUT = 'TIMEOUT',
  BLOCKCHAIN_ERROR = 'BLOCKCHAIN_ERROR',
  GAME_LOGIC_ERROR = 'GAME_LOGIC_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

// Interface for error details
export interface ErrorDetails {
  type: TransactionErrorType;
  message: string;
  originalError?: any;
  walletAddress?: string;
  transactionId?: string;
  timestamp: number;
  gameId?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

// Error history for tracking purposes
interface ErrorHistoryItem extends ErrorDetails {
  id: string;
  resolved: boolean;
}

class ErrorHandlerService {
  private errorHistory: ErrorHistoryItem[] = [];
  private readonly MAX_HISTORY_SIZE = 50;
  private readonly STORAGE_KEY = 'solana-rps-error-history';

  constructor() {
    // Load error history from storage
    this.loadErrorHistory();
  }

  // Handle Solana transaction errors
  public handleTransactionError(error: any, contextData?: {
    walletAddress?: string | PublicKey;
    gameId?: string;
    operation?: string;
  }): ErrorDetails {
    console.error('Transaction error:', error);

    const walletAddress = typeof contextData?.walletAddress === 'object'
      ? (contextData.walletAddress as PublicKey).toString()
      : contextData?.walletAddress;

    // Parse error message to determine type
    let errorType = TransactionErrorType.UNKNOWN_ERROR;
    let errorMessage = 'An unknown error occurred while processing your transaction.';
    let recoverable = true;
    let suggestedAction = 'Please try again.';

    const errorString = JSON.stringify(error).toLowerCase();

    // Detect error types based on common patterns
    if (!error) {
      errorType = TransactionErrorType.UNKNOWN_ERROR;
      errorMessage = 'Transaction failed with no error information.';
    } else if (errorString.includes('wallet not connected') || errorString.includes('no wallet')) {
      errorType = TransactionErrorType.WALLET_NOT_CONNECTED;
      errorMessage = 'Your wallet is not connected. Please connect your wallet and try again.';
      recoverable = true;
      suggestedAction = 'Connect your wallet';
    } else if (errorString.includes('insufficient') || errorString.includes('balance') || errorString.includes('0x1')) {
      errorType = TransactionErrorType.INSUFFICIENT_FUNDS;
      errorMessage = 'You have insufficient funds for this transaction.';
      recoverable = true;
      suggestedAction = 'Add funds to your wallet';
    } else if (errorString.includes('reject') || errorString.includes('denied') || errorString.includes('user cancel')) {
      errorType = TransactionErrorType.USER_REJECTED;
      errorMessage = 'You rejected the transaction.';
      recoverable = true;
      suggestedAction = 'Approve the transaction in your wallet';
    } else if (errorString.includes('timeout')) {
      errorType = TransactionErrorType.TIMEOUT;
      errorMessage = 'The transaction timed out. The network may be congested.';
      recoverable = true;
      suggestedAction = 'Try again later';
    } else if (errorString.includes('already in use') || errorString.includes('already exists')) {
      errorType = TransactionErrorType.GAME_LOGIC_ERROR;
      errorMessage = 'This game ID is already in use. Please try another ID.';
      recoverable = true;
      suggestedAction = 'Try a different game ID';
    }

    // Play error sound
    audioService.play('error');

    // Create error details
    const errorDetails: ErrorDetails = {
      type: errorType,
      message: errorMessage,
      originalError: error,
      walletAddress,
      timestamp: Date.now(),
      gameId: contextData?.gameId,
      recoverable,
      suggestedAction,
    };

    // Add to history
    this.addToErrorHistory(errorDetails);

    // Return error details for immediate handling
    return errorDetails;
  }

  // Format user-friendly error message
  public formatErrorMessage(errorDetails: ErrorDetails): string {
    let message = errorDetails.message;

    if (errorDetails.suggestedAction) {
      message += ` ${errorDetails.suggestedAction}`;
    }

    return message;
  }

  // Add error to history
  private addToErrorHistory(errorDetails: ErrorDetails): void {
    const historyItem: ErrorHistoryItem = {
      ...errorDetails,
      id: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      resolved: false,
    };

    this.errorHistory.unshift(historyItem);

    // Limit history size
    if (this.errorHistory.length > this.MAX_HISTORY_SIZE) {
      this.errorHistory = this.errorHistory.slice(0, this.MAX_HISTORY_SIZE);
    }

    // Save to storage
    this.saveErrorHistory();
  }

  // Mark error as resolved
  public resolveError(errorId: string): void {
    const errorIndex = this.errorHistory.findIndex(err => err.id === errorId);

    if (errorIndex >= 0) {
      this.errorHistory[errorIndex].resolved = true;
      this.saveErrorHistory();
    }
  }

  // Get error history
  public getErrorHistory(includeResolved: boolean = false): ErrorHistoryItem[] {
    return includeResolved
      ? this.errorHistory
      : this.errorHistory.filter(err => !err.resolved);
  }

  // Clear error history
  public clearErrorHistory(): void {
    this.errorHistory = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Save error history to storage
  private saveErrorHistory(): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.errorHistory));
    } catch (err) {
      console.error('Failed to save error history:', err);
    }
  }

  // Load error history from storage
  private loadErrorHistory(): void {
    try {
      const saved = localStorage.getItem(this.STORAGE_KEY);

      if (saved) {
        this.errorHistory = JSON.parse(saved);
      }
    } catch (err) {
      console.error('Failed to load error history:', err);
      this.errorHistory = [];
    }
  }

  // Get error statistics
  public getErrorStats(): {
    totalErrors: number;
    unresolvedErrors: number;
    errorsByType: Record<TransactionErrorType, number>;
  } {
    const errorsByType: Record<TransactionErrorType, number> = {
      [TransactionErrorType.WALLET_NOT_CONNECTED]: 0,
      [TransactionErrorType.INSUFFICIENT_FUNDS]: 0,
      [TransactionErrorType.USER_REJECTED]: 0,
      [TransactionErrorType.TIMEOUT]: 0,
      [TransactionErrorType.BLOCKCHAIN_ERROR]: 0,
      [TransactionErrorType.GAME_LOGIC_ERROR]: 0,
      [TransactionErrorType.UNKNOWN_ERROR]: 0,
    };

    this.errorHistory.forEach(err => {
      errorsByType[err.type] = (errorsByType[err.type] || 0) + 1;
    });

    return {
      totalErrors: this.errorHistory.length,
      unresolvedErrors: this.errorHistory.filter(err => !err.resolved).length,
      errorsByType,
    };
  }
}

export const errorHandlerService = new ErrorHandlerService();
export default errorHandlerService;
