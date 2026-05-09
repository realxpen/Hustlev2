import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Sparkles, Camera, Briefcase, Globe, CheckCircle2, TrendingUp } from "lucide-react";
import { useState } from "react";

interface HustlerUpgradeFlowProps {
  onClose: () => void;
  onSuccess: () => void;
}

type UpgradeStep = "intro" | "skill" | "bio" | "media" | "review" | "success";

export default function HustlerUpgradeFlow({ onClose, onSuccess }: HustlerUpgradeFlowProps) {
  const [step, setStep] = useState<UpgradeStep>("intro");
  const [skill, setSkill] = useState("");

  const steps: UpgradeStep[] = ["intro", "skill", "bio", "media", "review", "success"];
  const currentStepIndex = steps.indexOf(step);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black flex flex-col pt-12 text-white overflow-hidden"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Progress Header */}
      <header className="px-6 flex items-center justify-between pointer-events-auto">
        <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        {step !== "success" && (
           <div className="flex gap-1.5">
             {steps.slice(1, -1).map((s, i) => (
                <div 
                  key={s} 
                  className={`h-1 rounded-full transition-all duration-500 ${i <= currentStepIndex - 1 ? 'w-8 bg-white' : 'w-2 bg-white/10'}`} 
                />
             ))}
           </div>
        )}

        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-12 no-scrollbar">
        <AnimatePresence mode="wait">
          {/* STEP 1: INTRO / VALUE PROP */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center max-w-sm mx-auto"
            >
              <div className="w-20 h-20 bg-white/5 border border-white/10 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
                <Sparkles size={40} className="text-white" />
              </div>
              <h1 className="text-4xl font-display font-black tracking-tight mb-4">
                Turn your skill into <span className="text-white/40 italic text-3xl">Income.</span>
              </h1>
              <p className="text-white/60 font-light leading-relaxed mb-12">
                Hustle gives you the visibility and tools to run your street-real economy. No resumes, just real work.
              </p>

              <div className="w-full flex flex-col gap-6 items-start text-left mb-12">
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                       <TrendingUp size={20} className="text-blue-400" />
                    </div>
                    <div>
                       <h3 className="font-bold text-sm">Instant Visibility</h3>
                       <p className="text-xs text-white/40 font-light mt-0.5">Appear in feed for everyone near you.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0">
                       <Briefcase size={20} className="text-purple-400" />
                    </div>
                    <div>
                       <h3 className="font-bold text-sm">Direct Bookings</h3>
                       <p className="text-xs text-white/40 font-light mt-0.5">Clients hire you with a single tap.</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setStep("skill")}
                className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-2xl shadow-white/5 active:scale-[0.98] transition-transform"
              >
                Become a Hustler
              </button>
            </motion.div>
          )}

          {/* STEP 2: SKILL CATEGORY */}
          {step === "skill" && (
            <motion.div
              key="skill"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
            >
              <div>
                <h2 className="text-3xl font-display font-black tracking-tight mb-2">What's your skill?</h2>
                <p className="text-white/40 font-light tracking-wide">Tell the community what you offer.</p>
              </div>

              <div className="grid grid-cols-1 gap-3">
                 {[ "UI/UX Design", "Product Photography", "Visual Branding", "Software Engineering", "Motion Graphics", "Content Strategy" ].map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setSkill(s);
                        setStep("bio");
                      }}
                      className={`h-16 px-6 rounded-2xl border text-left flex items-center justify-between transition-all group ${skill === s ? 'bg-white border-white text-black' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                    >
                      <span className="font-bold tracking-wide">{s}</span>
                      <ChevronRight size={18} className={skill === s ? 'text-black/40' : 'text-white/10'} />
                    </button>
                 ))}
                 <button className="h-16 px-6 rounded-2xl border border-dashed border-white/20 text-white/30 text-left font-medium hover:border-white/40 transition-colors">
                    Something else...
                 </button>
              </div>
            </motion.div>
          )}

          {/* STEP 3: BIO/DESCRIPTION */}
          {step === "bio" && (
             <motion.div
              key="bio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
             >
                <div className="flex flex-col gap-2">
                   <button onClick={() => setStep("skill")} className="w-fit flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      <ChevronLeft size={14} /> Back
                   </button>
                   <h2 className="text-3xl font-display font-black tracking-tight">Your story.</h2>
                   <p className="text-white/40 font-light">Why should people trust your work?</p>
                </div>

                <div className="flex flex-col gap-4">
                   <textarea 
                     placeholder="Describe your passion and process..."
                     className="w-full h-48 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-md font-light placeholder:text-white/20 focus:border-white/30 focus:bg-white/10 transition-all outline-none resize-none"
                   />
                   <div className="flex items-center gap-2 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                      <Globe size={16} className="text-blue-400" />
                      <p className="text-[10px] text-blue-400 font-bold uppercase tracking-widest">Profiles with bios get 70% more bookings</p>
                   </div>
                </div>

                <button 
                  onClick={() => setStep("media")}
                  className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs mt-4 active:scale-[0.98] transition-transform"
                >
                  Continue
                </button>
             </motion.div>
          )}

          {/* STEP 4: WORK SAMPLES */}
          {step === "media" && (
             <motion.div
              key="media"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
             >
                <div className="flex flex-col gap-2">
                  <button onClick={() => setStep("bio")} className="w-fit flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      <ChevronLeft size={14} /> Back
                   </button>
                  <h2 className="text-3xl font-display font-black tracking-tight">Proof of skill.</h2>
                  <p className="text-white/40 font-light">Upload at least 3 photos or videos of your work.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="aspect-[3/4] rounded-2xl bg-white/10 border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-3 group cursor-pointer hover:bg-white/15 transition-all">
                      <Camera size={24} className="text-white/40 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-white/20 group-hover:text-white/40 transition-colors">Cover Media</span>
                   </div>
                   <div className="aspect-[3/4] rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
                         <X size={16} className="text-white/20 rotate-45" />
                      </div>
                   </div>
                </div>
                
                <p className="text-center text-xs font-light text-white/30 tracking-wide mt-4">
                   Show your process, results, or reactions.
                </p>

                <button 
                  onClick={() => setStep("review")}
                  className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs mt-4 active:scale-[0.98] transition-transform"
                >
                  Go to Review
                </button>
             </motion.div>
          )}

          {/* STEP 5: REVIEW & GO LIVE */}
          {step === "review" && (
             <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8"
             >
                <div className="flex flex-col gap-2">
                  <button onClick={() => setStep("media")} className="w-fit flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-white/40 mb-2">
                      <ChevronLeft size={14} /> Back
                   </button>
                  <h2 className="text-3xl font-display font-black tracking-tight">One last check.</h2>
                  <p className="text-white/40 font-light">Review your identity before you go live.</p>
                </div>

                <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col gap-6">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-white/10 border border-white/20 shadow-xl" />
                      <div>
                         <h3 className="font-bold text-xl">User Name</h3>
                         <p className="text-xs text-white/40 uppercase tracking-widest font-bold font-display">{skill}</p>
                      </div>
                   </div>
                   
                   <div className="h-[1px] bg-white/5" />

                   <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-green-400">
                         <CheckCircle2 size={14} />
                         <span className="text-[10px] font-bold uppercase tracking-widest">Safe Marketplace Ready</span>
                      </div>
                      <p className="text-xs text-white/50 leading-relaxed font-light">
                         Your profile will be visible in the feed. Clients can book services and message you directly.
                      </p>
                   </div>
                </div>

                <div className="mt-4 text-center">
                   <p className="text-[10px] text-white/20 font-bold uppercase tracking-widest leading-relaxed px-8">
                      By going live, you agree to the Hustler Code of Conduct & Standards
                   </p>
                </div>

                <button 
                  onClick={() => setStep("success")}
                  className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform shadow-[0_0_50px_rgba(255,255,255,0.1)]"
                >
                  Go Live
                </button>
             </motion.div>
          )}

          {/* STEP 6: SUCCESS */}
          {step === "success" && (
             <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="flex flex-col items-center text-center py-12"
             >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-10 shadow-[0_0_60px_rgba(34,197,94,0.3)]">
                   <CheckCircle2 size={48} className="text-white" />
                </div>
                
                <h2 className="text-4xl font-display font-black tracking-tight mb-4">You're a Hustler.</h2>
                <p className="text-white/40 text-sm font-light max-w-[280px] leading-relaxed mb-16">
                   Your skills are now visible to the economy of you. Start posting content to get discovered.
                </p>

                <button 
                  onClick={onSuccess}
                  className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs"
                >
                  Enter Marketplace
                </button>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
