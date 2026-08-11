import React from "react";
import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  MapPin,
  Radio,
  Bell,
  Calendar,
  ChevronDown,
  MessageSquare,
  Search,
} from "lucide-react";
import FeedCard from "./FeedCard";
import LiveStreamCardThumbnail from "./live/LiveStreamCard";
import LivePlayer from "./live/LivePlayer";
import LiveStudio from "./live/LiveStudio";
import { useLiveStore } from "../stores/useLiveStore";
import { useAuthStore } from "../features/auth/stores/useAuthStore";
import StoryBar from "./StoryBar";
import StoryViewer from "./StoryViewer";
import StoryCreator from "./StoryCreator";
import BookingContextCard from "./BookingContextCard";
import { useFeed } from "../features/feed/hooks/useFeed";
import { useBookingStore } from "../features/bookings/stores/useBookingStore";
import { useStoryDraftStore } from "../features/feed/stores/useStoryDraftStore";

import { useChatStore } from "../features/chat/stores/useChatStore";
import { useSearchStore } from "../features/feed/stores/useSearchStore";

interface MainFeedHubProps {
  MOCK_HUSTLERS?: any[]; // Keep for compatibility, but don't strictly require it
  bridgeIntent: (hustler: any) => void;
  onOpenBookings?: () => void;
  onOpenActivity?: () => void;
  onOpenChat?: () => void;
  onOpenSearch?: () => void;
  unreadCount?: number;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isNavVisible?: boolean;
  initialTab?: FeedTab;
  onQuickBook?: (hustler: any) => void;
}

type FeedTab = "for-you" | "nearby" | "following" | "learning" | "services" | "projects" | "verified" | "live";

