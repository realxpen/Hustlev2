import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { LiveState, LiveSession, LiveMessage, LiveReaction, LivePinnedItem } from '../types/live';

export const useLiveStore = create<LiveState>((set, get) => ({
  activeSessions: [],
  currentSession: null,
  viewers: [],
  messages: [],
  reactions: [],
  pinnedItems: [],
  myListings: [],
  isLoading: false,
  error: null,

  fetchMyListings: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: services } = await (supabase as any)
        .from('services')
        .select('*')
        .eq('user_id', user.id);
      
      const { data: products } = await (supabase as any)
        .from('products')
        .select('*')
        .eq('owner_id', user.id);

      const combined = [
        ...(services || []).map((s: any) => ({ ...s, listing_type: 'service' })),
        ...(products || []).map((p: any) => ({ ...p, listing_type: 'product' }))
      ];

      set({ myListings: combined });
    } catch (err: any) {
      console.error('[LiveStore] Error fetching listings:', err);
    }
  },

  fetchActiveSessions: async () => {
    set({ isLoading: true });
    try {
      const { data, error } = await (supabase as any)
        .from('live_sessions')
        .select(`
          *,
          host_profiles:profiles (*)
        `)
        .eq('status', 'live')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ activeSessions: data || [], isLoading: false });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  createSession: async ({ title, description, thumbnail_url }) => {
    set({ isLoading: true });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await (supabase as any)
        .from('live_sessions')
        .insert({
          host_id: user.id,
          title,
          description,
          thumbnail_url,
          status: 'scheduled'
        })
        .select()
        .single();

      if (error) throw error;
      set({ isLoading: false });
      return data;
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
      return null;
    }
  },

  startSession: async (sessionId) => {
    try {
      const { error } = await (supabase as any)
        .from('live_sessions')
        .update({ status: 'live' })
        .eq('id', sessionId);

      if (error) throw error;
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  endSession: async (sessionId) => {
    try {
      const { error } = await (supabase as any)
        .from('live_sessions')
        .update({ status: 'ended' })
        .eq('id', sessionId);

      if (error) throw error;
      set({ currentSession: null });
      return true;
    } catch (err: any) {
      set({ error: err.message });
      return false;
    }
  },

  joinSession: async (sessionId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if already in this session to avoid double joins
      if (get().currentSession?.id === sessionId) return;

      // Register presence
      await (supabase as any).from('live_viewers').insert({
        session_id: sessionId,
        user_id: user.id
      });

      // Fetch session data with profile
      const { data: session } = await (supabase as any)
        .from('live_sessions')
        .select(`
          *,
          host_profiles:profiles (*)
        `)
        .eq('id', sessionId)
        .single();

      if (session) {
        set({ currentSession: session });
        
        // Subscribe to realtime updates for this session
        const channel = supabase.channel(`live:${sessionId}`)
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'live_messages', 
            filter: `session_id=eq.${sessionId}` 
          }, async (payload) => {
            if (payload.eventType === 'INSERT') {
              // Fetch profile for the new message
              const { data: profile } = await (supabase as any).from('profiles').select('*').eq('id', payload.new.user_id).single();
              const newMessage = { ...payload.new, user_profiles: profile };
              set(state => ({ messages: [...state.messages, newMessage as LiveMessage] }));
            }
          })
          .on('postgres_changes', { 
            event: 'INSERT', 
            schema: 'public', 
            table: 'live_reactions', 
            filter: `session_id=eq.${sessionId}` 
          }, (payload) => {
            set(state => ({ reactions: [...state.reactions, payload.new as LiveReaction] }));
            // Optional: debounce cleanup if reactions array gets too large
            if (get().reactions.length > 50) {
              set(state => ({ reactions: state.reactions.slice(-20) }));
            }
          })
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'live_pinned_items', 
            filter: `session_id=eq.${sessionId}` 
          }, async () => {
             // Refresh pinned items with details
             const { data: pins } = await (supabase as any)
               .from('live_pinned_items')
               .select('*')
               .eq('session_id', sessionId);
             
             if (pins) {
               const enrichedPins = await Promise.all(pins.map(async (pin: any) => {
                 let table = pin.listing_type === 'service' ? 'services' : 'products';
                 const { data: details } = await (supabase as any).from(table).select('*').eq('id', pin.listing_id).single();
                 return { ...pin, details };
               }));
               set({ pinnedItems: enrichedPins });
             }
          })
          .on('postgres_changes', { 
            event: 'UPDATE', 
            schema: 'public', 
            table: 'live_sessions', 
            filter: `id=eq.${sessionId}` 
          }, (payload) => {
            set(state => ({ 
              currentSession: { 
                ...state.currentSession, 
                ...payload.new,
                host_profiles: state.currentSession?.host_profiles 
              } as LiveSession 
            }));
          })
          .subscribe();

        // Initial fetch of messages and enriched pinned items
        const { data: msgData } = await (supabase as any)
          .from('live_messages')
          .select('*, user_profiles:profiles(*)')
          .eq('session_id', sessionId)
          .order('created_at', { ascending: true });

        const { data: pinData } = await (supabase as any)
          .from('live_pinned_items')
          .select('*')
          .eq('session_id', sessionId);

        let enrichedPins = [];
        if (pinData) {
          enrichedPins = await Promise.all(pinData.map(async (pin: any) => {
            let table = pin.listing_type === 'service' ? 'services' : 'products';
            const { data: details } = await (supabase as any).from(table).select('*').eq('id', pin.listing_id).single();
            return { ...pin, details };
          }));
        }

        set({ 
          messages: msgData || [], 
          pinnedItems: enrichedPins 
        });
      }
    } catch (err: any) {
      console.error('[LiveStore] Error joining session:', err);
    }
  },

  leaveSession: async (sessionId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any).from('live_viewers')
        .update({ left_at: new Date().toISOString() })
        .eq('session_id', sessionId)
        .eq('user_id', user.id)
        .is('left_at', null);

      supabase.removeChannel(supabase.channel(`live:${sessionId}`));
      set({ currentSession: null, messages: [], reactions: [], pinnedItems: [] });
    } catch (err: any) {
      console.error('[LiveStore] Error leaving session:', err);
    }
  },

  sendMessage: async (sessionId, message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any).from('live_messages').insert({
        session_id: sessionId,
        user_id: user.id,
        message
      });
    } catch (err: any) {
      console.error('[LiveStore] Error sending message:', err);
    }
  },

  sendReaction: async (sessionId, type) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await (supabase as any).from('live_reactions').insert({
        session_id: sessionId,
        user_id: user.id,
        reaction_type: type
      });
    } catch (err: any) {
      console.error('[LiveStore] Error sending reaction:', err);
    }
  },

  pinItem: async (sessionId, listingId, listingType) => {
    try {
      await (supabase as any).from('live_pinned_items').insert({
        session_id: sessionId,
        listing_id: listingId,
        listing_type: listingType
      });
    } catch (err: any) {
      console.error('[LiveStore] Error pinning item:', err);
    }
  },

  unpinItem: async (pinnedItemId) => {
    try {
      await (supabase as any).from('live_pinned_items').delete().eq('id', pinnedItemId);
    } catch (err: any) {
      console.error('[LiveStore] Error unpinning item:', err);
    }
  }
}));
