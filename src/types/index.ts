import type { Database } from './database.types';

export * from './database.types';

// You can add more generic application types here if needed
export type Profile = Database['public']['Tables']['profiles']['Row'];
export type OnboardingStatus = Database['public']['Tables']['onboarding_status']['Row'];
export type UserRole = Database['public']['Tables']['user_roles']['Row'];
export type Service = Database['public']['Tables']['services']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
export type Payment = Database['public']['Tables']['payments']['Row'];

export type DbPost = Database['public']['Tables']['posts']['Row'];
export type DbLike = Database['public']['Tables']['likes']['Row'];
export type DbComment = Database['public']['Tables']['comments']['Row'];
export type Follower = Database['public']['Tables']['follows']['Row'];

export interface CommentThread extends DbComment {
  profiles?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
  replies?: CommentThread[];
}

export type Wallet = Database['public']['Tables']['wallets']['Row'];
export type WalletTransaction = Database['public']['Tables']['wallet_transactions']['Row'];
export type DbTransaction = Database['public']['Tables']['transactions']['Row'];
export type LedgerEntry = Database['public']['Tables']['ledger_entries']['Row'];
export type EscrowAccount = Database['public']['Tables']['escrow_accounts']['Row'];

export type Conversation = Database['public']['Tables']['conversations']['Row'];
export type ConversationParticipant = Database['public']['Tables']['conversation_participants']['Row'];
export type Message = Database['public']['Tables']['messages']['Row'];

export type Story = Database['public']['Tables']['stories']['Row'];
export type StoryView = Database['public']['Tables']['story_views']['Row'];

export type Collection = Database['public']['Tables']['collections']['Row'];
export type SavedPost = Database['public']['Tables']['saved_posts']['Row'];
export type PostShare = Database['public']['Tables']['post_shares']['Row'];

export * from './agent';

