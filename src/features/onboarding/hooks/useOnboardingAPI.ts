import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../auth';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useOnboardingStore } from '../stores/useOnboardingStore';

export function useOnboardingAPI() {
  const { user } = useAuth();
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const { role, interests, setLoading, setError } = useOnboardingStore();

  const completeOnboarding = async () => {
    if (!user) return;
    
    setLoading(true);
    setError(null);
    
    try {
      // 1. Update Profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          role: role ?? null,
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

      // 3. Refresh Profile in Auth Store
      await fetchProfile(user.id);
      
    } catch (err: any) {
      console.error('Onboarding error:', err);
      setError(err.message || 'Failed to complete onboarding. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateProgress = async (step: string) => {
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

  return { completeOnboarding, updateProgress };
}
