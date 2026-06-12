import { useEffect } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { useOnboardingStore } from '../stores/useOnboardingStore';
import { useOnboardingAPI } from '../hooks/useOnboardingAPI';
import { WelcomeStep } from './steps/WelcomeStep';
import { InterestsStep } from './steps/InterestsStep';
import { LocationStep } from './steps/LocationStep';
import { AccountStep } from './steps/AccountStep';
import { SuccessStep } from './steps/SuccessStep';
import { useAuth } from '../../auth';

export function OnboardingFlow() {
  const store = useOnboardingStore();
  const { user } = useAuth();
  const { completeOnboarding, updateProgress } = useOnboardingAPI();
  
  useEffect(() => {
    updateProgress(store.step);
  }, [store.step, updateProgress]);

  const handleComplete = async () => {
    try {
      await completeOnboarding();
      // Auth store refresh will re-evaluate OnboardingGuard and transition to MockHome
    } catch (e) {
      console.error('Failed to complete onboarding:', e);
    }
  };

  const renderStep = () => {
    switch (store.step) {
      case 'welcome':
        return (
          <WelcomeStep 
            key="welcome" 
            onNext={() => store.setStep('interests')} 
          />
        );
      case 'interests':
        return (
          <InterestsStep 
            key="interests" 
            onNext={() => store.setStep('location')} 
            onBack={() => store.setStep('welcome')} 
          />
        );
      case 'location':
        return (
          <LocationStep 
            key="location" 
            onNext={() => {
              // If already logged in, bypass create-account step
              if (user) {
                store.setStep('success');
              } else {
                store.setStep('account');
              }
            }} 
            onBack={() => store.setStep('interests')} 
          />
        );
      case 'account':
        return (
          <AccountStep 
            key="account" 
            onNext={() => store.setStep('success')} 
            onBack={() => store.setStep('location')} 
          />
        );
      case 'success':
        return (
          <SuccessStep 
            key="success" 
            onComplete={handleComplete} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 bg-black text-white z-50 flex flex-col overflow-hidden">
      {/* Background radial gradients for cinematic layout */}
      <div className="absolute inset-0 bg-[#050505] pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-[600px] h-[400px] bg-brand-primary/[0.03] blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[300px] h-[300px] bg-brand-accent/[0.03] blur-[80px] rounded-full pointer-events-none" />
      <div className="grain-overlay" />

      <AnimatePresence mode="wait">
        <motion.div 
          key={store.step}
          className="flex-1 flex flex-col overflow-y-auto no-scrollbar relative z-10"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {renderStep()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
