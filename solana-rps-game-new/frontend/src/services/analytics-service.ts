// Analytics service for tracking user behavior

// Event types for analytics
export enum AnalyticsEventType {
  // Page views
  PAGE_VIEW = 'page_view',

  // Game events
  GAME_CREATED = 'game_created',
  GAME_JOINED = 'game_joined',
  GAME_COMPLETED = 'game_completed',
  CHOICE_MADE = 'choice_made',
  CHOICE_REVEALED = 'choice_revealed',

  // Wallet events
  WALLET_CONNECTED = 'wallet_connected',
  WALLET_DISCONNECTED = 'wallet_disconnected',
  TRANSACTION_SUBMITTED = 'transaction_submitted',
  TRANSACTION_CONFIRMED = 'transaction_confirmed',
  TRANSACTION_FAILED = 'transaction_failed',

  // User interactions
  BUTTON_CLICK = 'button_click',
  TOGGLE_SETTING = 'toggle_setting',

  // App events
  APP_LOAD = 'app_load',
  APP_ERROR = 'app_error',
  FEATURE_USED = 'feature_used'
}

// Analytics event interface
export interface AnalyticsEvent {
  type: AnalyticsEventType;
  timestamp: number;
  data: Record<string, any>;
  sessionId: string;
  userId?: string; // Wallet address if available
}

class AnalyticsService {
  private events: AnalyticsEvent[] = [];
  private readonly STORAGE_KEY = 'solana-rps-analytics';
  private sessionId: string;
  private isEnabled: boolean;
  private userId?: string;

  // Maximum events to store locally
  private readonly MAX_EVENTS = 1000;

