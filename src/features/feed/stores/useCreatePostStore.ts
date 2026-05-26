import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../../../lib/supabase';
import { useAuthStore } from '../../auth/stores/useAuthStore';
import { useFeedStore } from './useFeedStore';
import { useCreatorStore } from './useCreatorStore';

export type PostMediaDraft = {
  id: string; // local id
  file: File;
  type: 'image' | 'video' | 'pdf' | 'document' | 'graphics';
  url?: string;
  width?: number;
  height?: number;
  name?: string;
};

export type MusicDraft = {
  music_url: string;
  title: string;
  artist: string;
  start_time: number;
  duration: number;
  file?: File;
};

export type ReferenceDraft = {
  services: string[];
  products: string[];
  training: string[];
};

interface CreatePostState {
  // Draft State
  selectedType: string;
  title: string;
  description: string;
  price: string;
  mediaDraft: PostMediaDraft[];
  uploadedFiles: any[];
  musicDraft: MusicDraft | null;
  referenceDraft: ReferenceDraft;
  
  // UI State
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;

  // Actions
  setSelectedType: (type: string) => void;
  setDraftFields: (fields: Partial<{ title: string; description: string; price: string }>) => void;
  addMedia: (media: Omit<PostMediaDraft, 'id'>) => void;
  removeMedia: (localId: string) => void;
  reorderMedia: (startIndex: number, endIndex: number) => void;
  attachMusic: (music: MusicDraft) => void;
  attachReference: (category: keyof ReferenceDraft, id: string) => void;
  validatePost: () => Promise<boolean>;
  submitPost: (scheduleDate?: string | null) => Promise<any>;
  reset: () => void;
}

