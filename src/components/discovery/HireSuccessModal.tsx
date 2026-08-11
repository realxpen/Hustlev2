import React from "react";
import { motion } from "motion/react";
import { 
  X, CheckCircle, ShieldCheck, Sparkles, Calendar, Clock, 
  MapPin, MessageSquare, ArrowRight, Wallet, Receipt
} from "lucide-react";
import { convertCurrency, formatCurrency, Currency } from "../../lib/currency";

export interface HireSuccessModalProps {
  booking: any;
  onClose: () => void;
  displayCurrency?: Currency;
}

export function HireSuccessModal({
  booking,
  onClose,
  displayCurrency = "USD",
}: HireSuccessModalProps) {
  const selectedCurrency = displayCurrency as Currency;
  const rawPrice = Number(booking.amount || 0);
  const totalConverted = convertCurrency(rawPrice, "USD", selectedCurrency);
  const formattedTotal = formatCurrency(totalConverted, selectedCurrency);

  const providerName = booking.seller?.hustleName || booking.seller?.fullName || "Hustle Professional";

  return (
    <div className="fixed inset-0 z-[1300] flex items-end md:items-center justify-center p-0 md:p-6">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />

      {/* Success Receipt Card Container */}
      <motion.div
        initial={{ scale: 0.95, y: 30, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: 30, opacity: 0 }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-t-[2.5rem] md:rounded-[2.5rem] flex flex-col overflow-hidden shadow-2xl p-8"
      >
        {/* Glow Effects */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-48 bg-emerald-500/10 rounded-full blur-[80px] pointer-events-none" />
        
        {/* Success Header Animation */}
        <div className="text-center space-y-4 relative z-10">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 mx-auto flex items-center justify-center text-emerald-400">
            <CheckCircle size={32} className="animate-bounce" />
          </div>
          <div>
            <span className="text-[9px] font-black uppercase text-emerald-400 tracking-wider bg-emerald-500/5 border border-emerald-500/10 px-3 py-1 rounded-full">
              Escrow Active & Secured
            </span>
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight mt-3">
              Booking Contract Locked!
            </h3>
            <p className="text-xs text-white/50 font-light mt-1">
              Your funds have been securely locked in escrow holding.
            </p>
          </div>
        </div>

        {/* Contract specifications receipt details block */}
        <div className="mt-8 p-5 rounded-[2rem] bg-white/[0.01] border border-white/5 space-y-4">
          <div className="flex justify-between items-start">
            <div className="space-y-1">
              <span className="text-[8px] font-black uppercase tracking-widest text-[#00ea87]">Catalog Service</span>
              <h5 className="font-display font-black text-xs uppercase text-white truncate max-w-[180px]">{booking.service_title}</h5>
            </div>
            <div className="text-right">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/30 block">Secure Hash</span>
              <span className="font-mono text-[9px] text-[#00ea87] font-bold">{booking.id.substring(0, 15)}...</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5 text-[10.5px]">
            <div>
              <span className="text-white/30 text-[8px] font-black uppercase tracking-widest block mb-0.5">Hired Professional</span>
              <span className="font-bold text-white uppercase tracking-wider">{providerName}</span>
            </div>
            <div>
              <span className="text-white/30 text-[8px] font-black uppercase tracking-widest block mb-0.5">Lock Delivery Time</span>
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Clock size={11} className="text-yellow-400" /> {booking.timeline}
              </span>
            </div>
          </div>

          <div className="pt-3 border-t border-white/5 text-xs flex justify-between items-center bg-white/[0.01] -mx-5 -mb-5 px-5 py-4 rounded-b-[2rem]">
            <span className="text-[10px] font-black uppercase tracking-wider text-white flex items-center gap-1.5">
              <ShieldCheck size={14} className="text-[#00ea87]" /> Custody Holdings
            </span>
            <span className="font-mono font-black text-base text-[#00ea87]">{formattedTotal}</span>
          </div>
        </div>

        {/* Informative instructions for low friction */}
        <div className="mt-6 p-4 rounded-2xl bg-cyan-950/20 border border-cyan-500/10 flex gap-3 text-[10px] text-white/60 leading-normal font-light">
          <Receipt size={16} className="text-cyan-400 shrink-0" />
          <span>Hustler has been notified. Work starts immediately. Your money stays safely in escrow custody until you sign off on files.</span>
        </div>

        {/* Actions Row */}
        <div className="mt-8 space-y-3">
          <button
            onClick={onClose}
            className="w-full h-14 bg-white hover:bg-neutral-100 text-[#0c0c0e] font-black uppercase tracking-[0.15em] text-[9.5px] rounded-full shadow-lg transition-all active:scale-[0.98] flex items-center justify-center gap-1.5"
          >
            Start Project Chat <ArrowRight size={13} />
          </button>
          
          <button
            onClick={onClose}
            className="w-full h-12 rounded-full border border-white/10 hover:bg-white/5 text-white/50 hover:text-white font-black text-[9px] uppercase tracking-widest transition-all"
          >
            Close Receipt
          </button>
        </div>

      </motion.div>
    </div>
  );
}
