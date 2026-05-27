import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useBookingStore } from '../stores/useBookingStore';
import type { BookingStatus, EscrowStatus } from '../../bookings/types';

export const mapBookingDTO = (dbBooking: any): any => ({
  id: dbBooking.id,
  clientId: dbBooking.buyer_id,
  hustlerId: dbBooking.seller_id,
  serviceId: dbBooking.listing_id,
  status: dbBooking.status as BookingStatus,
  price: dbBooking.total_price,
  escrowStatus: dbBooking.escrow_status as EscrowStatus,
  milestones: dbBooking.milestones || [],
  scheduledAt: dbBooking.created_at || '',
  createdAt: dbBooking.created_at,
  updatedAt: dbBooking.updated_at,
});

export function useBookings(role: 'client' | 'hustler' = 'client') {
  const { user } = useAuthStore();
  const { bookings, isLoading, error, setBookings, setLoading, setError } = useBookingStore();

  useEffect(() => {
    if (!user) {
      setBookings([]);
      return;
    }

    const fetchBookings = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const column = role === 'hustler' ? 'seller_id' : 'buyer_id';
        const { data, error: fetchError } = await supabase
          .from('bookings')
          .select('*, milestones(*)')
          .eq(column, user.id)
          .order('created_at', { ascending: false });

        if (fetchError) throw fetchError;
        setBookings((data || []).map(mapBookingDTO));
      } catch (err: any) {
        console.error('Error fetching bookings:', err);
        setError(err.message || 'Failed to fetch bookings');
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, [user, role, setBookings, setLoading, setError]);

  return {
    bookings,
    isLoading,
    error,
  };
}
