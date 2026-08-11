import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { useAppOrchestrator } from '../../../stores/useAppOrchestrator';
import type { Wallet, DbTransaction, EscrowAccount } from '../../../types';
import type { AppEventType } from '../../../types/orchestration';

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
  swapFunds: (fromAmount: number, fromCurrency: string, toAmount: number, toCurrency: string) => Promise<{ success: boolean; transactionId?: string; error?: string }>;
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

      // 1. Fetch escrow accounts for this user (indirectly via bookings)
      // Since relationships might be missing in schema cache, we fetch and filter
      const { data: escrowData, error: escrowError } = await supabase
        .from('escrow_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (escrowError) throw escrowError;

      // 2. Fetch bookings participant is involved in
      const { data: bookingsData, error: bookingsError } = await supabase
        .from('bookings')
        .select('id, buyer_id, seller_id, status, total_price, notes')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`);

      if (bookingsError) throw bookingsError;

      // 3. Join in memory
      const bookingMap = new Map(bookingsData.map(b => [b.id, b]));
      
      const enrichedEscrows = (escrowData || [])
        .filter(e => bookingMap.has(e.booking_id))
        .map(e => ({
          ...e,
          booking: bookingMap.get(e.booking_id)
        }));

      set({ escrows: enrichedEscrows });
      return enrichedEscrows;
    } catch (err: any) {
      console.error("[WalletStore] fetchEscrowAccounts failed:", err);
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

      useAppOrchestrator.getState().emitEvent({
        event_type: 'wallet_deposit',
        actor_id: user.id,
        entity_id: transactionId as string,
        entity_type: 'wallet',
        payload: { amount, reference, sub_type: 'deposit' }
      });

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

      let eventType: AppEventType = 'wallet_deposit';
      let notifDesc = '';
      let subType = 'withdrawal';
      
      if (destinationAccount?.startsWith('Swap')) {
        subType = 'swap';
        notifDesc = destinationAccount;
      } else if (destinationAccount?.startsWith('Transfer')) {
        subType = 'transfer';
        notifDesc = destinationAccount;
      } else {
        subType = 'withdrawal';
        notifDesc = `Withdrawal to ${destinationAccount}`;
      }

      useAppOrchestrator.getState().emitEvent({
        event_type: 'wallet_withdrawal' as any,
        actor_id: user.id,
        entity_id: transactionId as string,
        entity_type: 'wallet',
        payload: { amount, reference, sub_type: subType, description: notifDesc }
      });

      return { success: true, transactionId: transactionId as string };
    } catch (err: any) {
      set({ error: err.message || 'Withdrawal failed' });
      return { success: false, error: err.message || 'Withdrawal failed' };
    } finally {
      set({ isLoading: false });
    }
  },

  swapFunds: async (fromAmount, fromCurrency, toAmount, toCurrency) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const reference = `swap_${user.id}_${Date.now()}`;
      const { data: transactionId, error: rpcErr } = await (supabase.rpc as any)('secure_process_swap', {
        p_user_id: user.id,
        p_from_amount: fromAmount,
        p_from_currency: fromCurrency,
        p_to_amount: toAmount,
        p_to_currency: toCurrency,
        p_reference: reference
      });

      if (rpcErr) throw rpcErr;

      await get().fetchWallet();
      await get().fetchTransactions();

      useAppOrchestrator.getState().emitEvent({
        event_type: 'wallet_withdrawal' as any, // Using existing type for now or add 'wallet_swap'
        actor_id: user.id,
        entity_id: transactionId as string,
        entity_type: 'wallet',
        payload: { 
          from_amount: fromAmount, 
          from_currency: fromCurrency, 
          to_amount: toAmount, 
          to_currency: toCurrency, 
          sub_type: 'swap',
          description: `Swap ${fromAmount} ${fromCurrency} → ${toCurrency}`
        }
      });

      return { success: true, transactionId: transactionId as string };
    } catch (err: any) {
      set({ error: err.message || 'Swap failed' });
      return { success: false, error: err.message || 'Swap failed' };
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

      useAppOrchestrator.getState().emitEvent({
        event_type: 'escrow_released',
        actor_id: clientId,
        target_id: hustlerId,
        entity_id: bookingId,
        entity_type: 'booking',
        payload: { total_amount: totalAmount, payout_amount: payoutAmount }
      });

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
