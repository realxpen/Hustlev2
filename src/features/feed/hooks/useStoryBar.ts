import { useEffect } from 'react';
import { useStoryStore, StoryGroup } from '../stores/useStoryStore';
import { useStoryViewerStore } from '../stores/useStoryViewerStore';
import { useAuthStore } from '../../auth/stores/useAuthStore';

interface StoryBarHook {
  groupedStories: StoryGroup[];
  isLoading: boolean;
  openStory: (group: StoryGroup) => void;
  closeStory: () => void;
  isStoryOpen: boolean;
  markStoryViewed: (storyId: string) => void;
  refreshStories: () => void;
}

export function useStoryBar(): StoryBarHook {
  const { user } = useAuthStore();
  const { 
    groupedStories, 
    isLoading, 
    fetchStories,
    markViewed,
    subscribeToStories,
    unsubscribeFromStories
  } = useStoryStore();
  
  const { isOpen, openStoryViewer, closeStoryViewer } = useStoryViewerStore();

  useEffect(() => {
    if (user?.id) {
      // Fetch initial stories
      fetchStories(user.id);
      
      // Setup realtime subscription
      subscribeToStories(user.id);
      
      return () => {
        unsubscribeFromStories();
      };
    }
  }, [user?.id, fetchStories, subscribeToStories, unsubscribeFromStories]);

  const openStory = (group: StoryGroup) => {
    openStoryViewer(group.userId);
  };

  const closeStory = () => {
    closeStoryViewer();
  };

  const markStoryViewed = (storyId: string) => {
    if (user?.id) {
      markViewed(storyId, user.id);
    }
  };

  const refreshStories = () => {
    if (user?.id) {
      fetchStories(user.id);
    }
  };

  return {
    groupedStories,
    isLoading,
    openStory,
    closeStory,
    isStoryOpen: isOpen,
    markStoryViewed,
    refreshStories
  };
}
