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
  WELCOME = 'WELCOME', // Welcome screen
  TOURNAMENT = 'TOURNAMENT', // Tournament view
  LEADERBOARD = 'LEADERBOARD', // Leaderboard view
  PROFILE = 'PROFILE', // User profile view
  SPECTATE = 'SPECTATE', // Spectate other games
  ACHIEVEMENTS = 'ACHIEVEMENTS', // User achievements
  SETTINGS = 'SETTINGS', // User settings
  SOCIAL = 'SOCIAL', // Social hub
  NFT_GALLERY = 'NFT_GALLERY' // NFT gallery view
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
  Scissors = 3,
  Lizard = 4,
  Spock = 5
}

// Game variant
export enum GameVariant {
  CLASSIC = 'CLASSIC', // Rock, Paper, Scissors
  EXTENDED = 'EXTENDED', // Rock, Paper, Scissors, Lizard, Spock
  TIMED = 'TIMED', // Time pressure variant
  STREAK = 'STREAK', // Streak challenge variant
  TOURNAMENT = 'TOURNAMENT' // Tournament mode
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
  gameVariant?: GameVariant; // Game variant (classic, extended, etc.)
  timeLimit?: number; // Time limit for timed games (in seconds)
  spectators?: string[]; // Array of spectator public keys
  chatEnabled?: boolean; // Whether chat is enabled for this game
  tournamentId?: string; // ID of tournament this game belongs to
  nftPrize?: boolean; // Whether this game awards an NFT prize
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

// Tournament structure
export interface Tournament {
  id: string;
  name: string;
  entryFee: number;
  currencyMode: CurrencyMode;
  maxPlayers: number;
  rounds: number;
  startTime: number;
  endTime: number | null;
  players: string[]; // Array of player public keys
  matches: TournamentMatch[];
  prizes: TournamentPrize[];
  status: TournamentStatus;
  createdBy: string; // Public key of creator
}

// Tournament match
export interface TournamentMatch {
  id: string;
  gameId: string | null; // Null if not yet created
  round: number;
  players: string[];
  winner: string | null;
  status: 'pending' | 'active' | 'completed';
}

// Tournament prize
export interface TournamentPrize {
  rank: number;
  amount: number;
  currencyMode: CurrencyMode;
  nftReward?: boolean;
}

// Tournament status
export type TournamentStatus = 'registration' | 'active' | 'completed';

// User profile
export interface UserProfile {
  publicKey: string;
  username: string | null;
  avatar: string | null;
  stats: UserStats;
  achievements: Achievement[];
  nfts: NFT[];
  friends: string[];
  createdAt: number;
}

// User statistics
export interface UserStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  ties: number;
  winRate: number;
  tournamentWins: number;
  highestStreak: number;
  favoriteChoice: Choice;
  totalWagered: number;
  totalEarned: number;
}

// Achievement
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt: number | null;
  progress: number; // 0-100
  requirement: number;
}

// NFT
export interface NFT {
  id: string;
  name: string;
  image: string;
  description: string;
  attributes: NFTAttribute[];
  mintAddress: string;
  acquiredAt: number;
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
}

// NFT attribute
export interface NFTAttribute {
  trait_type: string;
  value: string | number;
}

// Chat message
export interface ChatMessage {
  id: string;
  gameId: string;
  sender: string; // Public key
  senderDisplayName: string;
  message: string;
  timestamp: number;
  isSystemMessage: boolean;
}

// Theme settings
export type ThemeMode = 'light' | 'dark' | 'system';

// User settings
export interface UserSettings {
  theme: ThemeMode;
  soundEnabled: boolean;
  musicEnabled: boolean;
  notificationsEnabled: boolean;
  chatEnabled: boolean;
  autoAcceptInvites: boolean;
  showOnlineStatus: boolean;
}

// Referral
export interface Referral {
  referrer: string; // Public key of referrer
  referee: string; // Public key of referee
  status: 'pending' | 'completed';
  reward: number;
  createdAt: number;
  completedAt: number | null;
}

// Transaction notification
export interface TransactionNotification {
  type: 'success' | 'error' | 'info';
  message: string;
  txId?: string;
  autoClose?: boolean;
  duration?: number;
}

// Export AppProps explicitly as needed
export type AppProps = unknown;
