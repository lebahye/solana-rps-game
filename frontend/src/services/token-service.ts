import { Connection, PublicKey, Transaction, SystemProgram, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { TokenBalance, CurrencyMode, FeeSettings } from '../types';

// Constants for fees and benefits
export const FEE_SETTINGS: FeeSettings = {
  feePercentage: 0.001, // 0.1%
  rpsTokenFeeDiscount: 0.5, // 50% discount for RPSTOKEN
};

export const CURRENCY_BENEFITS = {
  rpsTokenBonusPotPercentage: 0.05, // 5% bonus for RPSTOKEN
};

// Mock RPS token mint address - in a real implementation, this would be a real token
export const RPS_TOKEN_MINT = new PublicKey('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v');

// Mock fee account - in a real implementation, this would be the protocol's fee collector
export const FEE_ACCOUNT = new PublicKey('FeeKHhL1CcJCyd82xextWTbBT5jGzVQwXVQKNjHV8SDD');

/**
 * Calculate the fee for a transaction based on the amount and currency
 */
export function calculateFee(amount: number, currencyMode: CurrencyMode): number {
  const baseFee = amount * FEE_SETTINGS.feePercentage;

  if (currencyMode === CurrencyMode.RPSTOKEN) {
    return baseFee * FEE_SETTINGS.rpsTokenFeeDiscount; // 50% discount for RPSTOKEN
  }

  return baseFee;
}

/**
 * Calculate the bonus pot amount for RPSTOKEN games
 */
export function calculateBonusPot(amount: number, currencyMode: CurrencyMode): number {
  if (currencyMode === CurrencyMode.RPSTOKEN) {
    return amount * CURRENCY_BENEFITS.rpsTokenBonusPotPercentage;
  }

  return 0;
}

/**
 * Get user's token balances
 * For this mock implementation, we'll fetch the SOL balance from the network
 * and generate a random RPSTOKEN balance.
 */
export const getTokenBalances = async (
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<TokenBalance> => {
  try {
    // Check if Buffer is properly defined
    if (typeof Buffer === 'undefined' || typeof Buffer.from !== 'function') {
      console.error('Buffer or Buffer.from is not defined in token-service');
      return { sol: 0, rpsToken: 0 };
    }

    // Get SOL balance
    const solBalance = await connection.getBalance(walletPublicKey);

    // In a production app, we would query for the actual RPS token
    // For now, we're just simulating the RPS token balance
    const rpsTokenBalance = 100; // Simulated balance

    return {
      sol: solBalance / LAMPORTS_PER_SOL,
      rpsToken: rpsTokenBalance
    };
  } catch (error) {
    console.error('Error fetching token balances:', error);
    // Return default values in case of error
    return {
      sol: 0,
      rpsToken: 0
    };
  }
};

/**
 * Create a transaction for payment, including fees
 * This is a simplified mock implementation
 */
export function createPaymentTransaction(
  amount: number,
  walletPublicKey: PublicKey,
  gameAccount: PublicKey,
  currencyMode: CurrencyMode
): Transaction {
  const transaction = new Transaction();

  if (currencyMode === CurrencyMode.SOL) {
    // Calculate fee
    const fee = calculateFee(amount, currencyMode);
    const paymentAmount = amount - fee;

    // Add transfer to fee account
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: FEE_ACCOUNT,
        lamports: fee * LAMPORTS_PER_SOL
      })
    );

    // Add transfer to game account
    transaction.add(
      SystemProgram.transfer({
        fromPubkey: walletPublicKey,
        toPubkey: gameAccount,
        lamports: paymentAmount * LAMPORTS_PER_SOL
      })
    );
  } else {
    // RPSTOKEN implementation would use Token Program instructions
    // This is just a placeholder
    console.log('RPSTOKEN payment transaction would be created here');
    // In a real implementation, we would add Token Program instructions for token transfers
  }

  return transaction;
}

/**
 * Get free RPSTOKEN (for testing/demo)
 * In a real implementation, this might be a faucet or token swap
 */
export const getFreeRPSTokens = async (
  connection: Connection,
  walletPublicKey: PublicKey
): Promise<boolean> => {
  try {
    console.log('Requesting free RPS tokens for', walletPublicKey.toString());

    // In a real application, this would call a faucet service
    // For now, just simulate a successful request

    // Simulated delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    return true;
  } catch (error) {
    console.error('Error getting free RPS tokens:', error);
    return false;
  }
};

/**
 * Correctly format currency amount based on currency mode
 */
export const formatCurrencyAmount = (amount: number, currencyMode: number): string => {
  // Convert from lamports to SOL (or equivalent)
  const convertedAmount = amount / 1000000000;

  if (currencyMode === 1) { // RPSTOKEN
    return `${convertedAmount.toFixed(2)} RPSTOKEN`;
  } else { // SOL
    return `${convertedAmount.toFixed(4)} SOL`;
  }
}

// Added for debugging
console.log('[token-service] Loaded, Buffer status:', {
  hasBuffer: typeof Buffer !== 'undefined',
  hasBufferFrom: Buffer && typeof Buffer.from === 'function'
});
