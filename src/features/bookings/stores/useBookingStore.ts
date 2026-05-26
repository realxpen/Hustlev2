import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { Booking, BookingStatus, ListingType } from '../types';

interface BookingState {
  buyerOrders: Booking[];
  sellerOrders: Booking[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBuyerOrders: (status?: BookingStatus) => Promise<void>;
  fetchSellerOrders: (status?: BookingStatus) => Promise<void>;
  fetchMilestones: (bookingId: string) => Promise<any[]>;
  getMostRecentActiveBooking: () => Booking | null;
  createBooking: (params: {
    listingId: string;
    listingType: ListingType;
    quantity: number;
    notes?: string;
  }) => Promise<{ data: Booking | null; error: any }>;
  updateBookingStatus: (bookingId: string, newStatus: BookingStatus) => Promise<void>;
  requestMilestoneRelease: (milestoneId: string) => Promise<void>;
  releaseMilestone: (milestoneId: string) => Promise<void>;
}

export const useBookingStore = create<BookingState>((set, get) => ({
  buyerOrders: [],
  sellerOrders: [],
  isLoading: false,
  error: null,

  fetchBuyerOrders: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('bookings')
        .select(`
          *,
          seller:profiles!bookings_seller_id_fkey(full_name, avatar_url, hustle_name, primary_skill),
          milestones(*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      set({ buyerOrders: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSellerOrders: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      let query = supabase
        .from('bookings')
        .select(`
          *,
          buyer:profiles!bookings_buyer_id_fkey(full_name, avatar_url, hustle_name),
          milestones(*)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data, error } = await query;
      if (error) throw error;

      set({ sellerOrders: data || [] });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchMilestones: async (bookingId) => {
    const { data, error } = await (supabase as any)
      .from('milestones')
      .select('*')
      .eq('booking_id', bookingId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return data || [];
  },
  
  getMostRecentActiveBooking: () => {
    const { buyerOrders, sellerOrders } = get();
    const activeStatuses: BookingStatus[] = ['pending', 'accepted', 'in_progress'];
    
    const activeBuyer = buyerOrders.find(b => activeStatuses.includes(b.status));
    const activeSeller = sellerOrders.find(b => activeStatuses.includes(b.status));
    
    // Prioritize newest active
    if (activeBuyer && activeSeller) {
      return new Date(activeBuyer.created_at) > new Date(activeSeller.created_at) ? activeBuyer : activeSeller;
    }
    return activeBuyer || activeSeller || null;
  },

  createBooking: async ({ listingId, listingType, quantity, notes }) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // 1. Fetch listing details and validate
      const table = (listingType === 'service' ? 'services' : listingType === 'product' ? 'products' : 'training') as any;
      const { data: listing, error: listingError } = await supabase
        .from(table)
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError || !listing) throw new Error('Listing not found');
      const activeListing = listing as any;
      
      if (!activeListing.is_active) throw new Error('This listing is currently inactive');
      if (activeListing.owner_id === user.id) throw new Error('You cannot book your own listing');

      // 2. Additional validation for products (inventory)
      if (listingType === 'product') {
        if (activeListing.inventory_count < quantity) {
          throw new Error(`Only ${activeListing.inventory_count} items left in stock`);
        }
      }

      // 3. Calculate price
      const unitPrice = activeListing.base_price || activeListing.price || 0;
      const totalPrice = unitPrice * quantity;

      // 4. Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          buyer_id: user.id,
          seller_id: activeListing.owner_id,
          listing_id: listingId,
          listing_type: listingType,
          quantity,
          unit_price: unitPrice,
          total_price: totalPrice,
          status: 'pending',
          notes
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // 5. Training specific: Create enrollment (preliminary)
      if (listingType === 'training') {
        await supabase.from('enrollments').insert({
          user_id: user.id,
          training_id: listingId,
          booking_id: booking.id,
          status: 'active'
        });
      }

      // Refresh orders
      get().fetchBuyerOrders();

      return { data: booking, error: null };
    } catch (err: any) {
      set({ error: err.message });
      return { data: null, error: err };
    } finally {
      set({ isLoading: false });
    }
  },

  updateBookingStatus: async (bookingId, newStatus) => {
    set({ isLoading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Fetch current booking to check permissions
      const { data: current, error: fetchErr } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single();

      if (fetchErr || !current) throw new Error('Booking not found');

      // VALIDATION RULES
      const isSeller = current.seller_id === user.id;
      const isBuyer = current.buyer_id === user.id;

      // Only seller can update to operational statuses
      const sellerOnlyStatuses: BookingStatus[] = ['accepted', 'rejected', 'in_progress', 'completed'];
      if (sellerOnlyStatuses.includes(newStatus) && !isSeller) {
        throw new Error('Only the seller can update this status');
      }

      // Buyer can cancel before acceptance
      if (newStatus === 'cancelled') {
        if (isBuyer && current.status !== 'pending') {
          throw new Error('You can only cancel a pending booking');
        }
        if (!isBuyer && !isSeller) {
          throw new Error('Permission denied');
        }
      }

      // Completed orders locked from invalid rollback (simple check)
      if (current.status === 'completed' && newStatus !== 'refunded') {
        throw new Error('Completed orders cannot be moved back to active states');
      }

      const { error } = await supabase
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      // Refresh orders
      get().fetchBuyerOrders();
      get().fetchSellerOrders();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  requestMilestoneRelease: async (milestoneId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await (supabase as any)
        .from('milestones')
        .update({ status: 'awaiting_approval', delivered_at: new Date().toISOString() })
        .eq('id', milestoneId);
      
      if (error) throw error;
      
      // Refresh current data
      get().fetchBuyerOrders();
      get().fetchSellerOrders();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  releaseMilestone: async (milestoneId) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await (supabase as any)
        .from('milestones')
        .update({ status: 'released', released_at: new Date().toISOString() })
        .eq('id', milestoneId);
      
      if (error) throw error;
      
      // In a real system, this would trigger a ledger movement
      // Refresh current data
      get().fetchBuyerOrders();
      get().fetchSellerOrders();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  }
}));
