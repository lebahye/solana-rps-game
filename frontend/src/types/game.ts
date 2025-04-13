import { PublicKey } from '@solana/web3.js';
import { RPSGameClient } from '../rps-client';

export interface BaseGameProps {
  gameClient: RPSGameClient;
  publicKey: PublicKey;
  connected: boolean;
  gameId: string;
  gameData: any;
}

export interface GameLobbyViewProps extends BaseGameProps {
  onGameStarted: () => void;
  onLeaveGame: () => void;
}

export interface CommitChoiceViewProps extends BaseGameProps {
  userPublicKey: PublicKey;
  onCommitChoice: (choice: number) => void;
}

export interface RevealChoiceViewProps extends BaseGameProps {
  userPublicKey: PublicKey;
  onRevealChoice: (choice: number) => void;
}

export interface GameResultsViewProps extends BaseGameProps {
  userPublicKey: PublicKey;
}

export interface AutoPlayViewProps extends BaseGameProps {
  onBackToHome: () => void;
}

export interface SecurityViewProps extends BaseGameProps {
  onBack: () => void;
}

export enum GameView {
  WELCOME = 'WELCOME',
  LOBBY = 'LOBBY',
  COMMIT = 'COMMIT',
  REVEAL = 'REVEAL',
  RESULTS = 'RESULTS',
  AUTO_PLAY = 'AUTO_PLAY',
  SECURITY = 'SECURITY'
}