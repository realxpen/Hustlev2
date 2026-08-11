import { create } from 'zustand';
import type { Payment } from '../../../types';

interface PaymentState {
  transactions: Payment[];
  escrowState: Record<string, string>; // mapping booking_id to escrow_status
  isLoading: boolean;
  error: string | null;

  setTransactions: (transactions: Payment[]) => void;
  updateEscrowState: (bookingId: string, status: string) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  transactions: [],
  escrowState: {},
  isLoading: false,
  error: null,

  setTransactions: (transactions) => set({ transactions }),
  updateEscrowState: (bookingId, status) =>
    set((state) => ({
      escrowState: { ...state.escrowState, [bookingId]: status },
    })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),
}));
