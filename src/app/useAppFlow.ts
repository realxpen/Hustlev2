import { useState } from "react";
import { type AppStage, NEXT_APP_STAGE } from "./app-flow";

export function useAppFlow(initialStage: AppStage = "splash") {
  const [appStage, setAppStage] = useState<AppStage>(initialStage);

  const goTo = (nextStage: AppStage) => {
    setAppStage(nextStage);
  };

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
