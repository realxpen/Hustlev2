import { useEffect, useState } from "react";
import { localSessionRepository } from "../../../infrastructure/session/localSessionRepository";

export function useAppSession() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    const storedUser = localSessionRepository.getUser();
    const onboardingDone = localSessionRepository.hasCompletedOnboarding();

    if (storedUser) {
      setUser(storedUser);
    }

    setHasCompletedOnboarding(onboardingDone);
    setLoading(false);
  }, []);

  const login = (userData: any, token: string) => {
    localSessionRepository.saveSession(userData, token);
    setUser(userData);
  };

  const logout = () => {
    localSessionRepository.clearSession();
    setUser(null);
  };

  const completeOnboarding = () => {
    localSessionRepository.completeOnboarding();
    setHasCompletedOnboarding(true);
  };

  return {
    user,
    loading,
    login,
    logout,
    isAuthenticated: !!user,
    hasCompletedOnboarding,
    completeOnboarding,
  };
}
