import { motion, AnimatePresence } from "motion/react";
import { X, Calendar, Hash, ShieldCheck, User, ArrowRight, CircleDollarSign } from "lucide-react";
import { Transaction } from "../types";
import { Booking, BookingStatus, EscrowStatus } from "../features/bookings/types";
import { useState } from "react";
import JobEscrowManager from "./JobEscrowManager";

interface TransactionDetailViewProps {
  tx: Transaction;
  onClose: () => void;
}

// Mock booking lookup
const MOCK_BOOKING: any = {
  id: "BK-123",
  buyer_id: "c1",
  seller_id: "h1",
  listing_id: "s1",
  status: 'in_progress',
  unit_price: 120000,
  total_price: 120000,
  escrow_status: 'held',
  milestones: [
    { id: "m1", title: "Setup", amount: 40000, status: "released" as any, deadline: "2026-05-10" },
    { id: "m2", title: "Draft", amount: 40000, status: "released" as any, deadline: "2026-05-11" },
    { id: "m3", title: "Final", amount: 40000, status: "in_progress" as any, deadline: "2026-05-12" },
  ],
  created_at: "2026-05-01",
  updated_at: "2026-05-01",
};

export default function TransactionDetailView({ tx, onClose }: TransactionDetailViewProps) {
  const [showManager, setShowManager] = useState(false);

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[120] bg-black/80 flex items-end sm:items-center justify-center p-4 backdrop-blur-sm"
      >
        <motion.div 
          initial={{ y: "100%" }}
          animate={{ y: 0 }}
          className="w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-[40px] p-8"
        >
          <div className="flex justify-between items-center mb-8">
              <h3 className="text-xl font-display font-black tracking-tight">Transaction Details</h3>
              <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center">
                  <X size={18} />
              </button>
          </div>

          <div className="text-center mb-8">
              <div className="text-5xl font-display font-black tracking-tighter mb-2">
                  {tx.amount > 0 ? '+' : ''}₦{tx.amount.toLocaleString()}
              </div>
              <p className="text-white/40 font-bold uppercase tracking-widest text-[10px]">{tx.status} • {tx.title}</p>
          </div>

          <div className="space-y-4 mb-8">
              {(tx.sender || tx.receiver) && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between">
                      <div className="flex flex-col gap-1">
                          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center gap-2"><User size={12}/> Sender</span>
                          <span className="text-white text-sm font-bold">{tx.sender || 'Unknown'}</span>
                      </div>
                      <ArrowRight size={16} className="text-white/20" />
                      <div className="flex flex-col gap-1 text-right">
                          <span className="text-white/40 text-[10px] font-bold uppercase tracking-widest flex items-center justify-end gap-2"><User size={12}/> Receiver</span>
                          <span className="text-white text-sm font-bold">{tx.receiver || 'Unknown'}</span>
                      </div>
                  </div>
              )}

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Hash size={14}/> ID</span>
                  <div className="flex items-center gap-2">
                     <span className="text-white font-mono text-xs">{tx.id}</span>
                     <ShieldCheck size={14} className="text-blue-500/40" />
                  </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 mb-4">
                 <p className="text-[10px] text-blue-400 font-medium leading-relaxed italic">
                   This transaction is protected by <strong className="font-black">Hustle Shield™</strong>. 
                   Funds were processed via bank-grade encrypted channels.
                 </p>
              </div>

              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between">
                  <span className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><Calendar size={14}/> Date</span>
                  <span className="text-white text-xs font-bold">{new Date(tx.timestamp).toLocaleString()}</span>
              </div>
              
              {tx.fee !== undefined && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><CircleDollarSign size={14}/> Fee</span>
                      <span className="text-white text-xs font-bold">₦{tx.fee.toLocaleString()}</span>
                  </div>
              )}
              
              {tx.type.includes('ESCROW') && (
                  <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex justify-between">
                      <span className="text-white/40 text-xs font-bold uppercase tracking-widest flex items-center gap-2"><ShieldCheck size={14}/> Milestone Ref</span>
                      <span className="text-white text-xs font-bold">{tx.title}</span>
                  </div>
              )}
          </div>

          {tx.bookingId && (
            <button 
                onClick={() => setShowManager(true)}
                className="w-full h-16 bg-blue-500 hover:bg-blue-600 transition-colors text-white rounded-3xl font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2 relative overflow-hidden group"
            >
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400/0 via-white/20 to-blue-400/0 opacity-0 group-hover:opacity-100 group-hover:animate-[shimmer_1.5s_infinite] -skew-x-12" />
                <ShieldCheck size={16} /> View Project & Escrow
            </button>
          )}
        </motion.div>
      </motion.div>

      <AnimatePresence>
        {showManager && (
            <JobEscrowManager booking={MOCK_BOOKING} onClose={() => setShowManager(false)} />
        )}
      </AnimatePresence>
    </>
  );
}
