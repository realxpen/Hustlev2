import { motion, AnimatePresence } from "motion/react";
import { 
  Star, MapPin, CheckCircle2, MessageSquare, MoreHorizontal, Grid, 
  Briefcase, Info, Calendar, Edit2, ChevronLeft, X, ArrowRight,
  ShoppingBag, BookOpen, Clock, Heart, Camera, Settings, Plus, Play, Link as LinkIcon,
  ShieldCheck, ShieldAlert, Check, AlertCircle, TrendingUp, CreditCard, User, History, Zap, ChevronRight, RefreshCcw,
  Bookmark, Repeat, Users, Award, GraduationCap
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import BookingFlow from "./BookingFlow";
import ReportSheet from "./ReportSheet";
import HustlerUpgradeFlow, { UpgradeStep } from "./HustlerUpgradeFlow";
import CreateOfferingFlow from "./CreateOfferingFlow";
import ServiceDetailModal from "./ServiceDetailModal";
import ImageEditorModal from "./ImageEditorModal";
import AgencyCenter from "./AgencyCenter";
import { LearnerWorkspace } from "./apprenticeship/LearnerWorkspace";
import { MentorDashboard } from "./apprenticeship/MentorDashboard";
import { useProfileStore } from "../features/profile/stores/useProfileStore";
import { useUpdateProfile } from "../features/profile/hooks/useUpdateProfile";
import { useAvatarUpload } from "../features/profile/hooks/useAvatarUpload";
import { useFeedStore } from "../features/feed/stores/useFeedStore";
import { useBookingStore } from "../features/bookings/stores/useBookingStore";
import { useAgentStore } from "../stores/useAgentStore";
import { supabase } from "../lib/supabase";
import FullscreenMediaViewer from "./FullscreenMediaViewer";
import FeedCard from "./FeedCard";

export function dataURLtoFile(dataurl: string, filename: string): File | null {
  const arr = dataurl.split(',');
  const mimeMatch = arr[0].match(/:(.*?);/);
  if (!mimeMatch) return null;
  const mime = mimeMatch[1];
  const bstr = atob(arr[1]); 
  let n = bstr.length; 
  const u8arr = new Uint8Array(n);
  while(n--){
      u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, {type: mime});
}


interface MyProfileHubProps {
  isHustler?: boolean;
  onHustlerModeChange?: (isHustler: boolean) => void;
  setActiveNav?: (nav: any) => void;
  onOpenCreatorStudio?: () => void;
  onSignOut?: () => void;
  onOpenBookingDetail?: (booking: any) => void;
  onOpenChat?: (booking: any) => void;
}

export default function MyProfileHub({ 
  isHustler = false, 
  onHustlerModeChange, 
  setActiveNav, 
  onOpenCreatorStudio,
  onSignOut,
  onOpenBookingDetail,
  onOpenChat
}: MyProfileHubProps) {
  const { profile: realProfile } = useProfileStore();
  const { updateProfile, error: updateError } = useUpdateProfile();
  const { uploadImage } = useAvatarUpload(); 
  const { buyerOrders, sellerOrders, fetchBookings } = useBookingStore();
  const { 
    submitAgentApplication, 
    isLoading: isAgentLoading,
    pendingInvites,
    fetchPendingInvites,
    respondToInvite
  } = useAgentStore();

  const [activeTab, setActiveTab] = useState("posts");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [showCreateOffering, setShowCreateOffering] = useState<boolean>(false);
  const [selectedService, setSelectedService] = useState<any>(null);
  const [upgradeInitialStep, setUpgradeInitialStep] = useState<UpgradeStep>("intro");
  const [hustlerMode, setHustlerMode] = useState(isHustler);
  
  const [showAgencyCenter, setShowAgencyCenter] = useState(false);
  const [showAgentApplication, setShowAgentApplication] = useState(false);
  const [agencyFormData, setAgencyFormData] = useState({ name: "", bio: "" });
  const [applicationSubmitted, setApplicationSubmitted] = useState(false);

  useEffect(() => {
    setHustlerMode(isHustler);
  }, [isHustler]);
  const [isEditing, setIsEditing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [jobFilter, setJobFilter] = useState("Active");
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const [statusMessage, setStatusMessage] = useState(realProfile?.availability_status || "Open for Bookings");
  const [reviewFilter, setReviewFilter] = useState<"received" | "given">("received");
  const [imageEditorState, setImageEditorState] = useState<{isOpen: boolean, type: 'avatar' | 'cover' | null}>({ isOpen: false, type: null });

  useEffect(() => {
    fetchPendingInvites();
  }, []);

  // 1. Initialize from real profile
  useEffect(() => {
    if (realProfile) {
      setIsAvailable(realProfile.is_available ?? true);
      if (realProfile.availability_status) {
        setStatusMessage(realProfile.availability_status);
      }
      if (realProfile.capacity) {
        setCapacity(realProfile.capacity);
      }
      if (realProfile.schedule) {
        setSchedule(realProfile.schedule as any);
      }
    }
  }, [realProfile]);

  const handleUpdateCapacity = async (val: number) => {
    setCapacity(val);
    try {
      await updateProfile({ capacity: val });
    } catch (e) {
      console.error("Failed to update capacity:", e);
    }
  };

  const handleUpdateSchedule = async (newSchedule: any[]) => {
    setSchedule(newSchedule);
    try {
      await updateProfile({ schedule: newSchedule as any });
    } catch (e) {
      console.error("Failed to update schedule:", e);
    }
  };

  const handleToggleAvailability = async (available: boolean) => {
    setIsAvailable(available);
    try {
      await updateProfile({ is_available: available });
    } catch (e) {
      console.error("Failed to update availability:", e);
    }
  };

  const handleUpdateStatus = async (status: string) => {
    setStatusMessage(status);
    const available = status !== "Fully Booked" && status !== "Away / Vacation";
    setIsAvailable(available);
    try {
      await updateProfile({ 
        availability_status: status,
        is_available: available 
      });
    } catch (e) {
      console.error("Failed to update status:", e);
    }
  };

  // 7. EARNINGS + ACTIVITY SECTION (Hustler Mode)
  const [reviewsReceived, setReviewsReceived] = useState<any[]>([]);
  const [reviewsGiven, setReviewsGiven] = useState<any[]>([]);
  const [myPosts, setMyPosts] = useState<any[]>([]);
  const [hustlerJobs, setHustlerJobs] = useState<any[]>([]);
  const [myBookings, setMyBookings] = useState<any[]>([]);
  const [myApprenticeships, setMyApprenticeships] = useState<any[]>([]);
  const [featuredOfferings, setFeaturedOfferings] = useState<any[]>([]);
  const [selectedPost, setSelectedPost] = useState<any>(null);

  const [earningsData, setEarningsData] = useState({
    total: 0,
    escrow: 0,
    monthly: 0,
    payoutDate: "N/A",
    txns: [] as any[]
  });

  const [schedule, setSchedule] = useState([
    { day: "Mon", active: true, start: "09:00", end: "18:00" },
    { day: "Tue", active: true, start: "09:00", end: "18:00" },
    { day: "Wed", active: true, start: "09:00", end: "18:00" },
    { day: "Thu", active: true, start: "09:00", end: "18:00" },
    { day: "Fri", active: true, start: "10:00", end: "16:00" },
    { day: "Sat", active: false, start: "10:00", end: "14:00" },
    { day: "Sun", active: false, start: "10:00", end: "14:00" },
  ]);
  const [capacity, setCapacity] = useState(4);
  const [autoAway, setAutoAway] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  const [errorToast, setErrorToast] = useState<string | null>(null);

  const trustMetrics = {
    rating: realProfile?.is_hustler ? (realProfile?.rating_average !== null && realProfile?.rating_average !== undefined ? realProfile.rating_average : 0) : 0,
    completionScore: 98,
    repeatClientRate: 42,
    totalJobs: realProfile?.is_hustler ? (realProfile?.review_count || 0) : 0
  };

  const statusReasons = [
    { label: "Open for Bookings", icon: <Check size={12} />, color: "text-green-400" },
    { label: "Deep Work", icon: <Briefcase size={12} />, color: "text-blue-400" },
    { label: "On a Break", icon: <Clock size={12} />, color: "text-yellow-400" },
    { label: "Fully Booked", icon: <ShieldAlert size={12} />, color: "text-red-400" },
    { label: "Away / Vacation", icon: <MapPin size={12} />, color: "text-purple-400" },
  ];

  useEffect(() => {
    if (updateError) {
      setErrorToast(updateError);
    }
  }, [updateError]);

  useEffect(() => {
    if (errorToast) {
      const timer = setTimeout(() => setErrorToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [errorToast]);

  const profile = {
    name: realProfile?.full_name || "New Hustler",
    username: realProfile?.username ? `@${realProfile.username}` : "@newuser",
    bio: realProfile?.bio || "No bio yet",
    avatar: realProfile?.avatar_url || "https://api.dicebear.com/7.x/avataaars/svg?seed=fallback",
    cover: (realProfile as any)?.cover_url || "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=60",
    primaryHustle: realProfile?.primary_skill || realProfile?.profession || "Hustler",
    secondaryHustles: realProfile?.secondary_skills || realProfile?.interests || [],
    location: realProfile?.location || "Unknown Location",
    rating: realProfile?.is_hustler ? (realProfile?.rating_average !== null && realProfile?.rating_average !== undefined ? realProfile.rating_average : 0) : 0,
    jobs: realProfile?.is_hustler ? (realProfile?.review_count || 0) : 0,
    verified: realProfile?.verified || false,
    responseRate: "100%",
    responseTime: "1hr",
  };



  const [myServices, setMyServices] = useState<any[]>([]);
  const [myProducts, setMyProducts] = useState<any[]>([]);
  const [myTrainings, setMyTrainings] = useState<any[]>([]);



  const loadMyRealOfferings = async () => {
    if (!realProfile?.id) return;
    try {
      const [{ data: servs }, { data: prods }, { data: trains }, { data: receivedRevs }, { data: givenRevs }, { data: posts }, { data: hJobs }, { data: mBookings }, { data: ledgers }] = await Promise.all([
        (supabase as any).from("services").select("*").eq("owner_id", realProfile.id),
        (supabase as any).from("products").select("*").eq("owner_id", realProfile.id),
        (supabase as any).from("training").select("*").eq("owner_id", realProfile.id),
        (supabase as any).from("reviews").select("*, reviewer:profiles!reviews_reviewer_id_fkey(full_name, avatar_url), service:services(title)").eq("provider_id", realProfile.id),
        (supabase as any).from("reviews").select("*, provider:profiles!reviews_provider_id_fkey(full_name, avatar_url), service:services(title)").eq("reviewer_id", realProfile.id),
        (supabase as any).from("posts").select(`
          *,
          profiles!posts_user_id_fkey(id, full_name, username, avatar_url, hustle_name, primary_skill, is_hustler, review_count, rating_average, has_reviews)
        `).eq("user_id", realProfile.id).order("created_at", { ascending: false }),
        (supabase as any).from("bookings").select("*, client:profiles!bookings_buyer_id_fkey(full_name, avatar_url), service:services(title)").eq("seller_id", realProfile.id),
        (supabase as any).from("bookings").select("*, hustler:profiles!bookings_seller_id_fkey(full_name, avatar_url), service:services(title)").eq("buyer_id", realProfile.id),
        (supabase as any).from("ledger_entries").select("*").eq("profile_id", realProfile.id)
      ]);

      if (receivedRevs) {
        setReviewsReceived(receivedRevs.map((r: any) => ({
          id: r.id,
          author: r.reviewer?.full_name || "Unknown",
          rating: r.rating,
          comment: r.comment,
          date: new Date(r.created_at).toLocaleDateString(),
          avatar: r.reviewer?.avatar_url ? r.reviewer.avatar_url : (r.reviewer?.full_name || "U")[0],
          repeat: false,
          service: r.service?.title || "Service"
        })));
      }
      
      if (givenRevs) {
        setReviewsGiven(givenRevs.map((r: any) => ({
          id: r.id,
          recipient: r.provider?.full_name || "Unknown",
          rating: r.rating,
          comment: r.comment,
          date: new Date(r.created_at).toLocaleDateString(),
          avatar: r.provider?.avatar_url ? r.provider.avatar_url : (r.provider?.full_name || "U")[0],
        })));
      }

      if (posts) {
        let hydratedPosts: any[] = [];
        try {
          hydratedPosts = await useFeedStore.getState().hydrateFeed(posts);
        } catch (e) {
          console.error("Hydration failed, falling back to raw posts:", e);
          hydratedPosts = posts;
        }

        setMyPosts(hydratedPosts.map((p: any) => ({
          ...p,
          id: p.id,
          type: p.media_type === "video" ? "video" : (p.media_url ? "image" : "text"),
          views: p.views_count !== undefined ? String(p.views_count) : "0",
          thumb: p.media_url || null,
          url: p.media_url || null,
          caption: p.caption || "",
          duration: p.media_type === "video" ? "0:15" : null,
          pinned: p.pinned || false,
          likes_count: p.likes_count || 0,
          comments_count: p.comments_count || 0,
          shares_count: p.shares_count || 0,
          reposts_count: p.reposts_count || 0,
          saves_count: p.saves_count || 0,
          userHasLiked: p.userHasLiked || false,
          userHasSaved: p.userHasSaved || false,
          userHasReposted: p.userHasReposted || false,
        })));
      }

      if (hJobs) {
        setHustlerJobs(hJobs.map((j: any) => ({
          id: `JOB-${j.id.substring(0, 5)}`,
          client: j.client?.full_name || "Unknown Client",
          service: j.service?.title || "Custom Service",
          amount: `$${j.payout_amount || j.total_price || 0}`,
          due: j.scheduled_date ? new Date(j.scheduled_date).toLocaleDateString() : "TBD",
          status: j.status,
          progress: j.status === 'completed' ? 100 : (j.status === 'in_progress' ? 50 : 10),
          avatar: j.client?.avatar_url ? j.client.avatar_url : (j.client?.full_name || "C")[0],
          type: j.status === 'completed' ? 'Completed' : (j.status === 'pending' ? 'Pending' : 'Active')
        })));
      }

      if (mBookings) {
         setMyBookings(mBookings.map((b: any) => ({
            id: `BOK-${b.id.substring(0, 5)}`,
            hustler: b.hustler?.full_name || "Unknown Hustler",
            service: b.service?.title || "Custom Service",
            amount: `$${b.total_price || 0}`,
            due: b.scheduled_date ? new Date(b.scheduled_date).toLocaleDateString() : "TBD",
            status: b.status,
            progress: b.status === 'completed' ? 100 : (b.status === 'in_progress' ? 50 : 10),
            avatar: b.hustler?.avatar_url ? b.hustler.avatar_url : (b.hustler?.full_name || "H")[0],
            type: b.status === 'completed' ? 'Completed' : (b.status === 'pending' ? 'Pending' : 'Active')
         })));
      }

      if (ledgers) {
        const total = ledgers.filter((l: any) => l.type === 'credit').reduce((sum: number, l: any) => sum + Number(l.amount), 0)
                    - ledgers.filter((l: any) => l.type === 'debit').reduce((sum: number, l: any) => sum + Number(l.amount), 0);
        
        setEarningsData({
          total,
          escrow: 0,
          monthly: total,
          payoutDate: "TBD",
          txns: ledgers.map((l: any) => ({
            id: l.id,
            amount: Number(l.amount),
            client: l.description,
            date: new Date(l.created_at).toLocaleDateString(),
            status: l.status
          }))
        });
      }

      if (servs && servs.length > 0) {
        const mappedServices = servs.map((s: any) => ({
          id: s.id,
          name: s.title,
          price: Number(s.base_price) || 0,
          time: s.delivery_time || "3 Days",
          desc: s.description || "",
          features: ["Professional Handoff", "Interactive Workspace", "Revisions"],
          image: s.media && s.media[0] ? s.media[0].url : "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop",
          video: s.media && s.media.find((m: any) => m.type === "video")?.url || null,
          popular: false,
          media: s.media || [],
          is_active: s.is_active !== false
        }));
        setMyServices(mappedServices);
      }

      if (prods && prods.length > 0) {
        const mappedProducts = prods.map((p: any) => ({
          id: p.id,
          name: p.title,
          price: Number(p.price) || 0,
          type: p.product_type || "Digital",
          image: p.media && p.media[0] ? p.media[0].url : "https://images.unsplash.com/photo-1541461985943-955a15064562?w=400&auto=format&fit=crop&q=60",
          stock: p.inventory_count !== null && p.inventory_count !== undefined ? String(p.inventory_count) : "Unlimited",
          rating: 5.0,
          sales: 0,
          desc: p.description || "",
          media: p.media || [],
          is_active: p.is_active !== false
        }));
        setMyProducts(mappedProducts);
      }
      
      const newFeatured: any[] = [];
      if (servs && servs.length > 0) {
        newFeatured.push({ id: servs[0].id, name: servs[0].title, price: servs[0].base_price, type: "service", image: servs[0].media?.[0]?.url });
      }
      if (prods && prods.length > 0) {
        newFeatured.push({ id: prods[0].id, name: prods[0].title, price: prods[0].price, type: "product", image: prods[0].media?.[0]?.url });
      }
      setFeaturedOfferings(newFeatured);

      if (trains && trains.length > 0) {
        const mappedTrainings = trains.map((t: any) => ({
          id: t.id,
          name: t.title,
          price: Number(t.price) || 0,
          duration: "Self-paced",
          type: t.training_type || "Recorded",
          modules: 5,
          students: 0,
          rating: 5.0,
          image: t.media && t.media[0] ? t.media[0].url : "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&auto=format&fit=crop&q=60",
          desc: t.description || "",
          media: t.media || [],
          is_active: t.is_active !== false
        }));
        setMyTrainings(mappedTrainings);
      }
    } catch (err) {
      console.error("Error loading real offerings:", err);
    }
  };

  useEffect(() => {
    loadMyRealOfferings();
    fetchBookings();
  }, [realProfile?.id, fetchBookings]);



  const tabs = [
    { id: "posts", label: "Posts", icon: <Grid size={14} /> },
    { id: "academy", label: "Academy", icon: <GraduationCap size={14} /> },
    ...(hustlerMode ? [
      { id: "fellowships", label: "Fellowships", icon: <Award size={14} /> },
      { id: "services", label: "Services", icon: <Briefcase size={14} /> },
      { id: "products", label: "Products", icon: <ShoppingBag size={14} /> },
      { id: "trainings", label: "Trainings", icon: <BookOpen size={14} /> },
      { id: "reviews", label: "Reviews", icon: <Star size={14} /> },
    ] : []),
    { id: "about", label: "About", icon: <Info size={14} /> },
  ];

  const handleTabChange = (id: string) => {
    setActiveTab(id);
    if (scrollRef.current) {
      const sectionOffset = 380; 
      if (scrollRef.current.scrollTop > sectionOffset) {
        scrollRef.current.scrollTo({ top: sectionOffset, behavior: 'smooth' });
      }
    }
  };

  return (
    <div className={`flex flex-col w-full h-full ${hustlerMode ? 'bg-[#05060a]' : 'bg-[#050505]'} overflow-y-auto no-scrollbar scroll-smooth relative transition-colors duration-500`} ref={scrollRef}>
      <div className="grain-overlay pointer-events-none" />

      {/* Floating Alert Notification */}
      <AnimatePresence>
        {errorToast && (
          <motion.div 
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-20 left-1/2 -translate-x-1/2 z-[500] max-w-sm w-[90%] bg-red-950/95 border border-red-500/50 backdrop-blur-md p-4 rounded-2xl shadow-[0_15px_30px_rgba(0,0,0,0.6)] flex items-start gap-3 text-red-100"
          >
            <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
              <Info size={12} className="text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-[10px] font-black uppercase tracking-widest text-red-400 mb-0.5">System Alert</p>
              <p className="text-[11px] font-medium leading-relaxed">{errorToast}</p>
            </div>
            <button onClick={() => setErrorToast(null)} className="text-white/40 hover:text-white shrink-0">
              <X size={14} />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dynamic Identity Glow */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${hustlerMode ? 'opacity-30' : 'opacity-0'}`}>
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[150px] opacity-20" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] opacity-10" />
      </div>

      {/* Sticky Top Navigation - Enhanced with Back Button and Mode Context */}
      <header className="sticky top-0 z-[100] flex justify-between items-center px-4 py-3 bg-[#05060a]/90 backdrop-blur-2xl border-b border-white/5 safe-top shadow-xl transition-colors duration-500">
        <div className="flex items-center gap-3">
          {setActiveNav && (
            <button 
              onClick={() => setActiveNav("feed")}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-colors active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <div className="flex flex-col">
            <h2 className="text-[11px] font-black tracking-[0.2em] uppercase text-white/40">My Identity</h2>
            <h1 className="text-sm font-display font-black tracking-widest uppercase text-white truncate max-w-[200px]">
              Unified Hub
            </h1>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Badge indicator instead of dual role system switcher */}
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-full">
            <ShieldCheck size={12} className="text-blue-400" />
            <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">UNIFIED OWNER</span>
          </div>

          <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-colors">
            <Settings size={18} />
          </button>
        </div>
      </header>

      {/* Profile Sections Container with proper padding for bottom nav */}
      <div className="flex-1 flex flex-col pb-48">
        {/* Cover & Identity Section - High Impact Redesign */}
        <section className="relative flex flex-col items-center w-full">
          {/* Quick Availability Action Bar - Frictionless */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-20 flex items-center gap-1.5"
          >
            <button 
              onClick={() => handleToggleAvailability(!isAvailable)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-2xl border transition-all shadow-2xl active:scale-95 ${
                isAvailable ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isAvailable ? (statusMessage || "Live") : "Paused"}
              </span>
            </button>
            
            <button 
              onClick={() => setShowAvailabilityManager(true)}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-all shadow-xl backdrop-blur-xl"
            >
              <Settings size={12} />
            </button>
          </motion.div>

          {/* Cover Photo - Editable */}
          <div 
            className="w-full h-56 bg-gradient-to-br from-blue-900/20 to-purple-900/20 relative group overflow-hidden cursor-pointer"
            onClick={() => setImageEditorState({ isOpen: true, type: 'cover' })}
          >
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              src={profile.cover || undefined} 
              className="w-full h-full object-cover opacity-50 group-hover:opacity-60 transition-opacity" 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/40 to-transparent" />
            <button className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-black/60 backdrop-blur-xl rounded-full text-[10px] font-black uppercase tracking-widest text-white/90 border border-white/10 hover:bg-black/80 transition-all opacity-0 group-hover:opacity-100">
              <Camera size={14} /> Change Cover
            </button>
            
            {/* Quick Stats Overlay - Bottom Right of Cover */}
            <div className="absolute bottom-6 right-6 flex flex-col items-end gap-1">
               <div className="flex -space-x-2">
                 {[1,2,3].map(i => (
                   <div key={i} className="w-6 h-6 rounded-full border-2 border-[#050505] bg-white/10 overflow-hidden">
                     <img src={`https://i.pravatar.cc/100?img=${i+10}`} className="w-full h-full object-cover" />
                   </div>
                 ))}
                 <div className="w-6 h-6 rounded-full border-2 border-[#050505] bg-blue-500 flex items-center justify-center text-[8px] font-black">+49</div>
               </div>
               <span className="text-[10px] text-white/40 font-black uppercase tracking-widest">Repeats Last 30d</span>
            </div>
          </div>

          {/* Profile Identity Card */}
          <div className="relative -mt-20 px-6 w-full flex flex-col items-center z-10 transition-all">
            {/* Editable Avatar */}
            <div 
              className="relative group cursor-pointer"
              onClick={() => setImageEditorState({ isOpen: true, type: 'avatar' })}
            >
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-36 h-36 rounded-[2.5rem] border-4 border-[#050505] overflow-hidden bg-white/5 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:rounded-[1.5rem] transition-all duration-500"
              >
                <img 
                  src={profile.avatar || undefined} 
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Camera size={28} className="text-white mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Edit PFP</span>
                </div>

                {/* Mode Context Badge */}
                <div className="absolute top-0 inset-x-0 py-1 flex items-center justify-center bg-gradient-to-r from-blue-600/80 to-indigo-600/80 backdrop-blur-sm">
                   <span className="text-[7px] font-black uppercase tracking-widest text-white">
                      Unified Member
                   </span>
                </div>
              </motion.div>
              
              {/* Intelligent Status Dot */}
              <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-2xl border-4 border-[#050505] z-20 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform ${isAvailable ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}>
                <Zap size={14} className="text-white fill-white" />
              </div>
            </div>

              {/* Display Headers */}
              <div className="mt-6 text-center w-full">
                <div className="flex flex-col items-center transition-all">
                  {isEditing ? (
                    <input
                      type="text"
                      className="text-2xl font-display font-black tracking-tighter text-center text-white bg-white/5 border border-white/20 rounded-xl px-4 py-2 uppercase outline-none focus:border-blue-500 max-w-[280px]"
                      value={profile.name}
                      onChange={(e) => updateProfile({ full_name: e.target.value })}
                      onBlur={() => setIsEditing(false)}
                      autoFocus
                    />
                  ) : (
                    <motion.h1 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="text-4xl font-display font-black tracking-tighter flex items-center gap-3 text-white uppercase group cursor-pointer"
                      onClick={() => setIsEditing(true)}
                    >
                      {profile.name}
                      <Edit2 size={16} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                    </motion.h1>
                  )}
                  
                  {/* trust rating micro-indicators */}
                  {hustlerMode && trustMetrics.totalJobs > 0 ? (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-3 mt-2 animate-fade-in"
                    >
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className={s <= Math.floor(trustMetrics.rating) ? "fill-yellow-500 text-yellow-500" : "text-white/10"} />
                        ))}
                        <span className="text-[10px] font-black text-white ml-1">{trustMetrics.rating}</span>
                      </div>
                      <div className="h-3 w-px bg-white/10" />
                      <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{profile.username}</span>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.1 }}
                      className="flex items-center gap-3 mt-2"
                    >
                      <span className="text-[10px] text-white/40 font-black uppercase tracking-[0.2em]">{profile.username}</span>
                    </motion.div>
                  )}
                </div>

                {/* Social Counts */}
                <div className="flex items-center justify-center gap-6 mt-4">
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
                  {(realProfile?.mutual_count || 0) > 0 && (
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

              {/* Availability Management for Owner - MOVED HIGHER */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="mt-6 p-1 rounded-[2rem] bg-white/[0.02] border border-white/5 w-full max-w-sm mx-auto flex items-center shadow-inner"
              >
                <div className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-[1.75rem] transition-all bg-[#0c0c0c] border border-white/10 shadow-xl cursor-pointer hover:bg-white/[0.04]`} 
                  onClick={() => setShowAvailabilityManager(true)}
                >
                  <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'}`} />
                  <div className="text-left flex-1">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-black text-white uppercase tracking-tight">Status</p>
                      <Calendar size={11} className="text-white/20" />
                    </div>
                    <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-black">
                      {isAvailable ? (statusMessage || "Open for Bookings") : "Paused • Back Soon"}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setShowAvailabilityManager(true)}
                  className={`ml-1 px-5 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl ${
                    isAvailable ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white' : 'bg-white text-black'
                  }`}
                >
                  {isAvailable ? "Manage" : "Live"}
                </button>
              </motion.div>
              
              {/* Trust Badges Bar */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="flex items-center justify-center gap-3 mt-5"
              >
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-help">
                  <TrendingUp size={12} className="text-green-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Top 1% Creator</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-help">
                  <ShieldCheck size={12} className="text-blue-400" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/60">LVL 4 PRO</span>
                </div>
              </motion.div>

              {/* Bio & Location Selection */}
              <div className="max-w-md mx-auto mt-6 relative group cursor-pointer" onClick={() => !isEditingBio && setIsEditingBio(true)}>
                {isEditingBio ? (
                  // ... bio editing ...
                  <div className="flex flex-col gap-3">
                    <textarea 
                      className="w-full bg-white/5 border border-white/20 rounded-xl p-3 text-white text-sm outline-none focus:border-blue-500 italic resize-none"
                      value={profile.bio}
                      onChange={(e) => updateProfile({ bio: e.target.value })}
                      rows={3}
                      autoFocus
                    />
                    <div className="flex items-center gap-2">
                       <MapPin size={14} className="text-white/40" />
                       <input 
                         type="text"
                         className="flex-1 bg-white/5 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white uppercase outline-none focus:border-blue-500 font-black tracking-[0.2em]"
                         value={profile.location}
                         onChange={(e) => updateProfile({ location: e.target.value })}
                         placeholder="Location"
                       />
                    </div>
                    <button 
                      onClick={(e) => { e.stopPropagation(); setIsEditingBio(false); }}
                      className="mt-2 text-[10px] font-black uppercase tracking-widest text-black bg-white py-2 rounded-xl"
                    >
                      Save Bio
                    </button>
                  </div>
                ) : (
                  <>
                    <p className="text-white/50 text-sm leading-relaxed px-4 group-hover:text-white/70 transition-colors italic">
                      "{profile.bio}"
                    </p>
                    <div className="flex items-center justify-center gap-2 mt-4 text-white/30 text-[10px] uppercase tracking-[0.2em] font-black">
                      <MapPin size={12} className="text-white/20" />
                      {profile.location} • <Clock size={12} className="text-white/20" /> Active Today
                      <Edit2 size={10} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                  </>
                )}
              </div>

              {/* Management Requests (Specialist Side) */}
              {pendingInvites.filter(i => i.hustler_id === realProfile?.id).length > 0 && (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mt-8 px-6 w-full max-w-lg mx-auto space-y-3"
                >
                  <p className="text-[9px] font-black uppercase text-white/30 tracking-widest ml-4">Management Requests</p>
                  {pendingInvites.filter(i => i.hustler_id === realProfile?.id).map(invite => (
                    <div 
                      key={invite.id}
                      className="p-4 rounded-[2rem] bg-emerald-500/10 border border-emerald-500/20 flex flex-col gap-4 relative overflow-hidden group"
                    >
                      <div className="flex items-center gap-3 relative z-10">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                          <Users size={20} />
                        </div>
                        <div className="text-left flex-1">
                          <h4 className="text-xs font-black text-white uppercase tracking-wider">
                            {invite.agent_profile?.agency_name || "New Agency Request"}
                          </h4>
                          <p className="text-[9px] text-white/40 uppercase font-bold">{invite.commission_percentage}% Fixed Commission split</p>
                        </div>
                      </div>
                      <div className="flex gap-2 relative z-10">
                        <button 
                          onClick={() => respondToInvite(invite.id, 'active')}
                          className="flex-1 h-10 bg-emerald-500 text-black text-[10px] font-black uppercase tracking-widest rounded-xl active:scale-95 transition-all"
                        >
                          Accept
                        </button>
                        <button 
                          onClick={() => respondToInvite(invite.id, 'revoked')}
                          className="flex-1 h-10 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-white/10 hover:text-white transition-all"
                        >
                          Decline
                        </button>
                      </div>
                      <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 blur-2xl pointer-events-none" />
                    </div>
                  ))}
                </motion.div>
              )}

              {/* Agency Controls - Exclusive for Agents */}
              {realProfile?.is_agent ? (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 px-6 w-full max-w-lg mx-auto"
                >
                  <button 
                    onClick={() => setShowAgencyCenter(true)}
                    className="w-full p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-600/20 to-blue-900/10 border border-blue-500/30 flex items-center justify-between group active-scale shadow-2xl relative overflow-hidden"
                  >
                    <div className="flex items-center gap-4 relative z-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/10 flex items-center justify-center text-blue-400 border border-blue-500/20 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <Users size={24} />
                      </div>
                      <div className="text-left">
                        <p className="text-[10px] font-black text-blue-400 uppercase tracking-[0.2em] mb-1">Agency Management</p>
                        <h4 className="text-lg font-black text-white italic tracking-tighter uppercase whitespace-nowrap">
                           {realProfile.agency_name || "Enterprise Agency"}
                        </h4>
                      </div>
                    </div>
                    <div className="relative z-10 w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 group-hover:text-white group-hover:bg-white/10 transition-all">
                       <ArrowRight size={20} />
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500 opacity-5 blur-3xl pointer-events-none group-hover:opacity-20 transition-opacity" />
                  </button>
                </motion.div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mt-8 px-6 w-full max-w-lg mx-auto"
                >
                  <button 
                    onClick={() => setShowAgentApplication(true)}
                    className="w-full px-6 py-4 rounded-[1.75rem] bg-white/[0.02] border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all text-white/40 hover:text-white"
                  >
                    <div className="flex items-center gap-3">
                      <Award size={18} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                      <span className="text-[10px] font-black uppercase tracking-widest leading-none">Apply for Agency Status</span>
                    </div>
                    <ChevronRight size={16} className="opacity-0 group-hover:opacity-100 transition-all" />
                  </button>
                </motion.div>
              )}

              {/* Hustle & Identity Cards */}
              {isHustler ? (
                <div className="grid grid-cols-2 gap-3 mt-8 w-full max-w-lg mx-auto">
                  <div className="p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-left relative group cursor-pointer overflow-hidden active:scale-95 transition-all">
                    <div className="absolute top-0 right-0 p-3 opacity-10">
                      <Briefcase size={32} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-blue-400/80 mb-2 block">Primary Hustle</span>
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-xl bg-blue-500 flex items-center justify-center text-white">
                          <Camera size={16} />
                       </div>
                       <span className="text-sm font-black text-white uppercase tracking-tight">{profile.primaryHustle}</span>
                    </div>
                  </div>
                  
                  <div 
                    id="secondary-stack-card"
                    onClick={() => {
                      setUpgradeInitialStep("skill");
                      setShowUpgrade(true);
                    }}
                    className="p-4 rounded-3xl bg-gradient-to-b from-white/[0.06] to-white/[0.02] border border-white/[0.12] hover:border-blue-500/40 text-left relative group cursor-pointer overflow-hidden active:scale-95 transition-all duration-300 hover:shadow-[0_8px_30px_rgba(0,0,0,0.5)] flex flex-col min-h-[5.5rem] justify-between"
                  >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-30 group-hover:scale-110 transition-all duration-300">
                      <Plus size={32} className="text-blue-400" />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/40 mb-2 block group-hover:text-blue-400 transition-colors">Secondary Stack</span>
                    
                    {profile.secondaryHustles.length > 0 ? (
                      <div className="flex flex-wrap gap-1.5 mt-auto">
                        {profile.secondaryHustles.map((h, i) => (
                          <span 
                            key={i} 
                            className="px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-[9px] font-bold text-blue-300 tracking-wider flex items-center gap-1 hover:bg-red-500/10 hover:border-red-500/30 hover:text-red-400 transition-all duration-300 cursor-pointer"
                            onClick={(e) => {
                              e.stopPropagation();
                              const updated = profile.secondaryHustles.filter((item) => item !== h);
                              updateProfile({ 
                                interests: updated,
                                secondary_skills: updated,
                                is_hustler: true
                              });
                            }}
                          >
                            {h}
                            <X size={8} className="opacity-60 hover:opacity-100 transition-opacity" />
                          </span>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 mt-auto">
                        <div className="w-6 h-6 rounded-lg bg-white/5 flex items-center justify-center text-white/40 border border-white/20 border-dashed group-hover:border-blue-500/50 group-hover:bg-blue-500/10 transition-all duration-300">
                          <Plus size={12} className="group-hover:text-blue-400" />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-white/30 group-hover:text-white/60 transition-colors">Add secondary hustle</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-8 w-full max-w-sm mx-auto flex flex-col gap-3"
                >
                  <div className="p-5 rounded-[2rem] bg-gradient-to-br from-blue-900/40 to-purple-900/20 border border-blue-500/30 text-center shadow-2xl relative overflow-hidden group">
                     <div className="relative z-10 flex flex-col items-center">
                        <Zap size={24} className="text-blue-400 mb-2" />
                        <h4 className="text-xl font-black text-white uppercase tracking-tight italic">Become a Hustler</h4>
                        <p className="text-[10px] text-white/60 font-medium leading-relaxed mt-2 max-w-[200px] uppercase tracking-widest">
                          Turn your skills into income. Join the earning economy.
                        </p>
                        <button 
                          onClick={() => {
                            setUpgradeInitialStep("intro");
                            setShowUpgrade(true);
                          }}
                          className="mt-6 w-full h-12 bg-white text-black font-black uppercase tracking-[0.2em] text-[10px] rounded-2xl active:scale-95 shadow-xl transition-all hover:shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                        >
                          Start Earning
                        </button>
                     </div>
                     <div className="absolute -inset-2 bg-gradient-to-tr from-blue-500/20 to-transparent opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-700" />
                  </div>
                </motion.div>
              )}
            </div>
            
            {/* Rating + Reliability Metrics */}
            {hustlerMode && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 }}
                className="grid grid-cols-3 gap-0 mt-8 rounded-[2rem] bg-white/[0.03] border border-white/10 w-full max-w-lg overflow-hidden shadow-2xl relative"
              >
                <div className="absolute top-0 left-1/3 w-[1px] h-full bg-white/10" />
                <div className="absolute top-0 left-2/3 w-[1px] h-full bg-white/10" />
                
                <div className="flex flex-col items-center justify-center py-6 px-2 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <div className="flex items-center gap-1.5 text-white font-black text-2xl tracking-tighter">
                    <Star size={20} className="text-yellow-500 fill-yellow-500" />
                    {profile.rating > 0 ? profile.rating : 'N/A'}
                  </div>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-black mt-2 group-hover:text-white/60 transition-colors">
                    {profile.jobs} {profile.jobs === 1 ? 'Review' : 'Reviews'}
                  </span>
                </div>

                <div className="flex flex-col items-center justify-center py-6 px-2 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <span className="text-white font-black text-3xl tracking-tighter leading-none">{profile.jobs}</span>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-black mt-2 group-hover:text-white/60 transition-colors">Hustles Won</span>
                </div>

                <div className="flex flex-col items-center justify-center py-6 px-2 hover:bg-[#171c26]/20 transition-all duration-300 group cursor-pointer">
                  <span className="text-white font-black text-2xl tracking-tighter flex items-center gap-1">
                    {profile.responseTime}
                    <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                  </span>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-black mt-2 group-hover:text-white/60 transition-colors">Response Speed</span>
                </div>
              </motion.div>
            )}

          </div>
        </section>

        {/* Unified Active Hub - Income Ledger & Project Work flows */}
        <div className="px-6 mb-8 flex flex-col gap-8">
          {/* Earnings & Escrow Indicators */}
          {hustlerMode && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-2 gap-3"
            >
              <div className="p-6 rounded-[2rem] bg-blue-600 shadow-[0_20px_40px_rgba(37,99,235,0.2)] flex flex-col justify-between h-40 relative overflow-hidden group cursor-pointer"
                onClick={onOpenCreatorStudio}
              >
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Available Balance</span>
                  <div className="text-3xl font-black text-white tracking-tighter mt-1">${earningsData.total.toLocaleString()}</div>
                </div>
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Payout: {earningsData.payoutDate}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/60">Studio</span>
                    <button className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center text-white backdrop-blur-md">
                      <ArrowRight size={14} />
                    </button>
                  </div>
                </div>
                <TrendingUp size={80} className="absolute -bottom-4 -right-4 text-white/10 -rotate-12 group-hover:scale-110 transition-transform" />
              </div>

              <div className="p-6 rounded-[2rem] bg-[#0c0c0c] border border-white/10 flex flex-col justify-between h-40">
                <div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">In Escrow</span>
                  <div className="text-2xl font-black text-white tracking-tighter mt-1">${earningsData.escrow.toLocaleString()}</div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex -space-x-2">
                    {earningsData.txns.map((t, i) => (
                      <div key={i} className="w-6 h-6 rounded-full border-2 border-[#0c0c0c] bg-white/10 overflow-hidden">
                        <img src={`https://i.pravatar.cc/100?img=${i+20}`} className="w-full h-full object-cover" />
                      </div>
                    ))}
                  </div>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest">3 Active</span>
                </div>
              </div>
            </motion.div>
          )}

          {/* Active Project Flow (Hustler side - Incoming jobs) */}
          {hustlerMode && (
            <div>
              <div className="flex items-center justify-between mb-4">
                 <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">Incoming Project Gigs</h3>
                 <button 
                   onClick={() => setActiveNav && setActiveNav("bookings")}
                   className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors"
                 >
                   Open Workhub <ChevronLeft size={12} className="rotate-180" />
                 </button>
              </div>
              <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4">
                {sellerOrders.filter(j => ['pending', 'accepted', 'in_progress', 'active'].includes(j.status)).map((job) => {
                  const progress = job.status === 'completed' ? 100 : (job.status === 'in_progress' ? 60 : (job.status === 'accepted' ? 30 : 10));
                  const statusLabel = job.status === 'pending' ? 'Review Required' : (job.status === 'accepted' ? 'Active' : (job.status === 'in_progress' ? 'In Progress' : (job.status === 'completed' ? 'Completed' : job.status)));
                  
                  return (
                    <div 
                      key={job.id} 
                      className="min-w-[240px] p-5 rounded-[2rem] bg-[#0c0c0c] border border-white/10 snap-start relative overflow-hidden group hover:border-blue-500/30 transition-all cursor-pointer shadow-2xl"
                      onClick={() => onOpenBookingDetail ? onOpenBookingDetail(job) : (setActiveNav && setActiveNav("bookings"))}
                    >
                      <div className="flex items-center justify-between mb-4">
                         <div className="flex items-center gap-3">
                           <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-[10px] font-black text-blue-400 overflow-hidden">
                              {job.buyer?.avatar_url ? (
                                <img src={job.buyer.avatar_url} className="w-full h-full object-cover" />
                              ) : (
                                (job.buyer?.hustle_name || job.buyer?.full_name || "C")[0]
                              )}
                           </div>
                           <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{job.listing_title || job.listing?.title || 'Custom Service'}</h4>
                              <p className="text-[8px] text-white/30 uppercase tracking-widest font-black">Escrow ID: {job.id.substring(0,8)}</p>
                           </div>
                         </div>
                         <div className="text-[9px] font-black text-green-400 p-1 bg-green-400/10 rounded-md border border-green-500/20">
                            ₦{(job.total_price || 0).toLocaleString()}
                         </div>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between items-end">
                           <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">{statusLabel}</span>
                           <span className="text-[10px] font-black text-white">{progress}%</span>
                        </div>
                        <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                           <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${progress}%` }}
                              className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                           />
                        </div>
                      </div>

                      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Zap size={40} />
                      </div>
                    </div>
                  );
                })}
                
                <button 
                  onClick={() => setShowCreateOffering(true)}
                  className="min-w-[140px] rounded-[2rem] bg-white text-black flex flex-col items-center justify-center gap-2 transition-all active:scale-95 shadow-xl group border-2 border-transparent"
                >
                  <Plus size={24} className="group-hover:scale-110 transition-transform" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Post Service</span>
                </button>
              </div>
            </div>
          )}

          {/* Active Orders Section (Client side - Outgoing purchased orders) */}
          <div>
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/45">Outgoing Bookings (Hired)</h3>
               <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-400 bg-green-400/5 px-2 py-1 rounded-full border border-green-500/20">
                 <ShieldCheck size={10} /> Escrow Protected
               </div>
            </div>
            <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4">
              {buyerOrders.filter(b => ['pending', 'accepted', 'in_progress', 'active'].includes(b.status)).map((booking) => (
                <div 
                  key={booking.id} 
                  className="min-w-[240px] p-5 rounded-[2rem] bg-[#0c0c0c] border border-white/10 snap-start relative overflow-hidden group hover:border-purple-500/30 transition-all cursor-pointer shadow-2xl"
                  onClick={() => onOpenBookingDetail ? onOpenBookingDetail(booking) : (setActiveNav && setActiveNav("bookings"))}
                >
                  <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                       <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden bg-white/10">
                          {booking.seller?.avatar_url ? (
                            <img src={booking.seller.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-[10px] font-black text-white/40">{(booking.seller?.hustle_name || booking.seller?.full_name || "H")[0]}</div>
                          )}
                       </div>
                       <div className="min-w-0 flex-1">
                          <h4 className="text-[11px] font-black text-white uppercase tracking-tight truncate">{booking.seller?.hustle_name || booking.seller?.full_name || 'Hustler'}</h4>
                          <p className="text-[8px] text-white/30 uppercase tracking-widest font-black leading-none truncate">{booking.listing_title || booking.listing?.title || 'Service'}</p>
                       </div>
                    </div>
                    <div className="text-[9px] font-black text-purple-400 p-1 bg-purple-400/10 rounded-md border border-purple-500/20">
                       ₦{(booking.total_price || 0).toLocaleString()}
                    </div>
                  </div>

                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-purple-400 uppercase tracking-widest flex items-center gap-1.5">
                          <History size={10} /> {booking.status}
                        </span>
                        <span className="text-[9px] text-white/40 font-black uppercase tracking-widest italic">{booking.created_at ? new Date(booking.created_at).toLocaleDateString() : 'TBD'}</span>
                     </div>
                     <div className="flex gap-1">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenChat && onOpenChat(booking);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all"
                        >
                          Message
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenBookingDetail && onOpenBookingDetail(booking);
                          }}
                          className="flex-1 py-1.5 rounded-lg bg-white text-black text-[9px] font-black uppercase tracking-widest hover:bg-purple-600 hover:text-white transition-all shadow-xl"
                        >
                          Details
                        </button>
                     </div>
                  </div>
                </div>
              ))}
              
              <div 
                onClick={() => setActiveNav && setActiveNav("feed")}
                className="min-w-[140px] rounded-[2.5rem] border border-white/5 border-dashed flex flex-col items-center justify-center gap-2 text-white/20 hover:bg-white/[0.01] transition-all cursor-pointer"
              >
                 <History size={20} />
                 <span className="text-[8px] font-black uppercase tracking-widest">Find Gigs</span>
              </div>
            </div>
          </div>
        </div>

        {/* Segmented Sticky Navigation Architecture */}
        <div className="sticky top-[64px] z-40 bg-[#050505]/80 backdrop-blur-2xl border-y border-white/5 py-3 shadow-2xl">
          <div className="max-w-2xl mx-auto px-4">
            <nav className="flex overflow-x-auto no-scrollbar gap-1 items-center p-1 bg-white/[0.03] border border-white/10 rounded-2xl relative snap-x w-full shadow-inner">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`flex items-center gap-2 px-6 py-2.5 relative transition-all whitespace-nowrap snap-start shrink-0 rounded-xl group ${
                    activeTab === tab.id ? 'text-black' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <div className="relative z-10 flex items-center gap-2">
                    {tab.icon}
                    <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
                  </div>
                  {activeTab === tab.id && (
                    <motion.div 
                      layoutId="hubSegmentHighlight"
                      className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Portfolio Tools Bar */}
        <div className="flex items-center justify-between px-6 mb-4">
           <div className="flex items-center gap-1.5 p-1 bg-white/5 rounded-xl border border-white/10">
              <button 
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"}`}
              >
                <Grid size={14} />
              </button>
              <button 
                 onClick={() => setViewMode("list")}
                 className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white text-black shadow-lg" : "text-white/30 hover:text-white"}`}
              >
                <MoreHorizontal size={14} />
              </button>
           </div>
           
           <div className="flex items-center gap-4">
              <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors">
                Newest <ChevronLeft size={12} className="-rotate-90" />
              </button>
           </div>
        </div>

        {/* Content Area Rendering with smooth height transition */}
        <div className="px-4 py-2 min-h-[60vh] relative">
          <AnimatePresence mode="wait">
            
            {/* 4. PORTFOLIO + CONTENT GRID SYSTEM */}
            {activeTab === "posts" && (
              <motion.div
                key={viewMode === "grid" ? "posts-grid" : "posts-list"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col gap-6"
              >
                {/* Featured Commerce Section in Feed */}
                <div className="mb-4 px-1">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Featured Storefront</h3>
                     <button onClick={() => setActiveTab("products")} className="text-[9px] font-black uppercase tracking-widest text-blue-400">View All Shop</button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
                    {featuredOfferings.map((item) => (
                      <div key={item.id} className="min-w-[280px] h-40 bg-[#0c0c0c] border border-white/10 rounded-[2rem] overflow-hidden flex snap-start relative group transition-all hover:border-blue-500/50">
                        <div className="w-1/2 h-full relative overflow-hidden">
                          <img src={item.image || undefined} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-60" alt={item.name} />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-[#0c0c0c]" />
                        </div>
                        <div className="w-1/2 p-5 flex flex-col justify-center gap-1 z-10">
                          <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">{item.type}</span>
                          <h4 className="text-sm font-black text-white leading-tight mb-2 uppercase tracking-tight">{item.name}</h4>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-base font-black text-white">${item.price}</span>
                            <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-blue-500 group-hover:text-white transition-all">
                               {'delivery' in item ? <Zap size={12} /> : <ShoppingBag size={12} />}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                {/* Posts Gallery */}
                <div className={viewMode === "grid" ? "grid grid-cols-3 gap-1 md:gap-2" : "flex flex-col gap-4"}>
                  {myPosts.map((post) => (
                    viewMode === "grid" ? (
                    <motion.div 
                      key={post.id} 
                      onClick={() => setSelectedPost(post)}
                      className="aspect-[3/4] relative rounded-xl overflow-hidden group cursor-pointer bg-white/5 hover:scale-[0.98] transition-all shadow-lg active:ring-2 active:ring-blue-500/50"
                    >
                      {post.thumb ? (
                        <img src={post.thumb} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 border border-white/5 p-4 flex flex-col justify-center items-center text-center">
                          <p className="text-[10px] text-white/90 font-black line-clamp-5 tracking-tight uppercase leading-snug">
                            {post.caption || "Text Post"}
                          </p>
                        </div>
                      )}
                      
                      {/* Media Context Indicators */}
                      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
                         {post.pinned && (
                           <div className="bg-blue-500 text-white p-1 rounded-md shadow-lg border border-white/20">
                             <TrendingUp size={10} className="stroke-[3]" />
                           </div>
                         )}
                      </div>

                      <div className="absolute top-2 right-2 z-10">
                         {post.type === 'video' && <Play size={14} className="text-white fill-white/20 drop-shadow-md" />}
                         {post.type === 'image' && <Camera size={14} className="text-white drop-shadow-md" />}
                         {post.type === 'text' && <MessageSquare size={14} className="text-blue-400 drop-shadow-md" />}
                      </div>

                      {/* Bottom Metrics Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between transition-all group-hover:opacity-0">
                        <div className="flex items-center gap-1">
                          <Play size={10} className="text-white fill-white" />
                          <span className="text-[10px] font-black text-white tracking-tight">{post.views}</span>
                        </div>
                        {post.duration && (
                          <span className="text-[9px] font-black text-white/70 uppercase">{post.duration}</span>
                        )}
                      </div>

                      {/* Hover Overlay showing real Likes, Comments, Reposts, and Saves */}
                      <div className="absolute inset-0 bg-black/85 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-center items-center gap-2 px-3">
                        <div className="flex items-center gap-4 text-white font-black text-xs md:text-sm">
                          <div className="flex items-center gap-1.5">
                            <Heart size={14} className="fill-rose-500 text-rose-500" />
                            <span>{post.likes_count}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <MessageSquare size={14} className="fill-white/10 text-white" />
                            <span>{post.comments_count}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-white/60 font-black text-[10px] md:text-xs">
                          <div className="flex items-center gap-1.5">
                            <Repeat size={12} className="text-blue-400" />
                            <span>{post.reposts_count}</span>
                          </div>
                          <div className="flex items-center gap-1.5">
                            <Bookmark size={12} className="text-emerald-400" />
                            <span>{post.saves_count}</span>
                          </div>
                        </div>
                        {post.caption && (
                          <p className="text-[9px] text-white/50 line-clamp-3 text-center mt-2 px-1 leading-normal font-sans">
                            "{post.caption}"
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ) : (
                    <div key={post.id} onClick={() => setSelectedPost(post)} className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group cursor-pointer">
                       <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg shrink-0 bg-[#0c0c0c] flex items-center justify-center border border-white/5">
                          {post.thumb ? (
                            <img src={post.thumb} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-indigo-950 to-slate-900 flex items-center justify-center p-2 text-center text-[8px] font-black text-white/80 uppercase tracking-tight">
                              Text Post
                            </div>
                          )}
                       </div>
                       <div className="flex-1 py-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                               <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                 {post.type}
                               </span>
                               {post.pinned && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Pinned</span>}
                            </div>
                            <h4 className="text-white font-black text-sm md:text-md tracking-tight line-clamp-3 leading-snug">
                              {post.caption || "Behind the scenes of execution."}
                            </h4>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-white/30 font-black uppercase tracking-widest">
                             <span className="flex items-center gap-1"><Play size={12} /> {post.views} Views</span>
                             <span className="flex items-center gap-1"><Heart size={10} /> {post.likes_count} Likes</span>
                             <span>{post.created_at ? new Date(post.created_at).toLocaleDateString() : 'Feb 12, 2026'}</span>
                          </div>
                       </div>
                    </div>
                  )
                ))}
                </div>
              </motion.div>
            )}

            {/* 9. MARKETPLACE ACCESS LAYER - Services */}
            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">My Service Deck</h3>
                  <button 
                    onClick={() => setShowCreateOffering(true)}
                    className="px-5 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2"
                  >
                    <Plus size={14} /> New Service
                  </button>
                </div>

                <div className="flex flex-col gap-5">
                  {myServices.map((item, i) => (
                    <div key={i} className="p-7 rounded-[2.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-5 group hover:border-blue-500/30 transition-all cursor-pointer shadow-2xl relative overflow-hidden active:scale-[0.98]">
                      {item.popular && (
                        <div className="absolute top-0 right-12 px-4 py-1.5 bg-blue-500 text-white text-[8px] font-black uppercase tracking-[0.3em] rounded-b-xl shadow-lg z-20">
                          Best Seller
                        </div>
                      )}

                      {/* Optional Cover Media Preview */}
                      {item.image && (
                        <div className="h-44 w-full rounded-2xl overflow-hidden relative mb-2 shrink-0">
                          <img src={item.image} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 group-hover:scale-105 transition-all duration-500" alt={item.name} referrerPolicy="no-referrer" />
                          {item.video && (
                            <div className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg border border-emerald-400/30">
                              <Play size={8} className="fill-white" /> Premium Video Demo Active
                            </div>
                          )}
                        </div>
                      )}

                      {!item.image && item.video && (
                        <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 w-fit">
                          <Play size={10} className="fill-emerald-400" /> Premium Video Demo Loaded
                        </div>
                      )}

                      <div className="flex justify-between items-start relative z-10">
                        <div>
                          <h3 className="font-black text-white text-2xl tracking-tighter leading-tight group-hover:text-blue-400 transition-colors">{item.name}</h3>
                          <p className="text-[13px] text-white/40 mt-3 font-medium leading-loose max-w-[80%]">{item.desc}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <span className="text-3xl font-black text-white tracking-tighter">${item.price}</span>
                          <div className="flex items-center gap-1.5 mt-2 text-white/30 text-[9px] font-black uppercase tracking-[0.2em] bg-white/5 px-2 py-1 rounded-lg">
                            <Clock size={10} /> {item.time}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2 mt-2">
                        {item.features.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.03] border border-white/5">
                            <CheckCircle2 size={10} className="text-blue-500" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="flex items-center gap-1">
                              <Star size={10} className="text-yellow-500 fill-yellow-500" />
                              <span className="text-[10px] font-black text-white">4.9</span>
                           </div>
                           <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">24 Hires</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={async (e) => {
                              e.stopPropagation();
                              const newStatus = !item.is_active;
                              setMyServices(prev => prev.map(s => s.id === item.id ? { ...s, is_active: newStatus } : s));
                              try {
                                await supabase.from('services').update({ is_active: newStatus }).eq('id', item.id);
                              } catch (err) {
                                console.error(err);
                              }
                            }}
                            className={`px-3.5 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all ${
                              item.is_active 
                                ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" 
                                : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                            }`}
                          >
                            {item.is_active ? "● Active" : "○ Hidden"}
                          </button>
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedService(item);
                            }}
                            className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-xl"
                          >
                            Manage Listing
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
                        {/* 9. MARKETPLACE ACCESS LAYER - Products */}
            {activeTab === "products" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center justify-between px-2">
                  <h3 className="text-lg font-black text-white uppercase tracking-tighter">Marketplace Storefront</h3>
                  <button className="px-5 py-2 rounded-xl bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 active:scale-95 transition-all">
                    Add New Item
                  </button>
                </div>

                {/* Storefront Categories */}
                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-2 px-1">
                  {['All', 'Digital Apps', 'Assets', 'Physical', 'Courses'].map((cat, ci) => (
                    <button key={ci} className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${ci === 0 ? 'bg-white text-black shadow-lg' : 'bg-white/5 border border-white/10 text-white/40 hover:text-white'}`}>
                      {cat}
                    </button>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {myProducts.map((prod, i) => (
                    <div key={i} className="flex flex-col gap-4 group">
                      <div className="aspect-[4/5] bg-[#0c0c0c] rounded-[2.5rem] border border-white/10 overflow-hidden relative group cursor-pointer shadow-2xl transition-all hover:border-blue-500/50">
                         <img src={prod.image || undefined} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt={prod.name} />
                         
                         {prod.video && (
                           <div className="absolute top-4 left-4 z-20 px-2.5 py-1 rounded-full bg-emerald-500/90 backdrop-blur-md text-white text-[7px] font-black uppercase tracking-widest flex items-center gap-1 shadow-md border border-emerald-400/30">
                             <Play size={6} className="fill-white" /> Demo
                           </div>
                         )}
                         
                         <div className="absolute top-4 right-4 z-20">
                           <div className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-xl flex items-center justify-center text-white border border-white/10 group-hover:bg-blue-500 group-hover:border-blue-400 transition-all shadow-xl">
                              <Edit2 size={16} />
                           </div>
                         </div>

                         <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-black via-black/60 to-transparent flex flex-col gap-2">
                            <div className="flex items-center justify-between">
                              <span className="px-2 py-0.5 rounded-md bg-blue-500/20 text-blue-400 border border-blue-500/20 text-[7px] font-black uppercase tracking-widest">
                                {prod.type}
                              </span>
                              <div className="flex items-center gap-1">
                                <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                <span className="text-[8px] font-black text-white">{prod.rating}</span>
                              </div>
                            </div>
                            <h3 className="text-sm font-black text-white/90 uppercase tracking-tight line-clamp-2 leading-tight group-hover:text-white transition-colors">{prod.name}</h3>
                            <div className="flex items-center justify-between mt-1">
                              <span className="text-lg font-black text-white tracking-widest">${prod.price}</span>
                              <button
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  const newStatus = !prod.is_active;
                                  setMyProducts(prev => prev.map(p => p.id === prod.id ? { ...p, is_active: newStatus } : p));
                                  try {
                                    await supabase.from('products').update({ is_active: newStatus }).eq('id', prod.id);
                                  } catch (err) {
                                    console.error(err);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-xl border text-[7px] font-black uppercase tracking-widest transition-all h-fit ${
                                  prod.is_active 
                                    ? "bg-green-500/10 border-green-500/20 text-green-400 hover:bg-green-500/20" 
                                    : "bg-red-500/10 border-red-500/20 text-red-500 hover:bg-red-500/20"
                                }`}
                              >
                                {prod.is_active ? "● Active" : "○ Hidden"}
                              </button>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-8 p-10 rounded-[3rem] bg-indigo-500/5 border border-indigo-500/10 text-center relative overflow-hidden group">
                   <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                     <Zap size={80} />
                   </div>
                   <h4 className="text-xl font-black text-white tracking-tighter mb-2">Commerce Insights</h4>
                   <p className="text-xs text-white/40 font-medium leading-loose mb-6">Your storefront generated $1,240 in sales this week with a 12% conversion lift.</p>
                   <button className="px-8 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                     View Store Dashboard
                   </button>
                 </div>
              </motion.div>
            )}

            {/* 9. MARKETPLACE ACCESS LAYER - Trainings */}
            {activeTab === "trainings" && (
              <motion.div
                key="trainings"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex flex-col gap-8"
              >
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter">Academy & Mentorship</h3>
                    <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black mt-1">Scale your knowledge</p>
                  </div>
                  <button className="px-5 py-2.5 rounded-xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                    Create Offering
                  </button>
                </div>

                {/* Apprenticeship High-Impact Cards */}
                <div className="flex flex-col gap-4">
                  {myApprenticeships.map((app) => (
                    <div key={app.id} className="relative p-7 rounded-[2.5rem] bg-gradient-to-br from-indigo-600/20 to-[#0c0c0c] border border-white/10 group overflow-hidden cursor-pointer shadow-2xl">
                       <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Star size={100} />
                       </div>
                       <div className="relative z-10 flex justify-between items-start">
                          <div className="flex-1">
                             <span className="px-3 py-1 rounded-lg bg-indigo-500 text-white text-[8px] font-black uppercase tracking-widest">{app.type}</span>
                             <h3 className="text-2xl font-black text-white mt-3 tracking-tighter uppercase leading-tight group-hover:text-indigo-400 transition-colors">{app.name}</h3>
                             <div className="flex items-center gap-4 mt-4 text-[10px] font-black text-white/40 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Clock size={12} /> {app.duration}</span>
                                <span className="flex items-center gap-1.5 text-indigo-400"><History size={12} /> {app.slots}</span>
                             </div>
                          </div>
                          <div className="w-16 h-16 rounded-[2rem] bg-white/5 border border-white/10 p-0.5 overflow-hidden">
                             <img src={app.image || undefined} className="w-full h-full object-cover rounded-[1.8rem]" alt={app.name} />
                          </div>
                       </div>
                       
                       <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                             <CheckCircle2 size={12} className="text-indigo-400" />
                             <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">{app.stipend}</span>
                          </div>
                          <button className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-all">
                             Manage Applicants
                          </button>
                       </div>
                    </div>
                  ))}
                </div>

                {/* Trainings Preview Grid */}
                <div className="grid grid-cols-1 gap-5">
                   {myTrainings.map((training) => (
                     <div key={training.id} className="p-1 rounded-[2.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 transition-all group cursor-pointer active:scale-[0.98]">
                       <div className="bg-[#0c0c0c] p-6 rounded-[2.3rem] flex gap-5">
                          <div className="w-32 h-32 rounded-3xl overflow-hidden shrink-0 shadow-2xl relative">
                             <img src={training.image || undefined} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt={training.name} />
                             <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Play size={24} className="text-white fill-white/20" />
                             </div>
                          </div>
                          <div className="flex-1 flex flex-col justify-between py-1">
                             <div>
                                <div className="flex items-center justify-between mb-2">
                                   <span className="text-[8px] font-black uppercase tracking-widest text-[#6366f1]">{training.type}</span>
                                   <div className="flex items-center gap-1">
                                      <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                      <span className="text-[8px] font-black text-white">{training.rating}</span>
                                   </div>
                                </div>
                                <h4 className="text-lg font-black text-white leading-tight uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{training.name}</h4>
                                <div className="flex items-center gap-3 mt-3 text-[9px] font-black text-white/30 uppercase tracking-widest">
                                   <span>{training.modules} Modules</span>
                                   <span>•</span>
                                   <span>{training.duration}</span>
                                </div>
                             </div>
                             <div className="flex items-center justify-between mt-4">
                                <span className="text-xl font-black text-white tracking-widest">${training.price}</span>
                                <span className="text-[8px] font-black text-white/20 uppercase tracking-widest">{training.students} Enrolled</span>
                             </div>
                          </div>
                       </div>
                     </div>
                   ))}
                </div>

                <div className="p-10 rounded-[3rem] bg-indigo-600 shadow-2xl relative overflow-hidden group">
                   <Zap size={140} className="absolute -bottom-10 -right-10 text-white/10 rotate-12" />
                   <div className="relative z-10">
                      <h4 className="text-2xl font-black text-white tracking-tighter uppercase italic mb-3">Elevate Your Academy</h4>
                      <p className="text-xs text-white/80 font-medium leading-relaxed mb-8 max-w-[80%]">Turn your workflow into wealth. Your courses generated $3.4k in passive earnings last month.</p>
                      <button className="px-10 py-4 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 active:scale-95 transition-all">
                         View Analytics
                      </button>
                   </div>
                </div>
              </motion.div>
            )}

            {/* 5. REVIEWS SYSTEM */}
            {activeTab === "reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-10"
              >
                {/* Trust Score Architecture Card */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                   {[
                     { label: "Overall Rating", value: trustMetrics.rating, sub: "Verified Reviews", icon: <Star className="text-yellow-500 fill-yellow-500" size={14} /> },
                     { label: "Completion Rate", value: `${trustMetrics.completionScore}%`, sub: "Perfect Record", icon: <CheckCircle2 className="text-green-500" size={14} /> },
                     { label: "Repeat Business", value: `${trustMetrics.repeatClientRate}%`, sub: "High Retention", icon: <History className="text-blue-500" size={14} /> },
                     { label: "Total Hustles", value: trustMetrics.totalJobs, sub: "Contracts Handled", icon: <Briefcase className="text-purple-500" size={14} /> },
                   ].map((stat, i) => (
                     <div key={i} className="p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col gap-1 shadow-inner group hover:bg-white/[0.05] transition-all relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="flex items-center justify-between mb-1 relative z-10">
                           <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">{stat.label}</span>
                           {stat.icon}
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter relative z-10">{stat.value}</span>
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest relative z-10">{stat.sub}</span>
                     </div>
                   ))}
                </div>

                {/* Switcher for Received vs Given */}
                <div className="flex p-1.5 bg-white/[0.03] border border-white/5 rounded-2xl shadow-inner self-start">
                   <button 
                     onClick={() => setReviewFilter("received")}
                     className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${reviewFilter === "received" ? "bg-white text-black shadow-2xl" : "text-white/30 hover:text-white"}`}
                   >
                     Received <span className="opacity-40 text-[8px]">({reviewsReceived.length})</span>
                   </button>
                   <button 
                     onClick={() => setReviewFilter("given")}
                     className={`px-8 py-3 rounded-xl text-[10px] font-black transition-all flex items-center justify-center gap-2 uppercase tracking-widest ${reviewFilter === "given" ? "bg-white text-black shadow-2xl" : "text-white/30 hover:text-white"}`}
                   >
                     Given <span className="opacity-40 text-[8px]">({reviewsGiven.length})</span>
                   </button>
                </div>

                <div className="flex flex-col gap-4">
                  {(reviewFilter === "received" ? reviewsReceived : reviewsGiven).map((review) => (
                    <div key={review.id} className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 shadow-2xl group hover:bg-white/[0.05] transition-all border-l-2 border-l-transparent hover:border-l-blue-500">
                       <div className="flex justify-between items-start mb-4">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center font-black text-white/30 shadow-lg">
                                {review.avatar}
                             </div>
                             <div>
                                <h4 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-2">
                                   {'author' in review ? review.author : review.recipient}
                                   {'repeat' in review && review.repeat && (
                                     <span className="text-[7px] px-1.5 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/10 uppercase tracking-tighter">Repeat Client</span>
                                   )}
                                </h4>
                                <div className="flex gap-1 mt-1">
                                   {[1, 2, 3, 4, 5].map((s) => (
                                     <Star key={s} size={8} className={s <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-white/10"} />
                                   ))}
                                </div>
                             </div>
                          </div>
                          <span className="text-[9px] font-black uppercase text-white/20 tracking-widest">{review.date}</span>
                       </div>
                       
                       <p className="text-sm text-white/70 leading-relaxed font-medium">"{review.comment}"</p>
                       
                       {'service' in review && (
                         <div className="mt-4 pt-4 border-t border-white/5 flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-white/30 tracking-widest">{review.service}</span>
                            <div className="flex items-center gap-2">
                               <span className="w-2 h-2 rounded-full bg-blue-500" />
                               <span className="text-[8px] font-black uppercase text-blue-400 tracking-[0.2em]">Verified Transaction</span>
                            </div>
                         </div>
                       )}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* 6. ACADEMY & LEARNING SYSTEM */}
            {activeTab === "academy" && (
              <motion.div
                key="academy"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.02 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center justify-between px-2 mb-2">
                   <div className="flex flex-col">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Academy Workspace</h3>
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black mt-1">Real-world skill building</p>
                   </div>
                </div>
                <LearnerWorkspace />
              </motion.div>
            )}

            {/* 7. FELLOWSHIPS & MENTOR SYSTEM */}
            {activeTab === "fellowships" && (
              <motion.div
                key="fellowships"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                <div className="flex items-center justify-between px-2 mb-2">
                   <div className="flex flex-col">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Fellowships Hub</h3>
                      <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-black mt-1">Manage your apprenticeships</p>
                   </div>
                </div>
                <MentorDashboard />
              </motion.div>
            )}

            {/* ABOUT & TRUST */}
            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-10 pb-12"
              >
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-5 flex items-center gap-3"><User size={12} className="text-blue-500/50" /> Biography</h3>
                  <p className="text-white/70 leading-relaxed font-light text-sm bg-white/[0.02] p-6 rounded-3xl border border-white/5 shadow-inner">
                    {profile.bio} Over 8 years of experience in the design industry, I've worked with startups and Fortune 500 companies alike to deliver award-winning products. I specialize in bridging the gap between business goals and user needs. My approach is data-driven yet aesthetically bold.
                  </p>
                </div>

                {/* 11. MERIT & TRUST BADGES (Proof of Work) */}
                <div>
                   <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-6 flex items-center gap-3">
                     <ShieldCheck size={12} className="text-purple-500/50" /> Identity verification
                   </h3>
                   <div className="grid grid-cols-2 gap-3">
                      {[
                        { title: "Verified Identity", icon: <CheckCircle2 className="text-blue-500" /> },
                        { title: "Escrow Eligible", icon: <ShieldCheck className="text-green-500" /> },
                        { title: "Background Checked", icon: <ShieldCheck className="text-purple-500" /> },
                        { title: "Fast Responder", icon: <Clock className="text-yellow-500" /> },
                      ].map((badge, bi) => (
                        <div key={bi} className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all">
                           <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center shadow-inner">
                              {badge.icon}
                           </div>
                           <span className="text-[9px] font-black uppercase tracking-widest text-white/60">{badge.title}</span>
                        </div>
                      ))}
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-8 px-2">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-5">Languages</h3>
                    <div className="flex flex-col gap-3">
                      <span className="text-[11px] font-black text-white/80 flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500/60" /> English (Native)</span>
                      <span className="text-[11px] font-black text-white/80 flex items-center gap-2"><CheckCircle2 size={12} className="text-green-500/60" /> Spanish (Fluent)</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-[0.3em] font-black text-white/20 mb-5">Links</h3>
                    <div className="flex flex-col gap-4">
                      <a href="#" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                        <LinkIcon size={14} className="group-hover:text-blue-400 transition-colors" /> Personal Site
                      </a>
                      <a href="#" className="text-[10px] font-black uppercase tracking-widest flex items-center gap-3 text-white/40 hover:text-white transition-colors group">
                        <LinkIcon size={14} className="group-hover:text-purple-400 transition-colors" /> Instagram
                      </a>
                    </div>
                  </div>
                </div>

                {/* Account Settings Shortcut */}
                <div className="mt-4 p-8 rounded-[2.5rem] bg-white/[0.02] border border-white/5 text-center relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                       <ShieldCheck size={40} />
                    </div>
                    <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Hustle Secure™</h4>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed mb-6 max-w-[280px] mx-auto">
                      Review your biometric verification and connected payout methods.
                    </p>
                    <button 
                      className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-white/5 text-white/60 hover:bg-white/10 hover:text-white transition-all text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg active:scale-95"
                    >
                      <Settings size={14} />
                      Account Settings
                    </button>
                </div>

                {/* Admin Platform Hub - Hidden Dev Link */}
                {['moderator', 'admin', 'super_admin'].includes(realProfile?.role || '') && (
                  <div className="mt-4 p-8 rounded-[2.5rem] bg-red-900/10 border border-red-500/20 text-center relative overflow-hidden shadow-2xl">
                      <div className="absolute top-0 right-0 p-4 opacity-10">
                         <ShieldAlert size={40} className="text-red-500" />
                      </div>
                      <h4 className="text-sm font-black text-red-500 uppercase tracking-widest mb-2">Platform Governance</h4>
                      <p className="text-[10px] text-red-400/50 font-bold uppercase tracking-widest leading-relaxed mb-6 max-w-[280px] mx-auto">
                        Admin access for moderation and trust operations.
                      </p>
                      <button 
                        onClick={() => window.dispatchEvent(new CustomEvent('open-admin-hub'))}
                        className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-all text-[10px] font-black uppercase tracking-widest border border-red-500/30 shadow-lg active:scale-95"
                      >
                        <ShieldAlert size={14} />
                        Open Admin Hub
                      </button>
                  </div>
                )}

                <div className="mt-8 pt-8 border-t border-white/5 flex flex-col gap-2">
                   <button 
                     onClick={() => onSignOut?.()}
                     className="w-full py-4 text-xs font-black uppercase tracking-[0.2em] text-white/20 hover:text-white transition-colors"
                   >
                     Sign Out
                   </button>
                   <button 
                     onClick={() => {
                        localStorage.clear();
                        window.location.reload();
                     }}
                     className="w-full py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white/10 hover:text-red-500 transition-colors flex items-center justify-center gap-2"
                   >
                     <RefreshCcw size={12} /> Reset System (Demo Only)
                   </button>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Upgrade Flow Overlay */}
      <AnimatePresence>
        {showUpgrade && (
          <HustlerUpgradeFlow 
            initialStep={upgradeInitialStep}
            onClose={() => setShowUpgrade(false)} 
            onSuccess={(data) => {
              setShowUpgrade(false);
              setHustlerMode(true);
              if (onHustlerModeChange) onHustlerModeChange(true);
              
              if (data && data.skill) {
                if (upgradeInitialStep === "skill") {
                  if (!profile.secondaryHustles.includes(data.skill)) {
                    const newSecondary = Array.from(new Set([...profile.secondaryHustles, data.skill]));
                    updateProfile({ 
                      interests: newSecondary,
                      secondary_skills: newSecondary,
                      is_hustler: true
                    });
                  }
                } else {
                  updateProfile({ 
                    profession: data.skill, 
                    primary_skill: data.skill,
                    role: 'hustler',
                    is_hustler: true
                  });
                }
              }
            }} 
          />
        )}
      </AnimatePresence>

      {/* Create Offering Flow Overlay */}
      <AnimatePresence>
        {showCreateOffering && (
          <CreateOfferingFlow
            onClose={() => setShowCreateOffering(false)}
            onSuccess={(listing) => {
              setShowCreateOffering(false);
              if (listing.type === "Service" || !listing.type) {
                setActiveTab("services");
              } else if (listing.type === "Product") {
                setActiveTab("products");
              } else if (listing.type === "Training") {
                setActiveTab("trainings");
              }
              // Dynamically re-fetch from Supabase to load the absolute real rows
              loadMyRealOfferings();
            }}
          />
        )}
      </AnimatePresence>

      {/* Service Detail Modal */}
      <AnimatePresence>
        {selectedService && (
          <ServiceDetailModal 
            listing={selectedService}
            isOwner={true}
            onClose={() => setSelectedService(null)}
          />
        )}
      </AnimatePresence>

      {/* Availability Manager Sheet */}
      <AnimatePresence>
        {showAvailabilityManager && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAvailabilityManager(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110]"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[120] bg-[#0c0c0c] border-t border-white/10 rounded-t-[3rem] p-8 max-h-[85vh] overflow-y-auto no-scrollbar pb-safe"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Manage Availability</h2>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">Control your hustle workspace</p>
                </div>
                <button 
                  onClick={() => setShowAvailabilityManager(false)}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              {/* Master Live Toggle */}
              <div className={`p-6 rounded-3xl border transition-all mb-8 flex items-center justify-between ${isAvailable ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
                 <div className="flex items-center gap-4">
                    <div className={`w-4 h-4 rounded-full ${isAvailable ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)]'}`} />
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-widest">Visibility: {isAvailable ? 'Live' : 'Paused'}</h3>
                      <p className="text-[10px] text-white/40 font-bold mt-0.5 uppercase tracking-widest">
                        {isAvailable ? "Clients can book you right now" : "You are hidden from searches"}
                      </p>
                    </div>
                 </div>
                 <button 
                    onClick={() => handleToggleAvailability(!isAvailable)}
                    className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${isAvailable ? 'bg-white text-black' : 'bg-red-500 text-white'}`}
                 >
                    {isAvailable ? "Pause Shop" : "Go Live"}
                 </button>
              </div>

              <div className="space-y-10">
                {/* 0. STATUS REASON SELECTION */}
                <div className="mb-8">
                  <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-4 flex items-center gap-2">
                    <MessageSquare size={12} /> Status Update
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {statusReasons.map((reason) => (
                      <button 
                        key={reason.label}
                        onClick={() => handleUpdateStatus(reason.label)}
                        className={`px-4 py-3 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${statusMessage === reason.label ? 'bg-white text-black border-white shadow-xl' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                      >
                         {reason.icon}
                         {reason.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 1. CAPACITY LIMITS */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] flex items-center gap-2">
                       <TrendingUp size={12} /> Booking Capacity
                    </h3>
                    <span className="text-xl font-black text-white">{capacity} <span className="text-[10px] text-white/30">MAX JOBS</span></span>
                  </div>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5, 8, 10].map(val => (
                      <button 
                        key={val}
                        onClick={() => handleUpdateCapacity(val)}
                        className={`flex-1 py-3 rounded-xl border text-[10px] font-black transition-all ${capacity === val ? 'bg-white text-black border-white shadow-xl scale-110' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                  <p className="text-[9px] text-white/30 mt-3 uppercase tracking-widest font-black leading-relaxed">
                    Auto-pauses your services when you reach {capacity} active contracts.
                  </p>
                </div>

                {/* 2. WEEKLY SCHEDULE */}
                <div>
                  <h3 className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em] mb-6 flex items-center gap-2">
                    <Calendar size={12} /> Weekly Hustle Hours
                  </h3>
                  <div className="flex flex-col gap-3">
                    {schedule.map((item, idx) => (
                      <div key={item.day} className="flex items-center gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors">
                        <button 
                          onClick={() => {
                            const next = [...schedule];
                            next[idx].active = !next[idx].active;
                            handleUpdateSchedule(next);
                          }}
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase transition-all ${item.active ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-white/20 underline decoration-red-500/50'}`}
                        >
                          {item.day}
                        </button>
                        
                        {item.active ? (
                          <div className="flex flex-1 items-center justify-between px-2">
                            <div className="flex items-center gap-3">
                               <input 
                                 type="time" 
                                 value={item.start} 
                                 className="bg-transparent text-white font-black text-sm uppercase outline-none focus:text-blue-400 transition-colors"
                                 onChange={(e) => {
                                   const next = [...schedule];
                                   next[idx].start = e.target.value;
                                   setSchedule(next);
                                 }}
                               />
                               <span className="text-white/20">—</span>
                               <input 
                                 type="time" 
                                 value={item.end} 
                                 className="bg-transparent text-white font-black text-sm uppercase outline-none focus:text-blue-400 transition-colors"
                                 onChange={(e) => {
                                   const next = [...schedule];
                                   next[idx].end = e.target.value;
                                   setSchedule(next);
                                 }}
                               />
                            </div>
                            <div className="flex items-center gap-1.5 opacity-30 hover:opacity-100 transition-opacity cursor-pointer">
                               <Clock size={12} className="text-white" />
                               <span className="text-[8px] font-black uppercase tracking-widest text-white">Full Day</span>
                            </div>
                          </div>
                        ) : (
                          <div className="flex-1 text-left px-2">
                            <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">Out of Office / Focus Mode</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. SETTINGS & AUTOMATION */}
                <div className="pt-4 flex flex-col gap-4">
                   <div className="flex items-center justify-between p-6 rounded-3xl bg-white/[0.02] border border-white/5">
                      <div className="flex items-center gap-4">
                         <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center">
                            <ShieldCheck size={18} className="text-purple-400" />
                         </div>
                         <div>
                            <h4 className="text-xs font-black text-white uppercase tracking-widest">Auto-Away mode</h4>
                            <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-1">Set status to away after 2h idle</p>
                         </div>
                      </div>
                      <button 
                        onClick={() => setAutoAway(!autoAway)}
                        className={`w-12 h-6 rounded-full relative transition-colors ${autoAway ? 'bg-blue-500' : 'bg-white/10'}`}
                      >
                         <motion.div 
                           animate={{ x: autoAway ? 24 : 4 }}
                           className="absolute top-1 w-4 h-4 rounded-full bg-white shadow-lg" 
                         />
                      </button>
                   </div>
                   
                   <button 
                    onClick={() => setShowAvailabilityManager(false)}
                    className="w-full py-5 rounded-[2rem] bg-white text-black text-xs font-black uppercase tracking-[0.3em] shadow-[0_20px_50px_rgba(255,255,255,0.1)] active:scale-[0.98] transition-all"
                   >
                     Save Schedule
                   </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ImageEditorModal 
        isOpen={imageEditorState.isOpen}
        onClose={() => setImageEditorState({ isOpen: false, type: null })}
        onSave={async (imageUrl) => {
          const file = dataURLtoFile(imageUrl, `${Date.now()}.png`);
          if (!file) return;
          if (imageEditorState.type === 'avatar') {
            await uploadImage(file, 'avatar');
          } else if (imageEditorState.type === 'cover') {
            await uploadImage(file, 'cover');
          }
        }}
        title={imageEditorState.type === 'avatar' ? 'Edit Profile Picture' : 'Edit Cover Photo'}
      />

      <AnimatePresence>
        {selectedPost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/90 backdrop-blur-md z-[100] flex items-center justify-center p-2 sm:p-4"
            onClick={() => setSelectedPost(null)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-[420px] aspect-[9/16] h-[85vh] min-h-[580px] bg-black border border-white/10 rounded-[2rem] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Top Left Close Button to prevent overlap with native top right buttons */}
              <button 
                className="absolute top-4 left-4 z-50 bg-black/60 hover:bg-black/90 text-white/80 hover:text-red-400 p-2.5 rounded-full cursor-pointer transition-all border border-white/10 flex items-center justify-center backdrop-blur-md outline-none focus:ring-1 focus:ring-white/20 shadow-md" 
                onClick={() => setSelectedPost(null)}
                aria-label="Close post"
              >
                <X size={15} />
              </button>

              {/* Feed Card Content */}
              <div className="w-full h-full relative">
                <FeedCard
                  id={selectedPost.id}
                  creator={{
                    id: realProfile?.id || "",
                    name: realProfile?.hustle_name || realProfile?.full_name || realProfile?.username || "Creator",
                    avatar: realProfile?.avatar_url || "",
                    category: realProfile?.primary_skill || "Professional Specialist",
                    location: (realProfile as any)?.location || "Global Node",
                    rating: realProfile?.rating_average || 5.0,
                    jobs: realProfile?.review_count || 0,
                    verified: !!(realProfile as any)?.is_verified,
                    active: true,
                  }}
                  content={{
                    type: selectedPost.type === "video" ? "video" : (selectedPost.url ? "image" : "text"),
                    mediaUrls: selectedPost.url ? [selectedPost.url] : [],
                    caption: selectedPost.caption || "",
                  }}
                  repost={selectedPost.is_repost ? {
                    by: realProfile?.full_name || realProfile?.username || "Me",
                    thought: selectedPost.repost_comment
                  } : undefined}
                  detailData={(() => {
                    if (!selectedPost.attached_listing_data) return undefined;
                    return {
                      id: selectedPost.id,
                      type: selectedPost.attached_listing_type || 'hustler',
                      title: selectedPost.attached_listing_data.title || selectedPost.caption?.slice(0, 50) || "Profile",
                      description: selectedPost.attached_listing_data.description || selectedPost.caption,
                      price: selectedPost.attached_listing_data.price || selectedPost.attached_listing_data.base_price,
                      creator: {
                        id: realProfile?.id || "",
                        name: realProfile?.hustle_name || realProfile?.full_name || "Creator",
                        avatar: realProfile?.avatar_url || "",
                      },
                      reviews: [],
                      recommendations: [],
                      socialStats: {
                        likes: selectedPost.likes_count || 0,
                        shares: selectedPost.reposts_count || 0,
                        saves: selectedPost.saves_count || 0,
                      },
                      heroMedia: selectedPost.url ? [selectedPost.url] : [],
                      stockStatus: 'in-stock',
                      features: [],
                      priceStructure: {
                        startingPrice: selectedPost.attached_listing_data.price || 0,
                        packages: []
                      }
                    } as any;
                  })()}
                  embedCTA={(() => {
                    const listing = selectedPost.attached_listing_data;
                    const lType = selectedPost.attached_listing_type;
                    if (!listing) return { type: "book", label: "View Profile" };
                    if (lType === 'product') return { type: "buy", label: `Buy ${listing.title}`, price: listing.price };
                    if (lType === 'service') return { type: "book", label: `Book ${listing.title}`, price: listing.base_price };
                    if (lType === 'training') return { type: "book", label: `Join ${listing.title}`, price: listing.price };
                    return { type: "book", label: "View Profile" };
                  })()}
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAgencyCenter && (
          <AgencyCenter onBack={() => setShowAgencyCenter(false)} />
        )}
      </AnimatePresence>

      {/* Agent Application Modal */}
      <AnimatePresence>
        {showAgentApplication && (
          <div className="fixed inset-0 z-[500] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowAgentApplication(false)}
              className="absolute inset-0 bg-black/90 backdrop-blur-md"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative w-full max-w-sm bg-[#0c0c0c] border border-white/10 rounded-[3rem] p-8 shadow-2xl overflow-hidden"
            >
              {!applicationSubmitted ? (
                <>
                  <div className="flex flex-col items-center text-center gap-2 mb-8">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-2">
                       <Award size={32} />
                    </div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic">Agency Status</h3>
                    <p className="text-[10px] text-white/40 font-medium px-4 leading-relaxed uppercase tracking-widest">Scale your operations by managing multiple specialists and earning commission split.</p>
                  </div>

                  <div className="space-y-4">
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Agency Name</label>
                      <input 
                        type="text"
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-blue-500 transition-all font-black uppercase tracking-widest"
                        placeholder="e.g. Nexus Talent Group"
                        value={agencyFormData.name}
                        onChange={(e) => setAgencyFormData({ ...agencyFormData, name: e.target.value })}
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[8px] font-black uppercase tracking-[0.2em] text-white/20 ml-2">Experience / Bio</label>
                      <textarea 
                        className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-4 text-xs text-white placeholder:text-white/20 outline-none focus:border-blue-500 transition-all font-black uppercase tracking-widest h-24 resize-none"
                        placeholder="Why should specialists trust your agency?"
                        value={agencyFormData.bio}
                        onChange={(e) => setAgencyFormData({ ...agencyFormData, bio: e.target.value })}
                      />
                    </div>

                    <button 
                      onClick={async () => {
                        if (!agencyFormData.name) return;
                        try {
                          await submitAgentApplication(agencyFormData.name, agencyFormData.bio);
                          setApplicationSubmitted(true);
                        } catch (e) {
                          console.error("Application failed:", e);
                        }
                      }}
                      disabled={!agencyFormData.name || isAgentLoading}
                      className={`w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] mt-4 shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2 ${
                        !agencyFormData.name || isAgentLoading ? 'bg-white/5 text-white/20' : 'bg-white text-black'
                      }`}
                    >
                      {isAgentLoading ? 'Processing...' : 'Submit Application'}
                    </button>
                    <button 
                      onClick={() => setShowAgentApplication(false)}
                      className="w-full py-2 text-[9px] font-black uppercase tracking-widest text-white/20 hover:text-white transition-colors"
                    >
                       Maybe Later
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-center gap-6 py-8">
                  <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                     <CheckCircle2 size={40} className="animate-bounce" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tighter italic mb-2">Application Sent</h3>
                    <p className="text-[10px] text-white/40 font-medium px-4 leading-relaxed uppercase tracking-widest">Our governance team will review your application. You'll be notified once approved.</p>
                  </div>
                  <button 
                    onClick={() => setShowAgentApplication(false)}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] text-white"
                  >
                    Got It
                  </button>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
