import { useState } from "react";
import type { AppSessionRepository } from "../../../domain/contracts/session";
import { localSessionRepository } from "../../../infrastructure/session/localSessionRepository";

export function useAppSession(
  repository: AppSessionRepository = localSessionRepository,
) {
  const [session, setSession] = useState(() => repository.read());

  const markLoggedIn = () => {
    setSession(repository.markLoggedIn());
  };

  const markOnboardingComplete = () => {
    setSession(repository.completeOnboarding());
  };

  const resetSession = () => {
    repository.reset();
    setSession(repository.read());
  };

  return {
    ...session,
    markLoggedIn,
    markOnboardingComplete,
    resetSession,
  };
}
