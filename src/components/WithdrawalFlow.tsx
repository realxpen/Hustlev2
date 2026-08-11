import { motion, AnimatePresence } from "motion/react";
import { 
  X, 
  ChevronLeft, 
  ChevronRight,
  DollarSign, 
  Bitcoin, 
  CreditCard, 
  Landmark, 
  CheckCircle2, 
  Copy, 
  AlertTriangle,
  ArrowRight,
  Clock,
  Loader2,
  Check,
  ShieldCheck,
  Lock,
  ArrowUpRight,
  History,
  ShieldAlert,
  Info,
  Calendar,
  Hash,
  ExternalLink,
  ShieldQuestion,
  Fingerprint
} from "lucide-react";
import { useState, useEffect } from "react";
import PaymentConfirmationModal from "./PaymentConfirmationModal";
import TrustBadge from "./TrustBadge";

interface WithdrawalFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

type WithdrawalStep = 
  | "selection" 
  | "fiat_amount" 
  | "fiat_method" 
  | "fiat_status" 
  | "fiat_confirm"
  | "crypto_select"
  | "crypto_address"
  | "crypto_status"
  | "crypto_confirm";

type StatusState = "pending" | "processing" | "approved" | "completed" | "failed";

const SAVED_BANKS = [
  { id: "bank-1", name: "Chase Bank", account: "•••• 4242", isInstant: true },
  { id: "bank-2", name: "Wells Fargo", account: "•••• 8821", isInstant: false }
];

const SAVED_WALLETS = [
  { id: "wallet-1", label: "Burner Wallet", address: "0x71C7...8976F" },
  { id: "wallet-2", label: "Ledger Nano", address: "bc1qxy...0wlh" }
];

