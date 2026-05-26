import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../../lib/supabase';
import { useBookingEngineStore, type BookingDelivery, type EscrowTransaction } from './store';
import type { Booking, BookingStatus } from '../../types';

export function useBookings(role: 'client' | 'hustler' = 'client') {
  const { bookings, isLoading, error, fetchBookings } = useBookingEngineStore();

  useEffect(() => {
    fetchBookings(role);
  }, [role, fetchBookings]);

  // Handle Supabase Realtime subscription to reload state upon updates instantly
  useEffect(() => {
    const channel = supabase
      .channel('realtime_bookings_updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        () => {
          fetchBookings(role);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [role, fetchBookings]);

  return {
    bookings,
    isLoading,
    error,
    refreshBookings: () => fetchBookings(role)
  };
}

export function useBookingDetails(bookingId: string | null) {
  const { updateBookingStatus, openDispute } = useBookingEngineStore();
  const [booking, setBooking] = useState<Booking | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDetails = useCallback(async () => {
    if (!bookingId) {
      setBooking(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('bookings')
        .select('*, services(*)')
        .eq('id', bookingId)
        .single();

      if (err) throw err;
      
      // Load standard DTO formatting
      const { mapBookingDTO } = await import('../marketplace/hooks/useBookings');
      setBooking(mapBookingDTO(data));
    } catch (e: any) {
      setError(e.message || 'Failed to fetch details');
    } finally {
      setLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    fetchDetails();
  }, [fetchDetails]);

  // Realtime update listener for detail pages
  useEffect(() => {
    if (!bookingId) return;

    const channel = supabase
      .channel(`realtime_booking_detail_${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'bookings', filter: `id=eq.${bookingId}` },
        () => {
          fetchDetails();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, fetchDetails]);

  const accept = async () => {
    if (!bookingId) return;
    await updateBookingStatus(bookingId, 'accepted' as BookingStatus);
  };

  const reject = async () => {
    if (!bookingId) return;
    await updateBookingStatus(bookingId, 'rejected' as BookingStatus);
  };

  const markInProgress = async () => {
    if (!bookingId) return;
    await updateBookingStatus(bookingId, 'in_progress' as BookingStatus);
  };

  return {
    booking,
    isLoading: loading,
    error,
    accept,
    reject,
    markInProgress,
    openDispute: () => bookingId && openDispute(bookingId),
    refresh: fetchDetails
  };
}

export function useEscrow(bookingId: string | null) {
  const { paymentAdapters, approveDelivery } = useBookingEngineStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [escrowTransactions, setEscrowTransactions] = useState<EscrowTransaction[]>([]);

  const fetchTransactions = useCallback(async () => {
    if (!bookingId) return;
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('escrow_transactions')
        .select('*')
        .eq('booking_id', bookingId);

      if (err) throw err;
      setEscrowTransactions(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch transactions');
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) fetchTransactions();
  }, [bookingId, fetchTransactions]);

  const payForBooking = async (adapterId: string, totalAmount: number) => {
    if (!bookingId) return false;
    setIsProcessing(true);
    setError(null);
    try {
      const adapter = paymentAdapters.find(a => a.id === adapterId);
      if (!adapter) throw new Error('Unsupported payment method chosen');

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      if (adapterId === 'wallet') {
        const reference = `esc_hold_${bookingId}_${Date.now()}`;
        const { error: rpcErr } = await (supabase.rpc as any)('secure_hold_escrow', {
          p_user_id: user.id,
          p_booking_id: bookingId,
          p_amount: totalAmount,
          p_reference: reference
        });
        if (rpcErr) throw rpcErr;
      } else {
        const result = await adapter.initiatePayment(bookingId, totalAmount);
        if (!result.success) throw new Error(result.error || 'Payment transaction rejected');

        // Update payment details and status list
        const { error: patchError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'paid',
            escrow_status: 'held',
            status: 'accepted'
          })
          .eq('id', bookingId);

        if (patchError) throw patchError;
      }

      // Create an escrow audit trace
      const { data: bookingData } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
      
      if (bookingData && user) {
        await supabase.from('escrow_transactions').insert({
          booking_id: bookingId,
          payer_id: user.id,
          receiver_id: bookingData.hustler_id,
          amount: totalAmount,
          status: 'held'
        });
      }

      await fetchTransactions();
      return true;
    } catch (e: any) {
      setError(e.message || 'Escrow funding failed');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const release = async () => {
    if (!bookingId) return false;
    setIsProcessing(true);
    setError(null);
    try {
      const success = await approveDelivery(bookingId);
      if (success) await fetchTransactions();
      return success;
    } catch (e: any) {
      setError(e.message || 'Failed to release funds');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    payForBooking,
    releaseEscrowFunds: release,
    isProcessing,
    error,
    escrowTransactions,
    paymentAdapters
  };
}

export function useDelivery(bookingId: string | null) {
  const { submitDelivery } = useBookingEngineStore();
  const [deliveries, setDeliveries] = useState<BookingDelivery[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchDeliveries = useCallback(async () => {
    if (!bookingId) return;
    setIsLoading(true);
    setError(null);
    try {
      const { data, error: err } = await supabase
        .from('booking_deliveries')
        .select('*')
        .eq('booking_id', bookingId)
        .order('delivered_at', { ascending: false });

      if (err) throw err;
      setDeliveries(data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to fetch deliveries');
    } finally {
      setIsLoading(false);
    }
  }, [bookingId]);

  useEffect(() => {
    if (bookingId) {
      fetchDeliveries();

      // Realtime subscription for submissions
      const channel = supabase
        .channel(`realtime_deliveries_${bookingId}`)
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'booking_deliveries', filter: `booking_id=eq.${bookingId}` },
          () => {
            fetchDeliveries();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [bookingId, fetchDeliveries]);

  const deliver = async (message: string, fileUrl?: string) => {
    if (!bookingId) return null;
    setError(null);
    const result = await submitDelivery(bookingId, message, fileUrl);
    if (result) await fetchDeliveries();
    return result;
  };

  return {
    deliveries,
    deliver,
    isLoading,
    error
  };
}
