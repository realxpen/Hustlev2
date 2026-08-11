import { useEffect, useCallback } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useChatStore, type ChatConversation } from '../stores/useChatStore';

export function useChat() {
  const { user } = useAuthStore();
  const conversations = useChatStore(state => state.conversations);
  const isLoading = useChatStore(state => state.isLoading);
  const error = useChatStore(state => state.error);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    await useChatStore.getState().fetchConversations();
  }, [user]);

  useEffect(() => {
    fetchConversations();
  }, [fetchConversations]);

  const createOrGetConversation = async (otherUserId: string) => {
    if (!user) return null;
    try {
      const { data: conversationId, error } = await (supabase.rpc as any)('get_or_create_conversation', {
        p_other_user_id: otherUserId
      });
      
      if (error) throw error;
      
      // Refresh conversations to get the new one fully mapped
      await fetchConversations();
      
      return conversationId as string;
    } catch (err) {
      console.error('Error creating conversation:', err);
      return null;
    }
  };

  return {
    conversations,
    isLoading,
    error,
    createOrGetConversation,
    refreshConversations: fetchConversations
  };
}
