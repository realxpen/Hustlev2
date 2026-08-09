import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { useAppOrchestrator } from '../../../stores/useAppOrchestrator';
import type { Conversation, Message, Profile } from '../../../types'; // Assuming Database type is available for table types
import type { RealtimeChannel, User, RealtimePostgresChangesPayload } from '@supabase/supabase-js';

export interface ChatParticipant extends Profile {}

export interface ChatConversation extends Conversation {
  otherParticipant?: ChatParticipant | null;
  unreadCount?: number;
  disappearing_messages_duration?: string | null;
}

export interface ChatMessage extends Omit<Message, 'message_type' | 'media_metadata'> {
  sender?: ChatParticipant | null;
  media_metadata?: any | null;
  delivered_at?: string | null;
  expires_at?: string | null;
  message_type: 'text' | 'image' | 'video' | 'file' | 'voice' | 'shared_post' | 'reply' | 'system';
  reply_to_message_id?: string | null;
}

// Helper interface for `conversation_participants` select with profiles
interface ConversationParticipantWithProfile {
  conversation_id: string;
  user_id: string;
  profiles: Profile;
}

// Basic conversation_participants row
interface ConversationParticipantRow {
  conversation_id: string;
  user_id: string;
}

// Helper interface for messages select with profiles and reactions
interface MessageWithProfileAndReactions extends MessageRow {
  profiles: Profile;
  message_reactions: MessageReactionRow[];
}
// Define the type for the 'messages' table row for RealtimePostgresChangesPayload
// This is derived from ChatMessage and common Supabase table structures.
interface MessageRow {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string | null;
  message_type: 'text' | 'image' | 'video' | 'file' | 'voice' | 'shared_post' | 'reply' | 'system';
  created_at: string;
  updated_at: string;
  is_read: boolean;
  read_at: string | null;
  shared_post_id: string | null;
  media_url: string | null;
  media_metadata: any | null;
  delivered_at: string | null;
  expires_at: string | null;
  reply_to_message_id: string | null;
}

// Define the type for the 'message_reactions' table row
interface MessageReactionRow { id: string; message_id: string; user_id: string; emoji: string; created_at: string; }

interface ChatState {
  conversations: ChatConversation[];
  activeConversation: ChatConversation | null;
  messages: Record<string, ChatMessage[]>; // Keyed by conversation_id
  messagesMap: Record<string, ChatMessage[]>; // Alias for messages to satisfy Step 11
  unreadCounts: Record<string, number>;
  typingUsers: Record<string, Record<string, boolean>>; // { conversationId: { userId: boolean } }
  onlineUsers: Record<string, boolean>; // { userId: boolean }
  messageReactions: Record<string, any[]>; // { messageId: reactions[] }
  voicePlaybackState: Record<string, { playing: boolean, progress: number }>;
  activeReplies: Record<string, ChatMessage | null>; // { conversationId: messageToReplyTo }
  mediaUploadQueue: Record<string, { file: File, progress: number }>;

  isLoading: boolean;
  error: string | null;

