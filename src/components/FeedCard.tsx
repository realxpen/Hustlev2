import { motion, AnimatePresence } from "motion/react";
import {
  Heart,
  MessageSquare,
  Share2,
  Bookmark,
  Star,
  MapPin,
  CheckCircle2,
  Repeat2,
  Music,
  ShoppingBag,
  ArrowRight,
  X,
  Plus,
  Send,
  Link,
  Link2,
  MessageCircle,
  HeartCrack,
  Calendar,
  UserPlus,
  UserCheck,
  ShieldCheck,
  TrendingUp,
  Gift,
  Flag,
  Volume2,
  VolumeX,
  EyeOff
} from "lucide-react";
import React, { useState, useRef, useEffect } from "react";
import DetailScreen from "./DetailScreen";
import FullscreenMediaViewer from "./FullscreenMediaViewer";
import ReportSheet from "./ReportSheet";
import { Maximize2 } from "lucide-react";
import { DetailData } from "../types";
import { useFeedStore } from "../features/feed/stores/useFeedStore";
import { usePostActions } from "../features/feed/hooks/usePostActions";
import { useAuthStore } from "../features/auth/stores/useAuthStore";
import { FollowButton } from './social/FollowButton';
import { useSocialGraphStore } from "../features/social/stores/useSocialGraphStore";
import { supabase } from "../lib/supabase";
import { convertCurrency, formatCurrency, Currency } from "../lib/currency";
import { useAppOrchestrator } from "../stores/useAppOrchestrator";

export interface EmbedCTA {
  type: "book" | "buy" | "apply" | "ad";
  label: string;
  price?: number;
}

export interface FeedContent {
  type: "video" | "image" | "carousel" | "text" | "audio";
  mediaUrls?: string[];
  mediaArray?: any[];
  thumbnail?: string;
  caption: string;
  hasMusic?: boolean;
  musicTrack?: string;
  musicData?: any;
}

export interface FeedCardProps {
  id: string | number;
  onProfileClick?: () => void;
  onBook?: () => void;
  onSkillTagClick?: (skill: string) => void;
  creator: {
    id: number | string;
    name: string;
    avatar: string;
    category: string;
    location: string;
    rating: number;
    jobs: number;
    verified: boolean;
    active: boolean;
    is_hustler?: boolean;
  };
  content: FeedContent;
  repost?: {
    by: string;
    by_id?: string;
    thought?: string;
  };
  embedCTA?: EmbedCTA | EmbedCTA[];
  detailData?: DetailData | DetailData[];
  recommendationReason?: string;
  isAd?: boolean;
}

let globalMuted = true;

