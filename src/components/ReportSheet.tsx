import { motion, AnimatePresence } from "motion/react";
import { X, Flag, AlertTriangle, ShieldX, ChevronRight, Check } from "lucide-react";
import { useState } from "react";
import { useModerationStore } from "../stores/useModerationStore";
import type { ReportTargetType } from "../types/moderation";

interface ReportSheetProps {
  onClose: () => void;
  onReportSuccess?: () => void;
  entityName: string;
  targetId: string;
  targetType: ReportTargetType;
}

const REPORT_REASONS = [
  { id: "scam", label: "Potential Scam or Fraud", icon: <ShieldX size={18} /> },
  { id: "harassment", label: "Harassment or Abuse", icon: <AlertTriangle size={18} /> },
  { id: "quality", label: "Poor Service Quality", icon: <Flag size={18} /> },
  { id: "inappropriate", label: "Inappropriate Content", icon: <Flag size={18} /> },
];

export default function ReportSheet({ onClose, onReportSuccess, entityName, targetId, targetType }: ReportSheetProps) {
  const [selectedReason, setSelectedReason] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [internalError, setInternalError] = useState("");
  const { submitReport, isLoading } = useModerationStore();

  const handleSubmit = async () => {
    if (selectedReason) {
      setInternalError("");
      const res = await submitReport({
        target_id: targetId,
        target_type: targetType,
        reason: selectedReason
      });
      if (res.success) {
        setIsSubmitted(true);
        if (onReportSuccess) {
           onReportSuccess();
        } else {
           setTimeout(onClose, 2000);
        }
      } else {
        setInternalError(res.error || "Failed to submit report");
      }
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-end">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        />

        {/* Content */}
        {!isSubmitted ? (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="w-full bg-[#0A0A0A] border-t border-white/10 rounded-t-[40px] p-8 pt-12 pb-16 relative z-10"
          >
            <div className="grain-overlay pointer-events-none" />
            
            <header className="mb-10">
               <h3 className="text-2xl font-display font-black tracking-tight leading-none mb-1">REPORT SYSTEM</h3>
               <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Flag concerns about {entityName}</p>
            </header>

            <div className="flex flex-col gap-3 mb-10">
               {REPORT_REASONS.map((reason) => (
                  <button
                    key={reason.id}
                    onClick={() => setSelectedReason(reason.id)}
                    className={`w-full p-6 rounded-3xl transition-all flex items-center justify-between border ${
                      selectedReason === reason.id 
                      ? 'bg-red-500/10 border-red-500/30' 
                      : 'bg-white/[0.03] border-white/5 active:bg-white/5'
                    }`}
                  >
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                           selectedReason === reason.id ? 'text-red-400' : 'text-white/20'
                        }`}>
                           {reason.icon}
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${
                           selectedReason === reason.id ? 'text-white' : 'text-white/40'
                        }`}>
                           {reason.label}
                        </span>
                     </div>
                     {selectedReason === reason.id && (
                        <Check size={16} className="text-red-400" />
                     )}
                  </button>
               ))}
            </div>

            {internalError && (
              <div className="text-red-500 text-xs font-medium bg-red-500/10 p-3 rounded-xl mb-4">
                {internalError}
              </div>
            )}
            
            <div className="flex flex-col gap-4">
               <button 
                 disabled={!selectedReason || isLoading}
                 onClick={handleSubmit}
                 className={`w-full h-16 rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 flex justify-center items-center ${
                    selectedReason 
                    ? 'bg-red-500 text-white shadow-2xl shadow-red-500/20' 
                    : 'bg-white/5 text-white/20'
                 }`}
               >
                  {isLoading ? 'Submitting...' : 'Submit Report'}
               </button>
               <button 
                 onClick={onClose}
                 className="w-full h-16 rounded-2xl bg-white/[0.03] border border-white/10 text-[10px] font-black uppercase tracking-[0.2em] text-white/40 active:bg-white/5"
               >
                  Cancel
               </button>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            className="w-full bg-[#0A0A0A] border-t border-white/10 rounded-t-[40px] p-8 py-20 flex flex-col items-center justify-center text-center relative z-10"
          >
             <div className="grain-overlay pointer-events-none" />
             <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mb-8 border border-red-500/30">
                <ShieldX size={32} className="text-red-400" />
             </div>
             <h3 className="text-2xl font-display font-black tracking-tight leading-none mb-3">CONCERN LOGGED</h3>
             <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em] max-w-[240px]">
                Our safety team will review this report within 2 hours. Your identity remains protected.
             </p>
          </motion.div>
        )}
      </div>
    </AnimatePresence>
  );
}
