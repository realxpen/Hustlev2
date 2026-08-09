import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { FeedPost as BaseFeedPost } from '../../../types/feed';

export type FeedPost = BaseFeedPost & Record<string, any>;

interface FeedState {
  posts: FeedPost[];
  currentPostIndex: number;
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  isFetchingMore: boolean;
  commentsMap: Record<string, any[]>;
  loadingComments: Record<string, boolean>;
  collections: any[];
  networkQuality: 'fast' | 'medium' | 'slow';
  activeMediaId: string | null;
  
  setCurrentPostIndex: (index: number) => void;
  fetchDiscoveryFeed: (isRefresh: boolean) => Promise<void>;
  setPosts: (nextPosts: FeedPost[] | ((posts: FeedPost[]) => FeedPost[])) => void;
  addPostOptimistically: (post: FeedPost) => void;
  incrementLikes: (postId: string) => void;
  incrementViews: (postId: string) => void;
  setActiveMediaId: (id: string | null) => void;
  optimizeFeedPerformance: () => void;
  preloadMedia: (post: FeedPost) => void;
  fetchComments: (postId: string) => Promise<void>;
  addCommentOptimistically: (postId: string, comment: any) => void;
  updatePostCommentCount: (postId: string, delta?: number) => void;
  toggleLikeOptimistically: (postId: string) => void;
  syncPostLikes: (postId: string) => Promise<void>;
  toggleRepostOptimistically: (postId: string, comment?: string | null) => void;
  updatePostRepost: (postId: string, reposted: boolean, repostsCount: number) => void;
  fetchReposts: (userId: string) => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  createCollection: (name: string) => Promise<void>;
  addPostToCollection: (postId: string, collectionId: string) => Promise<void>;
  removePostFromCollection: (postId: string) => Promise<void>;
  copyPostLink: (postId: string) => Promise<void>;
  sharePostToUser: (postId: string, targetUserId: string) => Promise<void>;
}

const ITEMS_PER_PAGE = 5;

const createFallbackFeedPosts = (): FeedPost[] => [
  {
    id: 'mock_feed_01',
    user_id: 'usr_lagos_9081',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-app-developer-working-on-a-smartphone-layout-40488-large.mp4',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-app-developer-working-on-a-smartphone-layout-40488-large.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=800&auto=format&fit=crop',
    title: 'Refactoring Native Performance Chains',
    caption: 'Optimizing state layout managers over standard constraints inside unstable cellular tracks around Lagos mainland.',
    description: 'Optimizing state layout managers over standard constraints inside unstable cellular tracks around Lagos mainland.',
    service_id: 'srv_perf_01',
    service_title: 'Unstable Network Engine Calibration',
    service_starting_price: 45000,
    attached_listing_type: 'service',
    attached_listing_data: {
      title: 'Unstable Network Engine Calibration',
      description: 'Performance tune-up for mobile web apps under uneven network conditions.',
      base_price: 45000,
      is_active: true
    },
    currency: 'NGN',
    likes_count: 142,
    views_count: 902,
    comments_count: 3,
    reposts_count: 1,
    saves_count: 7,
    hustler_id: 'usr_lagos_9081',
    created_at: new Date().toISOString(),
    hustler: {
      id: 'usr_lagos_9081',
      username: 'ayomide_dev',
      full_name: 'Ayomide Oladeji',
      avatar_url: null
    } as any,
    profiles: {
      id: 'usr_lagos_9081',
      username: 'ayomide_dev',
      full_name: 'Ayomide Oladeji',
      avatar_url: null,
      is_hustler: true,
      primary_skill: 'Performance Engineer',
      location: 'Lagos, NG',
      rating_average: 4.8,
      review_count: 38,
      verified: true
    }
  },
  {
    id: 'mock_feed_02',
    user_id: 'usr_lagos_9082',
    video_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-looking-at-phone-41663-large.mp4',
    media_url: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-sign-light-looking-at-phone-41663-large.mp4',
    media_type: 'video',
    thumbnail_url: 'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=800&auto=format&fit=crop',
    title: 'UI Component Architecture Systems',
    caption: 'Building zero-friction escrow drawer layout components matching modern high-fidelity animation models.',
    description: 'Building zero-friction escrow drawer layout components matching modern high-fidelity animation models.',
    service_id: 'srv_ui_02',
    service_title: 'Framer Motion System Setup',
    service_starting_price: 35000,
    attached_listing_type: 'service',
    attached_listing_data: {
      title: 'Framer Motion System Setup',
      description: 'Interaction polish and component motion for marketplace experiences.',
      base_price: 35000,
      is_active: true
    },
    currency: 'NGN',
    likes_count: 89,
    views_count: 421,
    comments_count: 5,
    reposts_count: 2,
    saves_count: 11,
    hustler_id: 'usr_lagos_9082',
    created_at: new Date().toISOString(),
    hustler: {
      id: 'usr_lagos_9082',
      username: 'chinwendu_design',
      full_name: 'Chinwendu U.',
      avatar_url: null
    } as any,
    profiles: {
      id: 'usr_lagos_9082',
      username: 'chinwendu_design',
      full_name: 'Chinwendu U.',
      avatar_url: null,
      is_hustler: true,
      primary_skill: 'Product Designer',
      location: 'Lagos, NG',
      rating_average: 4.9,
      review_count: 44,
      verified: true
    }
  }
];

