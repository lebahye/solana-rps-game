import { PublicKey } from '@solana/web3.js';

export enum GameView {
  HOME = 'HOME',
  CREATE_GAME = 'CREATE_GAME',
  JOIN_GAME = 'JOIN_GAME',
  GAME_LOBBY = 'GAME_LOBBY',
  COMMIT_CHOICE = 'COMMIT_CHOICE',
  REVEAL_CHOICE = 'REVEAL_CHOICE',
  GAME_RESULTS = 'GAME_RESULTS',
  AUTO_PLAY = 'AUTO_PLAY',
  SECURITY = 'SECURITY'
}

export interface GameState {
  gameId: string;
  players: PublicKey[];
  currentRound: number;
  status: GameStatus;
  wager: number;
}

export enum GameStatus {
  WAITING_FOR_PLAYERS = 'WAITING_FOR_PLAYERS',
  COMMIT_PHASE = 'COMMIT_PHASE',
  REVEAL_PHASE = 'REVEAL_PHASE',
  COMPLETED = 'COMPLETED'
}
