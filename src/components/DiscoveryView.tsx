import { motion, AnimatePresence } from "motion/react";
import { Search, MapPin, Star, ChevronRight, TrendingUp, Clock, History, X, ShieldCheck, Sparkles, BrainCircuit } from "lucide-react";
import { useState, useEffect } from "react";

interface DiscoveryViewProps {
  onProfileSelect: (hustler: any) => void;
  onOpenTrustCenter: () => void;
}

const CATEGORIES = [
  { id: 1, name: "Barbers", icon: "✂️", color: "from-blue-500/20" },
  { id: 2, name: "Designers", icon: "🎨", color: "from-purple-500/20" },
  { id: 3, name: "Tailors", icon: "🧵", color: "from-orange-500/20" },
  { id: 4, name: "Makeup", icon: "💄", color: "from-pink-500/20" },
  { id: 5, name: "Devs", icon: "💻", color: "from-emerald-500/20" },
  { id: 6, name: "Photo", icon: "📸", color: "from-indigo-500/20" },
];

const RECOMMENDATIONS = [
  {
    id: "rec1",
    name: "Marcus V.",
    category: "UI Specialist",
    reason: "Because you liked 'Digital Art'",
    rating: 4.9,
    jobs: 88,
    avatar: "M"
  },
  {
    id: "rec2",
    name: "Ayo B.",
    category: "Native Tailor",
    reason: "Popular near your location",
    rating: 5.0,
    jobs: 124,
    avatar: "A"
  }
];

const TRENDING = [
  { 
    id: 1, 
    creator: { 
      id: 1, 
      name: "Ayo B.", 
      category: "Native Tailor", 
      rating: 4.9, 
      location: "0.5km away", 
      avatar: "",
      jobs: 156,
      verified: true,
      active: true,
    },
    content: { type: "image", thumbnail: "", caption: "Custom fit for the weekend." }
  },
  { 
    id: 2, 
    creator: { 
      id: 2, 
      name: "Chioma Z.", 
      category: "Braids Expert", 
      rating: 5.0, 
      location: "1.2km away", 
      avatar: "",
      jobs: 342,
      verified: true,
      active: false,
    },
    content: { type: "image", thumbnail: "", caption: "New style drop." }
  },
];

