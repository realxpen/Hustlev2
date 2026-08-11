import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Profile } from '../../../types/index';

interface ProfileCompletionState {
  isProfileIncomplete: boolean;
  missingFields: string[];
  completionPercentage: number;
  isDismissed: boolean;
  
  checkProfileCompletion: (profile: Profile | null) => void;
  dismissCompletionFlow: () => void;
  resetDismissal: () => void;
}

const REQUIRED_FIELDS = ['username', 'date_of_birth', 'role', 'interests'];
const OTHER_FIELDS = ['full_name', 'avatar_url', 'bio', 'location', 'profession'];
const BASE_FIELDS = ['email', 'id', 'created_at'];

export const useProfileCompletionStore = create<ProfileCompletionState>()(
  persist(
    (set) => ({
      isProfileIncomplete: false,
      missingFields: [],
      completionPercentage: 0,
      isDismissed: false,

      checkProfileCompletion: (profile: Profile | null) => {
        if (!profile) {
          set({ 
            isProfileIncomplete: false, 
            missingFields: [], 
            completionPercentage: 0 
          });
          return;
        }

        const missing: string[] = [];
        let filledCount = 0;
        
        // Count base fields as filled
        BASE_FIELDS.forEach(field => {
          if (profile[field as keyof Profile]) {
            filledCount++;
          }
        });
        
        REQUIRED_FIELDS.forEach(field => {
          const value = profile[field as keyof Profile];
          if (value === null || value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) {
            missing.push(field);
          } else {
            filledCount++;
          }
        });

        OTHER_FIELDS.forEach(field => {
          const value = profile[field as keyof Profile];
          if (value !== null && value !== undefined && value !== '' && !(Array.isArray(value) && value.length === 0)) {
            filledCount++;
          }
        });

        const totalItems = REQUIRED_FIELDS.length + OTHER_FIELDS.length + BASE_FIELDS.length;
        const completionPercentage = Math.max(0, Math.min(100, Math.round((filledCount / totalItems) * 100)));

        set({
          isProfileIncomplete: missing.length > 0,
          missingFields: missing,
          completionPercentage,
        });
      },

      dismissCompletionFlow: () => set({ isDismissed: true }),
      resetDismissal: () => set({ isDismissed: false }),
    }),
    {
      name: 'profile-completion-storage', // name of the item in the storage (must be unique)
      partialize: (state) => ({ 
        isProfileIncomplete: state.isProfileIncomplete,
        missingFields: state.missingFields,
        completionPercentage: state.completionPercentage
      }), // persist derived state to avoid UI flashes before load, but do NOT persist isDismissed so it asks again on next reload/session
    }
  )
);
