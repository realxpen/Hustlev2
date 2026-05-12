import { motion } from "motion/react";
import { ShieldCheck, ChevronRight, Lock, CheckCircle2 } from "lucide-react";
import { Booking, MilestoneStatus } from "../types";

interface BookingContextCardProps {
  booking: Booking;
  onOpenBooking: () => void;
}

export default function BookingContextCard({ booking, onOpenBooking }: BookingContextCardProps) {
  const activeMilestone = booking.milestones.find(m => m.status === MilestoneStatus.IN_PROGRESS || m.status === MilestoneStatus.AWAITING_APPROVAL);
  const completedMilestones = booking.milestones.filter(m => m.status === MilestoneStatus.RELEASED).length;
  const totalMilestones = booking.milestones.length;

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mx-6 mt-2 mb-4 p-4 rounded-3xl bg-blue-500/10 border border-blue-500/20 backdrop-blur-md relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400/10 blur-3xl rounded-full -mr-10 -mt-10" />
      
      <div className="flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <ShieldCheck size={20} />
          </div>
          <div>
            <h4 className="text-[11px] font-black uppercase tracking-widest text-blue-400 mb-1">Active Booking</h4>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold tracking-tight text-white truncate max-w-[120px]">
                {booking.id}
              </span>
              <div className="flex items-center gap-1 px-1.5 py-0.5 bg-white/5 rounded-full border border-white/5">
                <Lock size={8} className="text-blue-400" />
                <span className="text-[8px] font-black text-white/60">₦{booking.price.toLocaleString()}</span>
              </div>
            </div>
          </div>
        </div>

        <button 
          onClick={onOpenBooking}
          className="flex items-center gap-1 group"
        >
          <div className="text-right mr-2">
            <p className="text-[10px] font-black text-white/80 uppercase tracking-tighter">
              {activeMilestone ? `Milestone ${booking.milestones.indexOf(activeMilestone) + 1}` : 'Reviewing'}
            </p>
            <div className="flex gap-0.5 mt-1">
              {[...Array(totalMilestones)].map((_, i) => (
                <div 
                  key={i} 
                  className={`h-1 w-3 rounded-full ${i < completedMilestones ? 'bg-green-500' : i === completedMilestones ? 'bg-blue-500' : 'bg-white/10'}`} 
                />
              ))}
            </div>
          </div>
          <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:bg-white/10 group-hover:border-white/20 transition-all">
            <ChevronRight size={16} className="text-white/40" />
          </div>
        </button>
      </div>

      {activeMilestone?.status === MilestoneStatus.AWAITING_APPROVAL && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-4 pt-3 border-t border-blue-400/10 flex items-center justify-between"
        >
          <div className="flex items-center gap-2">
             <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
             <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/80">Action Required: Approve Release</span>
          </div>
          <div className="text-[9px] font-black text-white">₦{activeMilestone.amount.toLocaleString()}</div>
        </motion.div>
      )}
    </motion.div>
  );
}
