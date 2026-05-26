import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../../../lib/supabase';
import type { FeedPost } from './useFeedStore';

export interface SuggestedCreator {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  hustle_name?: string | null;
  primary_skill?: string | null;
  is_hustler?: boolean;
  follower_count?: number;
}

export interface ExploreTopic {
  id: string;
  tag_name: string;
  usage_count: number;
}

interface DiscoveryState {
  exploreFeed: FeedPost[];
  trendingPosts: FeedPost[];
  trendingHashtags: ExploreTopic[];
  suggestedCreators: SuggestedCreator[];
  categoryFeeds: Record<string, FeedPost[]>;
  
  isLoadingExplore: boolean;
  isLoadingTrending: boolean;
  isLoadingCreators: boolean;
  searchResults: {
    services: any[];
    products: any[];
    training: any[];
    hustlers: any[];
  } | null;
  recentSearches: string[];
  error: string | null;

  fetchExploreFeed: (interests?: string[]) => Promise<void>;
  fetchTrending: () => Promise<void>;
  fetchSuggestedCreators: () => Promise<void>;
  fetchCategoryFeed: (category: string) => Promise<void>;
  performUnifiedSearch: (query: string, intent: string) => Promise<void>;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
}

export const useDiscoveryStore = create<DiscoveryState>()(
  persist(
    (set, get) => ({
      exploreFeed: [],
      trendingPosts: [],
      trendingHashtags: [],
      suggestedCreators: [],
      categoryFeeds: {},
      searchResults: null,
      recentSearches: [],

      isLoadingExplore: false,
      isLoadingTrending: false,
      isLoadingCreators: false,
      error: null,

      addRecentSearch: (query: string) => {
        if (!query.trim()) return;
        set(state => ({
          recentSearches: [
            query,
            ...state.recentSearches.filter(s => s !== query)
          ].slice(0, 10)
        }));
      },

      clearRecentSearches: () => set({ recentSearches: [] }),

  performUnifiedSearch: async (query: string, intent: string) => {
    if (!query || query.length < 2) {
      set({ searchResults: null });
      return;
    }

    set({ isLoadingExplore: true, error: null });
    try {
      const results: any = {
        services: [],
        products: [],
        training: [],
        hustlers: []
      };

      const searchQuery = `%${query}%`;

      // 1. Search Services
      if (intent === 'any' || intent === 'service') {
        const { data: services } = await (supabase as any)
          .from('services')
          .select('*, profiles:owner_id(full_name, avatar_url, hustle_name, primary_skill, is_hustler)')
          .eq('is_active', true)
          .or(`title.ilike.${searchQuery},description.ilike.${searchQuery},category.ilike.${searchQuery}`)
          .limit(10);
        results.services = services || [];
      }

      // 2. Search Products
      if (intent === 'any' || intent === 'product') {
        const { data: products } = await (supabase as any)
          .from('products')
          .select('*, profiles:owner_id(full_name, avatar_url, hustle_name, primary_skill, is_hustler)')
          .eq('is_active', true)
          .or(`title.ilike.${searchQuery},description.ilike.${searchQuery},category.ilike.${searchQuery}`)
          .limit(10);
        results.products = products || [];
      }

      // 3. Search Training
      if (intent === 'any' || intent === 'training') {
        const { data: training } = await (supabase as any)
          .from('training')
          .select('*, profiles:owner_id(full_name, avatar_url, hustle_name, primary_skill, is_hustler)')
          .eq('is_active', true)
          .or(`title.ilike.${searchQuery},description.ilike.${searchQuery},category.ilike.${searchQuery}`)
          .limit(10);
        results.training = training || [];
      }

      // 4. Search Hustlers (Profiles)
      if (intent === 'any' || intent === 'hustler' || intent === 'service') {
        const { data: profiles } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average')
          .eq('is_hustler', true) // Only active hustlers
          .or(`full_name.ilike.${searchQuery},username.ilike.${searchQuery},hustle_name.ilike.${searchQuery},primary_skill.ilike.${searchQuery}`)
          .limit(15);
        results.hustlers = profiles || [];
      }

      set({ searchResults: results });
      get().addRecentSearch(query);
    } catch (err: any) {
      console.error("Search failed", err);
      set({ error: err.message });
    } finally {
      set({ isLoadingExplore: false });
    }
  },

  fetchExploreFeed: async (interests = []) => {
    set({ isLoadingExplore: true, error: null });
    try {
      // Step 4 & 8: Explore Feed Query (Mix of trending, viral, diverse content)
      // Because we lack a complex recommendation ML backend, we'll simulate a 
      // powerful "For You" feed by mixing high-trending posts, recent posts,
      // and a bit of randomness to avoid loops.
      
      const { data, error } = await (supabase as any)
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews),
          likes:post_likes(count),
          comments(count)
        `)
        .eq('is_repost', false)
        .order('trending_score', { ascending: false, nullsFirst: false })
        .limit(50); // Fetch a larger pool to randomize from

      if (error) throw error;

      // Diversity Rule: Prevent same content loops.
      // Take top 10 viral/trending directly. Then take 15 random from the remaining pool.
      const pool = data as any[] || [];
      let finalFeed = pool;
      
      if (pool.length > 10) {
        const topTrending = pool.slice(0, 10);
        const diverseRemaining = pool.slice(10).sort(() => Math.random() - 0.5).slice(0, 15);
        finalFeed = [...topTrending, ...diverseRemaining].sort(() => Math.random() - 0.5); // Mix them up
      } else {
        finalFeed = pool.sort(() => Math.random() - 0.5);
      }

      set({ exploreFeed: finalFeed });
    } catch (err: any) {
      console.error("Error fetching explore feed", err);
      set({ error: err.message });
    } finally {
      set({ isLoadingExplore: false });
    }
  },

  fetchTrending: async () => {
    set({ isLoadingTrending: true, error: null });
    try {
      // Fetch trending hashtags
      const { data: tagData, error: tagError } = await (supabase as any)
        .from('hashtags')
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(10);
        
      if (tagError) throw tagError;

      // Fetch top trending posts
      const { data: postData, error: postError } = await (supabase as any)
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews),
          likes:post_likes(count),
          comments(count)
        `)
        .eq('is_repost', false)
        .order('trending_score', { ascending: false, nullsFirst: false })
        .limit(15);
        
      if (postError) throw postError;

      set({
        trendingHashtags: tagData as unknown as ExploreTopic[],
        trendingPosts: postData as any[]
      });
    } catch (err: any) {
      console.error("Error fetching trending", err);
      set({ error: err.message });
    } finally {
      set({ isLoadingTrending: false });
    }
  },

  fetchSuggestedCreators: async () => {
    set({ isLoadingCreators: true, error: null });
    try {
      // Based on hustle identity and engagement to find trending creators
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average')
        .eq('is_hustler', true)
        .order('review_count', { ascending: false, nullsFirst: false }) // Prioritize active hustlers
        .limit(30);

      if (error) throw error;

      // Randomize slightly for discovery diversity from the top creators pool
      const suggestions = (data as SuggestedCreator[] || [])
        .sort(() => Math.random() - 0.5)
        .slice(0, 8); // Suggest 8 creators

      set({ suggestedCreators: suggestions });
    } catch (err: any) {
      console.error("Error fetching suggested creators", err);
      set({ error: err.message });
    } finally {
      set({ isLoadingCreators: false });
    }
  },

  fetchCategoryFeed: async (category: string) => {
    try {
      // Look for hashtags or text metadata containing the category
      // Basic implementation of category discovery
      const { data, error } = await (supabase as any)
        .from('posts')
        .select(`
          *,
          profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews),
          likes:post_likes(count),
          comments(count)
        `)
        .eq('is_repost', false)
        .ilike('caption', `%${category}%`)
        .order('trending_score', { ascending: false, nullsFirst: false })
        .limit(15);

      if (error) throw error;

      set((state) => ({
        categoryFeeds: {
          ...state.categoryFeeds,
          [category]: data as any[]
        }
      }));
    } catch (err: any) {
      console.error(`Error fetching category feed for ${category}`, err);
    }
  }
}), {
  name: 'hustle-discovery-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ 
    recentSearches: state.recentSearches 
  }),
}));
