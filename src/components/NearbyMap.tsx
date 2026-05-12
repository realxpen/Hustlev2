import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  MapPin, SlidersHorizontal, Search, ShieldCheck, Zap, X, 
  ChevronRight, Navigation, Compass, Flame, Play, Clock, User, CheckCircle2, Eye, Map as MapIcon, Grid, Bookmark, Car
} from 'lucide-react';

interface NearbyMapProps {
  onProfileSelect: (hustler: any) => void;
  onClose: () => void;
}

const MOCK_MAP_HUSTLERS = [
  {
    id: 1,
    name: "Marcus V.",
    avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?q=80&w=2574&auto=format&fit=crop",
    category: "UI/UX Specialist",
    status: "available", // available, busy, live
    x: 40,
    y: 30,
    distance: "0.2 mi",
    rating: 4.9,
    isLive: false,
    verified: true,
  },
  {
    id: 2,
    name: "Elena S.",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?q=80&w=2670&auto=format&fit=crop",
    category: "Streetwear Tailor",
    status: "live",
    liveDetails: {
      viewers: 342,
      title: "Upcycling vintage military gear"
    },
    x: 65,
    y: 45,
    distance: "0.8 mi",
    rating: 5.0,
    isLive: true,
    verified: true,
  },
  {
    id: 3,
    name: "Jordan K.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=2574&auto=format&fit=crop",
    category: "Motion Director",
    status: "busy",
    x: 20,
    y: 60,
    distance: "1.2 mi",
    rating: 4.8,
    isLive: false,
    verified: true,
  },
  {
    id: 4,
    name: "Sarah M.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=2574&auto=format&fit=crop",
    category: "Mobile Barber",
    status: "mobile",
    x: 80,
    y: 75,
    distance: "2.4 mi",
    rating: 4.7,
    isLive: false,
    verified: true,
  },
  {
    id: 5,
    name: "David D.",
    avatar: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?q=80&w=2574&auto=format&fit=crop",
    category: "Street Photographer",
    status: "available",
    x: 30,
    y: 80,
    distance: "1.5 mi",
    rating: 4.9,
    isLive: false,
    verified: false,
  }
];

const FILTERS = ["All", "Available Now", "Live Streams", "Services", "Products", "Training"];

