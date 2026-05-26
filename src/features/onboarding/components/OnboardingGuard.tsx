import { ReactNode } from 'react';
import { useAuth } from '../../auth';
import { OnboardingFlow } from './OnboardingFlow';

export function OnboardingGuard({ children }: { children: ReactNode }) {
  const { profile, isLoading } = useAuth();
  
  if (isLoading || !profile) {
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }
  
  // profile.has_completed_onboarding handles the main check.
  if (!profile.has_completed_onboarding) {
    return <OnboardingFlow />;
  }
  
  return <>{children}</>;
}
