import { motion } from "motion/react";
import { Milestone, MilestoneStatus } from "../types";
import { Check, Clock, AlertCircle, CircleDashed } from "lucide-react";

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  return (
    <div className="space-y-6 relative">
      <div className="absolute left-[20px] top-4 bottom-4 w-px bg-white/10 -z-10" />
      {milestones.map((milestone, index) => {
          const isPending = milestone.status === MilestoneStatus.PENDING;
          const isReleased = milestone.status === MilestoneStatus.RELEASED;
          const isDisputed = milestone.status === MilestoneStatus.DISPUTED;
          const isAwaiting = milestone.status === MilestoneStatus.AWAITING_APPROVAL;
          const isInProgress = milestone.status === MilestoneStatus.IN_PROGRESS;

          return (
            <motion.div 
                key={milestone.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="relative z-10"
            >
                <div className={`p-5 rounded-[24px] border border-white/[0.05] flex gap-4 ${
                    isReleased ? "bg-[#0A0A0A]" :
                    isDisputed ? "bg-red-500/5 border-red-500/20" :
                    isAwaiting ? "bg-blue-500/5 border-blue-500/20" :
                    isInProgress ? "bg-white/[0.03]" :
                    "bg-[#0A0A0A] opacity-50"
                }`}>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 border ${
                        isReleased ? "bg-green-500/10 text-green-400 border-green-500/20" :
                        isDisputed ? "bg-red-500/10 text-red-500 border-red-500/20" :
                        isAwaiting ? "bg-blue-500/10 text-blue-400 border-blue-500/20" :
                        isInProgress ? "bg-white/10 text-white border-white/20" :
                        "bg-white/5 text-white/30 border-white/10"
                    }`}>
                      {isReleased ? <Check size={16} /> : 
                       isDisputed ? <AlertCircle size={16} /> :
                       (isAwaiting || isInProgress) ? <Clock size={16} /> :
                       <CircleDashed size={16} />}
                    </div>
                    <div className="flex-1 pt-1">
                        <div className="flex justify-between items-start mb-1">
                            <h5 className={`font-bold text-sm ${isReleased ? 'text-white' : 'text-white'}`}>{milestone.title}</h5>
                            <span className="font-display font-black">₦{milestone.amount.toLocaleString()}</span>
                        </div>
                        <p className={`text-[10px] uppercase tracking-widest font-bold ${
                            isReleased ? 'text-green-400' :
                            isDisputed ? 'text-red-400' :
                            isAwaiting ? 'text-blue-400' :
                            'text-white/40'
                        }`}>
                            {milestone.status.replace("_", " ")}
                            {!isReleased && !isDisputed && ` • Due ${new Date(milestone.deadline).toLocaleDateString()}`}
                        </p>
                    </div>
                </div>
            </motion.div>
          );
      })}
    </div>
  );
}
