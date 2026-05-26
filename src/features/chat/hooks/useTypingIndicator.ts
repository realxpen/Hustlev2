import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useChatStore } from '../stores/useChatStore';

const EMPTY_TYPING = {};

export function useTypingIndicator(conversationId: string | null) {
  const { user } = useAuthStore();
  const channelRef = useRef<any>(null);
  const typingStatusTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const typingUsers = useChatStore(state => {
    if (!conversationId) return EMPTY_TYPING;
    return state.typingUsers[conversationId] || EMPTY_TYPING;
  });

  useEffect(() => {
    if (!conversationId || !user) return;

    // Use Supabase presence for typing indicators
    const channelName = `typing:${conversationId}`;
    const channel = supabase.channel(channelName, {
      config: {
        presence: {
          key: user.id
        }
      }
    });

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        
        // Convert presence state dict into local store setup
        Object.keys(state).forEach((userId) => {
          if (userId === user.id) return; // Ignore self
          
          const userState: any = state[userId]?.[0];
          const isTyping = userState?.isTyping || false;
          
          useChatStore.getState().setTypingUser(conversationId, userId, isTyping);
        });
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [conversationId, user]);

  const setTyping = useCallback(async (isTyping: boolean) => {
    const channel = channelRef.current;
    if (!channel || !user) return;
    
    await channel.track({ isTyping, updated_at: new Date().toISOString() });
  }, [user]);

  const notifyTyping = useCallback(() => {
    setTyping(true);
    
    if (typingStatusTimeoutRef.current) {
      clearTimeout(typingStatusTimeoutRef.current);
    }
    
    typingStatusTimeoutRef.current = setTimeout(() => {
      setTyping(false);
    }, 2000);
  }, [setTyping]);

  return {
    typingUsers,
    setTyping,
    notifyTyping
  };
}