  setConversations: (conversations: ChatConversation[] | ((prev: ChatConversation[]) => ChatConversation[])) => void;
  setActiveConversation: (conversation: ChatConversation | null) => void;
  setMessages: (conversationId: string, messages: ChatMessage[] | ((prev: ChatMessage[]) => ChatMessage[])) => void;
  addMessage: (conversationId: string, message: ChatMessage) => void;
  setUnreadCount: (conversationId: string, count: number) => void;
  setTypingUser: (conversationId: string, userId: string, isTyping: boolean) => void;
  setOnlineUser: (userId: string, isOnline: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;

  // Realtime presence tracking
  trackPresence: () => () => void;

  // Message Replies
  setActiveReply: (conversationId: string, message: ChatMessage | null) => void;

  // Media Messages
  sendMediaMessage: (conversationId: string, file: File) => Promise<void>;
  
  // Voice Notes
  sendVoiceMessage: (conversationId: string, file: File, durationSeconds: number) => Promise<void>;
  
  // Message Reactions
  toggleReaction: (messageId: string, emoji: string) => Promise<void>;

  // New features for direct messaging system foundation
  fetchConversations: () => Promise<void>;
  getOrCreateConversation: (userAId: string, userBId: string) => Promise<string>;
  openConversation: (conversationId: string) => Promise<void>;
  sendMessage: (
    conversationId: string,
    payload: {
      content?: string;
      message_type?: 'text' | 'shared_post' | 'system';
      shared_post_id?: string;
      metadata?: any;
    }
  ) => Promise<ChatMessage>;
  subscribeToMessages: (conversationId: string) => () => void;
  markConversationRead: (conversationId: string) => Promise<void>;
  markMessageDelivered: (messageId: string) => Promise<void>;
  updateConversationSettings: (conversationId: string, settings: { disappearing_messages_duration: string | null }) => Promise<void>;
  
  // Pagination
  loadMoreMessages: (conversationId: string, beforeDate: string) => Promise<void>;
}

export const useChatStore = create<ChatState>((set, get) => ({
  conversations: [],
  activeConversation: null,
  messages: {},
  messagesMap: {},
  unreadCounts: {},
  typingUsers: {},
  onlineUsers: {},
  messageReactions: {},
  voicePlaybackState: {},
  activeReplies: {},
  mediaUploadQueue: {},
  isLoading: false,
  error: null,

  setConversations: (conversations) => set((state) => {
    const nextConvs = typeof conversations === 'function' ? conversations(state.conversations) : conversations;
    return { conversations: nextConvs };
  }),
  setActiveConversation: (activeConversation) => set({ activeConversation }),
  setMessages: (conversationId, messages) => set((state) => {
    const newMessages = typeof messages === 'function' ? messages(state.messages[conversationId] || []) : messages;
    const nextMessages = {
      ...state.messages,
      [conversationId]: newMessages
    };
    return {
      messages: nextMessages,
      messagesMap: nextMessages
    };
  }),
  addMessage: (conversationId, message) => set((state) => {
    const currentMessages = state.messages[conversationId] || [];
    // prevent duplicates
    if (currentMessages.some(m => m.id === message.id || (m.id.startsWith('optimistic-') && m.content === message.content && m.sender_id === message.sender_id))) {
      return {};
    }
    
    const nextMessages = {
      ...state.messages,
      [conversationId]: [...currentMessages, message]
    };
    return {
      messages: nextMessages,
      messagesMap: nextMessages
    };
  }),
  setUnreadCount: (conversationId, count) => set((state) => ({
    unreadCounts: {
      ...state.unreadCounts,
      [conversationId]: count
    }
  })),
  setTypingUser: (conversationId, userId, isTyping) => set((state) => {
    const convTyping = state.typingUsers[conversationId] || {};
    return {
      typingUsers: {
        ...state.typingUsers,
        [conversationId]: {
          ...convTyping,
          [userId]: isTyping
        }
      }
    };
  }),
  setOnlineUser: (userId, isOnline) => set((state) => ({
    onlineUsers: {
      ...state.onlineUsers,
      [userId]: isOnline
    }
  })),
  setLoading: (isLoading) => set({ isLoading }),
  setError: (error) => set({ error }),

  loadMoreMessages: async (conversationId: string, beforeDate: string) => {
    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`*, profiles!messages_sender_id_fkey(*), message_reactions(*)`)
        .eq('conversation_id', conversationId)
        .lt('created_at', beforeDate)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(50);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        // Reverse because we queried descending, but we want to prepend them to state ascending
        data.reverse();
        
        const reactionsMap: Record<string, MessageReactionRow[]> = {};
        
        const mappedMessages = data.map((m: any) => {
          if (m.message_reactions && m.message_reactions.length > 0) {
            reactionsMap[m.id] = m.message_reactions;
          }
          const { message_reactions, ...rest } = m;
          return {
            ...rest,
            sender: m.profiles
          };
        });

        set(state => {
          const current = state.messages[conversationId] || [];
          // Prepend historical messages, ensure uniqueness
          const newMsgIds = new Set(mappedMessages.map((m: ChatMessage) => m.id));
          const filteredCurrent = current.filter(m => !newMsgIds.has(m.id));
          const nextMessages = { ...state.messages, [conversationId]: [...mappedMessages, ...filteredCurrent] };
          
          const nextReactions = { ...state.messageReactions, ...reactionsMap };
          return {
            messages: nextMessages,
            messagesMap: nextMessages,
            messageReactions: nextReactions
          };
        });
      }
    } catch (err) {
      console.error('Failed to load more messages:', err);
    }
  },