export const useCreatePostStore = create<CreatePostState>()(
  persist(
    (set, get) => ({
      selectedType: 'post',
      title: '',
      description: '',
      price: '',
      mediaDraft: [],
      uploadedFiles: [],
      musicDraft: null,
      referenceDraft: { services: [], products: [], training: [] },
      uploadProgress: 0,
      isUploading: false,
      error: null,

      setSelectedType: (type) => set({ selectedType: type }),
      setDraftFields: (fields) => set((state) => ({ ...state, ...fields })),

      addMedia: (media) => {
        set((state) => ({
          mediaDraft: [...state.mediaDraft, { ...media, id: Math.random().toString(36).substring(7) }]
        }));
      },

  removeMedia: (localId) => {
    set((state) => ({
      mediaDraft: state.mediaDraft.filter(m => m.id !== localId)
    }));
  },

  reorderMedia: (startIndex, endIndex) => {
    set((state) => {
      const result = Array.from(state.mediaDraft);
      const [removed] = result.splice(startIndex, 1);
      result.splice(endIndex, 0, removed);
      return { mediaDraft: result };
    });
  },

  attachMusic: (music) => {
    set({ musicDraft: music });
  },

  attachReference: (category, id) => {
    set((state) => ({
      referenceDraft: {
        ...state.referenceDraft,
        [category]: [...state.referenceDraft[category], id]
      }
    }));
  },

  validatePost: async () => {
    const { mediaDraft, referenceDraft } = get();
    set({ error: null });

    // 1. Media Rules Validation
    const videoCount = mediaDraft.filter(m => m.type === 'video').length;
    const imageCount = mediaDraft.filter(m => m.type === 'image').length;
    const documentCount = mediaDraft.filter(m => m.type === 'pdf' || m.type === 'document').length;
    const graphicsCount = mediaDraft.filter(m => m.type === 'graphics').length;

    if (videoCount > 1) {
      set({ error: 'Only one video allowed per post.' });
      return false;
    }

    if (videoCount === 1 && (imageCount > 0 || documentCount > 0 || graphicsCount > 0)) {
      set({ error: 'Video cannot be mixed with other formats.' });
      return false;
    }

    // 2. Hustler validation for references
    const hasReferences = Object.values(referenceDraft).some(arr => arr.length > 0);
    
    if (hasReferences) {
      const user = useAuthStore.getState().user;
      if (!user) {
        set({ error: 'You must be logged in.' });
        return false;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (!profile || (profile.role !== 'hustler' && profile.role !== 'both')) {
        set({ error: 'Only hustlers can attach references.' });
        return false;
      }

      // Check services if any
      if (referenceDraft.services.length > 0) {
        const { count, error } = await supabase
          .from('services')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .in('id', referenceDraft.services);

        if (error || count !== referenceDraft.services.length) {
          set({ error: 'One or more service references are invalid or not owned by you.' });
          return false;
        }
      }

      // Check products if any
      if (referenceDraft.products.length > 0) {
        const { count, error } = await (supabase as any)
          .from('products')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .in('id', referenceDraft.products);

        if (error || count !== referenceDraft.products.length) {
          set({ error: 'One or more product references are invalid or not owned by you.' });
          return false;
        }
      }

      // Check training if any
      if (referenceDraft.training.length > 0) {
        const { count, error } = await (supabase as any)
          .from('training')
          .select('*', { count: 'exact', head: true })
          .eq('owner_id', user.id)
          .in('id', referenceDraft.training);

        if (error || count !== referenceDraft.training.length) {
          set({ error: 'One or more training references are invalid or not owned by you.' });
          return false;
        }
      }
    }

    return true;
  },

  submitPost: async (scheduleDate: string | null = null) => {
    const { mediaDraft, musicDraft, referenceDraft, validatePost, selectedType, title, description, price } = get();
    
    const isValid = await validatePost();
    if (!isValid) return null;

    set({ isUploading: true, uploadProgress: 0, error: null });

    const user = useAuthStore.getState().user;
    if (!user) {
      set({ error: 'Not logged in', isUploading: false });
      return null;
    }

    try {
      // 1. Upload Music if any
      let finalMusicDraft = musicDraft;
      if (musicDraft?.file) {
        set({ uploadProgress: 5 });
        const fileExt = musicDraft.file.name.split('.').pop() || 'mp3';
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `${user.id}/audio/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('feed')
          .upload(filePath, musicDraft.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('feed')
          .getPublicUrl(filePath);

        finalMusicDraft = {
          ...musicDraft,
          music_url: publicUrl,
        };
        delete finalMusicDraft.file;
      }

      // 2. Upload Media
      const uploadedMedia = [];
      const totalFiles = mediaDraft.length;
      let completedFiles = 0;

      for (const draft of mediaDraft) {
        const fileExt = draft.file.name.split('.').pop() || 'tmp';
        const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`;
        const folder = draft.type === 'video' ? 'videos' : draft.type === 'pdf' || draft.type === 'document' ? 'documents' : 'images';
        const filePath = `${user.id}/${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('feed')
          .upload(filePath, draft.file);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('feed')
          .getPublicUrl(filePath);

        uploadedMedia.push({
          type: draft.type,
          url: publicUrl,
          width: draft.width,
          height: draft.height,
          name: draft.file.name
        });

        completedFiles++;
        set({ uploadProgress: (completedFiles / totalFiles) * 100 });
      }

      const primaryMedia = uploadedMedia[0];
      const mediaUrl = primaryMedia ? primaryMedia.url : null;
      let mediaType = 'none';
      if (primaryMedia) {
        if (primaryMedia.type === 'video') mediaType = 'video';
        else if (primaryMedia.type === 'image' || primaryMedia.type === 'graphics') mediaType = 'image';
        else mediaType = primaryMedia.type; 
      }

      const numericPrice = parseFloat(price.replace(/[^0-9.]/g, '')) || 0;

      // 3. Handle Listing Creation if needed
      let attachedListingId = null;
      let attachedListingType = null;

      if (selectedType !== 'post' && selectedType !== 'live') {
        const table = selectedType === 'service' ? 'services' : selectedType === 'product' ? 'products' : 'training';
        const payload: any = {
          owner_id: user.id,
          title,
          description,
          media: uploadedMedia,
          is_active: true
        };

        if (selectedType === 'service') payload.base_price = numericPrice;
        else payload.price = numericPrice;

        const { data: listing, error: listingError } = await (supabase as any)
          .from(table)
          .insert(payload)
          .select()
          .single();

        if (listingError) throw listingError;
        
        attachedListingId = listing.id;
        attachedListingType = selectedType;

        // Refresh creator studio listings
        useCreatorStore.getState().fetchMyListings();
      }

      // 4. Create Feed Post
      const referencePayload = Object.values(referenceDraft).some(arr => arr.length > 0) ? referenceDraft : null;
      const fullCaption = title ? `${title}\n\n${description}` : description;

      const { data: newPost, error: insertError } = await (supabase as any)
        .from('posts')
        .insert({
          user_id: user.id,
          caption: fullCaption,
          media_url: mediaUrl,
          media_type: mediaType,
          media: uploadedMedia,
          music_data: finalMusicDraft,
          reference_payload: referencePayload,
          attached_listing_id: attachedListingId,
          attached_listing_type: attachedListingType,
          scheduled_for: scheduleDate ? new Date(scheduleDate).toISOString() : null
        })
        .select(`
          *,
          profiles!posts_user_id_fkey(id, full_name, username, avatar_url),
          likes:post_likes(count),
          comments(count)
        `)
        .single();

      if (insertError) throw insertError;

      // Extract and sync hashtags
      const hashtagRegex = /#([\w]+)/g;
      const extracted = new Set<string>();
      let match;
      while ((match = hashtagRegex.exec(fullCaption)) !== null) {
        extracted.add(match[1].toLowerCase());
      }
      
      const tagsArray = Array.from(extracted).slice(0, 15);
      if (tagsArray.length > 0) {
        await (supabase as any).rpc('sync_post_hashtags', {
          p_post_id: newPost.id,
          p_hashtags: tagsArray
        }).then(({ error }: any) => {
          if (error) console.error('Failed to sync hashtags', error);
        });
      }

      // Optimistic update of feed
      const feedStore = useFeedStore.getState();
      feedStore.setPosts((prevPosts: any) => [newPost, ...prevPosts]);

      get().reset();
      return newPost;

    } catch (err: any) {
      set({ error: err.message || 'Upload failed', isUploading: false, uploadProgress: 0 });
      return null;
    }
  },

  reset: () => {
    set({
      selectedType: 'post',
      title: '',
      description: '',
      price: '',
      mediaDraft: [],
      uploadedFiles: [],
      musicDraft: null,
      referenceDraft: { services: [], products: [], training: [] },
      uploadProgress: 0,
      isUploading: false,
      error: null
    });
  }
}), {
  name: 'hustle-create-post-storage',
  storage: createJSONStorage(() => localStorage),
  partialize: (state) => ({ 
    selectedType: state.selectedType,
    title: state.title,
    description: state.description,
    price: state.price,
    referenceDraft: state.referenceDraft
  }),
}));