export const useFeedStore = create<FeedState>((set, get) => ({
  posts: [],
  currentPostIndex: 0,
  isLoading: false,
  error: null,
  hasMore: true,
  isFetchingMore: false,
  commentsMap: {},
  loadingComments: {},
  collections: [{ id: 'general', name: 'Saved posts' }],
  networkQuality: 'fast',
  activeMediaId: null,

  setCurrentPostIndex: (currentPostIndex) => set({ currentPostIndex }),

  fetchDiscoveryFeed: async (isRefresh) => {
    if (get().isLoading || (!isRefresh && !get().hasMore)) return;

    set({ isLoading: true, isFetchingMore: !isRefresh, error: null });

    const currentOffset = isRefresh ? 0 : get().posts.length;
    const fromIndex = currentOffset;
    const toIndex = fromIndex + ITEMS_PER_PAGE - 1;

    try {
      const { data, error } = await supabase
        .from('feed_posts')
        .select(`
          id,
          video_url,
          thumbnail_url,
          title,
          description,
          service_id,
          service_title,
          service_starting_price,
          currency,
          likes_count,
          views_count,
          hustler_id,
          created_at,
          hustler:profiles!hustler_id (
            id,
            username,
            full_name,
            avatar_url
          )
        `)
        .order('created_at', { ascending: false })
        .range(fromIndex, toIndex);

      if (error) throw error;

      const parsedPosts = (data && data.length > 0
        ? data
        : isRefresh
          ? createFallbackFeedPosts()
          : []) as unknown as FeedPost[];

      set((state) => ({
        posts: isRefresh ? parsedPosts : [...state.posts, ...parsedPosts],
        currentPostIndex: isRefresh ? 0 : state.currentPostIndex,
        hasMore: data ? data.length === ITEMS_PER_PAGE : false,
        isLoading: false,
        isFetchingMore: false
      }));

    } catch (err: any) {
      console.error('[Feed Engine Sync] Defaulting context memory stack due to infrastructure exception:', err);
      
      if (isRefresh) {
        set({
          posts: createFallbackFeedPosts(),
          currentPostIndex: 0,
          hasMore: false,
          isLoading: false,
          isFetchingMore: false
        });
      } else {
        set({ isLoading: false, isFetchingMore: false, hasMore: false });
      }
    }
  },

  setPosts: (nextPosts) => {
    set((state) => ({
      posts: typeof nextPosts === 'function' ? nextPosts(state.posts) : nextPosts
    }));
  },

  addPostOptimistically: (post) => {
    set((state) => ({
      posts: [post, ...state.posts.filter((item) => item.id !== post.id)]
    }));
  },

  incrementLikes: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, likes_count: post.likes_count + 1 } : post
      )
    }));
  },

  incrementViews: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, views_count: post.views_count + 1 } : post
      )
    }));
  },

  setActiveMediaId: (activeMediaId) => set({ activeMediaId }),
  optimizeFeedPerformance: () => undefined,
  preloadMedia: () => undefined,

  fetchComments: async (postId) => {
    set((state) => ({
      loadingComments: { ...state.loadingComments, [postId]: true }
    }));

    try {
      const { data } = await supabase
        .from('comments')
        .select(`
          *,
          profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

      set((state) => ({
        commentsMap: { ...state.commentsMap, [postId]: data || [] },
        loadingComments: { ...state.loadingComments, [postId]: false }
      }));
    } catch {
      set((state) => ({
        commentsMap: { ...state.commentsMap, [postId]: state.commentsMap[postId] || [] },
        loadingComments: { ...state.loadingComments, [postId]: false }
      }));
    }
  },

  addCommentOptimistically: (postId, comment) => {
    set((state) => ({
      commentsMap: {
        ...state.commentsMap,
        [postId]: [...(state.commentsMap[postId] || []), comment]
      },
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, comments_count: (post.comments_count || 0) + 1 }
          : post
      )
    }));
  },

  updatePostCommentCount: (postId, delta = 1) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, comments_count: Math.max(0, (post.comments_count || 0) + delta) }
          : post
      )
    }));
  },

  toggleLikeOptimistically: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        const userHasLiked = !post.userHasLiked;
        return {
          ...post,
          userHasLiked,
          likes_count: Math.max(0, (post.likes_count || 0) + (userHasLiked ? 1 : -1))
        };
      })
    }));
  },

  syncPostLikes: async () => undefined,

  toggleRepostOptimistically: (postId) => {
    set((state) => ({
      posts: state.posts.map((post) => {
        if (post.id !== postId) return post;
        const userHasReposted = !post.userHasReposted;
        return {
          ...post,
          userHasReposted,
          reposts_count: Math.max(0, (post.reposts_count || 0) + (userHasReposted ? 1 : -1))
        };
      })
    }));
  },

  updatePostRepost: (postId, reposted, repostsCount) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, userHasReposted: reposted, reposts_count: repostsCount }
          : post
      )
    }));
  },

  fetchReposts: async () => undefined,

  toggleSave: async (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, userHasSaved: !post.userHasSaved } : post
      )
    }));
  },

  createCollection: async (name) => {
    set((state) => ({
      collections: [
        ...state.collections,
        { id: `collection-${Date.now()}`, name }
      ]
    }));
  },

  addPostToCollection: async (postId, collectionId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId
          ? { ...post, userHasSaved: true, collection_id: collectionId === 'general' ? null : collectionId }
          : post
      )
    }));
  },

  removePostFromCollection: async (postId) => {
    set((state) => ({
      posts: state.posts.map((post) =>
        post.id === postId ? { ...post, userHasSaved: false, collection_id: null } : post
      )
    }));
  },

  copyPostLink: async (postId) => {
    const url = `${window.location.origin}/post/${postId}`;
    await navigator.clipboard?.writeText(url);
  },

  sharePostToUser: async () => undefined
}));
