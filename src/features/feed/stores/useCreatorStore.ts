import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';

interface CreatorState {
  myServices: any[];
  myProducts: any[];
  myTraining: any[];
  myPosts: any[];
  isLoading: boolean;
  error: string | null;

  fetchMyListings: () => Promise<void>;
  fetchMyPosts: () => Promise<void>;
  toggleListingStatus: (type: 'service' | 'product' | 'training', id: string, currentStatus: boolean) => Promise<void>;
  deleteListing: (type: 'service' | 'product' | 'training', id: string) => Promise<void>;
  deletePost: (id: string) => Promise<void>;
}

export const useCreatorStore = create<CreatorState>((set, get) => ({
  myServices: [],
  myProducts: [],
  myTraining: [],
  myPosts: [],
  isLoading: false,
  error: null,

  fetchMyListings: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    set({ isLoading: true });
    try {
      const [services, products, training, posts] = await Promise.all([
        supabase.from('services').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('products').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('training').select('*').eq('owner_id', user.id).order('created_at', { ascending: false }),
        supabase.from('posts').select('*').eq('user_id', user.id).eq('is_repost', false).order('created_at', { ascending: false })
      ]);

      set({
        myServices: services.data || [],
        myProducts: products.data || [],
        myTraining: training.data || [],
        myPosts: posts.data || [],
        isLoading: false
      });
    } catch (err: any) {
      set({ error: err.message, isLoading: false });
    }
  },

  fetchMyPosts: async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
      const { data, error } = await supabase.from('posts').select('*').eq('user_id', user.id).eq('is_repost', false).order('created_at', { ascending: false });
      if (error) throw error;
      set({ myPosts: data || [] });
    } catch (err: any) {
      console.error('Error fetching my posts:', err);
    }
  },

  toggleListingStatus: async (type, id, currentStatus) => {
    const table = type === 'service' ? 'services' : type === 'product' ? 'products' : 'training';
    try {
      const { error } = await supabase
        .from(table)
        .update({ is_active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      
      // Update local state
      set(state => {
        const key = type === 'service' ? 'myServices' : type === 'product' ? 'myProducts' : 'myTraining';
        return {
          [key]: (state as any)[key].map((item: any) => 
            item.id === id ? { ...item, is_active: !currentStatus } : item
          )
        };
      });
    } catch (err: any) {
      console.error(`Failed to toggle ${type} status:`, err);
    }
  },

  deleteListing: async (type, id) => {
    const table = type === 'service' ? 'services' : type === 'product' ? 'products' : 'training';
    try {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Update local state
      set(state => {
        const key = type === 'service' ? 'myServices' : type === 'product' ? 'myProducts' : 'myTraining';
        return {
          [key]: (state as any)[key].filter((item: any) => item.id !== id)
        };
      });
    } catch (err: any) {
      console.error(`Failed to delete ${type}:`, err);
    }
  },

  deletePost: async (id: string) => {
    try {
      const { error } = await supabase.from('posts').delete().eq('id', id);
      if (error) throw error;
      set(state => ({
        myPosts: state.myPosts.filter(p => p.id !== id)
      }));
    } catch (err: any) {
      console.error('Error deleting post:', err);
    }
  }
}));
