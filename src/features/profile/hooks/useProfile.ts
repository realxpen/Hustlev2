import { useEffect } from 'react';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../../auth/stores/useAuthStore';

export function useProfile() {
  const { profile, isLoading, error, fetchProfile, checkUsernameAvailability } = useProfileStore();
  const { user } = useAuthStore();

  useEffect(() => {
    if (user && !profile && !isLoading && !error) {
      fetchProfile(user.id);
    }
  }, [user, profile, isLoading, error, fetchProfile]);

  return {
    profile,
    isLoading,
    error,
    refreshProfile: () => user ? fetchProfile(user.id) : Promise.resolve(),
    checkUsernameAvailability
  };
}
