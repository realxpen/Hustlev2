import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import type { FeedPost } from './useFeedStore';
import type { SuggestedCreator, ExploreTopic } from './useDiscoveryStore';

export interface SearchResultGroups {
  posts: FeedPost[];
  creators: SuggestedCreator[];
  hashtags: ExploreTopic[];
  services: any[];
  products: any[];
  training: any[];
}

export interface SearchSuggestions {
  creators: Partial<SuggestedCreator>[];
  hashtags: ExploreTopic[];
}

export interface SearchHistoryItem {
  id: string;
  query: string;
  created_at: string;
}

interface SearchState {
  searchQuery: string;
  results: SearchResultGroups | null;
  suggestions: SearchSuggestions | null;
  searchHistory: SearchHistoryItem[];
  isLoading: boolean;
  isSearching: boolean;
  error: string | null;

  setSearchQuery: (query: string) => void;
  globalSearch: (query: string) => Promise<void>;
  getSuggestions: (query: string) => Promise<void>;
  fetchSearchHistory: () => Promise<void>;
  saveSearchHistory: (query: string) => Promise<void>;
  clearSearchHistory: () => Promise<void>;
  clearResults: () => void;
}

// Simple in-memory cache for repeated searches
const searchCache = new Map<string, SearchResultGroups>();

export const useSearchStore = create<SearchState>((set, get) => ({
  searchQuery: '',
  results: null,
  suggestions: null,
  searchHistory: [],
  isLoading: false,
  isSearching: false,
  error: null,

  setSearchQuery: (query: string) => set({ searchQuery: query }),

  globalSearch: async (query: string) => {
    if (!query.trim()) {
      set({ results: null });
      return;
    }
    
    // Check cache first to avoid spam
    const cacheKey = query.trim().toLowerCase();
    if (searchCache.has(cacheKey)) {
      set({ results: searchCache.get(cacheKey), error: null });
      return;
    }

    set({ isSearching: true, error: null });
    try {
      const { data, error } = await (supabase as any).rpc('global_search', {
        search_query: query.trim()
      });

      if (error) throw error;
      
      // Cache the result
      const parsedData = data as unknown as SearchResultGroups;
      searchCache.set(cacheKey, parsedData);

      set({ results: parsedData });
      
      // Save search history in background
      get().saveSearchHistory(query);
    } catch (err: any) {
      console.error("Error in global search", err);
      set({ error: err.message });
    } finally {
      set({ isSearching: false });
    }
  },

  getSuggestions: async (query: string) => {
    if (!query.trim() || query.length < 2) {
      set({ suggestions: null });
      return;
    }
    
    try {
      const { data, error } = await (supabase as any).rpc('get_search_suggestions', {
        search_query: query.trim()
      });

      if (error) throw error;
      
      set({ suggestions: data as unknown as SearchSuggestions });
    } catch (err: any) {
      console.error("Error fetching suggestions", err);
    }
  },

  fetchSearchHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isLoading: true });
    try {
      const { data, error } = await (supabase as any)
        .from('search_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) throw error;
      set({ searchHistory: data as unknown as SearchHistoryItem[] });
    } catch (err: any) {
      console.error("Error fetching search history", err);
    } finally {
      set({ isLoading: false });
    }
  },

  saveSearchHistory: async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await (supabase as any)
        .from('search_history')
        .insert([{ user_id: user.id, query: trimmedQuery }])
        .select()
        .single();

      if (error) throw error;
      
      // Update local state
      set((state) => {
        // Prevent duplicates in history view locally
        const existingFiltered = state.searchHistory.filter(h => h.query.toLowerCase() !== trimmedQuery.toLowerCase());
        return {
          searchHistory: [data as unknown as SearchHistoryItem, ...existingFiltered].slice(0, 10)
        };
      });
    } catch (err: any) {
      console.error("Error saving search history", err);
    }
  },

  clearSearchHistory: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      await (supabase as any)
        .from('search_history')
        .delete()
        .eq('user_id', user.id);
        
      set({ searchHistory: [] });
    } catch (err: any) {
      console.error("Error clearing search history", err);
    }
  },

  clearResults: () => {
    set({ results: null, suggestions: null, searchQuery: '' });
  }
}));
