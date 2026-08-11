import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useFeedStore } from '../stores/useFeedStore';
import type { DbComment } from '../../../types/index';

export interface FeedComment extends DbComment {
  profiles?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
  } | null;
}

export function useComments(postId: string) {
  const { user } = useAuthStore();
  const store = useFeedStore();
  const [comments, setComments] = useState<FeedComment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!postId) return;

    const fetchComments = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const { data, error: fetchError } = await supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
          `)
          .eq('post_id', postId)
          .order('created_at', { ascending: true });

        if (fetchError) throw fetchError;
        setComments(data || []);
      } catch (err: any) {
        console.error('Error fetching comments:', err);
        setError(err.message || 'Failed to fetch comments');
      } finally {
        setIsLoading(false);
      }
    };

    fetchComments();

    // Realtime for comments on this post
    const channel = supabase.channel(`public:comments:${postId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, async (payload) => {
        // Fetch full comment with profile
        const { data: newComment } = await supabase
          .from('comments')
          .select(`
            *,
            profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
          `)
          .eq('id', payload.new.id)
          .single();
          
        if (newComment) {
          setComments(prev => [...prev, newComment]);
        }
      })
      .on('postgres_changes', {
        event: 'DELETE',
        schema: 'public',
        table: 'comments',
        filter: `post_id=eq.${postId}`
      }, (payload) => {
         setComments(prev => prev.filter(c => c.id !== payload.old.id));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [postId]);

  const addComment = async (content: string) => {
    if (!user || !content.trim()) return null;
    
    setError(null);
    try {
      const { data, error: insertError } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim()
        })
        .select(`
          *,
          profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
        `)
        .single();
        
      if (insertError) throw insertError;
      
      // Update global feed store comment count optimistically
      store.updatePostCommentCount(postId);
      
      // Add immediately if our realtime sync is slow
      // Check if it's already there to prevent dupes later if needed
      setComments(prev => {
        if (prev.find(c => c.id === data.id)) return prev;
        return [...prev, data];
      });
      
      return data;
    } catch (err: any) {
      console.error('Error adding comment:', err);
      setError(err.message || 'Failed to add comment');
      return null;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('comments')
        .delete()
        .eq('id', commentId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      setComments(prev => prev.filter(c => c.id !== commentId));
      return true;
    } catch (err) {
      console.error('Error deleting comment:', err);
      return false;
    }
  };

  return {
    comments,
    isLoading,
    error,
    addComment,
    deleteComment
  };
}
