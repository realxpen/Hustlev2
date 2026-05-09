import { motion, AnimatePresence } from "motion/react";
import { 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  PhoneCall, 
  Mail, 
  AlertTriangle, 
  Lock, 
  ShieldAlert, 
  ChevronRight,
  Info,
  X
} from "lucide-react";

interface TrustCenterProps {
  onClose: () => void;
}

const VERIFICATIONS = [
  { id: "phone", label: "Phone Verified", icon: <PhoneCall size={18} />, completed: true },
  { id: "email", label: "Email Verified", icon: <Mail size={18} />, completed: true },
  { id: "identity", label: "Identity Confirmed", icon: <UserCheck size={18} />, completed: false, action: "Verify ID" },
  { id: "hustler", label: "Business Verified", icon: <ShieldCheck size={18} />, completed: false, action: "Connect Business" },
];

const SAFETY_TIPS = [
  { title: "Escrow Protection", desc: "Always pay through Hustle to keep your funds safe until the job is done." },
  { title: "Direct Communication", desc: "Keep conversations in the app to ensure your history is protected." },
  { title: "Review History", desc: "Always check a hustler's past work and reviews before booking." }
];

export default function TrustCenter({ onClose }: TrustCenterProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-0 z-[100] bg-[#050505] text-white flex flex-col pt-16 overflow-y-auto no-scrollbar"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="px-8 pb-10 flex flex-col gap-2 relative">
        <button 
           onClick={onClose}
           className="absolute top-0 right-8 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors"
        >
           <X size={20} />
        </button>
        <div className="w-14 h-14 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center mb-4 shadow-2xl shadow-blue-500/20">
           <ShieldCheck size={28} className="text-blue-400" />
        </div>
        <h2 className="text-2xl font-display font-black tracking-tight leading-none uppercase">Trust & Safety</h2>
        <p className="text-[10px] text-white/30 font-bold uppercase tracking-[0.2em]">Our invisible layer of protection</p>
      </header>

      {/* Main Content */}
      <div className="px-8 flex flex-col gap-10 pb-20">
         
         {/* Identity Verification Progress */}
         <section>
            <div className="flex justify-between items-center mb-6 px-1">
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Your Integrity Score</h4>
               <span className="text-[10px] font-black text-blue-400">Level 2 / 4</span>
            </div>
            <div className="flex flex-col gap-3">
               {VERIFICATIONS.map((v) => (
                  <div 
                    key={v.id}
                    className="p-5 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between"
                  >
                     <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${v.completed ? 'bg-blue-500/10 text-blue-400' : 'bg-white/5 text-white/20'}`}>
                           {v.icon}
                        </div>
                        <span className={`text-[11px] font-bold uppercase tracking-widest ${v.completed ? 'text-white' : 'text-white/20'}`}>
                           {v.label}
                        </span>
                     </div>
                     {v.completed ? (
                        <CheckCircle2 size={16} className="text-emerald-400" />
                     ) : (
                        <button className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-all">
                           {v.action}
                        </button>
                     )}
                  </div>
               ))}
            </div>
         </section>

         {/* Safety Guidance */}
         <section>
            <div className="flex items-center gap-2 mb-6 px-1">
               <ShieldAlert size={14} className="text-yellow-500/40" />
               <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Community Guidelines</h4>
            </div>
            <div className="grid grid-cols-1 gap-4">
               {SAFETY_TIPS.map((tip, idx) => (
                  <div key={idx} className="p-6 rounded-3xl bg-gradient-to-br from-white/[0.02] to-transparent border border-white/5">
                     <h5 className="font-bold text-sm tracking-tight mb-2 text-white/80">{tip.title}</h5>
                     <p className="text-[10px] text-white/30 font-light leading-relaxed uppercase tracking-widest">
                        {tip.desc}
                     </p>
                  </div>
               ))}
            </div>
         </section>

         {/* Support Block */}
         <section className="mt-4 p-8 rounded-[40px] bg-white/[0.02] border border-white/10 text-center relative overflow-hidden group hover:border-white/20 transition-all cursor-pointer">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-blue-500/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Lock size={28} className="mx-auto text-white/10 mb-4" />
            <h4 className="text-sm font-display font-black tracking-widest uppercase text-white/40 mb-2">Need Help?</h4>
            <div className="flex items-center justify-center gap-2">
               <span className="text-white/20 text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                  Connect with Safety Support
               </span>
               <ChevronRight size={14} className="text-white/10" />
            </div>
         </section>
      </div>

      {/* Footer Meta */}
      <footer className="mt-auto px-8 pb-12 opacity-20 flex flex-col items-center gap-3">
         <div className="flex items-center gap-2">
            <ShieldCheck size={12} />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]">Encrypted End-to-End System</span>
         </div>
      </footer>
    </motion.div>
  );
}
