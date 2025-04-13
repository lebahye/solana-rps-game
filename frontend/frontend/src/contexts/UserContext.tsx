import React, { createContext, useState, useEffect, useContext } from 'react';
import { UserProfile, UserSettings, Achievement, NFT } from '../types';
import { PublicKey } from '@solana/web3.js';

interface UserContextType {
  profile: UserProfile | null;
  settings: UserSettings;
  isLoading: boolean;
  updateProfile: (updates: Partial<UserProfile>) => void;
  updateSettings: (updates: Partial<UserSettings>) => void;
  addAchievement: (achievement: Achievement) => void;
  addNFT: (nft: NFT) => void;
}

const defaultSettings: UserSettings = {
  theme: 'dark',
  soundEnabled: true,
  musicEnabled: true,
  notificationsEnabled: true,
  chatEnabled: true,
  autoAcceptInvites: false,
  showOnlineStatus: true,
};

const defaultContext: UserContextType = {
  profile: null,
  settings: defaultSettings,
  isLoading: true,
  updateProfile: () => {},
  updateSettings: () => {},
  addAchievement: () => {},
  addNFT: () => {},
};

export const UserContext = createContext<UserContextType>(defaultContext);

export const UserProvider: React.FC<{ 
  children: React.ReactNode;
  publicKey: PublicKey | null;
}> = ({ children, publicKey }) => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [settings, setSettings] = useState<UserSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Load user profile when wallet connects
  useEffect(() => {
    if (!publicKey) {
      setProfile(null);
      setIsLoading(false);
      return;
    }

    const loadUserProfile = async () => {
      setIsLoading(true);
      try {
        // In a real implementation, this would fetch from a database or blockchain
        // For now, we'll use localStorage as a mock
        const savedProfile = localStorage.getItem(`rps-profile-${publicKey.toString()}`);
        
        if (savedProfile) {
          setProfile(JSON.parse(savedProfile));
        } else {
          // Create a new profile
          const newProfile: UserProfile = {
            publicKey: publicKey.toString(),
            username: null,
            avatar: null,
            stats: {
              gamesPlayed: 0,
              wins: 0,
              losses: 0,
              ties: 0,
              winRate: 0,
              tournamentWins: 0,
              highestStreak: 0,
              favoriteChoice: 1, // Rock
              totalWagered: 0,
              totalEarned: 0,
            },
            achievements: [],
            nfts: [],
            friends: [],
            createdAt: Date.now(),
          };
          
          setProfile(newProfile);
          localStorage.setItem(`rps-profile-${publicKey.toString()}`, JSON.stringify(newProfile));
        }
        
        // Load settings
        const savedSettings = localStorage.getItem(`rps-settings-${publicKey.toString()}`);
        if (savedSettings) {
          setSettings(JSON.parse(savedSettings));
        } else {
          setSettings(defaultSettings);
          localStorage.setItem(`rps-settings-${publicKey.toString()}`, JSON.stringify(defaultSettings));
        }
      } catch (error) {
        console.error('Error loading user profile:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadUserProfile();
  }, [publicKey]);

  // Update profile
  const updateProfile = (updates: Partial<UserProfile>) => {
    if (!profile || !publicKey) return;
    
    const updatedProfile = { ...profile, ...updates };
    setProfile(updatedProfile);
    localStorage.setItem(`rps-profile-${publicKey.toString()}`, JSON.stringify(updatedProfile));
  };

  // Update settings
  const updateSettings = (updates: Partial<UserSettings>) => {
    if (!publicKey) return;
    
    const updatedSettings = { ...settings, ...updates };
    setSettings(updatedSettings);
    localStorage.setItem(`rps-settings-${publicKey.toString()}`, JSON.stringify(updatedSettings));
  };

  // Add achievement
  const addAchievement = (achievement: Achievement) => {
    if (!profile || !publicKey) return;
    
    // Check if achievement already exists
    if (profile.achievements.some(a => a.id === achievement.id)) return;
    
    const updatedProfile = {
      ...profile,
      achievements: [...profile.achievements, achievement],
    };
    
    setProfile(updatedProfile);
    localStorage.setItem(`rps-profile-${publicKey.toString()}`, JSON.stringify(updatedProfile));
  };

  // Add NFT
  const addNFT = (nft: NFT) => {
    if (!profile || !publicKey) return;
    
    // Check if NFT already exists
    if (profile.nfts.some(n => n.id === nft.id)) return;
    
    const updatedProfile = {
      ...profile,
      nfts: [...profile.nfts, nft],
    };
    
    setProfile(updatedProfile);
    localStorage.setItem(`rps-profile-${publicKey.toString()}`, JSON.stringify(updatedProfile));
  };

  return (
    <UserContext.Provider
      value={{
        profile,
        settings,
        isLoading,
        updateProfile,
        updateSettings,
        addAchievement,
        addNFT,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// Custom hook for using user context
export const useUser = () => useContext(UserContext);
