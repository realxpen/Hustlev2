import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Check, AlertCircle, Clock, ShieldCheck, User, Lock, Info, Fingerprint, MessageSquare, Phone, FileText } from "lucide-react";
import { Booking, MilestoneStatus } from "../features/bookings/types";
import EscrowCard from "./EscrowCard";
import MilestoneTimeline from "./MilestoneTimeline";
import { useState } from "react";
import TrustBadge from "./TrustBadge";
import PaymentConfirmationModal from "./PaymentConfirmationModal";
import { useBookingStore } from "../features/bookings/stores/useBookingStore";
import { useAuth } from "../features/auth";
import { Toast } from "./HustleUI";

interface JobEscrowManagerProps {
  booking: Booking;
  onClose: () => void;
  isClient?: boolean;
  onMessage?: (userId: string) => void;
  onCall?: (userId: string) => void;
  onAcceptedRedirect?: (booking: Booking) => void;
  onViewDetails?: (booking: Booking) => void;
}

export default function JobEscrowManager({ 
  booking: propBooking, 
  onClose, 
  isClient: propIsClient = true,
  onMessage,
  onCall,
  onAcceptedRedirect,
  onViewDetails
}: JobEscrowManagerProps) {
  const { updateBookingStatus, releaseMilestone, requestMilestoneRelease, fetchBookings, isLoading } = useBookingStore();
  const { user } = useAuth();

  const [successToastOpen, setSuccessToastOpen] = useState(false);
  const [errorToastOpen, setErrorToastOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  // Use reactive booking from state so UI updates instantly when status changes
  const storeBooking = useBookingStore(state => 
    state.buyerOrders.find(b => b.id === propBooking.id) || 
    state.sellerOrders.find(b => b.id === propBooking.id)
  );
  const booking = storeBooking || propBooking;
  const computedIsClient = user ? (booking.buyer_id === user.id) : propIsClient;

  const [showReleaseModal, setShowReleaseModal] = useState(false);
  const [isDisputed, setIsDisputed] = useState(false);

  const handleAcceptBooking = async () => {
    setLocalLoading(true);
    try {
      console.log("[JobEscrowManager] Accepting booking:", booking.id);
      await updateBookingStatus(booking.id, 'accepted');
      console.log("[JobEscrowManager] Database updated booking accepted.");
      
      await fetchBookings();
      setSuccessToastOpen(true);
      
      // Navigate to booking details page after short delay (1.5 seconds)
      setTimeout(() => {
        setSuccessToastOpen(false);
        if (onAcceptedRedirect) {
          console.log("[JobEscrowManager] Triggering onAcceptedRedirect...");
          onAcceptedRedirect({ ...booking, status: 'accepted' });
        } else {
          onClose();
        }
      }, 1500);

    } catch (err: any) {
      console.error("[JobEscrowManager] Error accepting booking:", err);
      setErrorMessage(err.message || "Failed to accept booking.");
      setErrorToastOpen(true);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDeclineBooking = async () => {
    setLocalLoading(true);
    try {
      console.log("[JobEscrowManager] Declining booking:", booking.id);
      await updateBookingStatus(booking.id, 'rejected');
      await fetchBookings();
      onClose();
    } catch (err: any) {
      console.error("[JobEscrowManager] Error declining booking:", err);
      setErrorMessage(err.message || "Failed to decline booking.");
      setErrorToastOpen(true);
    } finally {
      setLocalLoading(false);
    }
  };

  const otherUserId = computedIsClient ? booking.seller_id : booking.buyer_id;

  // Find next milestone to release
  const nextMilestone = booking?.milestones?.find(m => m.status === MilestoneStatus.AWAITING_APPROVAL || m.status === MilestoneStatus.PENDING);
  const activeMilestone = booking?.milestones?.find(m => m.status === MilestoneStatus.IN_PROGRESS || m.status === MilestoneStatus.AWAITING_APPROVAL);

  // Derive state based on if there's a disputed milestone
  const hasDisputedMilestone = booking?.milestones?.some(m => m.status === MilestoneStatus.DISPUTED);
  
  const handleReleaseConfirm = async () => {
    if (nextMilestone) {
      await releaseMilestone(nextMilestone.id);
      await fetchBookings();
      setShowReleaseModal(false);
    }
  };

  const handleRequestRelease = async () => {
    const inProgress = booking?.milestones?.find(m => m.status === MilestoneStatus.IN_PROGRESS);
    if (inProgress) {
      setLocalLoading(true);
      try {
        await requestMilestoneRelease(inProgress.id);
        await fetchBookings();
        setSuccessToastOpen(true);
        setTimeout(() => setSuccessToastOpen(false), 2000);
      } catch (err: any) {
        setErrorMessage(err.message);
        setErrorToastOpen(true);
      } finally {
        setLocalLoading(false);
      }
    }
  };

  const handleDeliverWorkAction = async () => {
     if (confirm("Submit work for review? This will request payment release for the current milestone.")) {
       await handleRequestRelease();
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
                      {computedIsClient ? "Escrow Vault" : "Earnings Secure"}
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

                <EscrowCard booking={booking} isClient={computedIsClient} />
                
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
                    <MessageSquare size={16} /> Message {computedIsClient ? "Hustler" : "Client"}
                  </button>
                  <button 
                    onClick={() => onCall?.(otherUserId)}
                    className="flex items-center justify-center gap-2 h-14 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest"
                  >
                    <Phone size={16} /> Call {computedIsClient ? "Hustler" : "Client"}
                  </button>
                </div>

                {onViewDetails && (
                  <button 
                    onClick={() => onViewDetails(booking)}
                    className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 text-white hover:bg-white/10 transition-all text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2"
                  >
                    <FileText size={16} className="text-white/40" /> View Project Details
                  </button>
                )}

                <div className="pt-4 space-y-3">
                   {computedIsClient ? (
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
                   ) : booking.status === 'pending' ? (
                     <button 
                          onClick={() => onAcceptedRedirect?.(booking)}
                          className="w-full h-16 bg-white text-black rounded-[24px] font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2 transition-all shadow-xl shadow-white/5"
                     >
                          <FileText size={18} /> Review Booking Details
                     </button>
                   ) : (
                      <>
                         <button 
                            disabled={isReleaseRequested || !activeMilestone || isLoading || localLoading}
                            onClick={handleRequestRelease}
                            className={`w-full h-16 rounded-[24px] font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2 transition-all ${
                                isReleaseRequested || !activeMilestone
                                ? "bg-white/5 text-white/40 border border-white/10" 
                                : "bg-white text-black hover:bg-white/90 shadow-xl shadow-white/5"
                            }`}
                         >
                             {isReleaseRequested ? (
                                 <>
                                    <Clock size={18} className="animate-pulse" /> Release Pending
                                 </>
                             ) : (
                                 <>
                                    <ShieldCheck size={18} /> Request Payout
                                 </>
                             )}
                         </button>
                         
                         {isReleaseRequested && (
                             <motion.p 
                                initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                                className="text-center text-[10px] text-blue-400 font-black uppercase tracking-[0.15em] bg-blue-400/5 py-3 rounded-xl border border-blue-400/10"
                             >
                                Buyer Choice Notified • Securely Held
                             </motion.p>
                         )}

                         <button 
                           onClick={handleDeliverWorkAction}
                           disabled={isLoading || localLoading}
                           className="w-full h-16 bg-brand-primary/10 border border-brand-primary/20 hover:bg-brand-primary/20 transition-all text-brand-primary rounded-[24px] font-black uppercase tracking-widest text-xs font-display flex items-center justify-center gap-2"
                         >
                             <Check size={18} /> Deliver Work Artifacts
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

        {/* Feedback Toasts */}
        <Toast 
          message="Booking Accepted Successfully!" 
          type="success" 
          isOpen={successToastOpen} 
          onClose={() => setSuccessToastOpen(false)} 
        />
        <Toast 
          message={errorMessage} 
          type="error" 
          isOpen={errorToastOpen} 
          onClose={() => setErrorToastOpen(false)} 
        />
    </motion.div>
  );
}