  constructor() {
    // Generate a session ID
    this.sessionId = `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    // Load analytics preferences
    this.isEnabled = localStorage.getItem('analytics-enabled') !== 'false';

    // Load existing events
    this.loadEvents();

    // Track app load
    this.trackEvent(AnalyticsEventType.APP_LOAD, {
      referrer: document.referrer,
      userAgent: navigator.userAgent,
      screenSize: `${window.innerWidth}x${window.innerHeight}`
    });

    // Set up before unload event to save analytics
    window.addEventListener('beforeunload', () => {
      this.saveEvents();
    });
  }

  // Set user ID (wallet address)
  public setUserId(userId: string): void {
    this.userId = userId;
  }

  // Clear user ID on disconnect
  public clearUserId(): void {
    this.userId = undefined;
  }

  // Track an analytics event
  public trackEvent(type: AnalyticsEventType, data: Record<string, any> = {}): void {
    if (!this.isEnabled) return;

    const event: AnalyticsEvent = {
      type,
      timestamp: Date.now(),
      data,
      sessionId: this.sessionId,
      userId: this.userId
    };

    // Add to local events
    this.events.push(event);

    // Limit size of stored events
    if (this.events.length > this.MAX_EVENTS) {
      this.events = this.events.slice(-this.MAX_EVENTS);
    }

    // In a production environment, you might want to send events to a server here
    // This implementation just stores them locally
    console.debug('Analytics event:', event);

    // Save periodically (could also use a debounce)
    if (this.events.length % 10 === 0) {
      this.saveEvents();
    }
  }

  // Track page view
  public trackPageView(page: string): void {
    this.trackEvent(AnalyticsEventType.PAGE_VIEW, { page });
  }

  // Track button click
  public trackButtonClick(buttonId: string, buttonText?: string): void {
    this.trackEvent(AnalyticsEventType.BUTTON_CLICK, { buttonId, buttonText });
  }

  // Track game creation
  public trackGameCreated(gameId: string, betAmount: number, currencyMode: string): void {
    this.trackEvent(AnalyticsEventType.GAME_CREATED, { gameId, betAmount, currencyMode });
  }

  // Track game joined
  public trackGameJoined(gameId: string): void {
    this.trackEvent(AnalyticsEventType.GAME_JOINED, { gameId });
  }

  // Track game completed
  public trackGameCompleted(gameId: string, result: string, duration: number): void {
    this.trackEvent(AnalyticsEventType.GAME_COMPLETED, { gameId, result, duration });
  }

  // Track player choice
  public trackChoice(gameId: string, choice: number): void {
    this.trackEvent(AnalyticsEventType.CHOICE_MADE, { gameId, choice });
  }

  // Track wallet connection
  public trackWalletConnection(walletType: string): void {
    this.trackEvent(AnalyticsEventType.WALLET_CONNECTED, { walletType });
  }

  // Track transaction
  public trackTransaction(txId: string, type: string, status: string): void {
    this.trackEvent(
      status === 'success'
        ? AnalyticsEventType.TRANSACTION_CONFIRMED
        : AnalyticsEventType.TRANSACTION_FAILED,
      { txId, type, status }
    );
  }

  // Enable analytics
  public enableAnalytics(): void {
    this.isEnabled = true;
    localStorage.setItem('analytics-enabled', 'true');
  }

  // Disable analytics
  public disableAnalytics(): void {
    this.isEnabled = false;
    localStorage.setItem('analytics-enabled', 'false');
  }

  // Get analytics status
  public isAnalyticsEnabled(): boolean {
    return this.isEnabled;
  }

  // Get analytics data (for admin dashboard)
  public getAnalyticsData(): AnalyticsEvent[] {
    return [...this.events];
  }

  // Clear analytics data
  public clearAnalyticsData(): void {
    this.events = [];
    localStorage.removeItem(this.STORAGE_KEY);
  }

  // Save events to localStorage
  private saveEvents(): void {
    if (!this.isEnabled) return;

    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.events));
    } catch (err) {
      console.error('Failed to save analytics events:', err);
      // If localStorage is full, clear some old events
      if (err instanceof DOMException && (
        err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )) {
        this.events = this.events.slice(-Math.floor(this.MAX_EVENTS / 2));
        this.saveEvents();
      }
    }
  }

  // Load events from localStorage
  private loadEvents(): void {
    try {
      const savedEvents = localStorage.getItem(this.STORAGE_KEY);

      if (savedEvents) {
        this.events = JSON.parse(savedEvents);
      }
    } catch (err) {
      console.error('Failed to load analytics events:', err);
      this.events = [];
    }
  }

  // Get analytics summary (for admin dashboard)
  public getAnalyticsSummary(): {
    totalEvents: number;
    eventsByType: Record<string, number>;
    uniqueUsers: number;
    totalPageViews: number;
    topPages: Record<string, number>;
    gamesCreated: number;
    gamesCompleted: number;
    averageGameDuration: number;
  } {
    const eventsByType: Record<string, number> = {};
    const userIds = new Set<string>();
    let totalPageViews = 0;
    const pageViews: Record<string, number> = {};
    let gamesCreated = 0;
    let gamesCompleted = 0;
    let totalGameDuration = 0;
    let gameCompletionCount = 0;

    this.events.forEach(event => {
      // Count by event type
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;

      // Count unique users
      if (event.userId) {
        userIds.add(event.userId);
      }

      // Page views
      if (event.type === AnalyticsEventType.PAGE_VIEW) {
        totalPageViews++;
        const page = event.data.page || 'unknown';
        pageViews[page] = (pageViews[page] || 0) + 1;
      }

      // Games
      if (event.type === AnalyticsEventType.GAME_CREATED) {
        gamesCreated++;
      }

      if (event.type === AnalyticsEventType.GAME_COMPLETED) {
        gamesCompleted++;
        if (typeof event.data.duration === 'number') {
          totalGameDuration += event.data.duration;
          gameCompletionCount++;
        }
      }
    });

    // Sort pages by views
    const topPages: Record<string, number> = {};
    Object.entries(pageViews)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .forEach(([page, count]) => {
        topPages[page] = count;
      });

    return {
      totalEvents: this.events.length,
      eventsByType,
      uniqueUsers: userIds.size,
      totalPageViews,
      topPages,
      gamesCreated,
      gamesCompleted,
      averageGameDuration: gameCompletionCount > 0
        ? totalGameDuration / gameCompletionCount
        : 0
    };
  }
}

export const analyticsService = new AnalyticsService();
export default analyticsService;
