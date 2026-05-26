import { useCallback, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useFeedStore, type FeedPost } from '../stores/useFeedStore';

const POSTS_PER_PAGE = 10;

export function useFeed() {
  const { user } = useAuthStore();
  const store = useFeedStore();

  // Initial load
  useEffect(() => {
    store.fetchInitialFeed(POSTS_PER_PAGE);
    store.optimizeFeedPerformance();
  }, []);

  // Synchronize user repost state, saves and collections
  useEffect(() => {
    if (user) {
      store.fetchReposts(user.id);
      store.fetchSavedPosts();
      store.fetchCollections();
    }
  }, [user, store.fetchReposts, store.fetchSavedPosts, store.fetchCollections]);

  // Realtime subscription setup
  useEffect(() => {
    store.subscribeToFeed();
    return () => {
      store.unsubscribeFromFeed();
    };
  }, [store.subscribeToFeed, store.unsubscribeFromFeed]);

  return {
    posts: store.posts,
    isLoading: store.isLoading,
    isFetchingMore: store.isFetchingMore,
    error: store.error,
    hasMore: store.hasMore,
    fetchNextPage: () => store.fetchMoreFeed(POSTS_PER_PAGE),
    refreshFeed: () => store.fetchInitialFeed(POSTS_PER_PAGE)
  };
}
