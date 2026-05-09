import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  History, 
  X, 
  Info, 
  CheckCircle2,
  TrendingUp,
  CreditCard
} from "lucide-react";
import { useState } from "react";

interface Transaction {
  id: string;
  type: "payment" | "earning" | "withdrawal" | "refund";
  amount: string;
  status: "completed" | "pending" | "escrow";
  date: string;
  entity: string;
  description: string;
}

const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: "TX-9912",
    type: "payment",
    amount: "-$99.00",
    status: "escrow",
    date: "Today, 2:30 PM",
    entity: "Marcus V.",
    description: "UI/UX Specialist Review"
  },
  {
    id: "TX-8821",
    type: "earning",
    amount: "+$120.00",
    status: "completed",
    date: "Yesterday",
    entity: "Jordan K.",
    description: "Logo Design Delivery"
  },
  {
    id: "TX-7734",
    type: "withdrawal",
    amount: "-$250.00",
    status: "completed",
    date: "May 06, 2026",
    entity: "Bank Account •••• 4242",
    description: "Standard Payout"
  },
  {
    id: "TX-6645",
    type: "payment",
    amount: "-$45.00",
    status: "completed",
    date: "May 04, 2026",
    entity: "Elena S.",
    description: "Photography Session"
  }
];

export default function WalletHub({ onClose }: { onClose?: () => void }) {
  const [activeTab, setActiveTab] = useState<"history" | "stats">("history");
  const [showWithdrawDetail, setShowWithdrawDetail] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="min-h-screen bg-[#050505] text-white p-6 pb-32 overflow-y-auto no-scrollbar relative z-[80]"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center mb-8 pt-4">
        <div className="flex items-center gap-4">
          {onClose && (
            <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">Wallet</h2>
            <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Financial Identity Hub</p>
          </div>
        </div>
        <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
           <Info size={18} />
        </div>
      </header>

      {/* Balance Card */}
      <section className="mb-10">
        <div className="p-8 rounded-[40px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 blur-[100px] rounded-full" />
          
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-12">
                <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/5 flex items-center gap-2">
                   <ShieldCheck size={12} className="text-blue-400" />
                   <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Protected by Hustle Escrow</span>
                </div>
                <Wallet size={24} className="text-white/20" />
             </div>

             <div className="mb-10">
                <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mb-2">Available Balance</p>
                <h3 className="text-5xl font-display font-black tracking-tight leading-none">$1,240.50</h3>
             </div>

             <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setShowWithdrawDetail(true)}
                  className="h-14 rounded-2xl bg-white text-black flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] active:scale-95 transition-transform"
                >
                   <ArrowUpRight size={16} />
                   Withdraw
                </button>
                <button className="h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center gap-2 font-black uppercase tracking-widest text-[10px] hover:bg-white/10 transition-colors">
                   <ArrowDownLeft size={16} />
                   Deposit
                </button>
             </div>
          </div>
        </div>
      </section>

      {/* Escrow Visualization */}
      <section className="mb-12 p-6 rounded-[32px] bg-blue-500/5 border border-blue-500/10 flex items-center justify-between">
         <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
               <Clock size={24} className="text-blue-400" />
            </div>
            <div>
               <p className="text-[9px] font-black uppercase tracking-widest text-blue-400/40">In Escrow</p>
               <h4 className="text-xl font-display font-black text-blue-400 leading-tight">$99.00</h4>
            </div>
         </div>
         <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest max-w-[100px] text-right">
            Funds held securely until job completion
         </p>
      </section>

      {/* Tabs */}
      <div className="flex gap-8 mb-6 border-b border-white/5 px-2">
         <button 
           onClick={() => setActiveTab("history")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'history' ? 'text-white' : 'text-white/30'}`}
         >
            Transaction History
            {activeTab === "history" && (
               <motion.div layoutId="activeWalletTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
         <button 
           onClick={() => setActiveTab("stats")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'stats' ? 'text-white' : 'text-white/30'}`}
         >
            Insights
            {activeTab === "stats" && (
               <motion.div layoutId="activeWalletTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "history" ? (
          <motion.div
            key="history-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-col gap-3"
          >
            {MOCK_TRANSACTIONS.map((tx) => (
              <div 
                key={tx.id}
                className="p-5 rounded-3xl bg-white/[0.03] border border-white/5 flex items-center gap-4 hover:bg-white/[0.05] transition-all group"
              >
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
                   tx.type === 'earning' ? 'bg-green-500/10 text-green-400' :
                   tx.type === 'withdrawal' ? 'bg-white/5 text-white/40' :
                   'bg-white/5 text-white'
                }`}>
                   {tx.type === 'earning' && <ArrowDownLeft size={20} />}
                   {tx.type === 'payment' && <ArrowUpRight size={20} />}
                   {tx.type === 'withdrawal' && <ArrowUpRight size={20} />}
                </div>

                <div className="flex-1 min-w-0">
                   <div className="flex justify-between items-baseline mb-1">
                      <h4 className="font-bold text-sm truncate">{tx.entity}</h4>
                      <span className={`text-sm font-display font-black ${
                         tx.type === 'earning' ? 'text-green-400' : 'text-white'
                      }`}>{tx.amount}</span>
                   </div>
                   <div className="flex items-center gap-2">
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest truncate">{tx.description}</p>
                      {tx.status === 'escrow' && (
                         <span className="flex items-center gap-1 text-[8px] font-black uppercase px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded-full border border-blue-500/10">
                            <Clock size={8} /> Escrow
                         </span>
                      )}
                   </div>
                </div>
              </div>
            ))}
          </motion.div>
        ) : (
          <motion.div
            key="insights-view"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="grid grid-cols-1 gap-4"
          >
            <div className="p-8 rounded-[32px] bg-white/[0.03] border border-white/10 text-center">
               <TrendingUp size={32} className="mx-auto text-green-400 mb-4" />
               <h4 className="text-3xl font-display font-black tracking-tight leading-none mb-2">+$4,200</h4>
               <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Life-time Earnings</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
               <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5">
                  <p className="text-xl font-display font-black leading-none mb-1">12</p>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Jobs Completed</p>
               </div>
               <div className="p-6 rounded-[32px] bg-white/[0.03] border border-white/5">
                  <p className="text-xl font-display font-black leading-none mb-1">4.9</p>
                  <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest">Trust Rating</p>
               </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Withdrawal Overlay */}
      <AnimatePresence>
         {showWithdrawDetail && (
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed inset-0 z-[100] bg-black p-8 flex flex-col pt-16"
            >
               <div className="grain-overlay pointer-events-none" />
               <header className="flex justify-between items-center mb-12">
                  <div>
                    <h3 className="text-2xl font-display font-black uppercase tracking-tight">Withdraw Funds</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Safe Transfer to Bank</p>
                  </div>
                  <button onClick={() => setShowWithdrawDetail(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                    <X size={24} />
                  </button>
               </header>

               <div className="flex-1 flex flex-col items-center justify-center gap-12">
                  <div className="text-center">
                     <p className="text-[10px] text-white/20 font-bold uppercase tracking-[0.4em] mb-4">Amount to Withdraw</p>
                     <div className="flex items-baseline gap-2">
                        <span className="text-3xl font-display text-white/40">$</span>
                        <h4 className="text-7xl font-display font-black tracking-tighter">500.00</h4>
                     </div>
                  </div>

                  <div className="w-full space-y-3">
                     <div className="p-6 rounded-3xl bg-white/[0.05] border border-white/20 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center shadow-xl">
                              <CreditCard size={24} className="text-white/40" />
                           </div>
                           <div className="text-left">
                              <h5 className="font-bold text-sm">Chase Bank •••• 4242</h5>
                              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest">Instant Payout Available</p>
                           </div>
                        </div>
                        <div className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center">
                           <div className="w-2.5 h-2.5 bg-white rounded-full" />
                        </div>
                     </div>
                  </div>
               </div>

               <footer className="mt-auto space-y-6">
                  <div className="flex items-center gap-3 px-2">
                     <ShieldCheck size={18} className="text-blue-400" />
                     <p className="text-[10px] text-white/30 font-medium leading-relaxed tracking-wide">
                        Transfers are secured by multi-party validation. Funds typically arrive in 5-15 mins.
                     </p>
                  </div>
                  <button 
                    onClick={() => setShowWithdrawDetail(false)}
                    className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-white/5 active:scale-95 transition-transform"
                  >
                     Confirm Withdrawal
                  </button>
               </footer>
            </motion.div>
         )}
      </AnimatePresence>
    </motion.div>
  );
}
