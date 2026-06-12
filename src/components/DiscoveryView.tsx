import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { useDiscoveryStore } from "../features/feed/stores/useDiscoveryStore";
import { useLiveStore } from "../stores/useLiveStore";
import { useApprenticeshipStore } from "../stores/useApprenticeshipStore";
import LivePlayer from "./live/LivePlayer";
import { ApprenticeshipCard } from "./apprenticeship/ApprenticeshipCard";
import { ApprenticeshipDetail } from "./apprenticeship/ApprenticeshipDetail";
import { 
  Radio, 
  Users,
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
  Heart,
  Map as MapIcon,
} from "lucide-react";
import NearbyMap from "./NearbyMap";
import { useAuthStore } from "../features/auth/stores/useAuthStore";
import { convertCurrency, formatCurrency, Currency } from "../lib/currency";
import { ServiceCard } from "./discovery/ServiceCard";
import { ServiceDetailsModal } from "./discovery/ServiceDetailsModal";
import { HireFlowModal } from "./discovery/HireFlowModal";
import { HireSuccessModal } from "./discovery/HireSuccessModal";
import { ServiceDiscoveryFilters, FilterState } from "./discovery/ServiceDiscoveryFilters";
import { useMarketplaceStore } from "../features/marketplace/stores/useMarketplaceStore";

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
    priceVal: 45,
    priceSuffix: "/hr",
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
    priceVal: 120,
    pricePrefix: "From ",
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
  
  const { profile } = useAuthStore();
  const displayCurrency = (profile?.display_currency || 'USD') as Currency;
  
  const { services, fetchMarketplaceListings } = useMarketplaceStore();
  const [activeMainTab, setActiveMainTab] = useState<"feed" | "services" | "saved">("feed");
  const [filters, setFilters] = useState<FilterState>({
    category: "all",
    priceMin: 0,
    priceMax: 1000,
    location: "all",
    verifiedOnly: false,
    availableOnly: false,
  });

  const [savedServiceIds, setSavedServiceIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem("saved-service-ids");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const handleSaveToggle = (serviceId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSavedServiceIds(prev => {
      const updated = prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId];
      localStorage.setItem("saved-service-ids", JSON.stringify(updated));
      return updated;
    });
  };

  const [selectedService, setSelectedService] = useState<any | null>(null);
  const [hiringService, setHiringService] = useState<any | null>(null);
  const [recentCreatedBooking, setRecentCreatedBooking] = useState<any | null>(null);
  
  // High-fidelity local premium fallback dataset for instant search, filtering and recommendation
  const PREMIUM_SERVICES_POOL = [
    {
      id: "premium-s1",
      owner_id: "demo-hustler-id-1",
      title: "Signature Clean Fade & Beard Grooming",
      description: "Premium precision barbershop experience. Includes hot towel shaves, razor outline work, custom style counseling, hydration sprays, and head massage. Recommended to book in advance.",
      category: "Barbers",
      pricing_type: "fixed",
      base_price: 45,
      delivery_time: "1 Hour",
      media: [{ url: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?q=80&w=600&auto=format&fit=crop", type: "image" }],
      tags: ["Barber", "Fade", "Shave", "Grooming"],
      is_active: true,
      is_archived: false,
      rating_average: 4.9,
      reviews_count: 42,
      completion_rate: 100,
      location_mode: "local",
      distance_km: 0.4,
      verified: true,
      available_now: true,
      profiles: {
        id: "demo-hustler-id-1",
        full_name: "Ade Benson",
        hustle_name: "Ade's Cuts",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=AdeCuts",
        verified: true,
        primary_skill: "Master Barber",
        rating_average: 4.9,
        review_count: 42
      }
    },
    {
      id: "premium-s2",
      owner_id: "demo-hustler-id-2",
      title: "Custom Traditional Ankara & Lace Gowns",
      description: "Bespoke high-fashion tailoring for premium events, weddings, and traditional functions. Includes measurement audit, fabric consultation, custom embroidery overlays, and express adjustments.",
      category: "Tailors",
      pricing_type: "custom",
      base_price: 320,
      delivery_time: "7 Days",
      media: [{ url: "https://images.unsplash.com/photo-1549064482-6779ba3292fe?q=80&w=600&auto=format&fit=crop", type: "image" }],
      tags: ["Tailoring", "Traditional", "Ankara", "Fashion"],
      is_active: true,
      is_archived: false,
      rating_average: 5.0,
      reviews_count: 67,
      completion_rate: 98,
      location_mode: "local",
      distance_km: 2.1,
      verified: true,
      available_now: false,
      profiles: {
        id: "demo-hustler-id-2",
        full_name: "Chioma Okereke",
        hustle_name: "Chioma Couture",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Chioma",
        verified: true,
        primary_skill: "Premium Fashion Designer",
        rating_average: 5.0,
        review_count: 67
      }
    },
    {
      id: "premium-s3",
      owner_id: "demo-hustler-id-3",
      title: "Minimalist Brand Visual Identity & Pitchdeck",
      description: "Designing high-end modern corporate identities, logos, font bundles, style manuals, and investor pitch boards. Complete digital files package with vector sources, style guides, and commercial usage certificates included.",
      category: "Designers",
      pricing_type: "fixed",
      base_price: 450,
      delivery_time: "4 Days",
      media: [{ url: "https://images.unsplash.com/photo-1561070791-26c113006238?q=80&w=600&auto=format&fit=crop", type: "image" }],
      tags: ["Design", "Branding", "Pitchdeck", "Logo"],
      is_active: true,
      is_archived: false,
      rating_average: 4.8,
      reviews_count: 19,
      completion_rate: 100,
      location_mode: "remote",
      distance_km: 0,
      verified: true,
      available_now: true,
      profiles: {
        id: "demo-hustler-id-3",
        full_name: "Kofi Mensah",
        hustle_name: "Kofi Visuals",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Kofi",
        verified: true,
        primary_skill: "Lead Visual Designer",
        rating_average: 4.8,
        review_count: 19
      }
    },
    {
      id: "premium-s4",
      owner_id: "demo-hustler-id-4",
      title: "High-Volume Mobile Commerce Apps",
      description: "Native-quality React Native and Flutter mobile stores. Featuring secure stripe checkout portals, real-time sync with firebase db, item catalogs, push notifications systems, and dashboard graphs.",
      category: "Devs",
      pricing_type: "hourly",
      base_price: 85,
      delivery_time: "14 Days",
      media: [{ url: "https://images.unsplash.com/photo-1551650975-87deedd944c3?q=80&w=600&auto=format&fit=crop", type: "image" }],
      tags: ["Developer", "Mobile", "Apps", "React Native"],
      is_active: true,
      is_archived: false,
      rating_average: 4.9,
      reviews_count: 31,
      completion_rate: 96,
      location_mode: "remote",
      distance_km: 0,
      verified: false,
      available_now: true,
      profiles: {
        id: "demo-hustler-id-4",
        full_name: "Tobi Alao",
        hustle_name: "Alao Devs",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Tobi",
        verified: false,
        primary_skill: "Fullstack Mobile Dev",
        rating_average: 4.9,
        review_count: 31
      }
    },
    {
      id: "premium-s5",
      owner_id: "demo-hustler-id-5",
      title: "Studio Fashion Photoshoot & Post-Processing",
      description: "Professional high-end fashion and urban streetwear photography. Includes 3-hour studio setup, lighting triggers, model coaching, 15 fully retouched digital exposures, and social-media dimensions package.",
      category: "Photo",
      pricing_type: "fixed",
      base_price: 250,
      delivery_time: "3 Days",
      media: [{ url: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?q=80&w=600&auto=format&fit=crop", type: "image" }],
      tags: ["Photography", "Studio", "Retouching", "Fashion"],
      is_active: true,
      is_archived: false,
      rating_average: 5.0,
      reviews_count: 14,
      completion_rate: 100,
      location_mode: "local",
      distance_km: 1.2,
      verified: true,
      available_now: true,
      profiles: {
        id: "demo-hustler-id-5",
        full_name: "Yasmine Touré",
        hustle_name: "Touré Studios",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Yasmine",
        verified: true,
        primary_skill: "Editorial Photographer",
        rating_average: 5.0,
        review_count: 14
      }
    },
    {
      id: "premium-s6",
      owner_id: "demo-hustler-id-6",
      title: "Premium Bridal Glam & Airbrush Makeup",
      description: "Exclusive makeup application specializing in bridal, red-carpet, and high-contrast video formats. Uses premium luxury products. Includes false lash extension attachment and setting spray lock.",
      category: "Makeup",
      pricing_type: "fixed",
      base_price: 180,
      delivery_time: "3 Hours",
      media: [{ url: "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?q=80&w=600&auto=format&fit=crop", type: "image" }],
      tags: ["Makeup", "Bridal", "Glam", "Airbrush"],
      is_active: true,
      is_archived: false,
      rating_average: 4.7,
      reviews_count: 24,
      completion_rate: 95,
      location_mode: "local",
      distance_km: 4.8,
      verified: false,
      available_now: false,
      profiles: {
        id: "demo-hustler-id-6",
        full_name: "Zainab Balogun",
        hustle_name: "Glam by Zainab",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Zainab",
        verified: false,
        primary_skill: "Bridal Makeup Artist",
        rating_average: 4.7,
        review_count: 24
      }
    },
    {
      id: "premium-s7",
      owner_id: "demo-hustler-id-7",
      title: "SEO Copywriting & Landing Page Scripts",
      description: "Write conversion-focused copy for startups and tech brands. Includes deep market research, competitor audits, wireframe copy guides, headlines variations, and search engine integration strategies.",
      category: "Writers",
      pricing_type: "fixed",
      base_price: 150,
      delivery_time: "2 Days",
      media: [{ url: "https://images.unsplash.com/photo-1455390582262-044cdead277a?q=80&w=600&auto=format&fit=crop", type: "image" }],
      tags: ["Writing", "SEO", "Copywriting", "Landing Page"],
      is_active: true,
      is_archived: false,
      rating_average: 4.9,
      reviews_count: 8,
      completion_rate: 100,
      location_mode: "remote",
      distance_km: 0,
      verified: true,
      available_now: true,
      profiles: {
        id: "demo-hustler-id-7",
        full_name: "Efe Lawson",
        hustle_name: "Efe Writes",
        avatar_url: "https://api.dicebear.com/7.x/avataaars/svg?seed=Efe",
        verified: true,
        primary_skill: "Conversion Copywriter",
        rating_average: 4.9,
        review_count: 8
      }
    }
  ];

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
  }, []);

  const { activeSessions, fetchActiveSessions } = useLiveStore();
  const { availablePrograms, fetchAvailablePrograms } = useApprenticeshipStore();
  const [viewingSessionId, setViewingSessionId] = useState<string | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<any | null>(null);

  useEffect(() => {
    fetchActiveSessions();
    fetchTrending();
    fetchSuggestedCreators();
    fetchAvailablePrograms();
    fetchMarketplaceListings();
  }, [fetchActiveSessions, fetchTrending, fetchSuggestedCreators, fetchAvailablePrograms, fetchMarketplaceListings]);

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

  const getFilteredServices = () => {
    const dbServicesFormatted = (services || []).map((s: any) => {
      return {
        ...s,
        rating_average: s.rating_average || 4.9,
        reviews_count: s.reviews_count || 5,
        completion_rate: s.completion_rate || 100,
        location_mode: s.location_mode || "remote",
        distance_km: s.distance_km || 0,
        verified: s.verified || false,
        available_now: s.available_now || true,
        profiles: s.profiles || {
          hustle_name: s.creator_name || "Hustle Partner",
          full_name: s.creator_name || "Hustle Partner",
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${s.owner_id || s.id}`,
          verified: false
        }
      };
    });

    const allPool = [...dbServicesFormatted, ...PREMIUM_SERVICES_POOL];

    let result = allPool;
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      result = result.filter(s => 
        s.title.toLowerCase().includes(q) || 
        (s.description || "").toLowerCase().includes(q) ||
        s.tags.some((t: string) => t.toLowerCase().includes(q)) ||
        (s.profiles?.hustle_name || "").toLowerCase().includes(q) ||
        (s.profiles?.full_name || "").toLowerCase().includes(q)
      );
    }

    if (filters.category !== "all") {
      result = result.filter(s => s.category?.toLowerCase() === filters.category.toLowerCase());
    }

    result = result.filter(s => Number(s.base_price || 0) <= filters.priceMax);

    if (filters.location === "local") {
      result = result.filter(s => s.location_mode === "local" || s.distance_km <= 5);
    } else if (filters.location === "remote") {
      result = result.filter(s => s.location_mode === "remote" || s.distance_km === 0);
    }

    if (filters.verifiedOnly) {
      result = result.filter(s => s.profiles?.verified || s.verified);
    }

    if (filters.availableOnly) {
      result = result.filter(s => s.available_now);
    }

    return result;
  };

  const renderResultCard = (item: any, type: 'service' | 'product' | 'training' | 'hustler', i: number) => {
    const profiles = item.profiles || item; // Hustler is already a profile
    const name = type === 'hustler' ? (profiles.hustle_name || profiles.full_name) : item.title;
    const creatorName = profiles.hustle_name || profiles.full_name || "Creator";
    const avatar = profiles.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profiles.id}`;
    
    // Currency Conversion for Search Results
    const rawPrice = Number(item.base_price || item.price || 0);
    const convertedPrice = convertCurrency(rawPrice, 'USD', displayCurrency);
    const price = type === 'hustler' ? "Profile" : formatCurrency(convertedPrice, displayCurrency);
    
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

        {/* High-Fidelity Service Discovery Tabs */}
        <div className="flex gap-5 border-b border-white/5 mt-4">
          <button
            onClick={() => {
              setActiveMainTab("feed");
              setIsSearching(false);
            }}
            className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative ${
              activeMainTab === "feed" ? "text-white" : "text-white/40 hover:text-white"
            }`}
          >
            Match Feed
            {activeMainTab === "feed" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-blue-500" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveMainTab("services");
              setIsSearching(false);
            }}
            className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-1.5 ${
              activeMainTab === "services" ? "text-cyan-400" : "text-white/40 hover:text-white"
            }`}
          >
            <Zap size={10} className="fill-current" />
            Discover Services
            {activeMainTab === "services" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-cyan-400" />
            )}
          </button>
          <button
            onClick={() => {
              setActiveMainTab("saved");
              setIsSearching(false);
            }}
            className={`pb-3 text-[10px] font-black uppercase tracking-[0.2em] transition-all relative flex items-center gap-1.5 ${
              activeMainTab === "saved" ? "text-red-400" : "text-white/40 hover:text-white"
            }`}
          >
            Saved ({savedServiceIds.length})
            {activeMainTab === "saved" && (
              <motion.div layoutId="activeTabUnderline" className="absolute bottom-0 inset-x-0 h-0.5 bg-red-400" />
            )}
          </button>
        </div>
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
        {!isSearching && activeMainTab === "feed" ? (
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

            {/* Live Now Section */}
            {activeSessions.length > 0 && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12 overflow-hidden"
              >
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                       <Radio size={18} className="text-red-500" />
                       <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
                    </div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Live Showcases</h4>
                  </div>
                </div>

                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 -mx-6 px-6">
                   {activeSessions.map((session) => (
                      <motion.div
                        key={`disco-live-${session.id}`}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setViewingSessionId(session.id)}
                        className="relative min-w-[240px] aspect-[16/10] rounded-[2.5rem] bg-[#0c0c0c] overflow-hidden border border-white/5 active:border-red-500/30 transition-colors shadow-2xl group"
                      >
                         {session.thumbnail_url ? (
                           <img src={session.thumbnail_url} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-60" alt={session.title} />
                         ) : (
                           <div className="w-full h-full flex items-center justify-center opacity-10">
                              <Radio size={40} />
                           </div>
                         )}
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/20" />
                         
                         <div className="absolute top-4 left-4 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded shadow-lg flex items-center gap-1.5 transition-all group-hover:scale-105">
                            <span className="w-1 h-1 bg-white rounded-full animate-pulse" /> Live
                         </div>
                         <div className="absolute top-4 right-4 bg-black/40 backdrop-blur-md text-white text-[8px] font-black px-2 py-1 rounded flex items-center gap-1.5 shadow-xl">
                            <Users size={8} className="text-white/60" /> {session.current_viewers || 0}
                         </div>

                         <div className="absolute bottom-4 left-4 right-4">
                            <h4 className="text-xs font-black text-white line-clamp-1 mb-1.5 uppercase tracking-tight">{session.title}</h4>
                            <div className="flex items-center gap-2">
                               <div className="w-5 h-5 rounded-full border border-white/20 overflow-hidden shrink-0">
                                  <img 
                                    src={session.host_profiles?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session.host_id}`}
                                    className="w-full h-full object-cover"
                                  />
                               </div>
                               <span className="text-[9px] font-black text-white/40 uppercase tracking-widest truncate">{session.host_profiles?.hustle_name || 'Professional'}</span>
                            </div>
                         </div>
                      </motion.div>
                   ))}
                </div>
              </motion.div>
            )}

            {/* Apprenticeships / Fellowships Section */}
            {availablePrograms.length > 0 && (
              <section className="mb-12 overflow-hidden">
                <div className="flex items-center justify-between mb-4 px-1">
                  <div className="flex items-center gap-2">
                    <GraduationCap size={18} className="text-brand-primary" />
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Open Fellowships</h4>
                  </div>
                </div>
                
                <div className="flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-6 px-6">
                  {availablePrograms.map((program) => (
                    <div key={program.id} className="min-w-[280px]">
                      <ApprenticeshipCard 
                        program={program} 
                        onClick={() => setSelectedProgram(program)} 
                      />
                    </div>
                  ))}
                </div>
              </section>
            )}

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
                              {rec.rating_average ? rec.rating_average.toFixed(1) : (rec.review_count && rec.review_count > 0 ? "4.9" : "New")}
                            </span>
                          </div>
                          <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">
                            {rec.follower_count || 0} Followers
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
        ) : !isSearching && activeMainTab === "services" ? (
          <motion.div
            key="services-discovery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            {/* Inline Filter Panel */}
            <ServiceDiscoveryFilters
              filters={filters}
              onFilterChange={(newFilters) => setFilters(newFilters)}
              isInline={true}
            />

            {/* List Header stats */}
            <div className="flex justify-between items-center px-1">
              <div className="flex flex-col">
                <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                  Recommended Catalogs
                </h4>
                <p className="text-[8.5px] font-medium text-white/25 uppercase tracking-widest mt-1">
                  Showing {getFilteredServices().length} match results
                </p>
              </div>
            </div>

            {/* Services Grid */}
            {getFilteredServices().length === 0 ? (
              <div className="py-20 flex flex-col items-center justify-center gap-4 text-center rounded-[2.5rem] bg-white/[0.01] border border-white/5">
                <Sparkles className="text-white/20" size={32} />
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">No matching services found.</p>
                  <p className="text-[9px] text-white/20 uppercase font-black mt-1">Try relaxing filters or changing categories.</p>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredServices().map((service) => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    isSaved={savedServiceIds.includes(service.id)}
                    onSaveToggle={(id, e) => handleSaveToggle(id, e)}
                    onView={(s) => setSelectedService(s)}
                    onHire={(s, e) => {
                      e.stopPropagation();
                      setHiringService(s);
                    }}
                    displayCurrency={displayCurrency}
                  />
                ))}
              </div>
            )}
          </motion.div>

        ) : !isSearching && activeMainTab === "saved" ? (
          <motion.div
            key="saved-discovery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-8"
          >
            <div className="flex flex-col px-1">
              <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                Bookmarked Services
              </h4>
              <p className="text-[8.5px] font-medium text-white/25 uppercase tracking-widest mt-1">
                Your pinned professional offerings
              </p>
            </div>

            {savedServiceIds.length === 0 ? (
              <div className="py-24 text-center space-y-4 rounded-[2.5rem] bg-white/[0.01] border border-white/5 flex flex-col items-center justify-center">
                <Heart size={32} className="text-white/10" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">No saved services yet.</p>
                <button
                  onClick={() => setActiveMainTab("services")}
                  className="px-5 h-10 rounded-full border border-white/15 hover:bg-white/5 text-[9px] font-black uppercase tracking-widest text-[#a5f3fc]"
                >
                  Browse Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredServices()
                  .filter((s) => savedServiceIds.includes(s.id))
                  .map((service) => (
                    <ServiceCard
                      key={service.id}
                      service={service}
                      isSaved={true}
                      onSaveToggle={(id, e) => handleSaveToggle(id, e)}
                      onView={(s) => setSelectedService(s)}
                      onHire={(s, e) => {
                        e.stopPropagation();
                        setHiringService(s);
                      }}
                      displayCurrency={displayCurrency}
                    />
                  ))}
              </div>
            )}
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
                {searchResults.services?.map((s, i) => (
                  <ServiceCard
                    key={s.id}
                    service={s}
                    isSaved={savedServiceIds.includes(s.id)}
                    onSaveToggle={(id, e) => handleSaveToggle(id, e)}
                    onView={(val) => setSelectedService(val)}
                    onHire={(val, e) => {
                      e.stopPropagation();
                      setHiringService(val);
                    }}
                    displayCurrency={displayCurrency}
                  />
                ))}
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
        {viewingSessionId && (
          <LivePlayer 
            sessionId={viewingSessionId} 
            onClose={() => setViewingSessionId(null)} 
          />
        )}
        {selectedProgram && (
          <ApprenticeshipDetail 
            program={selectedProgram}
            onClose={() => setSelectedProgram(null)}
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

        {/* Global Service Details Drawers */}
        {selectedService && (
          <ServiceDetailsModal
            service={selectedService}
            isSaved={savedServiceIds.includes(selectedService.id)}
            onSaveToggle={(id) => handleSaveToggle(id)}
            onClose={() => setSelectedService(null)}
            onHire={(s) => {
              setSelectedService(null);
              setHiringService(s);
            }}
            displayCurrency={displayCurrency}
          />
        )}

        {hiringService && (
          <HireFlowModal
            service={hiringService}
            onClose={() => setHiringService(null)}
            displayCurrency={displayCurrency}
            onConfirmHire={async (payload) => {
              try {
                // Perform direct backend call to register booking and lock escrow
                const response = await fetch("/api/hire/request", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify({
                    serviceId: payload.service.id,
                    notes: payload.notes,
                    timeline: payload.timeline
                  })
                });

                if (response.ok) {
                  const result = await response.json();
                  if (result.success) {
                    setRecentCreatedBooking(result.data);
                  }
                }
              } catch (error) {
                console.error("Failed to submit hire request on server:", error);
              }

              // Triggers native profile/legacy client-side handshake wizard
              onProfileSelect({
                creator: payload.service.profiles || { id: payload.service.owner_id },
                listing: payload.service,
                type: 'service',
                notes: payload.notes,
                timeline: payload.timeline,
                attachments: payload.attachments,
              });
              setHiringService(null);
            }}
          />
        )}

        {recentCreatedBooking && (
          <HireSuccessModal
            booking={recentCreatedBooking}
            onClose={() => setRecentCreatedBooking(null)}
            displayCurrency={displayCurrency}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