export default function MainFeedHub({
  bridgeIntent,
  onOpenBookings,
  onOpenActivity,
  onOpenChat,
  onOpenSearch,
  unreadCount,
  onScroll,
  isNavVisible = true,
  initialTab = "for-you",
  onQuickBook,
}: MainFeedHubProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);
  const { openStoryCreator } = useStoryDraftStore();
  const { posts, refreshFeed, fetchNextPage, isFetchingMore, hasMore } = useFeed();
  const { profile } = useAuthStore();
  const { activeSessions, fetchActiveSessions } = useLiveStore();
  const { fetchBuyerOrders, fetchSellerOrders, getMostRecentActiveBooking } = useBookingStore();
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [showStudio, setShowStudio] = useState(false);

  useEffect(() => {
    fetchActiveSessions();
  }, [fetchActiveSessions]);
  const activeBooking = getMostRecentActiveBooking();

  useEffect(() => {
    fetchBuyerOrders();
    fetchSellerOrders();
  }, [fetchBuyerOrders, fetchSellerOrders]);

  const unreadChats = useChatStore(state => state.unreadCounts);
  const totalChatUnread = Object.values(unreadChats).reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [scrollPositions, setScrollPositions] = useState<
    Record<FeedTab, number>
  >({
    "for-you": 0,
    live: 0,
    nearby: 0,
    following: 0,
    learning: 0,
    services: 0,
    projects: 0,
    verified: 0,
  });

  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const liveContainerRef = useRef<HTMLDivElement>(null);
  const [activeLiveCategory, setActiveLiveCategory] = useState("All");

  const mappedFeedItems = useMemo(() => {
    if (!posts || posts.length === 0) return [];
    return posts.map((post, idx) => {
      const isRepost = !!post.is_repost;
      const targetPost = isRepost ? post.original_post : post;
      
      const creatorProfile = targetPost?.profiles || null;
      const creatorName = creatorProfile?.full_name || creatorProfile?.username || "Unknown User";
      const creatorAvatar = creatorProfile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${targetPost?.user_id || post.user_id}`;

      const isPostHustler = !!creatorProfile?.is_hustler;

      return {
        id: post.id, // Keep the outer post's ID for independent rendering and feed keys
        creator: {
          id: targetPost?.user_id || post.user_id,
          name: creatorName,
          avatar: creatorAvatar,
          category: creatorProfile?.primary_skill || creatorProfile?.profession || "Member",
          location: creatorProfile?.location || "Online",
          rating: isPostHustler ? Number(creatorProfile?.rating_average || 0) : 0,
          jobs: isPostHustler ? Number(creatorProfile?.review_count || 0) : 0,
          verified: !!creatorProfile?.verified,
          active: true,
          is_hustler: isPostHustler,
        },
        content: {
          type: targetPost?.media_type || "text",
          thumbnail: targetPost?.media_url,
          mediaUrls: targetPost?.media?.map((m: any) => m.url) || [],
          mediaArray: targetPost?.media || [],
          caption: targetPost?.caption || "",
          hasMusic: !!targetPost?.music_data,
          musicTrack: targetPost?.music_data?.title || "",
          musicData: targetPost?.music_data || null,
        },
        repost: isRepost ? {
          by: post.profiles?.full_name || post.profiles?.username || "Unknown User",
          by_id: post.user_id,
          thought: post.repost_comment || undefined
        } : undefined,
        embedCTA: (() => {
          const listing = targetPost?.attached_listing_data;
          const lType = targetPost?.attached_listing_type;
          const cta: { type: "book" | "buy" | "apply" | "ad"; label: string; price?: number } = { type: "book", label: "View Profile" };
          
          if (listing && listing.is_active !== false) { // listing.is_active is true or undefined/null (if it exists it should be active due to our query)
            if (lType === 'product') {
              cta.type = "buy";
              cta.label = `Buy ${listing.title}`;
              cta.price = listing.price;
            } else if (lType === 'service') {
              cta.type = "book";
              cta.label = `Book ${listing.title}`;
              cta.price = listing.base_price;
            } else if (lType === 'training') {
              cta.type = "book";
              cta.label = `Join ${listing.title}`;
              cta.price = listing.price;
            }
          }

          return cta;
        })(),
        detailData: {
          id: targetPost?.id || post.id,
          type: targetPost?.attached_listing_type === "product"
            ? "product"
            : targetPost?.attached_listing_type === "training"
              ? "training"
              : "service",
          title: targetPost?.attached_listing_data?.title || targetPost?.caption?.slice(0, 50) || "Profile",
          description: targetPost?.attached_listing_data?.description || targetPost?.caption,
          price: targetPost?.attached_listing_data?.price || targetPost?.attached_listing_data?.base_price,
          heroMedia: [targetPost?.media_url || targetPost?.thumbnail_url || ""].filter(Boolean),
          creator: {
            id: targetPost?.user_id || post.user_id,
            name: creatorName,
            avatar: creatorAvatar,
            category: creatorProfile?.primary_skill || creatorProfile?.profession || "Member",
            location: creatorProfile?.location || "Online",
            rating: isPostHustler ? Number(creatorProfile?.rating_average || 0) : 0,
            verified: !!creatorProfile?.verified,
            is_hustler: isPostHustler,
          },
          reviews: [],
          recommendations: [],
          socialStats: {
            likes: targetPost?.likes_count || 0,
            shares: post.reposts_count || 0,
            saves: targetPost?.saves_count || 0,
          },
          ...(targetPost?.attached_listing_type === "product"
            ? { stockStatus: "in-stock" as const, features: ["Escrow protected", "Fast delivery"] }
            : targetPost?.attached_listing_type === "training"
              ? { mentor: { id: targetPost?.user_id || post.user_id, name: creatorName, avatar: creatorAvatar, category: creatorProfile?.primary_skill || creatorProfile?.profession || "Member", location: creatorProfile?.location || "Online", rating: isPostHustler ? Number(creatorProfile?.rating_average || 0) : 0, verified: !!creatorProfile?.verified, is_hustler: isPostHustler }, curriculum: [{ module: "Start here", topics: ["Welcome"] }], duration: "1 week", format: "online" as const, outcomes: ["Build confidence"], requirements: ["Bring curiosity"] }
              : { priceStructure: { startingPrice: Number(targetPost?.attached_listing_data?.base_price || 0), packages: [] }, portfolio: [] })
        } as any,
        recommendationReason: "Based on your activity",
        isAd: false,
      };
    });
  }, [posts]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    refreshFeed();
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const tabs = [
    { id: "for-you", label: "For You" },
    { id: "nearby", label: "Nearby" },
    { id: "following", label: "Following" },
    { id: "learning", label: "Learning" },
    { id: "services", label: "Services" },
    { id: "projects", label: "Projects" },
    { id: "verified", label: "Verified" },
    {
      id: "live",
      label: "Live",
      icon: <Radio size={12} className="animate-pulse" />,
    },
  ];

  const getFeedItems = () => {
    return mappedFeedItems.length > 0 ? mappedFeedItems : [];
  };

  const getLiveItems = () => {
    return mappedFeedItems.length > 0 ? mappedFeedItems : [];
  };

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    const delta = touchStartX.current - touchEndX.current;
    if (Math.abs(delta) > 100) {
      // threshold
      const currentIndex = tabs.findIndex((t) => t.id === activeTab);
      if (delta > 0 && currentIndex < tabs.length - 1) {
        setActiveTab(tabs[currentIndex + 1].id as FeedTab);
      } else if (delta < 0 && currentIndex > 0) {
        setActiveTab(tabs[currentIndex - 1].id as FeedTab);
      }
    }
  };

  const [activeStreamIndex, setActiveStreamIndex] = useState(0);
  const [isEnteredLive, setIsEnteredLive] = useState(false);
  const [isLiveExpanded, setIsLiveExpanded] = useState(true);

  const categories = ["Gaming", "Recommended", "Music", "Trending", "Business"];

  const getLiveByCategory = (cat: string) => {
    return getLiveItems()
      .filter((item, i) => {
        if (cat === "Gaming") return i % 3 === 0;
        if (cat === "Music") return i % 4 === 0;
        return true;
      })
      .slice(0, 4);
  };

  const handleLiveScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    setScrollPositions((prev) => ({ ...prev, live: scrollTop }));
    onScroll?.(e);

    // Pagination for Live too
    if (hasMore && !isFetchingMore) {
        if (scrollTop + clientHeight >= scrollHeight - clientHeight * 2) {
            fetchNextPage();
        }
    }

    // Determine which stream is active based on scroll
    if (clientHeight > 0) {
      const index = Math.round(scrollTop / clientHeight);
      if (index !== activeStreamIndex) {
        setActiveStreamIndex(index);
      }
    }
  };

  const handleNormalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    setScrollPositions((prev) => ({ ...prev, [activeTab]: scrollTop }));
    onScroll?.(e);

    // Infinite Pagination logic
    if (hasMore && !isFetchingMore) {
      // Trigger when user has 2 screens left to scroll
      if (scrollTop + clientHeight >= scrollHeight - clientHeight * 2) {
        fetchNextPage();
      }
    }
  };

  // Restore scroll position
  useEffect(() => {
    if (activeTab === "live" && isEnteredLive && liveContainerRef.current) {
      const targetScroll =
        activeStreamIndex * liveContainerRef.current.clientHeight;
      liveContainerRef.current.scrollTop = targetScroll;
    } else if (activeTab === "live" && !isEnteredLive && scrollPositions.live) {
      // Optional: restore grid scroll?
    } else if (containerRef.current && activeTab !== "live") {
      containerRef.current.scrollTop = scrollPositions[activeTab] || 0;
    }
  }, [activeTab, isEnteredLive, activeStreamIndex]);

  return (
    <div
      className="relative w-full h-full bg-black text-white"
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <StoryViewer />
      {/* Top Navigation */}
      <header
        className={`absolute top-0 left-0 right-0 z-50 pt-12 pb-4 px-4 pointer-events-auto bg-gradient-to-b ${activeTab === "live" ? "from-black/60" : "from-black/80"} via-black/40 to-transparent transition-all duration-500 ${isNavVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 px-2">
            <span className="text-2xl font-black italic tracking-tighter text-white drop-shadow-md">HUSTLE</span>
          </div>

          <div className="flex items-center gap-3">
            {activeTab === "live" && (profile?.is_hustler || profile?.is_agent || profile?.role === 'hustler') && (
               <button
                 onClick={() => setShowStudio(true)}
                 className="flex items-center gap-2 bg-red-500 text-white px-3 h-10 rounded-xl shadow-[0_0_20px_rgba(239,68,68,0.4)] active:scale-95 transition-all text-xs font-black uppercase tracking-widest"
               >
                 <Radio size={14} className="animate-pulse" /> Go Live
               </button>
            )}
            <button
              onClick={onOpenSearch}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/10 transition-colors shadow-lg"
            >
              <Search size={18} />
            </button>
            <button
              onClick={onOpenBookings}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/10 transition-colors relative shadow-lg"
            >
              <div className="w-2 h-2 rounded-full bg-blue-500 absolute top-2 right-2 shadow-[0_0_8px_rgba(59,130,246,0.8)]" />
              <Calendar size={18} />
            </button>
            <button
              onClick={onOpenActivity}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/10 transition-colors relative shadow-lg"
            >
              {(unreadCount || 0) > 0 && (
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]"
                />
              )}
              <Bell size={18} />
            </button>
            <button
              onClick={onOpenChat}
              className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/10 transition-colors relative shadow-lg"
            >
              {totalChatUnread > 0 && <div className="w-2 h-2 rounded-full bg-brand-primary absolute top-2 right-2 shadow-[0_0_8px_rgba(255,255,255,0.8)]" />}
              <MessageSquare size={18} />
            </button>
          </div>
        </div>

        {/* Horizontal Chips for Feeds */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 px-2 pointer-events-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as FeedTab)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all border shadow-md backdrop-blur-md ${
                activeTab === tab.id
                  ? (tab.id === "live" ? "bg-red-600 text-white border-red-500" : "bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.3)]")
                  : "bg-black/50 text-white/70 border-white/10 hover:bg-white/20 hover:text-white"
              }`}
            >
              {tab.icon && <span className={activeTab === tab.id ? "" : "text-white/50"}>{tab.icon}</span>}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Live Subnav Filters */}
        <AnimatePresence>
          {activeTab === "live" && (
            <motion.div
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: "auto", scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2"
            >
              {[
                "All",
                "Nearby",
                "Services",
                "Products",
                "Training",
                "Entertainment",
              ].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setActiveLiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border shadow-lg backdrop-blur-md ${
                    activeLiveCategory === cat
                      ? "bg-white text-black border-white"
                      : "bg-black/40 text-white border-white/20 hover:bg-white/20"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Main Feed Content Area */}
      <div className="w-full h-full bg-black relative">
        <AnimatePresence mode="wait">
          {isRefreshing && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 bg-black flex flex-col pt-32 px-4 gap-6 pointer-events-none"
            >
              {["", ""].map((_, i) => (
                <div key={i} className="flex-1 animate-pulse space-y-4">
                  <div className="w-full h-[60%] rounded-2xl bg-white/[0.03]" />
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/[0.03]" />
                    <div className="space-y-2 flex-1">
                      <div className="w-1/3 h-3 rounded bg-white/[0.03]" />
                      <div className="w-1/2 h-2 rounded bg-white/[0.03]" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-2 rounded bg-white/[0.03]" />
                    <div className="w-5/6 h-2 rounded bg-white/[0.03]" />
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence initial={false} custom={activeTab}>
          <motion.div
            key={activeTab}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full w-full absolute inset-0"
          >
            {activeTab === "live" ? (
              <div className="absolute inset-0 z-50 bg-[#050505] overflow-y-auto no-scrollbar pb-32">
                
                {/* Active Live Horizontal Scroll */}
                <section className="pt-28 px-6 mb-10 overflow-hidden">
                   <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-2">
                         <div className="w-1.5 h-6 bg-red-500 rounded-full" />
                         <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase font-display">Active Hustles</h2>
                      </div>
                      <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">{activeSessions.length} Online Now</span>
                   </div>

                   {activeSessions.length > 0 ? (
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                        {activeSessions.map((session) => (
                           <LiveStreamCardThumbnail 
                             key={session.id} 
                             session={session} 
                             onClick={() => setViewingSessionId(session.id)}
                           />
                        ))}
                      </div>
                   ) : (
                      <div className="p-12 rounded-[2.5rem] bg-white/[0.02] border border-white/5 border-dashed flex flex-col items-center justify-center gap-4 text-center">
                         <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center text-white/10">
                            <Radio size={32} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">No active streams</p>
                            <p className="text-[9px] text-white/20 font-medium px-8 mt-1 italic">Hustlers are currently preparing their showcases. Check back soon!</p>
                         </div>
                      </div>
                   )}
                </section>

                {/* Categories & Recommended (Mock layout for depth) */}
                {activeSessions.length > 0 && categories.map((cat, catIdx) => (
                    <section key={cat} className="mb-10 px-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-black text-white/40 uppercase tracking-widest">{cat}</h3>
                        <ChevronDown className="-rotate-90 text-white/20" size={14} />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                         {activeSessions.slice(0, 2).map((session) => (
                            <div 
                              key={`grid-${session.id}`}
                              onClick={() => setViewingSessionId(session.id)}
                              className="aspect-video rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden relative cursor-pointer active:scale-[0.98] transition-all"
                            >
                               {session.thumbnail_url && <img src={session.thumbnail_url} className="w-full h-full object-cover opacity-60" />}
                               <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                               <div className="absolute bottom-3 left-3 right-3 flex flex-col">
                                  <span className="text-[9px] font-black text-white truncate">{session.title}</span>
                                  <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">{session.host_profiles?.hustle_name || 'Hustler'}</span>
                               </div>
                            </div>
                         ))}
                      </div>
                    </section>
                ))}
                
                {/* Fallback discovery if no active sessions */}
                {activeSessions.length === 0 && (
                   <section className="px-6 mb-12">
                      <div className="p-8 rounded-[3rem] bg-gradient-to-br from-red-500/10 to-transparent border border-red-500/20">
                         <h3 className="text-xl font-black text-white italic tracking-tighter mb-2">Want to lead the way?</h3>
                         <p className="text-[10px] text-white/50 leading-relaxed font-medium mb-6 uppercase tracking-wider">Start a live session to showcase your expertise, sell products, or guide your team in real-time.</p>
                         {(profile?.is_hustler || profile?.is_agent || profile?.role === 'hustler') ? (
                           <button onClick={() => setShowStudio(true)} className="h-14 w-full bg-red-500 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl flex items-center justify-center gap-2">
                             <Radio size={14} className="animate-pulse" /> Launch Your Stream
                           </button>
                         ) : (
                           <button className="h-14 w-full bg-white/5 text-white/40 font-black uppercase tracking-widest text-[10px] rounded-2xl border border-white/10">Become a Creator to Stream</button>
                         )}
                      </div>
                   </section>
                )}
              </div>
            ) : (
              <div
                ref={containerRef}
                className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                onScroll={handleNormalScroll}
                style={{ overscrollBehaviorY: "contain" }}
              >
                <div className="w-full shrink-0 relative bg-transparent snap-start pt-24 pb-2 z-40">
                  <StoryBar onAddStory={openStoryCreator} />
                  
                  {activeBooking && (
                    <BookingContextCard 
                      booking={activeBooking} 
                      onOpenBooking={() => onOpenBookings?.()} 
                    />
                  )}
                </div>

                {getFeedItems().length === 0 && !isFetchingMore && !hasMore && (
                   <div className="w-full h-screen flex flex-col items-center justify-center p-12 text-center snap-start -mt-24">
                     {!navigator.onLine ? (
                        <div className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 flex flex-col items-center w-full">
                          <Radio size={40} className="text-white/20 mb-6 opacity-50" />
                          <h3 className="text-xl font-black italic tracking-tighter text-white mb-2 uppercase">No Connection</h3>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed">Please check your internet connection and try again.</p>
                        </div>
                     ) : activeTab === "nearby" ? (
                        <div className="p-8 rounded-[3rem] bg-gradient-to-br from-blue-500/10 to-transparent border border-blue-500/20 flex flex-col items-center w-full">
                          <MapPin size={40} className="text-blue-400 mb-6 opacity-80" />
                          <h3 className="text-xl font-black italic tracking-tighter text-white mb-2 uppercase">No Recommendations</h3>
                          <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest leading-relaxed mb-6">Expand your location area</p>
                          <button onClick={() => setActiveTab("for-you")} className="px-6 py-3 bg-blue-600 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-blue-500 transition-colors">Go to For You</button>
                        </div>
                     ) : (
                        <div className="p-8 rounded-[3rem] bg-white/[0.02] border border-white/5 flex flex-col items-center w-full">
                          <Search size={40} className="text-white/20 mb-6 opacity-50" />
                          <h3 className="text-xl font-black italic tracking-tighter text-white mb-2 uppercase">Feed Empty</h3>
                          <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest leading-relaxed mb-6">No content available for this category.</p>
                          <button onClick={() => setActiveTab("for-you")} className="px-6 py-3 bg-white/10 text-white font-black uppercase tracking-widest text-[10px] rounded-xl hover:bg-white/20 transition-colors">Reset Feed</button>
                        </div>
                     )}
                   </div>
                )}

                {getFeedItems().map((hustler) => (
                  <div
                    key={`${activeTab}-${hustler.id}`}
                    className="h-full w-full snap-start snap-always relative"
                  >
                    <FeedCard
                      {...hustler}
                      onProfileClick={() => bridgeIntent(hustler)}
                      recommendationReason={
                        activeTab === "nearby"
                          ? hustler.creator.location
                          : hustler.recommendationReason
                      }
                      isAd={activeTab === "for-you" && hustler.isAd}
                      onBook={() => onQuickBook?.({
                        id: hustler.id,
                        creatorId: hustler.creator.id,
                        title: hustler.detailData?.title || "Custom Service",
                        price: hustler.embedCTA?.price || 500,
                        type: hustler.detailData?.type || 'service'
                      })}
                      onSkillTagClick={(skill) => {
                        useSearchStore.getState().setSearchQuery(skill);
                        useSearchStore.getState().globalSearch(skill);
                        onOpenSearch?.();
                      }}
                    />
                  </div>
                ))}

                {/* Pagination Spinner */}
                {(isFetchingMore || hasMore) && (
                  <div className="w-full py-20 flex flex-col items-center justify-center gap-4 snap-start">
                    <div className="w-8 h-8 rounded-full border-2 border-white/5 border-t-white/40 animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/20">
                      Loading More
                    </span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      <StoryCreator />

      {/* Live Stream View Modals */}
      <AnimatePresence>
        {viewingSessionId && (
          <LivePlayer 
            sessionId={viewingSessionId} 
            onClose={() => setViewingSessionId(null)} 
          />
        )}
        {showStudio && (
          <LiveStudio 
            onClose={() => setShowStudio(false)} 
          />
        )}
      </AnimatePresence>
    </div>
  );
}
