import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { Wallet, DbTransaction, EscrowAccount } from '../../../types';

interface WalletState {
  wallet: Wallet | null;
  transactions: DbTransaction[];
  escrows: EscrowAccount[];
  isLoading: boolean;
  error: string | null;

  fetchWallet: () => Promise<Wallet | null>;
  fetchTransactions: () => Promise<DbTransaction[]>;
  fetchEscrowAccounts: () => Promise<EscrowAccount[]>;
  initiateDeposit: (amount: number) => Promise<{ success: boolean; transactionId?: string; error?: string }>;
  initiateWithdrawal: (amount: number, destinationAccount?: string) => Promise<{ success: boolean; transactionId?: string; error?: string }>;
  holdEscrowFunds: (bookingId: string, amount: number) => Promise<boolean>;
  releaseEscrowFunds: (bookingId: string, clientId: string, hustlerId: string, totalAmount: number, payoutAmount: number, platformFee: number) => Promise<boolean>;
  refundEscrowFunds: (bookingId: string, clientId: string, amount: number) => Promise<boolean>;
  refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
  wallet: null,
  transactions: [],
  escrows: [],
  isLoading: false,
  error: null,

  fetchWallet: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let { data, error: fetchError } = await supabase
        .from('wallets')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          // Wallet doesn't exist yet, call RPC to construct it safely/atomically
          const { data: walletId, error: rpcError } = await (supabase.rpc as any)('secure_ensure_wallet', {
            p_user_id: user.id
          });
          if (rpcError) throw rpcError;

          const { data: newWallet, error: newFetchError } = await supabase
            .from('wallets')
            .select('*')
            .eq('id', walletId)
            .single();

          if (newFetchError) throw newFetchError;
          data = newWallet;
        } else {
          throw fetchError;
        }
      }

      set({ wallet: data as Wallet, error: null });
      return data as Wallet;
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch wallet' });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  fetchTransactions: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ transactions: (data || []) as DbTransaction[] });
      return (data || []) as DbTransaction[];
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch transactions' });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  fetchEscrowAccounts: async () => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('escrow_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ escrows: (data || []) as EscrowAccount[] });
      return (data || []) as EscrowAccount[];
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch escrow accounts' });
      return [];
    } finally {
      set({ isLoading: false });
    }
  },

  initiateDeposit: async (amount: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const reference = `dep_${user.id}_${Date.now()}`;
      const { data: transactionId, error: rpcErr } = await (supabase.rpc as any)('secure_process_deposit', {
        p_user_id: user.id,
        p_amount: amount,
        p_reference: reference,
        p_metadata: { source: 'deposit_flow' }
      });

      if (rpcErr) throw rpcErr;

      await get().fetchWallet();
      await get().fetchTransactions();

      return { success: true, transactionId: transactionId as string };
    } catch (err: any) {
      set({ error: err.message || 'Deposit failed' });
      return { success: false, error: err.message || 'Deposit failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  initiateWithdrawal: async (amount: number, destinationAccount?: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const reference = `wd_${user.id}_${Date.now()}`;
      const { data: transactionId, error: rpcErr } = await (supabase.rpc as any)('secure_process_withdrawal', {
        p_user_id: user.id,
        p_amount: amount,
        p_reference: reference,
        p_metadata: { destination: destinationAccount || 'default' }
      });

      if (rpcErr) throw rpcErr;

      await get().fetchWallet();
      await get().fetchTransactions();

      return { success: true, transactionId: transactionId as string };
    } catch (err: any) {
      set({ error: err.message || 'Withdrawal failed' });
      return { success: false, error: err.message || 'Withdrawal failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  holdEscrowFunds: async (bookingId: string, amount: number) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const reference = `esc_hold_${bookingId}_${Date.now()}`;
      const { error: rpcErr } = await (supabase.rpc as any)('secure_hold_escrow', {
        p_user_id: user.id,
        p_booking_id: bookingId,
        p_amount: amount,
        p_reference: reference
      });

      if (rpcErr) throw rpcErr;

      await get().fetchWallet();
      await get().fetchTransactions();
      await get().fetchEscrowAccounts();

      return true;
    } catch (err: any) {
      set({ error: err.message || 'Escrow lock failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  releaseEscrowFunds: async (bookingId: string, clientId: string, hustlerId: string, totalAmount: number, payoutAmount: number, platformFee: number) => {
    set({ isLoading: true, error: null });
    try {
      const reference = `esc_rel_${bookingId}_${Date.now()}`;
      const { error: rpcErr } = await (supabase.rpc as any)('secure_release_escrow', {
        p_client_id: clientId,
        p_hustler_id: hustlerId,
        p_booking_id: bookingId,
        p_total_amount: totalAmount,
        p_payout_amount: payoutAmount,
        p_platform_fee: platformFee,
        p_reference: reference
      });

      if (rpcErr) throw rpcErr;

      await get().fetchWallet();
      await get().fetchTransactions();
      await get().fetchEscrowAccounts();

      return true;
    } catch (err: any) {
      set({ error: err.message || 'Escrow release failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  refundEscrowFunds: async (bookingId: string, clientId: string, amount: number) => {
    set({ isLoading: true, error: null });
    try {
      const reference = `esc_ref_${bookingId}_${Date.now()}`;
      const { error: rpcErr } = await (supabase.rpc as any)('secure_refund_escrow', {
        p_client_id: clientId,
        p_booking_id: bookingId,
        p_amount: amount,
        p_reference: reference
      });

      if (rpcErr) throw rpcErr;

      await get().fetchWallet();
      await get().fetchTransactions();
      await get().fetchEscrowAccounts();

      return true;
    } catch (err: any) {
      set({ error: err.message || 'Escrow refund failed' });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  refreshBalance: async () => {
    await get().fetchWallet();
  }
}));
