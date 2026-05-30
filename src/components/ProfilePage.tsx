import { motion, AnimatePresence } from "motion/react";
import {
  ChevronLeft,
  Star,
  MapPin,
  CheckCircle2,
  MessageSquare,
  MoreHorizontal,
  Grid,
  Briefcase,
  MessageCircle,
  Info,
  Calendar,
  ShieldCheck,
  ShieldAlert,
  Edit2,
  ShoppingBag,
  BookOpen,
  Clock,
  Heart,
  Camera,
  Settings,
  X,
  Plus,
  Play,
  Link as LinkIcon,
  Check,
  AlertCircle,
  TrendingUp,
  CreditCard,
  User,
  History,
  Zap,
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useAuthStore } from "../features/auth/stores/useAuthStore";
import { FollowButton } from "./social/FollowButton";
import { supabase } from "../lib/supabase";
import BookingFlow from "./BookingFlow";
import ReportSheet from "./ReportSheet";
import ImageEditorModal from "./ImageEditorModal";
import TrustBadge from "./TrustBadge";
import ServiceDetailModal from "./ServiceDetailModal";
import FullscreenMediaViewer from "./FullscreenMediaViewer";
import FeedCard from "./FeedCard";

interface ProfilePageProps {
  hustler: any;
  onBack: () => void;
  onStartChat?: (targetUser: any) => void;
}

