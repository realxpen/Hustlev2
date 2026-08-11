import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, MoreHorizontal, MessageSquare, Phone, MapPin, Calendar, Clock, 
  CheckCircle2, ChevronRight, Star, ShieldCheck, Plus, Trash, Edit3, Check, X, FileText, AlertCircle, Zap
} from "lucide-react";
import { useState, useEffect, useRef } from "react";
import JobEscrowManager from "./JobEscrowManager";
import ReviewSubmissionModal from "./ReviewSubmissionModal";
import { useBookingStore } from "../features/bookings/stores/useBookingStore";
import { useProfileStore } from "../features/profile/stores/useProfileStore";
import { useAuth } from "../features/auth";

interface BookingDetailProps {
  booking: any;
  onBack: () => void;
  onMessage?: (userId: string) => void;
}

export default function BookingDetail({ booking: initialBooking, onBack, onMessage }: BookingDetailProps) {
  const [activeTab, setActiveTab] = useState<"tracking" | "details">("details");
  const [showEscrow, setShowEscrow] = useState(false);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [isEditingInvoice, setIsEditingInvoice] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  const { session } = useAuth();
  const { buyerOrders, sellerOrders, updateBookingStatus, proposeInvoiceRevision, respondToInvoiceRevision } = useBookingStore();
  const { blockUser, unblockUser, isUserBlocked } = useProfileStore();

  const [isBlocked, setIsBlocked] = useState(false);

  // Keep synced with store changes for real-time reactivity
  const booking = buyerOrders.find(b => b.id === initialBooking.id) || 
                  sellerOrders.find(b => b.id === initialBooking.id) || 
                  initialBooking;

  const isSeller = booking.seller_id === session?.user?.id;
  const fileInputRef = useRef<HTMLInputElement>(null);

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArr = Array.from(e.target.files).map((f: any) => ({
        name: f.name,
        size: f.size > 1024 * 1024 
          ? `${(f.size / (1024 * 1024)).toFixed(1)} MB` 
          : `${(f.size / 1024).toFixed(0)} KB`,
        type: f.type || "application/octet-stream"
      }));
      setUploadedAttachments(prev => [...prev, ...filesArr]);
    }
  };
  const isClient = booking.buyer_id === session?.user?.id;
  const otherUser = isSeller ? booking.buyer : booking.seller;
  const otherUserId = isSeller ? booking.buyer_id : booking.seller_id;

  // Check block status
  useEffect(() => {
    const checkBlock = async () => {
      if (isSeller && otherUserId) {
        const blocked = await isUserBlocked(otherUserId);
        setIsBlocked(blocked);
      }
    };
    checkBlock();
  }, [isSeller, otherUserId, isUserBlocked]);

  const handleBlockAction = async () => {
    if (!otherUserId) return;
    setLocalLoading(true);
    try {
      if (isBlocked) {
        await unblockUser(otherUserId);
        setIsBlocked(false);
      } else {
        if (confirm("Restrict this buyer? They will be blocked from future bookings and interaction.")) {
          await blockUser(otherUserId);
          setIsBlocked(true);
        }
      }
    } catch (e: any) {
      alert("Failed to update restriction: " + e.message);
    } finally {
      setLocalLoading(false);
    }
  };

  // Invoice Modification States (Hustler edits)
  const [editPrice, setEditPrice] = useState<number>(booking.total_price || 0);
  const [editCustomCharges, setEditCustomCharges] = useState<number>(booking.parsedNotes?.custom_charges || 0);
  const [editRevisionTerms, setEditRevisionTerms] = useState<string>(booking.parsedNotes?.revision_terms || "1 round of minor edits only");
  const [editAgreementNotes, setEditAgreementNotes] = useState<string>(booking.parsedNotes?.agreement_notes || "");
  const [editDeadline, setEditDeadline] = useState<string>(booking.parsedNotes?.deadline || new Date().toISOString().split('T')[0]);
  
  const [editDeliverables, setEditDeliverables] = useState<Array<{ id: string; title: string; checked: boolean }>>(
    booking.parsedNotes?.deliverables?.length > 0
      ? booking.parsedNotes.deliverables
      : [{ id: "1", title: "Complete design & prototype mockups", checked: false }]
  );

  const [uploadedAttachments, setUploadedAttachments] = useState<any[]>(
    booking.parsedNotes?.attachments || [
      { name: "creative-brief-v2.pdf", size: "4.2 MB", type: "pdf" },
      { name: "moodboard-inspiration.jpg", size: "8.1 MB", type: "image/jpeg" }
    ]
  );

  const [editMilestones, setEditMilestones] = useState<Array<{ id: string; title: string; amount: number; status: string }>>(
    booking.milestones?.length > 0
      ? booking.milestones.map((m: any) => ({ id: m.id, title: m.title, amount: m.amount, status: m.status }))
      : [{ id: "1", title: "Project Deliverables Completed (100%)", amount: editPrice, status: "in_progress" }]
  );

  // Synchronize milestones when the price changes to split appropriately
  useEffect(() => {
    if (editMilestones.length === 1) {
      setEditMilestones([{ id: "1", title: "Project Deliverables Completed (100%)", amount: editPrice, status: "in_progress" }]);
    }
  }, [editPrice]);

  const handleAddDeliverables = () => {
    setEditDeliverables([...editDeliverables, { id: Date.now().toString(), title: "", checked: false }]);
  };

  const handleRemoveDeliverables = (id: string) => {
    setEditDeliverables(editDeliverables.filter(d => d.id !== id));
  };

  const handleAddMilestone = () => {
    const defaultSplit = Math.max(0, editPrice - editMilestones.reduce((acc, current) => acc + current.amount, 0));
    setEditMilestones([...editMilestones, { id: Date.now().toString(), title: `Milestone ${editMilestones.length + 1}`, amount: defaultSplit, status: "in_progress" }]);
  };

  const handleRemoveMilestone = (id: string) => {
    setEditMilestones(editMilestones.filter(m => m.id !== id));
  };

  const handleAcceptBooking = async () => {
    setLocalLoading(true);
    try {
      await updateBookingStatus(booking.id, "accepted");
      // Optional: you could stay on the page or trigger a refresh
    } catch (e: any) {
      console.error(e);
      alert("Failed to accept booking: " + e.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleDeclineBooking = async () => {
    if (!confirm("Are you sure you want to decline this booking? This action is permanent.")) return;
    setLocalLoading(true);
    try {
      await updateBookingStatus(booking.id, "rejected");
      onBack();
    } catch (e: any) {
      console.error(e);
      alert("Failed to decline booking: " + e.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleSendRevisionProposal = async () => {
    const milestoneSum = editMilestones.reduce((acc, m) => acc + Number(m.amount), 0);
    if (Math.abs(milestoneSum - editPrice) > 1) {
      alert(`Validation error: The sum of milestone payouts (₦${milestoneSum.toLocaleString()}) must match the total service price (₦${editPrice.toLocaleString()}).`);
      return;
    }

    setLocalLoading(true);
    try {
      await proposeInvoiceRevision(booking.id, {
        total_price: editPrice,
        custom_charges: editCustomCharges,
        revision_terms: editRevisionTerms,
        agreement_notes: editAgreementNotes,
        deadline: editDeadline,
        deliverables: editDeliverables.filter(d => d.title.trim() !== ""),
        milestones: editMilestones
      });
      setIsEditingInvoice(false);
    } catch (e: any) {
      alert(e.message || "Failed to submit revision.");
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRespondentApprove = async () => {
    setLocalLoading(true);
    try {
      await respondToInvoiceRevision(booking.id, "approved");
    } catch (e: any) {
      alert("Failed to approve invoice changes: " + e.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const handleRespondentReject = async () => {
    setLocalLoading(true);
    try {
      await respondToInvoiceRevision(booking.id, "rejected");
    } catch (e: any) {
      alert("Failed to reject proposal: " + e.message);
    } finally {
      setLocalLoading(false);
    }
  };

  const normalSteps = [
    { 
      id: "pending", 
      label: "Pending Receipt", 
      description: "Awaiting provider reviews", 
      time: new Date(booking.created_at).toLocaleString(), 
      completed: true 
    },
    { 
      id: "accepted", 
      label: "Accepted", 
      description: "Hustle confirmed", 
      time: ["accepted", "in_progress", "delivered", "completed", "disputed"].includes(booking.status) ? "Terms Locked" : "", 
      completed: ["accepted", "in_progress", "delivered", "completed", "disputed"].includes(booking.status) 
    },
    { 
      id: "in_progress", 
      label: "In Progress", 
      description: "Hustle development mode active", 
      time: ["in_progress", "delivered", "completed"].includes(booking.status) ? "Work Commenced" : "", 
      completed: ["in_progress", "delivered", "completed"].includes(booking.status) 
    },
    { 
      id: "delivered", 
      label: "Delivered", 
      description: "Work artifacts submitted, awaiting client sign-off", 
      time: ["delivered", "completed"].includes(booking.status) ? "Assets Delivered" : "", 
      completed: ["delivered", "completed"].includes(booking.status) 
    },
    { 
      id: "completed", 
      label: "Completed", 
      description: "Milestones closed & funds released", 
      time: booking.status === "completed" ? "Sovereign Settlement" : "", 
      completed: booking.status === "completed" 
    }
  ];

  const getTimelineSteps = () => {
    if (booking.status === "cancelled") {
      return [
        { id: "pending", label: "Pending Requested", description: "First contract brief logged", time: "", completed: true },
        { id: "cancelled", label: "Cancelled", description: "Hustle agreement voided & returned", time: "Contract Revoked", completed: true, isError: true }
      ];
    }
    if (booking.status === "rejected") {
      return [
        { id: "pending", label: "Pending Requested", description: "First contract brief logged", time: "", completed: true },
        { id: "rejected", label: "Declined", description: "Declined by Provider", time: "Proposal Closed", completed: true, isError: true }
      ];
    }
    if (booking.status === "disputed") {
      return [
        ...normalSteps.filter(s => s.id !== "completed" && s.id !== "delivered"),
        { id: "disputed", label: "Disputed", description: "Escrow dispute initiated by participant", time: "Pending Arbitration", completed: true, isWarning: true }
      ];
    }
    return normalSteps;
  };

  const steps = getTimelineSteps();

  const parsedNotes = booking.parsedNotes || {};
  const deliverablesList = parsedNotes.deliverables || [];
  const clientAnswers = parsedNotes.client_answers || [];
  const attachments = parsedNotes.attachments || [];
  const activeProposal = parsedNotes.invoice_proposal;

  const handleDeliverWork = async () => {
    if (confirm("Mark work as delivered? This will notify the client to review and release payment.")) {
       setLocalLoading(true);
       try {
          // If there are milestones, request release for the first active one
          const inProgress = booking.milestones?.find((m: any) => m.status === 'in_progress');
          if (inProgress) {
             await useBookingStore.getState().requestMilestoneRelease(inProgress.id);
          } else {
             // Fallback: just update status
             await updateBookingStatus(booking.id, 'completed');
          }
       } catch (e: any) {
          alert("Delivery failed: " + e.message);
       } finally {
          setLocalLoading(false);
       }
    }
  };

  return (
    <motion.div
      initial={{ x: "100%" }}
      animate={{ x: 0 }}
      exit={{ x: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[70] bg-[#050505] flex flex-col pt-12 text-white overflow-hidden"
    >
      <div className="noise-overlay pointer-events-none" />

      {/* Header */}
      <header className="px-6 pb-6 border-b border-white/5 flex items-center justify-between bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center gap-4">
           <button onClick={onBack} className="p-2 -ml-3 text-white/40 hover:text-white transition-colors">
              <ChevronLeft size={24} />
           </button>
           <div>
              <h3 className="font-bold text-sm tracking-tight">Hustle #{booking.id.split('-')[0].toUpperCase()}</h3>
              <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">{booking.listing_type} Engagement</p>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {booking.status === 'accepted' && (
             <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 mr-2">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-[8px] font-black text-emerald-400 uppercase tracking-widest">Active Hustle</span>
             </div>
          )}
          <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 shadow-lg ${
            booking.status === "pending" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
            booking.status === "accepted" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
            booking.status === "in_progress" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : 
            booking.status === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" :
            "bg-white/10 text-white/50 border border-white/10"
          }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${
               booking.status === 'pending' ? 'bg-amber-500 animate-pulse' :
               booking.status === 'accepted' ? 'bg-emerald-500' :
               booking.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-green-500'
            }`} />
            {booking.status}
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="flex px-6 pt-6 gap-8 border-b border-white/5">
         <button 
           onClick={() => setActiveTab("tracking")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'tracking' ? 'text-white' : 'text-white/30'}`}
         >
            Tracking
            {activeTab === "tracking" && (
              <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
         <button 
           onClick={() => setActiveTab("details")}
           className={`pb-4 text-[10px] font-black uppercase tracking-widest relative transition-colors ${activeTab === 'details' ? 'text-white' : 'text-white/30'}`}
         >
            Order Details
            {activeTab === "details" && (
              <motion.div layoutId="activeDetailTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-white" />
            )}
         </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 no-scrollbar pb-48">
         {activeTab === "tracking" ? (
            <div className="flex flex-col gap-8">
               
               {/* Timeline Section */}
               <section className="bg-white/[0.02] border border-white/5 p-6 rounded-[2.5rem]">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-[10px] font-black uppercase text-white/40 tracking-widest">Contract Lifecycle</h3>
                    <div className="flex items-center gap-1.5 bg-blue-500/10 px-2 py-1 rounded-lg">
                       <ShieldCheck size={12} className="text-blue-400" />
                       <span className="text-[8px] font-black uppercase text-blue-400">Escrow Locked</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-8">
                     {steps.map((step: any, idx: number) => {
                        const isCurrent = step.id === booking.status;
                        const circleBg = step.isError 
                           ? 'bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.4)] scale-110'
                           : step.isWarning 
                           ? 'bg-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.4)] scale-110'
                           : step.completed 
                           ? 'bg-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.4)] scale-110' 
                           : 'bg-white/5 border border-white/10';

                        const lineBg = step.isError 
                           ? 'bg-red-500'
                           : step.isWarning 
                           ? 'bg-amber-500'
                           : step.completed 
                           ? 'bg-blue-500' 
                           : 'bg-white/5';

                        return (
                           <div key={step.id} className="flex gap-6 relative">
                              {idx !== steps.length - 1 && (
                                 <div className={`absolute left-[13px] top-[26px] w-[2px] h-[calc(100%+32px)] transition-colors duration-500 ${lineBg}`} />
                              )}
                              
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 z-10 transition-all duration-500 ${circleBg}`}>
                                 {step.isError ? (
                                    <X size={15} className="text-white" />
                                 ) : step.isWarning ? (
                                    <AlertCircle size={15} className="text-white" />
                                 ) : step.completed ? (
                                    <Check size={16} className="text-white" />
                                 ) : (
                                    <div className="w-1.5 h-1.5 rounded-full bg-white/20" />
                                 )}
                              </div>

                              <div className="flex-1 pt-0.5">
                                 <div className="flex items-baseline justify-between gap-2">
                                    <h4 className={`text-sm font-bold tracking-tight mb-0.5 transition-colors ${
                                       step.isError ? 'text-red-400 font-extrabold' :
                                       step.isWarning ? 'text-amber-400 font-extrabold' :
                                       step.completed ? 'text-white' : 'text-white/20'
                                    }`}>
                                       {step.label}
                                    </h4>
                                    {isCurrent && (
                                       <span className="text-[7.5px] font-black uppercase tracking-widest text-[#00ea87] bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded-md animate-pulse">
                                          Current
                                       </span>
                                    )}
                                 </div>
                                 
                                 {step.description && (
                                    <p className={`text-[10.5px] mb-1.5 leading-snug font-medium ${step.completed ? 'text-white/50' : 'text-white/10'}`}>
                                       {step.description}
                                    </p>
                                 )}

                                 {step.time && (
                                    <p className={`text-[9px] font-bold uppercase tracking-widest leading-none ${
                                       step.isError ? 'text-red-500/60' :
                                       step.isWarning ? 'text-amber-500/60' : 'text-blue-500/60'
                                    }`}>
                                       {step.time}
                                    </p>
                                 )}
                              </div>
                           </div>
                        );
                     })}
                  </div>
               </section>

               {/* Shield Escrow Status Block */}
               <section className="p-6 rounded-[2.5rem] bg-gradient-to-br from-blue-900/10 via-[#0a0a0a] to-transparent border border-blue-500/10 flex items-start gap-4 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-5">
                     <ShieldCheck size={100} />
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 shrink-0 border border-blue-500/20 shadow-glow-blue z-10">
                     <ShieldCheck size={20} />
                  </div>
                  <div className="z-10">
                     <div className="flex items-center gap-2 mb-1.5">
                        <span className="text-[9px] uppercase font-black tracking-widest text-blue-400">Escrow Status:</span>
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider ${
                           booking.status === 'pending' ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' :
                           ['accepted', 'in_progress', 'delivered'].includes(booking.status) ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                           booking.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                           ['rejected', 'cancelled'].includes(booking.status) ? 'bg-white/10 text-white/50 border border-white/10' :
                           'bg-red-500/10 text-red-400 border border-red-500/20'
                        }`}>
                           {booking.status === 'pending' ? 'Awaiting Payment' :
                            ['accepted', 'in_progress', 'delivered'].includes(booking.status) ? 'Funded' :
                            booking.status === 'completed' ? 'Released' :
                            ['rejected', 'cancelled'].includes(booking.status) ? 'Refunded' :
                            booking.status === 'disputed' ? 'Disputed' : 'Unknown'}
                        </div>
                     </div>
                     <p className="text-[10px] text-white/60 font-medium leading-relaxed max-w-[90%]">
                        {booking.status === 'pending' 
                           ? "Waiting for the client to fund the escrow vault."
                           : ['accepted', 'in_progress', 'delivered'].includes(booking.status)
                           ? "Funds are safely locked in the escrow vault. They will be released upon completion."
                           : booking.status === 'completed'
                           ? "Funds have been released from the escrow vault to the provider."
                           : ['rejected', 'cancelled'].includes(booking.status)
                           ? "Funds have been returned from the escrow vault to the client."
                           : "The escrow is currently paused due to an active dispute."}
                     </p>
                  </div>
               </section>

               {/* Quick Communication Card */}
               <section className="p-6 rounded-[2.5rem] bg-white/[0.03] border border-white/5 group hover:bg-white/[0.05] transition-all">
                  <div className="flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden">
                           <img src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${otherUserId}`} alt="Profile" className="w-full h-full object-cover" />
                        </div>
                        <div>
                           <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest">{isSeller ? "Buyer" : "Creator & Hustler"}</span>
                           <h4 className="font-bold text-base tracking-tight">{otherUser?.hustle_name || otherUser?.full_name || 'Partner'}</h4>
                        </div>
                     </div>
                     <div className="flex gap-2">
                        {onMessage && (
                           <button 
                             onClick={() => onMessage?.(otherUserId)}
                             className="w-12 h-12 rounded-2xl bg-white text-black flex items-center justify-center hover:scale-110 active:scale-90 transition-all shadow-[0_0_30px_rgba(255,255,255,0.2)]"
                           >
                              <MessageSquare size={18} />
                           </button>
                        )}
                        <button className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition-all">
                           <Phone size={18} />
                        </button>
                     </div>
                  </div>
               </section>
            </div>
         ) : (
            <div className="flex flex-col gap-6">

               {/* Project Summary */}
               <div className="mb-2">
                  <h1 className="text-2xl font-black italic tracking-tighter uppercase leading-[0.9] mb-2">
                     {booking.listing_title || "Creative Collaboration"}
                  </h1>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Agreed Budget:</span>
                     <span className="text-emerald-400 font-bold text-sm">₦{(booking.total_price || 0).toLocaleString()}</span>
                  </div>
               </div>

               {/* Contract Parties Ledger Row */}
               <span className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-1">Contract Participants</span>
               <div className="grid grid-cols-2 gap-3 mb-4">
                  {/* PROVIDER CARD */}
                  <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between h-36">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                           <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.seller_id}`} 
                              alt="Provider" 
                              className="w-full h-full object-cover"
                           />
                        </div>
                        <div className="min-w-0">
                           <p className="text-[8px] font-black uppercase tracking-widest text-purple-400">Provider</p>
                           <h4 className="text-xs font-bold text-white truncate mt-0.5">
                              {booking.seller?.hustle_name || booking.seller?.full_name || "Marcus V."}
                           </h4>
                        </div>
                     </div>
                     <div className="flex items-center justify-between mt-3">
                        <span className="text-[8px] font-bold text-[#00ea87] uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/10 px-2 py-0.5 rounded-full">✓ Specialist</span>
                        {isSeller ? (
                           <span className="text-[8px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">You</span>
                        ) : (
                           <button 
                              onClick={() => onMessage?.(booking.seller_id)}
                              className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"
                           >
                              <MessageSquare size={13} />
                           </button>
                        )}
                     </div>
                  </div>

                  {/* CLIENT CARD */}
                  <div className="p-4 rounded-3xl bg-white/[0.02] border border-white/5 flex flex-col justify-between h-36">
                     <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10 shrink-0">
                           <img 
                              src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${booking.buyer_id}`} 
                              alt="Client" 
                              className="w-full h-full object-cover"
                           />
                        </div>
                        <div className="min-w-0">
                           <p className="text-[8px] font-black uppercase tracking-widest text-blue-400">Client</p>
                           <h4 className="text-xs font-bold text-white truncate mt-0.5">
                              {booking.buyer?.full_name || "Elena S."}
                           </h4>
                        </div>
                     </div>
                     <div className="flex items-center justify-between mt-3 border-t border-white/5 pt-3">
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Buyer Ledger</span>
                        {!isSeller ? (
                           <span className="text-[8px] font-black text-white/40 uppercase tracking-widest bg-white/5 px-2 py-0.5 rounded-md">You</span>
                        ) : (
                           <div className="flex gap-1">
                              <button 
                                 onClick={() => onMessage?.(booking.buyer_id)}
                                 className="w-8 h-8 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all shrink-0"
                              >
                                 <MessageSquare size={13} />
                              </button>
                              <button 
                                onClick={handleBlockAction}
                                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition-all shrink-0 ${isBlocked ? 'bg-red-500 border-red-500 text-white' : 'bg-white/5 border-white/10 text-red-500/40 hover:text-red-500'}`}
                                title={isBlocked ? "Unblock Buyer" : "Block Buyer"}
                              >
                                <AlertCircle size={13} />
                              </button>
                           </div>
                        )}
                     </div>
                  </div>
               </div>

               {/* Side-by-Side Revision Panel for Client Approval */}
               {activeProposal && activeProposal.status === 'pending_client' && (
                  <div className="p-6 rounded-[2.5rem] bg-gradient-to-br from-amber-500/20 via-[#0a0a0a] to-transparent border border-amber-500/20 shadow-2xl">
                     <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-500">
                           <Edit3 size={20} />
                        </div>
                        <div>
                           <h4 className="text-sm font-black uppercase text-amber-400 tracking-widest">Invoice Revision Proposal</h4>
                           <p className="text-[10px] uppercase font-bold text-white/40 tracking-wider">Awaiting response from {isClient ? "you" : "client"}</p>
                        </div>
                     </div>

                     <div className="space-y-4 mb-8 bg-black/40 p-5 rounded-[1.5rem] border border-white/5">
                        <div className="flex justify-between items-center">
                           <span className="text-[10px] font-black uppercase tracking-widest text-white/30">Total Budget</span>
                           <div className="text-right">
                              <span className="text-white/20 line-through text-[10px] block">₦{(booking.total_price || 0).toLocaleString()}</span>
                              <span className="text-amber-400 font-black text-lg">₦{activeProposal.total_price.toLocaleString()}</span>
                           </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/5">
                           <div>
                              <span className="text-[8px] font-black uppercase text-white/30 block mb-1">Target Deadline</span>
                              <span className="text-xs font-bold text-white">{activeProposal.deadline || "TBD"}</span>
                           </div>
                           <div className="text-right">
                              <span className="text-[8px] font-black uppercase text-white/30 block mb-1">Custom Ops Fee</span>
                              <span className="text-xs font-bold text-white">₦{(activeProposal.custom_charges || 0).toLocaleString()}</span>
                           </div>
                        </div>

                        {activeProposal.revision_terms && (
                           <div className="pt-4 border-t border-white/5">
                              <span className="text-[8px] font-black uppercase text-white/30 block mb-1">Revision Policy</span>
                              <p className="text-[10px] text-white/60 font-medium italic">"{activeProposal.revision_terms}"</p>
                           </div>
                        )}
                     </div>

                     {isClient ? (
                        <div className="grid grid-cols-2 gap-3">
                           <button 
                             onClick={handleRespondentReject}
                             className="h-14 bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 rounded-2xl text-[10px] font-black uppercase tracking-widest text-red-400 transition-all active:scale-95"
                           >
                             Decline
                           </button>
                           <button 
                             onClick={handleRespondentApprove}
                             className="h-14 bg-white text-black hover:bg-white/90 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl transition-all active:scale-95"
                           >
                             Approve
                           </button>
                        </div>
                     ) : (
                        <div className="p-4 bg-white/5 border border-white/5 rounded-2xl text-center">
                           <div className="flex items-center justify-center gap-2 text-amber-400 mb-1">
                              <Clock size={12} />
                              <span className="text-[9px] font-black uppercase tracking-widest">Waiting for Approval</span>
                           </div>
                           <p className="text-[9px] text-white/30">Client has been notified of the changes.</p>
                        </div>
                     )}
                  </div>
               )}

               {/* Special Instructions */}
               {parsedNotes.special_instructions && (
                  <div className="mb-6 animate-in fade-in slide-in-from-bottom-2">
                     <h3 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-4 flex items-center gap-2">
                        <Zap size={12} className="text-amber-500" />
                        Special Instructions
                     </h3>
                     <div className="p-5 rounded-3xl bg-amber-500/5 border border-amber-500/10 text-amber-200/80 text-sm leading-relaxed italic shadow-inner">
                        "{parsedNotes.special_instructions}"
                     </div>
                  </div>
               )}

               {/* Client Request Box */}
               <section className="p-7 rounded-[2.5rem] bg-white/[0.02] border border-white/5 shadow-inner">
                  <div className="mb-6">
                     <span className="text-[9px] font-black uppercase text-blue-400 tracking-widest block mb-3">Client Request Overview</span>
                     <p className="text-sm text-white/80 leading-relaxed font-medium">
                        {booking.notes && !booking.notes.trim().startsWith('{') ? booking.notes : (parsedNotes.client_note || booking.listing?.description || "No specific project notes provided.")}
                     </p>
                  </div>

                  {clientAnswers.length > 0 && (
                     <div className="pt-6 border-t border-white/5 space-y-4">
                        <span className="text-[9px] font-black uppercase text-white/30 tracking-widest block">Project Questionnaire</span>
                        {clientAnswers.map((answer: any, idx: number) => (
                           <div key={idx} className="bg-black/30 p-4 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
                              <p className="text-[10px] font-black text-white/40 mb-2 uppercase tracking-tight">{answer.question}</p>
                              <p className="text-xs font-bold text-white leading-relaxed">{answer.answer}</p>
                           </div>
                        ))}
                     </div>
                  )}

                  {/* Resource Attachments Upload and Tracking Grid */}
                  <div className="pt-6 border-t border-white/5 space-y-4">
                     <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black uppercase text-white/30 tracking-widest block">Project Attachments</span>
                        <span className="text-[8px] font-black uppercase text-[#00ea87] tracking-wider">Secured Local Sync</span>
                     </div>

                     {/* Dynamic File Uploader Card */}
                     <div 
                        onClick={triggerFileSelect} 
                        className="border border-dashed border-white/10 rounded-2xl p-6 text-center cursor-pointer hover:border-blue-500/40 hover:bg-white/[0.01] transition-all group"
                     >
                        <input 
                           type="file" 
                           ref={fileInputRef} 
                           onChange={handleFileChange} 
                           style={{ display: 'none' }}
                           multiple 
                        />
                        <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-3 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                           <Plus size={18} />
                        </div>
                        <p className="text-xs font-bold text-white mb-1">Click to upload project attachments</p>
                        <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest leading-none">Supports PDF, ZIP, Images up to 25MB</p>
                     </div>

                     {uploadedAttachments.length > 0 ? (
                        <div className="grid grid-cols-2 gap-2 mt-3">
                           {uploadedAttachments.map((file: any, idx: number) => (
                              <div key={idx} className="bg-white/5 p-3 rounded-xl border border-white/5 flex items-center justify-between group hover:border-white/10 transition-colors">
                                 <div className="flex items-center gap-3 min-w-0">
                                    <FileText size={16} className="text-blue-400 shrink-0" />
                                    <div className="min-w-0">
                                       <p className="text-[10px] text-white font-bold truncate leading-tight">{file.name || `File ${idx+1}`}</p>
                                       <p className="text-[8px] text-white/40 uppercase font-black leading-none mt-1">{file.size || 'KB'}</p>
                                    </div>
                                 </div>
                                 <button 
                                    onClick={(e) => {
                                       e.preventDefault();
                                       e.stopPropagation();
                                       setUploadedAttachments(uploadedAttachments.filter((_, i) => i !== idx));
                                    }}
                                    className="p-1.5 text-white/20 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors shrink-0"
                                    title="Remove Attachment"
                                 >
                                    <X size={12} />
                                 </button>
                              </div>
                           ))}
                        </div>
                     ) : (
                        <p className="text-[10px] text-white/20 italic font-bold uppercase tracking-widest text-center py-4">No custom files added yet</p>
                     )}
                  </div>
               </section>

               {/* Deliverables Grid */}
               <section className="p-7 rounded-[2.5rem] bg-white/[0.02] border border-white/5">
                  <div className="flex justify-between items-center mb-6">
                     <div>
                        <h4 className="text-xs font-black uppercase tracking-widest">Scope of Deliverables</h4>
                        <p className="text-[9px] text-white/30 uppercase font-bold mt-1">Confirmed during booking</p>
                     </div>
                     <CheckCircle2 size={20} className="text-blue-500/20" />
                  </div>
                  
                  {deliverablesList.length === 0 ? (
                     <div className="py-6 text-center border border-dashed border-white/10 rounded-2xl bg-white/[0.01]">
                        <p className="text-[10px] text-white/30 italic uppercase font-black tracking-widest">Standard Service Scope Applies</p>
                     </div>
                  ) : (
                     <div className="grid gap-3">
                        {deliverablesList.map((item: any, idx: number) => (
                           <div key={idx} className="flex items-center gap-4 p-4 rounded-2xl bg-black/40 border border-white/[0.03] group hover:border-white/10 transition-all">
                              <div className="w-6 h-6 rounded-lg border border-blue-500/30 bg-blue-500/10 flex items-center justify-center shrink-0">
                                 <Check size={12} className="text-blue-400" />
                              </div>
                              <span className="text-xs font-bold text-white/90">{item.title}</span>
                           </div>
                        ))}
                     </div>
                  )}
               </section>

               {/* Financial Architecture */}
               <div className="grid grid-cols-3 gap-3">
                  <section className="p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                     <span className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-3">Budget</span>
                     <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black font-display text-emerald-400">₦{(booking.total_price || 0).toLocaleString()}</span>
                     </div>
                  </section>
                  <section className="p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                     <span className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-3">Deadline</span>
                     <p className="text-[10px] font-black text-white uppercase tracking-tight">{parsedNotes.deadline || 'Flexible'}</p>
                  </section>
                  <section className="p-5 rounded-[2.5rem] bg-white/[0.02] border border-white/5 flex flex-col justify-between">
                     <span className="text-[8px] font-black uppercase text-white/30 tracking-widest mb-3">Created</span>
                     <p className="text-[10px] font-black text-white/60 uppercase tracking-tight">{new Date(booking.created_at).toLocaleDateString()}</p>
                  </section>
               </div>

               {/* Milestones Escrow Breakdown */}
               <section className="p-7 rounded-[2.5rem] bg-[#0c0c0c] border border-white/5 border-l-4 border-l-blue-500/40">
                  <div className="flex justify-between items-center mb-6">
                     <h4 className="text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-blue-400" />
                        Escrow Breakout
                     </h4>
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-tighter">Real-Time Sync</span>
                  </div>
                  <div className="space-y-3">
                     {(booking.milestones || []).map((ms: any, idx: number) => (
                        <div key={ms.id} className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-between group hover:bg-white/[0.05] transition-colors">
                           <div className="flex gap-4 items-center">
                              <div className="w-8 h-8 rounded-xl bg-white/5 border border-white/5 flex items-center justify-center text-[10px] font-black text-white/40">
                                 {idx + 1}
                              </div>
                              <div>
                                 <p className="text-xs font-bold text-white/90">{ms.title || `Milestone ${idx+1}`}</p>
                                 <p className={`text-[8px] font-black uppercase tracking-[0.15em] mt-0.5 ${
                                    ms.status === 'released' ? 'text-emerald-400' : 
                                    ms.status === 'awaiting_approval' ? 'text-amber-400' : 'text-white/20'
                                 }`}>
                                    {ms.status.replace('_', ' ')}
                                 </p>
                              </div>
                           </div>
                           <span className="text-sm font-black text-white">₦{Number(ms.amount).toLocaleString()}</span>
                        </div>
                     ))}
                  </div>
               </section>

               {/* Hustler Actions */}
               {isSeller && booking.status !== "pending" && (
                  <div className="flex flex-col gap-2 mt-4">
                     <button 
                        onClick={() => setIsEditingInvoice(true)}
                        className="w-full h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.01] active:scale-[0.99]"
                     >
                        <Edit3 size={16} className="text-blue-400" />
                        Modify Invoice & Milestones
                     </button>
                  </div>
               )}

            </div>
         )}
      </div>

      {/* Persistent Bottom Control Footer */}
          <footer className="px-6 pt-6 pb-12 bg-gradient-to-t from-[#050505] via-[#050505] to-transparent border-t border-white/5 absolute bottom-0 left-0 right-0 z-[120] flex flex-col gap-4 backdrop-blur-3xl shadow-[0_-20px_40px_rgba(0,0,0,0.8)]">
         {booking.status === "pending" && isSeller ? (
            <div className="flex gap-3">
               {onMessage && (
                  <button 
                     onClick={() => onMessage?.(otherUserId)}
                     className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center hover:bg-white/10 transition-all active:scale-95 text-white/40"
                  >
                     <MessageSquare size={20} />
                  </button>
               )}
               <button 
                  disabled={localLoading}
                  onClick={handleDeclineBooking}
                  className="flex-1 h-16 bg-white/5 border border-white/10 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] transition-all active:scale-95"
               >
                  Decline
               </button>
               <button 
                  disabled={localLoading}
                  onClick={handleAcceptBooking}
                  className="flex-[1.5] h-16 bg-white text-black font-black hover:bg-white/90 rounded-2xl text-[10px] uppercase tracking-[0.2em] transition-all active:scale-95 shadow-2xl shadow-white/10"
               >
                  {localLoading ? "Securing..." : "Accept Hustle"}
               </button>
            </div>
         ) : (
            <div className={`flex gap-3 w-full ${booking.status === 'completed' ? 'opacity-50 pointer-events-none grayscale' : ''}`}>
               {isSeller && (booking.status === 'accepted' || booking.status === 'in_progress') && (
                  <button 
                     onClick={handleDeliverWork}
                     disabled={localLoading}
                     className="flex-1 h-16 bg-emerald-600 hover:bg-emerald-700 rounded-[1.8rem] flex items-center justify-center gap-2 shadow-2xl shadow-emerald-500/20 transition-all hover:scale-[1.02] active:scale-95 border border-emerald-400/20"
                  >
                     <CheckCircle2 size={20} className="text-white" />
                     <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Deliver Work</span>
                  </button>
               )}

               <button 
                  onClick={() => setShowEscrow(true)}
                  className="flex-1 h-16 bg-blue-600 hover:bg-blue-700 rounded-[1.8rem] flex items-center justify-center gap-2 shadow-2xl shadow-blue-600/20 transition-all hover:scale-[1.02] active:scale-95 border border-blue-400/20"
               >
                  <ShieldCheck size={20} className="text-white" />
                  <span className="text-[11px] font-black uppercase tracking-[0.15em] text-white">Open Escrow</span>
               </button>

               {onMessage && (
                  <button 
                     onClick={() => onMessage?.(otherUserId)}
                     className="w-16 h-16 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[1.8rem] flex items-center justify-center hover:scale-110 active:scale-90 transition-all text-white"
                  >
                     <MessageSquare size={20} />
                  </button>
               )}
            </div>
         )}
         {booking.status === 'completed' && (
            <div className="flex flex-col items-center py-2 gap-4">
               <span className="text-[10px] font-black uppercase tracking-widest text-[#00ea87] drop-shadow-[0_0_10px_rgba(0,234,135,0.4)]">Hustle Completed Successfully</span>
               
               {isClient && (
                 <button 
                   onClick={() => setShowReviewModal(true)}
                   className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all text-white shadow-xl max-w-xs active:scale-95"
                 >
                   <Star size={16} className="text-yellow-400" />
                   Rate Experience
                 </button>
               )}
               {isSeller && (
                 <button 
                   className="w-full h-14 bg-white/5 border border-white/10 hover:bg-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all text-white/50 cursor-pointer max-w-xs"
                 >
                   Awaiting Client Review
                 </button>
               )}
            </div>
         )}
      </footer>


      {/* Invoice Editor Modal */}
      <AnimatePresence>
         {isEditingInvoice && (
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 180 }}
              className="fixed inset-0 z-[180] bg-[#0c0c0c] flex flex-col pt-12 text-white overflow-hidden pb-10"
            >
               <header className="px-6 pb-4 border-b border-white/5 flex justify-between items-center">
                  <div className="flex items-center gap-2">
                     <FileText size={18} className="text-blue-400" />
                     <h3 className="text-sm font-black uppercase tracking-widest">Edit Invoice Agreement</h3>
                  </div>
                  <button onClick={() => setIsEditingInvoice(false)} className="p-2 bg-white/5 rounded-full">
                     <X size={18} />
                  </button>
               </header>

               <div className="flex-1 overflow-y-auto p-6 space-y-6 no-scrollbar">
                  <div>
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Change Service Price (₦)</label>
                     <input 
                        type="number" 
                        value={editPrice}
                        onChange={(e) => setEditPrice(Number(e.target.value))}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                     />
                  </div>

                  <div>
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Custom Charges (₦)</label>
                     <input 
                        type="number" 
                        value={editCustomCharges}
                        onChange={(e) => setEditCustomCharges(Number(e.target.value))}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                     />
                  </div>

                  <div>
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Timeline / Proposal Deadline</label>
                     <input 
                        type="date" 
                        value={editDeadline}
                        onChange={(e) => setEditDeadline(e.target.value)}
                        className="w-full h-12 bg-white/5 border border-white/10 rounded-xl px-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500"
                     />
                  </div>

                  <div>
                     <label className="text-[9px] font-black uppercase tracking-widest text-white/30 block mb-2">Revision Terms / Policy</label>
                     <textarea 
                        value={editRevisionTerms}
                        onChange={(e) => setEditRevisionTerms(e.target.value)}
                        placeholder="E.g., 2 standard rounds of complete modifications included."
                        className="w-full h-24 bg-white/5 border border-white/10 rounded-xl p-4 text-xs font-bold text-white focus:outline-none focus:border-blue-500 space-y-1"
                     />
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Edit Scope & Handover Items</label>
                        <button onClick={handleAddDeliverables} className="text-xs font-bold text-blue-400 flex items-center gap-1">
                           <Plus size={12} /> Add Scope Item
                        </button>
                     </div>
                     <div className="space-y-2">
                        {editDeliverables.map((item, idx) => (
                           <div key={item.id} className="flex gap-2">
                              <input 
                                 type="text" 
                                 value={item.title}
                                 onChange={(e) => {
                                    const updated = [...editDeliverables];
                                    updated[idx].title = e.target.value;
                                    setEditDeliverables(updated);
                                 }}
                                 placeholder="E.g., Clean source assets, custom fonts..."
                                 className="flex-1 h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs font-bold text-white focus:outline-none"
                              />
                              <button onClick={() => handleRemoveDeliverables(item.id)} className="w-11 h-11 bg-white/5 border border-white/10 text-red-400 hover:bg-red-400/10 rounded-xl flex items-center justify-center">
                                 <Trash size={14} />
                              </button>
                           </div>
                        ))}
                     </div>
                  </div>

                  <div className="space-y-3">
                     <div className="flex justify-between items-center">
                        <label className="text-[9px] font-black uppercase tracking-widest text-white/30">Adjust Milestone Splits</label>
                        <button onClick={handleAddMilestone} className="text-xs font-bold text-blue-400 flex items-center gap-1">
                           <Plus size={12} /> Add Milestone
                        </button>
                     </div>
                     <div className="space-y-2">
                        {editMilestones.map((m, idx) => (
                           <div key={m.id} className="grid grid-cols-12 gap-2">
                              <input 
                                 type="text" 
                                 value={m.title}
                                 onChange={(e) => {
                                    const updated = [...editMilestones];
                                    updated[idx].title = e.target.value;
                                    setEditMilestones(updated);
                                 }}
                                 placeholder={`Milestone ${idx+1}`}
                                 className="col-span-6 h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs font-bold text-white focus:outline-none"
                              />
                              <input 
                                 type="number" 
                                 value={m.amount}
                                 onChange={(e) => {
                                    const updated = [...editMilestones];
                                    updated[idx].amount = Number(e.target.value);
                                    setEditMilestones(updated);
                                 }}
                                 placeholder="Amount"
                                 className="col-span-4 h-11 bg-white/5 border border-white/10 rounded-xl px-3 text-xs font-bold text-blue-400 focus:outline-none"
                              />
                              <button onClick={() => handleRemoveMilestone(m.id)} className="col-span-2 h-11 bg-white/5 border border-white/10 text-red-400 hover:bg-red-400/10 rounded-xl flex items-center justify-center">
                                 <Trash size={14} />
                              </button>
                           </div>
                        ))}
                     </div>
                     <div className="p-3.5 bg-blue-900/15 border border-blue-500/10 rounded-xl flex justify-between items-center text-xs">
                        <span className="text-blue-400 font-bold uppercase tracking-wider text-[9px]">Sum of Milestones:</span>
                        <span className="font-extrabold text-white">₦{editMilestones.reduce((acc, current) => acc + Number(current.amount), 0).toLocaleString()}</span>
                     </div>
                  </div>
               </div>

               <footer className="px-6 pt-4 border-t border-white/5 flex gap-2">
                  <button 
                     onClick={() => setIsEditingInvoice(false)}
                     className="flex-1 h-14 bg-white/5 border border-white/10 rounded-xl text-[10px] uppercase font-black tracking-widest"
                  >
                     Cancel
                  </button>
                  <button 
                     onClick={handleSendRevisionProposal}
                     className="flex-1 h-14 bg-blue-500 hover:bg-blue-600 rounded-xl text-[10px] uppercase font-black tracking-widest text-white shadow-lg"
                  >
                     Send Proposal
                  </button>
               </footer>
            </motion.div>
         )}
      </AnimatePresence>

      {/* Escrow Manager Overlay */}
      <AnimatePresence>
         {showEscrow && (
            <JobEscrowManager 
               booking={booking} 
               isClient={isClient}
               onClose={() => setShowEscrow(false)} 
            />
         )}
      </AnimatePresence>

      <AnimatePresence>
         {showReviewModal && (
            <ReviewSubmissionModal
               bookingId={booking.id}
               providerName={otherUser?.hustle_name || otherUser?.full_name || 'Provider'}
               onClose={() => setShowReviewModal(false)}
               onSubmit={(data) => {
                  console.log("Review submitted:", data);
                  alert("Review submitted successfully! Thank you for your feedback.");
               }}
            />
         )}
      </AnimatePresence>
    </motion.div>
  );
}
