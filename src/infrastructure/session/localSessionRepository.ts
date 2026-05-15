import { browserStorage } from "../storage/browserStorage";

const USER_KEY = "hustle_user";
const TOKEN_KEY = "hustle_token";
const ONBOARDING_KEY = "hustle_onboarding";

export const localSessionRepository = {
  saveSession(user: unknown, token: string) {
    browserStorage.set(USER_KEY, user);
    browserStorage.set(TOKEN_KEY, token);
  },

  getUser() {
    return browserStorage.get(USER_KEY);
  },

  getToken() {
    return browserStorage.get(TOKEN_KEY);
  },

  clearSession() {
    browserStorage.remove(USER_KEY);
    browserStorage.remove(TOKEN_KEY);
    browserStorage.remove(ONBOARDING_KEY);
  },

  completeOnboarding() {
    browserStorage.set(ONBOARDING_KEY, true);
  },

  hasCompletedOnboarding() {
    return browserStorage.get<boolean>(ONBOARDING_KEY) === true;
  },
};