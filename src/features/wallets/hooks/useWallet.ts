import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useWalletStore } from '../stores/useWalletStore';

export function useWallet() {
  const { user } = useAuthStore();
  const { 
    wallet, 
    isLoading, 
    error, 
    fetchWallet, 
    refreshBalance, 
    initiateDeposit, 
    initiateWithdrawal,
    swapFunds
  } = useWalletStore();

  useEffect(() => {
    if (!user) return;

    fetchWallet();

    // Subscribe to Postgres real-time event stream for wallets updates
    const channel = supabase.channel(`public:wallets:${user.id}`)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'wallets',
        filter: `user_id=eq.${user.id}`
      }, () => {
        fetchWallet();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, fetchWallet]);

  return {
    wallet,
    isLoading,
    error,
    fetchWallet,
    refreshBalance,
    depositFunds: initiateDeposit,
    withdrawFunds: initiateWithdrawal,
    swapFunds
  };
}
