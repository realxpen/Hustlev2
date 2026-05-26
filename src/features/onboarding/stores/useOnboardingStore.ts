import { create } from 'zustand';

export type OnboardingStep = 'welcome' | 'role' | 'interests';
export type UserRoleType = 'client' | 'hustler' | 'both' | null;

interface OnboardingState {
  step: OnboardingStep;
  role: UserRoleType;
  interests: string[];
  isLoading: boolean;
  error: string | null;
  
  setStep: (step: OnboardingStep) => void;
  setRole: (role: UserRoleType) => void;
  toggleInterest: (interest: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 'welcome',
  role: null,
  interests: [],
  isLoading: false,
  error: null,
  
  setStep: (step) => set({ step }),
  setRole: (role) => set({ role }),
  toggleInterest: (interest) => set((state) => ({
    interests: state.interests.includes(interest)
      ? state.interests.filter(i => i !== interest)
      : [...state.interests, interest]
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ step: 'welcome', role: null, interests: [], error: null, isLoading: false })
}));
