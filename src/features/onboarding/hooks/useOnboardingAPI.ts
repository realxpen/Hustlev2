import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useOnboardingStore } from '../stores/useOnboardingStore';

export function useOnboardingAPI() {
  const { user } = useAuth();
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const { interests, setLoading, setError } = useOnboardingStore();

  const saveInterestsAPI = async (selectedInterests: string[]) => {
    try {
      await fetch('/api/onboarding/interests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id || 'default-guest-hustler'}`
        },
        body: JSON.stringify({ interests: selectedInterests })
      });
    } catch (e) {
      console.warn('Failed to call Express server interests API:', e);
    }
  };

  const saveLocationAPI = async (allowed: boolean, coords?: { latitude: number; longitude: number }) => {
    try {
      await fetch('/api/onboarding/location', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${user?.id || 'default-guest-hustler'}`
        },
        body: JSON.stringify({ locationAllowed: allowed, coords })
      });
    } catch (e) {
      console.warn('Failed to call Express server location API:', e);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    // Support demo user/guest login flow locally
    if (user.id === 'demo-hustler-id') {
      const { setProfile, profile } = useAuthStore.getState();
      if (profile) {
        setProfile({
          ...profile,
          has_completed_onboarding: true
        });
      }
      setLoading(false);
      return;
    }
    
    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
          .from('profiles')
          .update({
            interests,
            has_completed_onboarding: true
          } as any)
          .eq('id', user.id);

      if (profileError) throw profileError;

      // 2. Update Onboarding Status
      const { error: statusError } = await supabase
        .from('onboarding_status')
        .upsert({
          user_id: user.id,
          step: 'completed',
          completed_at: new Date().toISOString()
        } as any);
        
      if (statusError) throw statusError;

      // 3. Notify Express server endpoint
      try {
        await fetch('/api/onboarding/complete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${user.id}`
          }
        });
      } catch (backendError) {
        console.warn('Failed to call Express complete API fallback:', backendError);
      }

      // 4. Refresh Profile in Auth Store
      await fetchProfile(user.id);
      
    } catch (err: any) {
      console.error('Onboarding database update failed, falling back to local state to prevent lockout:', err);
      
      // Ultimate fallback: update local store so user is not stuck/blocked
      const { setProfile, profile } = useAuthStore.getState();
      if (profile) {
        setProfile({
          ...profile,
          has_completed_onboarding: true
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (step: string) => {
    // Notify Express backend of current step progress
    try {
      await fetch('/api/onboarding/progress', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${user?.id || 'default-guest-hustler'}`
        }
      });
    } catch (e) {
      // Silently fall back
    }

    if (!user) return;
    try {
      await supabase
        .from('onboarding_status')
        .upsert({
          user_id: user.id,
          step
        } as any);
    } catch (e) {
      console.error('Failed to update progress', e);
    }
  };

  return { completeOnboarding, updateProgress, saveInterestsAPI, saveLocationAPI };
}
