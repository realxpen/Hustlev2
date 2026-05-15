import { useState } from "react";
import { type AppStage, NEXT_APP_STAGE } from "./app-flow";
import { localSessionRepository } from "../infrastructure/session/localSessionRepository";


export function useAppFlow(initialStage: AppStage = "splash") {
  const [appStage, setAppStage] = useState<AppStage>(initialStage);

  const goTo = (nextStage: AppStage) => {
    setAppStage(nextStage);
  };

  const hasCompletedOnboarding =
  localSessionRepository.hasCompletedOnboarding();
  if (!hasCompletedOnboarding) {
  return "onboarding";
}

  const goNext = () => {
    const nextStage = NEXT_APP_STAGE[appStage];
    if (nextStage) {
      setAppStage(nextStage);
    }
  };

  return {
    appStage,
    goNext,
    goTo,
  };
}
