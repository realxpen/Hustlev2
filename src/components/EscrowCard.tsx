import { motion } from "motion/react";
import { Lock, CheckCircle2, TrendingUp, ShieldCheck, AlertCircle } from "lucide-react";
import { Booking } from "../features/bookings/types";

interface EscrowCardProps {
  booking: Booking;
  isClient?: boolean;
}

export default function EscrowCard({ booking, isClient = true }: EscrowCardProps) {
  const milestones = booking.milestones || [];
  
  // Rely on the normalized total_price from our store enrichment
  const total = booking.total_price || 0;

  const released = milestones
    .filter(m => m.status === "released")
    .reduce((sum, m) => sum + (Number(m.amount) || 0), 0);

  const locked = Math.max(0, total - released);

  const activeMilestoneIndex = milestones.findIndex(m => m.status === "in_progress" || m.status === "awaiting_approval");
  const activeMilestone = milestones[activeMilestoneIndex];

  const isRefunded = booking.escrow_status === 'refunded';

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`p-6 rounded-[32px] bg-gradient-to-b from-[#0a0a0a] to-[#050505] border relative overflow-hidden shadow-2xl ${
        isRefunded ? 'border-red-500/20' : 'border-white/10'
      }`}
    >
      <div className={`absolute top-0 right-0 w-64 h-64 blur-[80px] rounded-full pointer-events-none ${
        isRefunded ? 'bg-red-500/10' : 'bg-blue-500/10'
      }`} />

      <div className="flex justify-between items-start mb-8 relative z-10">
        <div>
           <div className="flex items-center gap-2 mb-2">
             <ShieldCheck size={16} className={isRefunded ? "text-red-400" : "text-blue-400"} />
             <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em]">
               {isRefunded ? "Refunded Escrow" : "Hustle Protected Escrow"}
             </span>
           </div>
           <h4 className={`text-4xl font-display font-black tracking-tighter ${isRefunded ? "text-red-400" : "text-white"}`}>
             ₦{total.toLocaleString()}
           </h4>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-1">Status</span>
           <span className={`inline-block px-3 py-1 border text-[10px] uppercase font-black tracking-widest rounded-full ${
             isRefunded ? 'bg-red-500/10 border-red-500/20 text-red-400' :
             activeMilestone ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' : 
             'bg-white/5 border-white/10 text-white/40'
           }`}>
             {isRefunded ? "Reclaimed" : activeMilestone ? `Milestone ${activeMilestoneIndex + 1} Active` : "Reviewing"}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6 relative z-10">
        <div className="bg-[#111] p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
           <div className="text-white/40 mb-2 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest">
             {isRefunded ? <AlertCircle size={14} className="text-red-400" /> : <Lock size={14} className="text-blue-400" />} 
             {isRefunded ? "Refunded" : isClient ? "Locked (Protected)" : "Locked (Pending)"}
           </div>
           <div className={`font-display font-black text-xl ${isRefunded ? "text-red-400" : "text-white"}`}>
             ₦{isRefunded ? total.toLocaleString() : locked.toLocaleString()}
           </div>
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
            animate={{ width: `${total ? (released / total) * 100 : 0}%` }}
            className="h-full bg-green-500"
            transition={{ duration: 1, delay: 0.2 }}
        />
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${total ? (locked / total) * 100 : 0}%` }}
            className="h-full bg-blue-500/50 absolute top-0"
            style={{ left: `${total ? (released / total) * 100 : 0}%` }}
            transition={{ duration: 1, delay: 0.2 }}
        />
      </div>
      <div className="flex justify-between mt-2 px-1 relative z-10">
          <span className="text-[9px] font-bold text-green-400 uppercase tracking-wider">{total ? ((released / total) * 100).toFixed(0) : 0}% Released</span>
          <span className="text-[9px] font-bold text-blue-400 uppercase tracking-wider">{total ? ((locked / total) * 100).toFixed(0) : 0}% Locked</span>
      </div>
    </motion.div>
  );
}
