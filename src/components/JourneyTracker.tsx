import { motion, AnimatePresence } from "motion/react";
import { ArrowRight, BrainCircuit, X } from "lucide-react";

interface JourneyTrackerProps {
  mission: {
    id: string;
    step: "DISCOVERY" | "TRUST" | "INTENT" | "TRANSACTION" | "OUTCOME";
    context: any;
  } | null;
  onClose: () => void;
  onNext: () => void;
}

export default function JourneyTracker({ mission, onClose, onNext }: JourneyTrackerProps) {
  if (!mission) return null;

  const steps = [
    { id: "DISCOVERY", label: "Discovery", sub: "Exploring options" },
    { id: "TRUST", label: "Trust", sub: "Reviewing profile" },
    { id: "INTENT", label: "Intent", sub: "Talking details" },
    { id: "TRANSACTION", label: "Booking", sub: "Sealing the deal" },
    { id: "OUTCOME", label: "Outcome", sub: "Review & Reputation" },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === mission.step);

  return (
    <motion.div 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: -100, opacity: 0 }}
      className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] w-[90%] max-w-md"
    >
      <div className="bg-black/90 backdrop-blur-2xl border border-white/10 rounded-[32px] p-4 shadow-2xl overflow-hidden relative">
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent" />
        
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-2xl bg-blue-500/20 flex items-center justify-center text-blue-400">
                <BrainCircuit size={20} className="animate-pulse" />
             </div>
             <div>
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Current Intent</h4>
                <p className="text-[9px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
                   {mission.context?.creator?.name || "Marketplace Journey"}
                </p>
             </div>
          </div>

          <div className="flex items-center gap-2">
             <button 
               onClick={onNext}
               className="h-10 px-4 rounded-xl bg-white text-black text-[9px] font-black uppercase tracking-widest flex items-center gap-2"
             >
                Next Step
                <ArrowRight size={14} />
             </button>
             <button 
               onClick={onClose}
               className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white"
             >
                <X size={16} />
             </button>
          </div>
        </div>

        {/* Progress Dots */}
        <div className="flex justify-between mt-4 px-2">
           {steps.map((step, i) => (
              <div key={step.id} className="flex flex-col items-center gap-1 group relative">
                 <div className={`w-1.5 h-1.5 rounded-full transition-all duration-500 ${
                    i <= currentStepIndex ? "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" : "bg-white/10"
                 }`} />
                 
                 {/* Tooltip on hover */}
                 <div className="absolute -bottom-8 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white/5 px-2 py-1 rounded text-[8px] font-bold uppercase tracking-tighter pointer-events-none">
                    {step.label}
                 </div>
              </div>
           ))}
        </div>
      </div>
    </motion.div>
  );
}
