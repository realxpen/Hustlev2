import { motion } from "motion/react";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  RefreshCcw,
  ShieldCheck,
  Lock,
  Clock
} from "lucide-react";
import { Transaction, TransactionType, TransactionStatus } from "../types";

interface TransactionCardProps {
  tx: Transaction;
  onClick: (tx: Transaction) => void;
}

export default function TransactionCard({ tx, onClick }: TransactionCardProps) {
  const getIcon = (type: TransactionType) => {
    switch (type) {
      case TransactionType.DEPOSIT: return <ArrowDownLeft size={16} />;
      case TransactionType.WITHDRAWAL: return <ArrowUpRight size={16} />;
      case TransactionType.ESCROW_FUNDED: return <Lock size={16} />;
      case TransactionType.ESCROW_RELEASE: return <ShieldCheck size={16} />;
      case TransactionType.AWAITING_APPROVAL: return <Clock size={16} />;
      case TransactionType.REFUND: return <RefreshCcw size={16} />;
      default: return <CreditCard size={16} />;
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
    switch (status) {
      case TransactionStatus.COMPLETED: return "text-green-400";
      case TransactionStatus.PENDING: return "text-white/40";
      case TransactionStatus.PROCESSING: return "text-blue-400";
      case TransactionStatus.FAILED: return "text-red-400";
      case TransactionStatus.DISPUTED: return "text-orange-400";
      case TransactionStatus.REFUNDED: return "text-purple-400";
      default: return "text-white/40";
    }
  };

  const isPositive = [TransactionType.DEPOSIT, TransactionType.ESCROW_RELEASE, TransactionType.REFUND].includes(tx.type);
  const isNeutral = [TransactionType.ESCROW_FUNDED, TransactionType.AWAITING_APPROVAL].includes(tx.type);

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(tx)}
      className="w-full flex items-center justify-between p-4 rounded-[24px] bg-[#0A0A0A] border border-white/[0.05] hover:bg-white/[0.02] transition-colors group text-left relative overflow-hidden"
    >
      <div className="flex items-center gap-4 relative z-10">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 border border-white/5 ${
            isPositive ? 'bg-green-500/10 text-green-400' : 
            isNeutral ? 'bg-blue-500/10 text-blue-400' :
            'bg-white/5 text-white/60'
        }`}>
          {getIcon(tx.type)}
        </div>
        <div>
          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">
             {tx.title}
          </h4>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1 flex items-center gap-1.5">
             <span className={getStatusColor(tx.status)}>{tx.status}</span>
             <span>•</span>
             <span>{new Date(tx.timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
          </p>
        </div>
      </div>
      <div className="text-right relative z-10">
        <h5 className={`text-base font-black tracking-tight ${isNeutral ? 'text-white' : isPositive ? 'text-green-400' : 'text-white'}`}>
            {isPositive ? '+' : isNeutral ? '' : '-'}₦{tx.amount.toLocaleString()}
        </h5>
        {(tx.sender || tx.receiver) && (
            <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">
               {tx.receiver === "You" ? `From ${tx.sender}` : `To ${tx.receiver}`}
            </p>
        )}
      </div>
    </motion.button>
  );
}
