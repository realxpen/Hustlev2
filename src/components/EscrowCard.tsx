import { motion } from "motion/react";
import { Lock, CheckCircle2, TrendingUp, ShieldCheck } from "lucide-react";
import { Booking } from "../types";

interface EscrowCardProps {
  booking: Booking;
  isClient?: boolean;
}

export default function EscrowCard({ booking, isClient = true }: EscrowCardProps) {
  const released = booking.milestones
    .filter(m => m.status === "released")
    .reduce((sum, m) => sum + m.amount, 0);
  const locked = booking.price - released;
  const activeMilestoneIndex = booking.milestones.findIndex(m => m.status === "in_progress" || m.status === "awaiting_approval");
  const activeMilestone = booking.milestones[activeMilestoneIndex];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-[32px] bg-gradient-to-b from-[#0a0a0a] to-[#050505] border border-white/10 relative overflow-hidden shadow-2xl"
    >
      <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <ShieldCheck size={16} className="text-blue-400" />
             <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">Hustle Protected Escrow</span>
           </div>
           <h4 className="text-4xl font-display font-black text-white tracking-tighter">₦{booking.price.toLocaleString()}</h4>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-1">Status</span>
           <span className="inline-block px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] uppercase font-black tracking-widest rounded-full">
             {activeMilestone ? `Milestone ${activeMilestoneIndex + 1} Active` : "Reviewing"}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
           <div className="text-white/40 mb-2 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
             <Lock size={14} className="text-blue-400" /> 
             {isClient ? "Locked (Protected)" : "Locked (Pending)"}
           </div>
           <div className="font-display font-black text-xl text-white">₦{locked.toLocaleString()}</div>
        </div>
        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
           <div className="text-white/40 mb-2 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
             <CheckCircle2 size={14} className="text-green-400" /> 
             Released
           </div>
           <div className="font-display font-black text-xl text-green-400">₦{released.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden relative z-10">
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(released / booking.price) * 100}%` }}
            className="h-full bg-green-500"
            transition={{ duration: 1, delay: 0.2 }}
        />
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(locked / booking.price) * 100}%` }}
            className="h-full bg-blue-500/50 absolute top-0"
            style={{ left: `${(released / booking.price) * 100}%` }}
            transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
      <div className="flex justify-between mt-2 px-1 relative z-10">
          <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">{(booking.price ? (released / booking.price) * 100 : 0).toFixed(0)}% Released</span>
          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">{(booking.price ? (locked / booking.price) * 100 : 0).toFixed(0)}% Locked</span>
      </div>
    </motion.div>
  );
}
