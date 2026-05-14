export interface AppSessionSnapshot {
  isLoggedIn: boolean;
  hasCompletedOnboarding: boolean;
}

export interface AppSessionRepository {
  read(): AppSessionSnapshot;
  markLoggedIn(): AppSessionSnapshot;
  completeOnboarding(): AppSessionSnapshot;
  reset(): void;
}
