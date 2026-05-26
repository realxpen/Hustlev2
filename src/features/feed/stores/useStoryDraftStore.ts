import { create } from "zustand";
import { supabase } from "../../../lib/supabase";
import { useStoryStore } from "./useStoryStore";

export interface StoryMusic {
  music_url: string;
  start_time: number;
  volume: number;
  loop_flag: boolean;
}

export interface StorySticker {
  id: string;
  type: "emoji" | "text" | "image";
  position: { x: number; y: number };
  scale: number;
  rotation: number;
  content: string;
}

interface StoryDraftState {
  isOpen: boolean;
  mediaFile: File | null;
  mediaUrl: string | null;
  mediaType: "image" | "video" | "text";
  caption: string;
  selectedMusic: StoryMusic | null;
  stickers: StorySticker[];
  linkedType: "service" | "product" | "training" | "general";
  linkedId: string | null;
  uploadProgress: number;
  isUploading: boolean;
  error: string | null;

  openStoryCreator: () => void;
  closeStoryCreator: () => void;
  setMedia: (
    file: File | null,
    type: "image" | "video" | "text",
    url?: string | null,
  ) => void;
  setCaption: (caption: string) => void;
  setMusic: (music: StoryMusic | null) => void;
  addSticker: (sticker: StorySticker) => void;
  removeSticker: (id: string) => void;
  setLinkedEntity: (
    type: "service" | "product" | "training" | "general",
    id: string | null,
  ) => void;
  resetDraft: () => void;

  uploadStoryMedia: (userId: string, file: File) => Promise<string>;
  createStory: (userId: string) => Promise<boolean>;
}

const initialState = {
  isOpen: false,
  mediaFile: null,
  mediaUrl: null,
  mediaType: "text" as const,
  caption: "",
  selectedMusic: null,
  stickers: [],
  linkedType: "general" as const,
  linkedId: null,
  uploadProgress: 0,
  isUploading: false,
  error: null,
};

export const useStoryDraftStore = create<StoryDraftState>((set, get) => ({
  ...initialState,

  openStoryCreator: () => set({ ...initialState, isOpen: true }),

  closeStoryCreator: () => set({ isOpen: false }),

  setMedia: (file, type, url) =>
    set({
      mediaFile: file,
      mediaType: type,
      mediaUrl: url || (file ? URL.createObjectURL(file) : null),
    }),

  setCaption: (caption) => set({ caption }),

  setMusic: (music) => set({ selectedMusic: music }),

  addSticker: (sticker) =>
    set((state) => ({ stickers: [...state.stickers, sticker] })),

  removeSticker: (id) =>
    set((state) => ({ stickers: state.stickers.filter((s) => s.id !== id) })),

  setLinkedEntity: (type, id) => set({ linkedType: type, linkedId: id }),

  resetDraft: () => set({ ...initialState, isOpen: get().isOpen }),

  uploadStoryMedia: async (userId: string, file: File): Promise<string> => {
    set({ uploadProgress: 10 });
    const fileExt = file.name.split(".").pop();
    const fileName = `${userId}-${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `stories/${fileName}`;

    // Note: Compress logic could be added here if available

    set({ uploadProgress: 40 });
    const { error: uploadError } = await supabase.storage
      .from("feed") // Adjust string if 'stories' bucket is preferred
      .upload(filePath, file, { upsert: false });

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`);

    set({ uploadProgress: 80 });
    const { data: publicUrlData } = supabase.storage
      .from("feed")
      .getPublicUrl(filePath);

    set({ uploadProgress: 100 });
    return publicUrlData.publicUrl;
  },

  createStory: async (userId: string): Promise<boolean> => {
    const state = get();

    // Validation Rules
    if (state.mediaType === "text" && !state.caption.trim()) {
      set({ error: "Text story requires a caption." });
      return false;
    }
    if (state.mediaType !== "text" && !state.mediaFile) {
      set({ error: "Media story requires a file." });
      return false;
    }
    // Simple ID validation if a linked type is selected (can be expanded later)
    if (
      state.linkedType !== "general" &&
      !state.linkedId &&
      state.linkedType !== "product" &&
      state.linkedType !== "service" &&
      state.linkedType !== "training"
    ) {
      // Just enforcing that general is the one with no ID, others might be allowed empty ID depending on business logic,
      // but typically a link needs an ID. For right now, let's just let it pass if linkedId exists or handle gracefully.
    }

    set({ isUploading: true, error: null });

    try {
      let finalMediaUrl = null;

      if (state.mediaFile && state.mediaType !== "text") {
        finalMediaUrl = await get().uploadStoryMedia(userId, state.mediaFile);
      }

      const now = new Date();
      const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // +24 hours

      const storyData = {
        user_id: userId,
        media_url: finalMediaUrl,
        media_type: state.mediaType,
        caption: state.caption,
        story_type: state.linkedType,
        linked_id: state.linkedId || null,
        background_music_url: state.selectedMusic?.music_url || null,
        sticker_data: state.stickers.length > 0 ? state.stickers : null,
        expires_at: expiresAt.toISOString(),
      };

      const { data, error } = await supabase
        .from("stories")
        .insert(storyData)
        .select(`*, profiles(*), story_views(*)`)
        .single();

      if (error) throw error;

      // Optimistic update
      if (data) {
        const { groupedStories, viewedMap } = useStoryStore.getState();
        const newStory = data as any;
        // Note: ensuring profiles are injected if omitted by single() query due to RLS
        if (!newStory.profiles) {
          const profileGroup = groupedStories.find((g) => g.userId === userId);
          newStory.profiles = profileGroup?.profile || {
            id: userId,
            username: "You",
            avatar_url: "",
          };
        }

        let ownGroup = groupedStories.find((g) => g.relationship === "own");

        useStoryStore.setState((prevStore) => {
          const updatedGroups = [...prevStore.groupedStories];
          const groupIndex = updatedGroups.findIndex(
            (g) => g.relationship === "own",
          );

          if (groupIndex !== -1) {
            // Add to existing group
            updatedGroups[groupIndex] = {
              ...updatedGroups[groupIndex],
              stories: [...updatedGroups[groupIndex].stories, newStory],
              latestStoryAt: newStory.created_at,
            };
          } else {
            // Create own group
            updatedGroups.push({
              userId: userId,
              profile: newStory.profiles,
              stories: [newStory],
              hasUnread: false,
              relationship: "own",
              latestStoryAt: newStory.created_at,
            });
          }

          return {
            stories: [newStory, ...prevStore.stories],
            groupedStories: updatedGroups,
          };
        });
      }

      set({ isUploading: false });
      return true;
    } catch (error: any) {
      console.error("Error creating story:", error);
      set({
        error: error.message || "Failed to create story",
        isUploading: false,
      });
      return false;
    }
  },
}));
