import { motion } from "motion/react";
import { ArrowLeft, Check, AlertCircle, Clock } from "lucide-react";
import { Booking } from "../types";
import EscrowCard from "./EscrowCard";
import MilestoneTimeline from "./MilestoneTimeline";

interface JobEscrowManagerProps {
  booking: Booking;
  onClose: () => void;
}

export default function JobEscrowManager({ booking, onClose }: JobEscrowManagerProps) {
  return (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] bg-black p-6 pt-16 overflow-y-auto"
    >
        <button onClick={onClose} className="flex items-center gap-2 text-white/40 mb-8 hover:text-white">
            <ArrowLeft size={16} /> Back to Activity
        </button>

        <h2 className="text-3xl font-display font-black tracking-tight mb-8">
            Project: <span className="text-white/40">{booking.id}</span>
        </h2>

        <div className="grid gap-6">
            <EscrowCard booking={booking} />
            
            <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/10">
                <h3 className="font-bold text-lg mb-6">Milestones</h3>
                <MilestoneTimeline milestones={booking.milestones} />
            </div>

            <div className="flex gap-4">
               <button className="flex-1 h-16 bg-blue-500 rounded-3xl font-black uppercase tracking-widest text-xs font-display">Approve Milestone</button>
               <button className="flex-1 h-16 bg-white/5 rounded-3xl font-black uppercase tracking-widest text-xs font-display text-white/60">Dispute</button>
            </div>
        </div>
    </motion.div>
  );
}
