// Audio service for managing game sound effects
class AudioService {
  private sounds: Record<string, HTMLAudioElement> = {};
  private muted: boolean = false;
  private volume: number = 0.8; // Default volume (0-1)
  private initialized: boolean = false;

  // Sound categories
  public readonly CATEGORIES = {
    UI: 'ui',
    GAME: 'game',
    WIN: 'win',
    LOSE: 'lose',
  };

  // List of sound files to preload
  private readonly SOUND_FILES = [
    { id: 'click', src: '/sounds/click.mp3', category: 'ui' },
    { id: 'hover', src: '/sounds/hover.mp3', category: 'ui' },
    { id: 'countdown', src: '/sounds/countdown.mp3', category: 'game' },
    { id: 'reveal', src: '/sounds/reveal.mp3', category: 'game' },
    { id: 'win', src: '/sounds/win.mp3', category: 'win' },
    { id: 'lose', src: '/sounds/lose.mp3', category: 'lose' },
    { id: 'tie', src: '/sounds/tie.mp3', category: 'game' },
    { id: 'coins', src: '/sounds/coins.mp3', category: 'win' },
    { id: 'error', src: '/sounds/error.mp3', category: 'ui' },
    { id: 'success', src: '/sounds/success.mp3', category: 'ui' },
  ];

  constructor() {
    // Load saved settings from localStorage
    const savedMuted = localStorage.getItem('rps-audio-muted');
    if (savedMuted !== null) {
      this.muted = savedMuted === 'true';
    }

    const savedVolume = localStorage.getItem('rps-audio-volume');
    if (savedVolume !== null) {
      this.volume = parseFloat(savedVolume);
    }

    // Initialize immediately
    this.initialize();
  }

  /**
   * Initialize the audio service
   * This should be called when the user interacts with the page
   * to ensure browser audio autoplay policies are satisfied
   */
  public async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      // Load preference from localStorage
      this.loadPreferences();

      // Create a dummy audio context to enable audio on first user interaction
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContext();

      // Preload all sounds
      await this.preloadSounds();

      this.initialized = true;
      console.log('Audio service initialized');
    } catch (error) {
      console.error('Failed to initialize audio service:', error);
    }
  }

  /**
   * Preload all sound effects
   */
  private async preloadSounds(): Promise<void> {
    const loadPromises = this.SOUND_FILES.map(sound => {
      return new Promise<void>((resolve, reject) => {
        const audio = new Audio();
        audio.src = sound.src;
        audio.volume = this.volume;
        audio.preload = 'auto';

        audio.oncanplaythrough = () => {
          this.sounds[sound.id] = audio;
          resolve();
        };

        audio.onerror = (error) => {
          console.warn(`Failed to load sound ${sound.id}:`, error);
          resolve(); // Resolve anyway to prevent blocking other sounds
        };

        // Add to DOM to trigger loading
        audio.load();
      });
    });

    try {
      await Promise.all(loadPromises);
    } catch (error) {
      console.error('Error preloading sounds:', error);
    }
  }

  /**
   * Play a sound effect by ID
   * @param soundId The ID of the sound to play
   */
  public play(soundId: string): void {
    if (!this.initialized || this.muted) return;

    const sound = this.sounds[soundId];
    if (!sound) {
      console.warn(`Sound with ID "${soundId}" not found`);
      return;
    }

    // Clone the audio element to allow multiple plays at once
    const soundClone = sound.cloneNode() as HTMLAudioElement;
    soundClone.volume = this.volume;

    // Play and clean up when done
    soundClone.play().catch(error => {
      console.warn(`Error playing sound ${soundId}:`, error);
    });

    soundClone.onended = () => {
      soundClone.remove();
    };
  }

  /**
   * Play a sound from a specific category
   * @param category The category of sound to play
   */
  public playCategory(category: string): void {
    if (!this.initialized || this.muted) return;

    // Find sounds in the category
    const categorySound = this.SOUND_FILES.find(sound => sound.category === category);
    if (categorySound) {
      this.play(categorySound.id);
    }
  }

  /**
   * Toggle mute status
   * @returns New mute status
   */
  public toggleMute(): boolean {
    this.muted = !this.muted;
    this.savePreferences();
    return this.muted;
  }

  /**
   * Set the mute status
   * @param muted Whether sounds should be muted
   */
  public setMuted(muted: boolean): void {
    this.muted = muted;
    localStorage.setItem('rps-audio-muted', muted.toString());
  }

  /**
   * Set the volume level
   * @param volume Volume level (0-1)
   */
  public setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume)); // Clamp between 0 and 1

    // Update volume for all loaded sounds
    Object.values(this.sounds).forEach(sound => {
      sound.volume = this.volume;
    });

    localStorage.setItem('rps-audio-volume', volume.toString());
  }

  /**
   * Get the current mute status
   */
  public getMuted(): boolean {
    return this.muted;
  }

  /**
   * Get the current volume level
   */
  public getVolume(): number {
    return this.volume;
  }

  /**
   * Save audio preferences to localStorage
   */
  private savePreferences(): void {
    try {
      localStorage.setItem('rps-audio-muted', JSON.stringify(this.muted));
      localStorage.setItem('rps-audio-volume', JSON.stringify(this.volume));
    } catch (error) {
      console.warn('Failed to save audio preferences:', error);
    }
  }

  /**
   * Load audio preferences from localStorage
   */
  private loadPreferences(): void {
    try {
      const muted = localStorage.getItem('rps-audio-muted');
      if (muted !== null) {
        this.muted = JSON.parse(muted);
      }

      const volume = localStorage.getItem('rps-audio-volume');
      if (volume !== null) {
        this.volume = JSON.parse(volume);
      }
    } catch (error) {
      console.warn('Failed to load audio preferences:', error);
    }
  }
}

// Export singleton instance
export const audioService = new AudioService();

export default audioService;
