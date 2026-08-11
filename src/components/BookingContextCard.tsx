import React, { useState } from 'react';
import { motion } from "motion/react";
import { ShieldCheck, ChevronRight, Lock, CheckCircle2, AlertTriangle, Clock, Hammer, DollarSign, Ban } from "lucide-react";
import { Booking, MilestoneStatus, getEscrowPaymentState, EscrowPaymentState } from "../features/bookings/types";
import { useBookingStore } from "../features/bookings/stores/useBookingStore";
import { useAuth } from "../features/auth";
import { format, formatDistanceToNow, addDays } from 'date-fns';

interface BookingContextCardProps {
  booking: Booking;
  onOpenBooking: () => void;
}

export default function BookingContextCard({ booking, onOpenBooking }: BookingContextCardProps) {
  const { releaseMilestone, requestMilestoneRelease, updateBookingStatus, isLoading } = useBookingStore();
  const { user } = useAuth();
  const [confirmDispute, setConfirmDispute] = useState(false);
  
  // Access active milestone if exists
  const milestones = booking?.milestones || [];
  const activeMilestone = milestones.find(m => m.status === MilestoneStatus.IN_PROGRESS || m.status === MilestoneStatus.AWAITING_APPROVAL);
  const completedMilestones = milestones.filter(m => m.status === MilestoneStatus.RELEASED).length;
  const totalMilestones = milestones.length;

  const isBuyer = user?.id === booking.buyer_id;
  const isSeller = user?.id === booking.seller_id;

  // Derive service title & details
  const serviceTitle = booking.listing_title || booking.listing?.title || "Hustle Freelance Contract";
  const quantityText = booking.quantity > 1 ? ` (Qty: ${booking.quantity})` : '';
  const serviceDetail = `${booking.listing_type ? booking.listing_type.toUpperCase() : 'HUSTLE'} WORK${quantityText}`;

  // Derive deadline
  let deadlineText = "Flexible Delivery";
  let daysRemaining = "";
  try {
    const deadlineDate = (booking as any).delivery_deadline 
      ? new Date((booking as any).delivery_deadline) 
      : addDays(new Date(booking.created_at), 5); // default 5 days
    
    deadlineText = format(deadlineDate, 'MMM dd, yyyy');
    const isPast = deadlineDate.getTime() < Date.now();
    daysRemaining = isPast 
      ? "Overdue" 
      : `${formatDistanceToNow(deadlineDate, { addSuffix: false })} left`;
  } catch (err) {
    console.error("Error formatting deadline:", err);
  }

  // Derive Payment and Escrow status text
  const escrowState = getEscrowPaymentState(booking);
  
  const getEscrowDisplay = () => {
    switch (booking.status) {
      case 'disputed':
        return {
          label: "🔒 Disputed & Escrow Held",
          color: "text-red-400 bg-red-950/40 border-red-900/50",
          desc: "Escrow funds are locked. Admin arbitration is active."
        };
      case 'completed':
        return {
          label: "✅ Escrow Released",
          color: "text-emerald-400 bg-emerald-950/40 border-emerald-900/50",
          desc: "Hustler paid. Contract finalized."
        };
      case 'cancelled':
      case 'rejected':
        return {
          label: "↩️ Escrow Refunded",
          color: "text-gray-400 bg-zinc-900/80 border-white/5",
          desc: "Funds returned to purchaser account."
        };
      default:
        if (booking.escrow_status === 'held' || escrowState === EscrowPaymentState.FUNDED) {
          return {
            label: "🔒 Escrow Locked & Funded",
            color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
            desc: "Protected under Hustle Guarantee."
          };
        }
        return {
          label: "⏳ Awaiting Ingress Payment",
          color: "text-amber-400 bg-amber-500/5 border-amber-500/20",
          desc: "Funds have not been locked into smart vault yet."
        };
    }
  };

  const paymentDisplay = getEscrowDisplay();

  const handleMilestoneAction = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeMilestone) return;

    if (isBuyer && activeMilestone.status === MilestoneStatus.AWAITING_APPROVAL) {
      await releaseMilestone(activeMilestone.id);
    } else if (isSeller && activeMilestone.status === MilestoneStatus.IN_PROGRESS) {
      await requestMilestoneRelease(activeMilestone.id);
    }
  };

  const handleTriggerDispute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirmDispute) {
      try {
        await updateBookingStatus(booking.id, 'disputed');
        setConfirmDispute(false);
      } catch (err) {
        console.error("Failed to raise dispute:", err);
      }
    } else {
      setConfirmDispute(true);
    }
  };

  const handleCancelDispute = (e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDispute(false);
  };

  return (
    <motion.div 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="mx-6 mt-2 mb-4 p-4 rounded-3xl bg-[#0a0a0d] border border-white/5 relative overflow-hidden backdrop-blur-xl shrink-0"
    >
      {/* Background radial glow */}
      <div className={`absolute top-0 right-0 w-36 h-36 blur-[100px] rounded-full -mr-10 -mt-10 transition-colors duration-500 ${
        booking.status === 'disputed' 
          ? 'bg-red-500/10' 
          : booking.status === 'completed'
          ? 'bg-emerald-500/5'
          : 'bg-brand-primary/10'
      }`} />
      
      {/* Core Booking & Service Info */}
      <div className="flex items-start justify-between relative z-10 gap-3">
         <div className="flex-1 min-w-0">
            <span className="text-[7.5px] font-black uppercase tracking-[0.2em] text-white/40 block mb-1">
              {serviceDetail} • ID: #{booking.id.slice(0, 8).toUpperCase()}
            </span>
            <h3 className="text-sm font-bold uppercase tracking-tight italic text-white line-clamp-1">
              {serviceTitle}
            </h3>
            
            <div className="flex items-center gap-2 mt-2">
               <span className="text-base font-black italic tracking-tight text-white">
                  ₦{booking.total_price?.toLocaleString() || booking.unit_price?.toLocaleString() || 0}
               </span>
               <div className={`text-[8px] font-black uppercase tracking-widest px-2.5 py-1.5 rounded-lg border ${paymentDisplay.color}`}>
                  {paymentDisplay.label}
               </div>
            </div>
         </div>

         <button 
           onClick={onOpenBooking}
           className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 hover:border-white/10 transition-all rounded-2xl shrink-0"
         >
           <div className="text-right">
              <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Milestones</span>
              <span className="text-[10px] font-black text-brand-primary uppercase">
                {completedMilestones}/{totalMilestones || 1} Done
              </span>
           </div>
           <ChevronRight size={14} className="text-white/40" />
         </button>
      </div>

      {/* Grid of Work Metadata (Deadline & Details) */}
      <div className="grid grid-cols-2 gap-4 mt-4 pt-3 border-t border-white/5 select-none text-[11px] relative z-10">
         <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
            <Clock size={16} className="text-white/30" />
            <div>
               <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Deadline Target</span>
               <span className="font-bold text-white uppercase tracking-tight">
                 {deadlineText} <span className="text-brand-primary text-[9px] lowercase italic font-normal">({daysRemaining})</span>
               </span>
            </div>
         </div>

         <div className="flex items-center gap-2.5 bg-white/[0.02] border border-white/5 p-2 rounded-2xl">
            <Hammer size={16} className="text-white/30" />
            <div>
               <span className="text-[8px] font-black uppercase tracking-widest text-white/40 block">Escrow Trust Cover</span>
               <span className="font-bold text-white uppercase tracking-tight truncate line-clamp-1">
                 {paymentDisplay.desc}
               </span>
            </div>
         </div>
      </div>

      {/* Contextual Action / Dispute Section */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-3 relative z-10">
         <div className="flex items-center gap-2">
            <div className={`w-1.5 h-1.5 rounded-full ${
              booking.status === 'disputed' 
                ? 'bg-red-500 animate-pulse' 
                : activeMilestone?.status === MilestoneStatus.AWAITING_APPROVAL 
                ? 'bg-brand-primary animate-pulse' 
                : 'bg-white/20'
            }`} />
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">
              {booking.status === 'disputed' 
                ? '⚖️ Contract Under Dispute'
                : activeMilestone
                ? `${isBuyer ? 'Needs Release' : 'Work Commenced'}`
                : 'Awaiting Initiation'
              }
            </span>
         </div>

         <div className="flex items-center gap-2">
            {/* Dispute Trigger Button */}
            {booking.status !== 'completed' && booking.status !== 'cancelled' && booking.status !== 'rejected' && (
              <div className="flex items-center gap-1.5">
                {confirmDispute ? (
                  <motion.div 
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex items-center gap-1.5 bg-red-950/80 border border-red-500/30 p-1 rounded-xl"
                  >
                    <button 
                      onClick={handleTriggerDispute}
                      disabled={isLoading}
                      className="px-2.5 py-1.5 bg-red-500 text-white select-none rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-red-600 transition-colors"
                    >
                      Confirm Dispute
                    </button>
                    <button 
                      onClick={handleCancelDispute}
                      className="px-2.5 py-1.5 bg-white/10 text-white rounded-lg text-[8px] font-black uppercase tracking-widest hover:bg-white/20 transition-colors"
                    >
                      Cancel
                    </button>
                  </motion.div>
                ) : (
                  <button 
                    onClick={handleTriggerDispute}
                    disabled={booking.status === 'disputed' || isLoading}
                    className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest transition-all ${
                      booking.status === 'disputed'
                        ? 'bg-red-500/10 text-red-400/50 border border-red-500/10 cursor-not-allowed'
                        : 'bg-white/5 hover:bg-red-500/10 text-white/40 hover:text-red-400 border border-white/5 hover:border-red-500/20 active:scale-95'
                    }`}
                  >
                     <AlertTriangle size={10} />
                     <span>{booking.status === 'disputed' ? 'Disputed' : 'Raise Dispute'}</span>
                  </button>
                )}
              </div>
            )}

            {/* Release Milestone Button */}
            {activeMilestone && booking.status !== 'disputed' && (
              <>
                {((isBuyer && activeMilestone.status === MilestoneStatus.AWAITING_APPROVAL) || 
                  (isSeller && activeMilestone.status === MilestoneStatus.IN_PROGRESS)) && (
                  <button 
                    onClick={handleMilestoneAction}
                    disabled={isLoading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-primary hover:bg-brand-primary/95 text-white rounded-xl text-[9px] font-black uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-brand-primary/20 cursor-pointer"
                  >
                    <CheckCircle2 size={10} />
                    {isBuyer ? 'Release Milestone' : 'Request Milestone Pay'}
                  </button>
                )}
              </>
            )}
         </div>
      </div>
    </motion.div>
  );
}
