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
  CalendarDays,
  Coins,
  RefreshCw,
  History,
  Lock,
  BadgeCheck,
  Shield
} from "lucide-react";
import { useState } from "react";
import DepositFlow from "./DepositFlow";
import WithdrawalFlow from "./WithdrawalFlow";
import ActivityFeed from "./ActivityFeed";
import JobEscrowList from "./JobEscrowList";
import SwapFlow from "./SwapFlow";
import AccountSafetyCenter from "./AccountSafetyCenter";
import TrustBadge from "./TrustBadge";

type CurrencyType = {
  code: string;
  symbol: string;
  name: string;
  type: "fiat" | "crypto";
  icon: any;
};

const CURRENCIES: CurrencyType[] = [
  { code: "NGN", symbol: "₦", name: "Nigerian Naira", type: "fiat", icon: DollarSign },
  { code: "USD", symbol: "$", name: "US Dollar", type: "fiat", icon: DollarSign },
  { code: "GBP", symbol: "£", name: "British Pound", type: "fiat", icon: DollarSign },
  { code: "EUR", symbol: "€", name: "Euro", type: "fiat", icon: DollarSign },
  { code: "BTC", symbol: "₿", name: "Bitcoin", type: "crypto", icon: Bitcoin },
  { code: "ETH", symbol: "Ξ", name: "Ethereum", type: "crypto", icon: Coins },
  { code: "USDT", symbol: "₮", name: "Tether", type: "crypto", icon: DollarSign },
];

const MOCK_BALANCES: Record<string, number> = {
  "NGN": 1240500,
  "USD": 850,
  "BTC": 0.0452,
  "ETH": 1.2405,
  "USDT": 840.50,
  "GBP": 0,
  "EUR": 0,
};

