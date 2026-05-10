import { motion } from "motion/react";
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  CreditCard, 
  Landmark, 
  RefreshCcw,
  ShieldCheck,
  AlertCircle,
  MoreHorizontal
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
      case TransactionType.ESCROW_RELEASE: return <ShieldCheck size={16} />;
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
    }
  };

  const isPositive = [TransactionType.DEPOSIT, TransactionType.ESCROW_RELEASE, TransactionType.REFUND].includes(tx.type);

  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onClick(tx)}
      className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors group text-left"
    >
      <div className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isPositive ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-white/60'}`}>
          {getIcon(tx.type)}
        </div>
        <div>
          <h4 className="text-sm font-bold text-white group-hover:text-blue-400 transition-colors">{tx.title}</h4>
          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-0.5">
             {tx.status} • {new Date(tx.timestamp).toLocaleDateString()}
          </p>
        </div>
      </div>
      <div className="text-right">
        <h5 className={`text-sm font-black ${isPositive ? 'text-green-400' : 'text-white'}`}>
            {isPositive ? '+' : '-'}₦{tx.amount.toLocaleString()}
        </h5>
        <p className={`text-[10px] font-bold uppercase tracking-widest ${getStatusColor(tx.status)}`}>
            {tx.status}
        </p>
      </div>
    </motion.button>
  );
}
