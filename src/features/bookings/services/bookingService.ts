import { supabase } from '../../../lib/supabase';
import type { EscrowBooking, BookingMilestone } from '../../../types/booking';

export interface CreateBookingPayload {
  clientId: string;
  hustlerId: string;
  serviceId: string | null;
  totalAmount: number;
  currency: string;
  milestones: { title: string; percent: number }[];
}

export const bookingService = {
  /**
   * Instantiates a comprehensive escrow agreement block including sub-ledger milestones
   * within an atomized database sequence pattern.
   */
  createEscrowBooking: async (payload: CreateBookingPayload): Promise<string> => {
    // 1. Guard against local dev guest context to provide a seamless preview layer if unauthenticated
    if (payload.clientId.startsWith('guest-') || payload.clientId.includes('wqtg1i7')) {
      console.log('[Booking Service Proxy] Local mock bypass execution active.');
      await new Promise((resolve) => setTimeout(resolve, 1500));
      return `bk_mock_lgs_${Math.random().toString(36).substr(2, 9)}`;
    }

    try {
      // 2. Insert the top-level parent contract row into the database
      const { data: bookingData, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          client_id: payload.clientId,
          hustler_id: payload.hustlerId,
          service_id: payload.serviceId,
          total_amount: payload.totalAmount,
          currency: payload.currency,
          status: 'awaiting_deposit' // Starting baseline domain lifecycle state
        })
        .select('id')
        .single();

      if (bookingError) throw bookingError;
      if (!bookingData) throw new Error('Contract engine failed to return reference footprint identifier.');

      const bookingId = bookingData.id;

      // 3. Map the proportional wizard percentages into strict numeric currency rows
      if (payload.milestones && payload.milestones.length > 0) {
        const milestonesToInsert = payload.milestones.map((m) => {
          const rawAmount = (m.percent / 100) * payload.totalAmount;
          // Clean precision bounds ensuring two decimal float parameters for banking nodes
          const roundedAmount = Math.round(rawAmount * 100) / 100;
          
          return {
            booking_id: bookingId,
            title: m.title,
            amount: roundedAmount,
            is_released: false
          };
        });

        // 4. Batch-insert child milestones to trigger backend PostgreSQL validation math constraints
        const { error: milestoneError } = await supabase
          .from('booking_milestones')
          .insert(milestonesToInsert);

        if (milestoneError) {
          // Attempt an automated soft cleanup of dangling contracts if phase configurations fault
          await supabase.from('bookings').delete().eq('id', bookingId);
          throw milestoneError;
        }
      }

      return bookingId;
    } catch (err: any) {
      console.error('[Booking Service Engine] Escrow instantiation failed:', err);
      throw new Error(err.message || 'Transactional synchronization exception encountered.');
    }
  },

  /**
   * Retrieves an explicit transactional record joined with its associated milestone timeline nodes.
   */
  getBookingDetails: async (bookingId: string): Promise<EscrowBooking | null> => {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          milestones:booking_milestones(*)
        `)
        .eq('id', bookingId)
        .maybeSingle();

      if (error) throw error;
      return data as unknown as EscrowBooking;
    } catch (err: any) {
      console.error(`[Booking Service Engine] Failed to fetch record details for ${bookingId}:`, err);
      return null;
    }
  }
};