export default function NearbyMap({ onProfileSelect, onClose }: NearbyMapProps) {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedPin, setSelectedPin] = useState<any>(null);
  const [viewMode, setViewMode] = useState<"map" | "feed">("map");
  const [myStatus, setMyStatus] = useState<"invisible" | "available">("available");
  
  const mapContainerRef = useRef<HTMLDivElement>(null);

  const getStatusColor = (status: string, isLive: boolean) => {
    if (isLive) return "bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.8)]";
    if (status === "available") return "bg-green-500 shadow-[0_0_15px_rgba(34,197,94,0.6)]";
    if (status === "mobile") return "bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]";
    return "bg-gray-500 shadow-[0_0_15px_rgba(107,114,128,0.6)]";
  };

  const getFilteredHustlers = () => {
    return MOCK_MAP_HUSTLERS.filter(h => {
      if (activeFilter === "All") return true;
      if (activeFilter === "Available Now" && h.status === "available") return true;
      if (activeFilter === "Live Streams" && h.isLive) return true;
      return true; // Mock filtering
    });
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black text-white overflow-hidden flex flex-col font-sans">
      {/* Map Background Layer */}
      <div className="absolute inset-0 z-0 bg-[#0a0a0a] overflow-hidden">
         {/* Abstract map pattern */}
         <div className="absolute inset-0 opacity-[0.03]" 
              style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black" />
         
         {/* Simulated Heatmap glow (Advanced Feature Placeholder) */}
         <div className="absolute top-[40%] left-[30%] w-96 h-96 bg-blue-600/10 blur-[100px] rounded-full pointer-events-none" />
         <div className="absolute top-[60%] right-[20%] w-64 h-64 bg-orange-500/10 blur-[80px] rounded-full pointer-events-none" />
      </div>

      {viewMode === "map" ? (
        <motion.div 
          ref={mapContainerRef}
          className="absolute inset-0 z-10 cursor-grab active:cursor-grabbing"
          drag
          dragConstraints={{ top: -500, left: -500, right: 500, bottom: 500 }}
          dragElastic={0.1}
          dragMomentum={false}
          initial={{ scale: 1.2 }}
          animate={{ scale: 1 }}
          transition={{ duration: 1, ease: "easeOut" }}
        >
          {/* User's own location indicator (Center) */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center">
             <div className="relative">
                <div className={`absolute -inset-8 rounded-full border border-white/10 animate-ping opacity-20`} style={{ animationDuration: '3s' }} />
                <div className={`absolute -inset-16 rounded-full border border-white/5 animate-ping opacity-10`} style={{ animationDuration: '3s', animationDelay: '1s' }} />
                <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center border-2 border-black shadow-[0_0_20px_rgba(37,99,235,0.6)] z-10 relative">
                   <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                </div>
                {myStatus === "invisible" && (
                  <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-gray-800 border-2 border-black flex items-center justify-center">
                    <Eye size={8} className="text-white/40" />
                  </div>
                )}
             </div>
             <div className="mt-2 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/60">
                 You
             </div>
          </div>

          {/* Active Hustler Markers */}
          {getFilteredHustlers().map(hustler => (
            <div 
              key={hustler.id}
              className="absolute z-30 flex flex-col items-center group transition-transform hover:scale-110 hover:z-40"
              style={{ top: `${hustler.y}%`, left: `${hustler.x}%` }}
            >
               {/* Pulse for live streams */}
               {hustler.isLive && (
                 <div className="absolute -inset-4 rounded-full border border-red-500/50 animate-ping" />
               )}
               
               {/* Floating Preview Card on Hover */}
               <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-300 w-48 bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-3 shadow-2xl flex flex-col gap-2 scale-95 group-hover:scale-100 origin-bottom">
                  <div className="flex items-center gap-2">
                     <span className="text-xs font-black truncate">{hustler.name}</span>
                     {hustler.verified && <CheckCircle2 size={12} className="text-blue-500" />}
                  </div>
                  <div className="text-[10px] text-white/50">{hustler.category} • {hustler.rating}★</div>
                  {hustler.isLive && hustler.liveDetails ? (
                    <div className="bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded w-fit flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" /> LIVE NOW • {hustler.liveDetails.viewers}
                    </div>
                  ) : (
                    <div className="bg-white/5 text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded w-fit text-white/60">
                      {hustler.status}
                    </div>
                  )}
               </div>

               {/* Avatar Pin */}
               <button 
                 onClick={(e) => { e.stopPropagation(); setSelectedPin(hustler); }}
                 className="relative"
               >
                  <img src={hustler.avatar} className="w-12 h-12 rounded-full border-[3px] border-black object-cover shadow-2xl" alt={hustler.name} />
                  <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-[3px] border-black ${getStatusColor(hustler.status, hustler.isLive)}`} />
               </button>
            </div>
          ))}
          
          {/* Temporary Pop-up/Event Placeholder */}
          <div className="absolute top-[20%] left-[80%] z-20 flex flex-col items-center opacity-70">
             <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center border-2 border-black shadow-[0_0_20px_rgba(249,115,22,0.4)] animate-bounce">
                <Flame size={16} className="text-white" />
             </div>
             <div className="mt-2 bg-black/60 backdrop-blur-md px-2 py-1 rounded border border-white/10 text-[8px] font-black uppercase text-orange-400">Pop-up shop</div>
          </div>
        </motion.div>
      ) : (
        /* HYBRID FEED MODE */
        <div className="absolute inset-0 z-10 pt-48 px-6 pb-24 overflow-y-auto bg-black/90 backdrop-blur-3xl">
           <div className="flex flex-col gap-4">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 mb-2">Nearby Activity ({getFilteredHustlers().length})</h3>
              {getFilteredHustlers().map((hustler, idx) => (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  key={`feed-${hustler.id}`} 
                  className="p-5 rounded-[2rem] bg-white/5 border border-white/10 flex flex-col gap-4"
                >
                   <div className="flex items-start justify-between">
                      <div className="flex items-center gap-4">
                         <img src={hustler.avatar} className="w-14 h-14 rounded-full object-cover border border-white/20" />
                         <div>
                            <div className="flex items-center gap-1">
                               <h4 className="font-black text-lg leading-none">{hustler.name}</h4>
                               {hustler.verified && <CheckCircle2 size={14} className="text-blue-500" />}
                            </div>
                            <p className="text-xs text-white/50">{hustler.category}</p>
                            <div className="flex items-center gap-2 mt-2">
                               <div className="flex items-center gap-1 text-[10px] text-yellow-500 font-bold">
                                  ★ {hustler.rating}
                               </div>
                               <span className="text-[10px] text-white/30">•</span>
                               <div className="flex items-center gap-1 text-[10px] text-white/50">
                                  <Navigation size={10} /> {hustler.distance}
                               </div>
                            </div>
                         </div>
                      </div>
                      {hustler.isLive && (
                        <div className="px-2 py-1 rounded border border-red-500/30 bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest flex items-center gap-1">
                           <div className="w-1.5 h-1.5 bg-red-500 rounded-full animate-pulse" /> Live
                        </div>
                      )}
                   </div>
                   <button 
                     onClick={() => onProfileSelect(hustler)}
                     className="w-full h-12 rounded-xl bg-white/10 flex items-center justify-center text-xs font-black uppercase tracking-widest hover:bg-white text-white hover:text-black transition-colors"
                   >
                     View Profile
                   </button>
                </motion.div>
              ))}
           </div>
        </div>
      )}

      {/* Top UI OVERLAY - Filters & Status */}
      <div className="absolute top-0 left-0 right-0 z-50 pointer-events-none">
         <div className="bg-gradient-to-b from-black/80 via-black/40 to-transparent pt-12 pb-8 px-6 flex flex-col gap-6">
            
            {/* Header & Controls */}
            <div className="flex items-center justify-between pointer-events-auto">
               <button onClick={onClose} className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                 <X size={18} />
               </button>
               
               <div className="flex items-center bg-black/60 backdrop-blur-md border border-white/10 rounded-full p-1 relative">
                  <div className={`absolute inset-y-1 w-[calc(50%-4px)] bg-white/10 rounded-full shadow-lg transition-transform duration-300 ${viewMode === 'feed' ? 'translate-x-[calc(100%+0px)]' : 'translate-x-0'}`} />
                  <button onClick={() => setViewMode('map')} className={`relative z-10 w-24 h-8 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${viewMode === 'map' ? 'text-white' : 'text-white/40'}`}>
                    <MapIcon size={12} /> Map
                  </button>
                  <button onClick={() => setViewMode('feed')} className={`relative z-10 w-24 h-8 flex items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-colors ${viewMode === 'feed' ? 'text-white' : 'text-white/40'}`}>
                    <Grid size={12} /> Feed
                  </button>
               </div>

               <button className="w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors">
                 <Search size={18} />
               </button>
            </div>

            {/* Floating Filters Scroll */}
            <div className="flex overflow-x-auto no-scrollbar gap-2 pointer-events-auto -mx-6 px-6">
               <button className="h-8 px-3 rounded-full bg-black/60 backdrop-blur-md border border-white/10 flex items-center justify-center shrink-0">
                  <SlidersHorizontal size={12} className="text-white/60" />
               </button>
               {FILTERS.map(f => (
                 <button 
                   key={f}
                   onClick={() => setActiveFilter(f)}
                   className={`h-8 px-4 rounded-full border text-[10px] font-black uppercase tracking-widest shrink-0 transition-colors ${
                     activeFilter === f 
                       ? 'bg-white text-black border-white' 
                       : 'bg-black/60 backdrop-blur-md border-white/10 text-white/60 hover:text-white'
                   }`}
                 >
                   {f}
                 </button>
               ))}
            </div>
         </div>
      </div>

      {/* Bottom UI OVERLAY - Tools & Quick Actions */}
      <div className="absolute bottom-0 left-0 right-0 z-50 pointer-events-none pb-8 pt-24 px-6 bg-gradient-to-t from-black via-black/60 to-transparent">
         {/* Live Streams Preview Banner - if in Map mode */}
         <AnimatePresence>
           {viewMode === 'map' && activeFilter !== "Live Streams" && (
             <motion.div 
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="pointer-events-auto w-full bg-red-500/10 backdrop-blur-xl border border-red-500/20 rounded-2xl p-3 mb-4 flex items-center justify-between"
             >
                <div className="flex items-center gap-3">
                   <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center">
                      <Play size={12} className="text-red-500 ml-1" />
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest text-red-400">Live Nearby</p>
                     <p className="text-xs text-white/80 line-clamp-1">3 hustlers streaming right now</p>
                   </div>
                </div>
                <button 
                  onClick={() => setActiveFilter("Live Streams")}
                  className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-[9px] font-black uppercase"
                >
                   Watch
                </button>
             </motion.div>
           )}
         </AnimatePresence>

         <div className="flex justify-between items-end pointer-events-auto">
            {/* Safety/Privacy Toggle */}
            <div className="flex flex-col gap-2">
               <button 
                 onClick={() => setMyStatus(prev => prev === "available" ? "invisible" : "available")}
                 className={`w-12 h-12 rounded-full flex items-center justify-center shadow-2xl transition-colors border ${
                   myStatus === 'available' 
                     ? 'bg-blue-600 border-blue-400 text-white' 
                     : 'bg-gray-800 border-gray-600 text-gray-400'
                 }`}
               >
                  {myStatus === 'available' ? <ShieldCheck size={20} /> : <Eye size={20} className="opacity-50" />}
               </button>
               <div className="text-[9px] font-black uppercase tracking-widest text-white/40 text-center w-12">
                 {myStatus === 'available' ? 'Visible' : 'Hidden'}
               </div>
            </div>

            {/* Recenter Button */}
            <button className="w-12 h-12 rounded-full bg-white text-black flex items-center justify-center shadow-2xl hover:scale-105 active:scale-95 transition-transform">
               <Navigation size={20} className="ml-[-2px] mt-[-2px]" />
            </button>
         </div>
      </div>

      {/* QUICK PREVIEW CARD OVERLAY */}
      <AnimatePresence>
        {selectedPin && (
          <motion.div 
            initial={{ opacity: 0, y: 100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 100, transition: { duration: 0.2 } }}
            className="absolute bottom-0 left-0 right-0 z-[200] p-4 bg-black/40 backdrop-blur-md"
            onClick={(e) => {
              if (e.target === e.currentTarget) setSelectedPin(null);
            }}
          >
             <div className="w-full bg-[#0c0c0c] border border-white/10 rounded-[2.5rem] p-6 shadow-[0_-20px_50px_rgba(0,0,0,0.8)] relative overflow-hidden" onClick={e => e.stopPropagation()}>
                {/* Close handle */}
                <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mb-6 cursor-pointer" onClick={() => setSelectedPin(null)} />
                
                <div className="flex gap-5">
                   <div className="relative shrink-0">
                      <img src={selectedPin.avatar} className="w-20 h-20 rounded-2xl object-cover border border-white/10" alt={selectedPin.name} />
                      {selectedPin.isLive ? (
                        <div className="absolute -bottom-2 -right-2 bg-red-500 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-lg border border-red-400">LIVE</div>
                      ) : (
                        <div className={`absolute -bottom-2 -right-2 text-white text-[8px] font-black uppercase tracking-widest px-2 py-0.5 rounded shadow-lg border border-white/20 ${getStatusColor(selectedPin.status, false)}`}>
                          {selectedPin.status}
                        </div>
                      )}
                   </div>
                   
                   <div className="flex-1 flex flex-col justify-center">
                     <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-xl font-black">{selectedPin.name}</h3>
                        {selectedPin.verified && <CheckCircle2 size={16} className="text-blue-500" />}
                     </div>
                     <p className="text-sm text-white/50 mb-2">{selectedPin.category}</p>
                     
                     <div className="flex items-center gap-3 mt-auto">
                        <div className="flex items-center gap-1 text-xs text-yellow-500 font-bold">
                           <Star size={12} className="fill-yellow-500 text-yellow-500" /> {selectedPin.rating}
                        </div>
                        <div className="w-1 h-1 bg-white/20 rounded-full" />
                        <div className="flex items-center gap-1 text-xs text-white/60">
                           <Navigation size={10} /> {selectedPin.distance}
                        </div>
                        {selectedPin.status === 'mobile' && (
                          <>
                            <div className="w-1 h-1 bg-white/20 rounded-full" />
                            <div className="flex items-center gap-1 text-xs text-blue-400">
                               <Car size={10} /> En route
                            </div>
                          </>
                        )}
                     </div>
                   </div>
                </div>

                <div className="mt-6 flex gap-3">
                   {selectedPin.isLive ? (
                     <button 
                       className="flex-1 h-12 bg-red-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:bg-red-400 transition-colors"
                       onClick={() => {/* Join Live */}}
                     >
                       <Play size={14} className="fill-white" /> Join Stream
                     </button>
                   ) : (
                     <button 
                       className="flex-1 h-12 bg-white text-black rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-xl hover:bg-gray-200 transition-colors"
                     >
                       {selectedPin.status === 'available' ? 'Book Now' : 'Request Service'}
                     </button>
                   )}
                   <button 
                     onClick={() => onProfileSelect(selectedPin)}
                     className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
                   >
                     <User size={18} className="text-white/80" />
                   </button>
                </div>

                {/* Subtle routing background fx */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
