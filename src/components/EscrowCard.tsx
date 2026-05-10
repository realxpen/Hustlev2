import { motion } from "motion/react";
import { Lock, CheckCircle2, TrendingUp } from "lucide-react";
import { Booking } from "../types";

interface EscrowCardProps {
  booking: Booking;
}

export default function EscrowCard({ booking }: EscrowCardProps) {
  const released = booking.milestones
    .filter(m => m.status === "released")
    .reduce((sum, m) => sum + m.amount, 0);
  const locked = booking.price - released;
  const activeMilestone = booking.milestones.find(m => m.status === "in_progress" || m.status === "awaiting_approval");

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-6 rounded-3xl bg-white/[0.03] border border-white/10"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
           <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-1">Project Total</span>
           <h4 className="text-2xl font-display font-black text-white">${booking.price.toLocaleString()}</h4>
        </div>
        <div className="text-right">
           <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-1">Status</span>
           <span className="text-xs font-bold text-blue-400">
             {activeMilestone ? `Milestone ${booking.milestones.indexOf(activeMilestone) + 1} of ${booking.milestones.length} Active` : "Reviewing"}
           </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
           <div className="text-white/40 mb-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"><CheckCircle2 size={12} /> Released</div>
           <div className="font-display font-bold text-lg text-green-400">${released.toLocaleString()}</div>
        </div>
        <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
           <div className="text-white/40 mb-1 flex items-center gap-2 text-[10px] uppercase font-bold tracking-widest"><Lock size={12} /> Locked</div>
           <div className="font-display font-bold text-lg text-blue-400">${locked.toLocaleString()}</div>
        </div>
      </div>
      
      <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
        <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${(released / booking.price) * 100}%` }}
            className="h-full bg-blue-500"
        />
      </div>
    </motion.div>
  );
}
