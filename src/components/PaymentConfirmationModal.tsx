import { motion, AnimatePresence } from "motion/react";
import { ShieldCheck, ArrowRight, X, Lock, Clock, Info, ShieldQuestion } from "lucide-react";

interface PaymentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  amount?: number;
  recipient?: string;
  fees?: number;
  estimatedArrival?: string;
  actionType: "deposit" | "withdrawal" | "release";
  description?: string;
}

export default function PaymentConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  amount,
  recipient,
  fees = 0,
  estimatedArrival,
  actionType,
  description
}: PaymentConfirmationModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="w-full max-w-md bg-[#121212] rounded-[32px] border border-white/10 shadow-2xl overflow-hidden relative"
          >
            <div className="grain-overlay pointer-events-none opacity-20" />
            
            {/* Trust Header */}
            <div className="p-6 bg-white/[0.02] border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                 <ShieldCheck size={18} className="text-blue-400" />
                 <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Secure Confirmation</span>
              </div>
              <button 
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8 space-y-8">
              <div className="text-center">
                 <h2 className="text-xl font-display font-black tracking-tight mb-2">{title}</h2>
                 <p className="text-[11px] font-medium text-white/40 leading-relaxed max-w-[240px] mx-auto">
                   {description || "Please review the transaction details below before proceeding."}
                 </p>
              </div>

              {amount !== undefined && (
                <div className="p-6 rounded-3xl bg-white/[0.03] border border-white/5 text-center relative overflow-hidden">
                   <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />
                   <h1 className="text-3xl font-display font-black tracking-tighter mb-1">
                     ₦{amount.toLocaleString()}
                   </h1>
                   <div className="text-[10px] font-black uppercase tracking-widest text-blue-400 opacity-60">Total Amount</div>
                </div>
              )}

              <div className="space-y-4">
                {recipient && (
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Destination</span>
                    <span className="text-xs font-bold">{recipient}</span>
                  </div>
                )}
                <div className="flex justify-between items-center px-2">
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Network Fees</span>
                  <span className="text-xs font-bold text-green-400">₦{fees.toLocaleString()}</span>
                </div>
                {estimatedArrival && (
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Est. Arrival</span>
                    <div className="flex items-center gap-1.5">
                       <Clock size={12} className="text-white/20" />
                       <span className="text-xs font-bold">{estimatedArrival}</span>
                    </div>
                  </div>
                )}
              </div>

              {actionType === "release" && (
                <div className="flex gap-3 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 items-start">
                   <ShieldQuestion size={16} className="text-blue-400 shrink-0 mt-0.5" />
                   <p className="text-[10px] font-medium leading-relaxed text-blue-400/80">
                     Releasing funds constitutes completion of the milestone. This action is irreversible.
                   </p>
                </div>
              )}

              <div className="pt-2">
                <button 
                  onClick={onConfirm}
                  className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs flex items-center justify-center gap-2 shadow-xl shadow-white/5 active:scale-[0.98] transition-all group"
                >
                  Confirm & Securely Process
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </button>
                <div className="mt-4 flex items-center justify-center gap-2">
                   <Lock size={12} className="text-white/20" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/20">End-to-End Encrypted</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
