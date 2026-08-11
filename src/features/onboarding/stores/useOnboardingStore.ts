import { create } from 'zustand';

export type OnboardingStep = 'welcome' | 'interests' | 'location' | 'account' | 'success';

interface OnboardingState {
  step: OnboardingStep;
  interests: string[];
  locationAllowed: boolean | null; // true = allowed, false = "not now" / denied, null = not decided
  locationCoords: { latitude: number; longitude: number } | null;
  isLoading: boolean;
  error: string | null;
  
  setStep: (step: OnboardingStep) => void;
  toggleInterest: (interest: string) => void;
  setInterests: (interests: string[]) => void;
  setLocationAllowed: (allowed: boolean) => void;
  setLocationCoords: (coords: { latitude: number; longitude: number } | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useOnboardingStore = create<OnboardingState>((set) => ({
  step: 'welcome',
  interests: [],
  locationAllowed: null,
  locationCoords: null,
  isLoading: false,
  error: null,
  
  setStep: (step) => set({ step }),
  toggleInterest: (interest) => set((state) => ({
    interests: state.interests.includes(interest)
      ? state.interests.filter(i => i !== interest)
      : [...state.interests, interest]
  })),
  setInterests: (interests) => set({ interests }),
  setLocationAllowed: (locationAllowed) => set({ locationAllowed }),
  setLocationCoords: (locationCoords) => set({ locationCoords }),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
  reset: () => set({ step: 'welcome', interests: [], locationAllowed: null, locationCoords: null, error: null, isLoading: false })
}));
