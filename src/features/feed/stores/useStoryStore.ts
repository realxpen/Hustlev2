import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '../../../lib/supabase';
import type { Story, StoryView, Profile } from '../../../types';

export interface ExtendedStory extends Story {
  profiles?: Profile;
  story_views?: StoryView[];
}

export interface StoryGroup {
  userId: string;
  profile: Profile;
  stories: ExtendedStory[];
  hasUnread: boolean;
  relationship: 'mutual' | 'following' | 'follower' | 'own' | 'none';
  latestStoryAt: string;
  score?: number; // Added for ranking
}

export interface AffinityData {
  view_count: number;
  completion_rate: number;
  last_viewed_at: string | null;
}

export interface RecommendedUser {
  userId: string;
  profile: Profile;
  reason: string;
  previewStory?: ExtendedStory;
}

interface StoryState {
  stories: ExtendedStory[];
  groupedStories: StoryGroup[];
  viewedMap: Record<string, boolean>; // local cache of viewed stories
  isLoading: boolean;
  error: string | null;
  
  // Story Intelligence Additions
  rankedStories: StoryGroup[];
  recommendedUsers: RecommendedUser[];
  affinityMap: Record<string, AffinityData>;
  trendingStories: ExtendedStory[];

  // Story Monetization & Growth Additions
  boostedStories: string[]; // List of boosted story IDs
  analyticsMap: Record<string, { impressions: number; views: number; completions: number; skips: number; link_clicks: number }>;
  conversionMap: Record<string, { link_clicks: number; profile_visits: number; booking_inits: number }>;
  creatorScores: Record<string, number>; // Calculated dynamically

  fetchStories: (userId: string) => Promise<void>;
  fetchRankedStories: (userId: string) => Promise<void>;
  fetchRecommendations: (userId: string) => Promise<void>;
  updateAffinity: (creatorId: string, completion: boolean) => void;

  boostStory: (storyId: string, amount: number, currency?: string) => Promise<boolean>;
  fetchAnalytics: (storyId: string) => Promise<any>;
  trackStoryEvent: (storyId: string, type: 'impression' | 'view' | 'completion' | 'skip') => Promise<void>;
  trackConversion: (storyId: string, type: 'link_click' | 'profile_visit' | 'booking_init') => Promise<void>;
  computeCreatorScore: (creatorId: string) => number;
  
  createStory: (
    userId: string, 
    file: File | null, 
    mediaType: 'image' | 'video' | 'text', 
    content: string, 
    storyType: 'service' | 'product' | 'training' | 'general',
    linkedId?: string
  ) => Promise<void>;
  markViewed: (storyId: string, viewerId: string) => Promise<void>;
  deleteExpiredStories: () => Promise<void>;
  subscribeToStories: (userId: string) => void;
  unsubscribeFromStories: () => void;
}

let storySubscription: any = null;
const trackedEvents = new Set<string>();

