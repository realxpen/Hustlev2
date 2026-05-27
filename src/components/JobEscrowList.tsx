import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ShieldCheck, ChevronRight, Lock, CheckCircle2, User, CheckCircle } from "lucide-react";
import { Booking, BookingStatus, EscrowStatus, Milestone } from "../features/bookings/types";
import { useState, useEffect } from "react";
import JobEscrowManager from "./JobEscrowManager";
import { useBookingStore } from "../features/bookings/stores/useBookingStore";
import { useAuthStore } from "../features/auth/stores/useAuthStore";

interface JobEscrowListProps {
  onClose: () => void;
  isClient?: boolean;
  onViewDetails?: (booking: Booking) => void;
}

export default function JobEscrowList({ onClose, isClient: initialIsClient, onViewDetails }: JobEscrowListProps) {
  const { profile } = useAuthStore();
  const [selectedEscrow, setSelectedEscrow] = useState<Booking | null>(null);
  const [isClient, setIsClient] = useState(() => {
    if (initialIsClient !== undefined) return initialIsClient;
    return !profile?.is_hustler;
  });
  const [activeFilter, setActiveFilter] = useState<"all" | "pending" | "accepted" | "completed">("all");
  
  const { buyerOrders, sellerOrders, fetchBookings } = useBookingStore();

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const activeBookings = isClient ? buyerOrders : sellerOrders;

  const displayedBookings = activeBookings.filter(b => {
    if (activeFilter === "all") return true;
    if (activeFilter === "pending") return b.status === "pending";
    if (activeFilter === "accepted") return b.status === "accepted" || b.status === "in_progress";
    if (activeFilter === "completed") return b.status === "completed";
    return true;
  });

  return (
    <>
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[125] bg-black p-6 pt-16 overflow-y-auto w-full min-h-screen no-scrollbar"
        >
            <div className="max-w-xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <button onClick={onClose} className="flex items-center gap-2 text-white/40 hover:text-white transition-colors">
                        <ArrowLeft size={16} /> Back
                    </button>
                    
                    {/* Demo Role Toggle */}
                    <button 
                        onClick={() => setIsClient(!isClient)}
                        className="px-4 py-2 bg-white/5 border border-white/10 rounded-full flex items-center gap-2"
                    >
                        <User size={12} className="text-blue-400" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            {isClient ? "Client View" : "Hustler View"}
                        </span>
                    </button>
                </div>

                <header className="mb-8">
                    <h2 className="text-3xl font-display font-black tracking-tight mb-2">
                        {isClient ? "Active Escrows" : "Earnings & Escrow"}
                    </h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-sm">
                        {isClient 
                            ? "Manage your protected funds and milestone progress across all ongoing jobs."
                            : "Track your pending payouts and submitted work across your active bookings."}
                    </p>
                </header>

                {/* Status Tabs */}
                <div className="flex gap-2 mb-8 overflow-x-auto no-scrollbar pb-1">
                  {(["all", "pending", "accepted", "completed"] as const).map(tab => {
                     const isActive = activeFilter === tab;
                     
                     const label = tab === "all" ? "All" 
                       : tab === "pending" ? "Pending" 
                       : tab === "accepted" ? "Active" 
                       : "Completed";
                       
                     const count = activeBookings.filter(b => {
                       if (tab === "all") return true;
                       if (tab === "pending") return b.status === "pending";
                       if (tab === "accepted") return b.status === "accepted" || b.status === "in_progress";
                       if (tab === "completed") return b.status === "completed";
                       return true;
                     }).length;

                     return (
                       <button
                         key={tab}
                         onClick={() => setActiveFilter(tab)}
                         className={`px-4 py-2 border rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shrink-0 transition-all ${
                           isActive 
                             ? "bg-white text-black border-white" 
                             : "bg-white/5 text-white/40 border-white/5 hover:text-white"
                         }`}
                       >
                         <span>{label}</span>
                         <span className={`px-2 py-0.5 rounded-full text-[8px] font-black ${
                           isActive ? "bg-black text-white" : "bg-white/10 text-white/60"
                         }`}>{count}</span>
                       </button>
                     );
                  })}
                </div>

                <div className="space-y-4 pb-24">
                    {displayedBookings.length === 0 && (
                        <div className="text-center py-24 px-6 rounded-[32px] bg-white/[0.02] border border-dashed border-white/10">
                            <ShieldCheck size={48} className="mx-auto text-white/10 mb-4" />
                            <h3 className="text-sm font-black text-white uppercase tracking-widest mb-1">No Escrows Found</h3>
                            <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] mb-6">
                                {activeFilter === 'all' 
                                  ? `You don't have any bookings in this view.` 
                                  : `No ${activeFilter} ${isClient ? 'escrows' : 'jobs'} currently available.`}
                            </p>
                            <button 
                               onClick={() => setIsClient(!isClient)}
                               className="px-6 py-3 bg-white/5 hover:bg-white/10 text-white rounded-full text-[9px] font-black uppercase tracking-widest transition-all border border-white/10"
                            >
                               Switch to {isClient ? 'Hustler' : 'Client'} View
                            </button>
                        </div>
                    )}
                    {displayedBookings.map(booking => {
                        const total = booking.total_price || 0;

                        const released = (booking.milestones || [])
                            .filter(m => m.status === "released")
                            .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

                        const locked = Math.max(0, total - released);
                        
                        return (
                            <motion.button
                                key={booking.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => {
                                    if (!isClient && booking.status === 'pending') {
                                        if (onViewDetails) {
                                            onViewDetails(booking);
                                        } else {
                                            setSelectedEscrow(booking);
                                        }
                                    } else {
                                        setSelectedEscrow(booking);
                                    }
                                }}
                                className="w-full text-left p-5 rounded-[24px] bg-[#0A0A0A] border border-white/[0.05] hover:border-white/10 transition-colors group relative overflow-hidden flex flex-col gap-4"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

                                <div className="flex justify-between items-start relative z-10 w-full">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-blue-400">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors line-clamp-1 max-w-[200px]">
                                                {booking.listing_title || (isClient ? `Job #${booking.id.slice(0, 8)}` : `Hustle #${booking.id.slice(0, 8)}`)}
                                            </h4>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                                               {booking.status === 'completed' ? "Job Finished" : (isClient ? "Funds Protected" : "Hustle Active")} • ₦{total.toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                    <ChevronRight size={18} className="text-white/20 group-hover:text-white transition-colors" />
                                </div>
                                
                                <div className="w-full grid grid-cols-2 gap-2 relative z-10">
                                    <div className="bg-[#111] p-3 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-white/40">
                                            <Lock size={12} className="text-blue-400" />
                                            <span className="text-[9px] uppercase font-bold tracking-widest">
                                                {isClient ? "Locked" : "Awaiting"}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black">₦{locked.toLocaleString()}</span>
                                    </div>
                                    <div className="bg-[#111] p-3 rounded-2xl flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-white/40">
                                            <CheckCircle2 size={12} className="text-green-400" />
                                            <span className="text-[9px] uppercase font-bold tracking-widest">
                                                {isClient ? "Released" : "Earned"}
                                            </span>
                                        </div>
                                        <span className="text-xs font-black text-green-400">₦{released.toLocaleString()}</span>
                                    </div>
                                </div>
                            </motion.button>
                        );
                    })}
                </div>
            </div>
        </motion.div>

        <AnimatePresence>
            {selectedEscrow && (
                <JobEscrowManager 
                   booking={selectedEscrow} 
                   isClient={isClient}
                   onClose={() => setSelectedEscrow(null)} 
                   onViewDetails={(booking) => {
                      setSelectedEscrow(null);
                      onViewDetails?.(booking);
                   }}
                />
            )}
        </AnimatePresence>
    </>
  );
}