  // 1. Fetch conversations with unread priorities and participant profiles
  fetchConversations: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isLoading: true, error: null });
    try {
      const { data: participations, error: partError } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', user.id);

      if (partError) throw partError;
      if (!participations || participations.length === 0) {
        set({ conversations: [], isLoading: false });
        return;
      }

      const conversationIds = Array.from(new Set(participations.map((p: { conversation_id: string }) => p.conversation_id as string)));

      const { data: convData, error: convError } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds);

      if (convError) throw convError;

      const { data: otherParts, error: otherPartsError } = await supabase
        .from('conversation_participants')
        .select('conversation_id, user_id, profiles(*)')
        .in('conversation_id', conversationIds)
        .neq('user_id', user.id);

      if (otherPartsError) throw otherPartsError;

      const otherPartsMap = (otherParts || []).reduce((acc: any, curr: any) => {
        acc[curr.conversation_id] = curr.profiles;
        return acc;
      }, {});

      // Fetch unread count for each conversation where we are recipient (not sender) and messages are unread
      const { data: unreadData, error: unreadError } = await supabase
        .from('messages')
        .select('conversation_id')
        .in('conversation_id', conversationIds)
        .neq('sender_id', user.id)
        .or('is_read.eq.false,read_at.is.null');

      const unreadCountsMap: Record<string, number> = {};
      conversationIds.forEach(cid => {
        unreadCountsMap[cid as string] = 0;
      });

      if (!unreadError && unreadData) {
        unreadData.forEach((m: any) => {
          unreadCountsMap[m.conversation_id] = (unreadCountsMap[m.conversation_id] || 0) + 1;
        });
      }

      const mappedConversations: ChatConversation[] = convData.map((c: any) => ({
        ...c,
        otherParticipant: otherPartsMap[c.id] || null,
        unreadCount: unreadCountsMap[c.id] || 0
      }));

      // Sort with unread count prioritized, then last_message_at
      mappedConversations.sort((a, b) => {
        const aUnread = unreadCountsMap[a.id] || 0;
        const bUnread = unreadCountsMap[b.id] || 0;
        if (aUnread !== bUnread) {
          return bUnread - aUnread;
        }
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
      });

      set({ conversations: mappedConversations, unreadCounts: unreadCountsMap, isLoading: false });
    } catch (err: any) {
      console.error('Error fetching conversations:', err);
      set({ error: err.message || 'Failed to fetch conversations', isLoading: false });
    }
  },

  // 2. Safeguarded conversation loader or creator
  getOrCreateConversation: async (userAId: string, userBId: string) => {
    // Validate both exist
    const { data: profileA } = await supabase.from('profiles').select('id').eq('id', userAId).single();
    const { data: profileB } = await supabase.from('profiles').select('id').eq('id', userBId).single();

    if (!profileA || !profileB) {
      throw new Error('One or both users do not exist');
    }

    if (userAId === userBId) {
      throw new Error('Cannot converse with yourself');
    }

    // Call dynamic Postgres RPC
    const { data: conversationId, error } = await (supabase.rpc as any)('get_or_create_conversation_between_users', {
      p_user_a: userAId,
      p_user_b: userBId
    });

    if (error) {
      console.warn('RPC failed, falling back to sequential client queries', error);
      
      const { data: participationsA } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userAId);

      const { data: participationsB } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', userBId);

      const listA: string[] = participationsA?.map((p: ConversationParticipantRow) => p.conversation_id) || [];
      const listB: string[] = participationsB?.map((p: ConversationParticipantRow) => p.conversation_id) || [];
      const common: string[] = listA.filter((id: string) => listB.includes(id));

      if (common.length > 0) {
        return common[0];
      }

      const { data: newConv, error: newConvError } = await supabase
        .from('conversations')
        .insert({ last_message: null, last_message_preview: null, last_message_at: new Date().toISOString() } as any)
        .select('id')
        .single();

      if (newConvError) throw newConvError;

      const { error: joinError } = await supabase
        .from('conversation_participants')
        .insert([
          { conversation_id: newConv.id, user_id: userAId },
          { conversation_id: newConv.id, user_id: userBId }
        ]);

      if (joinError) throw joinError;

      return newConv.id;
    }

    return conversationId;
  },

  // 3. Open conversation, load history, and mark read
  openConversation: async (conversationId: string) => {
    try {
      const active = get().conversations.find(c => c.id === conversationId) || null;
      set({ activeConversation: active });

      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey(*),
          message_reactions(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const reactionsMap: Record<string, any[]> = {};
        
        const mappedMessages = data.map((m: any) => {
          if (m.message_reactions && m.message_reactions.length > 0) {
            reactionsMap[m.id] = m.message_reactions;
          }
          const { message_reactions, ...rest } = m;
          return {
            ...(rest as MessageRow), // Cast rest to MessageRow to ensure type compatibility
            sender: m.profiles
          };
        });

        set(state => {
          const nextMessages = { ...state.messages, [conversationId]: mappedMessages };
          const nextReactions = { ...state.messageReactions, ...reactionsMap };
          return {
            messages: nextMessages,
            messagesMap: nextMessages,
            messageReactions: nextReactions
          };
        });
      }

      await get().markConversationRead(conversationId);
    } catch (err) {
      console.error('Error opening conversation:', err);
    }
  },

  // 4. Send message with optimistic response and metadata
  sendMessage: async (conversationId, payload) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const conversation = get().conversations.find(c => c.id === conversationId);
    const otherUserId = conversation?.otherParticipant?.id;

    if (otherUserId) {
      const { data: restriction } = await supabase
        .from('buyer_restrictions')
        .select('*')
        .eq('seller_id', otherUserId)
        .eq('buyer_id', user.id)
        .maybeSingle();

      if (restriction) {
        throw new Error('You are restricted from messaging this user.');
      }
    }

    const messageType = payload.message_type || 'text';
    const content = payload.content || '';
    
    // Merge active reply into metadata if it exists
    const activeReply = get().activeReplies[conversationId];
    let metadata = payload.metadata ? { ...payload.metadata } : {};
    
    let replyToMessageId = null;
    if (activeReply) {
      replyToMessageId = activeReply.id;
      metadata.reply_to_content = activeReply.content || activeReply.message_type;
      metadata.reply_to_sender = activeReply.sender?.full_name || activeReply.sender?.username || 'Unknown';
    }

    const sharedPostId = payload.shared_post_id || null;

    // Disappearing messages logic
    const duration = get().conversations.find(c => c.id === conversationId)?.disappearing_messages_duration;
    let expiresAt: string | null = null;
    if (duration) {
      const now = new Date();
      if (duration === '1 hour') expiresAt = new Date(now.getTime() + 60 * 60 * 1000).toISOString();
      else if (duration === '1 day') expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
      else if (duration === '7 days') expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
      else if (duration === '30 days') expiresAt = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();
      else if (duration === '1 year') expiresAt = new Date(now.getFullYear() + 1, now.getMonth(), now.getDate()).toISOString();
    }

    // Extract media_url from metadata if provided (specifically from sendMediaMessage)
    const mediaUrl = metadata?.url || null;

    const optimisticId = `optimistic-${Date.now()}`;
    const optimisticMsg: ChatMessage = {
      id: optimisticId,
      conversation_id: conversationId,
      sender_id: user.id,
      content: content || null,
      message_type: messageType as any,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_read: false,
      read_at: null,
      shared_post_id: sharedPostId,
      media_url: mediaUrl,
      media_metadata: metadata,
      sender: null,
      reply_to_message_id: replyToMessageId,
      expires_at: expiresAt
    } as any;

    set(state => {
      const current = state.messages[conversationId] || [];
      const updatedMessages = [...current, optimisticMsg];
      
      const updatedConversations = state.conversations.map(c => {
        if (c.id === conversationId) {
          return {
            ...c,
            last_message: content || `[${messageType}]`,
            last_message_preview: content || `[${messageType}]`,
            last_message_at: optimisticMsg.created_at
          };
        }
        return c;
      });

      updatedConversations.sort((a, b) => {
        const aUnread = state.unreadCounts[a.id] || 0;
        const bUnread = state.unreadCounts[b.id] || 0;
        if (aUnread !== bUnread) {
          return bUnread - aUnread;
        }
        return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
      });

      // Clear the active reply
      const nextActiveReplies = { ...state.activeReplies };
      delete nextActiveReplies[conversationId];

      return {
        messages: { ...state.messages, [conversationId]: updatedMessages },
        messagesMap: { ...state.messagesMap, [conversationId]: updatedMessages },
        conversations: updatedConversations,
        activeReplies: nextActiveReplies
      };
    });

    try {
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content || null,
          message_type: messageType as any,
          shared_post_id: sharedPostId,
          media_url: mediaUrl,
          media_metadata: metadata,
          reply_to_message_id: replyToMessageId,
          expires_at: expiresAt
        } as any)
        .select(`
          *,
          profiles!messages_sender_id_fkey(*)
        `)
        .single();

      if (error) throw error;

      const realMsg = {
        ...newMessage,
        sender: (newMessage as any).profiles
      } as unknown as ChatMessage;

      set(state => {
        const current = state.messages[conversationId] || [];
        const filtered = current.filter(m => m.id !== optimisticId && m.id !== realMsg.id);
        const updatedMessages = [...filtered, realMsg];

        return {
          messages: { ...state.messages, [conversationId]: updatedMessages },
          messagesMap: { ...state.messagesMap, [conversationId]: updatedMessages }
        };
      });

      // Emit Event
      useAppOrchestrator.getState().emitEvent({
        event_type: 'message_sent',
        actor_id: user.id,
        target_id: otherUserId || undefined,
        entity_id: realMsg.id,
        entity_type: 'message',
        payload: { conversation_id: conversationId, message_type: messageType }
      });

      return realMsg;
    } catch (err) {
      console.error('Failed sending message:', err);
      set(state => {
        const current = state.messages[conversationId] || [];
        const filtered = current.filter(m => m.id !== optimisticId);
        return {
          messages: { ...state.messages, [conversationId]: filtered },
          messagesMap: { ...state.messagesMap, [conversationId]: filtered }
        };
      });
      throw err;
    }
  },

  // 5. Subscribe to message arrivals in real-time
  subscribeToMessages: (conversationId: string) => {
    let currentUserId: string | null = null; // Declare currentUserId here
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      currentUserId = data.user?.id || null;
    });

    const channel = supabase.channel(`conversation:${conversationId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `conversation_id=eq.${conversationId}`
      }, async (payload: RealtimePostgresChangesPayload<MessageRow>) => { // payload.new is already MessageRow
        const newMsg = payload.new as any;
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', newMsg.sender_id)
          .single();
        
        const fullMsg = {
          ...newMsg,
          sender: profile || null
        } as unknown as ChatMessage;

        get().addMessage(conversationId, fullMsg);

        // Mark as delivered if not the sender
        if (newMsg.sender_id !== currentUserId && !newMsg.delivered_at) {
          (supabase.from('messages')
            .update({ delivered_at: new Date().toISOString() } as any) as any)
            .eq('id', newMsg.id)
            .then(() => {})
            .catch(console.error);
        }

        set(state => {
          const updatedConversations = state.conversations.map(c => {
            if (c.id === conversationId) {
              return {
                ...c,
                last_message: newMsg.content,
                last_message_preview: newMsg.content,
                last_message_at: newMsg.created_at
              };
            }
            return c;
          });

          // Unread system rules: increment for recipient only and reset when opened
          const isSenderSelf = newMsg.sender_id === currentUserId;
          const isActive = state.activeConversation?.id === conversationId;
          const nextUnreadCounts = { ...state.unreadCounts };

          if (!isSenderSelf && !isActive) {
            nextUnreadCounts[conversationId] = (nextUnreadCounts[conversationId] || 0) + 1;
          }

          updatedConversations.sort((a, b) => {
            const aUnread = nextUnreadCounts[a.id] || 0;
            const bUnread = nextUnreadCounts[b.id] || 0;
            if (aUnread !== bUnread) {
              return bUnread - aUnread;
            }
            return new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime();
          });

          return {
            conversations: updatedConversations,
            unreadCounts: nextUnreadCounts
          };
        });

        // Trigger database read update if actively opened
        const activeConv = get().activeConversation;
        if (activeConv && activeConv.id === conversationId && newMsg.sender_id !== currentUserId) {
          get().markConversationRead(conversationId);
        }
      });

    const reactionChannel = supabase.channel(`reactions:${conversationId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'message_reactions'
      }, async (payload: RealtimePostgresChangesPayload<MessageReactionRow>) => {
        const { eventType, new: newRec, old: oldRec } = payload;
        
        set(state => {
          let nextReactions = { ...state.messageReactions };
          
          if (eventType === 'INSERT') {
            const msgId = newRec.message_id;
            const current = nextReactions[msgId] || [];
            if (!current.find(r => r.id === newRec.id)) {
              nextReactions[msgId] = [...current, newRec];
            }
          } else if (eventType === 'DELETE') {
            const msgId = oldRec.message_id;
            if (msgId && nextReactions[msgId]) {
              nextReactions[msgId] = nextReactions[msgId].filter(r => r.id !== oldRec.id);
            } else {
              // Brute force find if msgId missing
              Object.keys(nextReactions).forEach(mId => {
                nextReactions[mId] = nextReactions[mId].filter(r => r.id !== oldRec.id);
              });
            }
          }
          
          return { messageReactions: nextReactions };
        });
      });

    channel.subscribe();
    reactionChannel.subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(reactionChannel);
    };
  },

  // 6. Reset unread state on select/open
  markConversationRead: async (conversationId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set(state => {
      const nextUnread = { ...state.unreadCounts, [conversationId]: 0 };
      const updatedConversations = state.conversations.map(c => {
        if (c.id === conversationId) {
          return { ...c, unreadCount: 0 };
        }
        return c;
      });
      return {
        unreadCounts: nextUnread,
        conversations: updatedConversations
      };
    });

    try {
      await supabase
        .from('messages')
        .update({ is_read: true, read_at: new Date().toISOString(), delivered_at: new Date().toISOString() } as any)
        .eq('conversation_id', conversationId)
        .neq('sender_id', user.id)
        .or('is_read.eq.false,read_at.is.null');
    } catch (err) {
      console.error('Failed marking conversation read:', err);
    }
  },

  markMessageDelivered: async (messageId: string) => {
    try {
      await supabase
        .from('messages')
        .update({ delivered_at: new Date().toISOString() } as any)
        .eq('id', messageId)
        .is('delivered_at', null); // Only update if not already delivered
    } catch (err) {
      // Silently fail for delivery status
    }
  },

  updateConversationSettings: async (conversationId, settings) => {
    try {
      const { error } = await supabase
        .from('conversations')
        .update(settings)
        .eq('id', conversationId);

      if (error) throw error;

      set(state => ({
        conversations: state.conversations.map((c: ChatConversation) => 
          c.id === conversationId ? { ...c, ...settings } : c
        )
      }));
    } catch (err) {
      console.error('Failed to update conversation settings:', err);
    }
  },

  // 7. Track Global Online Presence safely across guest environments
  trackPresence: () => {
    let currentUserId: string | null = null;
    supabase.auth.getUser().then(({ data }: { data: { user: User | null } }) => {
      currentUserId = data.user?.id || null;
      if (currentUserId) {
        // Clean up any existing duplicate channel with safe verification guard
        if (typeof supabase.getChannels === 'function') {
          const existing = supabase.getChannels().filter((c: RealtimeChannel) => c.topic === 'global:presence' || c.topic === 'realtime:global:presence');
          existing.forEach((c: RealtimeChannel) => supabase.removeChannel(c));
        }

        const presenceChannel = supabase.channel('global:presence', {
          config: { presence: { key: currentUserId } }
        });

        presenceChannel.on('presence', { event: 'sync' }, () => {
          const state = presenceChannel.presenceState();
          const onlineUsers: Record<string, boolean> = {};
          Object.keys(state).forEach(uid => {
            onlineUsers[uid] = true;
          });
          set({ onlineUsers });
        });

        presenceChannel.subscribe(async (status: string) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ online: true, updatedAt: new Date().toISOString() });
          }
        });
      }
    });

    return () => {
      if (typeof supabase.getChannels === 'function') {
        supabase.getChannels().filter((c: RealtimeChannel) => c.topic === 'global:presence' || c.topic === 'realtime:global:presence').forEach((c: RealtimeChannel) => supabase.removeChannel(c));
      }
    };
  },

  setActiveReply: (conversationId: string, message: ChatMessage | null) => {
    set(state => ({
      activeReplies: { ...state.activeReplies, [conversationId]: message }
    }));
  },

  sendMediaMessage: async (conversationId: string, file: File) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    set(state => ({
      mediaUploadQueue: { ...state.mediaUploadQueue, [fileName]: { file, progress: 0 } }
    }));

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat').getPublicUrl(fileName);

      const type = file.type.startsWith('video/') ? 'video' : file.type.startsWith('image/') ? 'image' : 'file';
      
      const payload = {
        message_type: type as any,
        metadata: {
          url: publicUrl,
          type: file.type,
          size: file.size,
          fileName: file.name
        }
      };

      await get().sendMessage(conversationId, payload);
    } catch (err) {
      console.error('Failed to send media message', err);
    } finally {
      set(state => {
        const newQueue = { ...state.mediaUploadQueue };
        delete newQueue[fileName];
        return { mediaUploadQueue: newQueue };
      });
    }
  },

  sendVoiceMessage: async (conversationId: string, file: File, durationSeconds: number) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Not authenticated');

    const fileExt = file.name.split('.').pop();
    const fileName = `${user.id}/${Date.now()}.${fileExt}`;

    try {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('chat')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from('chat').getPublicUrl(fileName);

      const payload = {
        message_type: 'voice' as any,
        metadata: {
          url: publicUrl,
          duration_seconds: durationSeconds
        }
      };

      await get().sendMessage(conversationId, payload);
    } catch (err) {
      console.error('Failed to send voice message', err);
    }
  },

  toggleReaction: async (messageId: string, emoji: string) => {
     try {
       const res = await (supabase.rpc as any)('toggle_message_reaction', {
         p_message_id: messageId,
         p_emoji: emoji
       });
       
       const { data: { user } } = await supabase.auth.getUser();
       if (!user) return;
       
       set(state => {
          const currentReactions = state.messageReactions[messageId] || [];
          const existsIndex = currentReactions.findIndex(r => r.user_id === user.id && r.emoji === emoji);
          
          let nextReactions = [...currentReactions];
          if (existsIndex >= 0) {
            nextReactions.splice(existsIndex, 1);
          } else {
            nextReactions.push({ id: Date.now().toString(), message_id: messageId, user_id: user.id, emoji });
          }

          return {
            messageReactions: { ...state.messageReactions, [messageId]: nextReactions }
          };
       });
     } catch (err) {
       console.error('Failed to toggle reaction', err);
     }
  }
}));

// Export alias as requested in Step 11
export const useMessagingStore = useChatStore;