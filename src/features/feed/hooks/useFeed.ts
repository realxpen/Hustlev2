import { useEffect, useMemo } from 'react';
import { useFeedStore } from '../stores/useFeedStore';

export function useFeed() {
  const store = useFeedStore();

  // Extract core reactive data structures
  const posts = store.posts;
  const currentPostIndex = store.currentPostIndex;
  const isLoading = store.isLoading;
  const isFetchingMore = store.isFetchingMore;
  const hasMore = store.hasMore;
  const error = (store as any).error || null;

  // Resolve the primary fetch invocation method seamlessly across names
  const syncFeedData = useMemo(() => {
    return store.fetchDiscoveryFeed || (store as any).fetchInitialFeed;
  }, [store]);

  // Handle the automatic component mount data sync lifecycle hook safely
  useEffect(() => {
    if (typeof syncFeedData === 'function') {
      // Pass 'true' to ensure a fresh baseline state overwrite on initial load
      syncFeedData(true);
    } else {
      console.warn(
        '⚠️ [useFeed Hook] No explicit synchronization trigger method resolved on useFeedStore. ' +
        'Expected fetchDiscoveryFeed or fetchInitialFeed.'
      );
    }
  }, [syncFeedData]);

  // Wrap mutations and indexing handles safely for UI presentation layers
  const actions = useMemo(() => {
    return {
      setCurrentIndex: store.setCurrentPostIndex,
      incrementLikes: store.incrementLikes,
      incrementViews: store.incrementViews,
      refreshFeed: () => typeof syncFeedData === 'function' && syncFeedData(true),
      loadNextPage: () => typeof syncFeedData === 'function' && syncFeedData(false),
      fetchNextPage: () => typeof syncFeedData === 'function' && syncFeedData(false)
    };
  }, [store, syncFeedData]);

  return {
    posts,
    currentPostIndex,
    isLoading,
    isFetchingMore,
    hasMore,
    error,
    ...actions
  };
}