export const useStoryStore = create<StoryState>()(
  persist(
    (set, get) => ({
      stories: [],
      groupedStories: [],
      viewedMap: {},
      rankedStories: [],
      recommendedUsers: [],
      affinityMap: {},
      trendingStories: [],
      boostedStories: [],
      analyticsMap: {},
      conversionMap: {},
      creatorScores: {},
      isLoading: false,
      error: null,

      fetchStories: async (userId: string) => {
        // Now delegates to fetchRankedStories
        await get().fetchRankedStories(userId);
        await get().fetchRecommendations(userId);
      },

      fetchRankedStories: async (userId: string) => {
        set({ isLoading: true, error: null });
        try {
          // Pre-fetch following and followers
          const { data: followingData } = await (supabase as any)
            .from('follows')
            .select('following_id')
            .eq('follower_id', userId);

          const followingIds = (followingData as any[])?.map((f) => f.following_id) || [];

          const { data: followersData } = await (supabase as any)
            .from('follows')
            .select('follower_id')
            .eq('following_id', userId);

          const followerIds = (followersData as any[])?.map((f) => f.follower_id) || [];

          // For discoverability and fallback, fetch all active stories (could be limited in a massive app)
          const { data, error } = await supabase
            .from('stories')
            .select(`*, profiles(*), story_views(*)`)
            .eq('is_active', true)
            .gt('expires_at', new Date().toISOString())
            .order('created_at', { ascending: false });

          if (error) throw error;

          const isMutual = (id: string) => followingIds.includes(id) && followerIds.includes(id);

          // Get boosted story/creator info
          let activeBoostedStoryIds: string[] = [];
          let activeBoostedCreatorIds: string[] = [];
          try {
            const { data: boostedData } = await (supabase as any)
              .from('boosted_stories')
              .select('story_id, user_id')
              .eq('status', 'active');
            if (boostedData) {
              activeBoostedStoryIds = boostedData.map((b: any) => b.story_id).filter(Boolean) as string[];
              activeBoostedCreatorIds = boostedData.map((b: any) => b.user_id).filter(Boolean) as string[];
              set({ boostedStories: activeBoostedStoryIds });
            }
          } catch (e) {
            console.warn('Boosted stories table check fallback, using local boostedStories state copy', e);
          }

          const { viewedMap, affinityMap, boostedStories } = get();

          const groupsMap = new Map<string, StoryGroup>();
          
          (data as any[] || []).forEach(story => {
            if (!story.profiles) return;
            const sUserId = story.profiles.id;
            
            const isViewed = viewedMap[story.id] || !!story.story_views?.find(v => v.viewer_id === userId);
            if (isViewed && !viewedMap[story.id]) {
              viewedMap[story.id] = true;
            }

            let group = groupsMap.get(sUserId);
            if (!group) {
              let relationship: StoryGroup['relationship'] = 'none';
              if (sUserId === userId) relationship = 'own';
              else if (isMutual(sUserId)) relationship = 'mutual';
              else if (followingIds.includes(sUserId)) relationship = 'following';
              else if (followerIds.includes(sUserId)) relationship = 'follower';

              group = {
                userId: sUserId,
                profile: story.profiles,
                stories: [],
                hasUnread: false,
                relationship,
                latestStoryAt: story.created_at,
                score: 0
              };
              groupsMap.set(sUserId, group);
            }
            
            group.stories.push(story);
            if (!isViewed && sUserId !== userId) {
              group.hasUnread = true;
            }
            
            if (new Date(story.created_at) > new Date(group.latestStoryAt)) {
               group.latestStoryAt = story.created_at;
            }
          });

          groupsMap.forEach(group => {
            group.stories.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });

          // Compute Intelligent Score
          const now = Date.now();
          const trending: ExtendedStory[] = [];
          
          Array.from(groupsMap.values()).forEach(group => {
            let score = 0;

            // 1. Relationship Priority (Highest)
            if (group.relationship === 'own') score += 1000;
            else if (group.relationship === 'mutual') score += 100;
            else if (group.relationship === 'following') score += 70;
            else if (group.relationship === 'follower') score += 40;
            else score += 10; // New creators (discovery)

            // 2. Affinity / Engagement Boost (from history map)
            const affinity = affinityMap[group.userId];
            if (affinity) {
              // Boost based on view counts and completion rates
              const engagementBoost = (affinity.view_count * 2) + Math.round(affinity.completion_rate * 20);
              score += engagementBoost;
              
              // Recency of interaction
              if (affinity.last_viewed_at) {
                 const hoursSinceLastView = (now - new Date(affinity.last_viewed_at).getTime()) / (1000 * 60 * 60);
                 if (hoursSinceLastView < 24) score += 15;
                 else if (hoursSinceLastView < 72) score += 5;
              }
            }

            // 3. Active Promotion Boost (MONETIZATION: boosted stories)
            const groupContainsBoosted = group.stories.some(s => 
              activeBoostedStoryIds.includes(s.id) || 
              boostedStories.includes(s.id)
            );
            const creatorIsBoosted = activeBoostedCreatorIds.includes(group.userId);
            if (groupContainsBoosted || creatorIsBoosted) {
              score += 150; // High ranking boost for boosted stories while respecting relevance
            }

            // 4. Story level recency and trending spike
            group.stories.forEach(story => {
              const ageHours = (now - new Date(story.created_at).getTime()) / (1000 * 60 * 60);
              // Recency boost (+time boost)
              const recencyBoost = Math.max(0, 24 - ageHours);
              score += recencyBoost;

              // Trending detection: lots of views quickly
              const viewsCount = story.story_views?.length || 0;
              if (ageHours < 2 && viewsCount > 5 && group.relationship !== 'own') {
                 score += 30; // Trending boost
                 trending.push(story);
              }
            });

            group.score = score;
          });

          const rankedArray = Array.from(groupsMap.values());
          
          // Sort groups by score, then by unread
          rankedArray.sort((a, b) => {
             if (a.relationship === 'own' || b.relationship === 'own') {
                return a.relationship === 'own' ? -1 : 1;
             }
             if (a.hasUnread && !b.hasUnread) return -1;
             if (!a.hasUnread && b.hasUnread) return 1;
             return (b.score || 0) - (a.score || 0);
          });

          set({ 
            stories: (data as any) || [], 
            groupedStories: rankedArray, // Keep backwards compatibility
            rankedStories: rankedArray,
            trendingStories: trending,
            viewedMap: { ...viewedMap }
          });

        } catch (err: any) {
          console.error('Error fetching ranked stories:', err);
          set({ error: err.message });
        } finally {
          set({ isLoading: false });
        }
      },

      fetchRecommendations: async (userId: string) => {
         try {
            // Find users who have high engagement or mutuals but no active stories currently, or trending creators
            const { data } = await supabase
              .from('profiles')
              .select('*')
              .neq('id', userId)
              .limit(10);
              
            const recommendations: RecommendedUser[] = (data || []).map(p => ({
               userId: p.id,
               profile: p as Profile,
               reason: 'Trending creator'
            }));
            
            set({ recommendedUsers: recommendations });
         } catch (error) {
            console.error('Failed to fetch recommendations', error);
         }
      },

      updateAffinity: (creatorId: string, completion: boolean) => {
         set(state => {
            const current = state.affinityMap[creatorId] || { view_count: 0, completion_rate: 0, last_viewed_at: null };
            const newViewCount = current.view_count + 1;
            const completedCount = Math.round(current.completion_rate * current.view_count) + (completion ? 1 : 0);
            const newCompletionRate = completedCount / newViewCount;
            
            return {
               affinityMap: {
                  ...state.affinityMap,
                  [creatorId]: {
                     view_count: newViewCount,
                     completion_rate: newCompletionRate,
                     last_viewed_at: new Date().toISOString()
                  }
               }
            };
         });
      },

      createStory: async (userId, file, mediaType, content, storyType, linkedId) => {
        set({ isLoading: true, error: null });
        try {
          let mediaUrl = null;

          if (file && (mediaType === 'image' || mediaType === 'video')) {
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}-${Math.random()}.${fileExt}`;
            const filePath = `stories/${fileName}`;

            const { error: uploadError } = await supabase.storage
              .from('feed')
              .upload(filePath, file);

            if (uploadError) throw uploadError;

            const { data: publicUrlData } = supabase.storage
              .from('feed')
              .getPublicUrl(filePath);

            mediaUrl = publicUrlData.publicUrl;
          }

          const { error } = await supabase
            .from('stories')
            .insert({
              user_id: userId,
              media_url: mediaUrl,
              media_type: mediaType,
              caption: content,
              story_type: storyType,
              linked_id: linkedId || null
            });

          if (error) throw error;

          await get().fetchStories(userId);
        } catch (err: any) {
          console.error('Error creating story:', err);
          set({ error: err.message });
        } finally {
          set({ isLoading: false });
        }
      },

      markViewed: async (storyId: string, viewerId: string) => {
        try {
          const { viewedMap } = get();
          
          if (viewedMap[storyId]) return; // Already marked locally
          
          // Optimistically update local view map
          set(state => {
              const newMap = { ...state.viewedMap, [storyId]: true };
              
              // Recalculate hasUnread
              const newGroups = state.groupedStories.map(group => {
                  const hasUnread = group.stories.some(s => !newMap[s.id] && s.user_id !== viewerId); // ignore own views
                  return { ...group, hasUnread };
              });
              
              return { viewedMap: newMap, groupedStories: newGroups };
          });

          const { error } = await supabase
            .from('story_views')
            .insert({ story_id: storyId, viewer_id: viewerId });

          if (error && error.code !== '23505') {
            throw error;
          }
        } catch (err: any) {
          console.error('Error logging story view:', err);
        }
      },

      deleteExpiredStories: async () => {
        try {
          await supabase
            .from('stories')
            .update({ is_active: false })
            .lte('expires_at', new Date().toISOString())
            .eq('is_active', true);
        } catch (err) {
          console.error('Error cleaning up stories:', err);
        }
      },

      subscribeToStories: (userId: string) => {
        if (storySubscription) return;
        
        storySubscription = supabase
          .channel('public:stories')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'stories' },
            () => {
              get().fetchStories(userId);
            }
          )
          .subscribe();
      },

      unsubscribeFromStories: () => {
        if (storySubscription) {
          supabase.removeChannel(storySubscription);
          storySubscription = null;
        }
      },

      boostStory: async (storyId: string, amount: number, currency = 'USD') => {
        const story = get().stories.find(s => s.id === storyId);
        if (!story) {
          console.warn('Story not found for boosting:', storyId);
          return false;
        }
        const sUserId = story.user_id;

        try {
          const { error } = await (supabase as any)
            .from('boosted_stories')
            .insert({
              story_id: storyId,
              user_id: sUserId,
              boost_amount: amount,
              currency,
              start_time: new Date().toISOString(),
              end_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
              status: 'active'
            });

          if (error) throw error;
        } catch (e) {
          console.warn('Unable to persist boost record to DB table (table boosted_stories may not exist), proceeding with local fallback', e);
        }

        set(state => {
          const newBoosted = Array.from(new Set([...state.boostedStories, storyId]));
          return { boostedStories: newBoosted };
        });

        // Re-rank groups immediately for real-time responsiveness
        await get().fetchRankedStories(sUserId);
        return true;
      },

      fetchAnalytics: async (storyId: string) => {
        try {
          const { data, error } = await (supabase as any)
            .from('story_analytics')
            .select('*')
            .eq('story_id', storyId)
            .maybeSingle();

          if (data && !error) {
            set(state => ({
              analyticsMap: {
                ...state.analyticsMap,
                [storyId]: {
                  impressions: data.impressions || 0,
                  views: data.views || 0,
                  completions: data.completions || 0,
                  skips: data.skips || 0,
                  link_clicks: data.link_clicks || 0,
                }
              }
            }));
            return data;
          }
        } catch (e) {
          console.warn('story_analytics fetch failed, falling back to local memory', e);
        }
        return get().analyticsMap[storyId] || { impressions: 0, views: 0, completions: 0, skips: 0, link_clicks: 0 };
      },

      trackStoryEvent: async (storyId: string, type: 'impression' | 'view' | 'completion' | 'skip') => {
        const sessionKey = `${storyId}-${type}`;
        if (trackedEvents.has(sessionKey)) return;
        trackedEvents.add(sessionKey);

        set(state => {
          const current = state.analyticsMap[storyId] || { impressions: 0, views: 0, completions: 0, skips: 0, link_clicks: 0 };
          const updated = { ...current };
          if (type === 'impression') updated.impressions += 1;
          else if (type === 'view') updated.views += 1;
          else if (type === 'completion') updated.completions += 1;
          else if (type === 'skip') updated.skips += 1;

          return {
            analyticsMap: {
              ...state.analyticsMap,
              [storyId]: updated
            }
          };
        });

        try {
          const { data } = await (supabase as any)
            .from('story_analytics')
            .select('*')
            .eq('story_id', storyId);

          if (data && data.length > 0) {
            const record = data[0];
            const updates: any = {};
            if (type === 'impression') updates.impressions = (record.impressions || 0) + 1;
            else if (type === 'view') updates.views = (record.views || 0) + 1;
            else if (type === 'completion') updates.completions = (record.completions || 0) + 1;
            else if (type === 'skip') updates.skips = (record.skips || 0) + 1;

            const views = updates.views !== undefined ? updates.views : (record.views || 0);
            const imps = updates.impressions !== undefined ? updates.impressions : (record.impressions || 0);
            if (imps > 0) {
              updates.engagement_rate = views / imps;
            }

            await (supabase as any)
              .from('story_analytics')
              .update(updates)
              .eq('story_id', storyId);
          } else {
            const story = get().stories.find(s => s.id === storyId);
            await (supabase as any)
              .from('story_analytics')
              .insert({
                story_id: storyId,
                user_id: story?.user_id || 'unknown',
                impressions: type === 'impression' ? 1 : 0,
                views: type === 'view' ? 1 : 0,
                completions: type === 'completion' ? 1 : 0,
                skips: type === 'skip' ? 1 : 0,
                link_clicks: 0,
                engagement_rate: type === 'view' ? 1 : 0
              });
          }
        } catch (e) {
          console.warn('Failed to persist story analytics event, using local memory state instead', e);
        }
      },

      trackConversion: async (storyId: string, type: 'link_click' | 'profile_visit' | 'booking_init') => {
        const conversionKey = `conversion-${storyId}-${type}`;
        if (trackedEvents.has(conversionKey)) return;
        trackedEvents.add(conversionKey);

        set(state => {
          const currentConv = state.conversionMap[storyId] || { link_clicks: 0, profile_visits: 0, booking_inits: 0 };
          const updatedConv = { ...currentConv };
          if (type === 'link_click') updatedConv.link_clicks += 1;
          else if (type === 'profile_visit') updatedConv.profile_visits += 1;
          else if (type === 'booking_init') updatedConv.booking_inits += 1;

          const currentAnal = state.analyticsMap[storyId] || { impressions: 0, views: 0, completions: 0, skips: 0, link_clicks: 0 };
          const updatedAnal = { ...currentAnal };
          if (type === 'link_click') updatedAnal.link_clicks += 1;

          return {
            conversionMap: {
              ...state.conversionMap,
              [storyId]: updatedConv
            },
            analyticsMap: {
              ...state.analyticsMap,
              [storyId]: updatedAnal
            }
          };
        });

        try {
          const { data } = await (supabase as any)
            .from('story_analytics')
            .select('*')
            .eq('story_id', storyId);

          if (data && data.length > 0) {
            const record = data[0];
            const updates: any = {};
            if (type === 'link_click') {
              updates.link_clicks = (record.link_clicks || 0) + 1;
            }
            const clicks = updates.link_clicks !== undefined ? updates.link_clicks : (record.link_clicks || 0);
            const imps = record.impressions || 1;
            updates.conversion_rate = clicks / imps;

            await (supabase as any)
              .from('story_analytics')
              .update(updates)
              .eq('story_id', storyId);
          }
        } catch (e) {
          console.warn('Failed to update story conversion in DB', e);
        }
      },

      computeCreatorScore: (creatorId: string) => {
        const groups = get().groupedStories;
        const group = groups.find(g => g.userId === creatorId);
        if (!group) return 0;

        let totalImps = 0;
        let totalViews = 0;
        let totalComps = 0;
        let totalClicks = 0;

        group.stories.forEach(story => {
          const anal = get().analyticsMap[story.id] || { impressions: 0, views: 0, completions: 0, skips: 0, link_clicks: 0 };
          totalImps += anal.impressions || 0;
          totalViews += anal.views || 0;
          totalComps += anal.completions || 0;
          totalClicks += anal.link_clicks || 0;
        });

        let score = 50; // base score

        if (totalImps > 0) {
          const engage = totalViews / totalImps;
          score += Math.round(engage * 50);
          
          const complete = totalComps / totalImps;
          score += Math.round(complete * 40);
        }

        score += Math.min(30, group.stories.length * 10);

        const creatorIsBoosted = group.stories.some(s => get().boostedStories.includes(s.id));
        if (creatorIsBoosted) {
          score += 20;
        }

        score += Math.min(30, totalClicks * 5);

        set(state => ({
          creatorScores: {
             ...state.creatorScores,
             [creatorId]: score
          }
        }));

        return score;
      }
    }),
    {
      name: 'story-storage',
      partialize: (state) => ({ 
        viewedMap: state.viewedMap, 
        affinityMap: state.affinityMap,
        boostedStories: state.boostedStories,
        analyticsMap: state.analyticsMap,
        conversionMap: state.conversionMap,
        creatorScores: state.creatorScores
      }),
    }
  )
);
