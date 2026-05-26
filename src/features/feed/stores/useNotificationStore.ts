import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { Database } from '../../../types/database.types';

export type NotificationType = 
  | 'like' | 'comment' | 'reply' | 'repost' | 'follow' 
  | 'story_reaction' | 'story_reply' | 'internal_share' 
  | 'system' | 'booking' | 'wallet' | 'escrow' | 'work' | 'milestone'
  | 'booking_new' | 'booking_accepted' | 'booking_rejected' | 'booking_completed'
  | 'milestone_delivered' | 'milestone_released' | 'milestone_disputed';
export type EntityType = 'post' | 'comment' | 'story' | 'profile' | 'system';

export interface AppNotification {
  id: string;
  recipient_id: string;
  actor_id: string | null;
  type: NotificationType;
  entity_id: string | null;
  entity_type: EntityType | null;
  message: string | null;
  is_read: boolean;
  created_at: string;
  
  // Joined profile data
  actor?: {
    id?: string;
    full_name: string;
    username: string;
    avatar_url: string;
    hustle_name?: string;
  } | null;
}

export interface NotificationGroup {
  id: string; // generated ID logic mapping
  type: NotificationType;
  entity_id: string | null;
  is_read: boolean;
  created_at: string;
  count: number;
  actors: any[];
  items: AppNotification[]; // The raw notifications
}

interface NotificationState {
  notifications: AppNotification[];
  groupedNotifications: NotificationGroup[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  realtimeSubscription: any | null;

  fetchNotifications: () => Promise<void>;
  subscribeToNotifications: () => void;
  unsubscribeFromNotifications: () => void;
  markGroupRead: (itemIds: string[]) => Promise<void>;
  markAllRead: () => Promise<void>;
  groupNotifications: (notes: AppNotification[]) => NotificationGroup[];
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  groupedNotifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
  realtimeSubscription: null,

  groupNotifications: (notes: AppNotification[]) => {
    // Basic grouping logic based on type and entity_id
    const groupsMap = new Map<string, NotificationGroup>();
    
    notes.forEach(note => {
      // If it's a follow, don't necessarily group unless it's multiple follows in same day?
      // For now, group by type + entity_id (post, comment), default unique ID for system/follow
      const key = (note.type === 'like' || note.type === 'comment' || note.type === 'repost' || note.type === 'story_reaction')
        ? `${note.type}_${note.entity_id}`
        : note.id; // Others don't group or group by something else
      
      if (!groupsMap.has(key)) {
        groupsMap.set(key, {
            id: key,
            type: note.type,
            entity_id: note.entity_id,
            is_read: note.is_read,
            created_at: note.created_at,
            count: 0,
            actors: [],
            items: []
        });
      }
      
      const group = groupsMap.get(key)!;
      group.count += 1;
      group.items.push(note);
      if (note.actor && !group.actors.some(a => a.username === note.actor?.username)) {
        group.actors.push({
          ...note.actor,
          id: note.actor.id || note.actor_id || undefined
        });
      }
      // If any notification in group is unread, group is unread
      if (!note.is_read) {
        group.is_read = false;
      }
      // Keep most recent date
      if (new Date(note.created_at) > new Date(group.created_at)) {
        group.created_at = note.created_at;
      }
    });

    // Sort by created_at desc
    return Array.from(groupsMap.values()).sort((a, b) => 
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  },

  fetchNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const { data, error } = await (supabase as any)
        .from('notifications')
        .select(`
          *,
          actor:profiles!notifications_actor_id_fkey(id, full_name, username, avatar_url, hustle_name)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      const notes = (data || []) as unknown as AppNotification[];
      const unreadCount = notes.filter(n => !n.is_read).length;

      set({ 
        notifications: notes, 
        groupedNotifications: get().groupNotifications(notes),
        unreadCount 
      });
    } catch (err: any) {
      console.error('Error fetching notifications:', err);
      set({ error: err.message });
    } finally {
      set({ isLoading: false });
    }
  },

  subscribeToNotifications: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Check if already subscribed
    const currentSub = get().realtimeSubscription;
    if (currentSub) return;

    const subscription = supabase
      .channel('public:notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        async (payload) => {
          const newNoteRaw = payload.new;
          
          // Fetch the actor details manually because realtime doesn't do joins automatically
          let actorData = null;
          if (newNoteRaw.actor_id) {
            const { data } = await supabase
                .from('profiles')
                .select('id, full_name, username, avatar_url, hustle_name')
                .eq('id', newNoteRaw.actor_id)
                .single();
            actorData = data;
          }

          const newNote: AppNotification = {
              ...newNoteRaw,
              actor: actorData
          } as AppNotification;

          set((state) => {
            // Avoid duplicate inserts
            if (state.notifications.some(n => n.id === newNote.id)) return state;

            const updatedNotes = [newNote, ...state.notifications];
            return {
              notifications: updatedNotes,
              groupedNotifications: get().groupNotifications(updatedNotes),
              unreadCount: state.unreadCount + 1
            };
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          const updatedNote = payload.new;
          set((state) => {
             const updatedNotes = state.notifications.map(n => 
                n.id === updatedNote.id ? { ...n, is_read: updatedNote.is_read } as AppNotification : n
             );
             return {
                 notifications: updatedNotes,
                 groupedNotifications: get().groupNotifications(updatedNotes),
                 unreadCount: updatedNotes.filter(n => !n.is_read).length
             }
          });
        }
      )
      .subscribe();

    set({ realtimeSubscription: subscription });
  },

  unsubscribeFromNotifications: () => {
    const sub = get().realtimeSubscription;
    if (sub) {
      supabase.removeChannel(sub);
      set({ realtimeSubscription: null });
    }
  },

  markGroupRead: async (itemIds: string[]) => {
    // Optimistic update
    set((state) => {
      const updatedNotes = state.notifications.map(n => 
         itemIds.includes(n.id) ? { ...n, is_read: true } : n
      );
      return {
          notifications: updatedNotes,
          groupedNotifications: get().groupNotifications(updatedNotes),
          unreadCount: updatedNotes.filter(n => !n.is_read).length
      }
    });

    try {
      // Execute sequentially to avoid RPC overloading if there are many, or write a new RPC.
      // Usually it's ~1-5 IDs.
      await Promise.all(itemIds.map(id => 
        (supabase as any).rpc('mark_notification_read', { p_id: id })
      ));
    } catch (err: any) {
      console.error('Failed to mark read:', err);
    }
  },

  markAllRead: async () => {
    set((state) => {
      const updatedNotes = state.notifications.map(n => ({ ...n, is_read: true }));
      return {
          notifications: updatedNotes,
          groupedNotifications: get().groupNotifications(updatedNotes),
          unreadCount: 0
      }
    });

    try {
      await (supabase as any).rpc('mark_all_notifications_read');
    } catch (err: any) {
      console.error('Failed to mark all read:', err);
    }
  }

}));
