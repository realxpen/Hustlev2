import { motion } from "motion/react";
import { CheckCircle2, Lock, ArrowUpRight, AlertCircle, ShieldCheck, Clock, FileText } from "lucide-react";
import { TransactionType, TransactionStatus } from "../types";

export interface SystemEventPayload {
  type: TransactionType;
  amount?: number;
  status?: TransactionStatus;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

interface TransactionMessageProps {
  payload: SystemEventPayload;
}

export default function TransactionMessage({ payload }: TransactionMessageProps) {
  const getIcon = () => {
    switch (payload.type) {
      case TransactionType.ESCROW_FUNDED: return <Lock size={16} className="text-blue-400" />;
      case TransactionType.ESCROW_RELEASE: return <CheckCircle2 size={16} className="text-green-400" />;
      case TransactionType.AWAITING_APPROVAL: return <Clock size={16} className="text-blue-400" />;
      case TransactionType.REFUND: return <ArrowUpRight size={16} className="text-orange-400" />;
      default: return <ShieldCheck size={16} className="text-blue-400" />;
    }
  };

  const getColors = () => {
    switch (payload.type) {
      case TransactionType.ESCROW_FUNDED: return "bg-blue-500/5 border-blue-500/20 text-blue-400";
      case TransactionType.ESCROW_RELEASE: return "bg-green-500/5 border-green-500/20 text-green-400";
      case TransactionType.REFUND: return "bg-orange-500/5 border-orange-500/20 text-orange-400";
      default: return "bg-white/[0.03] border-white/10 text-white/40";
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`mx-auto max-w-[90%] p-5 rounded-[24px] border ${getColors()} flex flex-col gap-4 my-2 relative overflow-hidden`}
    >
      <div className="flex items-start gap-4 relative z-10">
        <div className="w-10 h-10 rounded-2xl bg-black/40 flex items-center justify-center shrink-0 border border-white/5">
          {getIcon()}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between mb-1">
             <h4 className="text-xs font-black uppercase tracking-widest">{payload.title}</h4>
             {payload.amount && <span className="text-sm font-black tracking-tight">₦{payload.amount.toLocaleString()}</span>}
          </div>
          <p className="text-[11px] font-medium leading-relaxed opacity-60">
            {payload.description || `The financial event has been recorded in the escrow timeline.`}
          </p>
        </div>
      </div>

      {(payload.actionLabel || payload.type === TransactionType.AWAITING_APPROVAL) && (
        <button 
          onClick={payload.onAction}
          className="w-full h-10 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
            {payload.actionLabel || "View Details"}
          </span>
          <ArrowUpRight size={14} className="opacity-40" />
        </button>
      )}
    </motion.div>
  );
}
