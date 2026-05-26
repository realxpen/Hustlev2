import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDiscoveryStore } from "../features/feed/stores/useDiscoveryStore";
import {
  Search,
  MapPin,
  Star,
  ChevronRight,
  TrendingUp,
  Clock,
  History,
  X,
  ShieldCheck,
  Sparkles,
  BrainCircuit,
  Filter,
  SlidersHorizontal,
  ShoppingBag,
  GraduationCap,
  Play,
  Briefcase,
  Zap,
  Flame,
  MoveUpRight,
  Bookmark,
  CheckCircle2,
  Navigation,
  Grid,
  User,
  ArrowRight,
  Map as MapIcon,
} from "lucide-react";
import NearbyMap from "./NearbyMap";

interface DiscoveryViewProps {
  onProfileSelect: (hustler: any) => void;
  onOpenTrustCenter: () => void;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  isNavVisible?: boolean;
  onClose?: () => void;
}

type SearchIntent =
  | "any"
  | "service"
  | "product"
  | "training"
  | "inspiration"
  | "hustler";

const CATEGORIES = [
  {
    id: 1,
    name: "Barbers",
    icon: "✂️",
    color: "from-blue-500/20",
    intent: "service" as SearchIntent,
  },
  {
    id: 2,
    name: "Designers",
    icon: "🎨",
    color: "from-purple-500/20",
    intent: "service" as SearchIntent,
  },
  {
    id: 3,
    name: "Tailors",
    icon: "🧵",
    color: "from-orange-500/20",
    intent: "service" as SearchIntent,
  },
  {
    id: 4,
    name: "Makeup",
    icon: "💄",
    color: "from-pink-500/20",
    intent: "service" as SearchIntent,
  },
  {
    id: 5,
    name: "Devs",
    icon: "💻",
    color: "from-emerald-500/20",
    intent: "service" as SearchIntent,
  },
  {
    id: 6,
    name: "Photo",
    icon: "📸",
    color: "from-indigo-500/20",
    intent: "service" as SearchIntent,
  },
];

const SUGGESTIONS = [
  {
    text: "Best barber near me",
    intent: "service" as SearchIntent,
    icon: <Search size={12} />,
  },
  {
    text: "Learn UI/UX design",
    intent: "training" as SearchIntent,
    icon: <GraduationCap size={12} />,
  },
  {
    text: "Buy native dashiki",
    intent: "product" as SearchIntent,
    icon: <ShoppingBag size={12} />,
  },
  {
    text: "Top rated designers",
    intent: "hustler" as SearchIntent,
    icon: <Star size={12} />,
  },
  {
    text: "Creative inspiration",
    intent: "inspiration" as SearchIntent,
    icon: <Sparkles size={12} />,
  },
];

const RECENT_SEARCHES = ["Barbershop", "Wedding tailoring", "Fullstack dev"];

const RECOMMENDATIONS = [
  {
    id: "rec1",
    name: "Marcus V.",
    category: "UI Specialist",
    reason: "Because you liked 'Digital Art'",
    rating: 4.9,
    jobs: 88,
    avatar: "M",
    location: "Online",
    price: "$45/hr",
    type: "hustler",
    is_hustler: true,
  },
  {
    id: "rec2",
    name: "Ayo B.",
    category: "Native Tailor",
    reason: "Popular near your location",
    rating: 5.0,
    jobs: 124,
    avatar: "A",
    location: "0.5km away",
    price: "From $120",
    type: "service",
    is_hustler: true,
  },
];

