import { motion, AnimatePresence } from "motion/react";
import { 
  Wallet, 
  ArrowUpRight, 
  ArrowDownLeft, 
  ArrowRightLeft,
  Clock, 
  ShieldCheck, 
  ChevronRight, 
  X, 
  Info, 
  Bitcoin,
  DollarSign,
  ChevronDown,
  CalendarDays
} from "lucide-react";
import { useState } from "react";
import DepositFlow from "./DepositFlow";
import WithdrawalFlow from "./WithdrawalFlow";
import ActivityFeed from "./ActivityFeed";

// ... [Removed MOCK_TRANSACTIONS and Transaction interface]

export default function WalletHub({ onClose }: { onClose?: () => void }) {
  const [balanceView, setBalanceView] = useState<"fiat" | "crypto" | "escrow">("fiat");
  const [activeTab, setActiveTab] = useState<"history" | "stats">("history");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full w-full bg-[#050505] text-white p-6 pb-32 overflow-y-auto no-scrollbar relative z-[80]"
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

      {/* View Toggle */}
      <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 mb-6 relative">
        {(["fiat", "crypto", "escrow"] as const).map((view) => (
          <button
            key={view}
            onClick={() => setBalanceView(view)}
            className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${
              balanceView === view ? "text-black" : "text-white/40 hover:text-white"
            }`}
          >
            {view}
            {balanceView === view && (
              <motion.div 
                layoutId="balanceViewBg" 
                className="absolute inset-0 bg-white rounded-xl -z-10"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main Balance Card */}
      <section className="mb-6">
        <div className="p-8 rounded-[40px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden shadow-2xl">
          <div className={`absolute top-0 right-0 w-48 h-48 blur-[100px] rounded-full opacity-50 ${
             balanceView === 'fiat' ? 'bg-blue-500' : 
             balanceView === 'crypto' ? 'bg-orange-500' : 
             'bg-purple-500'
          }`} transition="all 0.5s ease" />
          
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <Wallet size={24} className="text-white/40" />
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">
                    {balanceView === 'fiat' ? 'Total Fiat Balance' : balanceView === 'crypto' ? 'Total Crypto Balance' : 'Funds in Escrow'}
                  </span>
                </div>
             </div>

             <div className="mb-2">
                <h3 className="text-5xl font-display font-black tracking-tight leading-none flex items-baseline gap-2">
                  {balanceView === 'fiat' && <span>$1,240.50</span>}
                  {balanceView === 'crypto' && <span>0.045</span>}
                  {balanceView === 'escrow' && <span>$99.00</span>}
                </h3>
             </div>

             <button className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors w-max">
                {balanceView === 'crypto' ? <Bitcoin size={14} className="text-orange-400" /> : <DollarSign size={14} className="text-blue-400" />}
                <span className="text-[10px] font-black tracking-widest uppercase">
                   {balanceView === 'crypto' ? 'BTC' : 'USD'}
                </span>
                <ChevronDown size={14} className="text-white/40 ml-1" />
             </button>
          </div>
        </div>
      </section>

      {/* Action Buttons */}
      <section className="grid grid-cols-3 gap-3 mb-8">
        <button 
          onClick={() => setShowDeposit(true)}
          className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowDownLeft size={20} className="text-white" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Deposit</span>
        </button>
        <button 
          onClick={() => setShowWithdrawal(true)}
          className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-colors group"
        >
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowUpRight size={20} className="text-white" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Withdraw</span>
        </button>
        <button className="flex flex-col items-center justify-center p-4 bg-white/5 hover:bg-white/10 border border-white/10 rounded-3xl transition-colors group">
          <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
            <ArrowRightLeft size={20} className="text-white" />
          </div>
          <span className="text-[9px] font-black uppercase tracking-widest">Transfer</span>
        </button>
      </section>

      {/* Bookings Wallet Activity Link */}
      <section className="mb-8">
        <button className="w-full p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between hover:bg-blue-500/20 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
               <CalendarDays size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
               <h4 className="text-sm font-bold text-blue-400 mb-1">View Bookings Activity</h4>
               <p className="text-[10px] text-blue-400/60 font-medium tracking-wide">Manage jobs, payments, and release funds.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-blue-400/50 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </button>
      </section>

      {/* Tabs / Transactions */}
      <div className="flex gap-8 mb-6 border-b border-white/5 px-2">
         <button 
           onClick={() => setActiveTab("history")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'history' ? 'text-white' : 'text-white/30'}`}
         >
            Recent Transactions
            {activeTab === "history" && (
               <motion.div layoutId="activeWalletTab2" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "history" && (
          <motion.div
            key="history-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ActivityFeed />
          </motion.div>
        )}
      </AnimatePresence>

      <DepositFlow isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      <WithdrawalFlow isOpen={showWithdrawal} onClose={() => setShowWithdrawal(false)} />
    </motion.div>
  );
}

