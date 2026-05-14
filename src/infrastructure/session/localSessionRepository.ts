import type {
  AppSessionRepository,
  AppSessionSnapshot,
} from "../../domain/contracts/session";
import { createBrowserStorage } from "../storage/browserStorage";

const LOGIN_KEY = "hustle_logged_in";
const ONBOARDING_KEY = "hustle_onboarding_complete";

export class LocalSessionRepository implements AppSessionRepository {
  constructor(private readonly store = createBrowserStorage()) {}

  read(): AppSessionSnapshot {
    return {
      isLoggedIn: this.store.get(LOGIN_KEY) === "true",
      hasCompletedOnboarding: this.store.get(ONBOARDING_KEY) === "true",
    };
  }

  markLoggedIn(): AppSessionSnapshot {
    this.store.set(LOGIN_KEY, "true");
    return this.read();
  }

  completeOnboarding(): AppSessionSnapshot {
    this.store.set(ONBOARDING_KEY, "true");
    return this.read();
  }

  reset(): void {
    this.store.clear();
  }
}

export const localSessionRepository = new LocalSessionRepository();
