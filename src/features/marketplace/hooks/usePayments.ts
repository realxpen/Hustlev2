import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { usePaymentStore } from '../stores/usePaymentStore';
import { useBookingStore } from '../stores/useBookingStore';
import { mapBookingDTO } from './useBookings';

export function usePayments() {
  const { user } = useAuthStore();
  const { transactions, setTransactions, updateEscrowState } = usePaymentStore();
  const { bookings, setBookings } = useBookingStore();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initiatePayment = async (bookingId: string, amount: number, method: 'card' | 'wallet' | 'crypto_simulated') => {
    if (!user) {
      setError('Must be logged in to pay');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      // Simulate creating a payment record
      const { data: paymentInfo, error: paymentError } = await supabase
        .from('payments')
        .insert({
          booking_id: bookingId,
          user_id: user.id,
          amount,
          method,
          status: 'pending',
        })
        .select()
        .single();

      if (paymentError) throw paymentError;
      
      setTransactions([paymentInfo, ...transactions]);
      return paymentInfo;
    } catch (err: any) {
      console.error('Error initiating payment:', err);
      setError(err.message || 'Failed to initiate payment');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const confirmPayment = async (paymentId: string, bookingId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      // 1. Update Payment Status to successful
      const { data: paymentData, error: paymentError } = await supabase
        .from('payments')
        .update({ status: 'successful' })
        .eq('id', paymentId)
        .select()
        .single();

      if (paymentError) throw paymentError;

      // 2. Update Booking payment_status to paid
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .update({ payment_status: 'paid' })
        .eq('id', bookingId)
        .select()
        .single();
        
      if (bookingError) throw bookingError;

      const mappedBookingData = mapBookingDTO(bookingData);

      setTransactions(transactions.map(t => t.id === paymentId ? paymentData : t));
      setBookings(bookings.map(b => b.id === bookingId ? mappedBookingData as any : b));
      updateEscrowState(bookingId, 'locked');

      return true;
    } catch (err: any) {
      console.error('Error confirming payment:', err);
      setError(err.message || 'Failed to confirm payment');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const releaseEscrow = async (bookingId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: releaseError } = await supabase
        .from('bookings')
        .update({ escrow_status: 'released' })
        .eq('id', bookingId)
        .select()
        .single();

      if (releaseError) throw releaseError;
      
      const mappedBookingData = mapBookingDTO(data);

      setBookings(bookings.map(b => b.id === bookingId ? mappedBookingData : b));
      updateEscrowState(bookingId, 'released');
      return true;
    } catch (err: any) {
      console.error('Error releasing escrow:', err);
      setError(err.message || 'Failed to release escrow');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  const refundPayment = async (bookingId: string) => {
    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: refundError } = await supabase
        .from('bookings')
        .update({ escrow_status: 'refunded', payment_status: 'failed' }) // Marking failed roughly means not paid through
        .eq('id', bookingId)
        .select()
        .single();

      if (refundError) throw refundError;

      const mappedBookingData = mapBookingDTO(data);

      setBookings(bookings.map(b => b.id === bookingId ? mappedBookingData : b));
      updateEscrowState(bookingId, 'refunded');
      return true;
    } catch (err: any) {
      console.error('Error refunding payment:', err);
      setError(err.message || 'Failed to refund payment');
      return false;
    } finally {
      setIsProcessing(false);
    }
  };

  return {
    initiatePayment,
    confirmPayment,
    releaseEscrow,
    refundPayment,
    isProcessing,
    error,
    clearError: () => setError(null)
  };
}
