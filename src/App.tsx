/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SplashScreen from "./components/SplashScreen";
import AuthScreen from "./components/AuthScreen";
import EntryTransition from "./components/EntryTransition";
import MockHome from "./components/MockHome";
import { useAuth } from "./features/auth";
import { useAppOrchestrator } from "./stores/useAppOrchestrator";
import { OnboardingGuard } from "./features/onboarding";
import ProfileCompletionPopup from "./features/profile/components/ProfileCompletionPopup";

type AppState = "splash" | "auth" | "transition" | "home";

export default function App() {
  const [appState, setAppState] = useState<AppState>("splash");
  const { session, isInitialized, initialize, isRecoveryMode } = useAuth();
  const { initializeRealtime } = useAppOrchestrator();

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (session) {
      const cleanup = initializeRealtime() as unknown as () => void;
      return () => cleanup?.();
    }
  }, [session, initializeRealtime]);

  // Handle splash completion and session redirection strategies
  const handleSplashComplete = () => {
    if (session && !isRecoveryMode) {
      setAppState("transition");
    } else {
      setAppState("auth");
    }
  };

  // Safe fallback effect: automatically step past splash or auth screen 
  // if an initialized session arrives mid-lifecycle
  useEffect(() => {
    if (isInitialized && session && !isRecoveryMode && (appState === "splash" || appState === "auth")) {
      setAppState("transition");
    }
  }, [isInitialized, session, isRecoveryMode, appState]);

  useEffect(() => {
    if (isInitialized && isRecoveryMode) {
      setAppState("auth");
    }
  }, [isRecoveryMode, isInitialized]);

  return (
    <main className="relative bg-black min-h-screen selection:bg-white selection:text-black overflow-x-hidden">
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
            <div className="w-full h-full animate-fade-in">
              <MockHome key="home" />
              <ProfileCompletionPopup key="profile-popup" />
            </div>
          </OnboardingGuard>
        )}
      </AnimatePresence>
    </main>
  );
}