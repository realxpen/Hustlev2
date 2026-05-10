import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, Star, MapPin, CheckCircle2, MessageSquare, MoreHorizontal, Grid, 
  Briefcase, MessageCircle, Info, Calendar, ShieldCheck, ShieldAlert, Edit2, 
  ShoppingBag, BookOpen, Clock, Heart, Camera, Settings, X, Plus, Play, Link as LinkIcon,
  Check, AlertCircle, TrendingUp, CreditCard, User, History, Zap
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import BookingFlow from "./BookingFlow";
import ReportSheet from "./ReportSheet";
import ImageEditorModal from "./ImageEditorModal";

interface ProfilePageProps {
  hustler: any;
  onBack: () => void;
}

export default function ProfilePage({ hustler, onBack }: ProfilePageProps) {
  const [activeTab, setActiveTab] = useState("posts");
  const [showBooking, setShowBooking] = useState(false);
  const [showReport, setShowReport] = useState(false);
  
  // Demonstration states
  const [isOwnerMode, setIsOwnerMode] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isAvailable, setIsAvailable] = useState(true);
  const [showSchedule, setShowSchedule] = useState(false);
  const [statusMessage, setStatusMessage] = useState("Open for Bookings");
  const [reviewFilter, setReviewFilter] = useState<"received" | "given">("received");
  
  const [imageEditorState, setImageEditorState] = useState<{isOpen: boolean, type: 'avatar' | 'cover' | null}>({ isOpen: false, type: null });
  const [localAvatar, setLocalAvatar] = useState(hustler.creator.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60");
  const [localCover, setLocalCover] = useState("https://images.unsplash.com/photo-1557683316-973673baf926?w=800&auto=format&fit=crop&q=80"); // fallback cover

  const schedule = [
    { day: "Mon", active: true, start: "09:00", end: "18:00" },
    { day: "Tue", active: true, start: "09:00", end: "18:00" },
    { day: "Wed", active: true, start: "09:00", end: "18:00" },
    { day: "Thu", active: true, start: "09:00", end: "18:00" },
    { day: "Fri", active: true, start: "10:00", end: "16:00" },
    { day: "Sat", active: false, start: "10:00", end: "14:00" },
    { day: "Sun", active: false, start: "10:00", end: "14:00" },
  ];

  const trustMetrics = {
    rating: 4.8,
    completionScore: 100,
    repeatClientRate: 58,
    totalJobs: 21
  };

  const reviewsReceived = [
    { id: 1, author: "Marco V.", rating: 5, comment: "One of the best designers I've worked with on this platform. Incredible attention to detail.", date: "3 days ago", avatar: "M", repeat: true, service: "Custom 3D Scene" },
    { id: 2, author: "Lulu Designs", rating: 5, comment: "Super responsive and professional. Handled the headshot edits perfectly.", date: "2 weeks ago", avatar: "L", repeat: false, service: "Headshot Retouching" },
  ];

  const reviewsGiven = [
    { id: 1, recipient: "Dribbble Studio", rating: 5, comment: "Always a pleasure collaborating with this team.", date: "2 months ago", avatar: "D" },
  ];

  // Smooth scroll to top when tab changes if we are scrolled down too far
  const scrollRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { id: "posts", label: "Posts", icon: <Grid size={14} /> },
    { id: "services", label: "Services", icon: <Briefcase size={14} /> },
    { id: "products", label: "Products", icon: <ShoppingBag size={14} /> },
    { id: "trainings", label: "Trainings", icon: <BookOpen size={14} /> },
    { id: "reviews", label: "Reviews", icon: <Star size={14} /> },
    { id: "about", label: "About", icon: <Info size={14} /> }
  ];

  const featuredOfferings = [
    { id: 'f1', name: "Figma UI Kit 2026", price: 49, type: "product", image: "https://images.unsplash.com/photo-1541461985943-955a15064562?w=400&auto=format&fit=crop&q=60", sales: 843 },
    { id: 'f2', name: "Product Design Sprint", price: 499, type: "service", image: "https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&auto=format&fit=crop&q=60", delivery: "5 days" },
  ];

  const myServices = [
    { id: 's1', name: "Full Product Design Sprint", price: 499, time: "5-7 days", desc: "End-to-end design from wireframes to high fidelity mockups and interactive prototypes.", features: ["3 Revision Cycles", "Source Files", "Developer Handoff"], popular: true },
    { id: 's2', name: "UI/UX Audit", price: 150, time: "2 days", desc: "Comprehensive actionable tear-down of your current product's user experience and visual design.", features: ["Loom Video Walkthrough", "PDF Report", "Quick Fixes List"] },
    { id: 's3', name: "Brand Identity System", price: 850, time: "2 weeks", desc: "Complete visual identity including logos, typography, color palettes, and brand guidelines.", features: ["3 Concepts", "Social Media Kit", "Print Ready Files"] }
  ];

  const myProducts = [
    { id: 'p1', name: "Figma UI Kit 2026", price: 49, type: "Digital", image: "https://images.unsplash.com/photo-1541461985943-955a15064562?w=400&auto=format&fit=crop&q=60", stock: "Unlimited", rating: 4.9, sales: 843 },
    { id: 'p2', name: "Creator Notion Template", price: 29, type: "Digital", image: "https://images.unsplash.com/photo-1517842645767-c639042777db?w=400&auto=format&fit=crop&q=60", stock: "Unlimited", rating: 4.7, sales: 1205 },
    { id: 'p3', name: "Premium Font: Hustle Sans", price: 79, type: "Digital", image: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&auto=format&fit=crop&q=60", stock: "Unlimited", rating: 5.0, sales: 124 },
    { id: 'p4', name: "Physical Prints Collection", price: 120, type: "Physical", image: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&auto=format&fit=crop&q=60", stock: "12 Left", rating: 4.8, sales: 56 }
  ];

  const myTrainings = [
    { id: 't1', name: "Advanced Figma Systems", price: 199, duration: "6 Hours", type: "Masterclass", modules: 12, rating: 4.9, image: "https://images.unsplash.com/photo-1581291518633-83b4ebd1d83e?w=400&auto=format&fit=crop&q=60", outcomes: ["Atomic Design Master", "Prototyping Expert", "Complex Auto-layout Control"] },
    { id: 't2', name: "Freelance Business 101", price: 99, duration: "3 Hours", type: "Digital Workshop", modules: 5, rating: 4.8, image: "https://images.unsplash.com/photo-1454165833767-027ffea9e772?w=400&auto=format&fit=crop&q=60", outcomes: ["Contract Writing", "Pricing Strategies", "Client Pipeline Strategy"] }
  ];

  const myApprenticeships = [
    { id: 'a1', name: "Product Design Apprenticeship", duration: "3 Months", slots: "2 Open", type: "Mentorship", stipend: "Paid Opp", image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&auto=format&fit=crop&q=60", level: "Intermediate", perks: ["Direct Client Access", "Portfolio Review", "Handoff Mastery"] }
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
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 50 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="fixed inset-0 z-[60] bg-[#050505] flex flex-col w-full h-full pb-safe"
    >
      {/* Sticky Top Navigation - Guarantees users never feel trapped */}
      <header className="sticky top-0 z-[100] flex justify-between items-center px-4 py-3 bg-[#050505]/90 backdrop-blur-2xl border-b border-white/5 safe-top shadow-xl">
        <button 
          onClick={onBack}
          className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-all active:scale-90"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="flex items-center gap-2">
          {/* Demo toggle for Owner Mode */}
          <button 
            onClick={() => setIsOwnerMode(!isOwnerMode)}
            className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border transition-colors ${
              isOwnerMode ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' : 'bg-white/5 border-white/10 text-white/50 hover:text-white'
            }`}
          >
            {isOwnerMode ? 'Owner View' : 'Client View'}
          </button>

          <button className="w-10 h-10 rounded-full bg-white/5 hover:bg-white/10 flex items-center justify-center border border-white/10 text-white transition-colors">
            <MoreHorizontal size={20} />
          </button>
        </div>
      </header>

      {/* Main Scrollable Area */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto no-scrollbar pb-48 overscroll-contain">
        <div className="grain-overlay pointer-events-none" />

        {/* Cover & Identity Section */}
        <section className="relative flex flex-col items-center">
          {/* Status Indicator Chip - Floats over Cover for Visitors */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="absolute top-4 left-4 z-20"
          >
            <div 
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-2xl border transition-all shadow-2xl ${
                isAvailable ? 'bg-green-500/20 border-green-500/30 text-green-400' : 'bg-red-500/20 border-red-500/30 text-red-400'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-[10px] font-black uppercase tracking-widest">
                {isAvailable ? (statusMessage || "Online") : "Away"}
              </span>
            </div>
          </motion.div>

          {/* Cover Photo */}
          <div 
            className={`w-full h-48 bg-gradient-to-br from-blue-900/40 to-purple-900/20 relative group ${isOwnerMode ? 'cursor-pointer' : ''}`}
            onClick={() => isOwnerMode && setImageEditorState({ isOpen: true, type: 'cover' })}
          >
            <img src={localCover} className="w-full h-full object-cover absolute inset-0 opacity-50" alt="Cover" />
            {isOwnerMode && (
              <button className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity z-10">
                <Camera size={16} />
              </button>
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-[#050505]/50 to-transparent" />
          </div>

          {/* Profile Avatar */}
          <div 
            className="relative -mt-16 mb-4 z-10 group"
            onClick={() => isOwnerMode && setImageEditorState({ isOpen: true, type: 'avatar' })}
          >
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className={`w-32 h-32 rounded-full border-4 border-[#050505] overflow-hidden bg-white/5 relative shadow-2xl ${isOwnerMode ? 'cursor-pointer' : ''}`}
            >
              <img 
                src={localAvatar} 
                alt={hustler.creator.name}
                className="w-full h-full object-cover"
              />
              {isOwnerMode && (
                <div className="absolute inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  <Camera size={24} className="text-white" />
                </div>
              )}
            </motion.div>
            {hustler.creator.active && (
              <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 rounded-full border-4 border-[#050505] z-20" />
            )}
          </div>

          {/* Identity Info */}
          <div className="px-6 flex flex-col items-center text-center w-full">
            <motion.h1 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-display font-black tracking-tight flex items-center gap-2 text-white"
            >
              {hustler.creator.name}
              {hustler.creator.verified && <CheckCircle2 size={24} className="text-blue-400" />}
            </motion.h1>

            {/* Trust Meter */}
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="mt-3 flex items-center gap-4"
            >
               <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} size={10} className={s <= Math.floor(trustMetrics.rating) ? "fill-yellow-500 text-yellow-500" : "text-white/10"} />
                  ))}
                  <span className="ml-1 text-[10px] font-black text-white">{trustMetrics.rating}</span>
               </div>
               <div className="h-3 w-px bg-white/10" />
               <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{trustMetrics.totalJobs} Hustles</span>
            </motion.div>
            
            {/* Primary & Secondary Hustles */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mt-3 flex flex-col items-center gap-2"
            >
              <span className="text-white font-bold tracking-wide flex items-center gap-1">
                <Briefcase size={14} className="text-blue-400" /> Primary: {hustler.creator.category}
              </span>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
                <span className="text-[10px] text-white/50 uppercase tracking-widest font-bold">Secondary:</span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-white/70 tracking-wider">Video Directing</span>
                <span className="px-2 py-1 rounded-md bg-white/5 border border-white/10 text-[10px] uppercase font-bold text-white/70 tracking-wider">Apprenticeships</span>
              </div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mt-4 text-white/40 text-xs uppercase tracking-widest font-bold"
            >
              <MapPin size={12} />
              {hustler.creator.location} • Top Rated
            </motion.div>

            {/* Availability Management Display - MOVED HIGHER */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mt-6 p-1 rounded-[2rem] bg-white/[0.02] border border-white/5 w-full max-w-sm mx-auto flex items-center shadow-inner"
            >
              <div 
                onClick={() => !isOwnerMode && setShowSchedule(true)}
                className={`flex-1 flex items-center gap-4 px-4 py-3 rounded-[1.75rem] transition-all bg-[#0c0c0c] border border-white/10 shadow-xl ${!isOwnerMode ? 'cursor-pointer hover:bg-white/[0.04]' : ''}`}
              >
                <div className={`w-2.5 h-2.5 rounded-full ${isAvailable ? 'bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]' : 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.6)] animate-pulse'}`} />
                <div className="text-left flex-1">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] font-black text-white uppercase tracking-tight">Status</p>
                    <div className="flex items-center gap-1 opacity-20">
                      <Clock size={10} />
                      <span className="text-[8px] font-black uppercase">Live</span>
                    </div>
                  </div>
                  <p className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-black mt-0.5">
                    {isAvailable ? (statusMessage || "Open for Bookings") : "Paused • Back Soon"}
                  </p>
                </div>
              </div>
              
              {isOwnerMode ? (
                <button 
                  onClick={() => setIsAvailable(!isAvailable)}
                  className={`ml-1 px-5 py-4 rounded-[1.5rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl ${
                    isAvailable ? 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white' : 'bg-white text-black'
                  }`}
                >
                   Manage
                </button>
              ) : (
                <button 
                 onClick={() => setShowSchedule(true)}
                 className="ml-1 px-5 py-4 rounded-[1.5rem] bg-white/5 border border-white/10 text-white/40 hover:text-white hover:bg-white/10 transition-all text-[9px] font-black uppercase tracking-[0.2em]"
                >
                   Schedule
                </button>
              )}
            </motion.div>

            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="mt-4 text-white/60 text-sm leading-relaxed max-w-md mx-auto"
            >
               Visionary {hustler.creator.category.toLowerCase()} executing high-fidelity outcomes. 
               My profile is my digital business. Driven by quality and speed.
            </motion.p>
            
            {/* Owner Customization Controls */}
            {isOwnerMode && (
              <motion.button 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                onClick={() => setIsEditing(!isEditing)}
                className="mt-4 px-6 py-2 rounded-xl bg-white/10 hover:bg-white/15 border border-white/20 text-white text-sm font-bold flex items-center gap-2 transition-colors shadow-sm"
              >
                <Edit2 size={14} /> Edit Identity & Theme
              </motion.button>
            )}

            {/* Rating + Trust Visibility */}
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex items-center gap-6 mt-8 p-5 rounded-3xl bg-white/[0.02] border border-white/5 w-full max-w-md mx-auto justify-between"
            >
              <div className="flex flex-col items-center flex-1">
                <div className="flex items-center gap-1 text-white font-black text-xl">
                  <Star size={18} className="text-yellow-500 fill-yellow-500" />
                  {hustler.creator.rating}
                </div>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">112 Reviews</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-white font-black text-xl">{hustler.creator.jobs}</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">Completed</span>
              </div>
              <div className="w-[1px] h-8 bg-white/10" />
              <div className="flex flex-col items-center flex-1">
                <span className="text-white font-black text-xl">1hr</span>
                <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1">Response</span>
              </div>
            </motion.div>

          </div>
        </section>

        {/* Recent Hustles - Proof of Work for Visitors */}
        <section className="px-6 mt-8 mb-8">
          <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Recent Hustles</h3>
             <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-green-400">
               <ShieldCheck size={12} /> Escrow Verified
             </div>
          </div>
          <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x pb-4">
             {[
               { id: 1, title: "UI System for Fintech", client: "Elena R.", status: "Completed", rating: 5, image: "https://images.unsplash.com/photo-1551288049-bbbda536339a?w=400&auto=format&fit=crop&q=60" },
               { id: 2, title: "Brand Identity Design", client: "David M.", status: "Completed", rating: 5, image: "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&auto=format&fit=crop&q=60" },
               { id: 3, title: "3D Motion Product Clip", client: "Sophia K.", status: "Completed", rating: 5, image: "https://images.unsplash.com/photo-1614850523296-d8c1af93d400?w=400&auto=format&fit=crop&q=60" }
             ].map((hustle) => (
               <div key={hustle.id} className="min-w-[240px] bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden snap-start group relative shadow-2xl">
                  <div className="h-32 relative overflow-hidden">
                     <img src={hustle.image} className="w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700" alt={hustle.title} />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#0c0c0c] to-transparent" />
                     <div className="absolute top-4 right-4 flex items-center gap-1 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg border border-white/10">
                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-black text-white">{hustle.rating}</span>
                     </div>
                  </div>
                  <div className="p-5 flex flex-col gap-1">
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">{hustle.status}</span>
                     <h4 className="text-sm font-black text-white uppercase tracking-tight truncate leading-tight">{hustle.title}</h4>
                     <p className="text-[9px] text-white/30 uppercase tracking-widest font-black mt-1">Client: {hustle.client}</p>
                  </div>
               </div>
             ))}
             
             {/* Total Impact Card */}
             <div className="min-w-[160px] bg-blue-600/10 border border-blue-500/20 rounded-[2.5rem] flex flex-col items-center justify-center p-6 snap-start text-center">
                <span className="text-2xl font-black text-white tracking-tighter">140+</span>
                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest leading-tight mt-1">Hustles Successfully Executed</span>
             </div>
          </div>
        </section>

        {/* Segmented Sticky Navigation Architecture */}
        <div className="sticky top-0 z-50 bg-[#050505]/80 backdrop-blur-2xl border-y border-white/5 py-3 shadow-2xl">
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
                      layoutId="profileSegmentHighlight"
                      className="absolute inset-0 bg-white rounded-xl shadow-[0_4px_12px_rgba(255,255,255,0.2)]"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </button>
              ))}
            </nav>
          </div>
        </div>

        {/* Content Area Rendering */}
        <div className="px-4 py-6 min-h-[50vh]">
          <AnimatePresence mode="wait">
            
            {/* 4. PORTFOLIO + CONTENT GRID SYSTEM */}
            {activeTab === "posts" && (
              <motion.div
                key="posts"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-8"
              >
                {/* Featured Storefront in Feed (Visitor) */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">Shop My Direct</h3>
                     <button onClick={() => handleTabChange("products")} className="text-[9px] font-black uppercase tracking-widest text-blue-400">View Catalog</button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2 snap-x">
                    {featuredOfferings.map((item) => (
                      <div key={item.id} className="min-w-[280px] h-44 bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] overflow-hidden flex snap-start relative group transition-all hover:border-blue-500/50 shadow-2xl">
                        <div className="w-1/2 h-full relative overflow-hidden">
                          <img src={item.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700 opacity-80" alt={item.name} />
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-black/20 to-[#0c0c0c]" />
                        </div>
                        <div className="w-1/2 p-6 flex flex-col justify-center gap-1 z-10 bg-black/40 backdrop-blur-3xl">
                          <span className="text-[8px] font-black uppercase tracking-widest text-blue-400">{item.type}</span>
                          <h4 className="text-sm font-black text-white leading-tight mb-2 uppercase tracking-tight">{item.name}</h4>
                          <div className="flex items-center justify-between mt-auto">
                            <span className="text-lg font-black text-white">${item.price}</span>
                            <div className="px-3 py-1.5 rounded-xl bg-white text-black group-hover:bg-blue-500 group-hover:text-white transition-all text-[8px] font-black uppercase tracking-widest">
                               {item.type === 'service' ? 'Book' : 'Get'}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-1 md:gap-2">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                    <div key={i} className="aspect-[3/4] relative rounded-xl border border-white/5 overflow-hidden group cursor-pointer bg-[#0c0c0c] text-white/20 flex flex-col items-center justify-center hover:scale-[0.98] transition-all">
                      <img src={`https://images.unsplash.com/photo-${1500000000000 + i * 1000}?w=400&auto=format&fit=crop&q=60`} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 transition-opacity" />
                      
                      <div className="absolute top-2 right-2 z-10 p-1.5 bg-black/60 backdrop-blur-md rounded-lg">
                        {i % 3 === 0 ? <Play size={12} className="text-white fill-white" /> : <Camera size={12} className="text-white" />}
                      </div>

                      <div className="absolute bottom-3 left-3 flex items-center gap-1.5 drop-shadow-lg">
                        <Play size={10} className="text-white fill-white" />
                        <span className="text-[10px] text-white font-black tracking-tighter uppercase">{(i * 12.4).toFixed(1)}k</span>
                      </div>
                    </div>
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
                <div className="px-2">
                   <h3 className="text-lg font-black text-white uppercase tracking-tighter">Professional Offerings</h3>
                   <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-medium mt-1">Direct bookings with guaranteed escrow protection</p>
                </div>

                <div className="flex flex-col gap-5">
                  {myServices.map((item, i) => (
                    <div key={i} className="p-7 rounded-[2.5rem] bg-[#0c0c0c] border border-white/10 flex flex-col gap-6 group hover:border-blue-500/40 transition-all cursor-pointer shadow-2xl relative overflow-hidden active:scale-[0.98]">
                      {item.popular && (
                        <div className="absolute top-0 right-14 px-5 py-2 bg-blue-600 text-white text-[9px] font-black uppercase tracking-[0.3em] rounded-b-2xl shadow-xl z-20">
                          Elite Service
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start relative z-10">
                        <div className="flex-1">
                          <h3 className="font-black text-white text-2xl tracking-tighter leading-tight group-hover:text-blue-400 transition-colors uppercase">{item.name}</h3>
                          <div className="flex items-center gap-3 mt-3">
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-2 py-1 rounded-lg">
                               <Clock size={12} /> {item.time}
                             </div>
                             <div className="flex items-center gap-1.5 text-[10px] font-black text-green-400 uppercase tracking-widest bg-green-400/5 px-2 py-1 rounded-lg border border-green-500/10">
                               <Zap size={12} /> Priority Intro
                             </div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0 ml-4">
                          <span className="text-3xl font-black text-white tracking-tighter leading-none">${item.price}</span>
                          <span className="text-[9px] text-white/20 uppercase tracking-widest font-black mt-1">Starting At</span>
                        </div>
                      </div>

                      <p className="text-[13px] text-white/50 font-medium leading-relaxed max-w-[90%]">
                        {item.desc}
                      </p>
                      
                      <div className="flex flex-wrap gap-2">
                        {item.features.map((f, fi) => (
                          <div key={fi} className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/[0.04] border border-white/5">
                            <CheckCircle2 size={12} className="text-blue-500" />
                            <span className="text-[10px] font-black text-white/60 uppercase tracking-widest leading-none">{f}</span>
                          </div>
                        ))}
                      </div>

                      <div className="flex items-center justify-between mt-2 pt-6 border-t border-white/5">
                        <div className="flex items-center gap-5">
                           <div className="flex items-center gap-1.5">
                              <Star size={12} className="text-yellow-500 fill-yellow-500" />
                              <span className="text-sm font-black text-white">4.9</span>
                           </div>
                           <div className="flex -space-x-3">
                              {[1,2,3].map(user => (
                                <div key={user} className="w-8 h-8 rounded-full border-2 border-[#0c0c0c] bg-white/10 flex items-center justify-center text-[10px] font-black">{String.fromCharCode(64+user)}</div>
                              ))}
                              <div className="w-8 h-8 rounded-full border-2 border-[#0c0c0c] bg-blue-900 flex items-center justify-center text-[8px] font-black">+12</div>
                           </div>
                        </div>
                        <button className="px-8 py-4 rounded-[2rem] bg-white text-black text-[11px] font-black uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-2xl active:scale-95">
                          Book This Service
                        </button>
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -15 }}
                className="flex flex-col gap-8"
              >
                <div className="flex items-center justify-between px-2">
                  <div className="flex flex-col">
                    <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">The Creator Drop</h3>
                    <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] font-black mt-1">Exclusives & Digital Assets</p>
                  </div>
                  <div className="flex gap-2">
                     <button className="p-3 rounded-2xl bg-white/5 border border-white/10 text-white/40 hover:text-white">
                        <Grid size={16} />
                     </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-x-4 gap-y-10">
                  {myProducts.map((prod, i) => (
                    <div key={i} className="flex flex-col gap-4 group">
                      <div className="aspect-[4/5] bg-black rounded-[3rem] border border-white/10 overflow-hidden relative group cursor-pointer shadow-[0_30px_60px_-15px_rgba(0,0,0,0.5)] active:scale-[0.97] transition-all hover:border-blue-500/50">
                         <img src={prod.image} className="w-full h-full object-cover opacity-70 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700 blur-[0px] group-hover:blur-0" alt={prod.name} />
                         
                         {/* Dynamic Badge */}
                         <div className="absolute top-5 left-5 z-20">
                           <span className="px-3 py-1.5 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 text-[8px] font-black text-white uppercase tracking-widest">
                             {prod.type}
                           </span>
                         </div>

                         <div className="absolute inset-x-0 bottom-0 p-6 bg-gradient-to-t from-black via-black/80 to-transparent flex flex-col gap-1.5">
                            <div className="flex items-center gap-1 text-yellow-500">
                               <Star size={10} className="fill-yellow-500" />
                               <span className="text-[10px] font-black text-white">{prod.rating}</span>
                            </div>
                            <h3 className="text-base font-black text-white uppercase tracking-tight leading-tight line-clamp-2">{prod.name}</h3>
                            <div className="flex items-center justify-between mt-3">
                              <span className="text-xl font-black text-white tracking-tighter italic">${prod.price}</span>
                              <div className="w-10 h-10 rounded-2xl bg-white text-black flex items-center justify-center shadow-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                                <ShoppingBag size={18} />
                              </div>
                            </div>
                         </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Newsletter / Drops Module */}
                <div className="p-8 rounded-[3rem] bg-indigo-600 shadow-2xl relative overflow-hidden group mt-4">
                   <div className="relative z-10">
                      <h4 className="text-2xl font-black text-white tracking-tighter italic mb-2 uppercase">Join The Insiders</h4>
                      <p className="text-xs text-white/70 font-medium leading-relaxed mb-6 max-w-[80%]">Get notified 24h before new asset drops and exclusive workshops go live.</p>
                      <div className="flex gap-2">
                        <input className="flex-1 bg-black/20 border border-white/20 rounded-2xl px-5 py-3 text-white text-xs placeholder:text-white/40 focus:outline-none focus:border-white transition-all" placeholder="Enter your email" />
                        <button className="px-6 py-3 rounded-2xl bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">Join</button>
                      </div>
                   </div>
                   <Zap size={120} className="absolute -bottom-10 -right-10 text-white/10 rotate-12 group-hover:scale-110 transition-transform duration-700" />
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
                className="flex flex-col gap-10"
              >
                <div className="px-2">
                   <h3 className="text-xl font-black text-white uppercase tracking-tighter italic">Academy Hub</h3>
                   <p className="text-[10px] text-white/30 uppercase tracking-[0.3em] font-medium mt-1">Growth opportunities & shared mastery</p>
                </div>

                {/* Apprenticeship Card - High Impact Mentorship */}
                <div className="flex flex-col gap-6">
                  {myApprenticeships.map((app) => (
                    <div key={app.id} className="relative p-1 rounded-[3rem] bg-gradient-to-br from-indigo-500/30 via-purple-500/20 to-transparent group cursor-pointer shadow-2xl transition-all hover:scale-[0.99]">
                       <div className="bg-[#0c0c0c] p-8 rounded-[2.9rem] flex flex-col gap-6">
                         <div className="flex justify-between items-start">
                            <div>
                               <span className="px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 text-[8px] font-black uppercase tracking-widest mb-3 inline-block">{app.type}</span>
                               <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-tight group-hover:text-indigo-400 transition-colors">{app.name}</h3>
                            </div>
                            <div className="w-20 h-20 rounded-[2.5rem] bg-white/5 border border-white/10 p-0.5 shadow-2xl">
                               <img src={app.image} className="w-full h-full object-cover rounded-[2.4rem] opacity-80" alt={app.name} />
                            </div>
                         </div>

                         <div className="flex gap-6 text-[10px] font-black text-white/40 uppercase tracking-widest">
                            <div className="flex items-center gap-2"><Clock size={14} /> {app.duration}</div>
                            <div className="flex items-center gap-2 text-indigo-400"><History size={14} /> {app.slots}</div>
                            <div className="flex items-center gap-2 text-green-400"><CheckCircle2 size={14} /> {app.stipend}</div>
                         </div>

                         <div className="flex flex-wrap gap-2">
                            {app.perks.map((perk, pi) => (
                              <div key={pi} className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-[9px] font-black text-white/60 uppercase tracking-widest">
                                {perk}
                              </div>
                            ))}
                         </div>

                         <button className="w-full py-5 rounded-[2rem] bg-indigo-600 text-white text-[11px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-500/20 hover:bg-white hover:text-black transition-all active:scale-95">
                            Apply for Apprenticeship
                         </button>
                       </div>
                    </div>
                  ))}
                </div>

                {/* Trainings Preview */}
                <div className="flex flex-col gap-4">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 px-2">Knowledge Drops</h4>
                  <div className="grid grid-cols-1 gap-5">
                    {myTrainings.map((training) => (
                      <div key={training.id} className="p-6 rounded-[2.5rem] bg-[#0c0c0c] border border-white/10 group flex gap-5 hover:border-indigo-500/30 transition-all cursor-pointer">
                         <div className="w-32 h-32 rounded-3xl overflow-hidden shrink-0 shadow-2xl relative">
                            <img src={training.image} className="w-full h-full object-cover opacity-60 group-hover:opacity-100 group-hover:scale-110 transition-all duration-700" alt={training.name} />
                            <Play size={20} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white fill-white/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                         </div>
                         <div className="flex-1 flex flex-col justify-between py-1">
                            <div>
                               <div className="flex items-center justify-between mb-2">
                                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">{training.type}</span>
                                  <div className="flex items-center gap-1">
                                     <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                     <span className="text-[8px] font-black text-white">{training.rating}</span>
                                  </div>
                               </div>
                               <h3 className="text-lg font-black text-white uppercase tracking-tight leading-tight line-clamp-2 group-hover:text-indigo-400 transition-colors">{training.name}</h3>
                               <div className="flex items-center gap-2 mt-2 text-[9px] font-black text-white/30 uppercase tracking-widest">
                                  <span>{training.modules} Modules</span>
                                  <span>•</span>
                                  <span>{training.duration}</span>
                               </div>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                               <span className="text-xl font-black text-white tracking-widest">${training.price}</span>
                               <div className="px-5 py-2.5 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest group-hover:bg-blue-600 group-hover:text-white transition-all shadow-xl">
                                  Enroll
                               </div>
                            </div>
                         </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Mentor Showcase Highlight */}
                <div className="p-8 rounded-[3rem] bg-white/[0.03] border border-white/5 relative overflow-hidden group">
                   <div className="relative z-10 flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-indigo-600 flex items-center justify-center text-white mb-4 shadow-2xl">
                         <Star size={24} className="fill-white" />
                      </div>
                      <h4 className="text-xl font-black text-white tracking-tighter uppercase italic mb-2">Mentor Access</h4>
                      <p className="text-xs text-white/40 font-medium leading-relaxed mb-6 max-w-[200px]">Unlock direct lineage to {hustler.creator.name}'s professional network and secret workflows.</p>
                      <button className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white text-[10px] font-black uppercase tracking-widest hover:text-white hover:bg-white/10 transition-all">
                        Upgrade To Insider
                      </button>
                   </div>
                   <Zap size={140} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 group-hover:scale-110 transition-all duration-700" />
                </div>
              </motion.div>
            )}

            {/* 5. REVIEWS SYSTEM */}
            {activeTab === "reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-8"
              >
                {/* Visual Trust Breakdown */}
                <div className="grid grid-cols-2 gap-3">
                   <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex flex-col items-center text-center shadow-xl">
                      <span className="text-4xl font-black text-white tracking-tighter mb-1">{trustMetrics.rating}</span>
                      <div className="flex gap-1 mb-2">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star key={s} size={10} className={s <= Math.floor(trustMetrics.rating) ? "fill-yellow-500 text-yellow-500" : "text-white/10"} />
                        ))}
                      </div>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Verified Rating</span>
                   </div>
                   <div className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 flex flex-col items-center text-center shadow-xl">
                      <span className="text-4xl font-black text-green-400 tracking-tighter mb-1">{trustMetrics.repeatClientRate}%</span>
                      <div className="flex gap-1 mb-2">
                        <History size={12} className="text-green-500/50" />
                      </div>
                      <span className="text-[9px] font-black text-white/30 uppercase tracking-widest">Repeat Hires</span>
                   </div>
                </div>

                {/* Switcher for Received vs Given */}
                <div className="flex p-1.5 bg-white/5 border border-white/5 rounded-2xl">
                  <button 
                    onClick={() => setReviewFilter("received")}
                    className={`flex-1 py-3 rounded-[14px] text-xs font-bold transition-all ${reviewFilter === "received" ? "bg-white text-black shadow-sm" : "text-white/40 hover:text-white"}`}
                  >
                    Received ({reviewsReceived.length})
                  </button>
                  <button 
                    onClick={() => setReviewFilter("given")}
                    className={`flex-1 py-3 rounded-[14px] text-xs font-bold transition-all ${reviewFilter === "given" ? "bg-white text-black shadow-sm" : "text-white/40 hover:text-white"}`}
                  >
                    Given ({reviewsGiven.length})
                  </button>
                </div>

                <div className="flex flex-col gap-6">
                  {(reviewFilter === "received" ? reviewsReceived : reviewsGiven).map((review) => (
                    <div key={review.id} className="p-6 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col gap-4 shadow-sm">
                      <div className="flex items-center justify-between border-b border-white/5 pb-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center text-sm font-black text-white/50 border border-white/5">
                            {review.avatar}
                          </div>
                          <div>
                            <span className="font-bold text-sm block text-white">{'author' in review ? review.author : review.recipient}</span>
                            <span className="text-[10px] text-blue-400 uppercase tracking-widest font-bold mt-0.5 block">
                              {'repeat' in review && review.repeat ? "Repeat Client" : "Verified Client"}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1.5">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((s) => (
                              <Star key={s} size={12} className={s <= review.rating ? "text-yellow-500 fill-yellow-500" : "text-white/10"} />
                            ))}
                          </div>
                          <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{review.date}</span>
                        </div>
                      </div>
                      <p className="text-sm text-white/70 font-light leading-relaxed">"{review.comment}"</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* ABOUT & TRUST */}
            {activeTab === "about" && (
              <motion.div
                key="about"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-8 pb-10"
              >
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3 flex items-center gap-2"><User size={12} /> Biography</h3>
                  <p className="text-white/80 leading-relaxed font-light text-sm">
                    Passionate about building intuitive digital experiences that push boundaries. With over 8 years of experience in the design industry, I've worked with startups and Fortune 500 companies alike to deliver award-winning products. I specialize in bridging the gap between business goals and user needs.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3">Languages</h3>
                    <div className="flex flex-wrap gap-2">
                      <span className="text-[11px] font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-white">English (Native)</span>
                      <span className="text-[11px] font-bold bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl text-white">Spanish (Fluent)</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-[10px] uppercase tracking-widest font-bold text-white/30 mb-3">Links</h3>
                    <div className="flex flex-col gap-3">
                      <a href="#" className="text-xs font-bold flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                        <LinkIcon size={14} /> Personal Website
                      </a>
                      <a href="#" className="text-xs font-bold flex items-center gap-2 text-white/60 hover:text-white transition-colors">
                        <LinkIcon size={14} /> Instagram
                      </a>
                    </div>
                  </div>
                </div>

                {/* Safety & Report Layer */}
                {!isOwnerMode && (
                  <section className="mt-8 p-8 rounded-3xl bg-white/[0.02] border border-red-500/10 text-center relative overflow-hidden">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-red-500/5 to-transparent pointer-events-none" />
                    <div className="flex items-center justify-center gap-2 mb-4 opacity-50 text-white">
                      <ShieldCheck size={24} />
                    </div>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed mb-6 max-w-[250px] mx-auto">
                      Interacting with {hustler.creator.name} is covered by End-to-End Escrow Protection.
                    </p>
                    <button 
                      onClick={() => setShowReport(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:text-red-300 transition-colors text-xs font-bold uppercase tracking-widest"
                    >
                      <ShieldAlert size={14} />
                      Report Account
                    </button>
                  </section>
                )}
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>

      {/* Fixed Bottom CTA Bar (Public Viewer Only) */}
      {!isOwnerMode && (
        <div className="absolute bottom-0 left-0 right-0 p-4 z-50 bg-gradient-to-t from-[#050505] via-[#050505]/95 to-transparent pt-12 pb-8 safe-bottom border-t border-white/5 pointer-events-none">
          <div className="max-w-md mx-auto flex gap-3 h-14 pointer-events-auto px-2">
            <motion.button 
              whileTap={{ scale: 0.98 }}
              onClick={() => setShowBooking(true)}
              className="flex-1 bg-white text-black font-black uppercase tracking-widest text-xs rounded-2xl flex items-center justify-center gap-2 shadow-[0_0_30px_rgba(255,255,255,0.15)]"
            >
              <Calendar size={16} />
              Book Service
            </motion.button>
            <motion.button 
              whileTap={{ scale: 0.95 }}
              className="w-14 h-14 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-white shrink-0 hover:bg-white/10 transition-colors"
            >
              <MessageSquare size={20} />
            </motion.button>
          </div>
        </div>
      )}

      {/* Overlays */}
      <AnimatePresence>
        {showBooking && (
          <BookingFlow 
            hustler={hustler} 
            onClose={() => setShowBooking(false)} 
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReport && (
          <ReportSheet 
            entityName={hustler.creator.name} 
            onClose={() => setShowReport(false)} 
          />
        )}
      </AnimatePresence>

      {/* Public Schedule Drawer */}
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
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-x-0 bottom-0 z-[120] bg-[#0c0c0c] border-t border-white/10 rounded-t-[3rem] p-8 max-h-[80vh] overflow-y-auto no-scrollbar pb-safe"
            >
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-8" />
              
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Hustle Schedule</h2>
                  <p className="text-xs text-white/40 font-bold uppercase tracking-widest mt-1">When {hustler.creator.name} is online</p>
                </div>
                <button 
                  onClick={() => setShowSchedule(false)}
                  className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white border border-white/10"
                >
                  <Plus size={20} className="rotate-45" />
                </button>
              </div>

              <div className="space-y-4">
                {schedule.map((item) => (
                  <div key={item.day} className="flex items-center justify-between p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                    <div className="flex items-center gap-4">
                       <span className={`w-10 h-10 rounded-xl flex items-center justify-center text-[10px] font-black uppercase ${item.active ? 'bg-blue-500 text-white shadow-lg' : 'bg-white/5 text-white/20'}`}>
                         {item.day}
                       </span>
                       <span className={`text-[10px] font-black uppercase tracking-widest ${item.active ? 'text-white' : 'text-white/20'}`}>
                         {item.active ? 'Active' : 'Offline'}
                       </span>
                    </div>
                    {item.active && (
                       <div className="text-right">
                          <span className="text-sm font-black text-white uppercase">{item.start} - {item.end}</span>
                          <span className="text-[8px] text-white/20 uppercase tracking-widest block mt-0.5">Local Time</span>
                       </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-10 p-6 rounded-3xl bg-blue-500/10 border border-blue-500/20 text-center">
                 <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest leading-relaxed">
                   Bookings made outside these hours will be queued for review.
                 </p>
              </div>

              <button 
                onClick={() => setShowSchedule(false)}
                className="w-full py-5 mt-8 rounded-2xl bg-white text-black text-xs font-black uppercase tracking-widest"
              >
                Got it
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <ImageEditorModal 
        isOpen={imageEditorState.isOpen}
        onClose={() => setImageEditorState({ isOpen: false, type: null })}
        onSave={(imageUrl) => {
          if (imageEditorState.type === 'avatar') {
            setLocalAvatar(imageUrl);
          } else if (imageEditorState.type === 'cover') {
            setLocalCover(imageUrl);
          }
        }}
        title={imageEditorState.type === 'avatar' ? 'Edit Profile Picture' : 'Edit Cover Photo'}
      />
    </motion.div>
  );
}
