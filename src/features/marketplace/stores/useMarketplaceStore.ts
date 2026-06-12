import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { Service, Product, Training, MarketplaceMedia, ListingType } from '../types';

interface MarketplaceState {
  services: Service[];
  products: Product[];
  trainings: Training[];
  isLoading: boolean;
  error: string | null;
  
  fetchMarketplaceListings: () => Promise<void>;
  
  createService: (data: Partial<Service>) => Promise<Service | null>;
  createProduct: (data: Partial<Product>) => Promise<Product | null>;
  createTraining: (data: Partial<Training>) => Promise<Training | null>;
}

export const useMarketplaceStore = create<MarketplaceState>((set, get) => ({
  services: [],
  products: [],
  trainings: [],
  isLoading: false,
  error: null,

  fetchMarketplaceListings: async () => {
    set({ isLoading: true, error: null });
    try {
      const [servicesRes, productsRes, trainingsRes] = await Promise.all([
        (supabase as any).from('services').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(20),
        (supabase as any).from('products').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(20),
        (supabase as any).from('training').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(20)
      ]);

      if (servicesRes.error) throw servicesRes.error;
      if (productsRes.error) throw productsRes.error;
      if (trainingsRes.error) throw trainingsRes.error;

      set({
        services: servicesRes.data || [],
        products: productsRes.data || [],
        trainings: trainingsRes.data || [],
        isLoading: false
      });
    } catch (error: any) {
      console.error('Error fetching marketplace listings:', error);
      
      // If network fails (Failed to fetch) or environment is unconfigured, load interactive demo listings!
      if (!error.message || error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('placeholder')) {
        const fallbackServices: Service[] = [
          {
            id: 'mock-s1',
            owner_id: 'demo-hustler-id',
            title: 'Modern Mobile Web App Frontend',
            description: 'Building ultra-fast responsive interactive mobile React frontends with Tailwind and Framer Motion.',
            category: 'Tech',
            pricing_type: 'fixed',
            base_price: 650,
            delivery_time: '5 Days',
            media: [{ url: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop', type: 'image' }],
            tags: ['React', 'Next.js', 'Tailwind', 'Mobile'],
            is_active: true,
            views_count: 142,
            saves_count: 24,
            orders_count: 8,
            created_at: new Date().toISOString()
          },
          {
            id: 'mock-s2',
            owner_id: 'demo-hustler-id',
            title: 'Hype Motion Graphics & Loops',
            description: '3D modeling, fluid simulation loops, and dynamic kinetic typography for overlays and stream screens.',
            category: 'Creative',
            pricing_type: 'hourly',
            base_price: 90,
            delivery_time: '3 Days',
            media: [{ url: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=600&auto=format&fit=crop', type: 'image' }],
            tags: ['Blender', 'After Effects', '3D', 'Loop'],
            is_active: true,
            views_count: 89,
            saves_count: 15,
            orders_count: 4,
            created_at: new Date().toISOString()
          }
        ];

        const fallbackProducts: Product[] = [
          {
            id: 'mock-p1',
            owner_id: 'demo-hustler-id',
            title: 'Ultimate Creators SaaS Boilerplate',
            description: 'Next.js 14, Tailwind, Stripe, Supabase database configuration files, and authentication already set up.',
            category: 'Tech',
            product_type: 'digital',
            price: 49,
            inventory_count: 9991,
            media: [{ url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop', type: 'image' }],
            tags: ['Boilerplate', 'React', 'SaaS', 'Stripe'],
            is_active: true,
            views_count: 405,
            saves_count: 87,
            orders_count: 53,
            created_at: new Date().toISOString()
          }
        ];

        const fallbackTrainings: Training[] = [
          {
            id: 'mock-t1',
            owner_id: 'demo-hustler-id',
            title: 'Solopreneur Zero to 10k Masterclass',
            description: 'A complete asynchronous masterclass detailing client closing, high-ticket offers, and service execution.',
            category: 'Finance',
            price: 199,
            training_type: 'recorded',
            media: [{ url: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=600&auto=format&fit=crop', type: 'image' }],
            tags: ['Sales', 'Masterclass', 'Recorded'],
            is_active: true,
            views_count: 231,
            saves_count: 49,
            orders_count: 19,
            created_at: new Date().toISOString()
          }
        ];

        set({
          services: fallbackServices,
          products: fallbackProducts,
          trainings: fallbackTrainings,
          isLoading: false
        });
      } else {
        set({ error: error.message, isLoading: false });
      }
    }
  },

  createService: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'User must be logged in' });
      return null;
    }

    // 1. Validate role: only hustlers, admins can create listings
    let profile = useAuthStore.getState().profile;
    if (!profile) {
      try {
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (dbProfile) {
          profile = dbProfile as any;
        }
      } catch (err) {}
    }

    const isHustler = profile?.is_hustler === true || profile?.role === 'hustler' || profile?.role === 'admin' || profile?.is_agent === true;
    if (!isHustler) {
      set({ error: 'Only registered Hustlers or certified agents can create listings.', isLoading: false });
      return null;
    }

    // 2. Sanitize and validate inputs
    const title = data.title?.trim() || '';
    if (!title) {
      set({ error: 'Offering title is required.', isLoading: false });
      return null;
    }
    if (title.length < 3) {
      set({ error: 'Title must be at least 3 characters long.', isLoading: false });
      return null;
    }

    const description = data.description?.trim() || '';
    const base_price = Math.max(0, Number(data.base_price) || 0);
    const pricing_type = data.pricing_type || 'fixed';

    set({ isLoading: true, error: null });
    const sanitizedData = {
      ...data,
      title,
      description,
      base_price,
      pricing_type,
      owner_id: data.owner_id || user.id,
      is_active: true,
      media: data.media || []
    };

    try {
      const { data: newService, error } = await (supabase as any)
        .from('services')
        .insert([sanitizedData])
        .select()
        .single();
        
      if (error) throw error;
      
      set(state => ({
        services: [newService as Service, ...state.services],
        isLoading: false
      }));
      
      return newService as Service;
    } catch (error: any) {
      console.error('Error creating service:', error);
      
      // Standalone sandbox fallback
      if (!error.message || error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('placeholder')) {
         const fallbackService: Service = {
           id: 'local-srv-' + Math.random().toString(36).substr(2, 9),
           owner_id: user.id,
           title: sanitizedData.title,
           description: sanitizedData.description,
           category: sanitizedData.category || 'Tech',
           pricing_type: sanitizedData.pricing_type as any,
           base_price: sanitizedData.base_price,
           delivery_time: sanitizedData.delivery_time || '3 Days',
           media: sanitizedData.media as any || [],
           tags: sanitizedData.tags || [],
           is_active: true,
           views_count: 0,
           saves_count: 0,
           orders_count: 0,
           created_at: new Date().toISOString()
         };
         
         set(state => ({
           services: [fallbackService, ...state.services],
           isLoading: false
         }));
         return fallbackService;
      }
      
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  createProduct: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'User must be logged in' });
      return null;
    }

    // 1. Validate role: only hustlers, admins can create listings
    let profile = useAuthStore.getState().profile;
    if (!profile) {
      try {
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (dbProfile) {
          profile = dbProfile as any;
        }
      } catch (err) {}
    }

    const isHustler = profile?.is_hustler === true || profile?.role === 'hustler' || profile?.role === 'admin';
    if (!isHustler) {
      set({ error: 'Only registered Hustlers can create products_list. Please upgrade your profile first.', isLoading: false });
      return null;
    }

    // 2. Sanitize and validate inputs
    const title = data.title?.trim() || '';
    if (!title) {
      set({ error: 'Product title is required.', isLoading: false });
      return null;
    }
    if (title.length < 3) {
      set({ error: 'Title must be at least 3 characters long.', isLoading: false });
      return null;
    }

    const description = data.description?.trim() || '';
    const price = Math.max(0, Number(data.price) || 0);
    const product_type = data.product_type || 'digital';

    set({ isLoading: true, error: null });
    const inventory_count = Math.max(0, Number(data.inventory_count) || 10);
    const sanitizedData = {
      ...data,
      title,
      description,
      price,
      product_type,
      owner_id: user.id,
      is_active: true,
      inventory_count,
      media: data.media || []
    };

    try {
      const { data: newProduct, error } = await (supabase as any)
        .from('products')
        .insert([sanitizedData])
        .select()
        .single();
        
      if (error) throw error;
      
      set(state => ({
        products: [newProduct as Product, ...state.products],
        isLoading: false
      }));
      
      return newProduct as Product;
    } catch (error: any) {
      console.error('Error creating product:', error);
      
      // Standalone sandbox fallback
      if (!error.message || error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('placeholder')) {
         const fallbackProduct: Product = {
           id: 'local-prd-' + Math.random().toString(36).substr(2, 9),
           owner_id: user.id,
           title: sanitizedData.title,
           description: sanitizedData.description,
           category: sanitizedData.category || 'Tech',
           product_type: sanitizedData.product_type as any,
           price: sanitizedData.price,
           inventory_count: sanitizedData.inventory_count || 100,
           media: sanitizedData.media as any || [],
           tags: sanitizedData.tags || [],
           is_active: true,
           views_count: 0,
           saves_count: 0,
           orders_count: 0,
           created_at: new Date().toISOString()
         };
         
         set(state => ({
           products: [fallbackProduct, ...state.products],
           isLoading: false
         }));
         return fallbackProduct;
      }
      
      set({ error: error.message, isLoading: false });
      return null;
    }
  },

  createTraining: async (data) => {
    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'User must be logged in' });
      return null;
    }

    // 1. Validate role: only hustlers, admins can create listings
    let profile = useAuthStore.getState().profile;
    if (!profile) {
      try {
        const { data: dbProfile } = await supabase.from('profiles').select('*').eq('id', user.id).single();
        if (dbProfile) {
          profile = dbProfile as any;
        }
      } catch (err) {}
    }

    const isHustler = profile?.is_hustler === true || profile?.role === 'hustler' || profile?.role === 'admin';
    if (!isHustler) {
      set({ error: 'Only registered Hustlers can create training listings. Please upgrade your profile first.', isLoading: false });
      return null;
    }

    // 2. Sanitize and validate inputs
    const title = data.title?.trim() || '';
    if (!title) {
      set({ error: 'Training title is required.', isLoading: false });
      return null;
    }
    if (title.length < 3) {
      set({ error: 'Title must be at least 3 characters long.', isLoading: false });
      return null;
    }

    const description = data.description?.trim() || '';
    const price = Math.max(0, Number(data.price) || 0);
    const training_type = data.training_type || 'recorded';

    set({ isLoading: true, error: null });
    const sanitizedData = {
      ...data,
      title,
      description,
      price,
      training_type,
      owner_id: user.id,
      is_active: true,
      media: data.media || []
    };

    try {
      const { data: newTraining, error } = await (supabase as any)
        .from('training')
        .insert([sanitizedData])
        .select()
        .single();
        
      if (error) throw error;
      
      set(state => ({
        trainings: [newTraining as Training, ...state.trainings],
        isLoading: false
      }));
      
      return newTraining as Training;
    } catch (error: any) {
      console.error('Error creating training:', error);
      
      // Standalone sandbox fallback
      if (!error.message || error.message.includes('Failed to fetch') || error.message.includes('NetworkError') || error.message.includes('placeholder')) {
         const fallbackTraining: Training = {
           id: 'local-trn-' + Math.random().toString(36).substr(2, 9),
           owner_id: user.id,
           title: sanitizedData.title,
           description: sanitizedData.description,
           category: sanitizedData.category || 'Tech',
           training_type: sanitizedData.training_type as any,
           price: sanitizedData.price,
           media: sanitizedData.media as any || [],
           tags: sanitizedData.tags || [],
           is_active: true,
           views_count: 0,
           saves_count: 0,
           orders_count: 0,
           created_at: new Date().toISOString()
         };
         
         set(state => ({
           trainings: [fallbackTraining, ...state.trainings],
           isLoading: false
         }));
         return fallbackTraining;
      }
      
      set({ error: error.message, isLoading: false });
      return null;
    }
  }
}));
