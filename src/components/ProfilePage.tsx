import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, Star, MapPin, CheckCircle2, MessageSquare, MoreHorizontal, Grid, 
  Briefcase, MessageCircle, Info, Calendar, ShieldCheck, ShieldAlert, Edit2, 
  ShoppingBag, BookOpen, Clock, Heart, Camera, Settings, X, Plus, Play, Link as LinkIcon,
  Check, AlertCircle, TrendingUp, CreditCard, User, History
} from "lucide-react";
import { useState, useRef, useEffect } from "react";
import BookingFlow from "./BookingFlow";
import ReportSheet from "./ReportSheet";

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
    { id: "products", label: "Shop", icon: <ShoppingBag size={14} /> },
    { id: "trainings", label: "Trainings", icon: <BookOpen size={14} /> },
    { id: "reviews", label: "Reviews", icon: <Star size={14} /> },
    ...(isOwnerMode ? [{ id: "jobs", label: "Jobs", icon: <History size={14} /> }] : []),
    { id: "about", label: "About", icon: <Info size={14} /> }
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
          <div className="w-full h-48 bg-gradient-to-br from-blue-900/40 to-purple-900/20 relative group">
            {isOwnerMode && (
              <button className="absolute top-4 right-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={16} />
              </button>
            )}
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
                src={hustler.creator.avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60"} 
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

        {/* Scrollable Sticky Tabs Architecture */}
        <div className="sticky top-0 z-50 bg-[#050505]/95 backdrop-blur-xl border-y border-white/5 mt-8 shadow-2xl">
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
                    layoutId="activeTabIndicator"
                    className="absolute bottom-0 left-0 right-0 h-[2px] bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                  />
                )}
              </button>
            ))}
          </nav>
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
                className="grid grid-cols-3 gap-1 md:gap-2"
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div key={i} className="aspect-[3/4] relative rounded-lg border border-white/5 overflow-hidden group cursor-pointer bg-white/5 text-white/20 flex flex-col items-center justify-center hover:bg-white/10 transition-colors">
                    {/* Placeholder for video/image thumbnail */}
                    {i % 3 === 0 ? <Play size={24} className="opacity-50" /> : <Camera size={24} className="opacity-50" />}
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Play size={10} className="text-white" />
                      <span className="text-[10px] text-white font-bold">{(i * 12.4).toFixed(1)}k</span>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* 9. MARKETPLACE ACCESS LAYER - Services */}
            {activeTab === "services" && (
              <motion.div
                key="services"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {[
                  { name: "Full Product Design Sprint", price: 499, time: "5-7 days", desc: "End-to-end design from wireframes to high fidelity." },
                  { name: "UI/UX Audit", price: 150, time: "2 days", desc: "Actionable tear-down of your current product." },
                  { name: "Brand Identity System", price: 850, time: "2 weeks", desc: "Logos, typography, color palettes, and guidelines." }
                ].map((item, i) => (
                  <div key={i} className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 flex flex-col gap-3 group hover:border-white/20 transition-all cursor-pointer shadow-sm">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="font-bold text-white text-lg">{item.name}</h3>
                        <p className="text-sm text-white/50 mt-1">{item.desc}</p>
                      </div>
                      <span className="bg-white/10 text-white px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shadow-sm border border-white/5">${item.price}</span>
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2 text-white/40 text-[10px] uppercase tracking-widest font-bold">
                        <Clock size={12} /> {item.time}
                      </div>
                      <button className="text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1 opacity-50 group-hover:opacity-100 transition-opacity translate-x-1 group-hover:translate-x-0">
                        Book Now <ChevronLeft size={14} className="rotate-180" />
                      </button>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}

            {/* 9. MARKETPLACE ACCESS LAYER - Products */}
            {activeTab === "products" && (
              <motion.div
                key="products"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="grid grid-cols-2 gap-4"
              >
                {[
                  { name: "Figma UI Kit 2026", price: "$49", type: "Digital" },
                  { name: "Creator Notion Template", price: "$29", type: "Digital" },
                  { name: "Premium Font: Hustle Sans", price: "$79", type: "Digital" },
                  { name: "1-on-1 Mentorship Call", price: "$99", type: "Consulting" }
                ].map((prod, i) => (
                  <div key={i} className="flex flex-col gap-3">
                    <div className="aspect-square bg-white/5 rounded-3xl border border-white/10 flex flex-col items-center justify-center p-4 relative group cursor-pointer overflow-hidden shadow-sm">
                       <ShoppingBag size={32} className="text-white/20 mb-2 transform group-hover:scale-110 transition-transform" />
                       <div className="absolute inset-0 bg-black/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                         <span className="bg-white text-black px-4 py-2 rounded-full text-xs font-bold shadow-lg">View Product</span>
                       </div>
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white line-clamp-1">{prod.name}</h3>
                      <div className="flex items-center justify-between mt-1">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-white/40">{prod.type}</span>
                        <span className="text-sm font-black text-white">{prod.price}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
            
            {/* 9. MARKETPLACE ACCESS LAYER - Trainings */}
            {activeTab === "trainings" && (
              <motion.div
                key="trainings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-4"
              >
                {[
                  { name: "Mastering Client Acquisition", format: "Video Course", duration: "2 Hours" },
                  { name: "Advanced UI Apprenticeship", format: "Live Coaching", duration: "4 Weeks" }
                ].map((training, i) => (
                  <div key={i} className="p-1 rounded-[26px] bg-gradient-to-r from-blue-500/20 to-purple-500/20 shadow-lg">
                     <div className="bg-[#0f0f0f] p-6 rounded-[24px] flex justify-between items-center group cursor-pointer transition-colors hover:bg-[#151515]">
                        <div>
                          <span className="text-[10px] text-purple-400 font-bold uppercase tracking-widest">{training.format} • {training.duration}</span>
                          <h3 className="font-bold text-white text-lg mt-1">{training.name}</h3>
                        </div>
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/20 group-hover:scale-105 transition-all">
                           <Play size={18} className="text-white ml-1" />
                        </div>
                     </div>
                  </div>
                ))}
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

            {/* 2. JOBS / BOOKINGS MANAGEMENT SECTION (Owner Only) */}
            {activeTab === "jobs" && isOwnerMode && (
              <motion.div
                key="jobs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex flex-col gap-6"
              >
                {/* Management Tabs */}
                <div className="flex overflow-x-auto no-scrollbar gap-2 pb-2">
                  {['Active (2)', 'Pending (5)', 'Completed (142)', 'Cancelled'].map((t, i) => (
                    <button key={i} className={`px-5 py-2.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${i === 0 ? 'bg-white text-black shadow-lg' : 'bg-white/10 border border-white/5 text-white hover:bg-white/20'}`}>
                      {t}
                    </button>
                  ))}
                </div>

                <div className="flex flex-col gap-4">
                  {[
                    { id: "J-092", client: "Elena R.", service: "Brand Identity System", amount: "$850", due: "In 3 Days", status: "In Progress", progress: 65 },
                    { id: "J-091", client: "David M.", service: "UI/UX Audit", amount: "$150", due: "Tomorrow", status: "Waiting on Client", progress: 90 }
                  ].map((job, i) => (
                    <div key={i} className="p-6 rounded-3xl bg-[#111] border border-white/10 flex flex-col gap-5 shadow-xl">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded uppercase tracking-widest font-bold border border-blue-500/20">
                              {job.status}
                            </span>
                            <span className="text-[10px] text-white/30 uppercase tracking-widest font-bold">ID: {job.id}</span>
                          </div>
                          <h3 className="font-bold text-white text-base">{job.service}</h3>
                          <p className="text-xs font-bold text-white/50 mt-1 uppercase tracking-widest">Client: {job.client}</p>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-xl text-green-400 block tracking-tight">{job.amount}</span>
                          <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold mt-1 block">Due: {job.due}</span>
                        </div>
                      </div>
                      
                      {/* Job Progress */}
                      <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/5">
                        <div className="bg-white h-full rounded-full animate-pulse" style={{ width: `${job.progress}%` }} />
                      </div>
                      
                      <div className="flex justify-end gap-3 mt-1">
                        <button className="px-5 py-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-bold transition-colors">
                          Message
                        </button>
                        <button className="px-5 py-2.5 rounded-xl bg-white text-black text-xs font-bold transition-colors hover:bg-white/90 shadow-md">
                          Update Progress
                        </button>
                      </div>
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

    </motion.div>
  );
}
