import { motion, AnimatePresence } from "motion/react";
import { X, Star, MapPin, CheckCircle2, Clock, Zap, ShieldCheck, Play, Box, TrendingUp, BarChart2, Share, FileText, ChevronRight } from "lucide-react";
import { useState } from "react";

interface ServiceDetailModalProps {
  listing?: any; // The service object
  isOwner?: boolean;
  onClose: () => void;
  onBook?: (listing: any) => void;
}

export default function ServiceDetailModal({ listing, isOwner = false, onClose, onBook }: ServiceDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"details" | "portfolio" | "analytics">("details");

  if (!listing) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black/80 backdrop-blur-md flex flex-col justify-end"
    >
      <div className="flex-1 w-full" onClick={onClose} />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="w-full bg-[#05060a] rounded-t-[2.5rem] border-t border-white/10 flex flex-col max-h-[90vh] overflow-hidden"
      >
        <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto mt-4 shrink-0" />

        <div className="flex-1 overflow-y-auto no-scrollbar pb-32">
          {/* Header Image Room */}
          <div className="w-full aspect-[16/9] bg-[#0c0c0c] relative flex items-center justify-center -mt-6 rounded-b-[2.5rem] border-b border-white/5 shadow-2xl mb-6">
             <Box size={48} className="text-white/10" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#05060a] to-transparent z-10" />
             <div className="absolute top-8 right-6 z-20 flex gap-2">
                <button className="w-10 h-10 rounded-full bg-black/50 backdrop-blur-md flex items-center justify-center text-white/60 hover:text-white border border-white/10">
                   <Share size={18} />
                </button>
             </div>
             {listing.popular && (
               <div className="absolute bottom-6 left-6 z-20 bg-blue-500 text-white px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-[0.2em] shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                 Best Seller
               </div>
             )}
          </div>

          <div className="px-6 flex flex-col gap-6">
             {/* Title & Core Details */}
             <div>
               <h1 className="text-3xl font-display font-black tracking-tighter leading-tight mb-4 text-white">
                 {listing.name || listing.title || "Premium Service"}
               </h1>
               
               <div className="flex items-center gap-6">
                 <div>
                   <p className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Starting At</p>
                   <p className="text-3xl font-black text-white">${listing.price || 0}</p>
                 </div>
                 
                 <div className="w-px h-10 bg-white/10" />
                 
                 <div className="flex flex-col gap-2">
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                     <Clock size={12} className="text-blue-400" />
                     {listing.time || "1-3 Days"} Delivery
                   </div>
                   <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/60">
                     <Star size={12} className="text-yellow-500 fill-yellow-500" />
                     4.9 (124 reviews)
                   </div>
                 </div>
               </div>
             </div>

             {/* Profile Minimal Embed */}
             {!isOwner && (
               <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-full bg-white/10 overflow-hidden relative">
                       <div className="absolute inset-x-0 bottom-0 h-1/3 bg-black/50 backdrop-blur-sm z-10 flex items-center justify-center">
                         <span className="text-[6px] font-black text-white uppercase tracking-widest">Verified</span>
                       </div>
                       <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=60" className="w-full h-full object-cover" alt="Hustler" />
                     </div>
                     <div>
                       <h3 className="font-black text-white uppercase tracking-tight text-sm">Visual Artist</h3>
                       <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Los Angeles • Top Rated</p>
                     </div>
                  </div>
                  <ChevronRight size={20} className="text-white/20" />
               </div>
             )}

             {/* Internal Navigation */}
             <div className="flex gap-6 border-b border-white/10 pb-4">
                {(["details", "portfolio", ...(isOwner ? ["analytics"] : [])] as const).map(tab => (
                   <button 
                     key={tab}
                     onClick={() => setActiveTab(tab)}
                     className={`text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab ? 'text-white' : 'text-white/30 hover:text-white/60'}`}
                   >
                     {tab}
                     {activeTab === tab && (
                       <motion.div layoutId="service-tab-indicator" className="h-0.5 w-full bg-white mt-1 absolute rounded-full" />
                     )}
                   </button>
                ))}
             </div>

             {/* Dynamic Tab Content */}
             <AnimatePresence mode="wait">
               
               {/* DETAILS TAB */}
               {activeTab === "details" && (
                 <motion.div
                   key="details"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="flex flex-col gap-6"
                 >
                   <div>
                     <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-2">Description</h3>
                     <p className="text-sm font-medium text-white/50 leading-loose">
                       {listing.desc || "A high quality service focused on delivering exactly what you need quickly and reliably."}
                     </p>
                   </div>
                   
                   <div>
                     <h3 className="text-sm font-black text-white uppercase tracking-tighter mb-4">What's Included</h3>
                     <div className="flex flex-col gap-3">
                       {(listing.features || ["1x Revision", "Source Files", "Commercial Use"]).map((f: string, fi: number) => (
                         <div key={fi} className="flex items-center gap-3 group">
                           <div className="w-6 h-6 rounded-lg bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shrink-0 group-hover:bg-blue-500/30 transition-colors">
                             <CheckCircle2 size={12} className="text-blue-400" />
                           </div>
                           <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{f}</span>
                         </div>
                       ))}
                     </div>
                   </div>

                   <motion.div 
                     whileHover={{ scale: 1.02 }}
                     className="p-5 rounded-2xl bg-[#080a10] border border-blue-500/20 shadow-[0_0_15px_rgba(59,130,246,0.1)]"
                   >
                     <h4 className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                       <ShieldCheck size={12} /> Escrow Protected
                     </h4>
                     <p className="text-xs text-white/40 font-medium leading-relaxed">
                       Your funds are held securely until the work is completed and approved by you.
                     </p>
                   </motion.div>
                 </motion.div>
               )}

               {/* PORTFOLIO TAB */}
               {activeTab === "portfolio" && (
                 <motion.div
                   key="portfolio"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 no-scrollbar -mx-6 px-6"
                 >
                   {[1, 2, 3, 4].map(i => (
                     <motion.div 
                       key={i}
                       className="min-w-[85%] aspect-[4/3] bg-white/5 rounded-3xl border border-white/10 shrink-0 snap-center relative overflow-hidden flex items-center justify-center relative group"
                     >
                       <img src={`https://images.unsplash.com/photo-1542204165-65bf26472b9b?w=800&auto=format&fit=crop&q=80&ixlib=rb-4.0.3&auto=format&fit=crop&q=80&w=400&h=300${i}`} className="absolute inset-0 w-full h-full object-cover opacity-60 mix-blend-overlay group-hover:scale-105 transition-transform duration-700" alt="Portfolio item" />
                       <Play size={32} className="text-white/40 relative z-10" />
                     </motion.div>
                   ))}
                 </motion.div>
               )}

               {/* ANALYTICS LITE (OWNER ONLY) */}
               {activeTab === "analytics" && isOwner && (
                 <motion.div
                   key="analytics"
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   exit={{ opacity: 0, y: -10 }}
                   className="flex flex-col gap-4"
                 >
                   <div className="grid grid-cols-2 gap-3">
                     <div className="p-4 bg-white/5 rounded-2xl border border-white/10 flex flex-col gap-1">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Listing Views</span>
                        <span className="text-2xl font-black text-white">1,240</span>
                     </div>
                     <div className="p-4 bg-blue-500/10 rounded-2xl border border-blue-500/30 flex flex-col gap-1">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Total Bookings</span>
                        <span className="text-2xl font-black text-white">32</span>
                     </div>
                     <div className="col-span-2 p-5 bg-green-500/10 rounded-2xl border border-green-500/20 flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Total Earned</span>
                          <p className="text-3xl font-black text-white mt-1">$4,800</p>
                        </div>
                        <TrendingUp size={32} className="text-green-500/50" />
                     </div>
                   </div>
                 </motion.div>
               )}
             </AnimatePresence>
          </div>
        </div>

        {/* Floating Action footer */}
        <div className="absolute bottom-0 inset-x-0 p-6 bg-gradient-to-t from-[#05060a] via-[#05060a] to-transparent z-30">
           {isOwner ? (
             <div className="flex gap-3">
               <button className="flex-1 h-14 bg-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:bg-white/20 transition-all border border-white/10">
                 Edit Listing
               </button>
               <button className="flex-1 h-14 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:bg-blue-500 flex items-center justify-center gap-2">
                 <Zap size={14} className="fill-white" /> Boost
               </button>
             </div>
           ) : (
             <button 
               onClick={() => onBook?.(listing)}
               className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-sm shadow-[0_0_40px_rgba(255,255,255,0.2)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
             >
               Book Now — ${listing.price || 0}
             </button>
           )}
        </div>
      </motion.div>
    </motion.div>
  );
}
