
import { create } from 'zustand';
import { supabase } from '../lib/supabase';
import { AppEvent, AppEventType } from '../types/orchestration';

interface AppOrchestratorState {
  globalRealtimeEvents: AppEvent[];
  activityFeed: any[];
  isSyncing: boolean;
  
  // Actions
  emitEvent: (params: Omit<AppEvent, 'id' | 'created_at'>) => Promise<void>;
  processEvent: (event: AppEvent) => void;
  syncModules: () => Promise<void>;
  initializeRealtime: () => void;
}

export const useAppOrchestrator = create<AppOrchestratorState>((set, get) => ({
  globalRealtimeEvents: [],
  activityFeed: [],
  isSyncing: false,

  emitEvent: async (params) => {
    // Generate an idempotency key to prevent double publishing
    const idempotencyKey = `${params.event_type}_${params.entity_id}_${params.actor_id}_${Date.now()}`;
    
    const { error } = await (supabase as any).from('app_events').insert([{
      ...params,
      idempotency_key: idempotencyKey
    }]);

    if (error) {
      console.error('Failed to emit event:', error);
      // Depending on severity, we could push this to a local retry queue
    }
  },

  processEvent: (event) => {
    set((state) => ({ 
      globalRealtimeEvents: [event, ...state.globalRealtimeEvents].slice(0, 50) 
    }));

    // Cross-system internal synchronization
    if (event.event_type === 'booking_completed' || event.event_type === 'escrow_released') {
      // Refresh wallet & marketplace status
      import('../features/wallets/stores/useWalletStore').then(m => m.useWalletStore.getState().fetchWallet());
      import('../features/bookings/stores/useBookingStore').then(m => {
        m.useBookingStore.getState().fetchBuyerOrders();
        m.useBookingStore.getState().fetchSellerOrders();
      });
    }

    if (event.event_type === 'post_liked' || event.event_type === 'repost_created') {
       // Refresh feed locally if on the same post
    }
  },

  syncModules: async () => {
    set({ isSyncing: true });
    try {
      // Unified sync across all major stores
      const [walletStore, bookingStore] = await Promise.all([
        import('../features/wallets/stores/useWalletStore'),
        import('../features/bookings/stores/useBookingStore')
      ]);

      await Promise.all([
        walletStore.useWalletStore.getState().fetchWallet(),
        bookingStore.useBookingStore.getState().fetchBookings()
      ]);
      
      // Fetch activity log
      const { data: activity } = await (supabase as any)
        .from('activity_log')
        .select('*, profiles(full_name, username, avatar_url)')
        .order('created_at', { ascending: false })
        .limit(30);
      
      set({ activityFeed: activity || [] });
    } finally {
      set({ isSyncing: false });
    }
  },

  initializeRealtime: () => {
    const channel = supabase
      .channel('global_events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'app_events' },
        (payload) => {
          get().processEvent(payload.new as AppEvent);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  },
}));
