// Game view states for the application
import { PublicKey } from '@solana/web3.js';

// Add global declarations for TypeScript
declare global {
  interface Window {
    Buffer: typeof Buffer;
    process: any;
  }
}

export enum GameView {
  HOME = 'HOME',
  CREATE_GAME = 'CREATE_GAME',
  JOIN_GAME = 'JOIN_GAME',
  GAME_LOBBY = 'GAME_LOBBY',
  COMMIT_CHOICE = 'COMMIT_CHOICE',
  REVEAL_CHOICE = 'REVEAL_CHOICE',
  GAME_RESULTS = 'GAME_RESULTS',
  AUTO_PLAY = 'AUTO_PLAY', // Auto-play mode
  SECURITY = 'SECURITY', // Security information
  TESTING = 'TESTING', // Testing view
  PROFILE = 'PROFILE', // New profile view
}

// Game states as defined in the Solana program
export enum GameState {
  WAITING_FOR_PLAYER_TWO = 0,
  WAITING_FOR_PLAYER_ONE_CHOICE = 1,
  WAITING_FOR_PLAYER_TWO_CHOICE = 2,
  WAITING_FOR_PLAYER_ONE_REVEAL = 3,
  WAITING_FOR_PLAYER_TWO_TIMEOUT_CLAIM = 4,
  GAME_COMPLETED = 5,
  GAME_CANCELLED = 6,
}

// Game modes
export enum GameMode {
  Manual = 0,
  Automated = 1
}

// Currency mode
export enum CurrencyMode {
  SOL = 'SOL',
  RPS_TOKEN = 'RPS_TOKEN',
  NEW_CURRENCY = 2 // Extended CurrencyMode enum
}

// Betting strategies
export enum BettingStrategy {
  FIXED = 'fixed',
  MARTINGALE = 'martingale',
  DALEMBERT = "dalembert",
  FIBONACCI = "fibonacci"
}

// Fee settings
export interface FeeSettings {
  feePercentage: number; // 0.1% = 0.001
  rpsTokenFeeDiscount: number; // 50% discount = 0.5
}

// Currency benefits
export interface CurrencyBenefits {
  rpsTokenBonusPotPercentage: number; // 5% bonus = 0.05
}

// Player choice options
export enum Choice {
  None = 0,
  Rock = 1,
  Paper = 2,
  Scissors = 3
}

// Game outcome
export type GameOutcome = 'win' | 'loss' | 'tie';

// Game history item
export interface GameHistoryItem {
  playerChoice: number;
  opponentChoices: number[];
  result: GameOutcome;
  timestamp: number;
  wagerAmount: number;
}

// Auto-play statistics
export interface AutoPlayStats {
  currentStreak: number;
  wins: number;
  losses: number;
  ties: number;
  totalWagered: number;
  netProfit: number;
  gameHistory: GameHistoryItem[];
}

// Player data structure
export interface Player {
  pubkey: string;
  choice: number;
  committedChoice: number[];
  revealed: boolean;
  score: number;
}

// Game data structure
export interface Game {
  host: string;
  players: Player[];
  minPlayers: number;
  maxPlayers: number;
  state: number;
  currentRound: number;
  totalRounds: number;
  entryFee: number;
  gamePot: number;
  requiredTimeout: number;
  lastActionTimestamp: number;
  playerCount: number;
  losersCanRejoin: boolean;
  gameMode?: GameMode; // Optional for backward compatibility
  autoRoundDelay?: number; // Time between automated rounds in seconds
  maxAutoRounds?: number; // Maximum number of automated rounds
  currentAutoRound?: number; // Current auto round counter
  currencyMode?: CurrencyMode; // Which currency is being used
  tokenMint?: string; // Public key of token mint (if using RPSTOKEN)
  feeAccount?: string; // Public key of fee account
}

// Token balance
export interface TokenBalance {
  sol: number;
  rpsToken: number;
}

// Game data structure for UI
export interface GameData {
  escrowPubkey: PublicKey;
  playerOne: PublicKey;
  playerTwo: PublicKey | null;
  state: GameState;
  wager: number;
  timeoutStart: number | null;
  result: GameOutcome | null;
  playerOneChoice: number | null;
  playerTwoChoice: number | null;
}

// Player data structure - used for the UI
export interface PlayerInfo {
  publicKey: PublicKey;
  isCurrentUser: boolean;
  hasCommitted: boolean;
  choice: number | null;
}

// Game settings structure
export interface GameSettings {
  betAmount: number;
  currencyMode: CurrencyMode;
}

// Timer data for UI
export interface TimerData {
  isActive: boolean;
  startTime: number | null;
  duration: number;
}

// Game message for in-game chat or notifications
export interface GameMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

// Transaction notification data
export interface TransactionNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  txId?: string;
  autoClose?: boolean;
  duration?: number;
}

// Export AppProps explicitly as needed
export type AppProps = unknown;
