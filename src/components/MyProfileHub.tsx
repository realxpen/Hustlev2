import { motion, AnimatePresence } from "motion/react";
import { 
  Star, MapPin, CheckCircle2, MessageSquare, MoreHorizontal, Grid, 
  Briefcase, Info, Calendar, Edit2, ChevronLeft,
  ShoppingBag, BookOpen, Clock, Heart, Camera, Settings, Plus, Play, Link as LinkIcon,
  ShieldCheck, ShieldAlert, Check, AlertCircle, TrendingUp, CreditCard, User, History
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import BookingFlow from "./BookingFlow";
import ReportSheet from "./ReportSheet";
import HustlerUpgradeFlow from "./HustlerUpgradeFlow";

interface MyProfileHubProps {
  isHustler?: boolean;
  onHustlerModeChange?: (isHustler: boolean) => void;
  setActiveNav?: (nav: any) => void;
}

export default function MyProfileHub({ isHustler = false, onHustlerModeChange, setActiveNav }: MyProfileHubProps) {
  const [activeTab, setActiveTab] = useState("posts");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [hustlerMode, setHustlerMode] = useState(isHustler);
  const [isEditing, setIsEditing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [jobFilter, setJobFilter] = useState("Active");
  const [showAvailabilityManager, setShowAvailabilityManager] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Open for Bookings");
  const [reviewFilter, setReviewFilter] = useState<"received" | "given">("received");

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

  // Enhanced Review Data
  const reviewsReceived = [
    { id: 1, author: "Jake S.", rating: 5, comment: "Absolutely crushed the brand identity project. Fast, communicative, and top-tier quality.", date: "2 days ago", avatar: "J", repeat: true, service: "Brand Identity" },
    { id: 2, author: "Mila K.", rating: 5, comment: "The UI Audit was eye-opening. Best $150 I've spent on my startup this year.", date: "1 week ago", avatar: "M", repeat: false, service: "UI/UX Audit" },
    { id: 3, author: "Chris P.", rating: 4, comment: "Great workflow. A little delay on the final handoff but the quality made up for it.", date: "2 weeks ago", avatar: "C", repeat: true, service: "Figma UI Kit" },
  ];

  const reviewsGiven = [
    { id: 1, recipient: "Elena R.", rating: 5, comment: "Incredible client. Extremely clear brief and prompt feedback throughout.", date: "1 month ago", avatar: "E" },
  ];

  const trustMetrics = {
    rating: 4.9,
    completionScore: 98,
    repeatClientRate: 42,
    totalJobs: 142
  };

  const statusReasons = [
    { label: "Open for Bookings", icon: <Check size={12} />, color: "text-green-400" },
    { label: "Deep Work", icon: <Briefcase size={12} />, color: "text-blue-400" },
    { label: "On a Break", icon: <Clock size={12} />, color: "text-yellow-400" },
    { label: "Fully Booked", icon: <ShieldAlert size={12} />, color: "text-red-400" },
    { label: "Away / Vacation", icon: <MapPin size={12} />, color: "text-purple-400" },
  ];

  const scrollRef = useRef<HTMLDivElement>(null);

  // Use state for profile data so it's "editable" in UI
  const [profile, setProfile] = useState({
    name: "Alex Hustler",
    username: "@alexhustles",
    bio: "Visionary Professional Visual Artist executing high-fidelity outcomes. My profile is my digital business.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
    cover: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1000&auto=format&fit=crop&q=60",
    primaryHustle: "Visual Artist",
    secondaryHustles: ["Video Directing", "UI Design"],
    location: "Los Angeles",
    rating: 4.9,
    jobs: 52,
    verified: true,
    responseRate: "100%",
    responseTime: "1hr",
  });

  // Enhanced mock data for creator grid
  const myPosts = [
    { id: 1, type: 'video', views: '2.4M', duration: '0:15', pinned: true, thumb: "https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=400&auto=format&fit=crop&q=60" },
    { id: 2, type: 'image', views: '840k', pinned: true, thumb: "https://images.unsplash.com/photo-1626814026160-2237a95fc5a0?w=400&auto=format&fit=crop&q=60" },
    { id: 3, type: 'video', views: '1.2M', duration: '0:22', pinned: true, thumb: "https://images.unsplash.com/photo-1536240478700-b869070f9279?w=400&auto=format&fit=crop&q=60" },
    { id: 4, type: 'repost', views: '45k', user: '@mika_designs', thumb: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&auto=format&fit=crop&q=60" },
    { id: 5, type: 'video', views: '312k', duration: '0:58', thumb: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?w=400&auto=format&fit=crop&q=60" },
    { id: 6, type: 'image', views: '128k', thumb: "https://images.unsplash.com/photo-1492724441997-5dc865305da7?w=400&auto=format&fit=crop&q=60" },
    { id: 7, type: 'video', views: '2.1M', duration: '0:12', thumb: "https://images.unsplash.com/photo-1551269901-5c5e14c25df7?w=400&auto=format&fit=crop&q=60" },
    { id: 8, type: 'video', views: '98k', duration: '1:04', thumb: "https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=400&auto=format&fit=crop&q=60" },
    { id: 9, type: 'image', views: '256k', thumb: "https://images.unsplash.com/photo-1542038784456-1ea8e935640e?w=400&auto=format&fit=crop&q=60" },
    { id: 10, type: 'video', views: '4.5M', duration: '0:08', thumb: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?w=400&auto=format&fit=crop&q=60" },
    { id: 11, type: 'image', views: '67k', thumb: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=400&auto=format&fit=crop&q=60" },
    { id: 12, type: 'video', views: '11k', duration: '0:45', thumb: "https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&auto=format&fit=crop&q=60" },
  ];

  const hustlerJobs = [
    { id: "JOB-092", client: "Elena R.", service: "Brand Identity System", amount: "$850", due: "In 3 Days", status: "In Progress", progress: 65, avatar: "E", type: "Active" },
    { id: "JOB-091", client: "David M.", service: "UI/UX Audit", amount: "$150", due: "Tomorrow", status: "Review requested", progress: 100, avatar: "D", type: "Active" },
    { id: "JOB-088", client: "Sophia K.", service: "Figma UI Kit", amount: "$499", due: "Pending approval", status: "Pending", progress: 0, avatar: "S", type: "Pending" },
    { id: "JOB-075", client: "Marcus L.", service: "Pitch Deck Design", amount: "$1200", due: "Completed", status: "Paid", progress: 100, avatar: "M", type: "Completed" },
  ];

  const myBookings = [
    { id: "BOK-442", hustler: "Zoe Vision", service: "Professional Headshots", amount: "$350", due: "May 12", status: "Confirmed", progress: 20, avatar: "Z", type: "Active" },
    { id: "BOK-440", hustler: "Leo Craft", service: "Custom 3D Scene", amount: "$200", due: "May 15", status: "Waiting for assets", progress: 10, avatar: "L", type: "Pending" },
    { id: "BOK-421", hustler: "Sarah Studio", service: "Landing Page Copy", amount: "$450", due: "April 28", status: "Delivered", progress: 100, avatar: "S", type: "Completed" },
  ];

  const tabs = [
    { id: "posts", label: "Posts", icon: <Grid size={14} /> },
    { id: "services", label: "Services", icon: <Briefcase size={14} /> },
    { id: "products", label: "Shop", icon: <ShoppingBag size={14} /> },
    { id: "trainings", label: "Trainings", icon: <BookOpen size={14} /> },
    { id: "reviews", label: "Reviews", icon: <Star size={14} /> },
    { id: "jobs", label: "Hustles", icon: <History size={14} />, ownerOnly: true },
    { id: "about", label: "About", icon: <User size={14} /> },
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

      {/* Dynamic Identity Glow */}
      <div className={`fixed inset-0 pointer-events-none transition-opacity duration-1000 ${hustlerMode ? 'opacity-30' : 'opacity-0'}`}>
         <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600 rounded-full blur-[150px] opacity-20" />
         <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600 rounded-full blur-[150px] opacity-10" />
      </div>

      {/* Sticky Top Navigation - Enhanced with Back Button */}
      <header className={`sticky top-0 z-[100] flex justify-between items-center px-4 py-3 ${hustlerMode ? 'bg-[#05060a]/90' : 'bg-[#050505]/90'} backdrop-blur-2xl border-b border-white/5 safe-top shadow-xl transition-colors duration-500`}>
        <div className="flex items-center gap-3">
          {setActiveNav && (
            <button 
              onClick={() => setActiveNav("feed")}
              className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-colors active:scale-90"
            >
              <ChevronLeft size={20} />
            </button>
          )}
          <h2 className="text-lg font-display font-black tracking-[0.15em] uppercase text-white truncate max-w-[120px]">My Hub</h2>
        </div>
        
        <div className="flex items-center gap-2">
          <div className="p-0.5 bg-white/[0.03] border border-white/10 rounded-full flex items-center shadow-inner">
            <button 
              onClick={() => setHustlerMode(false)}
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${!hustlerMode ? 'bg-white text-black shadow-lg' : 'text-white/30 hover:text-white'}`}
            >
              Social
            </button>
            <button 
              onClick={() => setHustlerMode(true)}
              className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${hustlerMode ? 'bg-blue-500 text-white shadow-lg' : 'text-white/30 hover:text-white'}`}
            >
              Hustle
            </button>
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
          {/* Status Indicator Chip - Floats over Cover */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-20"
          >
            <button 
              onClick={() => setShowAvailabilityManager(true)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-2xl border transition-all shadow-2xl active:scale-95 ${
                isAvailable ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isAvailable ? (statusMessage || "Open") : "Paused"}
              </span>
            </button>
          </motion.div>

          {/* Cover Photo - Editable */}
          <div className="w-full h-56 bg-gradient-to-br from-blue-900/20 to-purple-900/20 relative group overflow-hidden cursor-pointer">
            <motion.img 
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              src={profile.cover} 
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
            <div className="relative group cursor-pointer">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-36 h-36 rounded-[2.5rem] border-4 border-[#050505] overflow-hidden bg-white/5 relative shadow-[0_20px_50px_rgba(0,0,0,0.5)] group-hover:rounded-[1.5rem] transition-all duration-500"
              >
                <img 
                  src={profile.avatar} 
                  alt={profile.name}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <Camera size={28} className="text-white mb-1" />
                  <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white">Edit PFP</span>
                </div>

                {/* Mode Context Badge */}
                <div className={`absolute top-0 inset-x-0 py-1 flex items-center justify-center transition-all ${hustlerMode ? 'bg-blue-500/80' : 'bg-white/20'} backdrop-blur-sm`}>
                   <span className="text-[7px] font-black uppercase tracking-widest text-white">
                      {hustlerMode ? 'Hustler Mode' : 'Social View'}
                   </span>
                </div>
              </motion.div>
              
              {/* Intelligent Status Dot */}
              <div className={`absolute bottom-2 right-2 w-8 h-8 rounded-2xl border-4 border-[#050505] z-20 flex items-center justify-center shadow-lg transform hover:scale-110 transition-transform ${isAvailable ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}>
                {hustlerMode ? <Zap size={14} className="text-white fill-white" /> : <div className="w-2 h-2 rounded-full bg-white" />}
              </div>
            </div>

              {/* Display Headers */}
              <div className="mt-6 text-center w-full">
                <div className="flex flex-col items-center transition-all">
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl font-display font-black tracking-tighter flex items-center gap-3 text-white uppercase group cursor-pointer"
                  >
                    {profile.name}
                    <Edit2 size={16} className="text-white/20 group-hover:text-blue-400 transition-colors" />
                  </motion.h1>
                  
                  {/* trust rating micro-indicators */}
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.1 }}
                    className="flex items-center gap-3 mt-2"
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
                </div>

              {/* Availability Management for Owner - MOVED HIGHER */}
              {hustlerMode && (
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
              )}
              
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
              <div className="max-w-md mx-auto mt-6 relative group cursor-pointer">
                <p className="text-white/50 text-sm leading-relaxed px-4 group-hover:text-white/70 transition-colors italic">
                  "{profile.bio}"
                </p>
                <div className="flex items-center justify-center gap-2 mt-4 text-white/30 text-[10px] uppercase tracking-[0.2em] font-black">
                  <MapPin size={12} className="text-white/20" />
                  {profile.location} • <Clock size={12} className="text-white/20" /> Active Today
                  <Edit2 size={10} className="ml-1 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              </div>

              {/* Hustle & Identity Cards */}
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
                
                <div className="p-4 rounded-3xl bg-white/[0.03] border border-white/10 text-left relative group cursor-pointer overflow-hidden active:scale-95 transition-all hover:bg-white/[0.05]">
                  <div className="absolute top-0 right-0 p-3 opacity-10">
                    <Plus size={32} />
                  </div>
                  <span className="text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 block">Secondary Stack</span>
                  <div className="flex flex-wrap gap-1.5">
                    {profile.secondaryHustles.map((h, i) => (
                      <span key={i} className="px-2 py-0.5 rounded-md bg-white/5 text-[9px] font-bold text-white/60 tracking-wider">
                        {h}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
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
                    {profile.rating}
                  </div>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-black mt-2 group-hover:text-white/60 transition-colors">112 Reviews</span>
                </div>

                <div className="flex flex-col items-center justify-center py-6 px-2 hover:bg-white/[0.02] transition-colors group cursor-pointer">
                  <span className="text-white font-black text-3xl tracking-tighter leading-none">{profile.jobs}</span>
                  <span className="text-[9px] text-white/40 uppercase tracking-widest font-black mt-2 group-hover:text-white/60 transition-colors">Hustles Won</span>
                </div>

                <div className="flex flex-col items-center justify-center py-6 px-2 hover:bg-white/[0.02] transition-colors group cursor-pointer">
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

        {/* Scrollable Sticky Tabs Architecture */}
        <div className="sticky top-[64px] z-40 bg-[#050505]/95 backdrop-blur-xl border-y border-white/5 mt-8 shadow-2xl">
          <nav className="flex overflow-x-auto no-scrollbar px-2 items-center snap-x w-full">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex items-center gap-2 px-5 py-4 relative transition-all whitespace-nowrap snap-start shrink-0 ${
                  activeTab === tab.id ? 'text-white font-bold' : 'text-white/40 font-medium hover:text-white/70'
                }`}
              >
                {tab.icon}
                <span className="text-[11px] uppercase tracking-widest">{tab.label}</span>
                {activeTab === tab.id && (
                  <motion.div 
                    layoutId="myHubTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  />
                )}
              </button>
            ))}
          </nav>
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
                className={viewMode === "grid" ? "grid grid-cols-3 gap-1 md:gap-2" : "flex flex-col gap-4 px-2"}
              >
                {myPosts.map((post) => (
                  viewMode === "grid" ? (
                    <motion.div 
                      key={post.id} 
                      className="aspect-[3/4] relative rounded-xl overflow-hidden group cursor-pointer bg-white/5 hover:scale-[0.98] transition-all shadow-lg active:ring-2 active:ring-blue-500/50"
                    >
                      <img src={post.thumb} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity duration-300" />
                      
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
                         {post.type === 'repost' && <History size={14} className="text-blue-400 drop-shadow-md" />}
                      </div>

                      {/* Bottom Metrics Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end justify-between transition-all">
                        <div className="flex items-center gap-1">
                          <Play size={10} className="text-white fill-white" />
                          <span className="text-[10px] font-black text-white tracking-tight">{post.views}</span>
                        </div>
                        {post.duration && (
                          <span className="text-[9px] font-black text-white/70 uppercase">{post.duration}</span>
                        )}
                      </div>

                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    </motion.div>
                  ) : (
                    <div key={post.id} className="flex gap-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-colors group">
                       <div className="w-24 h-32 rounded-xl overflow-hidden shadow-lg shrink-0">
                          <img src={post.thumb} className="w-full h-full object-cover" />
                       </div>
                       <div className="flex-1 py-1 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                               <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                                 {post.type}
                               </span>
                               {post.pinned && <span className="text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded bg-green-500/10 text-green-400 border border-green-500/20">Pinned</span>}
                            </div>
                            <h4 className="text-white font-black text-lg tracking-tight line-clamp-2">Behind the scenes of the "{post.type === 'video' ? 'Product Design Sprint' : 'Visual Identity System'}" execution.</h4>
                          </div>
                          <div className="flex items-center gap-4 text-[10px] text-white/30 font-black uppercase tracking-widest">
                             <span className="flex items-center gap-1"><Play size={12} /> {post.views} Views</span>
                             <span>Feb 12, 2026</span>
                          </div>
                       </div>
                    </div>
                  )
                ))}
              </motion.div>
            )}

            {/* 9. MARKETPLACE ACCESS LAYER - Services */}
            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-5"
              >
                {hustlerMode ? [
                  { name: "Full Product Design Sprint", price: 499, time: "5-7 days", desc: "End-to-end design from wireframes to high fidelity." },
                  { name: "UI/UX Audit", price: 150, time: "2 days", desc: "Actionable tear-down of your current product." },
                  { name: "Brand Identity System", price: 850, time: "2 weeks", desc: "Logos, typography, color palettes, and guidelines." }
                ].map((item, i) => (
                  <div key={i} className="p-6 rounded-[2rem] bg-white/[0.03] border border-white/10 flex flex-col gap-4 group hover:border-white/20 transition-all cursor-pointer shadow-xl relative overflow-hidden active:scale-[0.98]">
                    <div className="absolute top-0 left-0 w-[2px] h-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-black text-white text-xl tracking-tight leading-tight">{item.name}</h3>
                        <p className="text-xs text-white/40 mt-2 font-medium leading-relaxed">{item.desc}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className="bg-white text-black px-4 py-2 rounded-2xl text-[13px] font-black whitespace-nowrap shadow-xl border border-white/10">${item.price}</span>
                        <div className="flex items-center gap-1.5 mt-2 text-white/30 text-[9px] uppercase tracking-widest font-black">
                          <Clock size={10} /> {item.time}
                        </div>
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="p-12 text-center text-white/30 border border-white/5 border-dashed rounded-[3rem] bg-white/[0.01]">
                    <Briefcase size={32} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs uppercase tracking-[0.2em] font-black">Services are only available in Hustler mode.</p>
                  </div>
                )}
              </motion.div>
            )}

            {/* 9. MARKETPLACE ACCESS LAYER - Products */}
            {activeTab === "products" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="grid grid-cols-2 gap-5"
              >
                {hustlerMode ? [
                  { name: "Figma UI Kit 2026", price: "$49", type: "Digital" },
                  { name: "Creator Notion Template", price: "$29", type: "Digital" },
                  { name: "Premium Font: Hustle Sans", price: "$79", type: "Digital" },
                  { name: "1-on-1 Mentorship Call", price: "$99", type: "Consulting" }
                ].map((prod, i) => (
                  <div key={i} className="flex flex-col gap-3 group">
                    <div className="aspect-square bg-white/[0.03] rounded-[2.5rem] border border-white/10 flex flex-col items-center justify-center p-6 relative group cursor-pointer overflow-hidden shadow-xl active:scale-95 transition-all">
                       <ShoppingBag size={40} className="text-white/20 mb-2 transform group-hover:scale-110 transition-transform duration-500" />
                       <div className="absolute inset-x-0 bottom-0 p-4 bg-gradient-to-t from-black/80 to-transparent">
                          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{prod.type}</span>
                       </div>
                    </div>
                    <div className="px-1 text-center">
                      <h3 className="text-xs font-black text-white line-clamp-1 uppercase tracking-tight">{prod.name}</h3>
                      <span className="text-base font-black text-white/80 mt-1 block">{prod.price}</span>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 p-12 text-center text-white/30 border border-white/5 border-dashed rounded-[3rem] bg-white/[0.01]">
                    <ShoppingBag size={32} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs uppercase tracking-[0.2em] font-black">Connect your shop in Hustler Settings.</p>
                  </div>
                )}
              </motion.div>
            )}
            
            {/* 9. MARKETPLACE ACCESS LAYER - Trainings */}
            {activeTab === "trainings" && (
              <motion.div
                key="trainings"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-5"
              >
                {hustlerMode ? [
                  { name: "Mastering Client Acquisition", format: "Video Course", duration: "2 Hours" },
                  { name: "Advanced UI Apprenticeship", format: "Live Coaching", duration: "4 Weeks" }
                ].map((training, i) => (
                  <div key={i} className="p-0.5 rounded-[2.5rem] bg-gradient-to-br from-blue-500/30 via-purple-500/20 to-transparent shadow-2xl active:scale-[0.99] transition-transform">
                     <div className="bg-[#0b0b0b] p-7 rounded-[calc(2.5rem-2px)] flex justify-between items-center group cursor-pointer transition-colors hover:bg-[#111]">
                        <div className="flex-1 pr-4">
                          <span className="text-[9px] text-blue-400 font-black uppercase tracking-[0.3em]">{training.format} • {training.duration}</span>
                          <h3 className="font-black text-white text-xl mt-2 tracking-tight leading-tight">{training.name}</h3>
                        </div>
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:scale-105 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.1)] transition-all">
                           <Play size={20} className="text-white ml-1 fill-white/20" />
                        </div>
                     </div>
                  </div>
                )) : (
                   <div className="p-12 text-center text-white/30 border border-white/5 border-dashed rounded-[3rem] bg-white/[0.01]">
                    <BookOpen size={32} className="mx-auto mb-4 opacity-20" />
                    <p className="text-xs uppercase tracking-[0.2em] font-black">Trainings require a verified Hustler profile.</p>
                  </div>
                )}
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
                     { label: "Overall Rating", value: trustMetrics.rating, sub: "Verified", icon: <Star className="text-yellow-500 fill-yellow-500" size={14} /> },
                     { label: "Completion Rate", value: `${trustMetrics.completionScore}%`, sub: "Reliable", icon: <CheckCircle className="text-green-500" size={14} /> },
                     { label: "Repeat Business", value: `${trustMetrics.repeatClientRate}%`, sub: "High Trust", icon: <History className="text-blue-500" size={14} /> },
                     { label: "Total Hustles", value: trustMetrics.totalJobs, sub: "Managed", icon: <Briefcase className="text-purple-500" size={14} /> },
                   ].map((stat, i) => (
                     <div key={i} className="p-5 rounded-[2rem] bg-white/[0.03] border border-white/5 flex flex-col gap-1 shadow-inner group hover:bg-white/[0.05] transition-all">
                        <div className="flex items-center justify-between mb-1">
                           <span className="text-[8px] font-black uppercase text-white/30 tracking-widest">{stat.label}</span>
                           {stat.icon}
                        </div>
                        <span className="text-xl font-black text-white tracking-tighter">{stat.value}</span>
                        <span className="text-[8px] font-black uppercase text-white/20 tracking-tighter">{stat.sub}</span>
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

            {/* 2. JOBS / BOOKINGS MANAGEMENT SECTION (Owner Only) */}
            {activeTab === "jobs" && (
              <motion.div
                key="jobs"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex flex-col gap-8"
              >
                {/* Management Perspective Header */}
                <div className="flex items-center justify-between px-2">
                   <div className="flex flex-col">
                      <h3 className="text-xl font-black text-white uppercase tracking-tighter">
                         {hustlerMode ? "Client Orders" : "My Bookings"}
                      </h3>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">
                         {hustlerMode ? "Managing your incoming revenue" : "Tracking services you've acquired"}
                      </p>
                   </div>
                   {hustlerMode && (
                     <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-2xl flex flex-col items-end">
                        <span className="text-[9px] text-white/40 font-black uppercase tracking-widest">Est. Earnings</span>
                        <span className="text-lg font-black text-green-400 font-mono tracking-tighter">$2,450.00</span>
                     </div>
                   )}
                </div>

                {/* Management Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-3 pb-2 px-1">
                  {['Active', 'Pending', 'Completed', 'Cancelled'].map((t) => (
                    <button 
                      key={t} 
                      onClick={() => setJobFilter(t)}
                      className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${jobFilter === t ? 'bg-white text-black shadow-xl scale-105' : 'bg-white/5 border border-white/10 text-white/50 hover:text-white hover:bg-white/10'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-5">
                  {(hustlerMode ? hustlerJobs : myBookings)
                    .filter(item => item.type === jobFilter)
                    .map((item, i) => (
                    <div key={i} className="p-7 rounded-[2.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-6 shadow-2xl relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-4 opacity-20 group-hover:opacity-100 transition-opacity">
                         <History size={16} />
                      </div>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center text-lg font-black text-white/20 border border-white/10">
                             {item.avatar}
                           </div>
                           <div>
                              <div className="flex items-center gap-2 mb-2">
                                <span className={`text-[8px] px-2 py-0.5 rounded-full uppercase tracking-[0.2em] font-black border ${item.progress === 100 ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                  {item.status}
                                </span>
                                <span className="text-[9px] text-white/20 font-black uppercase tracking-widest">{item.id}</span>
                              </div>
                              <h3 className="font-black text-white text-lg tracking-tight leading-tight">{item.service}</h3>
                              <p className="text-[10px] font-black text-white/40 mt-1.5 uppercase tracking-widest">
                                {hustlerMode ? "Client" : "Hustler"}: {'client' in item ? item.client : 'hustler' in item ? item.hustler : ''}
                              </p>
                           </div>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-2xl text-white tracking-tighter block">{item.amount}</span>
                          <span className="text-[9px] text-white/20 uppercase tracking-widest font-black mt-2 block">
                            {jobFilter === 'Completed' ? 'FINISHED' : `DUE: ${item.due}`}
                          </span>
                        </div>
                      </div>
                      
                      {/* Job Progress */}
                      {jobFilter !== 'Completed' && (
                        <div className="flex flex-col gap-3">
                          <div className="flex justify-between items-center text-[9px] uppercase font-black text-white/30 tracking-widest px-1">
                             <span>Progress</span>
                             <span>{item.progress}%</span>
                          </div>
                          <div className="w-full bg-white/5 h-3 rounded-full overflow-hidden border border-white/5 shadow-inner p-0.5">
                            <motion.div 
                              initial={{ width: 0 }}
                              animate={{ width: `${item.progress}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                              className={`h-full rounded-full ${item.progress === 100 ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.3)]' : 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.2)]'}`} 
                            />
                          </div>
                        </div>
                      )}
                      
                      <div className="grid grid-cols-2 gap-3 mt-2">
                        <button className="py-3.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95">
                          {hustlerMode ? "Message Client" : "Contact Hustler"}
                        </button>
                        {jobFilter === 'Active' ? (
                          <button className={`py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl ${item.progress === 100 ? 'bg-green-500 text-white hover:bg-green-600' : 'bg-white text-black hover:bg-white/90'}`}>
                            {hustlerMode ? (item.progress === 100 ? 'Deliver & Close' : 'Update Milestone') : 'Review Feedback'}
                          </button>
                        ) : jobFilter === 'Pending' ? (
                          <button className="py-3.5 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl hover:bg-white/90">
                            {hustlerMode ? "Accept Terms" : "Check Status"}
                          </button>
                        ) : (
                          <button className="py-3.5 rounded-2xl bg-white/10 text-white/60 text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95">
                            View Receipt
                          </button>
                        )}
                      </div>
                    </div>
                  ))}

                  {(hustlerMode ? hustlerJobs : myBookings).filter(item => item.type === jobFilter).length === 0 && (
                    <div className="p-12 text-center text-white/20 border border-white/5 border-dashed rounded-[3rem] bg-white/[0.01]">
                       <History size={32} className="mx-auto mb-4 opacity-10" />
                       <p className="text-xs uppercase tracking-[0.2em] font-black">No {jobFilter.toLowerCase()} {hustlerMode ? "jobs" : "bookings"} found.</p>
                    </div>
                  )}
                </div>
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
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Upgrade Flow Overlay */}
      <AnimatePresence>
        {showUpgrade && (
          <HustlerUpgradeFlow 
            onClose={() => setShowUpgrade(false)} 
            onSuccess={() => {
              setShowUpgrade(false);
              setHustlerMode(true);
              if (onHustlerModeChange) onHustlerModeChange(true);
            }} 
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
                    onClick={() => setIsAvailable(!isAvailable)}
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
                        onClick={() => {
                          setStatusMessage(reason.label);
                          setIsAvailable(reason.label !== "Fully Booked" && reason.label !== "Away / Vacation");
                        }}
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
                        onClick={() => setCapacity(val)}
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
                            setSchedule(next);
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
    </div>
  );
}