export default function FeedCard({
  id,
  creator,
  content,
  repost,
  embedCTA,
  detailData,
  isAd,
  onProfileClick,
  onBook,
  onSkillTagClick,
  recommendationReason,
}: FeedCardProps) {
  const [liked, setLiked] = useState(false);
  const [isMuted, setIsMuted] = useState(globalMuted);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const [showHeartBreak, setShowHeartBreak] = useState(false);

  const [showFullViewer, setShowFullViewer] = useState(false);
  const pinchStartDistRef = useRef<number | null>(null);

  const [saved, setSaved] = useState(false);
  const [showSaveCollections, setShowSaveCollections] = useState(false);

  const [reposted, setReposted] = useState(false);
  const [showRepostSheet, setShowRepostSheet] = useState(false);
  const [repostThought, setRepostThought] = useState("");

  const [showComments, setShowComments] = useState(false);
  const [showRepostsDrawer, setShowRepostsDrawer] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentsList, setCommentsList] = useState<any[]>([]);
  const [replyingTo, setReplyingTo] = useState<{
    id: number;
    user: string;
  } | null>(null);
  const [activeDrawerTab, setActiveDrawerTab] = useState<
    "comments" | "reposts"
  >("comments");
  const [dbCommentsList, setDbCommentsList] = useState<any[]>([]);
  const [dbRepostsList, setDbRepostsList] = useState<any[]>([]);
  const [dbRepostRepliesMap, setDbRepostRepliesMap] = useState<
    Record<string, any[]>
  >({});
  const [isDrawerLoading, setIsDrawerLoading] = useState(false);
  const [drawerReloadKey, setDrawerReloadKey] = useState(0);
  const [editingRepostId, setEditingRepostId] = useState<string | null>(null);
  const [editingRepostComment, setEditingRepostComment] = useState("");

  const [showSummarySheet, setShowSummarySheet] = useState(false);
  const [selectedDetail, setSelectedDetail] = useState<DetailData | null>(null);
  const [showImmersiveDetail, setShowImmersiveDetail] = useState(false);
  const [showShareSheet, setShowShareSheet] = useState(false);
  const [showReportSheet, setShowReportSheet] = useState(false);
  const [showCtaFlow, setShowCtaFlow] = useState(false);
  // Normalize details and CTAs into arrays
  const details = Array.isArray(detailData)
    ? detailData
    : detailData
      ? [detailData]
      : [];
  const ctas = Array.isArray(embedCTA) ? embedCTA : embedCTA ? [embedCTA] : [];

  const [selectedCta, setSelectedCta] = useState<EmbedCTA | null>(
    ctas[0] || null,
  );

  // Stats for optimistic UI
  const [stats, setStats] = useState({
    likes: 0,
    comments: 0,
    reposts: 0,
  });
  const [newCollectionName, setNewCollectionName] = useState("");
  const [isCreatingCollection, setIsCreatingCollection] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [mediaIndex, setMediaIndex] = useState(0);
  const [isHidden, setIsHidden] = useState(false);
  const [hiddenReason, setHiddenReason] = useState<"skipped" | "reported" | null>(null);

  // Loading States
  const [isLiking, setIsLiking] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isFollowingState, setIsFollowingState] = useState(false);

  // Internal Share State
  const [shareStep, setShareStep] = useState<"options" | "users">("options");
  const [usersToShare, setUsersToShare] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [sharingToUserId, setSharingToUserId] = useState<string | null>(null);

  const postFromStore = useFeedStore((state) =>
    typeof id === "string" ? state.posts.find((p) => p.id === id) : null,
  );

  const isActiveSaved = postFromStore ? !!postFromStore.userHasSaved : saved;

  const collections = useFeedStore((state) => state.collections);
  const {
    toggleLike: toggleDbLike,
    toggleRepost: toggleDbRepost,
    addComment: addDbComment,
    toggleSave: toggleDbSave,
    addPostToCollection,
    createCollection: createDbCollection,
    copyPostLink: copyDbPostLink,
    sharePostToUser: shareDbPostToUser,
  } = usePostActions();
  const { user, profile } = useAuthStore();
  const store = useFeedStore();
  const cardRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  const { toggleFollow, iFollow } = useSocialGraphStore();
  const targetUserId = creator.id.toString();
  const isFollowing = user ? iFollow(user.id, targetUserId) : false;

  const handleFollowClick = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) return;
    setIsFollowingState(true);
    try {
      await toggleFollow(targetUserId);
      useAppOrchestrator.getState().emitEvent({
        event_type: 'follow_created',
        actor_id: user.id,
        target_id: targetUserId,
        entity_id: targetUserId,
        entity_type: 'profile',
        payload: { followed: !isFollowing }
      });
    } catch (err) {
      console.error("Error toggling follow:", err);
    } finally {
      setIsFollowingState(false);
    }
  };

  // Media Performance: Intersection Observer
  useEffect(() => {
    if (!cardRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
        if (entry.isIntersecting && typeof id === "string") {
          store.setActiveMediaId(id);
          // Auto-optimize performance on dynamic quality shifts
          store.optimizeFeedPerformance();
        }
      },
      { threshold: 0.6 } // 60% visibility triggers active state
    );

    observer.observe(cardRef.current);
    return () => observer.disconnect();
  }, [id, store]);

  // Video playback control
  useEffect(() => {
    if (!videoRef.current) return;
    
    const isActuallyActive = store.activeMediaId === id;
    
    if (isActuallyActive && isVisible) {
      videoRef.current.play().catch(() => {});
    } else {
      videoRef.current.pause();
    }
  }, [isVisible, store.activeMediaId, id]);

  // Preloading neighbors logic (done in Hub or here)
  useEffect(() => {
    if (isVisible && typeof id === "string") {
      const currentIndex = store.posts.findIndex(p => p.id === id);
      if (currentIndex !== -1) {
        // Preload next post
        const nextPost = store.posts[currentIndex + 1];
        if (nextPost) store.preloadMedia(nextPost);
      }
    }
  }, [isVisible, id, store.posts]);

  // Fetch users when step changes to users
  useEffect(() => {
    if (shareStep === "users" && user) {
      const fetchInitialUsers = async () => {
        setIsSearching(true);
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .neq("id", user.id)
          .limit(15);
        if (data) setUsersToShare(data);
        setIsSearching(false);
      };
      fetchInitialUsers();
    }
  }, [shareStep, user]);

  // Search users effect
  useEffect(() => {
    if (shareStep === "users" && searchQuery.trim().length > 0) {
      const delayDebounce = setTimeout(async () => {
        setIsSearching(true);
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .neq("id", user?.id)
          .or(
            `username.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`,
          )
          .limit(15);
        if (data) setUsersToShare(data);
        setIsSearching(false);
      }, 500);
      return () => clearTimeout(delayDebounce);
    } else if (
      shareStep === "users" &&
      searchQuery.trim().length === 0 &&
      user
    ) {
      // Reset to defaults if empty
      const fetchInitialUsers = async () => {
        const { data } = await supabase
          .from("profiles")
          .select("id, full_name, username, avatar_url")
          .neq("id", user.id)
          .limit(15);
        if (data) setUsersToShare(data);
      };
      fetchInitialUsers();
    }
  }, [searchQuery, shareStep, user]);

  // Helper for actual sharing
  const handleInternalShare = async (targetUserId: string) => {
    if (typeof id !== "string") return;
    setSharingToUserId(targetUserId);
    await shareDbPostToUser(id, targetUserId);
    setSharingToUserId(null);
    setShowShareSheet(false);
    setShareStep("options");
  };

  const commentsForThisPost =
    typeof id === "string" ? store.commentsMap[id] || [] : [];
  const isCommentsLoading =
    typeof id === "string" ? !!store.loadingComments[id] : false;
  const isActiveLiked = postFromStore ? !!postFromStore.userHasLiked : liked;
  const activeLikesCount = postFromStore
    ? (postFromStore.likes_count ?? 0)
    : detailData && !Array.isArray(detailData) && detailData.socialStats
      ? detailData.socialStats.likes
      : stats.likes;

  const isActiveReposted = postFromStore
    ? !!postFromStore.userHasReposted
    : reposted;
  const activeRepostsCount = postFromStore
    ? (postFromStore.reposts_count ?? 0)
    : stats.reposts;

  const activeCommentsCount = postFromStore
    ? (postFromStore.comments_count ?? 0)
    : stats.comments;

  const commentInputRef = useRef<HTMLInputElement>(null);

  // Helper for human-readable time format
  const formatTime = (isoString?: string) => {
    if (!isoString) return "now";
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return "now";
      if (diffMins < 60) return `${diffMins}m`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h`;
      const diffDays = Math.floor(diffHours / 24);
      return `${diffDays}d`;
    } catch {
      return "now";
    }
  };

  const getEditingRemainingText = (createdAtStr: string) => {
    const createdTime = new Date(createdAtStr).getTime();
    const elapsedTime = Date.now() - createdTime;
    const oneHour = 3600000;
    if (elapsedTime >= oneHour) return null;
    const remainingMins = Math.ceil((oneHour - elapsedTime) / 60000);
    return `${remainingMins}m left`;
  };

  useEffect(() => {
    if (typeof id !== "string") return;
    let isMounted = true;

    const loadRepostsPreview = async () => {
      try {
        if (typeof id === "string") {
          store.fetchComments(id);

          const { data: rpsts } = await (
            supabase.from("posts").select(`
              id,
              repost_comment,
              created_at,
              user_id,
              profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
            `) as any
          )
            .eq("original_post_id", id)
            .eq("is_repost", true)
            .order("created_at", { ascending: false });

          if (rpsts && isMounted) {
            const shaped = rpsts.map((rp: any) => {
              if (!rp.profiles) return rp;
              const profile = rp.profiles;
              const show_rating = profile.is_hustler;
              return { ...rp, profiles: { ...profile, show_rating } };
            });
            setDbRepostsList(shaped || []);
          }
        }
      } catch (err) {
        console.error("Error loading reposts preview:", err);
      }
    };

    loadRepostsPreview();

    // Subscribe to new reposts
    const repostsChannel = supabase
      .channel(`public:reposts_preview:${id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "posts",
          filter: `original_post_id=eq.${id}`,
        },
        async (payload) => {
          if (payload.new.is_repost) {
            const { data: fullRp } = await (
              supabase.from("posts").select(`
               id,
               repost_comment,
               created_at,
               user_id,
               profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
             `) as any
            )
              .eq("id", payload.new.id)
              .single();

            if (fullRp && isMounted) {
              setDbRepostsList((prev) => [
                fullRp,
                ...prev.filter((x) => x.id !== fullRp.id),
              ]);
            }
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(repostsChannel);
    };
  }, [id]);

  useEffect(() => {
    if ((!showComments && !showRepostsDrawer) || typeof id !== "string") return;

    let isMounted = true;
    const targetPostIdForDrawer =
      postFromStore?.is_repost && postFromStore?.original_post_id
        ? postFromStore.original_post_id
        : id;

    const loadDrawerData = async () => {
      setIsDrawerLoading(true);
      try {
        const buildTree = (list: any[]) => {
          const map: Record<string, any> = {};
          const roots: any[] = [];
          list.forEach((item) => {
            map[item.id] = { ...item, replies: [] };
          });
          list.forEach((item) => {
            if (item.parent_comment_id && map[item.parent_comment_id]) {
              map[item.parent_comment_id].replies.push(map[item.id]);
            } else {
              roots.push(map[item.id]);
            }
          });
          return roots;
        };

        // 1. Fetch real comments for the main post
        const { data: coms, error: comsErr } = await supabase
          .from("comments")
          .select(
            `
            id,
            post_id,
            parent_comment_id,
            content,
            created_at,
            user_id,
            profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
          `,
          )
          .eq("post_id", targetPostIdForDrawer)
          .order("created_at", { ascending: true });

        if (comsErr) {
          console.error("Error loading DB comments:", comsErr);
        } else if (isMounted) {
          setDbCommentsList(buildTree(coms || []));
        }

        // 2. Fetch replies for ALL reposts of this post
        const { data: allRepostsIds } = await (
          supabase.from("posts").select("id") as any
        )
          .eq("original_post_id", targetPostIdForDrawer)
          .eq("is_repost", true);

        const repostIds = allRepostsIds?.map((r) => r.id) || [];

        if (repostIds.length > 0) {
          const { data: replies, error: repliesErr } = await supabase
            .from("comments")
            .select(
              `
              id,
              post_id,
              parent_comment_id,
              content,
              created_at,
              user_id,
              profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
            `,
            )
            .in("post_id", repostIds)
            .order("created_at", { ascending: true });

          if (repliesErr) {
            console.error("Error loading DB repost replies:", repliesErr);
          } else if (isMounted && replies) {
            const grouped: Record<string, any[]> = {};
            replies.forEach((rep) => {
              if (!grouped[rep.post_id]) {
                grouped[rep.post_id] = [];
              }
              grouped[rep.post_id].push(rep);
            });

            const groupedTrees: Record<string, any[]> = {};
            Object.keys(grouped).forEach((rpId) => {
              groupedTrees[rpId] = buildTree(grouped[rpId]);
            });
            setDbRepostRepliesMap(groupedTrees);
          }
        }
      } catch (err) {
        console.error("Failed to load DB drawer data:", err);
      } finally {
        if (isMounted) {
          setIsDrawerLoading(false);
        }
      }
    };

    loadDrawerData();

    // Subscribe to new comments for real-time responsiveness
    // We subscribe to all comments where post_id matches target OR is in repostIds list
    const commentsChannel = supabase
      .channel(`public:comments_feed_card_drawer:${targetPostIdForDrawer}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "comments",
        },
        async (payload) => {
          const { data: newC } = await supabase
            .from("comments")
            .select(
              `
            id,
            post_id,
            parent_comment_id,
            content,
            created_at,
            user_id,
            profiles!comments_user_id_fkey(id, full_name, username, avatar_url)
          `,
            )
            .eq("id", payload.new.id)
            .single();

          if (newC && isMounted) {
            setDrawerReloadKey((prev) => prev + 1);
            // Update comments stats
            if (newC.post_id === targetPostIdForDrawer) {
              setStats((prev) => ({ ...prev, comments: prev.comments + 1 }));
            }
          }
        },
      )
      .subscribe();

    return () => {
      isMounted = false;
      supabase.removeChannel(commentsChannel);
    };
  }, [
    showComments,
    showRepostsDrawer,
    id,
    drawerReloadKey,
    postFromStore?.is_repost,
    postFromStore?.original_post_id,
  ]);

  const handleCtaClick = (item?: EmbedCTA) => {
    if (item) setSelectedCta(item);

    // If it's a quick book from a props-provided action, prioritize that
    if (item?.type === "book" && onBook) {
      onBook();
      return;
    }

    if (details.length > 0) {
      setShowSummarySheet(true);
    } else {
      setShowCtaFlow(true);
    }
  };

  const openImmersiveDetail = (data: DetailData) => {
    setSelectedDetail(data);
    setShowImmersiveDetail(true);
    setShowSummarySheet(false);
  };

  const handleDoubleTap = async () => {
    if (typeof id === "string") {
      const isCurrentlyLiked = postFromStore
        ? !!postFromStore.userHasLiked
        : false;
      if (!isCurrentlyLiked) {
        setShowHeartBurst(true);
        setTimeout(() => setShowHeartBurst(false), 1000);
      } else {
        setShowHeartBreak(true);
        setTimeout(() => setShowHeartBreak(false), 1000);
      }
      setIsLiking(true);
      await toggleDbLike(id as string, isCurrentlyLiked);
      setIsLiking(false);
      
      if (!isCurrentlyLiked) {
        useAppOrchestrator.getState().emitEvent({
          event_type: 'post_liked',
          actor_id: user?.id || 'anonymous',
          entity_id: id as string,
          entity_type: 'post',
          payload: { post_id: id }
        });
      }
    } else {
      if (!liked) {
        setLiked(true);
        setStats((prev) => ({ ...prev, likes: prev.likes + 1 }));
        setShowHeartBurst(true);
        setTimeout(() => setShowHeartBurst(false), 1000);
      } else {
        setLiked(false);
        setStats((prev) => ({ ...prev, likes: prev.likes - 1 }));
        setShowHeartBreak(true);
        setTimeout(() => setShowHeartBreak(false), 1000);
      }
    }
  };

  const toggleLike = (comments: any[], id: number): any[] => {
    return comments.map((c) => {
      if (c.id === id) {
        return { ...c, liked: !c.liked };
      }
      if (c.replies) {
        return { ...c, replies: toggleLike(c.replies, id) };
      }
      return c;
    });
  };

  const toggleLikeComment = (id: number) => {
    setCommentsList((list) => toggleLike(list, id));
  };

  const addReply = (comments: any[], targetId: number, reply: any): any[] => {
    return comments.map((c) => {
      if (c.id === targetId) {
        return { ...c, replies: [...(c.replies || []), reply] };
      }
      if (c.replies) {
        return { ...c, replies: addReply(c.replies, targetId, reply) };
      }
      return c;
    });
  };

  const handlePostComment = async () => {
    if (!newComment.trim()) return;

    if (typeof id === "string") {
      let targetPostId =
        postFromStore?.is_repost && postFromStore?.original_post_id
          ? postFromStore.original_post_id
          : id;
      const isRepostReply = replyingTo && (replyingTo as any).isRepost;

      if (isRepostReply && (replyingTo as any).repost_id) {
        targetPostId = (replyingTo as any).repost_id;
      }

      // If we are replying to a repost thought itself, parentId should be null (since the thought is in posts table, not comments)
      // Otherwise if we are replying to a comment inside the thread, we use its id.
      const parentId =
        replyingTo &&
        (!isRepostReply ||
          (replyingTo as any).id !== (replyingTo as any).repost_id)
          ? (replyingTo as any).id
          : null;

      await addDbComment(targetPostId, newComment, parentId);
    } else {
      const commentData = {
        id: Date.now(),
        user: "you",
        text: newComment,
        time: "Just now",
        liked: false,
        replies: [],
      };

      if (replyingTo) {
        if (replyingTo.id === -1) {
          // Repost reply
          setCommentsList([
            { ...commentData, isRepostReply: true },
            ...commentsList,
          ]);
        } else {
          setCommentsList((list) => addReply(list, replyingTo.id, commentData));
        }
      } else {
        setCommentsList([commentData, ...commentsList]);
      }

      setStats((prev) => ({ ...prev, comments: prev.comments + 1 }));
    }

    setNewComment("");
    setReplyingTo(null);
  };

  const handleSaveToggle = async () => {
    setIsSaving(true);
    if (typeof id === "string") {
      if (!isActiveSaved) {
        setShowSaveCollections(true);
        // Initially save to general if not already saved
        await toggleDbSave(id);
        store.fetchCollections();
      } else {
        await toggleDbSave(id);
      }
    } else {
      if (!saved) {
        setShowSaveCollections(true);
      } else {
        setSaved(false);
      }
    }
    setIsSaving(false);
  };

  const handleRepostSubmit = async () => {
    if (typeof id === "string") {
      setShowRepostSheet(false);
      await toggleDbRepost(id, repostThought.trim() || null);
      setRepostThought("");
      setDrawerReloadKey((prev) => prev + 1);
    } else {
      setReposted(true);
      setStats((prev) => ({ ...prev, reposts: prev.reposts + 1 }));
      setShowRepostSheet(false);
    }
  };

  const handleEditRepost = async (repostId: string) => {
    if (!editingRepostComment.trim()) return;
    try {
      const { error } = await supabase
        .from("posts")
        .update({ repost_comment: editingRepostComment.trim() } as any)
        .eq("id", repostId);

      if (error) throw error;

      setEditingRepostId(null);
      setEditingRepostComment("");
      setDrawerReloadKey((prev) => prev + 1);
    } catch (err) {
      console.error("Error editing repost thought:", err);
    }
  };

  const [showQuickActions, setShowQuickActions] = useState(false);
  const longPressTimer = useRef<any>(null);

  const handlePointerDown = () => {
    longPressTimer.current = setTimeout(() => {
      setShowQuickActions(true);
    }, 500);
  };

  const handlePointerUp = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  return (
    <div
      ref={cardRef}
      className="relative w-full h-full bg-[#050505] overflow-hidden text-white"
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {/* Hidden / Skip State Overlay */}
      <AnimatePresence>
        {isHidden && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 pointer-events-auto"
          >
            <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
               <EyeOff size={32} className="text-white/40" />
            </div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter mb-2 text-white drop-shadow-md">
              {hiddenReason === "reported" ? "Post Reported" : "Post Hidden"}
            </h2>
            <p className="text-white/50 text-center text-[13px] font-bold tracking-wide leading-relaxed mb-8 max-w-[70%]">
              {hiddenReason === "reported" 
                 ? "Thanks for helping keep our community safe." 
                 : "We'll show you fewer posts like this."}
            </p>
            <button 
               onClick={(e) => { 
                 e.stopPropagation(); 
                 setIsHidden(false); 
                 setHiddenReason(null); 
               }}
               className="h-12 px-8 rounded-xl border border-white/20 bg-white/5 hover:bg-white/10 active:scale-95 transition-all text-[11px] font-black uppercase tracking-widest text-white shadow-lg flex items-center justify-center"
            >
               Undo Action
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Content Layer (Mixed Media Placeholder) */}
      <div
        className="absolute inset-0 z-0 bg-black"
        onDoubleClick={handleDoubleTap}
      >
        {content.type === "text" ? (
          <div className="w-full h-full flex items-center justify-center p-8 bg-gradient-to-b from-zinc-900 to-black">
            <p className="text-2xl font-display font-medium text-center leading-snug">
              {content.caption}
            </p>
          </div>
        ) : (
          <div
            onTouchStart={(e) => {
              if (e.touches.length === 2) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                pinchStartDistRef.current = dist;
              }
            }}
            onTouchMove={(e) => {
              if (e.touches.length === 2 && pinchStartDistRef.current !== null) {
                const t1 = e.touches[0];
                const t2 = e.touches[1];
                const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
                const scaleAmount = dist / pinchStartDistRef.current;
                if (scaleAmount > 1.15) {
                  setShowFullViewer(true);
                  pinchStartDistRef.current = null;
                }
              }
            }}
            onTouchEnd={() => {
              pinchStartDistRef.current = null;
            }}
            className={`w-full h-full flex flex-col bg-gradient-to-br ${(typeof creator.id === "number" ? creator.id % 2 === 0 : creator.id.length % 2 === 0) ? "from-slate-900 to-black" : "from-zinc-950 to-black"} items-center justify-center relative`}
          >
            {/* Zoom/Full Mode Trigger Button */}
            {content.type !== "audio" && (
              <button
                onClick={() => setShowFullViewer(true)}
                className="absolute top-4 right-4 z-20 w-8 h-8 rounded-full bg-black/60 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/70 hover:text-white hover:scale-110 active:scale-95 transition-all shadow-md cursor-pointer pointer-events-auto"
                title="Open Full Mode"
              >
                <Maximize2 size={13} />
              </button>
            )}

            {/* Carousel indicators logic */}
            {content.mediaUrls && content.mediaUrls.length > 1 && (
              <div className="absolute top-4 left-0 right-0 flex justify-center gap-2 z-20">
                {content.mediaUrls.map((_: any, i: number) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${i === mediaIndex ? "bg-white" : "bg-white/30"}`}
                  />
                ))}
              </div>
            )}

            <div className="w-1/2 h-1/2 bg-white/5 blur-3xl rounded-full animate-pulse absolute" />

            {content.type === "audio" && (
              <div className="w-32 h-32 rounded-full border-4 border-white/10 flex items-center justify-center animate-[spin_4s_linear_infinite]">
                <Music size={40} className="text-white/40" />
              </div>
            )}

            {/* Display multiple media, or fallback to single thumbnail */}
            {(() => {
              const currentMedia =
                content.mediaArray && content.mediaArray.length > 0
                  ? content.mediaArray[mediaIndex]
                  : { type: content.type, url: content.thumbnail };

              if (!currentMedia.url) return null;

              if (currentMedia.type === "image") {
                return (
                  <img
                    src={currentMedia.url}
                    alt={content.caption || "Post media"}
                    className="w-full h-full object-cover absolute inset-0"
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onClick={(e) => {
                      if (content.mediaArray?.length > 1) {
                        e.stopPropagation();
                        setMediaIndex(
                          (prev) => (prev + 1) % content.mediaArray.length,
                        );
                      }
                    }}
                  />
                );
              }

              if (currentMedia.type === "video") {
                const networkQuality = store.networkQuality;
                const isActuallyActive = store.activeMediaId === id;
                
                return (
                  <div className="w-full h-full relative">
                    <video
                      ref={videoRef}
                      src={currentMedia.url}
                      className="w-full h-full object-cover absolute inset-0"
                      playsInline
                      loop
                      muted={isMuted}
                      preload={isActuallyActive ? "auto" : (networkQuality === "slow" ? "none" : "metadata")}
                    />
                    {/* Speaker overlay button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const nextMuted = !isMuted;
                        setIsMuted(nextMuted);
                        globalMuted = nextMuted;
                      }}
                      className="absolute top-4 left-4 z-40 w-9 h-9 rounded-full bg-black/40 border border-white/10 backdrop-blur-md flex items-center justify-center text-white/80 hover:text-white transition-all active:scale-90"
                    >
                      {isMuted ? <VolumeX size={16} /> : <Volume2 size={16} />}
                    </button>
                    {networkQuality === "slow" && !isActuallyActive && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 backdrop-blur-[2px]">
                           <div className="px-3 py-1 bg-black/40 rounded-full border border-white/10 text-[10px] font-bold uppercase tracking-widest text-white/60">
                             Slow Connection
                           </div>
                        </div>
                    )}
                  </div>
                );
              }

              const isFile = ["pdf", "file", "doc", "docx", "xls", "xlsx", "zip", "txt"].includes(currentMedia.type);

              if (isFile) {
                const getFileIcon = (type: string) => {
                  if (type === "pdf") return "PDF";
                  if (type.includes("doc")) return "DOC";
                  if (type.includes("xls")) return "XLS";
                  if (type === "zip") return "ZIP";
                  return "FILE";
                };

                return (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-white/50 bg-black/40 p-10">
                    <div className="w-24 h-32 bg-white/5 rounded-xl border border-white/10 flex flex-col items-center justify-center relative shadow-2xl backdrop-blur-md mb-6">
                      <div className="absolute top-0 right-0 w-8 h-8 bg-white/10 rounded-bl-xl border-l border-b border-white/20" />
                      <div className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20 mb-2">Document</div>
                      <div className="text-2xl font-black text-white/40">{getFileIcon(currentMedia.type)}</div>
                    </div>
                    
                    <h3 className="text-lg font-bold text-white/90 text-center line-clamp-1 mb-2">
                      {currentMedia.name || content.caption || "Document Attachment"}
                    </h3>
                    
                    {currentMedia.size && (
                      <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-6">
                        {currentMedia.size}
                      </p>
                    )}

                    <a
                      href={currentMedia.url}
                      target="_blank"
                      className="px-8 py-3 bg-white text-black text-xs font-black uppercase tracking-[0.2em] rounded-full z-20 hover:scale-105 active:scale-95 transition-all shadow-[0_10px_30px_rgba(255,255,255,0.2)]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      Open File
                    </a>
                  </div>
                );
              }

              return null;
            })()}
          </div>
        )}
        <div className="grain-overlay opacity-[0.03]" />

        {/* Heart Burst Animation */}
        <AnimatePresence>
          {showHeartBurst && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5, rotate: -15 }}
              animate={{ scale: 2, opacity: 1, rotate: 0 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.6 }}
              className="absolute inset-0 m-auto w-32 h-32 flex items-center justify-center pointer-events-none z-50 text-red-500 drop-shadow-2xl"
            >
              <Heart size={120} className="fill-current text-red-500" />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Heart Break Animation */}
        <AnimatePresence>
          {showHeartBreak && (
            <motion.div
              initial={{ scale: 0, opacity: 0.5, rotate: 15 }}
              animate={{ scale: 2, opacity: 1, rotate: 0 }}
              exit={{ scale: 3, opacity: 0 }}
              transition={{ duration: 0.6, type: "spring", bounce: 0.6 }}
              className="absolute inset-0 m-auto w-32 h-32 flex items-center justify-center pointer-events-none z-50 text-white/50 drop-shadow-2xl"
            >
              <HeartCrack size={120} className="text-white/40" />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Overlay: Bottom Information */}
      <div className="absolute bottom-0 left-0 right-0 pt-32 pb-24 px-4 z-20 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none">
        <div className="flex flex-col gap-3 pointer-events-auto max-w-[85%]">
          {/* Repost Thoughts Animated Preview Container */}
          {dbRepostsList.length > 0 && !repost && (
            <RepostThoughtsPreview
              reposts={dbRepostsList}
              onOpen={() => setShowRepostsDrawer(true)}
            />
          )}

          {/* Context Badges (Ad or Intelligence) */}
          <div className="flex items-center gap-2">
            {isAd && (
              <div className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest border border-white/20">
                Sponsored
              </div>
            )}
            {recommendationReason && !isAd && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center gap-1.5"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/60">
                  {recommendationReason}
                </span>
              </motion.div>
            )}
          </div>

          {/* Identity & Trust Block */}
          <div className="flex flex-col gap-2">
            {/* Repost Thought Bubble - attached cleanly and frictionless on the post */}
            {repost && (
              <div className="flex items-start gap-2 bg-black/40 border border-white/5 backdrop-blur-sm p-2 rounded-xl text-xs max-w-full">
                <Repeat2 size={12} className="text-green-400 shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="text-[9px] font-bold text-green-400 uppercase tracking-widest leading-none">
                    {repost.by_id === user?.id
                      ? "You Reposted"
                      : `@${repost.by} Reposted`}
                  </span>
                  {repost.thought && (
                    <p className="text-[11px] font-medium text-white/85 mt-0.5 max-w-full line-clamp-2 leading-tight italic">
                      "{repost.thought}"
                    </p>
                  )}
                </div>
              </div>
            )}

            {isActiveReposted && !repost && (
              <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full w-fit">
                <Repeat2 size={11} className="animate-spin-slow" />
                <span>You Reposted</span>
              </div>
            )}

            <div className="flex items-start gap-3">
              {/* Bottom Profile Details - Name & Badges */}
              <div className="flex flex-col">
                <div className="flex items-center gap-2 cursor-pointer" onClick={onProfileClick}>
                  <h3 className="text-base font-display font-black tracking-tight text-white flex items-center gap-1.5 drop-shadow-md">
                    {creator.name}
                  </h3>
                  {creator.verified && (
                    <CheckCircle2
                      size={14}
                      className="text-blue-400 fill-blue-500/20 shrink-0"
                    />
                  )}
                  {/* Real-time Green active dot */}
                  {creator.active && (
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </span>
                  )}
                </div>

                {/* Highly Polished Trust Badges */}
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-blue-500/15 border border-blue-500/30 backdrop-blur-md">
                    <ShieldCheck size={10} className="text-blue-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-blue-400 font-sans">LVL 4 TRUSTED PRO</span>
                  </div>
                  {creator.jobs && creator.jobs > 10 && (
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/30 backdrop-blur-md">
                      <TrendingUp size={10} className="text-purple-400" />
                      <span className="text-[8px] font-black uppercase tracking-widest text-purple-400 font-sans">TOP 1% HUSTLER</span>
                    </div>
                  )}
                </div>

                {/* Clicking Skill Tag pill triggers discovery search category */}
                <div className="flex flex-wrap items-center gap-2 mt-2.5">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onSkillTagClick) {
                        onSkillTagClick(creator.category);
                      }
                    }}
                    className="flex items-center gap-1 bg-gradient-to-r from-blue-600/30 to-indigo-600/30 border border-blue-500/40 hover:border-blue-400 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider text-blue-300 backdrop-blur-md shadow-lg transition-all active:scale-95 cursor-pointer max-w-xs"
                  >
                    <span className="text-blue-400 font-bold">#</span>
                    <span>{creator.category}</span>
                  </button>

                  <span className="text-white/30 text-xs">•</span>

                  <span className="flex items-center gap-1 text-[10px] text-white/70 font-semibold tracking-wider uppercase">
                    <MapPin size={10} className="text-white/50" /> {creator.location}
                  </span>

                  {creator.rating && (
                    <>
                      <span className="text-white/30 text-xs">•</span>
                      <span className="flex items-center gap-1 text-[10px] text-yellow-400 font-bold uppercase tracking-wider bg-yellow-500/10 border border-yellow-500/20 px-2 py-0.5 rounded">
                        <Star size={10} className="fill-yellow-400" />{" "}
                        {Number(creator.rating).toFixed(1)}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content Title & Description */}
          <div className="flex flex-col gap-1">
             <div className="flex items-center gap-2 mt-1">
                 <span className="text-sm font-bold text-white drop-shadow-md">
                   {Array.isArray(detailData) ? detailData[0]?.title : detailData?.title || content.caption?.split('.')[0] || "Hustle Showcase"}
                 </span>
                 <span className="bg-white/10 backdrop-blur-md px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-widest text-white/80 border border-white/5">
                   {["Skill Demo", "Project Showcase", "Before & After", "Educational Tip", "Customer Testimonial", "Service Promotion"][(typeof id === "number" ? id : id?.toString().length || 0) % 6]}
                 </span>
             </div>
             {content.type !== "text" && (
                <p className="text-xs font-medium tracking-wide text-white/80 leading-relaxed line-clamp-2 drop-shadow-md max-w-[90%] mt-0.5">
                   {content.caption}
                </p>
             )}
          </div>

          {/* Music Integration */}
          {content.hasMusic && (
            <div className="flex items-center gap-2 mt-1">
              <Music size={11} className="text-white/50 animate-bounce" />
              <div className="w-52 overflow-hidden whitespace-nowrap mask-image-r">
                <p className="text-[9px] font-bold tracking-wider text-white/40 uppercase inline-block animate-[marquee_5s_linear_infinite]">
                  {content.musicTrack || "Original Audio - " + creator.name}
                </p>
              </div>
            </div>
          )}

          {/* BOTTOM ACTION BAR */}
          <div className="mt-3 flex items-center gap-2 w-full pr-10">
            {/* View Profile */}
            <button
               onClick={(e) => { e.stopPropagation(); if (onProfileClick) onProfileClick(); }}
               className="h-11 px-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors shadow-lg shrink-0"
            >
               Profile
            </button>
            
            {/* Always Visible Hire Button */}
            <motion.button
               whileTap={{ scale: 0.95 }}
               onClick={(e) => {
                 e.stopPropagation();
                 if (onBook) onBook();
                 else if (!isAd && ctas.length > 0) handleCtaClick(ctas[0]);
                 else handleCtaClick();
               }}
               className="h-11 flex-1 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 shadow-[0_4px_15px_rgba(37,99,235,0.4)] active:scale-95 transition-all w-full"
            >
               <Calendar size={13} />
               Hire {creator.name.split(" ")[0]}
            </motion.button>

            {/* View Service */}
            {ctas.length > 0 && (
              <button
                 onClick={(e) => {
                   e.stopPropagation();
                   handleCtaClick(ctas[0]);
                 }}
                 className="h-11 px-4 rounded-xl border border-white/20 bg-black/40 backdrop-blur-md text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-colors shadow-lg shrink-0"
              >
                 Service
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Action Layer: Engagement Sidebar */}
      <div className="absolute right-4 bottom-24 z-30 flex flex-col items-center gap-5 pointer-events-auto">
        {/* TikTok Style Profile Picture with follow dynamic overlap button */}
        <div className="flex flex-col items-center relative mb-4">
          <div
            onClick={onProfileClick}
            className="w-12 h-12 rounded-full border-2 border-white overflow-hidden bg-[#18181b] shadow-[0_4px_12px_rgba(0,0,0,0.5)] cursor-pointer shrink-0 transition-all hover:scale-105 active:scale-95"
          >
            {creator.avatar ? (
              <img
                src={creator.avatar}
                alt={creator.name}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-sm font-black text-white/40">
                {creator.name.charAt(0)}
              </div>
            )}
          </div>
          {user && user.id !== creator.id.toString() && (
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={handleFollowClick}
              disabled={isFollowingState}
              className={`absolute -bottom-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow-lg border border-black/85 transition-all z-10 ${
                isFollowingState ? "opacity-50 !bg-gray-500 scale-95" :
                isFollowing
                  ? "bg-emerald-500 text-white"
                  : "bg-gradient-to-r from-red-500 to-pink-500 text-white"
              }`}
            >
              {isFollowingState ? (
                <div className="w-2.5 h-2.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : isFollowing ? (
                <UserCheck size={11} />
              ) : (
                <Plus size={11} className="font-bold" />
              )}
            </motion.button>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleDoubleTap}
            disabled={isLiking}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${isLiking ? "opacity-60 scale-95" : ""} ${isActiveLiked ? "bg-red-500/20 border-red-500/50 text-red-500" : "bg-black/40 border-white/10 text-white hover:bg-white/10"}`}
          >
            {isLiking ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Heart size={20} className={isActiveLiked ? "fill-current" : ""} />
            )}
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">
            {activeLikesCount >= 1000
              ? (activeLikesCount / 1000).toFixed(1) + "k"
              : activeLikesCount}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setShowComments(true)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <MessageSquare size={20} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">
            {activeCommentsCount}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={async () => {
              if (typeof id === "string") {
                if (isActiveReposted) {
                  await toggleDbRepost(id, null);
                } else {
                  setShowRepostSheet(true);
                }
              } else {
                if (reposted) {
                  setReposted(false);
                  setStats((p) => ({ ...p, reposts: p.reposts - 1 }));
                } else {
                  setShowRepostSheet(true);
                }
              }
            }}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${isActiveReposted ? "bg-green-500/20 border-green-500/50 text-green-400" : "bg-black/40 border-white/10 text-white hover:bg-white/10"}`}
          >
            <Repeat2 size={20} />
          </motion.button>
          <button
            onClick={() => setShowRepostsDrawer(true)}
            className="text-[10px] font-bold text-white/80 drop-shadow-md hover:text-green-400 cursor-pointer transition-colors"
          >
            {activeRepostsCount}
          </button>
        </div>

        <div className="flex flex-col items-center gap-1 group">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={handleSaveToggle}
            disabled={isSaving}
            className={`w-10 h-10 rounded-full backdrop-blur-xl border flex items-center justify-center transition-all ${isSaving ? "opacity-60 scale-95" : ""} ${isActiveSaved ? "bg-blue-500/20 border-blue-500/50 text-blue-400" : "bg-black/40 border-white/10 text-white hover:bg-white/10"}`}
          >
            {isSaving ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <Bookmark
                size={20}
                className={isActiveSaved ? "fill-current" : ""}
              />
            )}
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">
            {postFromStore?.saves_count ||
              (detailData &&
              !Array.isArray(detailData) &&
              (detailData as any).socialStats
                ? (detailData as any).socialStats.saves
                : (stats as any).saves || 0)}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 group mt-2">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={() => setShowShareSheet(true)}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 transition-colors"
          >
            <Share2 size={18} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">
            {postFromStore?.shares_count ||
              (detailData &&
              !Array.isArray(detailData) &&
              (detailData as any).socialStats
                ? (detailData as any).socialStats.shares
                : (stats as any).shares || 0)}
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 group mt-2">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
               e.stopPropagation();
               setIsHidden(true);
               setHiddenReason("skipped");
               
               // Delay removing from feed to allow undo
               if (typeof id === "string") {
                  setTimeout(() => {
                    // we can't easily check if it's still hidden because of closure,
                    // but we can just fire the backend event and let it be
                    const useFeedStore = require('../features/feed/stores/useFeedStore').useFeedStore;
                    fetch("/api/feed/not-interested", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("hustle_auth_token")}`
                      },
                      body: JSON.stringify({ postId: id })
                    }).catch(console.error);
                  }, 4000);
               }
            }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:text-orange-400 transition-colors"
          >
            <EyeOff size={18} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">
            Skip
          </span>
        </div>

        <div className="flex flex-col items-center gap-1 group mt-2">
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
               e.stopPropagation();
               setShowReportSheet(true);
            }}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-xl border border-white/10 flex items-center justify-center text-white hover:bg-white/10 hover:text-red-500 transition-colors"
          >
            <Flag size={18} />
          </motion.button>
          <span className="text-[10px] font-bold text-white/80 drop-shadow-md">
            Report
          </span>
        </div>

      </div>

      {/* Interactive Comment Drawer */}
      <AnimatePresence>
        {showComments && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowComments(false);
                setReplyingTo(null);
              }}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[70%] bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="w-full flex items-center justify-center p-3 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <MessageSquare size={16} className="text-white/60" />
                  <h3 className="font-bold text-sm text-white/80">
                    Comments ({activeCommentsCount})
                  </h3>
                </div>
                <button
                  onClick={() => setShowComments(false)}
                  className="p-1 text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-24 flex flex-col gap-6 scrollbar-hide">
                {isDrawerLoading || isCommentsLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-blue-500 animate-spin" />
                    <span className="text-xs text-white/40 mt-3 font-semibold">
                      Loading comments...
                    </span>
                  </div>
                ) : (
                  <>
                    {/* Comments Tree */}
                    {typeof id === "string" ? (
                      commentsForThisPost.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-center">
                          <MessageSquare
                            size={32}
                            className="text-white/20 mb-2 animate-pulse"
                          />
                          <p className="text-xs text-white/40">
                            No comments yet. Start the conversation!
                          </p>
                        </div>
                      ) : (
                        commentsForThisPost.map((comment: any) => (
                          <div key={comment.id} className="w-full">
                            {(function renderDbComment(
                              c: any,
                              depth: number = 0,
                            ) {
                              return (
                                <div
                                  key={c.id}
                                  className={`flex flex-col gap-4 ${depth > 0 ? "pl-8 mt-4 border-l border-white/5 ml-4" : ""}`}
                                >
                                  <div className="flex gap-3 relative z-10 w-full">
                                    <div
                                      className={`${depth > 0 ? "w-6 h-6" : "w-8 h-8"} rounded-full bg-white/10 shrink-0 overflow-hidden flex items-center justify-center font-bold text-white/40 border border-white/5`}
                                    >
                                      {c.profiles?.avatar_url ? (
                                        <img
                                          src={c.profiles.avatar_url}
                                          alt={
                                            c.profiles.full_name ||
                                            c.profiles.username ||
                                            ""
                                          }
                                          className="w-full h-full object-cover"
                                          referrerPolicy="no-referrer"
                                        />
                                      ) : (
                                        (
                                          c.profiles?.full_name ||
                                          c.profiles?.username ||
                                          "U"
                                        )
                                          .charAt(0)
                                          .toUpperCase()
                                      )}
                                    </div>
                                    <div className="flex-1 flex flex-col pt-0.5 min-w-0">
                                      <div className="flex items-center justify-between w-full">
                                        <span className="font-bold text-white/50 text-[11px] truncate">
                                          {c.profiles?.full_name ||
                                            c.profiles?.username ||
                                            "Unknown User"}
                                        </span>
                                        <span className="text-[10px] text-white/20 font-medium whitespace-nowrap">
                                          {formatTime(c.created_at)}
                                        </span>
                                      </div>
                                      <p className="font-medium leading-relaxed mt-1 text-[13px] text-white break-words">
                                        {c.content}
                                      </p>
                                      <div className="flex items-center gap-6 mt-3 text-[11px] text-white/40 font-bold select-none">
                                        <span
                                          className="cursor-pointer hover:text-white transition-colors"
                                          onClick={() => {
                                            setReplyingTo({
                                              id: c.id,
                                              user:
                                                c.profiles?.username ||
                                                c.profiles?.full_name ||
                                                "user",
                                            });
                                            setNewComment(
                                              `@${c.profiles?.username || c.profiles?.full_name || "user"} `,
                                            );
                                            commentInputRef.current?.focus();
                                          }}
                                        >
                                          Reply
                                        </span>
                                        <div className="flex items-center gap-1.5 cursor-pointer hover:text-red-400 transition-colors">
                                          <Heart
                                            size={12}
                                            className={
                                              c.liked
                                                ? "fill-red-500 text-red-500"
                                                : ""
                                            }
                                          />
                                          <span>Like</span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                  {c.replies && c.replies.length > 0 && (
                                    <div className="flex flex-col">
                                      {c.replies.map((r: any) =>
                                        renderDbComment(r, depth + 1),
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })(comment, 0)}
                          </div>
                        ))
                      )
                    ) : (
                      /* Mock Fallback */
                      commentsList
                        .filter((c) => !c.isRepostReply)
                        .map(function renderComment(
                          comment: any,
                          depth: number = 0,
                        ) {
                          return (
                            <div
                              key={comment.id}
                              className={`flex flex-col gap-4 ${depth > 0 ? "pl-9" : ""}`}
                            >
                              <div className="flex gap-3 relative z-10 w-full">
                                <div
                                  className={`${depth > 0 ? "w-6 h-6" : "w-8 h-8"} rounded-full bg-white/10 shrink-0 overflow-hidden flex items-center justify-center font-bold text-white/40 border border-white/5`}
                                >
                                  {comment.user.charAt(0).toUpperCase()}
                                </div>
                                <div className="flex-1 flex flex-col pt-0.5">
                                  <div className="flex items-center justify-between w-full">
                                    <span className="font-bold text-white/50 text-[11px] truncate">
                                      {comment.user}
                                    </span>
                                    <span className="text-[10px] text-white/20 font-medium whitespace-nowrap">
                                      {comment.time}
                                    </span>
                                  </div>
                                  <p className="font-medium leading-relaxed mt-1 text-[13px] text-white grow break-words">
                                    {comment.text}
                                  </p>
                                  <div className="flex items-center gap-6 mt-3 text-[11px] text-white/40 font-bold">
                                    <span
                                      className="cursor-pointer hover:text-white transition-colors"
                                      onClick={() => {
                                        setReplyingTo({
                                          id: comment.id,
                                          user: comment.user,
                                        });
                                        setNewComment(`@${comment.user} `);
                                        commentInputRef.current?.focus();
                                      }}
                                    >
                                      Reply
                                    </span>
                                    <div
                                      className="flex items-center gap-1.5 cursor-pointer hover:text-red-400 transition-colors"
                                      onClick={() =>
                                        toggleLikeComment(comment.id)
                                      }
                                    >
                                      <Heart
                                        size={12}
                                        className={
                                          comment.liked
                                            ? "fill-red-500 text-red-500"
                                            : ""
                                        }
                                      />
                                      <span>Like</span>
                                    </div>
                                  </div>
                                </div>
                              </div>
                              {comment.replies &&
                                comment.replies.length > 0 && (
                                  <div className="flex flex-col gap-4">
                                    {comment.replies.map((reply: any) =>
                                      renderComment(reply, depth + 1),
                                    )}
                                  </div>
                                )}
                            </div>
                          );
                        })
                    )}
                  </>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/5 pb-8 flex flex-col z-10">
                {/* Replying indicator banner */}
                {replyingTo && !(replyingTo as any).isRepost && (
                  <div className="flex items-center justify-between px-6 py-2 bg-white/5 border-b border-white/5 text-[11px] text-white/50 shrink-0">
                    <span>
                      Replying to{" "}
                      <span className="text-blue-400 font-bold">
                        @{replyingTo.user}
                      </span>
                    </span>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment("");
                      }}
                      className="text-white/40 hover:text-white"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="p-4">
                  <div className="bg-white/5 border border-white/10 rounded-full h-12 flex items-center px-4 gap-2">
                    <div className="w-7 h-7 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 shrink-0 font-black">
                      {user ? user.email?.charAt(0).toUpperCase() || "Y" : "Y"}
                    </div>
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handlePostComment()
                      }
                      placeholder={
                        replyingTo
                          ? `Reply to @${replyingTo.user}...`
                          : "Add a comment..."
                      }
                      className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-white/30"
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={!newComment.trim()}
                      className="text-blue-400 font-bold text-sm disabled:opacity-20 transition-all px-2"
                    >
                      <Send
                        size={18}
                        fill={newComment.trim() ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Dedicated Reposts Thoughts Drawer */}
      <AnimatePresence>
        {showRepostsDrawer && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowRepostsDrawer(false);
                setReplyingTo(null);
              }}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[80%] bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="w-full flex items-center justify-center p-3 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 pb-4 shrink-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-green-500/20 flex items-center justify-center">
                    <Repeat2 size={13} className="text-green-400" />
                  </div>
                  <h3 className="font-bold text-sm text-white/80">
                    Repost Thoughts ({activeRepostsCount})
                  </h3>
                </div>
                <button
                  onClick={() => setShowRepostsDrawer(false)}
                  className="p-1 text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-32 flex flex-col gap-8 scrollbar-hide">
                {isDrawerLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="w-6 h-6 rounded-full border-2 border-t-transparent border-green-500 animate-spin" />
                  </div>
                ) : typeof id === "string" ? (
                  dbRepostsList.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Repeat2 size={40} className="text-white/10 mb-4" />
                      <p className="text-sm font-bold text-white/50 underline decoration-green-500/30 underline-offset-4 decoration-2">
                        NO THOUGHTS YET
                      </p>
                    </div>
                  ) : (
                    dbRepostsList.map((rep: any) => {
                      const profile = rep.profiles;
                      const replies = dbRepostRepliesMap[rep.id] || [];
                      return (
                        <div
                          key={rep.id}
                          className="flex flex-col gap-5 border-b border-white/5 pb-6"
                        >
                          <div className="flex gap-3">
                            <div className="w-10 h-10 rounded-full border-2 border-white/10 overflow-hidden bg-white/5 shrink-0">
                              {profile?.avatar_url ? (
                                <img
                                  src={profile.avatar_url}
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                  alt=""
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center font-bold text-white/30">
                                  {(profile?.username || "U")
                                    .charAt(0)
                                    .toUpperCase()}
                                </div>
                              )}
                            </div>
                            <div className="flex-1 flex flex-col min-w-0">
                              <div className="flex items-center justify-between">
                                <div className="flex flex-col">
                                  <span className="font-black text-xs text-white/90 truncate">
                                    {profile?.full_name ||
                                      profile?.username ||
                                      "Unknown"}
                                  </span>
                                  <span className="text-[10px] text-green-400 font-bold flex items-center gap-1 uppercase tracking-tighter">
                                    <Repeat2 size={10} /> REPOSTED
                                  </span>
                                </div>
                                <span className="text-[10px] text-white/20 font-medium">
                                  {formatTime(rep.created_at)}
                                </span>
                              </div>

                              {editingRepostId === rep.id ? (
                                <div className="mt-3 flex flex-col gap-2">
                                  <textarea
                                    value={editingRepostComment}
                                    onChange={(e) =>
                                      setEditingRepostComment(e.target.value)
                                    }
                                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white outline-none focus:border-green-500/40"
                                    rows={3}
                                    autoFocus
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      onClick={() => setEditingRepostId(null)}
                                      className="text-xs font-bold text-white/40 px-3 py-1.5"
                                    >
                                      CANCEL
                                    </button>
                                    <button
                                      onClick={() => handleEditRepost(rep.id)}
                                      className="bg-green-500/10 text-green-400 border border-green-500/20 rounded-full px-4 py-1.5 text-xs font-black"
                                    >
                                      SAVE THOUGHT
                                    </button>
                                  </div>
                                </div>
                              ) : (
                                <p className="mt-2 text-sm font-medium leading-relaxed text-white/90 italic tracking-tight">
                                  {rep.repost_comment ? (
                                    `"${rep.repost_comment}"`
                                  ) : (
                                    <span className="text-white/20 not-italic uppercase text-[9px] font-black tracking-widest leading-none">
                                      Shared without thoughts
                                    </span>
                                  )}
                                </p>
                              )}

                              <div className="flex items-center gap-6 mt-4 text-[10px] font-black uppercase text-white/40 tracking-widest select-none">
                                <span
                                  className="cursor-pointer hover:text-green-400 transition-colors flex items-center gap-1.5"
                                  onClick={() => {
                                    setReplyingTo({
                                      id: rep.id,
                                      user:
                                        profile?.username ||
                                        profile?.full_name ||
                                        "user",
                                      isRepost: true,
                                      repost_id: rep.id,
                                    } as any);
                                    commentInputRef.current?.focus();
                                  }}
                                >
                                  <MessageCircle size={12} /> Reply
                                </span>
                                {user &&
                                  rep.user_id === user.id &&
                                  (() => {
                                    const rem = getEditingRemainingText(
                                      rep.created_at,
                                    );
                                    if (!rem) return null;
                                    return (
                                      <span
                                        className="cursor-pointer text-blue-400 hover:text-blue-300 flex items-center gap-1"
                                        onClick={() => {
                                          setEditingRepostId(rep.id);
                                          setEditingRepostComment(
                                            rep.repost_comment || "",
                                          );
                                        }}
                                      >
                                        {rep.repost_comment
                                          ? "EDIT"
                                          : "ADD THOUGHT"}{" "}
                                        <span className="text-[8px] text-blue-400/40 font-normal">
                                          ({rem})
                                        </span>
                                      </span>
                                    );
                                  })()}
                              </div>
                            </div>
                          </div>

                          {/* Replies to this Repost Thought */}
                          {replies.length > 0 && (
                            <div className="flex flex-col mt-2">
                              {replies.map((reply: any) => (
                                <div key={reply.id}>
                                  {(function renderRepostReply(
                                    r: any,
                                    depth: number = 0,
                                  ) {
                                    return (
                                      <div
                                        className={`flex flex-col gap-4 ${depth > 0 ? "pl-8 mt-4 border-l border-white/5 ml-4" : "pl-10 mt-2"}`}
                                      >
                                        <div className="flex gap-3">
                                          <div
                                            className={`${depth > 0 ? "w-6 h-6" : "w-7 h-7"} rounded-full bg-white/5 border border-white/10 overflow-hidden flex items-center justify-center shrink-0`}
                                          >
                                            {r.profiles?.avatar_url ? (
                                              <img
                                                src={r.profiles.avatar_url}
                                                className="w-full h-full object-cover"
                                                referrerPolicy="no-referrer"
                                                alt=""
                                              />
                                            ) : (
                                              <span className="text-[10px] font-bold text-white/30">
                                                {(r.profiles?.username || "U")
                                                  .charAt(0)
                                                  .toUpperCase()}
                                              </span>
                                            )}
                                          </div>
                                          <div className="flex-1 flex flex-col pt-0.5">
                                            <div className="flex items-center justify-between">
                                              <span className="font-bold text-[10px] text-white/50">
                                                {r.profiles?.username ||
                                                  "Unknown"}
                                              </span>
                                              <span className="text-[9px] text-white/20">
                                                {formatTime(r.created_at)}
                                              </span>
                                            </div>
                                            <p className="text-xs font-medium mt-1 text-white/80 leading-relaxed">
                                              {r.content}
                                            </p>
                                            <button
                                              onClick={() => {
                                                setReplyingTo({
                                                  id: r.id,
                                                  user:
                                                    r.profiles?.username ||
                                                    "user",
                                                  isRepost: true,
                                                  repost_id: rep.id,
                                                } as any);
                                                commentInputRef.current?.focus();
                                              }}
                                              className="mt-2 text-[9px] font-black text-green-400/60 uppercase tracking-widest hover:text-green-400 transition-colors w-fit"
                                            >
                                              Reply
                                            </button>
                                          </div>
                                        </div>
                                        {r.replies && r.replies.length > 0 && (
                                          <div className="flex flex-col">
                                            {r.replies.map((child: any) =>
                                              renderRepostReply(
                                                child,
                                                depth + 1,
                                              ),
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })(reply, 0)}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  )
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
                    <Repeat2 size={30} className="mb-2" />
                    <p className="text-xs font-bold uppercase tracking-widest">
                      Login required for real-time history
                    </p>
                  </div>
                )}
              </div>

              <div className="absolute bottom-0 left-0 right-0 bg-[#0f0f0f] border-t border-white/5 pb-8 flex flex-col z-10">
                {/* Replying indicator for repost thread */}
                {replyingTo && (replyingTo as any).isRepost && (
                  <div className="flex items-center justify-between px-6 py-2 bg-green-500/5 border-b border-green-500/10 text-[11px] text-green-400/60 shrink-0">
                    <span className="flex items-center gap-1.5">
                      <Repeat2 size={10} /> Replying to{" "}
                      <span className="font-bold">@{replyingTo.user}'s</span>{" "}
                      thought
                    </span>
                    <button
                      onClick={() => {
                        setReplyingTo(null);
                        setNewComment("");
                      }}
                      className="text-green-400/40 hover:text-green-400"
                    >
                      <X size={12} />
                    </button>
                  </div>
                )}
                <div className="p-4">
                  <div className="bg-white/5 border border-white/10 rounded-full h-12 flex items-center px-4 gap-2 focus-within:border-green-500/50 transition-colors shadow-lg">
                    <div className="w-7 h-7 rounded-full bg-green-500/10 border border-green-500/20 flex items-center justify-center text-[10px] text-green-400 shrink-0 font-black">
                      <MessageSquare size={12} />
                    </div>
                    <input
                      ref={commentInputRef}
                      type="text"
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && handlePostComment()
                      }
                      placeholder={
                        replyingTo
                          ? `Reply to thought...`
                          : "Reply to a repost thought..."
                      }
                      className="bg-transparent border-none outline-none flex-1 text-sm placeholder:text-white/30"
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={!newComment.trim()}
                      className="text-green-400 font-bold text-sm disabled:opacity-20 transition-all px-2"
                    >
                      <Send
                        size={18}
                        fill={newComment.trim() ? "currentColor" : "none"}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Save Collection Drawer */}
      <AnimatePresence>
        {showSaveCollections && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSaveCollections(false)}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[50%] bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="w-full flex items-center justify-center p-3 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 pb-4 shrink-0">
                <h3 className="font-bold text-sm text-white/80">
                  Save to Collection
                </h3>
                <button
                  onClick={() => setShowSaveCollections(false)}
                  className="p-1 text-white/40 hover:text-white"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-8 flex flex-col gap-3">
                {isCreatingCollection ? (
                  <div className="flex items-center gap-2 p-1 bg-white/5 border border-white/10 rounded-xl px-3 h-12">
                    <input
                      type="text"
                      autoFocus
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="Collection name..."
                      className="bg-transparent border-none outline-none flex-1 text-sm text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && newCollectionName.trim()) {
                          createDbCollection(newCollectionName.trim());
                          setNewCollectionName("");
                          setIsCreatingCollection(false);
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        if (newCollectionName.trim()) {
                          createDbCollection(newCollectionName.trim());
                          setNewCollectionName("");
                          setIsCreatingCollection(false);
                        }
                      }}
                      className="text-blue-400 font-bold text-xs"
                    >
                      ADD
                    </button>
                    <button
                      onClick={() => setIsCreatingCollection(false)}
                      className="text-white/20"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreatingCollection(true)}
                    className="flex items-center gap-4 p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-colors"
                  >
                    <div className="w-12 h-12 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-400">
                      <Plus size={24} />
                    </div>
                    <span className="font-semibold text-sm">
                      Create new collection
                    </span>
                  </button>
                )}

                {collections.map((collection) => (
                  <button
                    key={collection.id}
                    onClick={async () => {
                      if (typeof id === "string") {
                        await addPostToCollection(id, collection.id);
                      } else {
                        setSaved(true);
                      }
                      setShowSaveCollections(false);
                    }}
                    className={`flex items-center gap-4 p-3 rounded-xl hover:bg-white/10 border transition-colors ${postFromStore?.collection_id === (collection.id === "general" ? null : collection.id) ? "bg-blue-500/10 border-blue-500/30" : "bg-white/5 border-white/5"}`}
                  >
                    <div className="w-12 h-12 rounded-lg bg-zinc-800 flex items-center justify-center overflow-hidden">
                      <Bookmark
                        size={20}
                        className={
                          postFromStore?.collection_id ===
                          (collection.id === "general" ? null : collection.id)
                            ? "text-blue-400 fill-current"
                            : "text-white/20"
                        }
                      />
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-semibold text-sm">
                        {collection.name}
                      </span>
                      {postFromStore?.collection_id ===
                        (collection.id === "general"
                          ? null
                          : collection.id) && (
                        <span className="text-[10px] text-blue-400 font-bold">
                          CURRENT
                        </span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Repost Drawer */}
      <AnimatePresence>
        {showRepostSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowRepostSheet(false)}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-auto bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] px-6 pb-8 pt-4"
            >
              <div className="w-full flex items-center justify-center pb-4 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              <div className="flex gap-4">
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-500 font-bold shrink-0">
                  Y
                </div>
                <div className="flex flex-col flex-1">
                  <textarea
                    value={repostThought}
                    onChange={(e) => setRepostThought(e.target.value)}
                    placeholder="Add a thought to your repost..."
                    className="w-full bg-transparent border-none outline-none text-base resize-none min-h-[80px] placeholder:text-white/30"
                    autoFocus
                  />

                  {/* Quoted Post Preview */}
                  <div className="mt-2 mb-4 p-3 rounded-xl border border-white/10 bg-white/5 flex gap-3 opacity-80">
                    <div
                      className="w-10 h-10 bg-zinc-800 rounded bg-cover bg-center"
                      style={{ backgroundImage: `url(${creator.avatar})` }}
                    />
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-bold text-[10px] text-white/50">
                        {creator.name}
                      </span>
                      <span className="text-xs text-white/80 line-clamp-1">
                        {content.caption}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-between items-center mt-2">
                    <button
                      onClick={() => setShowRepostSheet(false)}
                      className="text-white/40 text-sm font-semibold hover:text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleRepostSubmit}
                      className="bg-white text-black px-6 py-2 rounded-full font-bold text-sm hover:bg-white/90 transition-colors"
                    >
                      {repostThought.trim() ? "Repost with Thought" : "Repost"}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Share Drawer */}
      <AnimatePresence>
        {showShareSheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowShareSheet(false);
                setTimeout(() => {
                  setShareStep("options");
                  setSearchQuery("");
                }, 300);
              }}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-auto max-h-[85%] bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)] pb-8 overflow-hidden"
            >
              <div className="w-full flex items-center justify-center p-3 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>

              {shareStep === "options" ? (
                <div className="px-6 py-4 flex items-center justify-around gap-6">
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => {
                        setShowShareSheet(false);
                        setShowRepostSheet(true);
                      }}
                      className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                      <Repeat2 size={24} />
                    </button>
                    <span className="text-[10px] text-white/60">Repost</span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={async () => {
                        if (typeof id === "string") {
                          await copyDbPostLink(id);
                          setIsCopied(true);
                          setTimeout(() => setIsCopied(false), 2000);
                        }
                      }}
                      className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isCopied ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400 hover:bg-blue-500/30"}`}
                    >
                      {isCopied ? (
                        <CheckCircle2 size={24} />
                      ) : (
                        <Link2 size={24} />
                      )}
                    </button>
                    <span className="text-[10px] text-white/60">
                      {isCopied ? "Copied!" : "Copy Link"}
                    </span>
                  </div>
                  <div className="flex flex-col items-center gap-2">
                    <button
                      onClick={() => setShareStep("users")}
                      className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-colors"
                    >
                      <MessageCircle size={24} />
                    </button>
                    <span className="text-[10px] text-white/60">Message</span>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col h-full max-h-[500px]">
                  <div className="px-6 pb-4 flex items-center gap-3">
                    <button
                      onClick={() => setShareStep("options")}
                      className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full"
                    >
                      <ArrowRight size={18} className="rotate-180" />
                    </button>
                    <div className="flex-1 relative">
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users to share with..."
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 pr-10"
                      />
                      {isSearching && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2">
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white animate-spin rounded-full" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto px-6 pb-4 scrollbar-hide">
                    <div className="flex flex-col gap-1">
                      {usersToShare.length > 0 ? (
                        usersToShare.map((sharedUser) => (
                          <button
                            key={sharedUser.id}
                            disabled={sharingToUserId === sharedUser.id}
                            onClick={() => handleInternalShare(sharedUser.id)}
                            className="flex items-center gap-3 p-3 rounded-2xl hover:bg-white/5 transition-colors group disabled:opacity-50"
                          >
                            <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden shrink-0 border border-white/5">
                              {sharedUser.avatar_url ? (
                                <img
                                  src={sharedUser.avatar_url}
                                  alt=""
                                  className="w-full h-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20">
                                  <Star size={20} />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 text-left">
                              <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
                                {sharedUser.full_name ||
                                  sharedUser.username ||
                                  "Anonymous Hustler"}
                              </h4>
                              <p className="text-xs text-white/40">
                                @{sharedUser.username || "no-handle"}
                              </p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400 group-hover:bg-blue-500 group-hover:text-white transition-all">
                              {sharingToUserId === sharedUser.id ? (
                                <div className="w-4 h-4 border-2 border-white/40 border-t-white animate-spin rounded-full" />
                              ) : (
                                <Send size={14} />
                              )}
                            </div>
                          </button>
                        ))
                      ) : searchQuery.trim() !== "" && !isSearching ? (
                        <div className="py-12 text-center">
                          <p className="text-white/20 text-sm font-medium">
                            No users found matching "{searchQuery}"
                          </p>
                        </div>
                      ) : (
                        !isSearching && (
                          <div className="py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10">
                            <p className="text-white/40 text-xs uppercase tracking-widest font-black">
                              Suggested Connections
                            </p>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* CTA Bottom Sheet (e.g. Booking/Buy Flow) */}
      <AnimatePresence>
        {showCtaFlow && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowCtaFlow(false)}
              className="absolute inset-0 bg-black/60 z-40 backdrop-blur-sm"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute bottom-0 left-0 right-0 h-[75%] bg-[#0f0f0f] rounded-t-3xl z-50 flex flex-col border-t border-white/10 shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
            >
              <div className="w-full flex items-center justify-center p-3 shrink-0">
                <div className="w-10 h-1 bg-white/20 rounded-full" />
              </div>
              <div className="flex items-center justify-between px-6 pb-2 shrink-0">
                <h3 className="font-bold text-lg text-white">
                  {selectedCta?.label}
                </h3>
                <button
                  onClick={() => setShowCtaFlow(false)}
                  className="p-2 text-white/40 hover:text-white bg-white/5 rounded-full mt-[-8px]"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-6 pb-6 flex flex-col gap-6">
                {/* Provider Info */}
                <div className="flex items-center gap-4 pb-6 border-b border-white/10 mt-2">
                  <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/5 flex items-center justify-center font-bold text-xl text-white/40">
                    {creator.name.charAt(0)}
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-black text-white/60 uppercase tracking-widest">
                      {creator.category}
                    </span>
                    <h4 className="text-xl font-bold flex items-center gap-2">
                      {creator.name}{" "}
                      {creator.verified && (
                        <CheckCircle2 size={14} className="text-blue-500" />
                      )}
                    </h4>
                    <div className="flex gap-2 text-xs font-semibold text-white/40 items-center">
                      {creator.is_hustler && (
                        <>
                          <span>★ {creator.rating}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>1hr avg response</span>
                    </div>
                  </div>
                </div>

                {/* Requirements/Details stub */}
                {selectedCta?.type === "book" && (
                  <div className="flex flex-col gap-3">
                    <h5 className="font-bold text-sm text-white/80">
                      Service Details
                    </h5>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                      <span className="text-sm text-white/60">
                        Duration: 1-2 hours
                      </span>
                      <span className="text-sm text-white/60">
                        Location: {creator.location}
                      </span>
                    </div>
                  </div>
                )}
                {selectedCta?.type === "buy" && (
                  <div className="flex flex-col gap-3">
                    <h5 className="font-bold text-sm text-white/80">
                      Product Options
                    </h5>
                    <div className="flex gap-2">
                      <div className="border border-white/20 px-4 py-2 rounded-lg bg-white/5 text-sm">
                        Size M
                      </div>
                      <div className="border border-white/20 px-4 py-2 rounded-lg bg-black text-sm text-white/40">
                        Size L
                      </div>
                    </div>
                  </div>
                )}

                {selectedCta?.type === "ad" && (
                  <div className="flex flex-col gap-3">
                    <h5 className="font-bold text-sm text-white/80">
                      External Promotion
                    </h5>
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-2 relative overflow-hidden">
                      <span className="text-sm font-semibold text-white/90 relative z-10">
                        You are about to leave the app ecosystem.
                      </span>
                      <span className="text-xs text-white/50 relative z-10">
                        This link is sponsored by {creator.name}.
                      </span>
                      <div className="absolute inset-0 bg-gradient-to-t from-blue-900/20 to-transparent pointer-events-none" />
                    </div>
                  </div>
                )}

                <div className="mt-auto pt-6 flex flex-col gap-3">
                  <div className="flex justify-between items-center px-1">
                    <span className="text-white/60 font-medium">Pricing</span>
                    <span className="text-2xl font-black">
                      {selectedCta?.price
                        ? `$${selectedCta.price}`
                        : "Variable"}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setShowCtaFlow(false);
                    }}
                    className={`w-full py-4 rounded-xl font-bold flex justify-center items-center gap-2 text-base transition-colors shadow-[0_0_20px_rgba(255,255,255,0.1)] active:scale-95 ${
                      selectedCta?.type === "apply"
                        ? "bg-purple-600 text-white hover:bg-purple-500"
                        : selectedCta?.type === "ad"
                          ? "bg-blue-600 text-white hover:bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.3)]"
                          : "bg-white text-black hover:bg-white/90"
                    }`}
                  >
                    {selectedCta?.type === "book"
                      ? "Select Date & Time"
                      : selectedCta?.type === "buy"
                        ? "Add to Cart"
                        : selectedCta?.type === "ad"
                          ? "Go to Website"
                          : "Submit Application"}
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Summary Preview Sheet */}
      <AnimatePresence>
        {showSummarySheet && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSummarySheet(false)}
              className="absolute inset-0 bg-black/80 z-[60] backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="absolute bottom-0 left-0 right-0 max-h-[85%] bg-[#0f0f0f] rounded-t-[3rem] z-[70] flex flex-col border-t border-white/10 shadow-2xl p-8"
            >
              <div className="w-full flex items-center justify-center mb-6">
                <div className="w-12 h-1.5 bg-white/10 rounded-full" />
              </div>

              <div className="flex flex-col gap-8 overflow-y-auto scrollbar-hide py-2">
                <div className="flex flex-col gap-2">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter leading-none">
                    {details.length > 1
                      ? "Linked Opportunities"
                      : "Quick Preview"}
                  </h2>
                  <p className="text-white/40 text-xs font-bold uppercase tracking-widest">
                    Tap to view full details
                  </p>
                </div>

                <div className="flex flex-col gap-4">
                  {details.map((item, idx) => (
                    <motion.div
                      key={idx}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => openImmersiveDetail(item)}
                      className="bg-white/5 border border-white/10 rounded-[2.5rem] p-6 flex flex-col gap-6 group"
                    >
                      <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-3xl bg-white/10 border border-white/10 overflow-hidden shrink-0">
                          <div
                            className="w-full h-full bg-cover bg-center"
                            style={{
                              backgroundImage: `url(${item.heroMedia[0]})`,
                            }}
                          />
                        </div>
                        <div className="flex flex-col gap-1 flex-1">
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/30">
                            {item.type}
                          </span>
                          <h3 className="text-xl font-bold tracking-tight">
                            {item.title}
                          </h3>
                          <div className="flex items-center gap-3 mt-1">
                            {item.creator.is_hustler && (
                              <>
                                <div className="flex items-center gap-1">
                                  <Star
                                    size={12}
                                    className="text-yellow-500 fill-current"
                                  />
                                  <span className="text-xs font-bold">
                                    {item.creator.rating}
                                  </span>
                                </div>
                                <span className="text-white/20 text-xs">|</span>
                              </>
                            )}
                            <span className="text-xs font-black text-green-500 uppercase tracking-widest">
                              Verified
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">
                            Starts at
                          </span>
                          <span className="text-2xl font-black">
                            $
                            {"price" in item
                              ? item.price
                              : "priceStructure" in item
                                ? item.priceStructure.startingPrice
                                : "Free"}
                          </span>
                        </div>
                        <button className="h-12 px-6 bg-white text-black rounded-2xl font-black text-xs uppercase tracking-[0.2em] flex items-center gap-2 group-hover:scale-105 transition-transform">
                          Full Details <ArrowRight size={14} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => setShowSummarySheet(false)}
                className="mt-8 text-white/30 text-[10px] font-black uppercase tracking-[0.3em] hover:text-white transition-colors"
              >
                Close Preview
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Immersive Detail Screen */}
      <AnimatePresence>
        {showImmersiveDetail && selectedDetail && (
          <DetailScreen
            isOpen={showImmersiveDetail}
            onClose={() => setShowImmersiveDetail(false)}
            data={selectedDetail}
          />
        )}
      </AnimatePresence>

      {/* Quick Actions Overlay (Long Press) */}
      <AnimatePresence>
        {showQuickActions && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickActions(false)}
              className="fixed inset-0 bg-black/60 z-[200] backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 m-auto w-[280px] h-fit z-[210] flex flex-col gap-2 pointer-events-none"
            >
              <div className="flex flex-col bg-[#0f0f0f]/80 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-4 pointer-events-auto shadow-2xl">
                <div className="flex flex-col items-center mb-6 pt-2">
                  <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/30">
                    Quick Actions
                  </span>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        icon: <Bookmark size={18} />,
                        label: "Save",
                        action: () => {
                          handleSaveToggle();
                          setShowQuickActions(false);
                        },
                      },
                      {
                        icon: <Share2 size={18} />,
                        label: "Share",
                        action: () => {
                          setShowShareSheet(true);
                          setShowQuickActions(false);
                        },
                      },
                      {
                        icon: <MessageSquare size={18} />,
                        label: "Comment",
                        action: () => {
                          setShowComments(true);
                          setShowQuickActions(false);
                        },
                      },
                      {
                        icon: <Calendar size={18} />,
                        label: "Book",
                        action: () => {
                          handleCtaClick();
                          setShowQuickActions(false);
                        },
                      },
                    ].map((item, idx) => (
                      <button
                        key={idx}
                        onClick={item.action}
                        className="flex flex-col items-center justify-center gap-2 p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-all active:scale-95 transition-colors"
                      >
                        <div className="text-white/60">{item.icon}</div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">
                          {item.label}
                        </span>
                      </button>
                    ))}
                  </div>

                  {/* Prominent High-Visibility Action: Report */}
                  <button
                    onClick={() => {
                      setShowReportSheet(true);
                      setShowQuickActions(false);
                    }}
                    className="mt-2 w-full py-5 rounded-[2rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center gap-3 active:scale-95 transition-all hover:bg-red-500/20 group"
                  >
                    <Flag size={18} className="text-red-500 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">
                      Report Incident
                    </span>
                  </button>
                </div>

                <button
                  onClick={() => setShowQuickActions(false)}
                  className="mt-4 w-full py-4 rounded-2xl bg-white/5 text-white/40 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Fullscreen Media Viewer */}
      <AnimatePresence>
        {showFullViewer && (() => {
          const currentMedia = content.mediaArray && content.mediaArray.length > 0
            ? content.mediaArray[mediaIndex]
            : { type: content.type, url: content.thumbnail || (content as any).mediaUrl || (content as any).url };
          if (!currentMedia || !currentMedia.url) return null;
          return (
            <FullscreenMediaViewer
              url={currentMedia.url}
              type={currentMedia.type === "video" ? "video" : "image"}
              caption={content.caption}
              onClose={() => setShowFullViewer(false)}
            />
          );
        })()}
      </AnimatePresence>

      <AnimatePresence>
        {showReportSheet && (
           <ReportSheet
              onClose={() => setShowReportSheet(false)}
              onReportSuccess={() => {
                setShowReportSheet(false);
                setIsHidden(true);
                setHiddenReason("reported");
              }}
              entityName={content.caption.substring(0, 30) + (content.caption.length > 30 ? "..." : "") || "this post"}
              targetId={id.toString()}
              targetType="post"
           />
        )}
      </AnimatePresence>
    </div>
  );
}

function RepostThoughtsPreview({
  reposts,
  onOpen,
}: {
  reposts: any[];
  onOpen: () => void;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const thoughts = reposts.filter((r) => r.repost_comment);

  // Use all reposts if no thoughts, or cycle through thoughts
  const displayItems = thoughts.length > 0 ? thoughts : reposts.slice(0, 5);

  useEffect(() => {
    if (displayItems.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [displayItems.length]);

  const activeRep = displayItems[currentIndex];
  // Avatars for the stack (up to 3)
  const previewAvatars = reposts.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onOpen}
      className="flex items-center gap-3 bg-white/5 backdrop-blur-xl border border-white/10 p-2.5 rounded-2xl cursor-pointer hover:bg-white/10 transition-colors group mb-1 w-full max-w-sm"
    >
      <div className="flex -space-x-3 shrink-0">
        {previewAvatars.map((r, i) => (
          <div
            key={r.id}
            className="w-8 h-8 rounded-full border-2 border-[#050505] overflow-hidden bg-zinc-800"
            style={{ zIndex: 3 - i }}
          >
            {r.profiles?.avatar_url ? (
              <img
                src={r.profiles.avatar_url}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
                alt=""
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white/40">
                {(r.profiles?.username || "U").charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        ))}
        {reposts.length > 3 && (
          <div className="w-8 h-8 rounded-full border-2 border-[#050505] bg-zinc-900 flex items-center justify-center text-[8px] font-bold text-white/60 z-0">
            +{reposts.length - 3}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden relative h-9 justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.5, ease: "circOut" }}
            className="absolute inset-0 flex flex-col justify-center"
          >
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-[10px] font-black text-green-400 uppercase tracking-widest truncate">
                {activeRep.profiles?.username || "Someone"} Reposted
              </span>
              <Repeat2 size={10} className="text-green-400 shrink-0" />
            </div>
            {activeRep.repost_comment ? (
              <p className="text-[12px] font-medium text-white/90 truncate leading-tight">
                "{activeRep.repost_comment}"
              </p>
            ) : (
              <p className="text-[11px] font-medium text-white/40 truncate italic leading-tight">
                shared without thoughts
              </p>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-7 h-7 rounded-full bg-white/5 flex items-center justify-center group-hover:bg-white/10 transition-colors">
        <ArrowRight
          size={14}
          className="text-white/40 group-hover:text-white transition-colors"
        />
      </div>
    </motion.div>
  );
}
