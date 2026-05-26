import { create } from 'zustand';
import { supabase } from '../../../lib/supabase';

export interface SocialGraphState {
  // Classic simple ID lists for backward compatibility
  followers: Record<string, string[]>; // targetId -> list of followerIds
  following: Record<string, string[]>; // followerId -> list of targetIds
  isFollowing: Record<string, boolean>; // `${followerId}:${targetId}` -> boolean
  realtimeSubscription: any | null;

  // New structured maps requested in Step 9
  followersMap: Record<string, any[]>; // userId -> Profile object list
  followingMap: Record<string, any[]>; // userId -> Profile object list
  mutualsMap: Record<string, any[]>; // userId -> Profile object list
  followStates: Record<string, boolean>; // userId -> boolean (true if current user follows them)
  relationshipStrengths: Record<string, number>; // `${user_a}:${user_b}` -> numeric connection score

  // Actions
  toggleFollow: (targetId: string) => Promise<void>;
  fetchRelationships: (userId: string) => Promise<void>;
  subscribeToRelationships: (userId: string) => void;
  iFollow: (meId: string, targetId: string) => boolean;
  isFollower: (meId: string, targetId: string) => boolean;

  // New Step 9 Actions
  fetchFollowers: (userId: string) => Promise<void>;
  fetchFollowing: (userId: string) => Promise<void>;
  fetchMutuals: (userId: string) => Promise<void>;
  fetchConnectionStrength: (userA: string, userB: string) => Promise<number>;
  checkMutual: (userA: string, userB: string) => boolean;
}

