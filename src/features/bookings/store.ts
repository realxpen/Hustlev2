import { create } from 'zustand';
import { supabase } from '../../lib/supabase';
import type { Booking, BookingStatus, EscrowStatus } from '../../types';
import { mapBookingDTO } from '../marketplace/hooks/useBookings';

export interface BookingDelivery {
  id: string;
  booking_id: string;
  message: string | null;
  file_url: string | null;
  delivered_at: string;
}

export interface EscrowTransaction {
  id: string;
  booking_id: string;
  payer_id: string;
  receiver_id: string;
  amount: number;
  platform_fee: number;
  status: 'pending' | 'held' | 'released' | 'refunded';
  created_at: string;
}

// Future Payment Architecture Adapter Interface
export interface PaymentProviderAdapter {
  id: string;
  name: string;
  initiatePayment: (bookingId: string, amount: number) => Promise<{ success: boolean; transactionId?: string; error?: string }>;
}

interface NewBookingState {
  bookings: Booking[];
  activeBooking: Booking | null;
  deliveries: BookingDelivery[];
  escrowStatus: Record<string, EscrowStatus>;
  isLoading: boolean;
  error: string | null;
  paymentAdapters: PaymentProviderAdapter[];

  fetchBookings: (role?: 'client' | 'hustler') => Promise<void>;
  createBooking: (payload: {
    gigId?: string;
    serviceId: string;
    hustlerId: string;
    totalAmount: number;
    scheduledDate?: string;
    requirements?: string;
    deliveryDeadline?: string;
    conversationId?: string;
  }) => Promise<Booking | null>;
  updateBookingStatus: (bookingId: string, status: BookingStatus) => Promise<Booking | null>;
  submitDelivery: (bookingId: string, message: string, fileUrl?: string) => Promise<BookingDelivery | null>;
  approveDelivery: (bookingId: string) => Promise<boolean>;
  openDispute: (bookingId: string) => Promise<boolean>;
}

export const useBookingEngineStore = create<NewBookingState>((set, get) => ({
  bookings: [],
  activeBooking: null,
  deliveries: [],
  escrowStatus: {},
  isLoading: false,
  error: null,
  paymentAdapters: [
    {
      id: 'stripe',
      name: 'Stripe Adapter',
      initiatePayment: async (bookingId, amount) => {
        console.log(`[Stripe Adapter] Initiated charge of $${amount} for booking ${bookingId}`);
        return { success: true, transactionId: `stripe_tx_${Date.now()}` };
      }
    },
    {
      id: 'wallet',
      name: 'Internal Wallet Adapter',
      initiatePayment: async (bookingId, amount) => {
        console.log(`[Internal Wallet Adapter] Reserving $${amount} for booking ${bookingId}`);
        return { success: true, transactionId: `wallet_tx_${Date.now()}` };
      }
    },
    {
      id: 'crypto',
      name: 'Crypto & Pi Protocol',
      initiatePayment: async (bookingId, amount) => {
        console.log(`[Crypto Adapter] Awaiting blockchain validation for $${amount}`);
        return { success: true, transactionId: `crypto_tx_${Date.now()}` };
      }
    }
  ],

  fetchBookings: async (role = 'client') => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const column = role === 'hustler' ? 'seller_id' : 'buyer_id';
      const { data, error } = await (supabase as any)
        .from('bookings')
        .select(`
          *,
          milestones(*),
          seller:profiles!bookings_seller_id_fkey(*),
          buyer:profiles!bookings_buyer_id_fkey(*)
        `)
        .eq(column, user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      set({ bookings: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  createBooking: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('bookings')
        .insert({
          listing_id: payload.serviceId || payload.gigId || null,
          buyer_id: user.id,
          seller_id: payload.hustlerId,
          total_price: payload.totalAmount,
          unit_price: payload.totalAmount,
          quantity: 1,
          listing_type: 'service',
          status: 'pending',
          escrow_status: 'held',
          payment_status: 'paid',
          notes: payload.requirements || null
        })
        .select()
        .single();

      if (error) throw error;

      // Add to notifications handled by DB trigger mostly now, but keeping for legacy compatibility
      
      set(state => ({ bookings: [data, ...state.bookings], activeBooking: data }));
      return data;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  updateBookingStatus: async (bookingId, status) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .select()
        .single();

      if (error) throw error;

      set(state => {
        const updatedBookings = state.bookings.map(b => b.id === bookingId ? data : b);
        const updatedActive = state.activeBooking?.id === bookingId ? data : state.activeBooking;
        return { bookings: updatedBookings, activeBooking: updatedActive };
      });

      return data;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  submitDelivery: async (bookingId, message, fileUrl) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: booking, error: fetchError } = await (supabase as any)
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) throw new Error('Booking not found');
      if (booking.seller_id !== user.id) throw new Error('Only the hired hustler can submit work');

      // Insert delivery record
      const { data: delivery, error: insertError } = await (supabase as any)
        .from('booking_deliveries')
        .insert({
          booking_id: bookingId,
          message,
          file_url: fileUrl || null
        })
        .select()
        .single();

      if (insertError) throw insertError;

      // Update booking status to 'completed' (logical)
      await get().updateBookingStatus(bookingId, 'completed' as BookingStatus);

      set(state => ({ deliveries: [delivery, ...state.deliveries] }));
      return delivery;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isLoading: false });
    }
  },

  approveDelivery: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: booking, error: fetchError } = await (supabase as any)
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) throw new Error('Booking not found');
      if (booking.buyer_id !== user.id) throw new Error('Only the buyer can approve completion');

      // Release Escrow funds & complete booking status atomically
      const reference = `rel_${bookingId}_${Date.now()}`;
      const { error: rpcErr } = await (supabase as any).rpc('secure_release_escrow', {
        p_client_id: booking.buyer_id,
        p_hustler_id: booking.seller_id,
        p_booking_id: bookingId,
        p_total_amount: booking.total_price,
        p_payout_amount: booking.total_price, // simplified
        p_platform_fee: 0,
        p_reference: reference
      });

      if (rpcErr) throw rpcErr;

      // Update Local State
      await get().fetchBookings();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  },

  openDispute: async (bookingId) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data: booking, error: fetchError } = await (supabase as any)
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchError || !booking) throw new Error('Booking not found');

      // Mark the booking status as disputed & escrow remains held (protective)
      const { error: updateError } = await (supabase as any)
        .from('bookings')
        .update({
          status: 'disputed' as any, // adding disputed to UI union if it exists
        })
        .eq('id', bookingId);

      if (updateError) throw updateError;

      // Send system message in linked chat
      if (booking.conversation_id) {
        await supabase.from('messages').insert({
          conversation_id: booking.conversation_id,
          sender_id: user.id,
          content: `[System] A formal dispute has been opened for this booking. Admin investigation triggered.`,
          message_type: 'text'
        });
      }

      await get().fetchBookings();
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    } finally {
      set({ isLoading: false });
    }
  }
}));