export default function ProfilePage({ hustler, onBack, onStartChat }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState("posts");
  const [showBooking, setShowBooking] = useState(false);
  const [bookingListing, setBookingListing] = useState<any>(null);
  const [showReport, setShowReport] = useState(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [selectedPost, setSelectedPost] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Database Data
  const [realProfile, setRealProfile] = useState<any>(null);
  const [posts, setPosts] = useState<any[]>([]);
  const [services, setServices] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [trainings, setTrainings] = useState<any[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);

  // Demonstration states
  const { isOwnerMode, setIsOwnerMode } = { isOwnerMode: false, setIsOwnerMode: (b: boolean) => {} };
  const { user } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Open for Bookings");

  const [imageEditorState, setImageEditorState] = useState<{
    isOpen: boolean;
    type: "avatar" | "cover" | null;
  }>({ isOpen: false, type: null });

  const [localAvatar, setLocalAvatar] = useState(
    hustler?.creator?.avatar ||
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
  );
  const [localCover, setLocalCover] = useState(
    "https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80",
  );

  useEffect(() => {
    if (!hustler?.creator?.id) return;
    
    const channel = supabase
      .channel(`public:profiles:id=eq.${hustler.creator.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${hustler.creator.id}`,
        },
        (payload) => {
          setRealProfile(payload.new);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [hustler?.creator?.id]);

  useEffect(() => {
    const fetchData = async () => {
      if (!hustler?.creator?.id) return;
      setIsLoading(true);
      try {
        // Fetch Profile
        const { data: profileData } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", hustler.creator.id)
          .single();

        if (profileData) {
          setRealProfile(profileData);
          if (profileData.avatar_url) setLocalAvatar(profileData.avatar_url);
          if (profileData.cover_url) setLocalCover(profileData.cover_url);
        }

        // Fetch Services
        const { data: servicesData } = await supabase
          .from("services")
          .select("*")
          .eq("owner_id", hustler.creator.id)
          .eq("is_active", true);
        if (servicesData) setServices(servicesData);

        // Fetch Products
        const { data: productsData } = await (supabase as any)
          .from("products")
          .select("*")
          .eq("owner_id", hustler.creator.id)
          .eq("is_active", true);
        if (productsData) setProducts(productsData);

        // Fetch Trainings
        const { data: trainingData } = await (supabase as any)
          .from("training")
          .select("*")
          .eq("owner_id", hustler.creator.id)
          .eq("is_active", true);
        if (trainingData) setTrainings(trainingData);

        // Fetch Reviews
        const { data: reviewsData } = await supabase
          .from("reviews")
          .select(`
            *,
            reviewer:profiles!reviewer_id(full_name, avatar_url, username)
          `)
          .eq("provider_id", hustler.creator.id)
          .order("created_at", { ascending: false });
        if (reviewsData) setReviews(reviewsData);

        // Fetch Posts
        const { data: postsData } = await supabase
          .from("posts")
          .select(`
            *,
            attached_listing_data
          `)
          .eq("user_id", hustler.creator.id)
          .eq("is_repost", false) // only original posts on profile grid
          .order("created_at", { ascending: false });
        if (postsData) setPosts(postsData || []);
      } catch (err) {
        console.error("Error fetching profile data:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [hustler?.creator?.id]);

  const trustMetrics = {
    rating: Number(realProfile?.rating_average || hustler?.creator?.rating || 0),
    completionScore: 100,
    repeatClientRate: 58,
    totalJobs: Math.max(
      Number(realProfile?.review_count || 0),
      reviews.length,
      Number(hustler?.creator?.jobs || 0)
    ),
  };

  const schedule = [
    { day: "Mon", active: true, start: "09:00", end: "18:00" },
    { day: "Tue", active: true, start: "09:00", end: "18:00" },
    { day: "Wed", active: true, start: "09:00", end: "18:00" },
    { day: "Thu", active: true, start: "09:00", end: "18:00" },
    { day: "Fri", active: true, start: "10:00", end: "16:00" },
    { day: "Sat", active: false },
    { day: "Sun", active: false },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  const isHustler = realProfile?.is_hustler || hustler.creator.is_hustler;

  const tabs = [
    { id: "posts", label: "Posts", icon: <Grid size={14} /> },
    { id: "services", label: "Services", icon: <Briefcase size={14} /> },
    { id: "products", label: "Products", icon: <ShoppingBag size={14} /> },
    { id: "trainings", label: "Trainings", icon: <BookOpen size={14} /> },
    { id: "reviews", label: "Reviews", icon: <Star size={14} /> },
    { id: "about", label: "About", icon: <Info size={14} /> },
  ].filter((tab) => {
    if (!isHustler && ["services", "products", "trainings", "reviews"].includes(tab.id)) {
      return false;
    }
    return true;
  });

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    if (scrollRef.current) {
      const sectionOffset = 380;
      if (scrollRef.current.scrollTop > sectionOffset) {
        scrollRef.current.scrollTo({ top: sectionOffset, behavior: "smooth" });
      }
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: "100%" }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[60] bg-[#050505] flex flex-col w-full h-full pb-safe"
    >
      {/* Sticky Top Navigation */}
      <header className="sticky top-0 z-[100] flex justify-between items-center px-4 py-3 bg-[#050505]/95 backdrop-blur-2xl border-b border-white/5 safe-top shadow-xl">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-all active:scale-90"
          >
            <ChevronLeft size={20} />
          </button>
          <div className="flex flex-col">
            <h2 className="text-[10px] font-black tracking-[0.2em] uppercase text-white/40">
              Viewing Profile
            </h2>
            <h1 className="text-sm font-display font-black tracking-widest uppercase text-white truncate max-w-[120px]">
              {realProfile?.full_name || hustler.creator.name}
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isOwnerMode && user && user.id !== (realProfile?.id || hustler.creator.id) && (
            <FollowButton 
              targetUserId={(realProfile?.id || hustler.creator.id).toString()} 
            />
          )}
          {!isOwnerMode && (
            <button 
              onClick={() => {
                if (onStartChat) {
                  onStartChat({
                    id: realProfile?.id || hustler.creator.id,
                    full_name: realProfile?.full_name || hustler.creator.name,
                    username: realProfile?.username || hustler.creator.username || hustler.creator.handle,
                    avatar_url: realProfile?.avatar_url || localAvatar
                  });
                }
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all"
            >
              <MessageCircle size={14} /> Message
            </button>
          )}

          <button
            onClick={() => setShowReport(true)}
            className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-colors"
          >
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto no-scrollbar pb-48 overscroll-contain"
      >
        <div className="grain-overlay pointer-events-none" />

        {/* Cover & Identity Section */}
        <section className="relative flex flex-col items-center">
          {/* Cover Photo */}
          <div className="w-full h-48 bg-gradient-to-br from-blue-900/40 to-purple-900/20 relative group">
            <img
              src={localCover}
              className="w-full h-full object-cover absolute inset-0 opacity-50"
              alt="Cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
          </div>

          {/* Profile Avatar */}
          <div className="relative -mt-16 mb-4 z-10 group">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-32 h-32 rounded-full border-4 border-[#050505] overflow-hidden bg-white/5 relative shadow-2xl"
            >
              <img
                src={localAvatar}
                alt={hustler.creator.name}
                className="w-full h-full object-cover"
              />
            </motion.div>
            {(realProfile?.active || hustler.creator.active) && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-[#050505] z-20" />
            )}
          </div>

          {/* Identity Info */}
          <div className="px-6 flex flex-col items-center text-center w-full">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-4xl font-display font-black tracking-tighter text-white uppercase flex items-center justify-center gap-3"
            >
              {realProfile?.full_name || hustler.creator.name}
              {(realProfile?.verified || hustler.creator.verified) && (
                <CheckCircle2
                  size={24}
                  className="text-blue-500 fill-blue-500/10"
                />
              )}
            </motion.h1>

            <div className="mt-4 flex flex-col items-center">
              <div className="flex items-center gap-4">
                {isHustler && (
                  <>
                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={10}
                          className={
                            s <= Math.floor(trustMetrics.rating)
                              ? "fill-yellow-500 text-yellow-500"
                              : "text-white/10"
                          }
                        />
                      ))}
                    </div>
                    <div className="h-3 w-px bg-white/10" />
                  </>
                )}
                <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">
                  @{realProfile?.username || hustler.creator.handle || "user"}
                </span>
              </div>

              <div className="flex items-center gap-6 mt-4">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-black text-white tracking-widest leading-none">
                    {realProfile?.follower_count || 0}
                  </span>
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">
                    Followers
                  </span>
                </div>
                <div className="w-px h-6 bg-white/10" />
                <div className="flex flex-col items-center">
                  <span className="text-sm font-black text-white tracking-widest leading-none">
                    {realProfile?.following_count || 0}
                  </span>
                  <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mt-1">
                    Following
                  </span>
                </div>
                {realProfile?.mutual_count > 0 && (
                  <>
                    <div className="w-px h-6 bg-white/10" />
                    <div className="flex flex-col items-center">
                      <span className="text-sm font-black text-brand-primary tracking-widest leading-none">
                        {realProfile?.mutual_count}
                      </span>
                      <span className="text-[8px] font-black text-brand-primary/40 uppercase tracking-[0.2em] mt-1">
                        Mutuals
                      </span>
                    </div>
                  </>
                )}
              </div>

              {isHustler && (
                <div className="mt-8 grid grid-cols-3 gap-2 w-full max-w-sm">
                  {[
                    {
                      label: "Successful Hustles",
                      value: trustMetrics.totalJobs,
                      color: "text-blue-400",
                    },
                    {
                      label: "Completion Score",
                      value: `${trustMetrics.completionScore}%`,
                      color: "text-green-400",
                    },
                    {
                      label: "Repeat Clients",
                      value: `${trustMetrics.repeatClientRate}%`,
                      color: "text-purple-400",
                    },
                  ].map((stat, i) => (
                    <div
                      key={i}
                      className="p-4 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col items-center text-center"
                    >
                      <span className={`text-xl font-black ${stat.color} tracking-tighter mb-0.5`}>
                        {stat.value}
                      </span>
                      <span className="text-[6px] font-black text-white/30 uppercase tracking-[0.2em] leading-tight">
                        {stat.label}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Primary Skill */}
            {isHustler && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mt-3 flex flex-col items-center gap-2"
              >
                <span className="text-white font-bold tracking-wide flex items-center gap-1 uppercase text-xs">
                  <Briefcase size={14} className="text-blue-400" /> 
                  {realProfile?.primary_skill || hustler.creator.category}
                </span>
              </motion.div>
            )}

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mt-4 text-white/40 text-xs uppercase tracking-widest font-bold"
            >
              <MapPin size={12} />
              {realProfile?.location || hustler.creator.location || "Remote"} • Top Rated
            </motion.div>

            {/* Availability */}
            {isHustler && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 p-1 rounded-[2rem] bg-white/[0.02] border border-white/5 w-full max-w-sm mx-auto flex items-center"
              >
                <div
                  onClick={() => setShowSchedule(true)}
                  className="flex-1 flex items-center gap-4 px-4 py-3 rounded-[1.75rem] transition-all bg-[#0c0c0c] border border-white/10 cursor-pointer hover:bg-white/[0.04]"
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]" : "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse"}`} />
                  <div className="text-left flex-1">
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">Status</p>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-black mt-0.5">
                      {isAvailable ? statusMessage : "Paused"}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSchedule(true)}
                  className="ml-1 px-5 py-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-[0.2em]"
                >
                  Schedule
                </button>
              </motion.div>
            )}
          </div>
        </section>

        {/* Segmented Navigation */}
        <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-y border-white/5 py-3 mt-8">
          <div className="max-w-2xl mx-auto px-4">
            <nav className="flex overflow-x-auto no-scrollbar gap-1 items-center p-1 bg-white/[0.03] border border-white/10 rounded-2xl relative snap-x w-full">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 relative transition-all whitespace-nowrap snap-start shrink-0 rounded-xl ${
                    activeTab === tab.id ? "text-black" : "text-white/40 hover:text-white/70"
                  }`}
                >
                  <div className="relative z-10 flex items-center gap-2">
                    {tab.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                  </div>
                  {activeTab === tab.id && (
                    <motion.div
                      layoutId="profileSegmentHighlight"
                      className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area */}
        <div className="px-4 py-6 min-h-[50vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-12 h-1 bg-white/10 rounded-full overflow-hidden">
                <motion.div
                  initial={{ x: "-100%" }}
                  animate={{ x: "100%" }}
                  transition={{ duration: 1, repeat: Infinity, ease: "easeInOut" }}
                  className="w-full h-full bg-blue-500"
                />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">Syncing Profile...</span>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === "posts" && (
                <motion.div
                  key="posts"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="flex flex-col gap-8"
                >
                  {/* Featured Products Mini Catalog */}
                  {products.length > 0 && (
                    <div className="mb-2">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Shop My Direct</h3>
                        <button onClick={() => setActiveTab("products")} className="text-[9px] font-black uppercase tracking-widest text-blue-400">View Catalog</button>
                      </div>
                      <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
                        {products.map((item) => (
                          <div key={item.id} className="min-w-[280px] h-44 bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden flex snap-start relative group">
                            <div className="w-1/2 h-full relative overflow-hidden bg-white/5">
                              {item.media_urls?.[0] && <img src={item.media_urls[0]} className="w-full h-full object-cover opacity-80" alt={item.title} />}
                              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-[#0c0c0c]" />
                            </div>
                            <div className="w-1/2 p-6 flex flex-col justify-center gap-1 z-10 bg-black/40 backdrop-blur-3xl">
                              <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">Product</span>
                              <h4 className="text-sm font-black text-white leading-tight mb-2 uppercase truncate">{item.title}</h4>
                              <div className="flex items-center justify-between mt-auto">
                                <span className="text-lg font-black text-white">${item.price}</span>
                                <div className="px-3 py-1.5 rounded-xl bg-white text-black text-[8px] font-black uppercase tracking-widest">Get</div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-1 md:gap-2">
                    {posts.length === 0 ? (
                      <div className="col-span-3 py-20 text-center">
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/20">No posts yet</p>
                      </div>
                    ) : (
                      posts.map((post) => (
                        <div 
                          key={post.id} 
                          onClick={() => setSelectedPost(post)}
                          className="aspect-[3/4] relative rounded-xl border border-white/5 overflow-hidden group cursor-pointer bg-[#0c0c0c]"
                        >
                          <img
                            src={post.media_url || post.thumbnail_url || (post.media?.[0]?.url) || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"}
                            className="w-full h-full object-cover opacity-60 hover:opacity-100 transition-opacity"
                            alt=""
                          />
                          {post.media_type === 'video' && (
                            <div className="absolute top-2 right-2 z-10">
                              <Play size={12} className="text-white fill-white" />
                            </div>
                          )}
                          {post.attached_listing_id && (
                            <div className="absolute top-2 left-2 z-10 px-1.5 py-0.5 bg-blue-500 rounded border border-white/20 shadow-lg">
                              <Zap size={8} className="text-white fill-white" />
                            </div>
                          )}
                          {post.media && Array.isArray(post.media) && post.media.length > 1 && (
                            <div className="absolute top-2 right-2 z-10">
                              <span className="text-[8px] font-black bg-black/50 text-white px-1.5 py-0.5 rounded cursor-default border border-white/10 uppercase tracking-tighter">
                                {post.media.length}
                              </span>
                            </div>
                          )}
                          <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="flex items-center gap-2 text-white text-[8px] font-black uppercase">
                              <span className="flex items-center gap-0.5"><Heart size={8} fill="currentColor" /> {post.likes_count || 0}</span>
                              <span className="flex items-center gap-0.5"><MessageSquare size={8} fill="currentColor" /> {post.comments_count || 0}</span>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "services" && (
                <motion.div
                  key="services"
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.02 }}
                  className="flex flex-col gap-6"
                >
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter px-2">Professional Offerings</h3>
                  {services.length > 0 ? (
                    <div className="flex flex-col gap-5">
                      {services.map((item) => (
                        <div key={item.id} onClick={() => setSelectedService(item)} className="p-7 rounded-[2.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-6 group hover:border-blue-500/40 transition-all cursor-pointer">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <h3 className="font-black text-white text-2xl tracking-tighter leading-tight uppercase">{item.title}</h3>
                              <div className="flex items-center gap-3 mt-3">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                                  <Clock size={12} /> {item.pricing_type}
                                </div>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                              <span className="text-3xl font-black text-white tracking-tighter leading-none">${item.price}</span>
                            </div>
                          </div>
                          <p className="text-[13px] text-white/50 font-medium leading-relaxed">{item.description}</p>
                          <div className="flex items-center justify-between mt-2 pt-6 border-t border-white/5">
                            <div className="flex items-center gap-1.5">
                              <Star size={12} className="text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-black text-white">{trustMetrics.rating.toFixed(1)}</span>
                            </div>
                            <button className="px-8 py-4 rounded-[2rem] bg-white text-black text-[11px] font-black uppercase tracking-widest">Book Service</button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col items-center text-center">
                      <Briefcase size={32} className="text-white/20 mb-4" />
                      <h4 className="text-sm font-black text-white uppercase">No Services</h4>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "products" && (
                <motion.div key="products" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -15 }} className="flex flex-col gap-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter px-2">Digital Drops</h3>
                  {products.length > 0 ? (
                    <div className="grid grid-cols-2 gap-x-4 gap-y-10">
                      {products.map((prod) => (
                        <div key={prod.id} className="flex flex-col gap-4">
                          <div className="aspect-[4/5] bg-black rounded-[3rem] border border-white/10 overflow-hidden relative group cursor-pointer shadow-2xl">
                            {prod.media_urls?.[0] ? <img src={prod.media_urls[0]} className="w-full h-full object-cover opacity-70" alt={prod.title} /> : <div className="w-full h-full bg-white/5 flex items-center justify-center"><ShoppingBag size={40} className="text-white/10" /></div>}
                            <div className="absolute bottom-5 left-5 right-5 z-20"><span className="text-[18px] font-black text-white tracking-tighter">${prod.price}</span></div>
                          </div>
                          <div className="px-2">
                            <h4 className="text-[11px] font-black text-white uppercase truncate">{prod.title}</h4>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col items-center text-center">
                      <ShoppingBag size={32} className="text-white/20 mb-4" />
                      <h4 className="text-sm font-black text-white uppercase">No Products</h4>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "trainings" && (
                <motion.div key="trainings" initial={{ opacity: 0, x: 15 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -15 }} className="flex flex-col gap-8">
                  <h3 className="text-xl font-black text-white uppercase tracking-tighter px-2">Mastery Workshops</h3>
                  {trainings.length > 0 ? (
                    <div className="flex flex-col gap-6">
                      {trainings.map((item) => (
                        <div key={item.id} className="bg-[#0c0c0c] border border-white/10 rounded-[3rem] overflow-hidden p-8 flex flex-col gap-6 shadow-2xl">
                          <div className="flex justify-between items-start">
                            <div className="flex-1"><h3 className="text-3xl font-black text-white tracking-tighter leading-none uppercase">{item.title}</h3></div>
                            <span className="text-3xl font-black text-white tracking-tighter">${item.price}</span>
                          </div>
                          <p className="text-sm text-white/50 leading-relaxed">{item.description}</p>
                          <button className="w-full h-16 rounded-[1.75rem] bg-white text-black text-[11px] font-black uppercase tracking-widest">Enroll Now</button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-12 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col items-center text-center">
                      <BookOpen size={32} className="text-white/20 mb-4" />
                      <h4 className="text-sm font-black text-white uppercase">No Workshops</h4>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === "reviews" && (
                <motion.div key="reviews" initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-8">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex flex-col items-center text-center">
                      <span className="text-4xl font-black text-white tracking-tighter mb-1">{trustMetrics.rating.toFixed(1)}</span>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className={s <= Math.floor(trustMetrics.rating) ? "fill-yellow-500 text-yellow-500" : "text-white/10"} />
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Verified Rating</span>
                    </div>
                    <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex flex-col items-center text-center">
                      <span className="text-4xl font-black text-blue-400 tracking-tighter mb-1">{trustMetrics.totalJobs}</span>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Total Reviews</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-4">
                    {reviews.length > 0 ? (
                      reviews.map((rev) => (
                        <div key={rev.id} className="p-6 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col gap-4 shadow-xl">
                          <div className="flex justify-between items-start border-b border-white/5 pb-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                                {rev.reviewer?.full_name?.charAt(0) || "U"}
                              </div>
                              <div>
                                <h4 className="text-[11px] font-black text-white uppercase">{rev.reviewer?.full_name || "Client"}</h4>
                                <div className="flex items-center gap-1 mt-0.5">
                                  {[1, 2, 3, 4, 5].map((s) => (
                                    <Star key={s} size={8} className={s <= rev.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">{new Date(rev.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-white/60 leading-relaxed font-medium">"{rev.comment}"</p>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 flex flex-col items-center text-center">
                        <History size={32} className="text-white/20 mb-4" />
                        <h4 className="text-sm font-black text-white uppercase">No Reviews</h4>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {activeTab === "about" && (
                <motion.div key="about" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col gap-8 pb-10">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3 flex items-center gap-2">
                      <User size={12} /> Biography
                    </h3>
                    <p className="text-white/80 leading-relaxed font-light text-sm">
                      {realProfile?.hustle_bio || "No biography provided for this creator."}
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Booking Drawer */}
      <AnimatePresence>
        {showBooking && (
          <BookingFlow
            hustler={hustler}
            initialListing={bookingListing}
            onClose={() => {
              setShowBooking(false);
              setBookingListing(null);
            }}
          />
        )}
      </AnimatePresence>

      {/* Report Sheet */}
      <AnimatePresence>
        {showReport && (
          <ReportSheet
            entityName={realProfile?.full_name || hustler.creator.name}
            targetId={hustler.creator.id}
            targetType="profile"
            onClose={() => setShowReport(false)}
          />
        )}
      </AnimatePresence>

      {/* Schedule Drawer */}
      <AnimatePresence>
        {showSchedule && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSchedule(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              className="fixed inset-x-0 bottom-0 z-[120] bg-[#0c0c0c] border-t border-white/10 rounded-t-[3rem] p-8 max-h-[80vh] overflow-y-auto no-scrollbar pb-safe"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Hustle Schedule</h2>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">When {realProfile?.full_name || hustler.creator.name} is online</p>
                </div>
                <button onClick={() => setShowSchedule(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10">
                  <X size={20} />
                </button>
              </div>
              <div className="space-y-4">
                {schedule.map((item) => (
                  <div key={item.day} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-4">
                      <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${item.active ? "bg-blue-500 text-white" : "bg-white/5 text-white/20"}`}>
                        {item.day}
                      </span>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${item.active ? "text-white" : "text-white/20"}`}>
                        {item.active ? "Active" : "Offline"}
                      </span>
                    </div>
                    {item.active && (
                      <span className="text-sm font-black text-white uppercase">{item.start} - {item.end}</span>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <ServiceDetailModal
            listing={selectedService}
            onClose={() => setSelectedService(null)}
            onBook={(listing) => {
              setBookingListing(listing);
              setSelectedService(null);
              setShowBooking(true);
            }}
          />
        )}
      </AnimatePresence>
 
      {/* Post Detail Viewer */}
      <AnimatePresence>
        {selectedPost && (
          <FullscreenMediaViewer
            url={selectedPost.media_url || selectedPost.thumbnail_url || (selectedPost.media?.[0]?.url) || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=80"}
            type={selectedPost.media_type === 'video' ? 'video' : 'image'}
            caption={selectedPost.description || selectedPost.caption}
            onClose={() => setSelectedPost(null)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
