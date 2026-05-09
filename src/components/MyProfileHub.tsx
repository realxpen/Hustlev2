import { motion, AnimatePresence } from "motion/react";
import { User, Settings, Star, TrendingUp, CheckCircle2, ArrowRight, Shield, Sparkles, Briefcase, Plus, Clock, MapPin, MessageSquare, History, CreditCard, Heart } from "lucide-react";
import { useState } from "react";
import HustlerUpgradeFlow from "./HustlerUpgradeFlow";

interface MyProfileHubProps {
  isHustler?: boolean;
  onHustlerModeChange?: (isHustler: boolean) => void;
}

export default function MyProfileHub({ isHustler = false, onHustlerModeChange }: MyProfileHubProps) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [hustlerMode, setHustlerMode] = useState(isHustler);
  const [activeRole, setActiveRole] = useState<"client" | "hustler">(hustlerMode ? "hustler" : "client");

  const completion = hustlerMode ? 95 : 65;

  const milestones = [
    { date: "May 2024", event: "Earned 'Verified Pro' Badge", type: "achievement" },
    { date: "Apr 2024", event: "Reached 50 Completed Jobs", type: "stat" },
    { date: "Mar 2024", event: "Became a Hustler", type: "role" },
    { date: "Feb 2024", event: "Joined Hustle Community", type: "system" },
  ];

  return (
    <div className="min-h-screen bg-transparent text-white p-6 pb-24 overflow-y-auto no-scrollbar relative" id="profile-hub">
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="flex justify-between items-center mb-10 pt-4">
        <h2 className="text-xl font-display font-black tracking-[0.2em] uppercase">My Hub</h2>
        <button className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-colors">
          <Settings size={20} />
        </button>
      </header>

      {/* Role Switcher - Segmented Control (Only if Hustler) */}
      {hustlerMode && (
         <div className="mb-8 p-1 bg-white/5 border border-white/5 rounded-2xl flex relative h-12">
            <motion.div 
               className="absolute top-1 bottom-1 bg-white rounded-xl shadow-xl z-0"
               initial={false}
               animate={{ 
                  left: activeRole === "client" ? "4px" : "50%",
                  right: activeRole === "client" ? "50%" : "4px"
               }}
               transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
            />
            <button 
               onClick={() => setActiveRole("client")}
               className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${activeRole === "client" ? "text-black" : "text-white/40"}`}
            >
               <User size={14} /> Client 
            </button>
            <button 
               onClick={() => setActiveRole("hustler")}
               className={`flex-1 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest relative z-10 transition-colors ${activeRole === "hustler" ? "text-black" : "text-white/40"}`}
            >
               <Briefcase size={14} /> Hustler
            </button>
         </div>
      )}

      {/* Identity Card */}
      <section className="mb-10">
        <div className="relative p-8 rounded-[38px] bg-gradient-to-br from-white/10 to-transparent border border-white/10 overflow-hidden shadow-2xl">
          {/* Decorative Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl rounded-full" />
          
          <div className="flex flex-col items-center gap-4 text-center relative z-10">
             <div className="relative group">
                <div className="w-24 h-24 rounded-full border-4 border-white/5 overflow-hidden bg-white/5 relative">
                   <div className="w-full h-full flex items-center justify-center text-4xl font-display font-black text-white/20">
                     U
                   </div>
                </div>
                {hustlerMode && (
                   <motion.div 
                     initial={{ scale: 0 }}
                     animate={{ scale: 1 }}
                     className="absolute bottom-1 right-1 w-8 h-8 bg-blue-500 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center"
                   >
                      <Briefcase size={12} className="text-white" />
                   </motion.div>
                )}
             </div>
             <div>
                <h3 className="text-2xl font-display font-black tracking-tight">Alex Hustler</h3>
                <div className="flex items-center justify-center gap-2 mt-1">
                   <span className="text-[10px] text-white/40 uppercase tracking-[0.2em] font-bold font-display">
                      {activeRole === "hustler" ? "Professional Visual Artist" : "Community Client"}
                   </span>
                   {hustlerMode && activeRole === "hustler" && <CheckCircle2 size={12} className="text-blue-400" />}
                </div>
             </div>
             
             {/* Dynamic Stats Row */}
             <div className="grid grid-cols-3 gap-6 mt-4 w-full px-4">
                <div className="flex flex-col gap-1">
                   <p className="text-xs font-black">124</p>
                   <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Followers</p>
                </div>
                <div className="flex flex-col gap-1 border-x border-white/5">
                   <p className="text-xs font-black">{activeRole === "hustler" ? "52" : "18"}</p>
                   <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">{activeRole === "hustler" ? "Jobs" : "Booked"}</p>
                </div>
                <div className="flex flex-col gap-1">
                   <p className="text-xs font-black">4.9</p>
                   <p className="text-[8px] text-white/20 font-bold uppercase tracking-widest">Rating</p>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Evolution Content Switch */}
      <AnimatePresence mode="wait">
         {activeRole === "hustler" ? (
            <motion.div
               key="hustler-content"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="flex flex-col gap-10"
            >
               {/* Hustler Business Intel */}
               <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2 mb-4">Hustler Intel</h4>
                  <div className="grid grid-cols-2 gap-4">
                     <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-4">
                        <TrendingUp size={20} className="text-blue-400" />
                        <div>
                           <p className="text-xl font-display font-black leading-none">342</p>
                           <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Profile Views</p>
                        </div>
                     </div>
                     <div className="p-5 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col gap-4">
                        <Heart size={20} className="text-red-400" />
                        <div>
                           <p className="text-xl font-display font-black leading-none">88%</p>
                           <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest mt-1">Repeat Rate</p>
                        </div>
                     </div>
                  </div>
               </section>

               {/* Growth Timeline */}
               <section>
                  <div className="flex justify-between items-center px-2 mb-4">
                     <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Evolution Timeline</h4>
                     <span className="text-[10px] font-bold uppercase text-blue-400">Level 4 Pro</span>
                  </div>
                  <div className="p-8 rounded-[32px] bg-white/[0.02] border border-white/5 flex flex-col gap-8 relative">
                     {/* Line */}
                     <div className="absolute left-10 top-12 bottom-12 w-[1px] bg-white/5" />
                     
                     {milestones.map((ms, i) => (
                        <div key={i} className="flex gap-6 relative z-10">
                           <div className={`w-4 h-4 rounded-full mt-1 shrink-0 ${
                              ms.type === 'achievement' ? 'bg-yellow-500 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 
                              ms.type === 'role' ? 'bg-blue-500' : 'bg-white/20'
                           }`} />
                           <div>
                              <p className="text-[11px] font-black tracking-tight">{ms.event}</p>
                              <p className="text-[9px] text-white/20 font-bold uppercase tracking-widest mt-0.5">{ms.date}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               </section>
            </motion.div>
         ) : (
            <motion.div
               key="client-content"
               initial={{ opacity: 0, y: 10 }}
               animate={{ opacity: 1, y: 0 }}
               exit={{ opacity: 0, y: -10 }}
               className="flex flex-col gap-10"
            >
               {/* Client Actions */}
               <section>
                  <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 ml-2 mb-4">Client Dashboard</h4>
                  <div className="grid grid-cols-2 gap-3">
                     {[
                        { icon: <History size={16} />, label: "History", color: "bg-white/5" },
                        { icon: <Heart size={16} />, label: "Saved", color: "bg-white/5" },
                        { icon: <CreditCard size={16} />, label: "Wallet", color: "bg-white/5" },
                        { icon: <MessageSquare size={16} />, label: "Support", color: "bg-white/5" },
                     ].map((item, i) => (
                        <button key={i} className={`p-5 rounded-2xl ${item.color} border border-white/5 flex flex-col items-start gap-4 hover:border-white/20 transition-all`}>
                           <div className="text-white/40">{item.icon}</div>
                           <span className="text-[10px] font-black uppercase tracking-widest">{item.label}</span>
                        </button>
                     ))}
                  </div>
               </section>

               {/* Become a Hustler CTA (Only if not already one) */}
               {!hustlerMode && (
                  <section>
                     <motion.button 
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setShowUpgrade(true)}
                        className="w-full p-8 rounded-[40px] bg-white text-black flex items-center justify-between group overflow-hidden relative"
                     >
                        <div className="absolute top-0 right-0 p-4 opacity-5 bg-black rounded-bl-full">
                           <Sparkles size={100} />
                        </div>
                        <div className="flex items-center gap-5 relative z-10">
                           <div className="w-14 h-14 bg-black rounded-2xl flex items-center justify-center text-white">
                              <Sparkles size={28} />
                           </div>
                           <div className="text-left">
                              <h5 className="font-black text-lg uppercase tracking-tight leading-none">Unlock Income</h5>
                              <p className="text-[10px] font-bold text-black/50 tracking-wider mt-1">Upgrade your profile to Hustler Mode</p>
                           </div>
                        </div>
                        <ArrowRight size={24} className="text-black/40 group-hover:translate-x-1 transition-transform relative z-10" />
                     </motion.button>
                  </section>
               )}
            </motion.div>
         )}
      </AnimatePresence>

      {/* Role Guide (Psychology) */}
      <section className="mt-12 p-8 rounded-[32px] bg-white/[0.02] border border-white/5 text-center relative overflow-hidden">
         <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-br from-blue-500/5 to-purple-500/5 pointer-events-none" />
         <h4 className="text-xl font-display font-black tracking-tight mb-2">Evolution of You</h4>
         <p className="text-white/30 text-xs font-light leading-relaxed max-w-[200px] mx-auto">
            Hustle is built to let you grow from a client into a community leader. Every step unlocks new economic potential.
         </p>
      </section>

      {/* Upgrade Flow Overlay */}
      <AnimatePresence>
         {showUpgrade && (
            <HustlerUpgradeFlow 
               onClose={() => setShowUpgrade(false)} 
               onSuccess={() => {
                  setShowUpgrade(false);
                  setHustlerMode(true);
                  setActiveRole("hustler");
                  if (onHustlerModeChange) onHustlerModeChange(true);
               }} 
            />
         )}
      </AnimatePresence>
    </div>
  );
}
