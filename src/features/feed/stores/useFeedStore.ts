import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '../../../lib/supabase';
import type { DbPost, CommentThread, SavedPost, Collection } from '../../../types/index';
import { buildCommentTree } from '../utils/commentTree';
import { useChatStore } from '../../chat/stores/useChatStore';

export interface FeedPost extends DbPost {
  profiles?: {
    id: string;
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    hustle_name?: string | null;
    primary_skill?: string | null;
    show_rating?: boolean;
    rating_average?: number | null;
    review_count?: number | null;
    is_hustler?: boolean;
  } | null;
  likes_count: number;
  comments_count: number;
  userHasLiked?: boolean;
  shares_count: number;
  saves_count: number;
  userHasSaved?: boolean;

  // Repost structures
  repost_comment?: string | null;
  reposts_count?: number;
  userHasReposted?: boolean;
  original_post?: any;

  // Save structure
  collection_id?: string | null;

  // Attached Listings
  attached_listing_type?: 'service' | 'product' | 'training' | null;
  attached_listing_id?: string | null;
  attached_listing_data?: any | null;
}

interface FeedState {
  posts: FeedPost[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  cursor: string | null;
  isFetchingMore: boolean;
  hydratedPostMap: Record<string, FeedPost>;
  lastCacheAt: number | null;

  // Comments State
  commentsMap: Record<string, CommentThread[]>;
  loadingComments: Record<string, boolean>;

  // New state variables for reposts
  repostMap: Record<string, boolean>;
  repostCounts: Record<string, number>;
  activeReposts: FeedPost[];

  // Saves & Collections State
  savedPosts: FeedPost[];
  savedPostIds: Record<string, boolean>;
  collections: Collection[];
  activeCollectionId: string | null;
  isLoadingSaves: boolean;

  // Reporting & Hiding
  markNotInterested: (postId: string) => Promise<void>;
  
  // Real-time State
  activeSubscriptions: any[];
  lastRealtimeEvent: any;

  // Media Performance State
  cachedMedia: Record<string, string>;
  preloadQueue: string[];
  activeMediaId: string | null;
  networkQuality: "fast" | "slow";

  // Sharing State
  shareCounts: Record<string, number>;
  copiedLinks: Record<string, boolean>;

  setPosts: (posts: FeedPost[] | ((prev: FeedPost[]) => FeedPost[])) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  setHasMore: (hasMore: boolean) => void;
  setCursor: (cursor: string | null) => void;
  
  addPostOptimistically: (post: FeedPost) => void;
  updatePostLike: (postId: string, liked: boolean, incrementStats: boolean) => void;
  updatePostCommentCount: (postId: string, increment?: number) => void;
  toggleLikeOptimistically: (postId: string) => void;
  syncPostLikes: (postId: string) => Promise<void>;

  // Comment Actions
  setComments: (postId: string, comments: CommentThread[]) => void;
  setLoadingComments: (postId: string, isLoading: boolean) => void;
  fetchComments: (postId: string) => Promise<void>;
  addCommentOptimistically: (postId: string, comment: CommentThread) => void;

  // Actions for reposts
  toggleRepostOptimistically: (postId: string, comment?: string | null) => void;
  updatePostRepost: (postId: string, reposted: boolean, serverCount?: number) => void;
  fetchReposts: (userId: string) => Promise<void>;
  syncRepostState: () => void;

  // Actions for Saves & Collections
  fetchSavedPosts: () => Promise<void>;
  toggleSave: (postId: string) => Promise<void>;
  fetchCollections: () => Promise<void>;
  createCollection: (name: string) => Promise<void>;
  addPostToCollection: (postId: string, collectionId: string) => Promise<void>;
  removePostFromCollection: (postId: string) => Promise<void>;
  setActiveCollection: (collectionId: string | null) => void;
  
  // Real-time Actions
  subscribeToFeed: () => Promise<void>;
  unsubscribeFromFeed: () => void;
  processRealtimeEvent: (payload: any) => Promise<void>;

  // Media Performance Actions
  preloadMedia: (post: FeedPost) => void;
  releaseMedia: (postId: string) => void;
  setActiveMediaId: (id: string | null) => void;
  hydrateCache: (posts: FeedPost[]) => void;
  optimizeFeedPerformance: () => void;

  // Feed Engine Actions
  fetchInitialFeed: (pageSize?: number, ignoreCache?: boolean) => Promise<void>;
  fetchMoreFeed: (pageSize?: number) => Promise<void>;
  hydrateFeed: (posts: FeedPost[]) => Promise<FeedPost[]>;
  dedupeFeed: (posts: FeedPost[]) => FeedPost[];
  
  // Sharing Actions
  copyPostLink: (postId: string) => Promise<void>;
  sharePostToUser: (postId: string, targetUserId: string) => Promise<void>;
  syncShareCounts: () => void;
  
  reset: () => void;
}

export const useFeedStore = create<FeedState>()(
  persist(
    (set, get) => ({
      posts: [],
      isLoading: false,
      error: null,
      hasMore: true,
      cursor: null,
      isFetchingMore: false,
      hydratedPostMap: {},
      lastCacheAt: null,

      // Initial Comments state
      commentsMap: {},
      loadingComments: {},

      // Initial repost states
      repostMap: {},
      repostCounts: {},
      activeReposts: [],

      // Initial saves & collections state
      savedPosts: [],
      savedPostIds: {},
      collections: [],
      activeCollectionId: null,
      isLoadingSaves: false,

      // Initial Real-time state
      activeSubscriptions: [],
      lastRealtimeEvent: null,

      // Media Performance Initial State
      cachedMedia: {},
      preloadQueue: [],
      activeMediaId: null,
      networkQuality: "fast",

      // Initial sharing state
      shareCounts: {},
      copiedLinks: {},

      setPosts: (posts) => set((state) => ({ 
        posts: typeof posts === 'function' ? posts(state.posts) : posts 
      })),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      setHasMore: (hasMore) => set({ hasMore }),
      setCursor: (cursor) => set({ cursor }),

      markNotInterested: async (postId: string) => {
        set((state) => ({
          posts: state.posts.filter((p) => p.id !== postId)
        }));
        try {
          // Fire and forget via the REST API or supabase (mocking via REST fetch since backend supports it)
          const token = localStorage.getItem("hustle_auth_token");
          if (token) {
            await fetch("/api/feed/not-interested", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
              },
              body: JSON.stringify({ postId })
            });
          }
        } catch (e) {
          console.error("Failed to mark post as not interested", e);
        }
      },
      
      addPostOptimistically: (post) => set((state) => {
        const { dedupeFeed } = get();
        return {
          posts: dedupeFeed([post, ...state.posts])
        };
      }),

      updatePostLike: (postId, liked, incrementStats) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id !== postId) return post;
          
          const likesCount = post.likes_count || 0;
          const newCount = incrementStats 
            ? (liked ? likesCount + 1 : Math.max(0, likesCount - 1))
            : likesCount;

          return {
            ...post,
            userHasLiked: liked,
            likes_count: newCount
          };
        })
      })),

      toggleLikeOptimistically: (postId) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id !== postId) return post;
          
          const currentlyLiked = !!post.userHasLiked;
          const likesCount = post.likes_count || 0;
          
          return {
            ...post,
            userHasLiked: !currentlyLiked,
            likes_count: !currentlyLiked ? likesCount + 1 : Math.max(0, likesCount - 1)
          };
        })
      })),

      syncPostLikes: async (postId) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          
          const [likesCountRes, userLikeRes] = await Promise.all([
            (supabase as any).from('post_likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
            user ? (supabase as any).from('post_likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null })
          ]);

          let count = likesCountRes.count !== null ? likesCountRes.count : null;
          let hasLiked = !!userLikeRes.data;

          if (likesCountRes.error) {
            const [fallbackCountRes, fallbackUserLikeRes] = await Promise.all([
              (supabase as any).from('likes').select('id', { count: 'exact', head: true }).eq('post_id', postId),
              user ? (supabase as any).from('likes').select('id').eq('post_id', postId).eq('user_id', user.id).maybeSingle() : Promise.resolve({ data: null, error: null })
            ]);
            if (!fallbackCountRes.error) {
              count = fallbackCountRes.count !== null ? fallbackCountRes.count : count;
              hasLiked = !!fallbackUserLikeRes.data;
            }
          }

          if (count !== null) {
            set((state) => ({
              posts: state.posts.map(post => {
                if (post.id !== postId) return post;
                return {
                  ...post,
                  likes_count: count!,
                  userHasLiked: hasLiked
                };
              })
            }));
          }
        } catch (err) {
          console.error('Error syncing post likes:', err);
        }
      },

      updatePostCommentCount: (postId, increment = 1) => set((state) => ({
        posts: state.posts.map(post => {
          if (post.id !== postId) return post;
          
          return {
            ...post,
            comments_count: (post.comments_count || 0) + increment
          };
        })
      })),

      setComments: (postId, comments) => set((state) => ({
        commentsMap: { ...state.commentsMap, [postId]: comments }
      })),

      setLoadingComments: (postId, isLoading) => set((state) => ({
        loadingComments: { ...state.loadingComments, [postId]: isLoading }
      })),

      fetchComments: async (postId) => {
        get().setLoadingComments(postId, true);
        try {
          const { data, error } = await supabase
            .from('comments')
            .select(`
              *,
              profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
            `)
            .eq('post_id', postId)
            .order('created_at', { ascending: false });

          if (error) throw error;
          
          const commentTree = buildCommentTree(data || []);
          get().setComments(postId, commentTree);
        } catch (err) {
          console.error('Error fetching comments:', err);
        } finally {
          get().setLoadingComments(postId, false);
        }
      },

      addCommentOptimistically: (postId, comment) => set((state) => {
        const existingComments = state.commentsMap[postId] || [];
        
        // Helper to find parent and inject reply or add to root
        const injectComment = (tree: CommentThread[]): CommentThread[] => {
          // If it's a root comment
          if (!comment.parent_comment_id) {
            return [comment, ...tree];
          }
          
          // If it's a reply, find parent recursively
          return tree.map(c => {
            if (c.id === comment.parent_comment_id) {
              return {
                ...c,
                replies: [comment, ...(c.replies || [])]
              };
            }
            if (c.replies && c.replies.length > 0) {
              return {
                ...c,
                replies: injectComment(c.replies)
              };
            }
            return c;
          });
        };

        const newTree = injectComment(existingComments);
        
        // Also update post count
        const updatedPosts = state.posts.map(post => {
          if (post.id === postId) {
            return { ...post, comments_count: (post.comments_count || 0) + 1 };
          }
          return post;
        });

        return {
          commentsMap: { ...state.commentsMap, [postId]: newTree },
          posts: updatedPosts
        };
      }),

      toggleRepostOptimistically: (postId, comment) => set((state) => {
        const isCurrentlyReposted = !!state.repostMap[postId];
        const newReposted = !isCurrentlyReposted;
        
        // Update map and counts
        const newMap = { ...state.repostMap, [postId]: newReposted };
        const currentCount = state.repostCounts[postId] ?? 0;
        const newCount = newReposted ? currentCount + 1 : Math.max(0, currentCount - 1);
        const newCounts = { ...state.repostCounts, [postId]: newCount };

        const updatedPosts = state.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              userHasReposted: newReposted,
              reposts_count: newCount
            };
          }
          if (post.is_repost && post.original_post_id === postId) {
            return {
              ...post,
              original_post: post.original_post ? {
                ...post.original_post,
                reposts_count: newCount
              } : null
            };
          }
          return post;
        });

        return {
          repostMap: newMap,
          repostCounts: newCounts,
          posts: updatedPosts
        };
      }),

      updatePostRepost: (postId, reposted, serverCount) => set((state) => {
        const newMap = { ...state.repostMap, [postId]: reposted };
        
        const resolvedCount = typeof serverCount === 'number' 
          ? serverCount 
          : (reposted 
              ? (state.repostCounts[postId] ?? 0) + 1 
              : Math.max(0, (state.repostCounts[postId] ?? 1) - 1));
              
        const newCounts = { ...state.repostCounts, [postId]: resolvedCount };

        const updatedPosts = state.posts.map(post => {
          if (post.id === postId) {
            return {
              ...post,
              userHasReposted: reposted,
              reposts_count: resolvedCount
            };
          }
          if (post.is_repost && post.original_post_id === postId) {
            return {
              ...post,
              original_post: post.original_post ? {
                ...post.original_post,
                reposts_count: resolvedCount
              } : null
            };
          }
          return post;
        });

        return {
          repostMap: newMap,
          repostCounts: newCounts,
          posts: updatedPosts
        };
      }),

      fetchReposts: async (userId) => {
        if (!userId) return;
        try {
          const { data, error } = await (supabase as any)
            .from('posts')
            .select(`
              *,
              profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
            `)
            .eq('user_id', userId)
            .eq('is_repost', true);

          if (error) throw error;

          if (data) {
            const originalPostIds = (data as any[])
              .filter((p: any) => p.original_post_id)
              .map((p: any) => p.original_post_id as string);

            let originalPostsMap = new Map<string, any>();
            if (originalPostIds.length > 0) {
              const uniqueOriginalIds = Array.from(new Set(originalPostIds));
              const { data: originalPostsData, error: originalErr } = await (supabase as any)
                .from('posts')
                .select(`
                  *,
                  profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
                `)
                .in('id', uniqueOriginalIds);

              if (originalErr) {
                console.error('Error fetching original posts for user reposts:', originalErr);
              } else if (originalPostsData) {
                originalPostsData.forEach((op: any) => {
                  originalPostsMap.set(op.id, op);
                });
              }
            }

            const dataWithOriginals = data.map((post: any) => {
              if (post.is_repost && post.original_post_id) {
                return {
                  ...post,
                  original_post: originalPostsMap.get(post.original_post_id) || null
                };
              }
              return post;
            });

            const map: Record<string, boolean> = {};
            const counts: Record<string, number> = {};
            
            dataWithOriginals.forEach((p: any) => {
              if (p.original_post_id) {
                map[p.original_post_id] = true;
                if (p.original_post) {
                  counts[p.original_post_id] = p.original_post.reposts_count ?? 0;
                }
              }
            });

            set({
              activeReposts: dataWithOriginals as any[],
              repostMap: { ...get().repostMap, ...map },
              repostCounts: { ...get().repostCounts, ...counts }
            });
            
            get().syncRepostState();
          }
        } catch (err) {
          console.error('Error fetching reposts in store:', err);
        }
      },

      syncRepostState: () => set((state) => {
        const updatedPosts = state.posts.map(post => {
          const oid = post.is_repost ? post.original_post_id : null;
          
          const userHasReposted = !!(state.repostMap[post.id] || (oid && state.repostMap[oid]));
          const userHasSaved = !!(state.savedPostIds[post.id] || (oid && state.savedPostIds[oid]));
          
          const countId = oid || post.id;
          const count = state.repostCounts[countId] ?? post.reposts_count ?? 0;

          if (post.is_repost) {
            return {
              ...post,
              userHasReposted,
              userHasSaved,
              original_post: post.original_post ? {
                ...post.original_post,
                reposts_count: count
              } : null
            };
          } else {
            return {
              ...post,
              userHasReposted,
              userHasSaved,
              reposts_count: count
            };
          }
        });

        return { posts: updatedPosts };
      }),

      fetchSavedPosts: async () => {
        set({ isLoadingSaves: true });
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('saved_posts')
            .select(`
              *,
              posts (
                *,
                profiles (id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
              )
            `)
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          const savedIds: Record<string, boolean> = {};
          const posts: FeedPost[] = (data || []).map((s: any) => {
            if (s.post_id) savedIds[s.post_id] = true;
            const postData = s.posts || s.post;
            return {
              ...postData,
              userHasSaved: true,
              collection_id: s.collection_id
            };
          });

          set({ 
            savedPosts: posts, 
            savedPostIds: savedIds 
          });
          get().syncRepostState();
        } catch (err) {
          console.error('Error fetching saved posts:', err);
        } finally {
          set({ isLoadingSaves: false });
        }
      },

      toggleSave: async (postId) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const isCurrentlySaved = !!get().savedPostIds[postId];
        
        // Optimistic Update
        set((state) => {
          const newIds = { ...state.savedPostIds };
          if (isCurrentlySaved) {
            delete newIds[postId];
          } else {
            newIds[postId] = true;
          }
          return { savedPostIds: newIds };
        });
        get().syncRepostState();

        try {
          if (isCurrentlySaved) {
            const { error } = await supabase
              .from('saved_posts')
              .delete()
              .eq('user_id', user.id)
              .eq('post_id', postId);
            if (error) throw error;
          } else {
            const { error } = await supabase
              .from('saved_posts')
              .insert({
                user_id: user.id,
                post_id: postId
              });
            if (error) throw error;
          }
          // Re-fetch to ensure sync (could be improved with more granular optimistic updates)
          await get().fetchSavedPosts();
        } catch (err) {
          console.error('Error toggling save:', err);
          // Revert optimistic update on error
          await get().fetchSavedPosts();
        }
      },

      fetchCollections: async () => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { data, error } = await supabase
            .from('collections')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) throw error;

          // Always prepend the "General" collection
          const generalCollection: Collection = {
            id: 'general',
            user_id: user.id || '',
            name: 'General',
            created_at: new Date(0).toISOString() // Oldest
          };

          set({ collections: [generalCollection, ...(data || [])] });
        } catch (err) {
          console.error('Error fetching collections:', err);
        }
      },

      createCollection: async (name) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase
            .from('collections')
            .insert({
              user_id: user.id,
              name
            });

          if (error) throw error;
          await get().fetchCollections();
        } catch (err) {
          console.error('Error creating collection:', err);
        }
      },

      addPostToCollection: async (postId, collectionId) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Treat 'general' as null in the DB
          const dbCollectionId = collectionId === 'general' ? null : collectionId;

          // Update in saved_posts
          const { error } = await supabase
            .from('saved_posts')
            .update({ collection_id: dbCollectionId })
            .eq('user_id', user.id)
            .eq('post_id', postId);

          if (error) throw error;
          await get().fetchSavedPosts();
        } catch (err) {
          console.error('Error adding post to collection:', err);
        }
      },

      removePostFromCollection: async (postId) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const { error } = await supabase
            .from('saved_posts')
            .update({ collection_id: null })
            .eq('user_id', user.id)
            .eq('post_id', postId);

          if (error) throw error;
          await get().fetchSavedPosts();
        } catch (err) {
          console.error('Error removing post from collection:', err);
        }
      },

      setActiveCollection: (collectionId) => set({ activeCollectionId: collectionId }),

      subscribeToFeed: async () => {
        const { activeSubscriptions, unsubscribeFromFeed, processRealtimeEvent } = get();
        
        // Cleanup any existing subscriptions first
        if (activeSubscriptions.length > 0) {
          unsubscribeFromFeed();
        }

        const channel = supabase.channel('feed-realtime-global')
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'posts' 
          }, (payload) => processRealtimeEvent(payload))
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'likes' 
          }, (payload) => processRealtimeEvent(payload))
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'post_likes' 
          }, (payload) => processRealtimeEvent(payload))
          .on('postgres_changes', { 
            event: '*', 
            schema: 'public', 
            table: 'comments' 
          }, (payload) => processRealtimeEvent(payload))
          .subscribe();

        set({ activeSubscriptions: [channel] });
      },

      unsubscribeFromFeed: () => {
        const { activeSubscriptions } = get();
        activeSubscriptions.forEach(sub => {
          supabase.removeChannel(sub);
        });
        set({ activeSubscriptions: [] });
      },

      processRealtimeEvent: async (payload) => {
        const { posts, hydrateFeed, addPostOptimistically } = get();
        const { table, eventType, new: newRecord, old: oldRecord } = payload;
        const { data: { user } } = await supabase.auth.getUser();

        // 1. Handle Posts Table
        if (table === 'posts') {
          if (eventType === 'INSERT') {
            const { data: fullPost } = await (supabase
              .from('posts')
              .select(`
                *,
                profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
              `)
              .eq('id', newRecord.id)
              .single() as any);

            if (!fullPost) return;

            if (fullPost.is_repost && fullPost.original_post_id) {
              const hasReposted = user ? (fullPost.user_id === user.id) : false;
              get().updatePostRepost(fullPost.original_post_id, hasReposted, fullPost.reposts_count);
              return;
            }

            const [hydrated] = await hydrateFeed([fullPost]);
            if (hydrated) addPostOptimistically(hydrated);
          } else if (eventType === 'UPDATE') {
            set((state) => ({
              posts: state.posts.map(p => {
                if (p.id !== newRecord.id) return p;
                return { ...p, ...newRecord };
              })
            }));
          } else if (eventType === 'DELETE') {
            set((state) => ({
              posts: state.posts.filter(p => p.id !== oldRecord.id)
            }));
          }
        }

        // 2 & 3. Handle Likes and Comments Table
        // Triggers in the DB will update counts on the posts table, 
        // which will fire an UPDATE event on the posts table handled above.
        // We only check for currentUser specific states if needed, but fetchInitialFeed handles that.
        if (table === 'likes' || table === 'post_likes') {
          const postId = newRecord?.post_id || oldRecord?.post_id;
          if (postId) {
            get().syncPostLikes(postId);
          }
        }
      },

      preloadMedia: (post) => {
        const { cachedMedia, networkQuality } = get();
        if (networkQuality === "slow") return;

        const mediaUrl = post.media_url || (post.media?.[0]?.url);
        if (!mediaUrl || cachedMedia[post.id]) return;

        // Smart Preload: Images or Video fragments
        const link = document.createElement("link");
        link.rel = "preload";
        link.as = post.media_type === "video" ? "video" : "image";
        link.href = mediaUrl;
        document.head.appendChild(link);

        set((state) => ({
          cachedMedia: { ...state.cachedMedia, [post.id]: mediaUrl },
          preloadQueue: [...state.preloadQueue, post.id].slice(-5) // Keep last 5
        }));
      },

      releaseMedia: (postId) => set((state) => {
        const newCache = { ...state.cachedMedia };
        delete newCache[postId];
        return { cachedMedia: newCache };
      }),

      setActiveMediaId: (id) => set({ activeMediaId: id }),

      hydrateCache: (posts) => {
        const map = { ...get().hydratedPostMap };
        posts.forEach(p => map[p.id] = p);
        set({ hydratedPostMap: map });
      },

      optimizeFeedPerformance: () => {
        // Detect network quality
        const conn = (navigator as any).connection;
        if (conn) {
          const q = conn.effectiveType === "4g" ? "fast" : "slow";
          set({ networkQuality: q });
        }
      },

      fetchInitialFeed: async (pageSize = 10, ignoreCache = false) => {
        const { fetchMoreFeed, posts, lastCacheAt } = get();
        
        // Cache Restore Flow: If we have posts and it's recent, don't clear and show UI immediately
        const isFresh = lastCacheAt && (Date.now() - lastCacheAt < 1000 * 60 * 5); // 5 mins
        
        if (!ignoreCache && posts.length > 0 && isFresh) {
          // Already have fresh posts in state (restored by persist)
          return;
        }

        // Reset state for new feed load
        set({ cursor: null, hasMore: true, error: null });
        await fetchMoreFeed(pageSize);
      },

      fetchMoreFeed: async (pageSize = 10) => {
        const { cursor, hasMore, isFetchingMore, isLoading, posts, hydrateFeed, dedupeFeed } = get();
        
        // Safety check: prevent double fetches or fetching when no more data
        if (!hasMore || isFetchingMore || (posts.length === 0 && isLoading)) return;
        
        const isInitial = posts.length === 0;
        if (isInitial) set({ isLoading: true });
        else set({ isFetchingMore: true });
        
        try {
          // Step 1 & 2: Cursor-based query
          let query = (supabase
            .from('posts') as any)
            .select(`
              *,
              profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
            `)
            .eq('is_repost', false)
            .order('created_at', { ascending: false })
            .limit(pageSize);

          if (cursor) {
            query = query.lt('created_at', cursor);
          }

          const { data: rawPosts, error } = await (query as any);
          if (error) throw error;

          if (!rawPosts || rawPosts.length === 0) {
            set({ hasMore: false });
            return;
          }

          // Step 5: Hydrate metadata
          const hydratedPosts = (await hydrateFeed(rawPosts)).filter((p: any) => p.profiles);
          
          // Step 4: Deduplicate
          const dedupedPosts = dedupeFeed([...posts, ...hydratedPosts]);
          
          const lastPost = rawPosts[rawPosts.length - 1];
          
          set({
            posts: dedupedPosts,
            cursor: lastPost.created_at,
            hasMore: rawPosts.length === pageSize,
            lastCacheAt: Date.now()
          });
        } catch (err: any) {
          console.error('Error fetching more feed:', err);
          set({ error: err.message || 'Failed to fetch more posts' });
        } finally {
          set({ isLoading: false, isFetchingMore: false });
        }
      },

      hydrateFeed: async (posts) => {
        const { data: { user } } = await supabase.auth.getUser();
        if (posts.length === 0) return posts;

        const postIds = posts.map(p => p.id);
        const originalPostIds = posts.filter(p => p.is_repost && p.original_post_id).map(p => p.original_post_id);
        const allIds = Array.from(new Set([...postIds, ...originalPostIds]));

        // Optimized single-pass hydration (Step 5)
        const [likesRes, postLikesRes, repostsRes, savesRes, originalPostsRes] = await Promise.all([
          user ? (supabase as any).from('likes').select('post_id').eq('user_id', user.id).in('post_id', allIds) : Promise.resolve({ data: [] }),
          user ? (supabase as any).from('post_likes').select('post_id').eq('user_id', user.id).in('post_id', allIds) : Promise.resolve({ data: [] }),
          user ? supabase.from('posts').select('original_post_id').eq('user_id', user.id).eq('is_repost', true).in('original_post_id', allIds) : Promise.resolve({ data: [] }),
          user ? supabase.from('saved_posts').select('post_id, collection_id').eq('user_id', user.id).in('post_id', allIds) : Promise.resolve({ data: [] }),
          originalPostIds.length > 0 ? (supabase as any).from('posts').select(`
            *,
            profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
          `).in('id', originalPostIds) : Promise.resolve({ data: [] })
        ]);

        const combinedLikes = [
          ...((likesRes?.data as any[]) || []),
          ...((postLikesRes?.data as any[]) || [])
        ];
        const userLikedPostIds = new Set(combinedLikes.map((l: any) => l.post_id));
        const userRepostedPostIds = new Set((repostsRes.data as any[])?.map((r: any) => r.original_post_id) || []);
        const userSavesMap = new Map<string, string | null>((savesRes.data as any[])?.map((s: any) => [s.post_id, s.collection_id]) || []);
        const originalPostsMap = new Map<string, any>((originalPostsRes.data as any[])?.map((op: any) => [op.id, op]) || []);

        // Step 6: Fetch attached listings if present
        const postsWithListings = posts.map(p => p.is_repost ? (p.original_post || p) : p);
        const listingRequests = postsWithListings
          .filter(p => p.attached_listing_id && p.attached_listing_type)
          .map(p => ({ id: p.attached_listing_id, type: p.attached_listing_type }));

        const listingDataMap = new Map<string, any>();
        if (listingRequests.length > 0) {
          const serviceIds = listingRequests.filter(r => r.type === 'service').map(r => r.id);
          const productIds = listingRequests.filter(r => r.type === 'product').map(r => r.id);
          const trainingIds = listingRequests.filter(r => r.type === 'training').map(r => r.id);

          const [services, products, training] = await Promise.all([
            serviceIds.length > 0 ? supabase.from('services').select('*').in('id', serviceIds).eq('is_active', true) : Promise.resolve({ data: [] }),
            productIds.length > 0 ? supabase.from('products').select('*').in('id', productIds).eq('is_active', true) : Promise.resolve({ data: [] }),
            trainingIds.length > 0 ? supabase.from('training').select('*').in('id', trainingIds).eq('is_active', true) : Promise.resolve({ data: [] })
          ]);

          services.data?.forEach(s => listingDataMap.set(`service:${s.id}`, s));
          products.data?.forEach(p => listingDataMap.set(`product:${p.id}`, p));
          training.data?.forEach(t => listingDataMap.set(`training:${t.id}`, t));
        }

        return posts.map(post => {
          const oid = post.is_repost ? post.original_post_id : post.id;
          const isSaved = userSavesMap.has(post.id) || (oid ? userSavesMap.has(oid) : false);
          const collectionId = userSavesMap.get(post.id) ?? (oid ? userSavesMap.get(oid) : null);

          const shapeProfile = (profile: any) => {
              if (!profile) return null;
              const show_rating = profile.is_hustler;
              return { ...profile, show_rating };
          };

          if (post.profiles) post.profiles = shapeProfile(post.profiles);
          
          let original_post = oid ? originalPostsMap.get(oid) : null;
          if (original_post && original_post.profiles) {
            original_post.profiles = shapeProfile(original_post.profiles);
          }

          // Attach listing data to post or original post
          const targetForListing = post.is_repost ? original_post : post;
          if (targetForListing?.attached_listing_id) {
            const key = `${targetForListing.attached_listing_type}:${targetForListing.attached_listing_id}`;
            const listingData = listingDataMap.get(key);
            if (post.is_repost && original_post) {
                original_post.attached_listing_data = listingData;
            } else {
                post.attached_listing_data = listingData;
            }
          }

          return {
            ...post,
            original_post,
            userHasLiked: userLikedPostIds.has(post.id) || (oid && userLikedPostIds.has(oid)),
            userHasReposted: userRepostedPostIds.has(post.id) || (oid && userRepostedPostIds.has(oid)) || (user && post.is_repost && post.user_id === user.id),
            userHasSaved: isSaved,
            collection_id: collectionId
          };
        });
      },

      dedupeFeed: (posts) => {
        const seen = new Set<string>();
        return posts.filter(post => {
          if (seen.has(post.id)) return false;
          seen.add(post.id);
          return true;
        });
      },

      copyPostLink: async (postId) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          const postUrl = `${window.location.origin}/post/${postId}`;
          await navigator.clipboard.writeText(postUrl);

          // Optimistic update
          set((state) => {
            const currentCount = state.shareCounts[postId] ?? 0;
            const newCount = currentCount + 1;
            return {
              shareCounts: { ...state.shareCounts, [postId]: newCount },
              copiedLinks: { ...state.copiedLinks, [postId]: true },
              posts: state.posts.map(p => p.id === postId ? { ...p, shares_count: newCount } : p)
            };
          });

          // Track in DB
          const { error } = await supabase.from('post_shares').insert({
            post_id: postId,
            user_id: user.id,
            share_type: 'copy_link'
          });

          if (error) throw error;
          
          // Update post shares_count asynchronously/optimistically on server if possible?
          // For now we just rely on the insert trigger if we had one, but we manually increment here
          await (supabase as any).rpc('increment_shares_count', { post_id_param: postId });

        } catch (err) {
          console.error('Error copying post link:', err);
        }
      },

      sharePostToUser: async (postId, targetUserId) => {
        try {
          const { data: { user } } = await supabase.auth.getUser();
          if (!user) return;

          // Validate recipient exists
          const { data: recipient, error: recipientError } = await supabase
            .from('profiles')
            .select('id')
            .eq('id', targetUserId)
            .single();
          
          if (recipientError || !recipient) {
            console.error('Recipient does not exist');
            return;
          }

          // Track in DB
          const { error: shareError } = await supabase.from('post_shares').insert({
            post_id: postId,
            user_id: user.id,
            share_type: 'internal_message',
            target_user_id: targetUserId
          });

          if (shareError) throw shareError;

          // Fetch post for preview metadata
          const { data: postData } = await supabase
            .from('posts')
            .select('caption, media_url')
            .eq('id', postId)
            .single();

          const post_preview = postData?.caption || 'Check out this post';
          const media_thumbnail = postData?.media_url || '';

          // 3. Send message via chat system
          // Use the robust useChatStore getOrCreateConversation
          const conversationId = await useChatStore.getState().getOrCreateConversation(user.id, targetUserId);

          // Send with the required metadata format
          await useChatStore.getState().sendMessage(conversationId, {
            content: `Shared a post`,
            message_type: 'shared_post',
            shared_post_id: postId,
            metadata: {
              post_id: postId,
              post_preview: post_preview,
              media_thumbnail: media_thumbnail
            }
          });

          // Optimistic update share counts
          set((state) => {
            const currentCount = state.shareCounts[postId] ?? 0;
            const newCount = currentCount + 1;
            return {
              shareCounts: { ...state.shareCounts, [postId]: newCount },
              posts: state.posts.map(p => p.id === postId ? { ...p, shares_count: newCount } : p)
            };
          });
          
          await (supabase as any).rpc('increment_shares_count', { post_id_param: postId });

        } catch (err) {
          console.error('Error sharing post to user:', err);
        }
      },

      syncShareCounts: () => set((state) => ({
        posts: state.posts.map(post => ({
          ...post,
          shares_count: state.shareCounts[post.id] ?? post.shares_count ?? 0
        }))
      })),

      reset: () => set({
        posts: [],
        isLoading: false,
        error: null,
        hasMore: true,
        cursor: null,
        isFetchingMore: false,
        hydratedPostMap: {},
        lastCacheAt: null,
        commentsMap: {},
        loadingComments: {},
        repostMap: {},
        repostCounts: {},
        activeReposts: [],
        savedPosts: [],
        savedPostIds: {},
        collections: [],
        activeCollectionId: null,
        isLoadingSaves: false,
        activeSubscriptions: [],
        lastRealtimeEvent: null
      })
    }),
    {
      name: 'hustle-feed-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
        posts: state.posts.slice(0, 20), // Only cache top 20 posts for quick restore
        cursor: state.posts.length > 0 ? state.posts[Math.min(19, state.posts.length - 1)].created_at : null,
        hasMore: state.hasMore,
        lastCacheAt: state.lastCacheAt,
        repostMap: state.repostMap,
        repostCounts: state.repostCounts,
        savedPostIds: state.savedPostIds
      }),
    }
  )
);