export default function DiscoveryView({ onProfileSelect, onOpenTrustCenter }: DiscoveryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [momentGreeting, setMomentGreeting] = useState("Good Vibes");

  useEffect(() => {
     const hour = new Date().getHours();
     if (hour < 12) setMomentGreeting("Morning Grind");
     else if (hour < 18) setMomentGreeting("Afternoon Hustle");
     else setMomentGreeting("Evening Vibe");
  }, []);

  return (
    <div className="min-h-screen bg-transparent text-white p-6 pb-24 overflow-y-auto no-scrollbar relative" id="discovery-view">
      <div className="grain-overlay pointer-events-none" />

      {/* Search Header */}
      <header className="pt-4 mb-8">
        <div className="flex flex-col gap-1 mb-6">
           <div className="flex items-center gap-2">
              <Sparkles size={14} className="text-blue-400 animate-pulse" />
              <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">{momentGreeting}</h2>
           </div>
           <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest italic">Personalized for you</p>
        </div>

        <div className="relative group">
           <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none text-white/20 group-focus-within:text-white/60 transition-colors">
              <Search size={18} />
           </div>
           <input 
             type="text"
             value={searchQuery}
             onChange={(e) => {
                setSearchQuery(e.target.value);
                setIsSearching(e.target.value.length > 0);
             }}
             onFocus={() => setIsSearching(searchQuery.length > 0)}
             placeholder="Find people who can help..."
             className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl pl-12 pr-12 text-sm font-light outline-none focus:border-white/30 focus:bg-white/5 transition-all"
           />
           {searchQuery && (
              <button 
                onClick={() => {
                   setSearchQuery("");
                   setIsSearching(false);
                }}
                className="absolute inset-y-0 right-4 flex items-center text-white/20 hover:text-white"
              >
                 <X size={16} />
              </button>
           )}
        </div>
      </header>

      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div
            key="default-discovery"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Intelligence Header */}
            <section className="mb-6">
               <div className="p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                     <BrainCircuit size={20} />
                  </div>
                  <div>
                     <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Adaptive Discovery Active</h4>
                     <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">Optimizing for nearby {momentGreeting === "Morning Grind" ? "productivity" : "creative vibes"}</p>
                  </div>
               </div>
            </section>

            {/* Categories Grid */}
            <section className="mb-10">
               <div className="flex justify-between items-end mb-4 px-1">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Categories</h4>
                  <span className="text-[9px] font-bold text-white/10 uppercase tracking-widest">View All</span>
               </div>
               <div className="grid grid-cols-3 gap-3">
                  {CATEGORIES.map((cat) => (
                     <button
                        key={cat.id}
                        className={`aspect-square rounded-2xl bg-gradient-to-br ${cat.color} to-transparent border border-white/5 flex flex-col items-center justify-center gap-2 hover:bg-white/5 transition-all group active:scale-[0.98] relative overflow-hidden`}
                     >
                        {cat.id === 3 && (
                           <div className="absolute top-2 right-2 flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-white/10 border border-white/10">
                              <Star size={8} className="text-yellow-500 fill-yellow-500" />
                              <span className="text-[6px] font-black uppercase tracking-tighter text-white/40">Loyal</span>
                           </div>
                        )}
                        <span className="text-2xl group-hover:scale-110 transition-transform">{cat.icon}</span>
                        <span className="text-[9px] font-black uppercase tracking-widest text-white/40 group-hover:text-white/80">{cat.name}</span>
                     </button>
                  ))}
               </div>
            </section>

            {/* Personalized Suggestions */}
            <section className="mb-10">
               <div className="flex items-center gap-2 mb-4 px-1">
                  <BrainCircuit size={14} className="text-blue-400/60" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">People you may need</h4>
               </div>
               <div className="flex gap-4 overflow-x-auto no-scrollbar pb-2">
                  {RECOMMENDATIONS.map((rec) => (
                     <motion.div 
                        key={rec.id}
                        whileTap={{ scale: 0.98 }}
                        className="w-64 shrink-0 p-5 rounded-[32px] bg-white/[0.03] border border-white/10 flex flex-col gap-4 group hover:bg-white/[0.05] transition-all cursor-pointer"
                     >
                        <div className="flex justify-between items-start">
                           <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center text-xl font-bold bg-white/5">
                              {rec.avatar}
                           </div>
                           <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-white/5 border border-white/5">
                              <Star size={10} className="text-yellow-500 fill-yellow-500" />
                              <span className="text-[10px] font-black">{rec.rating}</span>
                           </div>
                        </div>
                        <div>
                           <h5 className="font-bold text-sm tracking-tight">{rec.name}</h5>
                           <p className="text-[10px] text-blue-400/60 font-black uppercase tracking-widest">{rec.category}</p>
                        </div>
                        <div className="flex items-center gap-2 mt-auto pt-4 border-t border-white/5">
                           <div className="w-1 h-1 rounded-full bg-blue-500 animate-pulse" />
                           <span className="text-[8px] text-white/30 font-black uppercase tracking-[0.2em] leading-none">
                              {rec.reason}
                           </span>
                        </div>
                     </motion.div>
                  ))}
               </div>
            </section>

            {/* Trending Nearby */}
            <section className="mb-10">
               <div className="flex items-center gap-2 mb-4 px-1">
                  <TrendingUp size={14} className="text-blue-400" />
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Trending Locally</h4>
               </div>
               <div className="flex flex-col gap-3">
                  {TRENDING.map((hustler) => (
                     <div 
                        key={hustler.id}
                        onClick={() => onProfileSelect(hustler)}
                        className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center gap-4 hover:bg-white/[0.06] transition-all cursor-pointer group"
                     >
                        <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 overflow-hidden shrink-0">
                           {/* Placeholder for real image */}
                           <div className="w-full h-full flex items-center justify-center text-xl font-display font-black text-white/10">
                              {hustler.creator.name[0]}
                           </div>
                        </div>
                        <div className="flex-1">
                           <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2">
                                 <h5 className="font-bold text-sm tracking-tight">{hustler.creator.name}</h5>
                                 {hustler.id === 2 && (
                                    <span className="px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 text-[8px] font-black uppercase tracking-tighter border border-purple-500/10">
                                       New Discovery
                                    </span>
                                 )}
                              </div>
                              <div className="flex items-center gap-1">
                                 <Star size={10} className="text-yellow-500 fill-yellow-500" />
                                 <span className="text-[10px] font-black">{hustler.creator.rating}</span>
                              </div>
                           </div>
                           <p className="text-[9px] text-blue-400/60 font-black uppercase tracking-widest mt-0.5">{hustler.creator.category}</p>
                           <div className="flex items-center gap-1 mt-1 text-[9px] text-white/20 font-bold uppercase tracking-wide">
                              <MapPin size={8} />
                              {hustler.creator.location}
                           </div>
                        </div>
                        <ChevronRight size={16} className="text-white/10 group-hover:text-white transition-colors" />
                     </div>
                  ))}
               </div>
            </section>

            {/* Recent History Prompt */}
            <section 
               onClick={onOpenTrustCenter}
               className="mt-12 p-8 rounded-[32px] bg-white/[0.02] border border-white/5 text-center group cursor-pointer hover:border-blue-500/20 transition-all"
            >
               <ShieldCheck size={24} className="mx-auto text-blue-400/40 mb-4 group-hover:scale-110 transition-transform" />
               <h4 className="text-sm font-display font-black tracking-widest uppercase text-white/40 mb-2">Hustle Trust Protocol</h4>
               <p className="text-white/20 text-[10px] font-light leading-relaxed max-w-[200px] mx-auto uppercase tracking-wide">
                  Every interaction is secured. Tap to learn how we keep our local economy safe.
               </p>
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
               {/* Search Intent Adaptation Pill */}
               <div className="flex gap-2 overflow-x-auto no-scrollbar py-1">
                  {["Nearby", "Top Rated", "Available", "Verified Only"].map((tag) => (
                     <button key={tag} className="px-4 py-2 rounded-full bg-white/[0.03] border border-white/10 text-[9px] font-black uppercase tracking-widest whitespace-nowrap active:bg-white/10 transition-colors">
                        {tag}
                     </button>
                  ))}
               </div>
               
               <div className="flex justify-between items-center px-1 mt-2">
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Matches for "{searchQuery}"</h4>
                  <div className="flex items-center gap-2">
                     <Clock size={12} className="text-white/20" />
                     <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest">Available Now</span>
                  </div>
               </div>
            </div>

            {/* Mock Search Results */}
            {[1, 2, 3].map((i) => (
               <div 
                  key={i}
                  className="p-5 rounded-3xl bg-white/[0.04] border border-white/10 flex flex-col gap-4 group cursor-pointer hover:border-white/20 transition-all relative overflow-hidden"
               >
                  {i === 1 && (
                     <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-transparent opacity-40" />
                  )}

                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black">
                           {i === 1 ? 'K' : i === 2 ? 'L' : 'M'}
                        </div>
                        <div>
                           <div className="flex items-center gap-2">
                              <h5 className="font-bold text-md">Hustler Name {i}</h5>
                              {i === 1 && (
                                 <span className="px-1.5 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[8px] font-black uppercase tracking-tighter border border-blue-500/10">
                                    Top Choice
                                 </span>
                              )}
                           </div>
                           <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold font-display">Specialist • 1.4km</p>
                        </div>
                     </div>
                     <div className="px-2 py-1 bg-white/5 border border-white/5 rounded-full flex items-center gap-1">
                        <Star size={10} className="text-yellow-500 fill-yellow-500" />
                        <span className="text-[10px] font-black text-white/80">4.8</span>
                     </div>
                  </div>
                  
                  {/* Intelligence Explanation Layer - Subtle */}
                  {i === 1 && (
                     <div className="flex items-center gap-2 px-1">
                        <BrainCircuit size={10} className="text-blue-500/40" />
                        <span className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Recommended based on your search for 'Tailoring'</span>
                     </div>
                  )}

                  {/* Content Preview Strip */}
                  <div className="grid grid-cols-3 gap-2">
                     {[1, 2, 3].map(j => (
                        <div key={j} className="aspect-square rounded-xl bg-white/5 border border-white/5 overflow-hidden">
                           <div className={`w-full h-full opacity-10 bg-gradient-to-br ${i % 2 === 0 ? 'from-blue-500' : 'from-purple-500'} to-transparent`} />
                        </div>
                     ))}
                  </div>

                  <div className="flex justify-between items-center mt-1">
                     <div className="flex -space-x-2">
                        {[1, 2, 3].map(k => (
                           <div key={k} className="w-6 h-6 rounded-full border-2 border-[#1a1a1a] bg-white/10" />
                        ))}
                        <span className="text-[8px] text-white/20 font-bold flex items-center ml-4 uppercase tracking-tighter">12 Mutual connections</span>
                     </div>
                     <button className="px-4 py-2 bg-white text-black text-[9px] font-black uppercase tracking-widest rounded-lg active:scale-95 transition-transform">View</button>
                  </div>
               </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
