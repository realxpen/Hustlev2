import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  Phone, 
  Mail, 
  FileText, 
  MapPin, 
  Briefcase, 
  CheckCircle2, 
  ChevronRight, 
  AlertCircle,
  X,
  Lock,
  ArrowRight
} from "lucide-react";
import React, { useState } from "react";

interface VerificationCenterProps {
  onClose: () => void;
}

type VerificationStatus = "verified" | "pending" | "unverified";

interface VerificationItem {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  status: VerificationStatus;
  required: boolean;
}

export default function VerificationCenter({ onClose }: VerificationCenterProps) {
  // Mock statuses for the UI demonstration
  const [verifications] = useState<VerificationItem[]>([
    {
      id: "phone",
      title: "Phone Number",
      description: "Secure your account and receive SMS alerts.",
      icon: <Phone size={18} />,
      status: "verified",
      required: true
    },
    {
      id: "email",
      title: "Email Address",
      description: "Receive booking updates and receipts.",
      icon: <Mail size={18} />,
      status: "verified",
      required: true
    },
    {
      id: "identity",
      title: "Identity (Government ID)",
      description: "Required to offer services and accept payments.",
      icon: <FileText size={18} />,
      status: "unverified",
      required: true
    },
    {
      id: "address",
      title: "Physical Address",
      description: "Unlock local discovery and in-person jobs.",
      icon: <MapPin size={18} />,
      status: "pending",
      required: false
    },
    {
      id: "business",
      title: "Business Details",
      description: "For registered LLCs and Corporations.",
      icon: <Briefcase size={18} />,
      status: "unverified",
      required: false
    }
  ]);

  const completedCount = verifications.filter(v => v.status === "verified").length;
  const totalCount = verifications.length;
  
  // Calculate mock Trust Label based on completions for the UI
  const TRUST_LABELS = ["New", "Verified", "Trusted", "Top Rated", "Expert"];
  const currentLabelIndex = Math.min(Math.floor((completedCount / totalCount) * 2), TRUST_LABELS.length - 1);
  const trustLabel = TRUST_LABELS[currentLabelIndex];

  const renderStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case "verified":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <CheckCircle2 size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Verified</span>
          </div>
        );
      case "pending":
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
            <div className="w-3 h-3 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
            <span className="text-[9px] font-black uppercase tracking-widest">Pending Review</span>
          </div>
        );
      case "unverified":
      default:
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/40">
            <AlertCircle size={12} />
            <span className="text-[9px] font-black uppercase tracking-widest">Unverified</span>
          </div>
        );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[200] bg-[#050505] text-white flex flex-col pt-16 overflow-y-auto no-scrollbar"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="px-8 pb-8 flex flex-col gap-2 relative shrink-0">
        <button 
           onClick={onClose}
           className="absolute top-0 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
           <X size={20} />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 shadow-sm shadow-blue-500/10">
           <ShieldCheck size={28} className="text-blue-400" />
        </div>
        <h2 className="text-3xl font-display font-black tracking-tight leading-none uppercase">Verification <br/> Center</h2>
        <p className="text-xs text-white/40 font-medium mt-1 pr-12 leading-relaxed">
          Complete verifications to build trust, unlock higher earning potential, and access premium features.
        </p>
      </header>

      {/* Main Content */}
      <div className="px-6 flex flex-col gap-8 pb-20">
        
        {/* Status Profile & Benefits */}
        <section>
          <div className="bg-gradient-to-br from-blue-900/20 to-transparent border border-blue-500/20 rounded-3xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full" />
            
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-blue-400 mb-1">Trust Profile</h3>
                <div className="text-3xl font-black tracking-tight">{trustLabel}</div>
              </div>
              <div className="w-12 h-12 rounded-full border border-blue-500/30 bg-blue-500/10 flex items-center justify-center relative">
                 <ShieldCheck size={20} className="text-blue-400" />
              </div>
            </div>

            <div className="flex items-center justify-between mb-8 relative z-10 w-full gap-1">
              {TRUST_LABELS.map((label, idx) => (
                <div key={label} className="flex-1 flex flex-col gap-2 items-center">
                  <div className={`w-full h-1.5 rounded-full ${idx <= currentLabelIndex ? 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'bg-white/10'}`} />
                  <span className={`text-[8px] font-black uppercase tracking-widest text-center ${idx <= currentLabelIndex ? 'text-white' : 'text-white/30'}`}>{label}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col gap-2.5 relative z-10">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-white/30 mb-1">Unlocked Benefits</h4>
              {[
                { label: "Accept Direct Bookings", active: currentLabelIndex >= 1 },
                { label: "Withdraw Earnings", active: currentLabelIndex >= 1 },
                { label: "High Placement in Discovery", active: currentLabelIndex >= 2 }
              ].map((benefit, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className={`w-4 h-4 rounded-full flex items-center justify-center ${benefit.active ? 'bg-emerald-500/20 text-emerald-400' : 'bg-white/5 text-white/20'}`}>
                    <CheckCircle2 size={10} />
                  </div>
                  <span className={`text-xs font-medium ${benefit.active ? 'text-white' : 'text-white/40'}`}>{benefit.label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Verification Items */}
        <section className="flex flex-col gap-3">
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 px-1">Required Verifications</h4>
          {verifications.filter(v => v.required).map(v => (
            <VerificationCard key={v.id} item={v} statusBadge={renderStatusBadge(v.status)} />
          ))}

          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-2 mt-4 px-1">Optional Enhancements</h4>
          {verifications.filter(v => !v.required).map(v => (
            <VerificationCard key={v.id} item={v} statusBadge={renderStatusBadge(v.status)} />
          ))}
        </section>

      </div>
    </motion.div>
  );
}

function VerificationCard({ item, statusBadge }: { item: VerificationItem, statusBadge: React.ReactNode, key?: any }) {
  const isActionable = item.status === "unverified" || item.status === "pending";

  return (
    <div className={`p-4 rounded-2xl border transition-all ${item.status === 'verified' ? 'bg-white/5 border-white/5 opacity-70' : 'bg-white/[0.03] border-white/10 hover:bg-white/[0.05]'}`}>
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border ${
          item.status === 'verified' ? 'bg-white/5 border-white/10 text-white/50' :
          item.status === 'pending' ? 'bg-blue-500/10 border-blue-500/20 text-blue-400' :
          'bg-white/10 border-white/20 text-white'
        }`}>
          {item.icon}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center justify-between mb-1">
            <h4 className="text-sm font-bold truncate pr-2">{item.title}</h4>
            <div className="shrink-0">{statusBadge}</div>
          </div>
          <p className="text-xs text-white/40 font-medium leading-relaxed mb-3">
            {item.description}
          </p>
          {isActionable && (
            <button className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-blue-400 hover:text-blue-300 transition-colors">
              {item.status === 'pending' ? 'Review Details' : 'Start Verification'} <ArrowRight size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
