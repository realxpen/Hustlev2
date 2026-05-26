import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useUpdateProfile } from './useUpdateProfile';

export function useAvatarUpload() {
  const { user } = useAuthStore();
  const { updateProfile } = useUpdateProfile();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const uploadImage = async (file: File, type: 'avatar' | 'cover' = 'avatar'): Promise<string | null> => {
    if (!user) {
      setError('User is not authenticated');
      return null;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return null;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      setError('Image must be less than 5MB');
      return null;
    }

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${type}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      setUploadProgress(50);

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      setUploadProgress(100);

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Save to profile
      const updateData = type === 'avatar' ? { avatar_url: publicUrl } : { cover_url: publicUrl };
      const success = await updateProfile(updateData);
      
      if (!success) {
        throw new Error('Failed to update profile with new image URL');
      }

      return publicUrl;
    } catch (err: any) {
      console.error(`${type} upload error:`, err);
      setError(err.message || `Failed to upload ${type}`);
      return null;
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  return {
    uploadImage,
    isUploading,
    uploadProgress,
    error,
    clearError: () => setError(null)
  };
}
