import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useChatStore, type ChatMessage } from '../stores/useChatStore';

const EMPTY_MESSAGES: ChatMessage[] = [];

export function useConversation(conversationId: string | null) {
  const { user } = useAuthStore();
  const [isSending, setIsSending] = useState(false);
  const presenceChannelRef = useRef<any>(null);

  // Default to empty array if undefined
  const messages = useChatStore(state => {
    if (!conversationId) return EMPTY_MESSAGES;
    return state.messages[conversationId] || EMPTY_MESSAGES;
  });

  const fetchMessages = useCallback(async () => {
    if (!conversationId || !user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select(`
          *,
          profiles!messages_sender_id_fkey(*)
        `)
        .eq('conversation_id', conversationId)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: true }); // Newest at bottom

      if (error) throw error;

      const mappedMessages: ChatMessage[] = data.map((m: any) => ({
        ...m,
        sender: m.profiles
      }));

      useChatStore.getState().setMessages(conversationId, mappedMessages);
      
      // Mark as read if receiving them
      const unreadMyMessages = data.filter(m => !m.is_read && m.sender_id !== user.id);
      if (unreadMyMessages.length > 0) {
        await supabase
          .from('messages')
          .update({ is_read: true })
          .in('id', unreadMyMessages.map(m => m.id));
      }
      
    } catch (err) {
      console.error('Error fetching messages:', err);
    }
  }, [conversationId, user]);

  useEffect(() => {
    if (!conversationId) return;
    
    fetchMessages();
    
    // Subscribe to messages in realtime
    const unsubscribe = useChatStore.getState().subscribeToMessages(conversationId);
    
    // Setup typing indicator presence
    const channelTopic = `typing:${conversationId}`;
    const existing = supabase.getChannels().filter(c => c.topic === channelTopic || c.topic === `realtime:${channelTopic}`);
    existing.forEach(c => supabase.removeChannel(c));

    const presenceChannel = supabase.channel(channelTopic, {
      config: { presence: { key: user?.id || 'unknown' } }
    });

    presenceChannelRef.current = presenceChannel;

    presenceChannel.on('presence', { event: 'sync' }, () => {
      const state = presenceChannel.presenceState();
      const storeState = useChatStore.getState();
      
      // Reset all for convo first
      Object.keys(storeState.typingUsers[conversationId] || {}).forEach(uid => {
        storeState.setTypingUser(conversationId, uid, false);
      });
      
      // Set current typers
      Object.keys(state).forEach(uid => {
        if (uid !== user?.id) {
          const presenceArray = state[uid] as any[];
          const isTyping = presenceArray.some(p => p.isTyping);
          storeState.setTypingUser(conversationId, uid, isTyping);
        }
      });
    });

    presenceChannel.subscribe();

    return () => {
      unsubscribe();
      presenceChannel.unsubscribe();
      presenceChannelRef.current = null;
    };
  }, [conversationId, fetchMessages, user]);

  const setTyping = async (isTyping: boolean) => {
    if (presenceChannelRef.current) {
      try {
        await presenceChannelRef.current.track({ isTyping, updatedAt: new Date().toISOString() });
      } catch (err) {
        console.warn('Failed to track typing presence indicator:', err);
      }
    }
  };

  const sendMessage = async (
    content: string, 
    mediaFile?: File, 
    mediaType: 'text' | 'image' | 'file' | 'voice' | 'shared_post' = 'text',
    sharedPostId?: string
  ) => {
    if (!conversationId || !user) return null;
    
    setIsSending(true);
    let mediaUrl = null;

    try {
      if (mediaFile) {
        const fileExt = mediaFile.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `${conversationId}/${fileName}`;
        
        const { error: uploadError } = await supabase.storage
          .from('chat')
          .upload(filePath, mediaFile);
          
        if (uploadError) throw uploadError;
        
        const { data: { publicUrl } } = supabase.storage
          .from('chat')
          .getPublicUrl(filePath);
          
        mediaUrl = publicUrl;
      }

      // Optimistic insert placeholder
      
      const { data: newMessage, error } = await supabase
        .from('messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: content || null, // null if image only
          message_type: mediaType,
          media_url: mediaUrl,
          shared_post_id: sharedPostId || null
        })
        .select(`
          *,
          profiles!messages_sender_id_fkey(*)
        `)
        .single();
        
      if (error) throw error;
      
      // The realtime subscription will pick this up but adding optimistically is ok 
      // if we handle deduplication via ID check in store.addMessage
      useChatStore.getState().addMessage(conversationId, {
        ...newMessage,
        sender: newMessage.profiles
      } as unknown as any);

      return newMessage;
    } catch (err) {
      console.error('Error sending message:', err);
      return null;
    } finally {
      setIsSending(false);
    }
  };

  return {
    messages,
    sendMessage,
    isSending,
    refreshMessages: fetchMessages,
    setTyping
  };
}
