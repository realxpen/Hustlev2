import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useBookingStore } from '../stores/useBookingStore';
import type { Booking } from '../../../types';
import { mapBookingDTO } from './useBookings';

export function useBookingActions() {
  const { user } = useAuthStore();
  const { bookings, setBookings, setActiveBooking } = useBookingStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const PLATFORM_FEE_PERCENTAGE = 0.10; // 10%

  const updateBookingState = (updatedBooking: Booking) => {
    setBookings(bookings.map(b => b.id === updatedBooking.id ? updatedBooking : b));
    setActiveBooking(updatedBooking);
  };

  const createBooking = async (listingId: string, sellerId: string, totalPrice: number, notes?: string) => {
    if (!user) {
      setError('Must be logged in to book');
      return null;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const { data, error: insertError } = await (supabase as any)
        .from('bookings')
        .insert({
          listing_id: listingId,
          buyer_id: user.id,
          seller_id: sellerId,
          listing_type: 'service', // Default for this hook context
          total_price: totalPrice,
          unit_price: totalPrice,
          quantity: 1,
          status: 'pending',
          escrow_status: 'held',
          payment_status: 'paid',
          notes
        })
        .select()
        .single();

      if (insertError) throw insertError;
      
      const mappedData = mapBookingDTO(data);
      setBookings([mappedData, ...bookings]);
      return mappedData;
    } catch (err: any) {
      console.error('Error creating booking:', err);
      setError(err.message || 'Failed to create booking');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const updateBookingStatus = async (bookingId: string, status: string, checkRole: 'hustler' | 'client') => {
    if (!user) return null;
    setIsProcessing(true);
    setError(null);

    try {
      const conditionColumn = checkRole === 'hustler' ? 'seller_id' : 'buyer_id';
      
      const { data, error: updateError } = await (supabase as any)
        .from('bookings')
        .update({ status })
        .eq('id', bookingId)
        .eq(conditionColumn, user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      const mappedData = mapBookingDTO(data);
      updateBookingState(mappedData);
      return mappedData;
    } catch (err: any) {
      console.error(`Error updating booking status to ${status}:`, err);
      setError(err.message || 'Failed to update booking status');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const acceptBooking = (bookingId: string) => updateBookingStatus(bookingId, 'accepted', 'hustler');
  const rejectBooking = (bookingId: string) => updateBookingStatus(bookingId, 'cancelled', 'hustler');
  const startJob = (bookingId: string) => updateBookingStatus(bookingId, 'in_progress', 'hustler');
  
  // Client marks as completed
  const completeJob = async (bookingId: string) => {
    if (!user) return null;
    setIsProcessing(true);
    setError(null);

    try {
      // First update generic status
      const { data, error: updateError } = await (supabase as any)
        .from('bookings')
        .update({ 
          status: 'completed',
          escrow_status: 'released' // Logical escrow release
        })
        .eq('id', bookingId)
        .eq('buyer_id', user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      
      const mappedData = mapBookingDTO(data);
      updateBookingState(mappedData);
      return mappedData;
    } catch (err: any) {
      console.error('Error completing job:', err);
      setError(err.message || 'Failed to complete job');
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const cancelBooking = async (bookingId: string, role: 'hustler' | 'client') => updateBookingStatus(bookingId, 'cancelled', role);

  return {
    createBooking,
    acceptBooking,
    rejectBooking,
    startJob,
    completeJob,
    cancelBooking,
    isProcessing,
    error,
    clearError: () => setError(null)
  };
}
