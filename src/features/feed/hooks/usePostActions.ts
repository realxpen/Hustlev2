import { useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useFeedStore, type FeedPost } from '../stores/useFeedStore';

// Module-level cache to track in-flight like operations and prevent double-click or spam duplicate requests.
const inFlightToggles = new Map<string, Promise<boolean>>();
const inFlightReposts = new Map<string, Promise<any>>();

export function usePostActions() {
  const { user } = useAuthStore();
  const store = useFeedStore();
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createPost = async (
    caption: string, 
    file: File | null, 
    mediaType: 'image' | 'video' | 'none' = 'none',
    attachedListingType?: 'service' | 'product' | 'training' | null,
    attachedListingId?: string | null
  ) => {
    if (!user) {
      setError('You must be logged in to post');
      return null;
    }

    setIsUploading(true);
    setError(null);

    try {
      let mediaUrl = null;

      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('feed')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('feed')
          .getPublicUrl(filePath);

        mediaUrl = publicUrl;
      }

      const { data: post, error: insertError } = await (supabase as any)
        .from('posts')
        .insert({
          user_id: user.id,
          caption,
          media_url: mediaUrl,
          media_type: mediaType,
          attached_listing_type: attachedListingType || null,
          attached_listing_id: attachedListingId || null
        })
        .select(`
          *,
          profiles!posts_user_id_fkey(id, full_name, username, avatar_url),
          likes(count),
          comments(count)
        `)
        .single();

      if (insertError) throw insertError;

      if (post) {
        store.addPostOptimistically({
          ...post,
          userHasLiked: false
        } as FeedPost);
      }

      // Note: If realtime is on, this will also come through websocket and might be added twice
      // Best to add optimistically but handle deduplication or let realtime handle it
      // For now we'll do both and hope React handles keys well, ideally we add it here and skip the socket one if we authored it
      return post;
    } catch (err: any) {
      console.error('Error creating post:', err);
      setError(err.message || 'Failed to create post');
      return null;
    } finally {
      setIsUploading(false);
    }
  };

  const deletePost = async (postId: string) => {
    if (!user) return false;
    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      store.setPosts(prev => prev.filter(p => p.id !== postId));
      return true;
    } catch (err) {
      console.error('Error deleting post:', err);
      return false;
    }
  };

  const addComment = async (postId: string, content: string, parentCommentId: string | null = null) => {
    if (!user || !content.trim()) return null;

    const tempId = crypto.randomUUID();
    const newComment = {
      id: tempId,
      post_id: postId,
      user_id: user.id,
      content: content.trim(),
      parent_comment_id: parentCommentId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      profiles: {
        id: user.id,
        full_name: user.user_metadata?.full_name || null,
        username: user.user_metadata?.username || null,
        avatar_url: user.user_metadata?.avatar_url || null
      }
    };

    // Optimistically add to store
    store.addCommentOptimistically(postId, newComment as any);

    try {
      const { data, error } = await supabase
        .from('comments')
        .insert({
          post_id: postId,
          user_id: user.id,
          content: content.trim(),
          parent_comment_id: parentCommentId
        })
        .select(`
          *,
          profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
        `)
        .single();

      if (error) throw error;

      // Update with real DB data if needed, but the UI should have updated optimistically
      // Maybe re-fetch or sync tree if there's a risk of stale data
      return data;
    } catch (err) {
      console.error('Error adding comment:', err);
      // Revert optimistic update (could be complex in a tree, for now maybe just re-fetch)
      store.fetchComments(postId);
      store.updatePostCommentCount(postId, -1);
      return null;
    }
  };

  const toggleLike = async (postId: string, currentLikedState: boolean) => {
    if (!user) return false;

    // Fast return if we are already processing a request for this post to avoid spam
    if (inFlightToggles.has(postId)) {
      console.log('Toggle in flight, skipping click spam for post:', postId);
      return false;
    }

    // Optimistically toggle UI first to feel instantaneous
    store.toggleLikeOptimistically(postId);

    const performToggle = async (): Promise<boolean> => {
      const { data, error: rpcError } = await (supabase as any).rpc('toggle_like', {
        p_post_id: postId
      });

      if (rpcError) {
        throw rpcError;
      }

      // Explicitly return database source-of-truth liked status (true or false)
      return !!data;
    };

    const promise = performToggle();
    inFlightToggles.set(postId, promise);

    try {
      const isLiked = await promise;
      
      // Update UI with the exact server-side derived counts and liked status to keep client in sync
      await store.syncPostLikes(postId);
      return true;
    } catch (err) {
      console.error('Error toggling like in DB:', err);
      // Revert optimistic state back on errors
      store.toggleLikeOptimistically(postId);
      return false;
    } finally {
      // Clean up in-flight reference
      inFlightToggles.delete(postId);
    }
  };

  const toggleRepost = async (postId: string, comment: string | null = null) => {
    if (!user) return null;

    if (inFlightReposts.has(postId)) {
      console.log('Repost in flight, skipping click spam for post:', postId);
      return null;
    }

    // Optimistically toggle UI first to feel instantaneous
    store.toggleRepostOptimistically(postId, comment);

    const performToggle = async () => {
      const { data, error: rpcError } = await (supabase as any).rpc('toggle_repost', {
        p_post_id: postId,
        p_comment: comment
      });

      if (rpcError) {
        throw rpcError;
      }

      return data;
    };

    const promise = performToggle();
    inFlightReposts.set(postId, promise);

    try {
      const res = await promise;
      const reposted = res.action === 'reposted';
      const repostsCount = res.reposts_count;

      // Update state with exact DB numbers
      store.updatePostRepost(postId, reposted, repostsCount);
      
      // Update active reposts map
      store.fetchReposts(user.id);

      return res;
    } catch (err) {
      console.error('Error toggling repost in DB:', err);
      // Revert optimistic update
      store.toggleRepostOptimistically(postId, comment);
      return null;
    } finally {
      inFlightReposts.delete(postId);
    }
  };

  const toggleSave = async (postId: string) => {
    if (!user) return;
    await store.toggleSave(postId);
  };

  const createCollection = async (name: string) => {
    if (!user) return;
    await store.createCollection(name);
  };

  const addPostToCollection = async (postId: string, collectionId: string) => {
    if (!user) return;
    await store.addPostToCollection(postId, collectionId);
  };

  const removePostFromCollection = async (postId: string) => {
    if (!user) return;
    await store.removePostFromCollection(postId);
  };

  const copyPostLink = async (postId: string) => {
    if (!user) return;
    await store.copyPostLink(postId);
  };

  const sharePostToUser = async (postId: string, targetUserId: string) => {
    if (!user) return;
    await store.sharePostToUser(postId, targetUserId);
  };

  return {
    createPost,
    deletePost,
    addComment,
    toggleLike,
    toggleRepost,
    toggleSave,
    createCollection,
    addPostToCollection,
    removePostFromCollection,
    copyPostLink,
    sharePostToUser,
    isUploading,
    error
  };
}
