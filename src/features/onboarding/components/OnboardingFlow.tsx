import { useEffect } from 'react';
import { AnimatePresence } from 'motion/react';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { useOnboardingAPI } from '../hooks/useOnboardingAPI';
import { WelcomeStep } from './steps/WelcomeStep';
import { RoleStep } from './steps/RoleStep';
import { InterestsStep } from './steps/InterestsStep';

export function OnboardingFlow() {
  const store = useOnboardingStore();
  const { completeOnboarding, updateProgress } = useOnboardingAPI();
  
  useEffect(() => {
    updateProgress(store.step);
  }, [store.step, updateProgress]);

  const handleComplete = async () => {
    try {
      await completeOnboarding();
      // Auth store refresh will re-evaluate OnboardingGuard and transition to MockHome
    } catch (e) {
      // Error is handled in store and displayed in UI
    }
  };

  const renderStep = () => {
    switch (store.step) {
      case 'welcome':
        return <WelcomeStep key="welcome" onNext={() => store.setStep('role')} />;
      case 'role':
        return <RoleStep key="role" onNext={() => store.setStep('interests')} onBack={() => store.setStep('welcome')} />;
      case 'interests':
         return <InterestsStep key="interests" onBack={() => store.setStep('role')} onComplete={handleComplete} />;
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col overflow-hidden">
      <AnimatePresence mode="wait">
        {renderStep()}
      </AnimatePresence>
    </div>
  );
}
