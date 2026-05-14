import { AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import AuthScreen from "../components/AuthScreen";
import EntryTransition from "../components/EntryTransition";
import SplashScreen from "../components/SplashScreen";
import MockHome from "../features/home/MockHome";
import { type AppStage } from "./app-flow";
import { useAppFlow } from "./useAppFlow";

export default function App() {
  const { appStage, goNext } = useAppFlow();

  const screens = {
    splash: <SplashScreen key="splash" onComplete={goNext} />,
    auth: <AuthScreen key="auth" onLogin={goNext} />,
    transition: <EntryTransition key="transition" onComplete={goNext} />,
    home: <MockHome key="home" />,
  } satisfies Record<AppStage, ReactNode>;

  return (
    <main className="relative min-h-screen bg-black selection:bg-white selection:text-black">
      <AnimatePresence mode="wait">{screens[appStage]}</AnimatePresence>
    </main>
  );
}
