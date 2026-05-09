/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { AnimatePresence } from "motion/react";
import SplashScreen from "./components/SplashScreen";
import AuthScreen from "./components/AuthScreen";
import EntryTransition from "./components/EntryTransition";
import MockHome from "./components/MockHome";

type AppState = "splash" | "auth" | "transition" | "home";

export default function App() {
  const [appState, setAppState] = useState<AppState>("splash");

  return (
    <main className="relative bg-black min-h-screen selection:bg-white selection:text-black">
      <AnimatePresence mode="wait">
        {appState === "splash" && (
          <SplashScreen key="splash" onComplete={() => setAppState("auth")} />
        )}
        
        {appState === "auth" && (
          <AuthScreen key="auth" onLogin={() => setAppState("transition")} />
        )}

        {appState === "transition" && (
          <EntryTransition key="transition" onComplete={() => setAppState("home")} />
        )}

        {appState === "home" && (
          <MockHome key="home" />
        )}
      </AnimatePresence>
    </main>
  );
}
