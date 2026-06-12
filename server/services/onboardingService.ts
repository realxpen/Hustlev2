export interface UserOnboardingState {
  userId: string;
  interests: string[];
  locationAllowed: boolean | null;
  locationCoords: { latitude: number; longitude: number } | null;
  completed: boolean;
  updatedAt: string;
}

class OnboardingService {
  // Simple in-memory storage simulating a persistent database state (per user ID)
  private onboardingDatabases: Map<string, UserOnboardingState> = new Map();

  private getOrCreateState(userId: string): UserOnboardingState {
    let state = this.onboardingDatabases.get(userId);
    if (!state) {
      state = {
        userId,
        interests: [],
        locationAllowed: null,
        locationCoords: null,
        completed: false,
        updatedAt: new Date().toISOString(),
      };
      this.onboardingDatabases.set(userId, state);
    }
    return state;
  }

  public getOnboardingProgress(userId: string): UserOnboardingState {
    return this.getOrCreateState(userId);
  }

  public saveInterests(userId: string, interests: string[]): UserOnboardingState {
    const state = this.getOrCreateState(userId);
    state.interests = [...interests];
    state.updatedAt = new Date().toISOString();
    this.onboardingDatabases.set(userId, state);
    return state;
  }

  public saveLocation(
    userId: string,
    locationAllowed: boolean,
    coords?: { latitude: number; longitude: number }
  ): UserOnboardingState {
    const state = this.getOrCreateState(userId);
    state.locationAllowed = locationAllowed;
    state.locationCoords = locationAllowed && coords ? { ...coords } : null;
    state.updatedAt = new Date().toISOString();
    this.onboardingDatabases.set(userId, state);
    return state;
  }

  public completeOnboarding(userId: string): UserOnboardingState {
    const state = this.getOrCreateState(userId);
    state.completed = true;
    state.updatedAt = new Date().toISOString();
    this.onboardingDatabases.set(userId, state);
    return state;
  }
}

export const onboardingService = new OnboardingService();
