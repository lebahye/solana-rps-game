import { userProfileService, UserProfile } from '../services/user-profile-service';

// Generate random wallet address
const generateRandomWallet = (): string => {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let result = '';
  for (let i = 0; i < 44; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

// List of mock player names for demonstration
const playerNames = [
  'CryptoWhale',
  'BlockchainBaron',
  'TokenTitan',
  'SolanaStriker',
  'RPSChampion',
  'CoinCollector',
  'DigitalDominator',
  'WalletWarrior',
  'HashHero',
  'NFTNinja',
  'DefiDestroyer',
  'ChainChampion',
  'ByteBrawler',
  'ProofOfGamer',
  'MintMaster',
  'StakeSavant',
  'LedgerLegend',
  'SolSurfer',
  'ValidatorVenus',
  'GasFeeGuru'
];

// Generate a random profile
const generateRandomProfile = (index: number): UserProfile => {
  // Randomize stats
  const totalGames = Math.floor(Math.random() * 100) + 10;
  const wins = Math.floor(Math.random() * totalGames);
  const losses = Math.floor(Math.random() * (totalGames - wins));
  const ties = totalGames - wins - losses;

  const totalWagered = Number((Math.random() * 25 + 5).toFixed(2));
  const netProfitRate = Math.random() * 0.4 - 0.2; // Between -20% and +20%
  const netProfit = Number((totalWagered * netProfitRate).toFixed(2));

  return {
    walletAddress: generateRandomWallet(),
    displayName: playerNames[index % playerNames.length],
    totalGames,
    wins,
    losses,
    ties,
    winRate: Number(((wins / totalGames) * 100).toFixed(1)),
    totalWagered,
    netProfit,
    lastActive: Date.now() - Math.random() * 86400000 * 30 // Last 30 days
  };
};

// Generate multiple mock profiles
export const generateMockProfiles = (count: number): void => {
  const profiles: Record<string, UserProfile> = {};

  for (let i = 0; i < count; i++) {
    const profile = generateRandomProfile(i);
    profiles[profile.walletAddress] = profile;
  }

  // Save to localStorage
  localStorage.setItem('solana-rps-user-profiles', JSON.stringify(profiles));

  // Update leaderboard
  const profileArray = Object.values(profiles);

  // Sort by win rate, then by total games as tiebreaker
  profileArray.sort((a, b) => {
    if (b.winRate !== a.winRate) {
      return b.winRate - a.winRate;
    }
    return b.totalGames - a.totalGames;
  });

  // Assign ranks
  profileArray.forEach((profile, index) => {
    profile.rank = index + 1;
  });

  // Save leaderboard
  localStorage.setItem('solana-rps-leaderboard', JSON.stringify(profileArray));
};

export default {
  generateMockProfiles,
  generateRandomProfile,
  generateRandomWallet
};