export default function WalletHub({ onClose }: { onClose?: () => void }) {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyType>(CURRENCIES[0]);
  const [showCurrencySelector, setShowCurrencySelector] = useState(false);
  const [activeTab, setActiveTab] = useState<"history" | "assets">("history");
  const [showDeposit, setShowDeposit] = useState(false);
  const [showWithdrawal, setShowWithdrawal] = useState(false);
  const [showSwap, setShowSwap] = useState(false);
  const [showEscrowList, setShowEscrowList] = useState(false);
  const [isSafetyCenterOpen, setIsSafetyCenterOpen] = useState(false);

  const getBalance = () => {
    // Simulated conversion logic
    if (selectedCurrency.type === 'crypto') {
      if (selectedCurrency.code === "BTC") return "0.0452";
      if (selectedCurrency.code === "ETH") return "1.2405";
      if (selectedCurrency.code === "USDT") return "840.50";
    }

    // Fiat base (NGN)
    const base = 1240500;
    switch(selectedCurrency.code) {
      case "USD": return (base / 1500).toLocaleString(undefined, { minimumFractionDigits: 2 });
      case "GBP": return (base / 1900).toLocaleString(undefined, { minimumFractionDigits: 2 });
      case "EUR": return (base / 1650).toLocaleString(undefined, { minimumFractionDigits: 2 });
      default: return base.toLocaleString();
    }
  };

  const getEscrowBalance = () => {
    const base = 120000;
    if (selectedCurrency.code === "USD") return (base / 1500).toLocaleString(undefined, { minimumFractionDigits: 2 });
    if (selectedCurrency.code === "BTC") return (base / 95000000).toLocaleString(undefined, { maximumFractionDigits: 6 });
    return base.toLocaleString();
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="h-full w-full bg-[#050505] text-white p-6 pb-32 overflow-y-auto no-scrollbar relative"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center mb-8 pt-4 relative z-10">
        <div className="flex items-center gap-4">
          {onClose && (
            <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}
          <div>
            <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">Wallet</h2>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">System Secure</p>
            </div>
          </div>
        </div>
        <button 
           onClick={() => setIsSafetyCenterOpen(true)}
           className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all text-blue-400 shadow-lg shadow-blue-500/5 transition-all"
        >
          <ShieldCheck size={20} />
        </button>
      </header>

      {/* Trust Visibility Banner */}
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 py-2.5 px-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-center justify-center gap-3"
      >
        <Lock size={12} className="text-blue-400" />
        <span className="text-[9px] font-black uppercase tracking-widest text-blue-400/80">Funds are Protected by Hustle Shield™ • Your wallet activity is encrypted</span>
      </motion.div>

      {/* Main Balance Card */}
      <section className="mb-6">
        <div className="p-8 rounded-[40px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 relative overflow-hidden shadow-2xl">
          <div className={`absolute top-0 right-0 w-48 h-48 blur-[100px] rounded-full opacity-50 ${selectedCurrency.type === 'crypto' ? 'bg-orange-500' : 'bg-blue-500'}`} transition="all 0.5s ease" />
          
          <div className="relative z-10">
             <div className="flex justify-between items-start mb-6">
                <div className="flex items-center gap-2">
                  <Wallet size={24} className="text-white/40" />
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.3em]">
                    Available Balance
                  </span>
                </div>
             </div>

             <div className="mb-2">
                <h3 className="text-5xl font-display font-black tracking-tight leading-none flex items-baseline gap-2">
                  <span className="text-2xl text-white/40 font-bold">{selectedCurrency.symbol}</span>
                  <span>{getBalance()}</span>
                </h3>
             </div>

             <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/10">
               <button 
                  onClick={() => setShowCurrencySelector(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full transition-colors w-max"
               >
                  {selectedCurrency.type === 'crypto' ? <Bitcoin size={14} className="text-orange-400" /> : <DollarSign size={14} className="text-blue-400" />}
                  <span className="text-[10px] font-black tracking-widest uppercase">
                     {selectedCurrency.code}
                  </span>
                  <ChevronDown size={14} className="text-white/40 ml-1" />
               </button>

               <div className="w-px h-6 bg-white/10" />

               <button
                  onClick={() => setShowEscrowList(true)}
                  className="flex items-center gap-2 hover:opacity-80 transition-opacity"
               >
                 <Lock size={14} className="text-blue-400" />
                 <span className="text-[10px] font-bold text-white/60">
                   In Escrow: <span className="text-white">{selectedCurrency.symbol}{getEscrowBalance()}</span>
                 </span>
                 <ChevronRight size={14} className="text-white/20" />
               </button>
             </div>
          </div>
        </div>
      </section>

      {/* Currency Selector Modal */}
      <AnimatePresence>
        {showCurrencySelector && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/90 flex items-end justify-center p-4 backdrop-blur-md"
            onClick={() => setShowCurrencySelector(false)}
          >
            <motion.div 
              initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
              className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-8 border-b border-white/5 flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-display font-black">Change Currency</h3>
                  <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Select your preferred asset</p>
                </div>
                <button onClick={() => setShowCurrencySelector(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <X size={18} />
                </button>
              </div>

              <div className="p-4 max-h-[60vh] overflow-y-auto no-scrollbar">
                <div className="space-y-2">
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4 mb-2 block">Standard Currencies</span>
                  {CURRENCIES.filter(c => c.type === 'fiat').map(currency => (
                    <button
                      key={currency.code}
                      onClick={() => { setSelectedCurrency(currency); setShowCurrencySelector(false); }}
                      className={`w-full flex items-center justify-between p-4 rounded-3xl transition-colors ${selectedCurrency.code === currency.code ? 'bg-blue-500 text-white' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCurrency.code === currency.code ? 'bg-white/20' : 'bg-white/5'}`}>
                           <currency.icon size={16} />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">{currency.name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedCurrency.code === currency.code ? 'text-white/60' : 'text-white/40'}`}>{currency.code}</p>
                        </div>
                      </div>
                      <span className="text-lg font-black">{currency.symbol}</span>
                    </button>
                  ))}

                  <div className="h-4" />
                  <span className="text-[9px] font-black uppercase tracking-widest text-white/20 ml-4 mb-2 block">Crypto Assets</span>
                  {CURRENCIES.filter(c => c.type === 'crypto').map(currency => (
                    <button
                      key={currency.code}
                      onClick={() => { setSelectedCurrency(currency); setShowCurrencySelector(false); }}
                      className={`w-full flex items-center justify-between p-4 rounded-3xl transition-colors ${selectedCurrency.code === currency.code ? 'bg-orange-500 text-white' : 'hover:bg-white/5'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedCurrency.code === currency.code ? 'bg-white/20' : 'bg-white/5'}`}>
                           {currency.code === 'BTC' ? <Bitcoin size={18} /> : currency.code === 'ETH' ? <Coins size={18} /> : <DollarSign size={18} />}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold">{currency.name}</p>
                          <p className={`text-[10px] font-bold uppercase tracking-widest ${selectedCurrency.code === currency.code ? 'text-white/60' : 'text-white/40'}`}>{currency.code}</p>
                        </div>
                      </div>
                      <span className="text-lg font-black">{currency.symbol}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action Buttons */}
      <section className="grid grid-cols-4 gap-3 mb-8">
        <button 
           onClick={() => setShowDeposit(true)}
           className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors"
        >
           <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center">
              <ArrowUpRight size={20} className="text-green-500" />
           </div>
           <span className="text-[9px] font-bold text-white uppercase tracking-widest">Add</span>
        </button>
        <button 
           onClick={() => setShowWithdrawal(true)}
           className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors"
        >
           <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
              <ArrowDownLeft size={20} className="text-red-500" />
           </div>
           <span className="text-[9px] font-bold text-white uppercase tracking-widest">Out</span>
        </button>
        <button 
           onClick={() => setShowSwap(true)}
           className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors"
        >
           <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center">
              <RefreshCw size={20} className="text-blue-400" />
           </div>
           <span className="text-[9px] font-bold text-white uppercase tracking-widest">Swap</span>
        </button>
        <button className="flex flex-col items-center gap-3 p-4 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/10 transition-colors opacity-50">
           <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center">
              <History size={20} className="text-purple-400" />
           </div>
           <span className="text-[9px] font-bold text-white uppercase tracking-widest">Pay</span>
        </button>
      </section>

      {/* Bookings Wallet Activity Link */}
      <section className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-4">
        <button 
           onClick={() => setShowEscrowList(true)}
           className="w-full p-5 rounded-3xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-between hover:bg-blue-500/20 transition-colors group text-left"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]">
               <ShieldCheck size={20} className="text-blue-400" />
            </div>
            <div className="text-left">
               <h4 className="text-sm font-bold text-blue-400 mb-1">Escrow & Jobs</h4>
               <p className="text-[10px] text-blue-400/60 font-medium tracking-wide">Review milestones and releases.</p>
            </div>
          </div>
          <ChevronRight size={20} className="text-blue-400/50 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </button>

        <div className="w-full p-5 rounded-3xl bg-white/[0.02] border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
             <BadgeCheck size={20} className="text-white/40" />
          </div>
          <div>
             <h4 className="text-sm font-bold text-white/90 mb-1 leading-none flex items-center gap-2">
                Verified Account
                <TrustBadge type="verified" size="xs" showLabel={false} />
             </h4>
             <p className="text-[10px] text-white/30 font-medium tracking-wide">Higher limits & instant payouts.</p>
          </div>
        </div>
      </section>

      {/* Tabs / Transactions */}
      <div className="flex gap-8 mb-6 border-b border-white/5 px-2">
         {(["history", "assets"] as const).map((tab) => (
           <button 
             key={tab}
             onClick={() => setActiveTab(tab)}
             className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === tab ? 'text-white' : 'text-white/30'}`}
           >
              {tab === 'history' ? 'Recent Transactions' : 'Your Assets'}
              {activeTab === tab && (
                 <motion.div layoutId="activeWalletTab2" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
              )}
           </button>
         ))}
      </div>

      <AnimatePresence mode="wait">
        {activeTab === "history" ? (
          <motion.div
            key="history-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <ActivityFeed />
          </motion.div>
        ) : (
          <motion.div
            key="assets-list"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-3 pb-24"
          >
            {CURRENCIES.filter(c => MOCK_BALANCES[c.code] > 0).map(asset => (
              <div 
                key={asset.code}
                className="p-4 rounded-[24px] bg-white/[0.03] border border-white/5 flex items-center justify-between hover:bg-white/[0.05] transition-colors"
                onClick={() => {
                  setSelectedCurrency(asset);
                }}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${asset.type === 'crypto' ? 'bg-orange-500/10 text-orange-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    <asset.icon size={18} />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{asset.name}</p>
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/40">{asset.code}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">{asset.symbol}{MOCK_BALANCES[asset.code].toLocaleString()}</p>
                  <p className="text-[10px] font-medium text-white/40 uppercase tracking-widest">
                    {asset.type === 'crypto' ? 'Network Confirmed' : 'Available'}
                  </p>
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      <DepositFlow isOpen={showDeposit} onClose={() => setShowDeposit(false)} />
      <WithdrawalFlow isOpen={showWithdrawal} onClose={() => setShowWithdrawal(false)} />
      <SwapFlow isOpen={showSwap} onClose={() => setShowSwap(false)} />
      
      <AnimatePresence>
          {showEscrowList && <JobEscrowList onClose={() => setShowEscrowList(false)} />}
      </AnimatePresence>
      <AnimatePresence>
        {isSafetyCenterOpen && (
          <AccountSafetyCenter onClose={() => setIsSafetyCenterOpen(false)} />
        )}
      </AnimatePresence>
    </motion.div>
  );
}

