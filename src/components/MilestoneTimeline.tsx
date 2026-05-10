import { motion } from "motion/react";
import { Milestone, MilestoneStatus } from "../types";
import { Check, Clock, AlertCircle } from "lucide-react";

interface MilestoneTimelineProps {
  milestones: Milestone[];
}

export default function MilestoneTimeline({ milestones }: MilestoneTimelineProps) {
  return (
    <div className="space-y-4">
      {milestones.map((milestone, index) => (
        <motion.div 
            key={milestone.id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-2xl border flex items-center gap-4 ${
                milestone.status === "released" ? "bg-green-500/10 border-green-500/20" :
                milestone.status === "disputed" ? "bg-red-500/10 border-red-500/20" :
                "bg-white/[0.03] border-white/5"
            }`}
        >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                milestone.status === "released" ? "bg-green-500 text-white" :
                milestone.status === "disputed" ? "bg-red-500 text-white" :
                "bg-white/10 text-white/50"
            }`}>
              {milestone.status === "released" ? <Check size={14} /> : 
               milestone.status === "disputed" ? <AlertCircle size={14} /> :
               <Clock size={14} />}
            </div>
            <div className="flex-1">
                <h5 className="font-bold text-xs">{milestone.title}</h5>
                <p className="text-[10px] text-white/40 uppercase tracking-widest font-bold">
                    ${milestone.amount.toLocaleString()} • {milestone.status.replace("_", " ")}
                </p>
            </div>
        </motion.div>
      ))}
    </div>
  );
}
