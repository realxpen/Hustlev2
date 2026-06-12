import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ShieldCheck, Lock, CheckCircle2, ChevronRight, 
  CreditCard, Landmark, Wallet, Zap, Info, DollarSign,
  AlertCircle, ArrowRight
} from "lucide-react";
import { useBookingStore } from '../features/bookings/stores/useBookingStore';
import { useAuthStore } from '../features/auth/stores/useAuthStore';
import { convertCurrency, formatCurrency, Currency, EXCHANGE_RATES } from '../lib/currency';

interface PaymentFlowProps {
  onClose: () => void;
  onSuccess: () => void;
  bookingData: {
    title: string;
    hustler: string;
    amount: number;
    escrowDays: number;
    sellerId?: string;
    listingId?: string;
    listingType?: 'service' | 'product' | 'training';
  };
}

export default function PaymentFlow({ onClose, onSuccess, bookingData }: PaymentFlowProps) {
  const [step, setStep] = useState<'checkout' | 'holding' | 'success'>('checkout');
  const [paymentMethod, setPaymentMethod] = useState<'wallet' | 'card' | 'crypto'>('wallet');
  const { createBooking, isLoading: isBookingLoading } = useBookingStore();
  const { profile } = useAuthStore();

  const displayCurrency = (profile?.display_currency || 'USD') as Currency;
  const convertedAmount = convertCurrency(bookingData.amount, 'USD', displayCurrency);

  const handlePay = async () => {
    setStep('holding');
    
    try {
      if (bookingData.listingId && bookingData.listingType) {
        await createBooking({
          listingId: bookingData.listingId,
          listingType: bookingData.listingType,
          quantity: 1,
          notes: `Instant booking via QuickPay: ${bookingData.title}`
        });
      }
      
      // Artificial delay to show the "Securing Escrow" animation
      setTimeout(() => {
        setStep('success');
      }, 1500);
    } catch (err) {
      console.error("Booking error:", err);
      // In a real app we'd show an error state
      setStep('checkout');
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[160] bg-black/90 backdrop-blur-xl flex items-end justify-center px-4 pb-8 sm:p-0 sm:items-center"
    >
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/80 to-transparent pointer-events-none" />
      
      <motion.div 
        initial={{ y: 200, scale: 0.95 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 200, scale: 0.95 }}
        className="w-full max-w-md bg-[#0a0a0a] border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl relative z-10"
        onClick={e => e.stopPropagation()}
      >
        <AnimatePresence mode="wait">
          {step === 'checkout' && (
            <motion.div 
              key="checkout"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <div className="flex justify-between items-center mb-8">
                 <div>
                    <h3 className="text-2xl font-black tracking-tighter italic uppercase">Secure Checkout</h3>
                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">Hustle Escrow ID: #HS-48291</p>
                 </div>
                 <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                    <X size={20} />
                 </button>
              </div>

              {/* Order Summary */}
              <div className="bg-white/5 border border-white/5 rounded-3xl p-6 mb-8">
                 <div className="flex justify-between items-start mb-4">
                    <div>
                       <h4 className="text-sm font-black uppercase mb-1">{bookingData.title}</h4>
                       <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest">with {bookingData.hustler}</span>
                    </div>
                    <span className="text-xl font-black tracking-tighter">{formatCurrency(convertedAmount, displayCurrency)}</span>
                 </div>
                 <div className="pt-4 border-t border-white/5 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-500/20 flex items-center justify-center">
                       <Lock size={14} className="text-blue-500" />
                    </div>
                    <p className="text-[9px] font-medium text-white/40 leading-tight">
                       Funds will be held in <span className="text-blue-400 font-black">Escrow Protection</span> for {bookingData.escrowDays} days after delivery.
                    </p>
                 </div>
              </div>

              {/* Payment Methods */}
              <div className="space-y-3 mb-10">
                 <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 mb-4 px-2">Select Method</p>
                 
                 <button 
                  onClick={() => setPaymentMethod('wallet')}
                  className={`w-full p-5 rounded-[1.75rem] border transition-all flex items-center justify-between ${paymentMethod === 'wallet' ? 'bg-emerald-500/10 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-white/5 border-white/5'}`}
                 >
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${paymentMethod === 'wallet' ? 'bg-emerald-500 text-white' : 'bg-white/10 text-white/40'}`}>
                          <Wallet size={20} />
                       </div>
                       <div className="text-left">
                          <h5 className="text-xs font-black uppercase tracking-tight italic">Hustle Wallet</h5>
                          <span className="text-[9px] font-bold text-white/30 uppercase">{formatCurrency(convertCurrency(12400, 'USD', displayCurrency), displayCurrency)} available</span>
                       </div>
                    </div>
                    {paymentMethod === 'wallet' && <CheckCircle2 size={16} className="text-emerald-500" />}
                 </button>

                 <button 
                  onClick={() => setPaymentMethod('card')}
                  className={`w-full p-5 rounded-[1.75rem] border transition-all flex items-center justify-between ${paymentMethod === 'card' ? 'bg-blue-500/10 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.1)]' : 'bg-white/5 border-white/5'}`}
                 >
                    <div className="flex items-center gap-4">
                       <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${paymentMethod === 'card' ? 'bg-blue-500 text-white' : 'bg-white/10 text-white/40'}`}>
                          <CreditCard size={20} />
                       </div>
                       <div className="text-left">
                          <h5 className="text-xs font-black uppercase tracking-tight italic">Debit / Credit</h5>
                          <span className="text-[9px] font-bold text-white/30 uppercase">Secure processing</span>
                       </div>
                    </div>
                    {paymentMethod === 'card' && <CheckCircle2 size={16} className="text-blue-500" />}
                 </button>
              </div>

              {/* Legal / Trust */}
              <div className="flex items-start gap-4 mb-8 px-2">
                 <ShieldCheck size={24} className="text-emerald-400 shrink-0 mt-1" />
                 <div>
                    <h4 className="text-[11px] font-bold text-white mb-1">Your payment is protected by Hustle Escrow.</h4>
                    <ul className="text-[9px] text-white/50 leading-relaxed font-medium list-disc pl-4 space-y-1">
                       <li>Money is held securely in our vault.</li>
                       <li>The provider gets paid after completion.</li>
                       <li>Dispute protection available.</li>
                    </ul>
                 </div>
              </div>

              <button 
                onClick={handlePay}
                className="w-full h-20 bg-emerald-500 rounded-[2rem] flex items-center justify-center gap-4 text-white shadow-lg shadow-emerald-500/20 active-scale group"
              >
                <div className="flex flex-col items-center">
                   <span className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 group-hover:tracking-[0.3em] transition-all">Confirm Payment</span>
                   <span className="text-2xl font-black italic tracking-tighter">{formatCurrency(convertedAmount, displayCurrency)}</span>
                </div>
                <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === 'holding' && (
            <motion.div 
              key="holding"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="p-12 flex flex-col items-center text-center gap-8"
            >
              <div className="relative">
                 <div className="absolute inset-0 bg-blue-500 blur-3xl opacity-20 animate-pulse scale-150" />
                 <motion.div 
                  initial={{ rotate: 0 }}
                  animate={{ rotate: 360 }}
                  transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                  className="w-32 h-32 rounded-[2.5rem] bg-white/5 border-2 border-dashed border-blue-500 flex items-center justify-center relative z-10"
                 >
                    <Lock size={48} className="text-blue-500" />
                 </motion.div>
              </div>
              <div>
                <h3 className="text-3xl font-black tracking-tighter italic uppercase mb-2">Securing Escrow...</h3>
                <p className="text-xs font-medium text-white/40 leading-relaxed max-w-[240px] mx-auto">
                   Authorizing payment from your {paymentMethod} and locking funds into the secure relay bridge.
                </p>
              </div>
              
              <div className="w-full max-w-[200px] h-1 bg-white/5 rounded-full overflow-hidden">
                 <motion.div 
                   initial={{ x: "-100%" }}
                   animate={{ x: "0%" }}
                   transition={{ duration: 2.5 }}
                   className="h-full bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.6)]" 
                 />
              </div>
            </motion.div>
          )}

          {step === 'success' && (
            <motion.div 
              key="success"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-12 flex flex-col items-center text-center gap-8"
            >
               <div className="relative">
                  <div className="absolute inset-0 bg-emerald-500 blur-3xl opacity-20 animate-pulse scale-150" />
                  <motion.div 
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12 }}
                    className="w-32 h-32 rounded-full bg-emerald-500 flex items-center justify-center relative z-10 shadow-2xl shadow-emerald-500/40"
                  >
                     <CheckCircle2 size={64} className="text-white" />
                  </motion.div>
               </div>
               <div>
                  <h3 className="text-4xl font-black tracking-tighter italic uppercase mb-2 text-emerald-400">Locked & Safe</h3>
                  <div className="bg-white/5 px-4 py-2 rounded-full border border-white/10 mb-4 inline-block">
                     <span className="text-[10px] font-black text-white/60 uppercase tracking-widest italic">Booking ID: #HS-48291</span>
                  </div>
                  <p className="text-xs font-medium text-white/40 leading-relaxed max-w-[280px] mx-auto">
                     Payment successful. {formatCurrency(convertedAmount, displayCurrency)} is now held in escrow. {bookingData.hustler} has been notified to begin work.
                  </p>
               </div>

               <div className="flex flex-col gap-3 w-full">
                  <button 
                    onClick={onSuccess}
                    className="w-full h-16 bg-white text-black rounded-2xl text-[10px] font-black uppercase tracking-widest active-scale"
                  >
                     Go to Booking Timeline
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-full h-16 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/40 active-scale"
                  >
                     Maybe Later
                  </button>
               </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}
