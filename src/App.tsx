/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import SplashScreen from "./components/SplashScreen";
import AuthScreen from "./components/AuthScreen";
import EntryTransition from "./components/EntryTransition";
import MockHome from "./components/MockHome";
import { useAuth } from "./features/auth";
import { OnboardingGuard } from "./features/onboarding";
import ProfileCompletionPopup from "./features/profile/components/ProfileCompletionPopup";

type AppState = "splash" | "auth" | "transition" | "home";

export default function App() {
  const [appState, setAppState] = useState<AppState>("splash");
  const { session, isInitialized, initialize, isRecoveryMode } = useAuth();

  useEffect(() => {
    initialize();
  }, [initialize]);

  const handleSplashComplete = () => {
    // If initialized and we have a session, skip auth screen (unless in recovery mode)
    if (isInitialized && session && !isRecoveryMode) {
      setAppState("transition");
    } else {
      setAppState("auth");
    }
  };

  useEffect(() => {
    if (isInitialized && isRecoveryMode) {
      setAppState("auth");
    }
  }, [isRecoveryMode, isInitialized]);

  return (
    <main className="relative bg-black min-h-screen selection:bg-white selection:text-black">
      <AnimatePresence mode="wait">
        {appState === "splash" && (
          <SplashScreen key="splash" onComplete={handleSplashComplete} />
        )}
        
        {appState === "auth" && (
          <AuthScreen key="auth" onLogin={() => setAppState("transition")} />
        )}

        {appState === "transition" && (
          <EntryTransition key="transition" onComplete={() => setAppState("home")} />
        )}

        {appState === "home" && (
          <OnboardingGuard>
            <MockHome key="home" />
            <ProfileCompletionPopup key="profile-popup" />
          </OnboardingGuard>
        )}
      </AnimatePresence>
    </main>
  );
}
