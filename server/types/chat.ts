export interface ServerConversation {
  id: string;
  name?: string;
  avatar_url?: string;
  booking_id?: string | null;
  created_at: string;
  last_message?: string | null;
  last_message_at?: string | null;
  disappearing_messages_duration?: string | null;
}

export interface ServerConversationParticipant {
  conversation_id: string;
  user_id: string;
  joined_at: string;
}

export interface ServerMessage {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'video' | 'file' | 'voice' | 'shared_post' | 'reply' | 'system';
  media_url?: string | null;
  media_metadata?: any | null;
  reply_to_message_id?: string | null;
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at?: string | null;
  delivered_at?: string | null;
  expires_at?: string | null;
}
