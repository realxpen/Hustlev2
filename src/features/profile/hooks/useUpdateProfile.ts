import { useState } from 'react';
import { useProfileStore } from '../stores/useProfileStore';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import type { Profile } from '../../../types/index';

export function useUpdateProfile() {
  const { updateProfile: updateProfileState, checkUsernameAvailability } = useProfileStore();
  const { user } = useAuthStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateProfile = async (updateData: Partial<Profile>) => {
    if (!user) {
      setError('User is not authenticated');
      return false;
    }

    setIsUpdating(true);
    setError(null);

    try {
      // If updating username, check availability first
      if (updateData.username) {
        const isAvailable = await checkUsernameAvailability(updateData.username);
        if (!isAvailable) {
          throw new Error('Username is already taken');
        }
      }

      await updateProfileState(user.id, updateData);
      return true;
    } catch (err: any) {
      console.error('Update profile error:', err);
      setError(err.message || 'Failed to update profile');
      return false;
    } finally {
      setIsUpdating(false);
    }
  };

  return {
    updateProfile,
    isUpdating,
    error,
    clearError: () => setError(null)
  };
}
