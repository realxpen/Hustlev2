import { useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useChatStore, type ChatMessage } from '../stores/useChatStore';

export function useRealtimeChat() {
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    // We can subscribe to the user's participant records or specific topics
    // But safely we can listen to ALL messages where they are the participant if we know their conversations
    // Since RLS applies differently to Realtime sometimes depending on setup,
    // Usually it's better to listen to 'messages' and filter.
    // Assuming RLS is correctly applied to Realtime via roles (supabase uses authenticated role)

    const cleanupPresence = useChatStore.getState().trackPresence();

    const channel = supabase.channel(`public:chat:${user.id}`)
      .on('postgres_changes', {
        event: '*', 
        schema: 'public',
        table: 'messages',
        // In some setups filtering on RLS works beautifully, or we filter on client.
        // For security, if RLS protects realtime, we don't need excessive filters in the definition.
      }, async (payload) => {
        if (payload.eventType === 'INSERT') {
          // New message received
          const newMsg = payload.new as any;
          // Verify we care about this conversation by checking the current state
          const currentConversations = useChatStore.getState().conversations;
          const isRelevant = currentConversations.some(c => c.id === newMsg.conversation_id);
          
          if (!isRelevant) {
             // We may need to refresh conversations since we might be added to a new one
             // Or at least, check if we're a participant
             const { data } = await supabase.from('conversation_participants').select('*').eq('conversation_id', newMsg.conversation_id).eq('user_id', user.id);
             if (data && data.length > 0) {
               // We should fetch new conversations List probably
             }
             return;
          }

          // Fetch full message with sender profile
          const { data: fullMessage } = await supabase
            .from('messages')
            .select(`*, profiles!messages_sender_id_fkey(*)`)
            .eq('id', newMsg.id)
            .single();

          if (fullMessage) {
            // Mark as delivered since we just received it
            if (newMsg.sender_id !== user.id) {
              useChatStore.getState().markMessageDelivered(newMsg.id);
            }

            useChatStore.getState().addMessage(newMsg.conversation_id, {
              ...fullMessage,
              sender: fullMessage.profiles
            } as unknown as any);
          }
        } else if (payload.eventType === 'UPDATE') {
           // Handle message read status updates etc
           const updatedMsg = payload.new as any;
           useChatStore.getState().setMessages(updatedMsg.conversation_id, prev => 
             prev.map(m => m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read, read_at: updatedMsg.read_at, delivered_at: updatedMsg.delivered_at, expires_at: updatedMsg.expires_at } : m)
           );
        } else if (payload.eventType === 'DELETE') {
           const deletedId = (payload.old as any).id;
           // Iterate over conversations to find and remove the message
           const { messages: currentMessagesMap, setMessages } = useChatStore.getState();
           Object.keys(currentMessagesMap).forEach(cId => {
             const msgs = currentMessagesMap[cId];
             if (msgs.some(m => m.id === deletedId)) {
               setMessages(cId, msgs.filter(m => m.id !== deletedId));
             }
           });
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'conversations'
      }, (payload) => {
        // Update conversation in list (sync last message and settings)
        const updated = payload.new as any;
        useChatStore.getState().setConversations(prev => 
          prev.map(c => c.id === updated.id ? { ...c, ...updated } : c)
            .sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime())
        );
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      cleanupPresence();
    };
  }, [user]); // Removed store.conversations to avoid channel Recreation loops
}
