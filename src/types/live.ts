import { Database } from './database.types';

// export type LiveSession = Database['public']['Tables']['live_sessions']['Row'];
// export type LiveViewer = Database['public']['Tables']['live_viewers']['Row'];
// export type LiveMessage = Database['public']['Tables']['live_messages']['Row'];
// export type LiveReaction = Database['public']['Tables']['live_reactions']['Row'];
// export type LivePinnedItem = Database['public']['Tables']['live_pinned_items']['Row'];

export interface LiveSession {
  id: string;
  host_id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  status: 'scheduled' | 'live' | 'ended';
  started_at: string | null;
  ended_at: string | null;
  peak_viewers: number;
  current_viewers: number;
  total_viewers: number;
  total_reactions: number;
  created_at: string;
  host_profiles?: {
    full_name: string;
    hustle_name: string;
    avatar_url: string;
    is_verified: boolean;
    primary_skill: string;
  };
}
export type LiveViewer = any;
export type LiveMessage = any;
export type LiveReaction = any;
export type LivePinnedItem = any;

export interface LiveState {
  activeSessions: LiveSession[];
  currentSession: LiveSession | null;
  viewers: LiveViewer[];
  messages: LiveMessage[];
  reactions: LiveReaction[];
  pinnedItems: (LivePinnedItem & { details?: any })[];
  myListings: any[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchMyListings: () => Promise<void>;
  fetchActiveSessions: () => Promise<void>;
  createSession: (params: { title: string; description?: string; thumbnail_url?: string }) => Promise<LiveSession | null>;
  startSession: (sessionId: string) => Promise<boolean>;
  endSession: (sessionId: string) => Promise<boolean>;
  joinSession: (sessionId: string) => Promise<void>;
  leaveSession: (sessionId: string) => Promise<void>;
  sendMessage: (sessionId: string, message: string) => Promise<void>;
  sendReaction: (sessionId: string, type: 'like' | 'fire' | 'clap' | 'heart') => Promise<void>;
  pinItem: (sessionId: string, listingId: string, listingType: 'gig' | 'product' | 'service' | 'training') => Promise<void>;
  unpinItem: (pinnedItemId: string) => Promise<void>;
}
