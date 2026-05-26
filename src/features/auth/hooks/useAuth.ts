import { useEffect } from 'react';
import { useAuthStore } from '../stores/useAuthStore';
import { supabase } from '../../../lib/supabase';
import { SignUpWithPasswordCredentials, SignInWithPasswordCredentials } from '@supabase/supabase-js';

export function useAuth() {
  const {
    session,
    user,
    profile,
    isLoading,
    error,
    isInitialized,
    isRecoveryMode,
    initialize,
    setError,
    setLoading,
    setRecoveryMode
  } = useAuthStore();

  useEffect(() => {
    initialize();
  }, [initialize]);

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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
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
    session,
    user,
    profile,
    isLoading,
    error,
    isInitialized,
    isRecoveryMode,
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    setRecoveryMode,
    initialize,
    setError,
    setLoading
  };
}
