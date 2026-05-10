import { motion, AnimatePresence } from "motion/react";
import { ChevronLeft, MoreHorizontal, MessageSquare, Phone, MapPin, Calendar, Clock, CheckCircle2, ChevronRight, Star, ShieldCheck } from "lucide-react";
import { useState } from "react";
import JobEscrowManager from "./JobEscrowManager";

interface BookingDetailProps {
  booking: any;
  onBack: () => void;
}

const PROGRESS_STEPS = [
  { id: "booked", label: "Booked", time: "May 08, 10:30 AM", completed: true },
  { id: "confirmed", label: "Confirmed", time: "May 08, 11:45 AM", completed: true },
  { id: "in_progress", label: "In Progress", time: "May 09, 09:15 AM", completed: true },
  { id: "completed", label: "Completed", time: "", completed: false }
];

export default function BookingDetail({ booking, onBack }: BookingDetailProps) {
  const [activeTab, setActiveTab] = useState<"tracking" | "details">("tracking");
  const [showEscrow, setShowEscrow] = useState(false);

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-[#050505] flex flex-col pt-12 text-white overflow-hidden"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="px-6 pb-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 -ml-3 text-white/40 hover:text-white transition-colors">
              <ChevronLeft size={24} />
           </button>
           <div>
              <h3 className="font-bold text-sm tracking-tight">{booking.id}</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{booking.service}</p>
           </div>
        </div>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40">
           <MoreHorizontal size={20} />
        </button>
      </header>

      {/* Tabs */}
      <div className="flex px-6 pt-6 gap-8 border-b border-white/5">
         <button 
           onClick={() => setActiveTab("tracking")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'tracking' ? 'text-white' : 'text-white/30'}`}
         >
            Tracking
            {activeTab === "tracking" && (
              <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
         <button 
           onClick={() => setActiveTab("details")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'details' ? 'text-white' : 'text-white/30'}`}
         >
            Details
            {activeTab === "details" && (
              <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-32">
         {activeTab === "tracking" ? (
            <div className="flex flex-col gap-10">
               {/* Timeline Section */}
               <section>
                  <div className="flex flex-col gap-8">
                     {PROGRESS_STEPS.map((step, idx) => (
                        <div key={step.id} className="flex gap-6 relative">
                           {/* Vertical Line */}
                           {idx !== PROGRESS_STEPS.length - 1 && (
                              <div className={`absolute left-[13px] top-[26px] w-[2px] h-[calc(100%+32px)] ${step.completed ? 'bg-blue-500' : 'bg-white/5'}`} />
                           )}
                           
                           {/* Step Icon */}
                           <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 ${
                              step.completed 
                              ? 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.5)]' 
                              : 'bg-white/5 border border-white/10'
                           }`}>
                              {step.completed ? <CheckCircle2 size={16} className="text-white" /> : <div className="w-1.5 h-1.5 rounded-full bg-white/20" />}
                           </div>

                           <div className="flex-1 pt-0.5">
                              <h4 className={`text-sm font-bold tracking-tight mb-1 ${step.completed ? 'text-white' : 'text-white/20'}`}>
                                 {step.label}
                              </h4>
                              {step.time && (
                                 <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-none">
                                    {step.time}
                                 </p>
                              )}
                              {step.id === booking.status && (
                                 <div className="mt-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                                    <p className="text-[11px] text-white/60 font-light leading-relaxed">
                                       "{booking.lastUpdate}"
                                    </p>
                                 </div>
                              )}
                           </div>
                        </div>
                     ))}
                  </div>
               </section>

               {/* Quick Communication Card */}
               <section className="p-6 rounded-[32px] bg-white/[0.03] border border-white/10">
                  <div className="flex items-center justify-between mb-6">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-black">
                           {booking.avatar}
                        </div>
                        <div>
                           <h4 className="font-bold text-sm tracking-tight">{booking.hustler}</h4>
                           <div className="flex items-center gap-1">
                              <Star size={10} className="text-yellow-500 fill-yellow-500" />
                              <span className="text-[9px] font-black">{booking.rating || "4.9"}</span>
                           </div>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        <button className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
                           <Phone size={16} />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shadow-lg shadow-white/10 transition-transform active:scale-95">
                           <MessageSquare size={16} />
                        </button>
                     </div>
                  </div>
                  <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                     <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest text-center">
                        Typically responds in less than 5 mins
                     </p>
                  </div>
               </section>
            </div>
         ) : (
            <div className="flex flex-col gap-8">
               <div className="flex flex-col gap-6">
                  <div className="flex flex-col gap-1">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Service Summary</h4>
                     <p className="text-lg font-bold tracking-tight">{booking.service}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-white/30">
                           <Calendar size={14} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Date</span>
                        </div>
                        <p className="text-xs font-bold">{booking.date}</p>
                     </div>
                     <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/5">
                        <div className="flex items-center gap-2 mb-2 text-white/30">
                           <Clock size={14} />
                           <span className="text-[9px] font-black uppercase tracking-widest">Time</span>
                        </div>
                        <p className="text-xs font-bold">{booking.time}</p>
                     </div>
                  </div>

                  <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-3">
                        <MapPin size={18} className="text-white/30" />
                        <div>
                           <p className="text-[9px] font-black uppercase tracking-widest text-white/20">Location</p>
                           <p className="text-xs font-bold">Lagos Studio A • Main Block</p>
                        </div>
                     </div>
                     <ChevronRight size={16} className="text-white/10" />
                  </div>

                  <div className="mt-4 p-8 rounded-[40px] bg-blue-500/5 border border-blue-500/10 text-center">
                     <p className="text-[10px] text-blue-400/40 font-black uppercase tracking-widest mb-2">Payment Secured</p>
                     <p className="text-2xl font-display font-black text-blue-400">{booking.price}</p>
                  </div>
               </div>
            </div>
         )}
      </div>

      {/* Persistent Bottom Action (if active) */}
      <footer className="px-6 pt-4 pb-12 bg-gradient-to-t from-black to-transparent relative z-[200]">
         <button 
            onClick={() => {
                alert("Clicked");
                setShowEscrow(true);
            }}
            className="w-full h-14 bg-blue-500 rounded-2xl flex items-center justify-center gap-3 active:scale-[0.98] transition-transform"
         >
            <ShieldCheck size={16} />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Manage Escrow & Payments</span>
         </button>
      </footer>
      
      {showEscrow && <JobEscrowManager booking={booking} onClose={() => setShowEscrow(false)} />}
    </motion.div>
  );
}
