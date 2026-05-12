import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ArrowUpRight, ArrowDownLeft, ShieldCheck, History, 
  Wallet, DollarSign, CreditCard, Banknote, Landmark, 
  TrendingUp, Clock, CheckCircle2, AlertCircle, ChevronRight,
  Info, Lock, Zap, PieChart, BadgeCheck, FileText, MoreHorizontal
} from "lucide-react";

interface WalletHubProps {
  onClose: () => void;
}

type CurrencyType = 'fiat' | 'crypto';
type TransactionStatus = 'completed' | 'pending' | 'escrow' | 'rejected';

interface Transaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'earning' | 'payment' | 'tip';
  amount: number;
  currency: string;
  status: TransactionStatus;
  date: string;
  title: string;
  sub: string;
}

export default function WalletHub({ onClose }: WalletHubProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'escrow' | 'history'>('overview');
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);

  const [isReceiptOpen, setIsReceiptOpen] = useState<Transaction | null>(null);

  const balances = {
    total: 45280.50,
    fiat: 12400.00,
    crypto: 0.85, // ETH or USDT
    escrow: 8500.00,
    pending: 1200.00
  };

  const transactions: Transaction[] = [
    { id: '1', type: 'earning', amount: 450, currency: 'USD', status: 'completed', date: '2h ago', title: 'UI Design Service', sub: 'Released from Escrow' },
    { id: '2', type: 'payment', amount: -120, currency: 'USD', status: 'escrow', date: '5h ago', title: 'Content Research', sub: 'Held in Escrow' },
    { id: '3', type: 'tip', amount: 25, currency: 'USD', status: 'completed', date: 'Yesterday', title: 'Livestream Tip', sub: 'from @Felix' },
    { id: '4', type: 'withdrawal', amount: -1000, currency: 'USD', status: 'pending', date: '2 days ago', title: 'Bank Withdrawal', sub: 'Processing...' },
  ];

  const escrows = [
    { id: 'e1', job: 'Custom Web Development', hustler: '@Felix', amount: 2500, progress: 65, status: 'In Progress', protected: true },
    { id: 'e2', job: 'Logo Branding Suite', hustler: '@Sarah', amount: 800, progress: 100, status: 'Ready for Release', protected: true },
  ];

  return (
    <div className="fixed inset-0 z-[110] bg-[#050505] text-white flex flex-col font-sans overflow-hidden">
      {/* Dynamic Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/5 via-transparent to-black pointer-events-none" />
      <div className="noise-overlay opacity-[0.03]" />

      {/* Header */}
      <header className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Wallet size={20} className="text-white" />
          </div>
          <div>
             <h1 className="text-sm font-black uppercase tracking-tight italic">Hustle Financial</h1>
             <div className="flex items-center gap-1.5">
                <ShieldCheck size={10} className="text-emerald-400" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/40">Secure & Verified</span>
             </div>
          </div>
        </div>
        <button 
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-colors"
        >
          <X size={20} />
        </button>
      </header>

      {/* Internal Navigation */}
      <nav className="relative z-10 flex px-6 py-4 gap-8 border-b border-white/5 bg-black/20">
        {[
          { id: 'overview', label: 'Overview', icon: <PieChart size={14} /> },
          { id: 'escrow', label: 'Escrow Control', icon: <Lock size={14} /> },
          { id: 'history', label: 'Transaction Feed', icon: <History size={14} /> },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex items-center gap-2 py-2 relative group transition-colors ${activeTab === tab.id ? 'text-white' : 'text-white/40 hover:text-white/60'}`}
          >
            {tab.icon}
            <span className="text-[10px] font-black uppercase tracking-widest">{tab.label}</span>
            {activeTab === tab.id && (
              <motion.div 
                layoutId="activeWalletTab"
                className="absolute bottom-[-17px] left-0 right-0 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]" 
              />
            )}
          </button>
        ))}
      </nav>

      {/* Main Content Area */}
      <main className="relative z-10 flex-1 overflow-y-auto no-scrollbar p-6">
        <AnimatePresence mode="wait">
          {activeTab === 'overview' && (
            <motion.div 
              key="overview"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col gap-8"
            >
              {/* Unified Balance Card */}
              <section className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                   <TrendingUp size={120} className="text-emerald-500" strokeWidth={1} />
                </div>
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Consolidated Assets</p>
                    <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 rounded-full border border-emerald-500/20">
                       <div className="w-1 h-1 bg-emerald-500 rounded-full animate-pulse" />
                       <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Live Rates Active</span>
                    </div>
                  </div>
                  <div className="flex items-baseline gap-2 mb-8">
                     <span className="text-2xl font-black text-white/40">$</span>
                     <h2 className="text-6xl font-display font-black tracking-tighter italic">
                       {balances.total.toLocaleString()}
                     </h2>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="bg-white/5 border border-white/5 rounded-3xl p-5 hover:bg-white/10 transition-colors">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Fiat Account (NGN)</p>
                        <div className="flex items-center justify-between">
                           <span className="text-lg font-black tracking-tighter">₦{ (balances.fiat * 1600).toLocaleString() }</span>
                           <Zap size={14} className="text-yellow-500 opacity-60" />
                        </div>
                     </div>
                     <div className="bg-white/5 border border-white/5 rounded-3xl p-5 hover:bg-white/10 transition-colors">
                        <p className="text-[9px] font-black uppercase tracking-widest text-white/30 mb-2">Crypto (USDT)</p>
                        <div className="flex items-center justify-between">
                           <span className="text-lg font-black tracking-tighter">{ (balances.crypto * 1000).toLocaleString() } USDT</span>
                           <div className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center">
                              <DollarSign size={10} className="text-emerald-500" />
                           </div>
                        </div>
                     </div>
                  </div>
                </div>
              </section>

              {/* Quick Actions Flow */}
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsDepositOpen(true)}
                  className="bg-emerald-500 py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 shadow-lg shadow-emerald-500/20 active-scale group overflow-hidden"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <ArrowDownLeft size={24} className="text-white" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Add Funds</span>
                </button>
                <button 
                  onClick={() => setIsWithdrawOpen(true)}
                  className="bg-white/5 border border-white/10 py-6 rounded-[2rem] flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all active-scale group"
                >
                  <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                     <ArrowUpRight size={24} className="text-white/60" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest">Withdraw</span>
                </button>
              </div>

              {/* Escrow Spotlight */}
              <section className="mt-4">
                 <div className="flex justify-between items-center mb-5 px-2">
                    <div className="flex items-center gap-2">
                       <Lock size={14} className="text-blue-400" />
                       <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Held in Protection</h3>
                    </div>
                    <button onClick={() => setActiveTab('escrow')} className="text-[9px] font-black uppercase text-blue-400 tracking-widest">Full Control</button>
                 </div>
                 <div className="bg-blue-500/5 border border-blue-500/20 p-6 rounded-[2.5rem] flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                          <DollarSign size={24} />
                       </div>
                       <div>
                          <p className="text-[9px] font-black uppercase tracking-widest text-blue-400 mb-1">Escrow Balance</p>
                          <h4 className="text-2xl font-black tracking-tighter">${balances.escrow.toLocaleString()}</h4>
                       </div>
                    </div>
                    <div className="text-right">
                       <p className="text-[10px] font-bold text-white/40 uppercase mb-1">2 Active Jobs</p>
                       <div className="flex -space-x-2 justify-end">
                          <div className="w-6 h-6 rounded-full border-2 border-black bg-white/10 overflow-hidden">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="User" />
                          </div>
                          <div className="w-6 h-6 rounded-full border-2 border-black bg-white/10 overflow-hidden">
                             <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah" alt="User" />
                          </div>
                       </div>
                    </div>
                 </div>
              </section>

              {/* Security Hint */}
              <div className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex items-start gap-4">
                 <BadgeCheck size={24} className="text-emerald-400 shrink-0" />
                 <div>
                    <h4 className="text-xs font-black uppercase mb-1">Hustle Shield Active</h4>
                    <p className="text-[10px] text-white/40 leading-relaxed font-medium">All creator payments are held by our automated escrow system and only released when the job is completed and approved.</p>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'escrow' && (
            <motion.div 
               key="escrow"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               exit={{ opacity: 0, scale: 1.05 }}
               className="flex flex-col gap-6"
            >
               <div className="p-6 bg-blue-500/10 border border-blue-500/20 rounded-[2.5rem] mb-2">
                  <h3 className="text-2xl font-black tracking-tighter mb-2 italic">Automated Escrow</h3>
                  <p className="text-xs text-white/40 leading-relaxed font-medium">Manage funds for active bookings. Money is safely locked until milestones are reached.</p>
               </div>

               <div className="flex flex-col gap-4">
                  {escrows.map((item) => (
                    <div key={item.id} className="bg-white/5 border border-white/5 p-6 rounded-[2.5rem] group hover:border-blue-500/30 transition-all">
                       <div className="flex justify-between items-start mb-6">
                          <div className="flex items-center gap-3">
                             <div className="w-10 h-10 rounded-full border-2 border-blue-500 p-0.5">
                                <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${item.hustler}`} alt="Hustler" className="w-full h-full rounded-full" />
                             </div>
                             <div>
                                <h4 className="text-xs font-black uppercase tracking-tight">{item.job}</h4>
                                <span className="text-[9px] font-bold text-white/40 uppercase">{item.hustler} • Client</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <span className="text-lg font-black tracking-tighter">${item.amount.toLocaleString()}</span>
                             <div className="flex items-center gap-1 justify-end mt-1">
                                <Clock size={10} className="text-blue-400" />
                                <span className="text-[8px] font-black uppercase text-blue-400">{item.status}</span>
                             </div>
                          </div>
                       </div>

                       {/* Milestone Progress */}
                       <div className="space-y-2 mb-6">
                          <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-white/30">
                             <span>Milestone Progress</span>
                             <span>{item.progress}%</span>
                          </div>
                          <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                             <motion.div 
                               initial={{ width: 0 }}
                               animate={{ width: `${item.progress}%` }}
                               className="h-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
                             />
                          </div>
                       </div>

                       <div className="flex gap-3">
                          <button className="flex-1 py-3 rounded-2xl bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest hover:bg-white/10 transition-colors">View Details</button>
                          {item.progress === 100 ? (
                            <button className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest shadow-lg shadow-emerald-500/20 active-scale">Release Funds</button>
                          ) : (
                            <button className="flex-1 py-3 rounded-2xl bg-white text-black text-[9px] font-black uppercase tracking-widest active-scale">Dispute</button>
                          )}
                       </div>
                    </div>
                  ))}
               </div>

               <div className="mt-4 p-8 border-2 border-dashed border-white/5 rounded-[3rem] flex flex-col items-center gap-4 opacity-40">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                     <AlertCircle size={32} />
                  </div>
                  <p className="text-[10px] font-black uppercase tracking-[0.2em]">No More Active Protected Payments</p>
               </div>
            </motion.div>
          )}

          {activeTab === 'history' && (
            <motion.div 
               key="history"
               initial={{ opacity: 0, x: 10 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -10 }}
               className="flex flex-col gap-6"
            >
               <div className="sticky top-0 bg-black/40 backdrop-blur-xl py-4 z-20 flex justify-between items-center px-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">Audit Timeline</h3>
                  <button className="text-[9px] font-bold text-emerald-400 uppercase tracking-widest flex items-center gap-2">
                     <FileText size={14} /> Export CSV
                  </button>
               </div>

               <div className="flex flex-col gap-1">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="relative pl-8 pb-8 last:pb-0 group">
                       {/* Timeline Line */}
                       <div className="absolute left-[11px] top-4 bottom-0 w-[2px] bg-white/5 group-last:hidden" />
                       
                       {/* Timeline Dot */}
                       <div className={`absolute left-0 top-1 w-6 h-6 rounded-full border-2 border-black flex items-center justify-center z-10 ${
                         tx.status === 'completed' ? 'bg-emerald-500/20' : 
                         tx.status === 'escrow' ? 'bg-blue-500/20' : 
                         'bg-white/10'
                       }`}>
                          {tx.status === 'completed' ? <CheckCircle2 size={12} className="text-emerald-500" /> : 
                           tx.status === 'escrow' ? <Lock size={12} className="text-blue-500" /> :
                           <Clock size={12} className="text-white/40" />}
                       </div>

                       <div 
                          onClick={() => setIsReceiptOpen(tx)}
                          className="bg-white/5 border border-white/5 rounded-3xl p-5 group-hover:bg-white/10 transition-all flex items-center justify-between active-scale cursor-pointer"
                       >
                          <div>
                             <h4 className="text-xs font-black uppercase tracking-tight mb-1">{tx.title}</h4>
                             <div className="flex items-center gap-3 text-[9px] font-bold text-white/30 uppercase">
                                <span>{tx.date}</span>
                                <div className="w-1 h-1 bg-white/10 rounded-full" />
                                <span>{tx.sub}</span>
                             </div>
                          </div>
                          <div className="text-right">
                             <div className={`text-md font-black tracking-tighter ${tx.amount > 0 ? 'text-emerald-400' : 'text-white'}`}>
                                {tx.amount > 0 ? '+' : ''}${Math.abs(tx.amount).toLocaleString()}
                             </div>
                             <div className={`text-[8px] font-black uppercase tracking-widest ${
                               tx.status === 'completed' ? 'text-emerald-500/60' : 
                               tx.status === 'escrow' ? 'text-blue-500/60' : 
                               'text-white/20'
                             }`}>
                                {tx.status}
                             </div>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Persistent Summary Footer */}
      <footer className="px-6 py-8 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex justify-between items-center safe-bottom relative z-[120]">
        <div className="flex items-center gap-4">
           <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
              <Zap size={24} />
           </div>
           <div>
              <p className="text-[10px] font-black uppercase text-white/40 tracking-widest mb-1">Instant Payout Available</p>
              <div className="flex items-center gap-2">
                 <span className="text-xs font-black italic tracking-tighter text-emerald-400">$1,240.00 REVENUE READY</span>
                 <ArrowRight size={14} className="text-emerald-400" />
              </div>
           </div>
        </div>
        <button className="px-6 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest active-scale">
           Transfer
        </button>
      </footer>

      {/* Simple Modals for Deposit/Withdraw */}
      <AnimatePresence>
        {isReceiptOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/95 backdrop-blur-xl flex items-center justify-center p-6"
            onClick={() => setIsReceiptOpen(null)}
          >
             <motion.div 
               initial={{ scale: 0.9, opacity: 0 }}
               animate={{ scale: 1, opacity: 1 }}
               exit={{ scale: 0.9, opacity: 0 }}
               className="w-full max-w-sm bg-white text-black rounded-[3rem] p-8 flex flex-col items-center gap-6 shadow-2xl relative overflow-hidden"
               onClick={e => e.stopPropagation()}
             >
                <div className="absolute top-0 inset-x-0 h-2 bg-emerald-500" />
                <div className="w-full flex justify-between items-center mb-2">
                   <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                         <Wallet size={16} className="text-white" />
                      </div>
                      <span className="text-[10px] font-black uppercase tracking-widest">Hustle Receipt</span>
                   </div>
                   <button onClick={() => setIsReceiptOpen(null)} className="p-2 hover:bg-black/5 rounded-full transition-colors">
                      <X size={20} />
                   </button>
                </div>

                <div className="flex flex-col items-center gap-1 border-b border-black/5 w-full pb-8">
                   <p className="text-[11px] font-bold text-black/40 uppercase tracking-widest">{isReceiptOpen.title}</p>
                   <h3 className="text-5xl font-black tracking-tighter italic">
                     {isReceiptOpen.amount > 0 ? '+' : ''}${Math.abs(isReceiptOpen.amount).toLocaleString()}
                   </h3>
                   <div className={`mt-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${
                     isReceiptOpen.status === 'completed' ? 'bg-emerald-100 text-emerald-600' : 
                     isReceiptOpen.status === 'escrow' ? 'bg-blue-100 text-blue-600' : 
                     'bg-gray-100 text-gray-500'
                   }`}>
                      {isReceiptOpen.status}
                   </div>
                </div>

                <div className="w-full space-y-4">
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Date</span>
                      <span className="text-xs font-black uppercase">{isReceiptOpen.date}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Transaction ID</span>
                      <span className="text-xs font-mono font-bold">HS-{(Math.random() * 10000).toFixed(0)}</span>
                   </div>
                   <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold text-black/30 uppercase tracking-widest">Reference</span>
                      <span className="text-xs font-black uppercase">{isReceiptOpen.sub}</span>
                   </div>
                   <div className="pt-4 border-t border-dashed border-black/10 flex justify-between items-center">
                      <span className="text-[10px] font-black uppercase tracking-widest">Net Outcome</span>
                      <span className="text-sm font-black">${Math.abs(isReceiptOpen.amount).toLocaleString()}</span>
                   </div>
                </div>

                <div className="w-full h-12 bg-black text-white rounded-2xl flex items-center justify-center gap-2 group cursor-pointer active-scale">
                   <FileText size={16} />
                   <span className="text-[9px] font-black uppercase tracking-widest">Download Official PDF</span>
                </div>

                <p className="text-[8px] text-center text-black/30 leading-relaxed font-medium">
                   This receipt acts as a proof of transaction within the Hustle Financial Ecosystem. All funds are secured and audited per protocol.
                </p>
             </motion.div>
          </motion.div>
        )}

        {(isDepositOpen || isWithdrawOpen) && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-md flex items-end justify-center px-6 pb-12"
            onClick={() => { setIsDepositOpen(false); setIsWithdrawOpen(false); }}
          >
             <motion.div 
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                exit={{ y: 100 }}
                className="w-full bg-[#111] border border-white/10 rounded-[3rem] p-8 flex flex-col gap-8 shadow-2xl"
                onClick={e => e.stopPropagation()}
             >
                <div className="flex justify-between items-center">
                   <h3 className="text-2xl font-black tracking-tighter italic uppercase">{isDepositOpen ? 'Add Funds' : 'Withdraw Funds'}</h3>
                   <button onClick={() => { setIsDepositOpen(false); setIsWithdrawOpen(false); }} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
                      <X size={16} />
                   </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <button className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-4 group hover:bg-white/10 transition-colors">
                      <Landmark size={24} className="text-blue-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Bank Transfer</span>
                   </button>
                   <button className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-4 group hover:bg-white/10 transition-colors">
                      <CreditCard size={24} className="text-purple-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Debit Card</span>
                   </button>
                   <button className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-4 group hover:bg-white/10 transition-colors">
                      <Zap size={24} className="text-emerald-400" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Crypto (USDT)</span>
                   </button>
                   <button className="bg-white/5 border border-white/5 p-6 rounded-[2rem] flex flex-col items-center gap-4 group hover:bg-white/10 transition-colors">
                      <Banknote size={24} className="text-yellow-500" />
                      <span className="text-[9px] font-black uppercase tracking-widest">USDC Direct</span>
                   </button>
                </div>

                <div className="bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-3xl flex items-center gap-3">
                   <Info size={16} className="text-emerald-500 shrink-0" />
                   <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">Transactions are processed via secure marketplace relay.</p>
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ArrowRight({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5l7 7-7 7" />
    </svg>
  );
}
