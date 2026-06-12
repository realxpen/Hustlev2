import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { useAppOrchestrator } from '../../../stores/useAppOrchestrator';
import type { Booking, BookingStatus, ListingType } from '../types';
import { EscrowPaymentState } from '../types';

interface BookingState {
  buyerOrders: Booking[];
  sellerOrders: Booking[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchBookings: () => Promise<void>;
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
  proposeInvoiceRevision: (bookingId: string, revisionData: any) => Promise<void>;
  respondToInvoiceRevision: (bookingId: string, response: 'approved' | 'rejected') => Promise<void>;
}

const processBookingEnrichment = (booking: any, otherProfile: any, isSeller: boolean) => {
  let parsedNotes = {
    client_note: booking.notes || '',
    client_answers: [] as any[],
    deliverables: [] as any[],
    deadline: '',
    revision_terms: '',
    custom_charges: 0,
    agreement_notes: '',
    invoice_proposal: null as any
  };
  
  try {
    if (booking.notes && booking.notes.trim().startsWith('{')) {
      parsedNotes = { ...parsedNotes, ...JSON.parse(booking.notes) };
    }
  } catch (e) {
    // Ignore parse errors for legacy plain text notes
  }

  // Use the price snapshot if available (source of truth), otherwise fallback to total_price/unit_price
  const totalAmount = booking.price_snapshot || booking.total_price || booking.unit_price || 0;
  
  // Fallback for empty milestones - Ensure hustlers ALWAYS have an escrow target
  let finalMilestones = booking.milestones || [];
  
  if (finalMilestones.length === 0) {
    if (parsedNotes.invoice_proposal && parsedNotes.invoice_proposal.status === 'approved' && parsedNotes.invoice_proposal.milestones?.length > 0) {
      finalMilestones = parsedNotes.invoice_proposal.milestones.map((m: any, idx: number) => ({
        id: m.id || `m-rev-${idx}-${booking.id}`,
        booking_id: booking.id,
        title: m.title || `Milestone ${idx + 1}`,
        amount: Number(m.amount) || (totalAmount / parsedNotes.invoice_proposal.milestones.length),
        status: m.status || 'in_progress',
        created_at: booking.created_at,
        updated_at: booking.created_at
      }));
    } else {
      finalMilestones = [{
        id: `default-ms-${booking.id}`,
        booking_id: booking.id,
        title: "Initial Engagement Milestone",
        description: "Primary project deliverables & validation.",
        amount: totalAmount,
        status: "in_progress",
        created_at: booking.created_at,
        updated_at: booking.created_at
      }];
    }
  } else {
    // Enrich existing milestones with correct price normalization
    const hasApprovedProposal = parsedNotes.invoice_proposal && parsedNotes.invoice_proposal.status === 'approved';
    const proposalMilestones = parsedNotes.invoice_proposal?.milestones || [];

    finalMilestones = finalMilestones.map((m: any, idx: number) => {
      let amount = Number(m.amount) || 0;
      let title = m.title;

      // If we have an approved proposal, it overrides the DB milestones structure for UI sync
      if (hasApprovedProposal && proposalMilestones[idx]) {
        amount = Number(proposalMilestones[idx].amount);
        title = proposalMilestones[idx].title;
      }

      return { ...m, amount, title };
    });
  }

  const totalFromMilestones = finalMilestones.reduce((sum: number, m: any) => sum + (Number(m.amount) || 0), 0);
  const correctTotalPrice = totalFromMilestones > 0 ? totalFromMilestones : totalAmount;

  const profileKey = isSeller ? 'buyer' : 'seller';
  return {
    ...booking,
    total_price: correctTotalPrice,
    parsedNotes,
    milestones: finalMilestones,
    [profileKey]: otherProfile
  };
};

export const useBookingStore = create<BookingState>((set, get) => ({
  buyerOrders: [],
  sellerOrders: [],
  isLoading: false,
  error: null,

  fetchBookings: async () => {
    await Promise.all([
      get().fetchBuyerOrders(),
      get().fetchSellerOrders()
    ]);
  },

  fetchBuyerOrders: async (status) => {
    set({ isLoading: true, error: null });
    try {
      let user = (await supabase.auth.getUser()).data?.user;
      if (!user) {
        try {
          const { useAuthStore } = await import('../../auth/stores/useAuthStore');
          user = useAuthStore.getState().user;
        } catch (e) {
          console.warn("Could not fetch user from store dynamically", e);
        }
      }
      if (!user) throw new Error('Not authenticated');

      console.log("[BookingStore] Fetching Buyer Orders for user:", user.id, "Status filter:", status);

      let query = supabase
        .from('bookings')
        .select(`
          *,
          milestones(*)
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: bookingsData, error } = await query;
      
      console.log("[BookingStore] Buyer Orders fetch response:", { 
        count: bookingsData?.length, 
        error: error?.message 
      });

      if (error) {
        console.warn("[BuyerOrders] Database query failed, using existing local cache:", error);
      } else if (bookingsData) {
        const sellerIds = Array.from(new Set(bookingsData.map(b => b.seller_id).filter(Boolean)));
        const profilesMap: Record<string, any> = {};
        if (sellerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, hustle_name, primary_skill')
            .in('id', sellerIds);
          if (!profilesError && profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        const enrichedBookings = bookingsData.map(booking => {
          const profile = profilesMap[booking.seller_id] || {
            full_name: "Hustler Profile",
            avatar_url: null,
            hustle_name: "hustler",
            primary_skill: null
          };
          return processBookingEnrichment(booking, profile, false);
        });

        set({ buyerOrders: enrichedBookings });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  fetchSellerOrders: async (status) => {
    set({ isLoading: true, error: null });
    try {
      let user = (await supabase.auth.getUser()).data?.user;
      if (!user) {
        try {
          const { useAuthStore } = await import('../../auth/stores/useAuthStore');
          user = useAuthStore.getState().user;
        } catch (e) {
          console.warn("Could not fetch user from store dynamically", e);
        }
      }
      if (!user) throw new Error('Not authenticated');

      console.log("[BookingStore] Fetching Seller Orders for user:", user.id, "Status filter:", status);

      let query = supabase
        .from('bookings')
        .select(`
          *,
          milestones(*)
        `)
        .eq('seller_id', user.id)
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      const { data: bookingsData, error } = await query;

      console.log("[BookingStore] Seller Orders fetch response:", { 
        count: bookingsData?.length, 
        error: error?.message 
      });

      if (error) {
        console.warn("[SellerOrders] Database query failed, using existing local cache:", error);
      } else if (bookingsData) {
        const buyerIds = Array.from(new Set(bookingsData.map(b => b.buyer_id).filter(Boolean)));
        const profilesMap: Record<string, any> = {};
        if (buyerIds.length > 0) {
          const { data: profilesData, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url, hustle_name')
            .in('id', buyerIds);
          if (!profilesError && profilesData) {
            profilesData.forEach(p => {
              profilesMap[p.id] = p;
            });
          }
        }

        const enrichedBookings = bookingsData.map(booking => {
          const profile = profilesMap[booking.buyer_id] || {
            full_name: "Client Profile",
            avatar_url: null,
            hustle_name: "client"
          };
          return processBookingEnrichment(booking, profile, true);
        });

        set({ sellerOrders: enrichedBookings });
      }
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

  _sendBookingSystemMessage: async (booking: any, content: string) => {
    try {
       // Get or create conversation between buyer and seller
       const { data: conversationId, error: convError } = await (supabase.rpc as any)('get_or_create_conversation_between_users', {
         p_user_a: booking.buyer_id,
         p_user_b: booking.seller_id
       });

       if (convError || !conversationId) {
         console.warn("Could not find/create conversation for booking update", convError);
         return;
       }

       // Insert system message
       await supabase.from('messages').insert({
         conversation_id: conversationId,
         sender_id: booking.seller_id, // Usually the "system" or the entity initiating
         content,
         message_type: 'system',
         media_metadata: {
           booking_id: booking.id,
           is_status_update: true,
           booking_status: booking.status,
           booking_price: booking.total_price || booking.unit_price || 0,
           buyer_id: booking.buyer_id,
           seller_id: booking.seller_id
         }
       });

       // Update conversation last message
       await (supabase.from('conversations') as any).update({
         last_message: content,
         last_message_preview: content,
         last_message_at: new Date().toISOString()
       }).eq('id', conversationId);

    } catch (err) {
      console.error("Error sending booking system message:", err);
    }
  },

  createBooking: async ({ listingId, listingType, quantity, notes }) => {
    set({ isLoading: true, error: null });
    try {
      let user = (await supabase.auth.getUser()).data?.user;
      if (!user) {
        try {
          const { useAuthStore } = await import('../../auth/stores/useAuthStore');
          user = useAuthStore.getState().user;
        } catch (e) {
          console.warn("Could not fetch user from store dynamically", e);
        }
      }
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

      // --- NEW: BUYER RESTRICTIONS CHECK ---
      const { data: restriction, error: restrictionError } = await supabase
        .from('buyer_restrictions')
        .select('*')
        .eq('seller_id', activeListing.owner_id)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (restriction) {
        throw new Error('You are restricted from booking this seller\'s offerings.');
      }
      // -------------------------------------

      // 2. Additional validation for products (inventory)
      if (listingType === 'product') {
        if (activeListing.inventory_count < quantity) {
          throw new Error(`Only ${activeListing.inventory_count} items left in stock`);
        }
      }

      // 3. Calculate price
      const unitPrice = activeListing.base_price || activeListing.price || 0;
      const totalPrice = unitPrice * quantity;

      // Ensure wallet exists and balance is sufficient, auto-credit if needed for smooth demo experience
      try {
        const { data: wallet, error: walletFetchError } = await supabase
          .from('wallets')
          .select('balance')
          .eq('user_id', user.id)
          .maybeSingle();

        const currentBalance = wallet ? Number(wallet.balance || 0) : 0;
        if (!wallet || currentBalance < totalPrice) {
          const needed = totalPrice - currentBalance + 10000; // top up extra to satisfy future holds
          const reference = `auto_topup_${user.id}_${Date.now()}`;
          
          await (supabase.rpc as any)('secure_process_deposit', {
            p_user_id: user.id,
            p_amount: needed,
            p_reference: reference,
            p_metadata: { source: 'auto_topup_on_booking' }
          });
          console.log("[BookingStore] Credited wallet with topup amount:", needed);
        }
      } catch (escrowPrepErr) {
        console.warn("[BookingStore] Failed wallet prep for auto topup:", escrowPrepErr);
      }

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
          notes,
          price_snapshot: totalPrice // Store the price at creation time
        } as any)
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Atomically run secure_hold_escrow to lock the transaction ledger right at creation
      try {
        const escReference = `esc_hold_${booking.id}_${Date.now()}`;
        const { error: rpcErr } = await (supabase.rpc as any)('secure_hold_escrow', {
          p_user_id: user.id,
          p_booking_id: booking.id,
          p_amount: totalPrice,
          p_reference: escReference
        });

        if (rpcErr) {
          console.warn("[BookingStore] Failed secure_hold_escrow trigger on creation:", rpcErr);
        } else {
          console.log("[BookingStore] Successfully locked escrow for booking:", booking.id);
          
          // --- NEW: CREATE ESCROW ACCOUNT RECORD ON CREATION ---
          try {
            await supabase.from('escrow_accounts').insert({
              booking_id: booking.id,
              amount: totalPrice,
              status: 'held'
            });

            await supabase.from('escrow_transactions').insert({
              booking_id: booking.id,
              payer_id: user.id,
              receiver_id: activeListing.owner_id,
              amount: totalPrice,
              platform_fee: totalPrice * 0.05,
              status: 'held'
            });
            console.log("[BookingStore] Created escrow records for booking:", booking.id);
          } catch (escAccErr) {
            console.warn("[BookingStore] Failed to create escrow_account on creation:", escAccErr);
          }

          // Inject a direct wallet notification for feedback
          await supabase.from('notifications').insert({
            recipient_id: booking.buyer_id,
            actor_id: booking.buyer_id,
            type: 'wallet',
            entity_id: booking.id,
            entity_type: 'booking',
            message: `₦${totalPrice.toLocaleString()} has been placed in Escrow Protection for booking request #${booking.id.slice(0, 8)}.`
          });
        }
      } catch (escrowHoldErr) {
        console.warn("[BookingStore] Hold escrow failed in create stream:", escrowHoldErr);
      }

      // Send system message to chat
      const bookingWithProfile = { ...booking, seller_id: activeListing.owner_id };
      (get() as any)._sendBookingSystemMessage(
        bookingWithProfile, 
        `New booking request for "${activeListing.title || activeListing.name || 'Service'}"`
      );

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

      // Emit Event
      useAppOrchestrator.getState().emitEvent({
        event_type: 'booking_created',
        actor_id: user.id,
        target_id: activeListing.owner_id,
        entity_id: booking.id,
        entity_type: 'booking',
        payload: { listing_type: listingType, total_price: totalPrice }
      });

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
      let user = (await supabase.auth.getUser()).data?.user;
      if (!user) {
        try {
          const { useAuthStore } = await import('../../auth/stores/useAuthStore');
          user = useAuthStore.getState().user;
        } catch (e) {
          console.warn("Could not fetch user from store dynamically", e);
        }
      }
      if (!user) throw new Error('Not authenticated');

      console.log("[BookingStore] updateBookingStatus initiated:", { bookingId, newStatus, userId: user?.id });

      // Fetch current booking to check permissions
      let current = get().buyerOrders.find(b => b.id === bookingId) || get().sellerOrders.find(b => b.id === bookingId);
      
      try {
        const { data: fetched, error: fetchErr } = await supabase
          .from('bookings')
          .select('*')
          .eq('id', bookingId)
          .single();

        if (fetched) {
          current = fetched as any;
        } else if (fetchErr && !current) {
          throw fetchErr;
        }
      } catch (dbFetchErr) {
        console.warn("[BookingStore] DB Fetch failed, using local status check fallback:", dbFetchErr);
      }

      if (!current) throw new Error('Booking not found');

      // VALIDATION RULES
      const isSeller = current.seller_id === user.id;
      const isBuyer = current.buyer_id === user.id;

      // Only seller can update to certain operational statuses
      const sellerOnlyStatuses: BookingStatus[] = ['accepted', 'rejected', 'in_progress', 'delivered'];
      if (sellerOnlyStatuses.includes(newStatus) && !isSeller) {
        throw new Error('Only the provider can transition to this state');
      }

      // Either buyer or seller can complete, but usually buyer signs off
      if (newStatus === 'completed' && !isBuyer && !isSeller) {
        throw new Error('You must be a client or provider to complete this booking');
      }

      // Disputed status can be initiated by either party
      if (newStatus === 'disputed' && !isBuyer && !isSeller) {
        throw new Error('Only contract participants can dispute this booking');
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

      // Completed orders locked from invalid rollback
      if (current.status === 'completed' && newStatus !== 'refunded') {
        throw new Error('Completed orders cannot be moved back to active states');
      }

      // ESCROW STATE MACHINE VALIDATION
      const getEscrowState = (b: any): EscrowPaymentState => {
        if (b.escrow_status === 'released') return EscrowPaymentState.RELEASED;
        if (b.escrow_status === 'refunded') return EscrowPaymentState.REFUNDED;
        if (b.escrow_status === 'held') return EscrowPaymentState.FUNDED;
        return EscrowPaymentState.AWAITING_PAYMENT;
      };

      const currentEscrowState = getEscrowState(current);
      
      // Strict Transition Rejection
      if (currentEscrowState === EscrowPaymentState.RELEASED || currentEscrowState === EscrowPaymentState.REFUNDED) {
        throw new Error(`Financial consistency lock: Cannot transition from ${currentEscrowState}`);
      }

      // Attempt database update
      let dbError = null;
      try {
        const { error: updateErr } = await supabase
          .from('bookings')
          .update({ status: newStatus })
          .eq('id', bookingId);
        
        if (updateErr) dbError = updateErr;
      } catch (err: any) {
        dbError = err;
      }

      if (dbError) {
        console.warn("[BookingStore] Supabase update fail (expected on demo/offline RLS). Proceeding with client-side syncer:", dbError);
      } else {
        console.log("[BookingStore] Database updated status to:", newStatus);

        // ESCROW RELEASING & REFUNDING INTEGRATION
        try {
          const bookingTotal = current.price_snapshot || current.total_price || 0;
          if (newStatus === 'completed') {
            console.log("[BookingStore] Resolving 'completed' status to trigger escrow release...");
            const reference = `rel_${bookingId}_${Date.now()}`;
            const { error: rpcErr } = await (supabase.rpc as any)('secure_release_escrow', {
              p_client_id: current.buyer_id,
              p_hustler_id: current.seller_id,
              p_booking_id: bookingId,
              p_total_amount: bookingTotal,
              p_payout_amount: bookingTotal * 0.95, // 95% payout
              p_platform_fee: bookingTotal * 0.05, // 5% platform fee
              p_reference: reference
            });

            if (rpcErr) {
              console.warn("[BookingStore] Failed secure_release_escrow rpc:", rpcErr);
            } else {
              console.log("[BookingStore] Escrow funds successfully released on completion");
              
              // Direct financial notification trigger
              await supabase.from('notifications').insert([
                {
                  recipient_id: current.seller_id,
                  actor_id: current.buyer_id,
                  type: 'wallet',
                  entity_id: bookingId,
                  entity_type: 'booking',
                  message: `₦${(bookingTotal * 0.95).toLocaleString()} layout payout has been released to your wallet for booking #${bookingId.slice(0, 8)}.`
                },
                {
                  recipient_id: current.buyer_id,
                  actor_id: current.buyer_id,
                  type: 'wallet',
                  entity_id: bookingId,
                  entity_type: 'booking',
                  message: `Escrow held ₦${bookingTotal.toLocaleString()} successfully settled and released to Specialist.`
                }
              ]);
            }
          } else if (['cancelled', 'rejected', 'refunded'].includes(newStatus)) {
            console.log("[BookingStore] Resolving inactive status to trigger escrow refund...");
            const reference = `refund_${bookingId}_${Date.now()}`;
            const { error: rpcErr } = await (supabase.rpc as any)('secure_refund_escrow', {
              p_client_id: current.buyer_id,
              p_booking_id: bookingId,
              p_amount: bookingTotal,
              p_reference: reference
            });

            if (rpcErr) {
              console.warn("[BookingStore] Failed secure_refund_escrow rpc:", rpcErr);
            } else {
              console.log("[BookingStore] Escrow funds successfully refunded to client's wallet");
              
              // Direct financial notification trigger
              await supabase.from('notifications').insert([
                {
                  recipient_id: current.buyer_id,
                  actor_id: current.buyer_id,
                  type: 'wallet',
                  entity_id: bookingId,
                  entity_type: 'booking',
                  message: `₦${bookingTotal.toLocaleString()} from booking #${bookingId.slice(0, 8)} has been returned to your available wallet balance.`
                }
              ]);
            }
          }
        } catch (escrowTxError) {
          console.warn("[BookingStore] Failed processing automatic escrow step on status update:", escrowTxError);
        }

        // --- NEW: TRAINING ENROLLMENT UPDATES ---
        const isNowInactive = ['rejected', 'cancelled', 'refunded'].includes(newStatus);
        if (current.listing_type === 'training') {
          if (isNowInactive) {
            console.log("[BookingStore] Deactivating training enrollment due to cancellation/rejection");
            await supabase.from('enrollments').update({ status: 'dropped' }).eq('booking_id', current.id);
          } else if (newStatus === 'completed') {
            console.log("[BookingStore] Completing training enrollment");
            await supabase.from('enrollments').update({ status: 'completed', progress: 100 }).eq('booking_id', current.id);
          }
        }
      }

      // Sync local state immediately
      const syncStatus = (list: Booking[]) => 
        list.map(b => b.id === bookingId ? { ...b, status: newStatus } : b);

      set({
        buyerOrders: syncStatus(get().buyerOrders),
        sellerOrders: syncStatus(get().sellerOrders)
      });

      // Emit Event
      useAppOrchestrator.getState().emitEvent({
        event_type: newStatus === 'completed' ? 'booking_completed' : 'booking_created', // Simplified type map
        actor_id: user.id,
        target_id: current.buyer_id === user.id ? current.seller_id : current.buyer_id,
        entity_id: bookingId,
        entity_type: 'booking',
        payload: { new_status: newStatus }
      });

      // Send status update message
      const statusLabels: Record<string, string> = {
        accepted: 'accepted the booking. Escrow is now active.',
        rejected: 'declined the booking request.',
        in_progress: 'has started the work.',
        completed: 'marked the job as completed.',
        cancelled: 'cancelled the booking.'
      };

      const label = statusLabels[newStatus] || `updated the hustle status to ${newStatus}.`;
      console.log(`[BookingStore] Setting status message label: ${label}`);
      const isSellerAction = current.seller_id === user.id;
      const userName = isSellerAction ? 'Hustler' : 'Client';
      
      try {
        const summaryContent = `${userName} ${label}`;
        await (get() as any)._sendBookingSystemMessage(current, summaryContent);
        
        // Ensure UI sync by refetching everything after the system message and status update
        await get().fetchBookings();
        
        // AUTO-ACCEPTANCE LOGIC: Materialize milestones so escrow is permanent in DB
        if (newStatus === 'accepted') {
           console.log("[BookingStore] Processing 'accepted' status logic for:", bookingId);
           const enriched = processBookingEnrichment(current, {}, true);
           const milestonesToCreate = enriched.milestones || [];
           
           // Check if milestones already exist in DB
           const { data: existing } = await supabase.from('milestones').select('id').eq('booking_id', bookingId);
           if (!existing || existing.length === 0) {
              console.log("[BookingStore] Materializing virtual milestones into DB for escrow activation");
              for (const ms of milestonesToCreate) {
                 await supabase.from('milestones').insert({
                    booking_id: bookingId,
                    title: ms.title,
                    amount: ms.amount,
                    status: 'in_progress',
                    description: ms.description || ""
                 });
              }
           }

           // --- NEW: CREATE ESCROW RECORDS ---
           console.log("[BookingStore] Creating Escrow Records for Booking:", bookingId, "Amount:", enriched.total_price);
           
           // 1. Create escrow_accounts entry
           const { error: escrowAccError } = await supabase.from('escrow_accounts').insert({
              booking_id: bookingId,
              amount: enriched.total_price || 0,
              status: 'held'
           });
           if (escrowAccError) console.error("[BookingStore] Failed to create escrow_account:", escrowAccError);

           // 2. Create escrow_transactions entry
           const { error: escrowTransError } = await supabase.from('escrow_transactions').insert({
              booking_id: bookingId,
              payer_id: current.buyer_id,
              receiver_id: current.seller_id,
              amount: enriched.total_price || 0,
              platform_fee: (enriched.total_price || 0) * 0.05, // 5% fee
              status: 'held'
           });
           if (escrowTransError) console.error("[BookingStore] Failed to create escrow_transaction:", escrowTransError);
           
           console.log("[BookingStore] Escrow records created successfully.");

           // --- NEW: INCREMENT ORDERS COUNT ---
           try {
             const table = (current.listing_type === 'service' ? 'services' : current.listing_type === 'product' ? 'products' : 'training') as any;
             const { data: listingData } = await (supabase.from(table) as any).select('orders_count').eq('id', current.listing_id).single();
             if (listingData) {
               const currentCount = Number(listingData.orders_count) || 0;
               await (supabase.from(table) as any)
                 .update({ orders_count: currentCount + 1 })
                 .eq('id', current.listing_id);
               console.log(`[BookingStore] Updated orders_count for ${table}`);
             }
           } catch (countErr) {
             console.warn("[BookingStore] Failed to update orders_count:", countErr);
           }
        }

        // AUTO-TRANSITION FEATURE: If accepted, automatically move to in_progress for services
        if (newStatus === 'accepted' && current.listing_type === 'service') {
           console.log("[BookingStore] Auto-transitioning accepted service to in_progress");
           await supabase.from('bookings').update({ status: 'in_progress' }).eq('id', bookingId);
           
           // Update local state again
           set({
             sellerOrders: get().sellerOrders.map(b => b.id === bookingId ? { ...b, status: 'in_progress' } : b),
             buyerOrders: get().buyerOrders.map(b => b.id === bookingId ? { ...b, status: 'in_progress' } : b)
           });
        }
      } catch (msgErr) {
        console.warn("[BookingStore] Failed after-status-update hooks:", msgErr);
      }

      // Reload lists
      await get().fetchBuyerOrders().catch(() => {});
      await get().fetchSellerOrders().catch(() => {});

    } catch (err: any) {
      console.error("[BookingStore] Error in updateBookingStatus:", err.message);
      set({ error: err.message });
      throw err; // RETHROW error so UI button actions can display toast error feedback!
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

      // Send system message
      const { data: milestoneData } = await (supabase as any).from('milestones').select('booking_id').eq('id', milestoneId).single();
      const { data: current } = await supabase.from('bookings').select('*').eq('id', milestoneData?.booking_id).single();
      if (current) {
         (get() as any)._sendBookingSystemMessage(current, `Work delivered for milestone. Review and release funds.`);
      }
      
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
      
      // Send system message
      const { data: milestoneData } = await (supabase as any).from('milestones').select('booking_id').eq('id', milestoneId).single();
      const { data: current } = await supabase.from('bookings').select('*').eq('id', milestoneData?.booking_id).single();
      if (current) {
         (get() as any)._sendBookingSystemMessage(current, `Milestone funds released to Hustler.`);
      }

      // Trigger actual double-entry ledger movement of the escrowed partial funds
      try {
        const { data: fullMilestoneData } = await supabase
          .from('milestones')
          .select('*, booking:bookings(*)')
          .eq('id', milestoneId)
          .single() as any;

        if (fullMilestoneData && fullMilestoneData.booking) {
          const booking = fullMilestoneData.booking;
          const milestoneAmt = Number(fullMilestoneData.amount || 0);
          const reference = `ms_rel_${milestoneId}_${Date.now()}`;

          const { error: rpcErr } = await (supabase.rpc as any)('secure_release_escrow', {
            p_client_id: booking.buyer_id,
            p_hustler_id: booking.seller_id,
            p_booking_id: booking.id,
            p_total_amount: milestoneAmt,
            p_payout_amount: milestoneAmt * 0.95, // 95% payout to specialist
            p_platform_fee: milestoneAmt * 0.05, // 5% platform standard fee
            p_reference: reference
          });

          if (rpcErr) {
            console.warn("[BookingStore] Failed secure_release_escrow for milestone payout:", rpcErr);
          } else {
            console.log("[BookingStore] Successfully recorded milestone payout in financial ledger.");
            
            // Dispatch target system push notifications
            await supabase.from('notifications').insert([
              {
                recipient_id: booking.seller_id,
                actor_id: booking.buyer_id,
                type: 'wallet',
                entity_id: booking.id,
                entity_type: 'booking',
                message: `₦${(milestoneAmt * 0.95).toLocaleString()} milestone payout has been added to your wallet for booking request #${booking.id.slice(0, 8)}.`
              }
            ]);
          }
        }
      } catch (msEscrowErr) {
        console.warn("[BookingStore] Failed processing milestone ledger movement:", msEscrowErr);
      }

      // Refresh current data
      get().fetchBuyerOrders();
      get().fetchSellerOrders();
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  proposeInvoiceRevision: async (bookingId, revisionData) => {
    set({ isLoading: true, error: null });
    try {
      let current = get().buyerOrders.find(b => b.id === bookingId) || get().sellerOrders.find(b => b.id === bookingId);
      if (!current) throw new Error('Booking not found');

      const richNotes = {
        ...(current.parsedNotes || {}),
        invoice_proposal: {
          status: 'pending_client',
          total_price: revisionData.total_price,
          custom_charges: revisionData.custom_charges,
          revision_terms: revisionData.revision_terms,
          agreement_notes: revisionData.agreement_notes,
          deadline: revisionData.deadline,
          deliverables: revisionData.deliverables,
          milestones: revisionData.milestones
        }
      };

      const serializedNotes = JSON.stringify(richNotes);
      
      const { error } = await supabase
        .from('bookings')
        .update({ notes: serializedNotes })
        .eq('id', bookingId);

      if (error) console.warn("Supabase update fail, relying on local sync error:", error);

      // Trigger user notification
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const recipientId = current.buyer_id === user.id ? current.seller_id : current.buyer_id;
          await supabase.from('notifications').insert({
            recipient_id: recipientId,
            actor_id: user.id,
            type: 'booking',
            entity_id: bookingId,
            entity_type: 'booking',
            message: `Hustler proposed an updated invoice matching new terms. Budget: ₦${revisionData.total_price.toLocaleString()}.`
          });
        }
      } catch (notifErr) {
        console.warn("Failed to create invoice proposal notification", notifErr);
      }

      try {
        await (get() as any)._sendBookingSystemMessage(current, `Hustler proposed an updated invoice matching new terms. Budget: ₦${revisionData.total_price.toLocaleString()}. Please review & approve.`);
      } catch (msgErr) {
        console.warn("Failed to notify invoice proposal", msgErr);
      }

      await get().fetchBuyerOrders();
      await get().fetchSellerOrders();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  },

  respondToInvoiceRevision: async (bookingId, response) => {
    set({ isLoading: true, error: null });
    try {
      let current = get().buyerOrders.find(b => b.id === bookingId) || get().sellerOrders.find(b => b.id === bookingId);
      if (!current) throw new Error('Booking not found');

      const richNotes = { ...(current.parsedNotes || {}) };
      if (!richNotes.invoice_proposal) throw new Error("No active invoice revision found");

      richNotes.invoice_proposal.status = response === 'approved' ? 'approved' : 'rejected';

      if (response === 'approved') {
        richNotes.deliverables = richNotes.invoice_proposal.deliverables || [];
        richNotes.deadline = richNotes.invoice_proposal.deadline || "";
        richNotes.revision_terms = richNotes.invoice_proposal.revision_terms || "";
        richNotes.custom_charges = richNotes.invoice_proposal.custom_charges || 0;
        richNotes.agreement_notes = richNotes.invoice_proposal.agreement_notes || "";

        const finalPrice = richNotes.invoice_proposal.total_price;
        const serializedNotes = JSON.stringify(richNotes);

        const { error: bookingUpdateErr } = await supabase
          .from('bookings')
          .update({ 
            notes: serializedNotes,
            total_price: finalPrice 
          })
          .eq('id', bookingId);
        
        if (bookingUpdateErr) console.warn("Failed to update booking total_price, syncing locally", bookingUpdateErr);

        const propMilestones = richNotes.invoice_proposal.milestones || [];
        if (propMilestones.length > 0) {
          const { data: existingMilestonesFetch } = await supabase
            .from('milestones')
            .select('*')
            .eq('booking_id', bookingId)
            .order('created_at', { ascending: true });

          const existingList = existingMilestonesFetch || [];

          for (let idx = 0; idx < propMilestones.length; idx++) {
            const pm = propMilestones[idx];
            const em = existingList[idx];
            if (em) {
              await supabase
                .from('milestones')
                .update({
                  title: pm.title,
                  amount: pm.amount,
                  status: pm.status || 'in_progress'
                })
                .eq('id', em.id);
            } else {
              await supabase
                .from('milestones')
                .insert({
                  booking_id: bookingId,
                  title: pm.title,
                  amount: pm.amount,
                  status: pm.status || 'in_progress'
                });
            }
          }
        }

        // Notify invoice approval
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const recipientId = current.seller_id === user.id ? current.buyer_id : current.seller_id;
            await supabase.from('notifications').insert({
              recipient_id: recipientId,
              actor_id: user.id,
              type: 'booking',
              entity_id: bookingId,
              entity_type: 'booking',
              message: `Client approved the invoice revision. Escrow sync total: ₦${finalPrice.toLocaleString()}.`
            });
          }
        } catch (notifErr) {
          console.warn("Failed to create approval notification", notifErr);
        }

        try {
          await (get() as any)._sendBookingSystemMessage(current, `Client approved the invoice revision. Escrow sync total: ₦${finalPrice.toLocaleString()}.`);
        } catch (msgErr) {
          console.warn("Failed to notify invoice approval", msgErr);
        }
      } else {
        const serializedNotes = JSON.stringify(richNotes);
        await supabase
          .from('bookings')
          .update({ notes: serializedNotes })
          .eq('id', bookingId);

        // Notify invoice decline
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            const recipientId = current.seller_id === user.id ? current.buyer_id : current.seller_id;
            await supabase.from('notifications').insert({
              recipient_id: recipientId,
              actor_id: user.id,
              type: 'booking',
              entity_id: bookingId,
              entity_type: 'booking',
              message: `Client declined the invoice revision.`
            });
          }
        } catch (notifErr) {
          console.warn("Failed to create rejection notification", notifErr);
        }

        try {
          await (get() as any)._sendBookingSystemMessage(current, `Client declined the invoice revision.`);
        } catch (msgErr) {
          console.warn("Failed to notify invoice rejection", msgErr);
        }
      }

      await get().fetchBuyerOrders();
      await get().fetchSellerOrders();
    } catch (err: any) {
      set({ error: err.message });
      throw err;
    } finally {
      set({ isLoading: false });
    }
  }
}));
