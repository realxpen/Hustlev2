import { useState, useRef } from "react";
import { Search, Filter, ArrowUpRight, ArrowDownLeft, Lock, Clock, RefreshCw } from "lucide-react";
import { Transaction, TransactionType, TransactionStatus } from "../types";
import TransactionCard from "./TransactionCard";
import TransactionDetailView from "./TransactionDetailView";
import { motion, AnimatePresence } from "motion/react";

const MOCK_TRANSACTIONS: Transaction[] = [
  { id: "TX-901", userId: "u1", amount: 40000, type: TransactionType.ESCROW_RELEASE, status: TransactionStatus.COMPLETED, title: "Milestone 2 Released", sender: "Marcus V.", receiver: "You", timestamp: "2026-05-09T14:00:00Z", bookingId: "BK-123" },
  { id: "TX-902", userId: "u1", amount: 120000, type: TransactionType.ESCROW_FUNDED, status: TransactionStatus.COMPLETED, title: "Project Escrow Funded", sender: "You", receiver: "Escrow", timestamp: "2026-05-07T09:00:00Z", bookingId: "BK-123" },
  { id: "TX-903", userId: "u1", amount: 40000, type: TransactionType.AWAITING_APPROVAL, status: TransactionStatus.PENDING, title: "Milestone 3 Awaiting Approval", sender: "Marcus V.", receiver: "You", timestamp: "2026-05-09T16:00:00Z", bookingId: "BK-123" },
  { id: "TX-904", userId: "u1", amount: 15000, type: TransactionType.BOOKING_PAYMENT, status: TransactionStatus.COMPLETED, title: "Initial Booking Deposit", sender: "You", receiver: "Elena S.", timestamp: "2026-05-08T09:00:00Z" },
  { id: "TX-905", userId: "u1", amount: 2000, type: TransactionType.WITHDRAWAL, status: TransactionStatus.PROCESSING, title: "Withdrawal to Chase", timestamp: "2026-05-09T18:00:00Z", fee: 50 }
];

export default function ActivityFeed() {
  const [filterType, setFilterType] = useState<TransactionType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<TransactionStatus | "all">("all");
  const [search, setSearch] = useState("");
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const filtered = MOCK_TRANSACTIONS.filter(tx => 
      (filterType === "all" || tx.type === filterType) &&
      (filterStatus === "all" || tx.status === filterStatus) &&
      (tx.title.toLowerCase().includes(search.toLowerCase()) || 
       tx.sender?.toLowerCase().includes(search.toLowerCase()) ||
       tx.receiver?.toLowerCase().includes(search.toLowerCase()))
  );

  const handleRefresh = () => {
      setIsRefreshing(true);
      setTimeout(() => setIsRefreshing(false), 1200);
  };

  return (
    <>
      <div className="space-y-8 pb-12">
        <div className="flex justify-between items-center px-1">
             <h3 className="font-bold text-sm tracking-widest uppercase text-white/40">Financial Overview</h3>
             <button 
                 onClick={handleRefresh}
                 className="flex items-center gap-2 text-white/40 hover:text-white transition-colors"
             >
                 <RefreshCw size={12} className={isRefreshing ? "animate-spin text-blue-400" : ""} />
                 <span className="text-[10px] font-bold uppercase tracking-widest">{isRefreshing ? 'Syncing...' : 'Refresh'}</span>
             </button>
        </div>

        {/* Financial Insights */}
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="p-4 rounded-[24px] bg-white/[0.03] border border-white/5">
             <div className="flex items-center gap-2 text-white/40 mb-2">
                <ArrowDownLeft size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Earnings (7d)</span>
             </div>
             <div className="text-lg font-black text-green-400">+₦40,000</div>
          </div>
          <div className="p-4 rounded-[24px] bg-white/[0.03] border border-white/5">
             <div className="flex items-center gap-2 text-white/40 mb-2">
                <ArrowUpRight size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Spent (30d)</span>
             </div>
             <div className="text-lg font-black text-white">₦15,000</div>
          </div>
          <div className="p-4 rounded-[24px] bg-white/[0.03] border border-white/5">
             <div className="flex items-center gap-2 text-white/40 mb-2">
                <Lock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">In Escrow</span>
             </div>
             <div className="text-lg font-black text-blue-400">₦80,000</div>
          </div>
          <div className="p-4 rounded-[24px] bg-white/[0.03] border border-white/5">
             <div className="flex items-center gap-2 text-white/40 mb-2">
                <Clock size={14} />
                <span className="text-[10px] font-bold uppercase tracking-widest">Pending Payout</span>
             </div>
             <div className="text-lg font-black text-white/80">₦40,000</div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="space-y-4">
          <div className="flex gap-3">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" size={16} />
                <input 
                  placeholder="Search transactions..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full bg-white/[0.03] border border-white/10 rounded-full py-3.5 pl-12 pr-4 text-xs font-bold outline-none focus:border-blue-500/50 transition-colors"
                />
             </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest ml-1 mr-2 shrink-0">Type</span>
              {["all", TransactionType.ESCROW_RELEASE, TransactionType.WITHDRAWAL, TransactionType.BOOKING_PAYMENT, TransactionType.ESCROW_FUNDED, TransactionType.AWAITING_APPROVAL].map(type => (
                <button 
                   key={type}
                   onClick={() => setFilterType(type as any)}
                   className={`px-4 py-2 rounded-full whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0 ${
                      filterType === type ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                   }`}
                >
                   {type.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
            
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 items-center">
              <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest ml-1 mr-2 shrink-0">State</span>
              {["all", TransactionStatus.COMPLETED, TransactionStatus.PENDING, TransactionStatus.PROCESSING, TransactionStatus.FAILED, TransactionStatus.DISPUTED].map(status => (
                <button 
                   key={status}
                   onClick={() => setFilterStatus(status as any)}
                   className={`px-4 py-2 rounded-full whitespace-nowrap text-[10px] font-bold uppercase tracking-widest transition-colors shrink-0 ${
                      filterStatus === status ? 'bg-white text-black' : 'bg-white/5 text-white/40 hover:bg-white/10 hover:text-white'
                   }`}
                >
                   {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Activity List */}
        <div className="space-y-3 relative">
          <div className="absolute left-[24px] top-4 bottom-4 w-px bg-white/[0.05] -z-10" />
          <AnimatePresence>
              {filtered.length === 0 ? (
                <motion.div 
                   initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                   className="text-center py-12 px-6"
                >
                   <div className="w-16 h-16 mx-auto bg-white/5 rounded-full flex items-center justify-center mb-4 text-white/20">
                      <Search size={24} />
                   </div>
                   <h3 className="text-white font-bold mb-2">No activity found</h3>
                   <p className="text-white/40 text-[10px] uppercase tracking-widest font-bold">Your wallet activity will appear here once you start booking or earning.</p>
                </motion.div>
              ) : (
                filtered.map((tx, i) => (
                   <motion.div 
                      key={tx.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                   >
                     <TransactionCard tx={tx} onClick={setSelectedTx} />
                   </motion.div>
                ))
              )}
          </AnimatePresence>
        </div>
      </div>
      
      <AnimatePresence>
        {selectedTx && (
          <TransactionDetailView tx={selectedTx} onClose={() => setSelectedTx(null)} />
        )}
      </AnimatePresence>
    </>
  );
}
