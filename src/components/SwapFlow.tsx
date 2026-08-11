import { motion, AnimatePresence } from "motion/react";
import { X, ArrowDown, ChevronDown, RefreshCw, Info } from "lucide-react";
import { useState } from "react";

interface SwapFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SwapFlow({ isOpen, onClose }: SwapFlowProps) {
  const [fromAmount, setFromAmount] = useState("");
  const [isSwapping, setIsSwapping] = useState(false);
  const [step, setStep] = useState<"input" | "success">("input");

  const handleSwap = () => {
    setIsSwapping(true);
    setTimeout(() => {
      setIsSwapping(false);
      setStep("success");
    }, 2000);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[250] bg-black/90 flex items-end justify-center p-4 backdrop-blur-xl"
        >
          <motion.div 
            initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
            className="w-full max-w-lg bg-[#050505] border border-white/10 rounded-[40px] overflow-hidden shadow-2xl"
          >
            <div className="p-8 border-b border-white/5 flex justify-between items-center bg-[#0A0A0A]">
              <div>
                <h3 className="text-xl font-display font-black text-white">Asset Swap</h3>
                <p className="text-[10px] text-white/40 uppercase font-bold tracking-widest mt-1">Exchange your assets instantly</p>
              </div>
              <button 
                onClick={onClose} 
                className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-8">
              {step === "input" ? (
                <div className="space-y-6">
                  {/* From */}
                  <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">From</span>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Balance: 1.2405 ETH</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <input 
                        type="number"
                        value={fromAmount}
                        onChange={(e) => setFromAmount(e.target.value)}
                        placeholder="0.00"
                        className="bg-transparent text-3xl font-display font-black outline-none w-1/2 text-white"
                      />
                      <button className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-blue-400">Ξ</span>
                        </div>
                        <span className="text-sm font-bold text-white">ETH</span>
                        <ChevronDown size={14} className="text-white/40" />
                      </button>
                    </div>
                  </div>

                  {/* Divider / Arrow */}
                  <div className="flex justify-center -my-8 relative z-10">
                    <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center border-4 border-[#050505] shadow-lg">
                      <ArrowDown size={20} className="text-white" />
                    </div>
                  </div>

                  {/* To */}
                  <div className="bg-white/5 p-6 rounded-[32px] border border-white/5">
                    <div className="flex justify-between items-center mb-4">
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">To</span>
                      <span className="text-[10px] text-white/40 font-bold uppercase tracking-widest">Balance: ₦1,240,500</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <div className="text-3xl font-display font-black text-white/20">
                        {fromAmount ? (parseFloat(fromAmount) * 2500000).toLocaleString() : "0.00"}
                      </div>
                      <button className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full hover:bg-white/20 transition-colors">
                        <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                          <span className="text-xs font-bold text-green-400">₦</span>
                        </div>
                        <span className="text-sm font-bold text-white">NGN</span>
                        <ChevronDown size={14} className="text-white/40" />
                      </button>
                    </div>
                  </div>

                  {/* Rates info */}
                  <div className="flex items-start gap-4 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-8">
                    <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <p className="text-[10px] text-white/80 font-bold uppercase tracking-wider">Exchange Rate</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest">
                        1 ETH ≈ 2,500,000 NGN • Fee: 0.5% (₦12,500)
                      </p>
                    </div>
                  </div>

                  <button 
                    disabled={!fromAmount || isSwapping}
                    onClick={handleSwap}
                    className="w-full h-16 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all text-white rounded-[24px] font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2"
                  >
                    {isSwapping ? <RefreshCw size={18} className="animate-spin" /> : "Confirm Conversion"}
                  </button>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-green-400">
                    <RefreshCw size={40} />
                  </div>
                  <h3 className="text-3xl font-display font-black tracking-tight mb-2 text-white">Swap Successful!</h3>
                  <p className="text-white/40 text-[10px] uppercase font-bold tracking-widest mb-8">
                    Your assets have been exchanged and updated in your wallet.
                  </p>
                  <button 
                    onClick={onClose}
                    className="w-full h-16 bg-white text-black rounded-[24px] font-black uppercase tracking-widest text-xs font-display"
                  >
                    Close
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