export default function WithdrawalFlow({ isOpen, onClose }: WithdrawalFlowProps) {
  const [step, setStep] = useState<WithdrawalStep>("selection");
  const [direction, setDirection] = useState(1);
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [selectedBank, setSelectedBank] = useState(SAVED_BANKS[0].id);
  const [cryptoType, setCryptoType] = useState<"BTC" | "ETH" | "USDT">("BTC");
  const [cryptoAddress, setCryptoAddress] = useState("");
  const [txStatus, setTxStatus] = useState<StatusState>("pending");
  const [showBreakdown, setShowBreakdown] = useState(false);
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

  // Simulation handlers
  const handleFiatSimulate = () => {
    setIsConfirmModalOpen(false);
    simulateWithdrawal('fiat');
  };

  const handleCryptoSimulate = () => {
    setIsConfirmModalOpen(false);
    simulateWithdrawal('crypto');
  };

  // Reset flow when opened
  useEffect(() => {
    if (isOpen) {
      setStep("selection");
      setAmount("");
      setTxStatus("pending");
      setCryptoAddress("");
    }
  }, [isOpen]);

  const navigateTo = (nextStep: WithdrawalStep) => {
    setDirection(1);
    setStep(nextStep);
  };

  const goBackTo = (prevStep: WithdrawalStep) => {
    setDirection(-1);
    setStep(prevStep);
  };

  const simulateWithdrawal = (type: 'fiat' | 'crypto') => {
    if (type === 'fiat') {
      navigateTo("fiat_status");
      setTxStatus("processing");
      setTimeout(() => setTxStatus("approved"), 2000);
      setTimeout(() => setTxStatus("completed"), 4000);
    } else {
      navigateTo("crypto_status");
      setTxStatus("pending");
      setTimeout(() => setTxStatus("processing"), 2500);
      setTimeout(() => setTxStatus("completed"), 5000);
    }
  };

  const variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 50 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -50 })
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[110] bg-black p-6 flex flex-col pt-16 overflow-y-auto overflow-x-hidden no-scrollbar"
      >
        <div className="grain-overlay pointer-events-none" />

        {/* Header */}
        <header className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3">
            {step !== "selection" && !["fiat_status", "crypto_status"].includes(step) && (
              <button 
                onClick={() => {
                   if (step === "fiat_amount" || step === "crypto_select") goBackTo("selection");
                   if (step === "fiat_method") goBackTo("fiat_amount");
                   if (step === "crypto_address") goBackTo("crypto_select");
                }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h3 className="text-2xl font-display font-black uppercase tracking-tight">Withdraw</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {step === "selection" ? "Choose Payout Method" : "Transfer Funds"}
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
          >
            <X size={20} />
          </button>
        </header>

        {/* Balance Breakdown Strip */}
        <section className="mb-8 shrink-0">
           <div className="p-5 rounded-3xl bg-white/[0.03] border border-white/10">
              <div className="flex justify-between items-center mb-4">
                 <div>
                    <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block mb-1">Available to Withdraw</span>
                    <h4 className="text-3xl font-display font-black text-white">$1,240.50</h4>
                 </div>
                 <button 
                  onClick={() => setShowBreakdown(!showBreakdown)}
                  className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center"
                 >
                    <Info size={18} className={showBreakdown ? "text-blue-400" : "text-white/40"} />
                 </button>
              </div>

              <AnimatePresence>
                {showBreakdown && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="space-y-3 pt-4 border-t border-white/5">
                       <div className="flex justify-between items-center text-[11px] font-medium">
                          <span className="text-white/40 flex items-center gap-2 italic">
                             <Lock size={12} className="text-blue-400/60" /> Escrow Balance
                          </span>
                          <span className="text-white/60">$450.00</span>
                       </div>
                       <div className="flex justify-between items-center text-[11px] font-medium">
                          <span className="text-white/40 flex items-center gap-2 italic">
                             <Clock size={12} className="text-orange-400/60" /> Pending Payouts
                          </span>
                          <span className="text-white/60">$120.00</span>
                       </div>
                       <p className="text-[9px] text-white/20 mt-2 italic leading-relaxed">
                          Escrow funds are released upon job completion. Pending withdrawals are currently processing at the network level.
                       </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
           </div>
        </section>

        {/* Main Content Area */}
        <div className="flex-1 relative">
          <AnimatePresence mode="wait" custom={direction}>
            
            {/* STEP: SELECTION */}
            {step === "selection" && (
              <motion.div
                key="selection"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col gap-4"
              >
                <button
                  onClick={() => navigateTo("fiat_amount")}
                  className="w-full relative overflow-hidden p-6 rounded-[32px] bg-white/[0.03] border border-white/10 flex items-center gap-6 group hover:bg-white/[0.05] transition-colors text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <Landmark size={28} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-display font-black tracking-tight mb-1">Local Bank</h4>
                    <p className="text-[11px] text-white/40 font-medium tracking-wide">Direct payout to your Chase or Wells Fargo</p>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                </button>

                <button
                  onClick={() => navigateTo("crypto_select")}
                  className="w-full relative overflow-hidden p-6 rounded-[32px] bg-white/[0.03] border border-white/10 flex items-center gap-6 group hover:bg-white/[0.05] transition-colors text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:scale-110 transition-transform">
                    <Bitcoin size={28} className="text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-display font-black tracking-tight mb-1">Crypto Wallet</h4>
                    <p className="text-[11px] text-white/40 font-medium tracking-wide">Send BTC, ETH, or USDT to external addresses</p>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-colors" />
                </button>

                <div className="mt-8 px-4 flex items-start gap-3">
                   <ShieldCheck size={16} className="text-white/20 mt-1" />
                   <p className="text-[10px] text-white/20 font-medium leading-relaxed italic">
                      Payouts are secured by multi-party identity validation. withdrawals are only allowed to verified accounts.
                   </p>
                </div>
              </motion.div>
            )}

            {/* STEP: FIAT AMOUNT */}
            {step === "fiat_amount" && (
              <motion.div
                key="fiat_amount"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full"
              >
                <div className="flex-1 flex flex-col justify-center items-center py-10">
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mb-6">Enter Amount</span>
                  
                  <div className="flex items-center gap-4 mb-2">
                    <div className="text-6xl font-display font-black tracking-tighter text-white opacity-40">$</div>
                    <input 
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent text-7xl font-display font-black tracking-tighter w-full max-w-[250px] outline-none text-white placeholder-white/20"
                      autoFocus
                    />
                  </div>
                  <button 
                    onClick={() => setAmount("1240.50")}
                    className="text-[10px] text-blue-400/60 hover:text-blue-400 font-black uppercase tracking-widest mb-12"
                  >
                    Max Amount: $1,240.50
                  </button>

                  <div className="flex gap-2 p-1 bg-white/5 rounded-full border border-white/10">
                    {["USD", "NGN", "EUR"].map(curr => (
                      <button
                        key={curr}
                        onClick={() => setCurrency(curr)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors ${
                          currency === curr ? "bg-white text-black" : "text-white/40 hover:text-white"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  disabled={!amount || Number(amount) <= 0 || Number(amount) > 1240.50}
                  onClick={() => navigateTo("fiat_method")}
                  className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex justify-center items-center disabled:opacity-20 transition-all font-display"
                >
                  Continue
                </button>
              </motion.div>
            )}

            {/* STEP: FIAT METHOD */}
            {step === "fiat_method" && (
              <motion.div
                key="fiat_method"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full"
              >
                <div className="mb-12">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-6 px-2">Select Destination Bank</h4>
                  <div className="space-y-3">
                    {SAVED_BANKS.map(bank => (
                      <button
                        key={bank.id}
                        onClick={() => setSelectedBank(bank.id)}
                        className={`w-full p-6 rounded-[24px] border flex items-center gap-5 transition-all text-left ${
                          selectedBank === bank.id ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/50" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                        }`}
                      >
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${selectedBank === bank.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                          <Landmark size={24} />
                        </div>
                        <div className="flex-1">
                          <h5 className="font-bold text-base mb-1">{bank.name}</h5>
                          <p className="text-[10px] text-white/40 font-medium">{bank.account} • {bank.isInstant ? "Instant Available" : "Standard Transfer"}</p>
                        </div>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${selectedBank === bank.id ? 'border-blue-400' : 'border-white/20'}`}>
                          {selectedBank === bank.id && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />}
                        </div>
                      </button>
                    ))}

                    <button className="w-full p-5 mt-4 rounded-2xl border border-dashed border-white/10 text-white/40 flex items-center justify-center gap-3 hover:text-white hover:border-white/30 transition-all text-[11px] font-black uppercase tracking-widest">
                       <Plus size={14} /> Add New Bank Account
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl mt-auto font-display flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Fingerprint size={18} />
                  Review & Secure Transfer
                </button>
              </motion.div>
            )}

            {/* STEP: FIAT CONFIRMATION */}
            {step === "fiat_confirm" && (
              <motion.div
                key="fiat_confirm"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full"
              >
                <div className="p-8 rounded-[40px] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 mb-8 mt-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl opacity-50" />
                  
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] block text-center mb-4">Total to Withdraw</span>
                  <h3 className="text-6xl font-display font-black text-center mb-10 tracking-tighter">${amount}</h3>

                  <div className="space-y-5 pt-8 border-t border-white/5">
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-white/30 font-bold uppercase tracking-widest">Destination</span>
                       <span className="font-bold">{SAVED_BANKS.find(b => b.id === selectedBank)?.name} • Account</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-white/30 font-bold uppercase tracking-widest">Payout Fee</span>
                       <span className="font-bold text-green-400">Free</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-white/30 font-bold uppercase tracking-widest">Est. Arrival</span>
                       <span className="font-bold flex items-center gap-2">
                          <Clock size={12} className="text-orange-400" />
                          1 - 24 Hours
                        </span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-black border-t border-white/5 pt-6 mt-2 font-display">
                       <span className="uppercase tracking-tight text-white/60">Final Payout</span>
                       <span>${Number(amount).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-6 py-4 bg-blue-500/10 border border-blue-500/20 rounded-3xl flex items-start gap-4 mb-8">
                  <ShieldCheck size={20} className="text-blue-400 mt-1 shrink-0" />
                  <div className="flex-1">
                     <p className="text-[11px] font-bold text-blue-400/90 leading-normal mb-1 italic">Identity Protection Active</p>
                     <p className="text-[10px] leading-relaxed text-blue-400/60 font-medium">Hustle verifies withdrawals twice for your security. Your funds are protected during transit.</p>
                  </div>
                </div>

                <button 
                  onClick={() => simulateWithdrawal('fiat')}
                  className="w-full h-16 bg-blue-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_40px_rgba(59,130,246,0.3)] mt-auto font-display flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <ArrowUpRight size={18} />
                  Withdraw Funds Now
                </button>
              </motion.div>
            )}

            {/* STEP: FIAT STATUS */}
            {step === "fiat_status" && (
              <motion.div
                key="fiat_status"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full items-center justify-center pb-12"
              >
                <div className="w-full max-w-xs">
                   <div className="mb-12 text-center">
                      <div className="w-24 h-24 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mx-auto mb-6 relative">
                         {txStatus === "processing" ? (
                            <motion.div 
                               animate={{ rotate: 360 }} 
                               transition={{ duration: 3, ease: "linear", repeat: Infinity }}
                               className="absolute inset-0 rounded-full border-t-2 border-blue-500"
                            />
                         ) : txStatus === "completed" ? (
                            <motion.div 
                              initial={{ scale: 0 }} 
                              animate={{ scale: 1 }} 
                              className="w-full h-full rounded-full bg-green-500 flex items-center justify-center shadow-[0_0_30px_rgba(34,197,94,0.4)]"
                            >
                               <Check size={40} className="text-black" />
                            </motion.div>
                         ) : null}
                         <Landmark size={32} className={`relative z-10 transition-opacity ${txStatus === 'completed' ? 'opacity-0' : 'text-blue-400'}`} />
                      </div>
                      <h3 className="text-2xl font-display font-black tracking-tight mb-2">
                        {txStatus === "processing" ? "Processing..." : txStatus === "approved" ? "Almost Ready" : "Payout Successful"}
                      </h3>
                      <p className="text-[11px] text-white/40 font-medium px-4">
                        {txStatus === "processing" ? "Hustle security team is reviewing your withdrawal request." : 
                         txStatus === "approved" ? "Request approved. Transmitting funds to Chase Bank." : 
                         "Your funds have been sent. Check your account in 3-15 mins."}
                      </p>
                   </div>

                   <div className="space-y-4 px-2">
                      <div className="flex items-center gap-4 group">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${txStatus !== 'processing' ? 'bg-white border-white text-black' : 'border-blue-500/40 text-blue-400 animate-pulse'}`}>
                             {txStatus !== 'processing' ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                         </div>
                         <div className="flex-1 border-b border-white/5 pb-4">
                            <h5 className="text-[11px] font-black uppercase tracking-widest">Request Review</h5>
                            <p className="text-[10px] text-white/20 italic">Validated by safety protocols</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${['approved', 'completed'].includes(txStatus) ? 'bg-white border-white text-black' : txStatus === 'approved' ? 'border-blue-500/40 text-blue-400 animate-pulse' : 'border-white/10 text-white/10'}`}>
                             {['approved', 'completed'].includes(txStatus) ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                         </div>
                         <div className="flex-1 border-b border-white/5 pb-4">
                            <h5 className={`text-[11px] font-black uppercase tracking-widest ${['approved', 'completed'].includes(txStatus) ? '' : 'text-white/20'}`}>Approved</h5>
                            <p className="text-[10px] text-white/20 italic italic">Transmitting to partner bank</p>
                         </div>
                      </div>

                      <div className="flex items-center gap-4 group">
                         <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 border transition-all ${txStatus === 'completed' ? 'bg-green-500 border-green-500 text-black' : 'border-white/10 text-white/10'}`}>
                             {txStatus === 'completed' ? <Check size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                         </div>
                         <div className="flex-1 pb-4">
                            <h5 className={`text-[11px] font-black uppercase tracking-widest ${txStatus === 'completed' ? 'text-green-400' : 'text-white/20'}`}>Completed</h5>
                            <p className="text-[10px] text-white/20 italic italic italic">Wallet balance updated</p>
                         </div>
                      </div>
                   </div>

                   {txStatus === "completed" && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-12 space-y-4">
                       <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center italic">
                          <span className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Transaction ID</span>
                          <code className="text-[10px] text-blue-400 font-bold">HS-992-TX</code>
                       </div>
                       <button onClick={onClose} className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs font-display">
                        Back to Wallet
                       </button>
                    </motion.div>
                   )}
                </div>
              </motion.div>
            )}

            {/* STEP: CRYPTO SELECT */}
            {step === "crypto_select" && (
              <motion.div
                key="crypto_select"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full"
              >
                <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-8 px-1 italic">Withdraw to External Wallet</h4>
                
                <div className="space-y-4">
                  {[
                    { id: "BTC", name: "Bitcoin", icon: Bitcoin, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                    { id: "ETH", name: "Ethereum", icon: () => <div className="w-5 h-7 border-2 border-current rounded-full" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                    { id: "USDT", name: "Tether (USDT)", icon: DollarSign, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" }
                  ].map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => { setCryptoType(asset.id as any); navigateTo("crypto_address"); }}
                      className="w-full p-6 rounded-[34px] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-5">
                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${asset.bg} ${asset.color} ${asset.border} border ring-4 ring-black`}>
                          <asset.icon size={26} />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-lg mb-1">{asset.name}</h5>
                          <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">{asset.id} Network</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-white/20 group-hover:text-white transition-transform group-hover:translate-x-1" />
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP: CRYPTO ADDRESS */}
            {step === "crypto_address" && (
              <motion.div
                key="crypto_address"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full"
              >
                <div className="mb-8">
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] block mb-6 px-1">Recipient Address</span>
                  
                  <div className="relative mb-6">
                    <input 
                      type="text"
                      placeholder={`Paste your ${cryptoType} address`}
                      value={cryptoAddress}
                      onChange={(e) => setCryptoAddress(e.target.value)}
                      className="w-full h-18 bg-white/[0.03] border border-white/10 rounded-3xl px-6 text-sm font-mono tracking-wider focus:border-orange-500/50 outline-none transition-colors pr-14"
                    />
                    <button 
                       onClick={async () => {
                          const text = await navigator.clipboard.readText();
                          setCryptoAddress(text);
                       }}
                       className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-lg bg-orange-500/10 text-orange-400 flex items-center justify-center hover:bg-orange-500/30 transition-colors"
                    >
                       <span className="text-[9px] font-black uppercase">Paste</span>
                    </button>
                  </div>

                  <h5 className="text-[10px] font-black uppercase tracking-widest text-white/20 mb-4 px-1 italic">Saved Addresses</h5>
                  <div className="space-y-3">
                    {SAVED_WALLETS.map(wallet => (
                      <button
                        key={wallet.id}
                        onClick={() => setCryptoAddress(wallet.address)}
                        className={`w-full p-4 rounded-2xl border flex items-center justify-between transition-all ${
                          cryptoAddress === wallet.address ? "bg-orange-500/10 border-orange-500/30" : "bg-white/[0.02] border-white/5"
                        }`}
                      >
                        <div className="text-left">
                           <p className="font-bold text-xs mb-1">{wallet.label}</p>
                           <p className="text-[10px] font-mono text-white/30">{wallet.address}</p>
                        </div>
                        {cryptoAddress === wallet.address && <Check size={14} className="text-orange-400" />}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="px-5 py-4 bg-orange-500/10 border border-orange-500/20 rounded-3xl flex items-start gap-4 mb-4">
                  <ShieldAlert size={20} className="text-orange-400 mt-0.5 shrink-0" />
                  <div className="flex-1">
                     <p className="text-[11px] font-black text-orange-400 leading-tight mb-1 italic uppercase tracking-wider">Security Notice</p>
                     <p className="text-[10px] leading-relaxed text-orange-400/60 font-medium">Please ensure the address is correct for the <strong className="text-orange-400">{cryptoType} network</strong>. Assets sent to incorrect addresses cannot be recovered by Hustle staff.</p>
                  </div>
                </div>

                <button 
                  disabled={!cryptoAddress || cryptoAddress.length < 10}
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl mt-auto disabled:opacity-20 font-display transition-all flex items-center justify-center gap-3 active:scale-95"
                >
                  <Fingerprint size={18} />
                  Confirm Dest. & Transmit
                </button>
              </motion.div>
            )}

            {/* STEP: CRYPTO CONFIRM */}
            {step === "crypto_confirm" && (
              <motion.div
                key="crypto_confirm"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full"
              >
                <div className="p-8 rounded-[40px] bg-gradient-to-b from-white/[0.03] to-transparent border border-white/10 mb-8 mt-4 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 blur-3xl opacity-50" />
                  
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] block text-center mb-4">You're Sending</span>
                  <div className="flex flex-col items-center mb-10">
                     <h3 className="text-6xl font-display font-black text-center tracking-tighter">0.024</h3>
                     <span className="text-[12px] font-black uppercase tracking-widest text-orange-400">Bitcoin (BTC)</span>
                  </div>

                  <div className="space-y-6 pt-8 border-t border-white/5">
                    <div className="flex justify-between items-start text-xs">
                       <span className="text-white/30 font-bold uppercase tracking-widest mt-0.5 shrink-0">Recipient</span>
                       <span className="font-mono text-[10px] text-right break-all text-white/60 max-w-[180px] leading-relaxed">
                          {cryptoAddress}
                       </span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-white/30 font-bold uppercase tracking-widest">Network Fee</span>
                       <span className="font-bold text-orange-400">0.0001 BTC</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                       <span className="text-white/30 font-bold uppercase tracking-widest">Est. Confirmation</span>
                       <span className="font-bold">~10-30 Mins</span>
                    </div>
                  </div>
                </div>

                <div className="p-5 bg-white/5 border border-white/10 rounded-3xl flex items-center gap-4 mb-8 italic">
                   <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                      <ShieldCheck size={20} className="text-white/40" />
                   </div>
                   <p className="text-[10px] text-white/30 font-medium">Hustle SecureNode is broadcasting this transition safely.</p>
                </div>

                <button 
                  onClick={() => simulateWithdrawal('crypto')}
                  className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs font-display flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <ArrowUpRight size={18} />
                  Confirm and Send Crypto
                </button>
              </motion.div>
            )}

            {/* STEP: CRYPTO STATUS */}
            {step === "crypto_status" && (
              <motion.div
                key="crypto_status"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full items-center justify-center pb-12"
              >
                <div className="w-full max-w-xs">
                   <div className="mb-14 text-center">
                      <div className="w-24 h-24 rounded-full border border-white/10 flex items-center justify-center mx-auto mb-6 relative overflow-hidden">
                         {txStatus !== 'completed' ? (
                            <motion.div 
                               animate={{ rotate: 360 }} 
                               transition={{ duration: 4, ease: "linear", repeat: Infinity }}
                               className="absolute inset-x-0 bottom-0 h-1/2 bg-orange-500/20 blur-xl opacity-50"
                            />
                         ) : (
                            <motion.div 
                              initial={{ scale: 0 }} animate={{ scale: 1 }} 
                              className="w-full h-full bg-green-500 flex items-center justify-center"
                            >
                               <CheckCircle2 size={40} className="text-black" />
                            </motion.div>
                         )}
                         <Bitcoin size={32} className={`relative z-10 ${txStatus === 'completed' ? 'opacity-0' : 'text-orange-400'}`} />
                      </div>
                      <h3 className="text-2xl font-display font-black tracking-tight mb-2">
                        {txStatus === "pending" ? "Broadcasting..." : txStatus === "processing" ? "Confirming..." : "Transfer Complete"}
                      </h3>
                      <p className="text-[11px] text-white/40 font-medium italic">
                        {txStatus === "pending" ? "Transaction is being sent to the Bitcoin blockchain." : 
                         txStatus === "processing" ? "Waiting for 1/3 network confirmations." : 
                         "Success! 0.024 BTC has been sent to your wallet."}
                      </p>
                   </div>

                   <div className="space-y-3 mb-10 px-2 italic">
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-white/20 uppercase tracking-widest font-black">Status</span>
                         <span className={`font-black uppercase flex items-center gap-1.5 ${txStatus === 'completed' ? 'text-green-400' : 'text-orange-400'}`}>
                            {txStatus === "pending" && <Loader2 size={10} className="animate-spin" />}
                            {txStatus === "processing" && <Loader2 size={10} className="animate-spin" />}
                            {txStatus}
                         </span>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-white/20 uppercase tracking-widest font-black">TX Hash</span>
                         <code className="text-blue-400 hover:underline cursor-pointer flex items-center gap-1">
                            0x71...5f6 <ExternalLink size={10} />
                         </code>
                      </div>
                      <div className="flex justify-between items-center text-[10px]">
                         <span className="text-white/20 uppercase tracking-widest font-black">Network</span>
                         <span className="text-white/60">Bitcoin Core</span>
                      </div>
                   </div>

                   {txStatus === "completed" && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col gap-4">
                       <button onClick={onClose} className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs font-display">
                        Finish Withdrawal
                       </button>
                    </motion.div>
                   )}
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {/* FIAT CONFIRMATION MODAL */}
        <PaymentConfirmationModal 
          isOpen={isConfirmModalOpen && ["fiat_amount", "fiat_method"].includes(step)}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleFiatSimulate}
          title="Bank Withdrawal Review"
          amount={Number(amount)}
          recipient={SAVED_BANKS.find(b => b.id === selectedBank)?.name}
          fees={0}
          estimatedArrival="1 - 24 Hours"
          actionType="withdrawal"
          description={`Your payout to ${SAVED_BANKS.find(b => b.id === selectedBank)?.name} will be processed via secured bank channels.`}
        />

        {/* CRYPTO CONFIRMATION MODAL */}
        <PaymentConfirmationModal 
          isOpen={isConfirmModalOpen && ["crypto_select", "crypto_address"].includes(step)}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleCryptoSimulate}
          title="Crypto Transfer Review"
          amount={Number(amount) || 0.024}
          recipient={`${cryptoType} Network: ${cryptoAddress.substring(0, 10)}...`}
          fees={0.0001}
          estimatedArrival="10 - 30 Mins"
          actionType="withdrawal"
          description="Blockchain transactions are irreversible. Verification of recipient address is required."
        />
      </motion.div>
    </AnimatePresence>
  );
}

function Plus({ size, className }: { size: number, className?: string }) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="3" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  );
}
