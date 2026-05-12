import { motion } from "motion/react";
import { 
  ChevronLeft, 
  ShieldCheck, 
  Smartphone, 
  History, 
  Lock, 
  Eye, 
  Fingerprint, 
  BellRing, 
  ArrowRight,
  Shield,
  Activity,
  UserCheck
} from "lucide-react";

interface AccountSafetyCenterProps {
  onClose: () => void;
}

export default function AccountSafetyCenter({ onClose }: AccountSafetyCenterProps) {
  const SECURITY_SCORE = 85;

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      className="fixed inset-0 bg-[#050505] z-[120] flex flex-col text-white"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="p-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-md">
        <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <ChevronLeft size={24} />
        </button>
        <div className="text-center">
          <h2 className="text-xs font-black uppercase tracking-[0.2em]">Safety Center</h2>
          <div className="flex items-center justify-center gap-1.5 mt-1">
             <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
             <span className="text-[9px] font-bold text-white/40 uppercase tracking-widest">System Operational</span>
          </div>
        </div>
        <div className="w-8" />
      </header>

      <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-8">
        
        {/* Security Score Dashboard */}
        <section className="relative p-6 rounded-[32px] bg-gradient-to-br from-blue-600/20 to-blue-500/5 border border-blue-500/20 overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
          
          <div className="flex items-start justify-between relative z-10 mb-6">
            <div>
              <h3 className="text-xl font-display font-black tracking-tighter mb-1">Account Safety</h3>
              <p className="text-[10px] text-blue-400 font-black uppercase tracking-widest">Status: Highly Protected</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
               <ShieldCheck size={24} className="text-white" />
            </div>
          </div>

          <div className="relative h-2 w-full bg-white/5 rounded-full overflow-hidden mb-3">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: `${SECURITY_SCORE}%` }}
               className="h-full bg-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]"
             />
          </div>
          <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
            <span className="text-white/40">Security Score</span>
            <span className="text-white">{SECURITY_SCORE}%</span>
          </div>
        </section>

        {/* Protection Layers */}
        <section>
          <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 mb-4 px-1">Active Protection</h4>
          <div className="space-y-3">
            {[
              { icon: <Lock size={18} />, title: "Two-Factor Auth", status: "Secure", active: true, desc: "Withdrawals require device verification" },
              { icon: <Fingerprint size={18} />, title: "Biometric Access", status: "Active", active: true, desc: "Quick login via FaceID or Fingerprint" },
              { icon: <Activity size={18} />, title: "Fraud Shield", status: "Enabled", active: true, desc: "AI monitoring for unusual activity" },
            ].map((item, i) => (
              <div key={i} className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex gap-4 items-start">
                <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/5 text-blue-400">
                  {item.icon}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white/90">{item.title}</span>
                    <span className="text-[9px] font-black uppercase tracking-widest text-green-400">{item.status}</span>
                  </div>
                  <p className="text-[10px] text-white/30 font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Recent Activity */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">Recent Activity</h4>
            <button className="text-[9px] font-black uppercase tracking-widest text-blue-400">View All</button>
          </div>
          <div className="space-y-2">
            {[
              { title: "New Login", device: "iPhone 15 Pro", location: "Lagos, NG", time: "2m ago", type: "login" },
              { title: "Withdrawal Setup", device: "Desktop Browser", location: "Lagos, NG", time: "1h ago", type: "security" },
            ].map((activity, i) => (
              <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-white/[0.02] border border-white/5">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0">
                    <Smartphone size={14} className="text-white/40" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{activity.title}</p>
                    <p className="text-[9px] text-white/30 font-medium">{activity.device} • {activity.location}</p>
                  </div>
                </div>
                <span className="text-[9px] font-black text-white/20 uppercase whitespace-nowrap">{activity.time}</span>
              </div>
            ))}
          </div>
        </section>

        {/* Global Protection Controls */}
        <section className="space-y-4">
           <button className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-between px-5 group hover:bg-white/10 transition-all">
             <div className="flex items-center gap-3">
               <History size={18} className="text-white/40" />
               <span className="text-xs font-bold">Trusted Devices</span>
             </div>
             <ArrowRight size={16} className="text-white/20 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
           </button>
           <button className="w-full h-14 rounded-2xl border border-orange-500/20 bg-orange-500/5 flex items-center justify-between px-5 group">
             <div className="flex items-center gap-3">
               <Shield size={18} className="text-orange-400/60" />
               <span className="text-xs font-bold text-orange-400">Privacy & Permissions</span>
             </div>
             <ArrowRight size={16} className="text-orange-400/20" />
           </button>
        </section>

        {/* Footer Reassurance */}
        <footer className="pt-8 pb-12 flex flex-col items-center gap-4 border-t border-white/5 text-center">
           <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-blue-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/60">Hustle Shield Guaranteed</span>
           </div>
           <p className="text-[10px] text-white/30 max-w-[240px] leading-relaxed font-medium">
             Your account is protected by industry-leading 256-bit encryption and real-time fraud monitoring.
           </p>
           <button className="h-11 px-8 rounded-full bg-white text-black font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-white/5 active:scale-95 transition-all">
             Sign Out on All Devices
           </button>
        </footer>
      </div>
    </motion.div>
  );
}
