import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, AlertCircle, Clock, ShieldCheck, User, Lock, Info, Fingerprint, MessageSquare, Phone } from "lucide-react";
import { Booking, MilestoneStatus } from "../features/bookings/types";
import EscrowCard from "./EscrowCard";
import MilestoneTimeline from "./MilestoneTimeline";
import { useState } from "react";
import TrustBadge from "./TrustBadge";
import PaymentConfirmationModal from "./PaymentConfirmationModal";
import { useBookingStore } from "../features/bookings/stores/useBookingStore";
import { useAuth } from "../features/auth";

interface JobEscrowManagerProps {
  booking: Booking;
  onClose: () => void;
  isClient?: boolean;
  onMessage?: (userId: string) => void;
  onCall?: (userId: string) => void;
}

export default function JobEscrowManager({ 
  booking, 
  onClose, 
  isClient = true,
  onMessage,
  onCall
}: JobEscrowManagerProps) {
  const { releaseMilestone, requestMilestoneRelease, isLoading } = useBookingStore();
  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [isDisputed, setIsDisputed] = useState(false);

  const otherUserId = isClient ? booking.seller_id : booking.buyer_id;

  // Find next milestone to release
  const nextMilestone = booking?.milestones?.find(m => m.status === MilestoneStatus.AWAITING_APPROVAL || m.status === MilestoneStatus.PENDING);
  const activeMilestone = booking?.milestones?.find(m => m.status === MilestoneStatus.IN_PROGRESS || m.status === MilestoneStatus.AWAITING_APPROVAL);

  // Derive state based on if there's a disputed milestone
  const hasDisputedMilestone = booking?.milestones?.some(m => m.status === MilestoneStatus.DISPUTED);
  
  const handleReleaseConfirm = async () => {
    if (nextMilestone) {
      await releaseMilestone(nextMilestone.id);
      setShowReleaseModal(false);
    }
  };

  const handleRequestRelease = async () => {
    const inProgress = booking?.milestones?.find(m => m.status === MilestoneStatus.IN_PROGRESS);
    if (inProgress) {
      await requestMilestoneRelease(inProgress.id);
    }
  };

  const isReleaseRequested = activeMilestone?.status === MilestoneStatus.AWAITING_APPROVAL;

  return (
    <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[130] bg-black p-6 pt-16 overflow-y-auto no-scrollbar"
    >
        <div className="max-w-xl mx-auto">
            <button onClick={onClose} className="flex items-center gap-2 text-white/40 mb-8 hover:text-white transition-colors">
                <ArrowLeft size={16} /> Back
            </button>

            <header className="mb-8">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-3xl font-display font-black tracking-tight">
                      {isClient ? "Escrow Vault" : "Earnings Secure"}
                  </h2>
                  <TrustBadge type="escrow_protected" size="xs" />
                </div>
                <div className="flex items-center gap-2 text-[10px] text-white/40 font-bold uppercase tracking-widest bg-white/[0.02] border border-white/5 w-max px-3 py-1 rounded-lg">
                   <Lock size={10} className="text-blue-400" />
                   <span>ProjectID:</span>
                   <span className="text-white">{booking.id}</span>
                </div>
            </header>

            {/* Escrow Reassurance Banner */}
            <div className="mb-8 p-4 rounded-2xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-4 italic shadow-lg shadow-blue-500/5">
                <ShieldCheck size={20} className="text-blue-400 mt-1 shrink-0" />
                <div>
                   <p className="text-[11px] font-bold text-blue-400 mb-1 leading-none">Hustle Shield Guaranteed</p>
                   <p className="text-[10px] text-blue-400/60 leading-relaxed font-medium">Funds are securely locked in escrow and will only be released upon your explicit approval of the deliverables.</p>
                </div>
            </div>

            <div className="grid gap-6 pb-24">
                {(isDisputed || hasDisputedMilestone) && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                        className="p-5 rounded-[24px] bg-blue-500/10 border border-blue-500/20"
                    >
                        <div className="flex items-start gap-4 text-blue-400">
                            <ShieldCheck size={20} className="shrink-0 mt-0.5" />
                            <div>
                                <h3 className="font-bold text-sm mb-1 text-blue-400">Mediation in Progress</h3>
                                <p className="text-[10px] uppercase font-bold tracking-widest opacity-80 mb-3 text-blue-400/80 leading-relaxed normal-case">
                                   Funds remain safely secured in escrow. Our Trust & Safety team is reviewing the project to ensure a fair resolution for both parties.
                                </p>
                                <button className="px-4 py-2 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-full border border-blue-500/30 hover:bg-blue-500/30 transition-all">
                                    View Mediation Status
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}

                <EscrowCard booking={booking} isClient={isClient} />
                
                <div className="pt-4">
                    <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <ShieldCheck size={20} className="text-blue-400" />
                        Milestone Schedule
                    </h3>
                    <MilestoneTimeline milestones={booking.milestones || []} />
                </div>

                {/* Communication Actions */}
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => onMessage?.(otherUserId)}
                    className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <MessageSquare size={16} /> Message {isClient ? "Hustler" : "Client"}
                  </button>
                  <button 
                    onClick={() => onCall?.(otherUserId)}
                    className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Phone size={16} /> Call {isClient ? "Hustler" : "Client"}
                  </button>
                </div>

                <div className="pt-4 space-y-3">
                   {isClient ? (
                      <>
                        <button 
                             disabled={!nextMilestone || nextMilestone.status !== MilestoneStatus.AWAITING_APPROVAL || isLoading}
                             onClick={() => setShowReleaseModal(true)}
                             className={`w-full h-16 transition-all text-white rounded-[24px] font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2 ${
                                !nextMilestone || nextMilestone.status !== MilestoneStatus.AWAITING_APPROVAL 
                                ? "bg-white/5 text-white/20 border border-white/10" 
                                : "bg-blue-500 hover:bg-blue-600 shadow-xl shadow-blue-500/20"
                             }`}
                        >
                             <Check size={18} /> Approve & Release Next
                        </button>
                        <button 
                             disabled={isLoading}
                             onClick={() => setIsDisputed(true)}
                             className="w-full h-16 bg-white/5 hover:bg-white/10 transition-colors text-white rounded-[24px] font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2 text-white/60"
                        >
                             <AlertCircle size={18} /> Request Revision / Report
                        </button>
                      </>
                   ) : (
                      <>
                         <button 
                            disabled={isReleaseRequested || !activeMilestone || isLoading}
                            onClick={handleRequestRelease}
                            className={`w-full h-16 rounded-[24px] font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2 transition-all ${
                                isReleaseRequested || !activeMilestone
                                ? "bg-white/5 text-white/40 border border-white/10" 
                                : "bg-white text-black hover:bg-white/90"
                            }`}
                         >
                             {isReleaseRequested ? (
                                 <>
                                    <Clock size={18} /> Release Requested
                                 </>
                             ) : (
                                 <>
                                    <ShieldCheck size={18} /> Request Milestone Release
                                 </>
                             )}
                         </button>
                         
                         {isReleaseRequested && (
                             <motion.p 
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className="text-center text-[9px] text-blue-400 font-bold uppercase tracking-widest"
                             >
                                Buyer notified. Funds usually released within 2-4 hours.
                             </motion.p>
                         )}

                         <button className="w-full h-16 bg-white/5 border border-white/5 hover:bg-white/10 transition-colors text-white rounded-[24px] font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2 text-white/60">
                             Submit Work for Review
                         </button>
                      </>
                   )}
                </div>
            </div>
        </div>

        {/* Payment Release Modal */}
        <PaymentConfirmationModal 
          isOpen={showReleaseModal}
          onClose={() => setShowReleaseModal(false)}
          onConfirm={handleReleaseConfirm}
          title={`Release Milestone?`}
          amount={nextMilestone?.amount}
          recipient="The Hustler"
          actionType="release"
          description={`Release funds for "${nextMilestone?.title}". This confirms that you have reviewed and approved the work submitted.`}
        />
    </motion.div>
  );
}
