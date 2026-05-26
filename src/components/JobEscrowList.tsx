import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, ShieldCheck, ChevronRight, Lock, CheckCircle2, User } from "lucide-react";
import { Booking, BookingStatus, EscrowStatus } from "../features/bookings/types";
import { useState } from "react";
import JobEscrowManager from "./JobEscrowManager";

interface JobEscrowListProps {
  onClose: () => void;
  isClient?: boolean;
}

const MOCK_ESCROWS: any[] = [
  {
    id: "BK-123",
    buyer_id: "c1",
    seller_id: "h1",
    listing_id: "s1",
    status: 'in_progress',
    unit_price: 120000,
    total_price: 120000,
    escrow_status: 'held',
    milestones: [
      { id: "m1", title: "Setup phase", amount: 40000, status: "released" as any, deadline: "2026-05-10" },
      { id: "m2", title: "Drafting", amount: 40000, status: "released" as any, deadline: "2026-05-11" },
      { id: "m3", title: "Final files", amount: 40000, status: "in_progress" as any, deadline: "2026-05-12" },
    ],
    created_at: "2026-05-01",
    updated_at: "2026-05-01",
  },
  {
    id: "BK-124",
    buyer_id: "c1",
    seller_id: "h2",
    listing_id: "s2",
    status: 'in_progress',
    unit_price: 350000,
    total_price: 350000,
    escrow_status: 'held',
    milestones: [
      { id: "m1", title: "Brand Identity", amount: 150000, status: "in_progress" as any, deadline: "2026-05-14" },
      { id: "m2", title: "Web Design", amount: 100000, status: "pending" as any, deadline: "2026-05-20" },
      { id: "m3", title: "Development", amount: 100000, status: "pending" as any, deadline: "2026-05-30" },
    ],
    created_at: "2026-05-08",
    updated_at: "2026-05-08",
  }
];

export default function JobEscrowList({ onClose, isClient: initialIsClient = true }: JobEscrowListProps) {
  const [selectedEscrow, setSelectedEscrow] = useState<Booking | null>(null);
  const [isClient, setIsClient] = useState(initialIsClient);

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

                <header className="mb-10">
                    <h2 className="text-3xl font-display font-black tracking-tight mb-2">
                        {isClient ? "Active Escrows" : "Earnings & Escrow"}
                    </h2>
                    <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed max-w-sm">
                        {isClient 
                            ? "Manage your protected funds and milestone progress across all ongoing jobs."
                            : "Track your pending payouts and submitted work across your active bookings."}
                    </p>
                </header>

                <div className="space-y-4 pb-24">
                    {MOCK_ESCROWS.map(booking => {
                        const released = booking.milestones
                            .filter(m => m.status === "released")
                            .reduce((sum, m) => sum + m.amount, 0);
                        const locked = booking.milestones
                            .filter(m => m.status !== "released")
                            .reduce((sum, m) => sum + m.amount, 0);
                        
                        return (
                            <motion.button
                                key={booking.id}
                                whileTap={{ scale: 0.98 }}
                                onClick={() => setSelectedEscrow(booking)}
                                className="w-full text-left p-5 rounded-[24px] bg-[#0A0A0A] border border-white/[0.05] hover:border-white/10 transition-colors group relative overflow-hidden flex flex-col gap-4"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 blur-[40px] rounded-full pointer-events-none group-hover:bg-blue-500/10 transition-colors" />

                                <div className="flex justify-between items-start relative z-10 w-full">
                                    <div className="flex gap-3 items-center">
                                        <div className="w-10 h-10 rounded-full bg-blue-500/10 border border-blue-500/20 flex flex-col items-center justify-center text-blue-400">
                                            <ShieldCheck size={16} />
                                        </div>
                                        <div>
                                            <h4 className="font-bold text-sm text-white group-hover:text-blue-400 transition-colors">
                                                {isClient ? `Job #${booking.id}` : `Earnings #${booking.id}`}
                                            </h4>
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-white/40">
                                               {isClient ? "Funds Protected" : "Payment Pending"} • ₦{(booking.total_price || 0).toLocaleString()}
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
                />
            )}
        </AnimatePresence>
    </>
  );
}
