import { useMemo } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../../../lib/supabase';
import { SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';

export function useAuth() {
  const store = useAuthStore();

  // Extract variables with default fallback selectors securely
  const session = store.session;
  const user = store.user;
  const profile = store.profile;
  const isLoading = store.isLoading;
  const error = store.error;
  const isInitialized = store.isInitialized;
  const isRecoveryMode = store.isRecoveryMode;
  const isHustlerVerified = store.isHustlerVerified;
  const isAgentVerified = store.isAgentVerified;

  // Wrap actions with useMemo to maintain perfect functional signature references across renders
  const authActions = useMemo(() => {
    const { initialize, updateProfile, setError, setLoading, setRecoveryMode } = store;

    const signUp = async (credentials: SignUpWithPasswordCredentials) => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.auth.signUp(credentials);
        if (error) throw error;
        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    };

    const signIn = async (credentials: SignInWithPasswordCredentials) => {
      try {
        setLoading(true);
        setError(null);
        const { data, error } = await supabase.auth.signInWithPassword(credentials);
        if (error) throw error;
        return data;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    };

    const signOut = async () => {
      try {
        setLoading(true);
        setError(null);
        await store.signOut();
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    };

    const resetPassword = async (email: string) => {
      try {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/`,
        });
        if (error) throw error;
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    };

    const updatePassword = async (password: string) => {
      try {
        setLoading(true);
        setError(null);
        const { error } = await supabase.auth.updateUser({ password });
        if (error) throw error;
        setRecoveryMode(false);
      } catch (err: any) {
        setError(err.message);
        throw err;
      } finally {
        setLoading(false);
      }
    };

    return {
      initialize,
      signUp,
      signIn,
      signOut,
      resetPassword,
      updatePassword,
      updateProfile,
      setRecoveryMode,
      setError,
      setLoading
    };
  }, [store]);

  return {
    session,
    user,
    profile,
    isLoading,
    error,
    isInitialized,
    isRecoveryMode,
    isHustlerVerified,
    isAgentVerified,
    ...authActions
  };
}