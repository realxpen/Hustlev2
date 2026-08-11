import { create } from 'zustand';
import { useStoryStore } from './useStoryStore';
import type { ExtendedStory } from './useStoryStore';

interface StoryViewerState {
  isOpen: boolean;
  activeUserId: string | null;
  activeStoryIndex: number;
  storiesQueue: ExtendedStory[];
  progressMap: Record<string, number>;
  isPaused: boolean;

  openStoryViewer: (userId: string) => void;
  closeStoryViewer: () => void;
  nextStory: () => void;
  prevStory: () => void;
  nextUser: () => void;
  prevUser: () => void;
  setStoriesQueue: (stories: ExtendedStory[]) => void;
  updateProgress: (storyId: string, progress: number) => void;
  setPaused: (paused: boolean) => void;
}

export const useStoryViewerStore = create<StoryViewerState>((set, get) => ({
  isOpen: false,
  activeUserId: null,
  activeStoryIndex: 0,
  storiesQueue: [],
  progressMap: {},
  isPaused: false,

  openStoryViewer: (userId: string) => {
    const { groupedStories, viewedMap } = useStoryStore.getState();
    const group = groupedStories.find(g => g.userId === userId);
    
    if (group && group.stories.length > 0) {
        // Find first unread story
        let startIndex = 0;
        const firstUnreadIndex = group.stories.findIndex(s => !viewedMap[s.id]);
        if (firstUnreadIndex !== -1) {
            startIndex = firstUnreadIndex;
        }

        set({ 
            isOpen: true, 
            activeUserId: userId, 
            storiesQueue: group.stories,
            activeStoryIndex: startIndex,
            progressMap: {}, // reset progress on open
            isPaused: false
        });
    }
  },

  closeStoryViewer: () => {
    const { activeUserId, activeStoryIndex, storiesQueue } = get();
    const currentStory = storiesQueue[activeStoryIndex];
    if (activeUserId && currentStory) {
       const progress = get().progressMap[currentStory.id] || 0;
       useStoryStore.getState().updateAffinity(activeUserId, progress >= 95);
       if (progress < 95) {
          useStoryStore.getState().trackStoryEvent(currentStory.id, 'skip');
       }
    }
    set({ isOpen: false, activeUserId: null, storiesQueue: [], activeStoryIndex: 0, isPaused: false });
  },

  nextStory: () => {
    const { activeStoryIndex, storiesQueue, nextUser, activeUserId } = get();
    const currentStory = storiesQueue[activeStoryIndex];
    if (activeUserId && currentStory) {
       const progress = get().progressMap[currentStory.id] || 0;
       useStoryStore.getState().updateAffinity(activeUserId, progress >= 95);
       if (progress < 95) {
          useStoryStore.getState().trackStoryEvent(currentStory.id, 'skip');
       }
    }

    if (activeStoryIndex < storiesQueue.length - 1) {
       set({ activeStoryIndex: activeStoryIndex + 1 });
    } else {
       nextUser();
    }
  },

  prevStory: () => {
    const { activeStoryIndex, prevUser } = get();
    if (activeStoryIndex > 0) {
       set({ activeStoryIndex: activeStoryIndex - 1 });
    } else {
       prevUser();
    }
  },

  nextUser: () => {
    const { activeUserId, activeStoryIndex, storiesQueue } = get();
    
    // They tapped skip user without finishing the current story
    const currentStory = storiesQueue[activeStoryIndex];
    if (activeUserId && currentStory) {
       const progress = get().progressMap[currentStory.id] || 0;
       useStoryStore.getState().updateAffinity(activeUserId, progress >= 95);
       if (progress < 95) {
          useStoryStore.getState().trackStoryEvent(currentStory.id, 'skip');
       }
    }

    const { groupedStories } = useStoryStore.getState();
    if (!activeUserId) return;
    
    const currentIndex = groupedStories.findIndex(g => g.userId === activeUserId);
    if (currentIndex !== -1 && currentIndex < groupedStories.length - 1) {
        // Open next user in the ranked list
        get().openStoryViewer(groupedStories[currentIndex + 1].userId);
    } else {
        get().closeStoryViewer();
    }
  },

  prevUser: () => {
    const { activeUserId } = get();
    const { groupedStories } = useStoryStore.getState();
    if (!activeUserId) return;
    
    const currentIndex = groupedStories.findIndex(g => g.userId === activeUserId);
    if (currentIndex > 0) {
        get().openStoryViewer(groupedStories[currentIndex - 1].userId);
    } else {
        // Just reset to first story of current user if already at first user
        set({ activeStoryIndex: 0 });
    }
  },

  setStoriesQueue: (stories) => set({ storiesQueue: stories }),
  
  updateProgress: (storyId, progress) => set((state) => ({ 
      progressMap: { ...state.progressMap, [storyId]: Math.min(100, Math.max(0, progress)) } 
  })),
  
  setPaused: (paused) => set({ isPaused: paused })
}));
