import React from 'react';
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { MapPin, Radio, Bell, Calendar, ChevronDown, MessageSquare, Search } from "lucide-react";
import FeedCard from "./FeedCard";
import LiveStreamCard from "./LiveStreamCard";

interface MainFeedHubProps {
  MOCK_HUSTLERS: any[];
  bridgeIntent: (hustler: any) => void;
  onOpenBookings?: () => void;
  onOpenActivity?: () => void;
  onOpenChat?: () => void;
  onOpenSearch?: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isNavVisible?: boolean;
  initialTab?: FeedTab;
}

type FeedTab = 'for-you' | 'live' | 'nearby';

export default function MainFeedHub({ 
  MOCK_HUSTLERS, 
  bridgeIntent, 
  onOpenBookings, 
  onOpenActivity, 
  onOpenChat, 
  onOpenSearch,
  onScroll, 
  isNavVisible = true,
  initialTab = 'for-you'
}: MainFeedHubProps) {
  const [activeTab, setActiveTab] = useState<FeedTab>(initialTab);
  
  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);
  const [scrollPositions, setScrollPositions] = useState<Record<FeedTab, number>>({
    'for-you': 0,
    'live': 0
  });
  
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const liveContainerRef = useRef<HTMLDivElement>(null);
  const [activeLiveCategory, setActiveLiveCategory] = useState('All');

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 1200);
  };

  const tabs = [
    { id: 'for-you', label: 'For You' },
    { id: 'live', label: 'Live', icon: <Radio size={12} className="animate-pulse" /> },
  ];

  const getFeedItems = () => {
    return MOCK_HUSTLERS;
  };

  const getLiveItems = () => {
    // Duplicate to make infinite scrolling feel longer
    return [...MOCK_HUSTLERS, ...MOCK_HUSTLERS].reverse();
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
    if (Math.abs(delta) > 100) { // threshold
      const currentIndex = tabs.findIndex(t => t.id === activeTab);
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

  const categories = ['Gaming', 'Recommended', 'Music', 'Trending', 'Business'];

  const getLiveByCategory = (cat: string) => {
    return getLiveItems().filter((item, i) => {
      if (cat === 'Gaming') return i % 3 === 0;
      if (cat === 'Music') return i % 4 === 0;
      return true;
    }).slice(0, 4);
  };

  const handleLiveScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    const clientHeight = e.currentTarget.clientHeight;
    
    setScrollPositions(prev => ({ ...prev, live: scrollTop }));
    onScroll?.(e);
    
    // Determine which stream is active based on scroll
    if (clientHeight > 0) {
      const index = Math.round(scrollTop / clientHeight);
      if (index !== activeStreamIndex) {
        setActiveStreamIndex(index);
      }
    }
  };

  const handleNormalScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const scrollTop = e.currentTarget.scrollTop;
    setScrollPositions(prev => ({ ...prev, [activeTab]: scrollTop }));
    onScroll?.(e);
  };

  // Restore scroll position
  useEffect(() => {
    if (activeTab === 'live' && isEnteredLive && liveContainerRef.current) {
      const targetScroll = activeStreamIndex * liveContainerRef.current.clientHeight;
      liveContainerRef.current.scrollTop = targetScroll;
    } else if (activeTab === 'live' && !isEnteredLive && scrollPositions.live) {
       // Optional: restore grid scroll? 
    } else if (containerRef.current && activeTab !== 'live') {
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
      {/* Top Navigation */}
      <header className={`absolute top-0 left-0 right-0 z-50 pt-12 pb-4 px-6 pointer-events-auto bg-gradient-to-b ${activeTab === 'live' ? 'from-black/60' : 'from-black/80'} via-black/40 to-transparent transition-all duration-500 ${isNavVisible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
        <div className="relative flex items-center justify-center mb-4">
          <div className="flex items-center gap-5">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as FeedTab)}
                className={`relative pb-1 transition-all ${
                  activeTab === tab.id 
                    ? 'text-white font-bold opacity-100 scale-105 transform origin-bottom drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]' 
                    : 'text-white/60 font-semibold opacity-70 hover:opacity-100 drop-shadow-md'
                }`}
              >
                <div className="flex items-center gap-1.5 drop-shadow-md">
                  {tab.icon && (
                    <span className={activeTab === tab.id && tab.id === 'live' ? 'text-red-500' : ''}>
                      {tab.icon}
                    </span>
                  )}
                  <span className="text-[13px]">{tab.label}</span>
                </div>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="feedTabIndicator"
                    className="absolute -bottom-1.5 left-2 right-2 h-0.5 bg-white rounded-full drop-shadow-[0_0_8px_rgba(255,255,255,0.8)]"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="absolute right-0 flex items-center gap-3">
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
                <motion.div 
                   animate={{ scale: [1, 1.3, 1] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute top-2 right-2 w-2 h-2 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.8)]" 
                />
                <Bell size={18} />
              </button>
              <button 
                onClick={onOpenChat}
                className="w-10 h-10 rounded-full bg-black/20 backdrop-blur-md flex items-center justify-center border border-white/20 cursor-pointer hover:bg-white/10 transition-colors relative shadow-lg"
              >
                <div className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
                <MessageSquare size={18} />
              </button>
          </div>
        </div>

        {/* Live Subnav Filters */}
        <AnimatePresence>
          {activeTab === 'live' && (
            <motion.div 
              initial={{ opacity: 0, height: 0, scale: 0.95 }}
              animate={{ opacity: 1, height: 'auto', scale: 1 }}
              exit={{ opacity: 0, height: 0, scale: 0.95 }}
              className="flex gap-2 overflow-x-auto no-scrollbar pointer-events-auto pb-2"
            >
              {['All', 'Nearby', 'Services', 'Products', 'Training', 'Entertainment'].map((cat) => (
                <button 
                  key={cat}
                  onClick={() => setActiveLiveCategory(cat)}
                  className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-colors border shadow-lg backdrop-blur-md ${
                    activeLiveCategory === cat 
                      ? 'bg-white text-black border-white' 
                      : 'bg-black/40 text-white border-white/20 hover:bg-white/20'
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
              {['',''].map((_, i) => (
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
              {activeTab === 'live' ? (
                 <div className="absolute inset-0 z-50 bg-black">
                    {isEnteredLive ? (
                       <div className="relative h-full w-full">
                          <button 
                            onClick={() => setIsEnteredLive(false)}
                            className="absolute top-12 left-4 z-[60] w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/20 text-white"
                          >
                            <ChevronDown className="rotate-90" size={20} />
                          </button>
                          
                          <div 
                            ref={liveContainerRef}
                            className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar bg-black"
                            onScroll={handleLiveScroll}
                            style={{ overscrollBehaviorY: 'contain' }}
                          >
                             {getLiveItems().map((hustler, idx) => (
                               <div key={`live-${idx}`} className="h-full w-full snap-start snap-always relative">
                                 <LiveStreamCard 
                                   hustler={hustler}
                                   onProfileClick={() => bridgeIntent(hustler)}
                                   isActive={idx === activeStreamIndex}
                                   isExpanded={isLiveExpanded}
                                   onExpand={() => setIsLiveExpanded(true)}
                                   onCollapse={() => setIsLiveExpanded(false)}
                                 />
                               </div>
                             ))}
                          </div>
                       </div>
                    ) : (
                       <div className="h-full w-full overflow-y-auto snap-y snap-mandatory no-scrollbar bg-[#050505]">
                          {/* Featured Secondary Scroll Feed */}
                                {getLiveItems().slice(0, 4).map((h, i) => (
                                   <div 
                                     key={`featured-${i}`}
                                     className="w-full shrink-0 snap-start snap-always relative h-[100dvh] bg-zinc-900 overflow-hidden cursor-pointer group"
                                     onClick={() => {
                                        setIsEnteredLive(true);
                                        const realIdx = getLiveItems().findIndex(item => item.id === h.id);
                                        setActiveStreamIndex(realIdx >= 0 ? realIdx : 0);
                                     }}
                                   >
                                      <img 
                                        src={h.detailData?.heroMedia?.[0] || h.creator.avatar || null} 
                                        className="w-full h-full object-cover opacity-90 group-hover:scale-105 transition-transform duration-700" 
                                        alt="featured live"
                                      />
                                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-black/60 pointer-events-none" />
                                      
                                      {/* HUD overlay minimal */}
                                      <div className="absolute top-28 left-4 flex gap-2">
                                        <div className="bg-red-500 text-white text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg flex items-center gap-1.5">
                                          <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Live
                                        </div>
                                        <div className="bg-black/60 backdrop-blur-md text-white text-xs font-bold px-2 py-1 rounded">
                                           {(Math.random() * 10 + 2).toFixed(1)}K Viewers
                                        </div>
                                      </div>

                                      <div className="absolute bottom-28 left-6 right-6">
                                         <div className="flex items-center gap-3 mb-3">
                                            <img src={`https://i.pravatar.cc/150?u=${h.creator.name}`} className="w-10 h-10 rounded-full border-2 border-white/20 shadow-xl" />
                                            <div>
                                               <h3 className="text-white font-bold text-sm tracking-tight">{h.creator.name}</h3>
                                               <p className="text-white/60 text-[10px] font-black uppercase tracking-widest">{h.category}</p>
                                            </div>
                                         </div>
                                         <h2 className="text-xl font-black text-white leading-tight line-clamp-2">
                                           Join my exclusive {h.category} masterclass right now! 🔥
                                         </h2>
                                         <p className="text-white/50 text-xs mt-3 flex items-center gap-1 font-medium group-hover:text-white/80 transition-colors">
                                            Tap to watch live <ChevronDown className="-rotate-90 animate-bounce" size={14} />
                                         </p>
                                      </div>
                                   </div>
                                ))}

                          <div className="w-full min-h-[100dvh] shrink-0 snap-start pt-28 pb-32 bg-[#050505] relative z-20 flex flex-col">
                              <div className="px-6 mb-6 flex items-center justify-between">
                             <h2 className="text-2xl font-black text-white italic tracking-tighter">Discover LIVE</h2>
                             <button className="text-xs font-bold text-white/40 uppercase tracking-widest flex items-center gap-1">
                                View all <ChevronDown className="-rotate-90" size={12} />
                             </button>
                          </div>

                          {/* Primary Categories Scroll */}
                          {categories.map((cat, catIdx) => (
                             <section key={cat} className="mb-10">
                                <div className="px-6 mb-4 flex items-center justify-between">
                                   <div className="flex items-center gap-2">
                                      <div className={`w-1 h-4 rounded-full ${catIdx === 0 ? 'bg-red-500' : 'bg-blue-500'}`} />
                                      <h3 className="text-lg font-black text-white tracking-tight">{cat}</h3>
                                   </div>
                                </div>
                                
                                <div className="flex gap-4 overflow-x-auto no-scrollbar px-6">
                                   {getLiveByCategory(cat).map((h, i) => (
                                      <div 
                                        key={i} 
                                        onClick={() => {
                                           setIsEnteredLive(true);
                                           // Find real index in getLiveItems()
                                           const realIdx = getLiveItems().findIndex(item => item.id === h.id);
                                           setActiveStreamIndex(realIdx >= 0 ? realIdx : 0);
                                        }}
                                        className="relative min-w-[200px] h-[280px] rounded-3xl bg-zinc-900 border border-white/5 overflow-hidden group cursor-pointer active:scale-95 transition-all shadow-2xl"
                                      >
                                         <img 
                                           src={h.detailData?.heroMedia?.[0] || h.creator.avatar || null} 
                                           className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700" 
                                           alt="live"
                                         />
                                         <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/30" />
                                         
                                         <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded shadow-lg">
                                            <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> LIVE
                                         </div>
                                         
                                         <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-md px-1.5 py-0.5 rounded text-[9px] font-bold text-white/90">
                                            {Math.floor(Math.random() * 5 + 1)}k viewers
                                         </div>

                                         <div className="absolute bottom-4 left-4 right-4">
                                            <h4 className="text-white text-xs font-bold line-clamp-1 mb-2">Exclusive {h.category} stream</h4>
                                            <div className="flex items-center gap-2">
                                               <img src={`https://i.pravatar.cc/150?u=${h.creator.name}`} className="w-5 h-5 rounded-full border border-white/20" />
                                               <span className="text-[10px] font-bold text-white/70 truncate">{h.creator.name}</span>
                                            </div>
                                         </div>
                                      </div>
                                   ))}
                                </div>
                             </section>
                          ))}
                       </div>
                        </div>
                    )}
                 </div>
              ) : (
                <div 
                  ref={containerRef}
                  className="h-full w-full overflow-y-scroll snap-y snap-mandatory no-scrollbar"
                  onScroll={handleNormalScroll}
                  style={{ overscrollBehaviorY: 'contain' }}
                >
                  <div className="h-24 w-full shrink-0 relative bg-transparent snap-start" /> {/* spacer */}

                  {getFeedItems().map((hustler, idx) => (
                    <div key={`${activeTab}-${idx}`} className="h-full w-full snap-start snap-always relative">
                      <FeedCard 
                        {...hustler} 
                        onProfileClick={() => bridgeIntent(hustler)}
                        recommendationReason={
                          activeTab === 'nearby' ? hustler.creator.location 
                          : hustler.recommendationReason
                        }
                        isAd={activeTab === 'for-you' && hustler.isAd}
                      />
                    </div>
                  ))}
                </div>
              )}
           </motion.div>
        </AnimatePresence>

      </div>
    </div>
  );
}

