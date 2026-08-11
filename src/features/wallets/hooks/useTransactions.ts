import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useWalletStore } from '../stores/useWalletStore';

export function useTransactions() {
  const { user } = useAuthStore();
  const { transactions, fetchTransactions, isLoading, error } = useWalletStore();

  useEffect(() => {
    if (!user) return;

    fetchTransactions();

    // Subscribe to database transactions updates in real-time
    const channel = supabase.channel(`public:transactions:${user.id}`)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'transactions',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchTransactions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchTransactions]);

  return { transactions, fetchTransactions, isLoading, error };
}