export const useSocialGraphStore = create<SocialGraphState>((set, get) => ({
  followers: {},
  following: {},
  isFollowing: {},
  realtimeSubscription: null,

  // Initializing new state structures
  followersMap: {},
  followingMap: {},
  mutualsMap: {},
  followStates: {},
  relationshipStrengths: {},

  toggleFollow: async (targetId: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const followerId = user.id;
    const key = `${followerId}:${targetId}`;
    const currentlyFollowing = !!get().followStates[targetId] || !!get().isFollowing[key];

    // Optimistic Update
    set(state => {
      const followingList = state.following[followerId] || [];
      const isNowFollowing = !currentlyFollowing;
      return {
        ...state,
        following: {
          ...state.following,
          [followerId]: isNowFollowing 
            ? [...followingList, targetId] 
            : followingList.filter(id => id !== targetId)
        },
        isFollowing: { ...state.isFollowing, [key]: isNowFollowing },
        followStates: { ...state.followStates, [targetId]: isNowFollowing }
      };
    });

    try {
      if (currentlyFollowing) {
        const { error } = await (supabase as any).from('follows').delete().eq('follower_id', followerId).eq('following_id', targetId);
        if (error) throw error;
      } else {
        const { error } = await (supabase as any).from('follows').insert({ follower_id: followerId, following_id: targetId });
        if (error) throw error;
      }

      // Re-fetch to synchronize state precisely with DB after changes (including triggers and notifications)
      await Promise.all([
        get().fetchRelationships(followerId),
        get().fetchRelationships(targetId),
        get().fetchConnectionStrength(followerId, targetId)
      ]);
    } catch (e) {
      console.error('Failed to toggle follow:', e);
      // Revert on error
      set(state => {
        const revertFollowing = state.following[followerId] || [];
        return {
          ...state,
          following: {
            ...state.following,
            [followerId]: currentlyFollowing 
              ? [...revertFollowing, targetId]
              : revertFollowing.filter(id => id !== targetId)
          },
          isFollowing: { ...state.isFollowing, [key]: currentlyFollowing },
          followStates: { ...state.followStates, [targetId]: currentlyFollowing }
        };
      });
    }
  },

  fetchFollowers: async (userId: string) => {
    try {
      let data: any[] | null = null;
      let error: any = null;

      // Try resolving via constraint name first
      const res1 = await (supabase as any)
        .from('follows')
        .select(`
          follower_id,
          profiles!follows_follower_id_fkey (*)
        `)
        .eq('following_id', userId);
      
      data = res1.data;
      error = res1.error;

      // If constraint-based hint fails, try column-based hint
      if (error) {
        const res2 = await (supabase as any)
          .from('follows')
          .select(`
            follower_id,
            profiles!follower_id (*)
          `)
          .eq('following_id', userId);
        
        data = res2.data;
        error = res2.error;
      }

      // If both join attempts fail (e.g. Postgrest schema cache mismatch), trigger ultra-robust decoupled two-step fallback
      if (error) {
        console.warn('SocialGraph: Joint query failed. Executing robust decoupled fallback for followers.', error);
        const { data: idData, error: idError } = await (supabase as any)
          .from('follows')
          .select('follower_id')
          .eq('following_id', userId);
        
        if (idError) throw idError;
        
        const followerIds = (idData as any[])?.map(d => d.follower_id) || [];
        if (followerIds.length === 0) {
          set(state => ({
            followersMap: { ...state.followersMap, [userId]: [] },
            followers: { ...state.followers, [userId]: [] }
          }));
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', followerIds);
        
        if (profileError) throw profileError;

        set(state => ({
          followersMap: { ...state.followersMap, [userId]: profileData || [] },
          followers: { ...state.followers, [userId]: followerIds }
        }));
        return;
      }

      const followersList = (data as any[])?.map(d => d.profiles).filter(Boolean) || [];
      const followersIds = (data as any[])?.map(d => d.follower_id) || [];

      set(state => ({
        followersMap: { ...state.followersMap, [userId]: followersList },
        followers: { ...state.followers, [userId]: followersIds }
      }));
    } catch (e) {
      console.error('Error fetching followers:', e);
    }
  },

  fetchFollowing: async (userId: string) => {
    try {
      let data: any[] | null = null;
      let error: any = null;

      // Try constraint-based hint first
      const res1 = await (supabase as any)
        .from('follows')
        .select(`
          following_id,
          profiles!follows_following_id_fkey (*)
        `)
        .eq('follower_id', userId);
      
      data = res1.data;
      error = res1.error;

      // Try column-based hint second
      if (error) {
        const res2 = await (supabase as any)
          .from('follows')
          .select(`
            following_id,
            profiles!following_id (*)
          `)
          .eq('follower_id', userId);
        
        data = res2.data;
        error = res2.error;
      }

      // If both join attempts fail, query sequentially (very robust fallback)
      if (error) {
        console.warn('SocialGraph: Joint query failed. Executing robust decoupled fallback for following.', error);
        const { data: idData, error: idError } = await (supabase as any)
          .from('follows')
          .select('following_id')
          .eq('follower_id', userId);
        
        if (idError) throw idError;
        
        const followingIds = (idData as any[])?.map(d => d.following_id) || [];
        const { data: { user } } = await supabase.auth.getUser();
        const followStatesUpdate: Record<string, boolean> = {};
        if (user && user.id === userId) {
          followingIds.forEach(id => {
            followStatesUpdate[id] = true;
          });
        }

        if (followingIds.length === 0) {
          set(state => {
            const newIsFollowing = { ...state.isFollowing };
            if (user && user.id === userId) {
              Object.keys(newIsFollowing).forEach(k => {
                if (k.startsWith(`${user.id}:`)) {
                  newIsFollowing[k] = false;
                }
              });
            }
            return {
              followingMap: { ...state.followingMap, [userId]: [] },
              following: { ...state.following, [userId]: [] },
              followStates: {
                ...state.followStates,
                ...followStatesUpdate
              },
              isFollowing: newIsFollowing
            };
          });
          return;
        }

        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .in('id', followingIds);
        
        if (profileError) throw profileError;

        set(state => {
          const newIsFollowing = { ...state.isFollowing };
          if (user && user.id === userId) {
            Object.keys(newIsFollowing).forEach(k => {
              if (k.startsWith(`${user.id}:`)) {
                newIsFollowing[k] = false;
              }
            });
            followingIds.forEach(id => {
              newIsFollowing[`${user.id}:${id}`] = true;
            });
          }

          return {
            followingMap: { ...state.followingMap, [userId]: profileData || [] },
            following: { ...state.following, [userId]: followingIds },
            followStates: {
              ...state.followStates,
              ...(user && user.id === userId ? Object.fromEntries(followingIds.map(id => [id, true])) : {}),
              ...followStatesUpdate
            },
            isFollowing: newIsFollowing
          };
        });
        return;
      }

      const followingList = (data as any[])?.map(d => d.profiles).filter(Boolean) || [];
      const followingIds = (data as any[])?.map(d => d.following_id) || [];

      // If fetching the current logged-in user, synchronize followStates Map
      const { data: { user } } = await supabase.auth.getUser();
      const followStatesUpdate: Record<string, boolean> = {};
      if (user && user.id === userId) {
        followingIds.forEach(id => {
          followStatesUpdate[id] = true;
        });
      }

      set(state => {
        const newIsFollowing = { ...state.isFollowing };
        if (user && user.id === userId) {
          // Clear previous keys
          Object.keys(newIsFollowing).forEach(k => {
            if (k.startsWith(`${user.id}:`)) {
              newIsFollowing[k] = false;
            }
          });
          followingIds.forEach(id => {
            newIsFollowing[`${user.id}:${id}`] = true;
          });
        }

        return {
          followingMap: { ...state.followingMap, [userId]: followingList },
          following: { ...state.following, [userId]: followingIds },
          followStates: {
            ...state.followStates,
            ...(user && user.id === userId ? Object.fromEntries(followingIds.map(id => [id, true])) : {}),
            ...followStatesUpdate
          },
          isFollowing: newIsFollowing
        };
      });
    } catch (e) {
      console.error('Error fetching following:', e);
    }
  },

  fetchMutuals: async (userId: string) => {
    try {
      // Query ids first for mutual detection
      const { data: followingData, error: followingError } = await (supabase as any)
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const { data: followersData, error: followersError } = await (supabase as any)
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      if (followingError) throw followingError;
      if (followersError) throw followersError;

      const followingIds = (followingData as any[])?.map(d => d.following_id) || [];
      const followerIds = (followersData as any[])?.map(d => d.follower_id) || [];

      const mutualIds = followingIds.filter(id => followerIds.includes(id));

      if (mutualIds.length === 0) {
        set(state => ({
          mutualsMap: { ...state.mutualsMap, [userId]: [] }
        }));
        return;
      }

      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', mutualIds);

      if (profileError) throw profileError;

      set(state => ({
        mutualsMap: { ...state.mutualsMap, [userId]: profileData || [] }
      }));
    } catch (e) {
      console.error('Error fetching mutuals:', e);
    }
  },

  fetchConnectionStrength: async (userA: string, userB: string) => {
    // Step 5: Lightweight Social Connection Strength
    try {
      const { data, error } = await (supabase as any).rpc('get_connection_strength', {
        user_a: userA,
        user_b: userB
      });
      if (error) throw error;
      const score = Number(data) || 0;
      const key = `${userA}:${userB}`;
      set(state => ({
        relationshipStrengths: { ...state.relationshipStrengths, [key]: score }
      }));
      return score;
    } catch (e) {
      console.error('Error fetching connection strength:', e);
      return 0;
    }
  },

  checkMutual: (userA: string, userB: string) => {
    // Client-side instant mutual evaluation
    if (!userA || !userB) return false;
    const followingA = get().following[userA] || [];
    const followingB = get().following[userB] || [];
    return followingA.includes(userB) && followingB.includes(userA);
  },

  fetchRelationships: async (userId: string) => {
    await Promise.all([
      get().fetchFollowers(userId),
      get().fetchFollowing(userId),
      get().fetchMutuals(userId)
    ]);
  },
  
  subscribeToRelationships: async (userId: string) => {
      // Unsubscribe from existing if any
      const existingSub = get().realtimeSubscription;
      if (existingSub) {
          supabase.removeChannel(existingSub);
      }

      // Listen on 'follows' table instead of 'followers' but synchronize everything in realtime
      const subscription = supabase
        .channel(`public:follows:${userId}`)
        .on(
            'postgres_changes',
            { 
                event: '*', 
                schema: 'public', 
                table: 'follows',
                filter: `follower_id=eq.${userId}` 
            },
            () => { get().fetchRelationships(userId); }
        )
        .on(
            'postgres_changes',
            { 
                event: '*', 
                schema: 'public', 
                table: 'follows',
                filter: `following_id=eq.${userId}` 
            },
            () => { get().fetchRelationships(userId); }
        )
        .subscribe();
      set({ realtimeSubscription: subscription });
  },

  iFollow: (meId: string, targetId: string) => {
      if (!meId || !targetId) return false;
      const state = get();
      return state.following[meId]?.includes(targetId) || 
             state.isFollowing[`${meId}:${targetId}`] === true ||
             state.followStates[targetId] === true;
  },

  isFollower: (meId: string, targetId: string) => {
      if (!meId || !targetId) return false;
      const state = get();
      return state.followers[meId]?.includes(targetId) === true;
  }
}));
