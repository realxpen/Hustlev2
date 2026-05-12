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
  ShieldQuestion,
  Fingerprint
} from "lucide-react";
import { useState, useEffect } from "react";
import PaymentConfirmationModal from "./PaymentConfirmationModal";
import TrustBadge from "./TrustBadge";

interface DepositFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

type DepositStep = 
  | "selection" 
  | "fiat_amount" 
  | "fiat_method" 
  | "fiat_status" 
  | "crypto_select" 
  | "crypto_address" 
  | "crypto_status";

type StatusState = "pending" | "processing" | "completed" | "failed";

export default function DepositFlow({ isOpen, onClose }: DepositFlowProps) {
  const [step, setStep] = useState<DepositStep>("selection");
  const [direction, setDirection] = useState(1);
  const [fiatAmount, setFiatAmount] = useState("");
  const [fiatCurrency, setFiatCurrency] = useState("USD");
  const [paymentMethod, setPaymentMethod] = useState<"card" | "bank">("card");
  const [cryptoType, setCryptoType] = useState<"BTC" | "ETH" | "USDT">("BTC");
  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  
  const [txStatus, setTxStatus] = useState<StatusState>("pending");
  const [copied, setCopied] = useState(false);

  // Reset flow when opened
  useEffect(() => {
    if (isOpen) {
      setStep("selection");
      setFiatAmount("");
      setTxStatus("pending");
    }
  }, [isOpen]);

  const navigateTo = (nextStep: DepositStep) => {
    setDirection(1);
    setStep(nextStep);
  };

  const goBackTo = (prevStep: DepositStep) => {
    setDirection(-1);
    setStep(prevStep);
  };

  const handleCopy = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirmFiat = () => {
    setIsConfirmModalOpen(false);
    simulateFiatDeposit();
  };

  const simulateFiatDeposit = () => {
    navigateTo("fiat_status");
    setTxStatus("processing");
    setTimeout(() => {
      setTxStatus("completed");
    }, 2500);
  };

  const simulateCryptoDeposit = () => {
    navigateTo("crypto_status");
    setTxStatus("pending");
    setTimeout(() => {
      setTxStatus("processing");
      setTimeout(() => {
        setTxStatus("completed");
      }, 3000);
    }, 2000);
  };

  const variants = {
    initial: (dir: number) => ({ opacity: 0, x: dir * 20 }),
    animate: { opacity: 1, x: 0 },
    exit: (dir: number) => ({ opacity: 0, x: dir * -20 })
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 25, stiffness: 200 }}
        className="fixed inset-0 z-[100] bg-black p-6 flex flex-col pt-16 overflow-y-auto"
      >
        <div className="grain-overlay pointer-events-none" />

        {/* Header */}
        <header className="flex items-center justify-between mb-8 shrink-0">
          <div className="flex items-center gap-3">
            {step !== "selection" && step !== "fiat_status" && step !== "crypto_status" && (
              <button 
                onClick={() => {
                   if (step === "fiat_amount") goBackTo("selection");
                   if (step === "fiat_method") goBackTo("fiat_amount");
                   if (step === "crypto_select") goBackTo("selection");
                   if (step === "crypto_address") goBackTo("crypto_select");
                }}
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white"
              >
                <ChevronLeft size={20} />
              </button>
            )}
            <div>
              <h3 className="text-2xl font-display font-black uppercase tracking-tight">Add Money</h3>
              <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                {step === "selection" ? "Select Currency Type" : "Wallet Deposit"}
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
                className="flex flex-col gap-4 mt-12"
              >
                <button
                  onClick={() => navigateTo("fiat_amount")}
                  className="w-full relative overflow-hidden p-6 rounded-[32px] bg-white/[0.03] border border-white/10 flex items-center gap-6 group hover:bg-white/[0.05] transition-colors text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20 group-hover:scale-110 transition-transform">
                    <DollarSign size={28} className="text-blue-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-display font-black tracking-tight mb-1">Fiat Currency</h4>
                    <p className="text-[11px] text-white/40 font-medium tracking-wide">Deposit USD, NGN via Card or Bank Transfer</p>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-white/60 transition-colors" />
                </button>

                <button
                  onClick={() => navigateTo("crypto_select")}
                  className="w-full relative overflow-hidden p-6 rounded-[32px] bg-white/[0.03] border border-white/10 flex items-center gap-6 group hover:bg-white/[0.05] transition-colors text-left"
                >
                  <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20 group-hover:scale-110 transition-transform">
                    <Bitcoin size={28} className="text-orange-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xl font-display font-black tracking-tight mb-1">Cryptocurrency</h4>
                    <p className="text-[11px] text-white/40 font-medium tracking-wide">Receive BTC, ETH, USDT from external wallets</p>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-white/60 transition-colors" />
                </button>
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
                <div className="flex-1 flex flex-col justify-center items-center py-20">
                  <span className="text-[10px] text-white/30 font-bold uppercase tracking-[0.3em] mb-6">Enter Amount</span>
                  
                  <div className="flex items-center gap-4 mb-12">
                    <div className="text-6xl font-display font-black tracking-tighter text-white opacity-40">$</div>
                    <input 
                      type="number"
                      value={fiatAmount}
                      onChange={(e) => setFiatAmount(e.target.value)}
                      placeholder="0.00"
                      className="bg-transparent text-7xl font-display font-black tracking-tighter w-full max-w-[250px] outline-none text-white placeholder-white/20"
                      autoFocus
                    />
                  </div>

                  <div className="flex gap-2 p-1 bg-white/5 rounded-full border border-white/10">
                    {["USD", "NGN", "EUR"].map(curr => (
                      <button
                        key={curr}
                        onClick={() => setFiatCurrency(curr)}
                        className={`px-6 py-2 rounded-full text-[10px] font-black tracking-widest uppercase transition-colors ${
                          fiatCurrency === curr ? "bg-white text-black" : "text-white/40 hover:text-white"
                        }`}
                      >
                        {curr}
                      </button>
                    ))}
                  </div>
                </div>

                <button 
                  disabled={!fiatAmount || Number(fiatAmount) <= 0}
                  onClick={() => navigateTo("fiat_method")}
                  className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl flex justify-center items-center disabled:opacity-30 transition-opacity"
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
                  <h4 className="text-sm font-bold uppercase tracking-widest text-white/40 mb-6 px-2">Select Payment Method</h4>
                  <div className="space-y-3">
                    <button
                      onClick={() => setPaymentMethod("card")}
                      className={`w-full p-6 rounded-[24px] border flex items-center gap-5 transition-all text-left ${
                        paymentMethod === "card" ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/50" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'card' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                        <CreditCard size={24} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-base mb-1">Debit / Credit Card</h5>
                        <p className="text-[10px] text-white/40 font-medium">Instant processing • 1.5% fee</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'card' ? 'border-blue-400' : 'border-white/20'}`}>
                        {paymentMethod === "card" && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />}
                      </div>
                    </button>

                    <button
                      onClick={() => setPaymentMethod("bank")}
                      className={`w-full p-6 rounded-[24px] border flex items-center gap-5 transition-all text-left ${
                        paymentMethod === "bank" ? "bg-blue-500/10 border-blue-500/30 ring-1 ring-blue-500/50" : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${paymentMethod === 'bank' ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-white/40'}`}>
                        <Landmark size={24} />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold text-base mb-1">Bank Transfer</h5>
                        <p className="text-[10px] text-white/40 font-medium">1-3 business days • No fee</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === 'bank' ? 'border-blue-400' : 'border-white/20'}`}>
                        {paymentMethod === "bank" && <div className="w-2.5 h-2.5 bg-blue-400 rounded-full" />}
                      </div>
                    </button>
                  </div>
                </div>

                <button 
                  onClick={() => setIsConfirmModalOpen(true)}
                  className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl mt-auto flex items-center justify-center gap-3 active:scale-95 transition-all"
                >
                  <Fingerprint size={18} />
                  Review & Secure Deposit
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
                <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/10 mb-8 mt-4">
                  <span className="text-[10px] text-white/40 font-bold uppercase tracking-[0.2em] block text-center mb-4">Deposit Amount</span>
                  <h3 className="text-5xl font-display font-black text-center mb-8">${fiatAmount}</h3>

                  <div className="space-y-4 pt-6 border-t border-white/10">
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-white/40">Method</span>
                       <span className="font-bold">{paymentMethod === "card" ? "Credit Card" : "Bank Transfer"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-white/40">Fee</span>
                       <span className="font-bold">{paymentMethod === "card" ? "$1.50" : "Free"}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                       <span className="text-white/40">Processed in</span>
                       <span className="font-bold">{paymentMethod === "card" ? "Instantly" : "1-3 days"}</span>
                    </div>
                    <div className="flex justify-between items-center text-lg font-bold border-t border-white/10 pt-4 mt-2">
                       <span>Total</span>
                       <span>${(Number(fiatAmount) + (paymentMethod === "card" ? 1.5 : 0)).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <div className="px-4 py-3 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-start gap-3 mb-8">
                  <ShieldCheck size={16} className="text-blue-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] leading-relaxed text-blue-400/80">Funds are secured by Hustle. You can manage and withdraw these funds at any time.</p>
                </div>

                <button 
                  onClick={simulateFiatDeposit}
                  className="w-full h-16 bg-blue-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_40px_rgba(59,130,246,0.3)] mt-auto"
                >
                  Confirm & Add Money
                </button>
              </motion.div>
            )}

            {/* STEP: FIAT STATUS (Processing -> Completed) */}
            {step === "fiat_status" && (
              <motion.div
                key="fiat_status"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full items-center justify-center pb-20"
              >
                <div className="w-32 h-32 relative mb-8 flex items-center justify-center">
                  {txStatus === "processing" ? (
                    <motion.div 
                      animate={{ rotate: 360 }} 
                      transition={{ duration: 2, ease: "linear", repeat: Infinity }}
                      className="w-full h-full rounded-full border-4 border-white/10 border-t-blue-500 absolute inset-0"
                    />
                  ) : (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", bounce: 0.5 }}
                      className="w-full h-full rounded-full bg-green-500/20 flex items-center justify-center"
                    >
                      <CheckCircle2 size={48} className="text-green-400" />
                    </motion.div>
                  )}
                </div>

                <h3 className="text-2xl font-display font-black tracking-tight mb-2">
                  {txStatus === "processing" ? "Processing Deposit.." : "Deposit Successful"}
                </h3>
                <p className="text-sm text-white/50 text-center max-w-xs mb-10">
                  {txStatus === "processing" 
                    ? "Adding funds to your wallet. This shouldn't take long."
                    : `$${fiatAmount} has been added to your Fiat Balance.`}
                </p>

                {txStatus === "completed" && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-full"
                  >
                    <button onClick={onClose} className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs">
                      Done
                    </button>
                  </motion.div>
                )}
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
                className="flex flex-col h-full mt-4"
              >
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-6 px-1">Select Asset to Receive</h4>
                
                <div className="space-y-4">
                  {[
                    { id: "BTC", name: "Bitcoin", icon: Bitcoin, color: "text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20" },
                    { id: "ETH", name: "Ethereum", icon: () => <div className="w-4 h-6 border-2 border-current rounded-full" />, color: "text-purple-400", bg: "bg-purple-500/10", border: "border-purple-500/20" },
                    { id: "USDT", name: "Tether (ERC-20)", icon: DollarSign, color: "text-teal-400", bg: "bg-teal-500/10", border: "border-teal-500/20" }
                  ].map((asset) => (
                    <button
                      key={asset.id}
                      onClick={() => { setCryptoType(asset.id as any); navigateTo("crypto_address"); }}
                      className="w-full p-5 rounded-3xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] transition-colors flex items-center justify-between group"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${asset.bg} ${asset.color} ${asset.border} border`}>
                          <asset.icon size={24} />
                        </div>
                        <div className="text-left">
                          <h5 className="font-bold text-base">{asset.name}</h5>
                          <p className="text-[10px] text-white/40 font-medium uppercase tracking-widest">{asset.id}</p>
                        </div>
                      </div>
                      <ChevronRight size={20} className="text-white/20 group-hover:text-white" />
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
                <div className="flex items-center justify-center mb-8 mt-2">
                  <div className="w-48 h-48 bg-white rounded-3xl p-4 flex items-center justify-center pointer-events-none">
                     {/* Fake QR Code */}
                     <div className="w-full h-full border-8 border-black border-dashed opacity-20" />
                  </div>
                </div>

                <div className="text-center mb-6">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">Your {cryptoType} Deposit Address</p>
                  
                  <button 
                    onClick={handleCopy}
                    className="group relative w-full p-4 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors flex flex-col items-center gap-3"
                  >
                    <span className="font-mono text-sm tracking-wider break-all px-4 pb-2 text-white/80">
                      {cryptoType === "BTC" ? "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh" : "0x71C7656EC7ab88b098defB751B7401B5f6d8976F"}
                    </span>
                    <div className="absolute bottom-2 inset-x-0 flex justify-center">
                      <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-white/60 group-hover:text-white transition-colors">
                        {copied ? <Check size={12} className="text-green-400" /> : <Copy size={12} />}
                        {copied ? "Copied!" : "Tap to Copy"}
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex items-start gap-3 p-4 bg-orange-500/10 border border-orange-500/20 rounded-2xl mb-8">
                  <AlertTriangle size={16} className="text-orange-400 mt-0.5 shrink-0" />
                  <p className="text-[10px] leading-relaxed text-orange-200">
                    Send ONLY <strong className="font-black">{cryptoType}</strong> to this address. Sending any other asset may result in permanent loss.
                  </p>
                </div>

                <button 
                  onClick={simulateCryptoDeposit}
                  className="w-full h-16 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-3xl font-black uppercase tracking-[0.2em] text-xs border border-white/10 mt-auto transition-colors"
                >
                  I've made the transfer
                </button>
              </motion.div>
            )}

            {/* STEP: CRYPTO STATUS (Pending -> Processing -> Completed) */}
            {step === "crypto_status" && (
              <motion.div
                key="crypto_status"
                custom={direction}
                variants={variants}
                initial="initial"
                animate="animate"
                exit="exit"
                className="flex flex-col h-full items-center justify-center pb-20 mt-12"
              >
                <div className="w-full max-w-sm">
                  {/* Status Timeline */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center shrink-0">
                        <Check size={16} className="font-bold" />
                      </div>
                      <div className="flex-1">
                        <h5 className="font-bold">Transaction Found</h5>
                        <p className="text-xs text-white/50">Transfer identified on network</p>
                      </div>
                    </div>

                    <div className="w-0.5 h-6 bg-white/20 ml-5 -my-4" />

                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-colors ${
                        txStatus === "pending" || txStatus === "processing" ? "bg-orange-500/20 text-orange-400" : "bg-white text-black"
                      }`}>
                         {(txStatus === "pending" || txStatus === "processing") ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                      </div>
                      <div className="flex-1">
                        <h5 className={`font-bold transition-colors ${txStatus === "pending" ? "text-orange-400" : "text-white"}`}>Confirming</h5>
                        <p className="text-xs text-white/50">{txStatus === "pending" ? "Waiting for blocks..." : "Confirmed"}</p>
                      </div>
                    </div>

                    <div className={`w-0.5 h-6 ml-5 -my-4 transition-colors ${txStatus === 'completed' ? 'bg-white/20' : 'bg-transparent'}`} />

                    <div className="flex items-center gap-4 opacity-50">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 transition-all ${
                         txStatus === "completed" ? "bg-green-500/20 text-green-400 opacity-100 ring-2 ring-green-500/30" : "bg-white/5 text-white/20"
                      }`}>
                         {txStatus === "completed" ? <CheckCircle2 size={16} /> : <div className="w-2 h-2 rounded-full bg-current" />}
                      </div>
                      <div className={`flex-1 transition-opacity ${txStatus === "completed" ? "opacity-100" : "opacity-40"}`}>
                        <h5 className={`font-bold ${txStatus === "completed" ? "text-green-400" : ""}`}>Available in Wallet</h5>
                        <p className="text-xs text-white/50">Ready to use</p>
                      </div>
                    </div>
                  </div>

                  {txStatus === "completed" && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.5 }}
                      className="mt-16"
                    >
                      <button onClick={onClose} className="w-full h-16 bg-white text-black rounded-3xl font-black uppercase tracking-[0.2em] text-xs">
                        Done
                      </button>
                    </motion.div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* DEPOSIT CONFIRMATION MODAL */}
        <PaymentConfirmationModal 
          isOpen={isConfirmModalOpen && ["fiat_amount", "fiat_method"].includes(step)}
          onClose={() => setIsConfirmModalOpen(false)}
          onConfirm={handleConfirmFiat}
          title="Deposit Review"
          amount={Number(fiatAmount)}
          recipient="Hustle Secured Wallet"
          fees={paymentMethod === "card" ? 1.5 : 0}
          estimatedArrival={paymentMethod === "card" ? "Instant" : "1-3 Business Days"}
          actionType="deposit"
          description={`Adding funds via ${paymentMethod === "card" ? "Credit Card" : "Bank Transfer"}. All deposits are protected by Hustle Shield.`}
        />
      </motion.div>
    </AnimatePresence>
  );
}