export default function DiscoveryView({
  onProfileSelect,
  onOpenTrustCenter,
  onScroll,
  isNavVisible = true,
  onClose,
}: DiscoveryViewProps) {
  const { 
    trendingHashtags, 
    isLoadingTrending, 
    fetchTrending, 
    performUnifiedSearch, 
    searchResults, 
    isLoadingExplore,
    recentSearches,
    clearRecentSearches,
    suggestedCreators,
    isLoadingCreators,
    fetchSuggestedCreators
  } = useDiscoveryStore();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [activeIntent, setActiveIntent] = useState<SearchIntent>("any");
  const [showFilters, setShowFilters] = useState(false);
  const [momentGreeting, setMomentGreeting] = useState("Good Vibes");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setMomentGreeting("Morning Grind");
    else if (hour < 18) setMomentGreeting("Afternoon Hustle");
    else setMomentGreeting("Evening Vibe");
    
    fetchTrending();
    fetchSuggestedCreators();
  }, [fetchTrending, fetchSuggestedCreators]);

  useEffect(() => {
    if (searchQuery.length >= 2) {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        performUnifiedSearch(searchQuery, activeIntent);
      }, 400);
    }
  }, [searchQuery, activeIntent, performUnifiedSearch]);

  const detectIntent = (query: string): SearchIntent => {
    const q = query.toLowerCase();
    if (q.includes("buy") || q.includes("shop") || q.includes("product"))
      return "product";
    if (
      q.includes("learn") ||
      q.includes("training") ||
      q.includes("course") ||
      q.includes("apprenticeship")
    )
      return "training";
    if (q.includes("hire") || q.includes("service") || q.includes("hustler"))
      return "service";
    if (q.includes("inspiration") || q.includes("video") || q.includes("posts"))
      return "inspiration";
    return "any";
  };

  const handleSearchChange = (val: string) => {
    setSearchQuery(val);
    const intent = detectIntent(val);
    setActiveIntent(intent);
    setIsSearching(val.length > 0);
    setShowSuggestions(val.length > 0);
  };

  const getResultsCount = () => {
    if (!searchResults) return "Mixed Results";
    const total = (searchResults.services?.length || 0) + 
                  (searchResults.products?.length || 0) + 
                  (searchResults.training?.length || 0) + 
                  (searchResults.hustlers?.length || 0);
    return `${total} Matches Found`;
  };

  const renderResultCard = (item: any, type: 'service' | 'product' | 'training' | 'hustler', i: number) => {
    const profiles = item.profiles || item; // Hustler is already a profile
    const name = type === 'hustler' ? (profiles.hustle_name || profiles.full_name) : item.title;
    const creatorName = profiles.hustle_name || profiles.full_name || "Creator";
    const avatar = profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profiles.id}`;
    const price = type === 'hustler' ? "Profile" : `$${item.base_price || item.price || 0}`;
    const desc = type === 'hustler' ? profiles.primary_skill : (item.category || item.product_type || "Marketplace");
    const actionLabel = type === 'hustler' ? "View Profile" : 
                       type === 'service' ? "Book Service" :
                       type === 'product' ? "Buy Product" : "Join Training";

    return (
      <motion.div
        key={`${type}-${item.id}`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="group relative"
      >
        <div
          className="p-6 rounded-[2.5rem] transition-all relative overflow-hidden backdrop-blur-md shadow-2xl border bg-[#0c0c0c] border-white/5 hover:border-white/20 active:scale-[0.99] cursor-pointer"
          onClick={() =>
            onProfileSelect({
              creator: { ...(profiles || {}), id: type === 'hustler' ? item.id : item.owner_id },
              listing: type !== 'hustler' ? item : undefined,
              type: type
            })
          }
        >
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center font-display font-black text-2xl relative overflow-hidden">
                <img
                  src={avatar}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h5 className="font-black text-lg uppercase tracking-tighter text-white truncate max-w-[140px]">
                    {name}
                  </h5>
                  {profiles.verified && (
                    <CheckCircle2 size={16} className="text-blue-500 shrink-0" />
                  )}
                </div>
                <p className="text-[11px] text-white/30 uppercase tracking-[0.2em] font-black truncate">
                  {type === 'hustler' ? 'Professional' : `${type.charAt(0).toUpperCase() + type.slice(1)}`} • {creatorName}
                </p>
              </div>
            </div>
            <div className="flex flex-col items-end shrink-0">
              <div className="text-xl font-black text-white tracking-tighter">
                {price}
              </div>
              <span className="text-[8px] font-black text-white/30 uppercase tracking-widest">
                {type === 'hustler' ? 'Hustler' : 'Active'}
              </span>
            </div>
          </div>

          {/* Media Preview if exists */}
          {item.media && Array.isArray(item.media) && item.media.length > 0 && (
            <div className="flex gap-2 overflow-x-auto no-scrollbar mb-6">
              {item.media.slice(0, 3).map((m: any, idx: number) => (
                <div
                  key={idx}
                  className="w-24 aspect-[4/5] rounded-2xl bg-white/5 border border-white/5 overflow-hidden flex-shrink-0 group-hover:scale-[1.02] transition-transform"
                >
                  <img src={m.url} className="w-full h-full object-cover" />
                </div>
              ))}
            </div>
          )}

          <div className="flex items-center gap-2 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-[9px] font-black text-white/40 uppercase tracking-widest">
              <Sparkles size={12} className="text-blue-400" />
              <span>Verified Match</span>
            </div>
            
            <div className="ml-auto flex items-center gap-2">
              <span className="text-[9px] font-black uppercase text-blue-500 tracking-[0.2em]">{actionLabel}</span>
              <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                <ArrowRight size={18} />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div
      className="h-full bg-transparent text-white p-6 pb-24 overflow-y-auto no-scrollbar relative"
      id="discovery-view"
      onScroll={onScroll}
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Global Search Interface */}
      <header
        className={`pt-4 mb-8 sticky top-0 z-[60] bg-[#050505]/80 backdrop-blur-xl -mx-6 px-6 pb-4 transition-all duration-500 ${isNavVisible ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0 pointer-events-none"}`}
      >
        <div className="flex justify-between items-start mb-6">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-400 animate-pulse" />
              <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">
                {momentGreeting}
              </h2>
            </div>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest italic">
              Matching intent with opportunity
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          )}
        </div>

        <div className="relative group">
          <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-white/60 transition-colors">
            <Search size={18} />
          </div>
          <input
            ref={searchInputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            onFocus={() => {
              if (searchQuery.length > 0) setShowSuggestions(true);
              setIsSearching(searchQuery.length > 0);
            }}
            placeholder="Search by intent: hire, buy, learn..."
            className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-24 text-sm font-light outline-none focus:border-white/30 focus:bg-white/5 transition-all shadow-2xl"
          />

          <div className="absolute inset-y-0 right-2 flex items-center gap-1.5">
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setIsSearching(false);
                  setShowSuggestions(false);
                  setActiveIntent("any");
                }}
                className="w-8 h-8 rounded-full flex items-center justify-center text-white/20 hover:text-white transition-colors"
              >
                <X size={16} />
              </button>
            )}
            <div className="w-px h-6 bg-white/10" />
            <button
              onClick={() => setShowFilters(true)}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${showFilters ? "bg-blue-600 text-white" : "bg-white/5 text-white/40 hover:text-white"}`}
            >
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </div>

        {/* Intent Detection Visualizer */}
        <AnimatePresence>
          {isSearching && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-3 flex gap-2 overflow-x-auto no-scrollbar"
            >
              {[
                { id: "any", label: "All Results", icon: <Grid size={10} /> },
                { id: "hustler", label: "Hustlers", icon: <User size={10} /> },
                { id: "service", label: "Services", icon: <Zap size={10} /> },
                {
                  id: "product",
                  label: "Stall Items",
                  icon: <ShoppingBag size={10} />,
                },
                {
                  id: "training",
                  label: "Academy",
                  icon: <GraduationCap size={10} />,
                },
              ].map((pill) => (
                <button
                  key={pill.id}
                  onClick={() => setActiveIntent(pill.id as SearchIntent)}
                  className={`px-3 py-1.5 rounded-full flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                    activeIntent === pill.id
                      ? "bg-blue-600 border-blue-500 text-white shadow-lg"
                      : "bg-white/5 border border-white/5 text-white/40 hover:bg-white/10"
                  }`}
                >
                  {pill.icon}
                  {pill.label}
                </button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      {/* Suggestion Overlay */}
      <AnimatePresence>
        {showSuggestions && !isSearching && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-x-6 top-[180px] z-[55] bg-[#0c0c0c] border border-white/10 rounded-[2rem] shadow-[0_40px_80px_rgba(0,0,0,0.8)] p-6 overflow-hidden"
          >
            <div className="flex flex-col gap-6">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-[10px] uppercase font-black tracking-widest text-white/20 flex items-center gap-2">
                    <History size={10} /> Recent Searches
                  </h4>
                  {recentSearches.length > 0 && (
                    <button 
                      onClick={() => clearRecentSearches()}
                      className="text-[9px] font-black uppercase tracking-widest text-brand-primary hover:text-white transition-colors"
                    >
                      Clear
                    </button>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.length === 0 ? (
                    <p className="text-[10px] text-white/20 italic">No recent searches</p>
                  ) : (
                    recentSearches.map((s, i) => (
                      <button
                        key={i}
                        onClick={() => handleSearchChange(s)}
                        className="px-3 py-2 rounded-xl bg-white/5 text-[10px] text-white/60 font-medium hover:bg-white/10 transition-colors"
                      >
                        {s}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <h4 className="text-[10px] uppercase font-black tracking-widest text-white/20 mb-3 flex items-center gap-2">
                  <TrendingUp size={10} /> Trending Hashtags
                </h4>
                <div className="flex flex-col gap-1">
                  {isLoadingTrending ? (
                    <div className="text-xs text-white/40 italic">Loading trends...</div>
                  ) : trendingHashtags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => handleSearchChange(`#${tag.tag_name}`)}
                      className="flex items-center justify-between p-3 rounded-xl hover:bg-white/5 group transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black text-brand-primary">#</span>
                        <span className="text-xs font-medium text-white/80">{tag.tag_name}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-[10px] text-white/30">{tag.usage_count} posts</span>
                        <MoveUpRight
                          size={12}
                          className="text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all"
                        />
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div
            key="default-discovery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Intelligence Insights Summary */}
            <section className="mb-8">
              <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 via-blue-900/10 to-transparent border border-blue-500/20 relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center text-blue-400 shadow-inner">
                      <BrainCircuit size={16} />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">
                      Match-Engine Intelligence
                    </h4>
                  </div>
                  <h3 className="text-lg font-display font-black leading-tight text-white mb-2">
                    Finding 12 experts currently nearby.
                  </h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black">
                    Contextual relevance: HIGH
                  </p>
                </div>
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 group-hover:scale-110 transition-all">
                  <Navigation size={80} />
                </div>
              </div>
            </section>

            {/* Smart Category Exploration */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6 px-1">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 flex items-center gap-2">
                  <Grid size={12} /> Explore Services
                </h4>
                <button
                  onClick={() => setIsMapOpen(true)}
                  className="flex items-center gap-2 text-[10px] font-black text-blue-500 uppercase tracking-widest hover:text-blue-400 p-1"
                >
                  <MapPin size={12} className="text-blue-500" /> View Map
                </button>
              </div>
              <div className="grid grid-cols-3 gap-4">
                {CATEGORIES.map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => handleSearchChange(cat.name)}
                    className={`aspect-square rounded-3xl bg-[#0c0c0c] border border-white/5 flex flex-col items-center justify-center gap-3 hover:bg-white/5 transition-all group active:scale-[0.95] relative overflow-hidden shadow-2xl`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${cat.color} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`}
                    />
                    <span className="text-3xl group-hover:scale-110 transition-transform relative z-10">
                      {cat.icon}
                    </span>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 group-hover:text-white/80 relative z-10 transition-colors">
                      {cat.name}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* AI-Driven Match Grid/Feed */}
            <section className="mb-12">
              <div className="flex items-center gap-2 mb-6 px-1">
                <Flame size={14} className="text-orange-500" />
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">
                  Trending Near You
                </h4>
              </div>
              <div className="flex flex-col gap-4">
                {isLoadingCreators ? (
                  <div className="py-20 flex flex-col items-center justify-center gap-4">
                    <BrainCircuit className="text-blue-500 animate-spin" size={32} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Finding best matches...</p>
                  </div>
                ) : suggestedCreators.length === 0 ? (
                  <div className="py-20 text-center">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">No creators found nearby.</p>
                  </div>
                ) : (
                  suggestedCreators.map((rec) => (
                    <motion.div
                      key={rec.id}
                      whileTap={{ scale: 0.98 }}
                      className="p-6 rounded-[2.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-6 group hover:border-blue-500/30 transition-all cursor-pointer relative overflow-hidden"
                      onClick={() =>
                        onProfileSelect({
                          creator: {
                            ...rec,
                            name: rec.hustle_name || rec.full_name,
                            verified: true,
                            is_hustler: true,
                          },
                        })
                      }
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-xl font-bold overflow-hidden">
                            <img src={rec.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${rec.id}`} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-black text-base uppercase tracking-tight text-white">
                                {rec.hustle_name || rec.full_name}
                              </h5>
                              <CheckCircle2 size={16} className="text-blue-500" />
                            </div>
                            <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">
                              {rec.primary_skill || "Professional"}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                            <Star
                              size={10}
                              className="text-yellow-500 fill-yellow-500"
                            />
                            <span className="text-[10px] font-black text-white">
                              {rec.rating_average ? rec.rating_average.toFixed(1) : (rec.review_count > 0 ? "4.9" : "New")}
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                            {rec.followers_count || 0} Followers
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                          <MapPin size={12} className="text-white/20" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
                            Remote
                          </span>
                        </div>
                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5">
                          <Zap size={12} className="text-blue-400" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-white/80">
                            Available
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-4 border-t border-white/5">
                        <BrainCircuit size={12} className="text-blue-500/40" />
                        <span className="text-[10px] text-white/40 font-black uppercase tracking-widest leading-none">
                          Matched with your intent
                        </span>
                        <div className="ml-auto w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-xl active:scale-90 transition-all font-black">
                          <ArrowRight size={18} />
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 p-4 opacity-0 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={60} className="text-blue-500" />
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </section>
          </motion.div>
        ) : (
          <motion.div
            key="search-results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col gap-6"
          >
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-1">
                <h4 className="text-[11px] font-black uppercase tracking-[0.3em] text-white/40">
                  {getResultsCount()}
                </h4>
                <div className="flex items-center gap-2">
                  <Clock size={12} className="text-blue-400" />
                  <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
                    Available Now
                  </span>
                </div>
              </div>
            </div>

            {/* Smart Search Result Cards (Unified Design) */}
            {isLoadingExplore && (
              <div className="py-20 flex flex-col items-center justify-center gap-4">
                <BrainCircuit className="text-blue-500 animate-pulse" size={40} />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Scanning network for {searchQuery}...</p>
              </div>
            )}
            
            {!isLoadingExplore && searchResults && (
              <>
                {searchResults.hustlers?.map((h, i) => renderResultCard(h, 'hustler', i))}
                {searchResults.services?.map((s, i) => renderResultCard(s, 'service', i))}
                {searchResults.products?.map((p, i) => renderResultCard(p, 'product', i))}
                {searchResults.training?.map((t, i) => renderResultCard(t, 'training', i))}
                
                {(!searchResults.hustlers?.length && !searchResults.services?.length && !searchResults.products?.length && !searchResults.training?.length) && (
                  <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                    <Sparkles className="text-white/10" size={40} />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">No direct matches for your intent.</p>
                    <button 
                      onClick={() => setSearchQuery("")}
                      className="text-[9px] font-black uppercase tracking-widest text-blue-500 mt-4 underline"
                    >
                      Clear Search
                    </button>
                  </div>
                )}
              </>
            )}

            {!isLoadingExplore && !searchResults && searchQuery.length > 0 && (
              <div className="py-20 text-center">
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Type more to scan local grid...</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Advanced Filter Overlay */}
      <AnimatePresence>
        {isMapOpen && (
          <NearbyMap
            onProfileSelect={(hustler) => {
              onProfileSelect(hustler);
              setIsMapOpen(false);
            }}
            onClose={() => setIsMapOpen(false)}
          />
        )}
        {showFilters && (
          <div className="fixed inset-0 z-[1000] flex items-end justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFilters(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-md"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg bg-[#0c0c0c] border-t border-white/10 rounded-t-[3rem] p-8 pb-12 shadow-[0_-20px_50px_rgba(0,0,0,0.8)]"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">
                  Discovery Filters
                </h3>
                <button
                  onClick={() => setShowFilters(false)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-10">
                {/* Filter Groups */}
                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-4 px-1">
                    Radius & Location
                  </h4>
                  <div className="grid grid-cols-4 gap-2">
                    {["0.5km", "2km", "5km", "Global"].map((r, i) => (
                      <button
                        key={i}
                        className={`py-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${i === 1 ? "bg-blue-600 border-blue-500 text-white" : "bg-white/5 border-transparent text-white/40"}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-4 px-1">
                    Experience Level
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { l: "Top Rated", i: <Star size={12} /> },
                      { l: "Verified Pro", i: <ShieldCheck size={12} /> },
                      { l: "Fast Responder", i: <Clock size={12} /> },
                      { l: "Rising Star", i: <Zap size={12} /> },
                    ].map((f, i) => (
                      <button
                        key={i}
                        className="flex items-center gap-3 p-5 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60"
                      >
                        {f.i} {f.l}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-4 px-1">
                    Budget Range
                  </h4>
                  <div className="flex items-center gap-4">
                    <input
                      type="range"
                      className="flex-1 accent-blue-600 opacity-30"
                    />
                    <span className="text-xs font-black text-white">
                      $10 - $500+
                    </span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowFilters(false)}
                className="w-full h-16 rounded-3xl bg-white text-black font-black uppercase tracking-[0.2em] text-xs mt-12 shadow-2xl active:scale-95 transition-all"
              >
                Show 45 Results
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
