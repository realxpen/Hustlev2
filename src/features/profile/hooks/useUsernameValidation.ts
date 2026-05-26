import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { debounce } from 'lodash';
import { useAuthStore } from '../../auth/stores/useAuthStore';

export const RESERVED_USERNAMES = [
  'admin', 'support', 'hustle', 'official', 'root', 'system', 'team',
  'api', 'app', 'beta', 'test', 'help', 'info', 'dev', 'home'
];

export function useUsernameValidation(initialUsername: string = '') {
  const [username, setUsername] = useState(initialUsername);
  const [isValidating, setIsValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);
  const { user } = useAuthStore();

  const validateUsername = useCallback(async (value: string) => {
    if (!value) {
      setError('Username is required');
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    if (value.length < 3) {
      setError('Must be at least 3 characters');
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    if (value.length > 20) {
      setError('Cannot exceed 20 characters');
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    if (!/^[a-z0-9_]+$/.test(value)) {
      setError('Only lowercase letters, numbers, and underscores allowed');
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    if (RESERVED_USERNAMES.includes(value)) {
      setError('This username is reserved');
      setIsValid(false);
      setIsValidating(false);
      return;
    }

    try {
      const { data, error: dbError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('username', value)
        .maybeSingle();

      if (dbError) throw dbError;

      if (data && data.id !== user?.id) {
        setError('Username is already taken');
        setIsValid(false);
      } else {
        setError(null);
        setIsValid(true);
      }
    } catch (err) {
      console.error('Error validating username:', err);
      // In case of error (network), we might want to let them submit and have the unique constraint catch it
      // or at least not block completely. But let's be safe and show an error.
      setError('Failed to check availability');
      setIsValid(false);
    } finally {
      setIsValidating(false);
    }
  }, [user?.id]);

  const debouncedValidate = useCallback(
    debounce((value: string) => {
      validateUsername(value);
    }, 500),
    [validateUsername]
  );

  useEffect(() => {
    setIsValidating(true);
    debouncedValidate(username);
    return () => {
      debouncedValidate.cancel();
    };
  }, [username, debouncedValidate]);

  const handleChange = (val: string) => {
    // Enforce lowercase, trip whitespace, only valid chars if possible or just let format validation handle it
    const formatted = val.toLowerCase().replace(/\s+/g, '').replace(/[^a-z0-9_]/g, '');
    setUsername(formatted);
    // Error is cleared on type temporarily until denounce kicks in
    setError(null);
    setIsValid(false);
    setIsValidating(true);
  };

  return {
    username,
    handleChange,
    isValidating,
    error,
    isValid,
    setUsername
  };
}
