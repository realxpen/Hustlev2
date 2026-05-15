import { AnimatePresence } from "motion/react";
import type { ReactNode } from "react";
import AuthScreen from "../components/AuthScreen";
import EntryTransition from "../components/EntryTransition";
import SplashScreen from "../components/SplashScreen";
import MockHome from "../features/home/MockHome";
import { type AppStage } from "./app-flow";
import { useAppFlow } from "./useAppFlow";
import { useAppSession } from "../features/home/hooks/useAppSession";

export default function App() {


  const screens = {
    splash: <SplashScreen key="splash" onComplete={goNext} />,
   auth: (
  <AuthScreen
    key="auth"
    onLogin={() => {
      goNext(); // move to transition stage
    }}
  />
),
    transition: <EntryTransition key="transition" onComplete={goNext} />,
    home: <MockHome key="home" />,
  } satisfies Record<AppStage, ReactNode>;

  const { loading, user } = useAppSession();
  if (loading) {
  return <SplashScreen />;
}
const appStage: AppStage =
  loading
    ? "splash"
    : !user
    ? "auth"
    : "home";
  return (
    <main className="relative min-h-screen bg-black selection:bg-white selection:text-black">
      <AnimatePresence mode="wait">{screens[appStage]}</AnimatePresence>
    </main>
  );
}
