import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Sparkles, Camera, Briefcase, Globe, CheckCircle2, TrendingUp, UploadCloud, Smartphone, Mail, FileText, AlertCircle, RefreshCcw, Info, ArrowRight, ShieldCheck, Zap, CreditCard } from "lucide-react";
import { useState, useEffect } from "react";

interface HustlerUpgradeFlowProps {
  onClose: () => void;
  onSuccess: (data?: { skill: string, experience: string }) => void;
  initialStep?: UpgradeStep;
}

export type UpgradeStep = "intro" | "skill" | "experience" | "media" | "bio" | "identity" | "status" | "success" | "rejected";

export default function HustlerUpgradeFlow({ onClose, onSuccess, initialStep }: HustlerUpgradeFlowProps) {
  const [step, setStep] = useState<UpgradeStep>(initialStep || "intro");
  const [skill, setSkill] = useState("");
  const [experience, setExperience] = useState("");
  const [identityMethod, setIdentityMethod] = useState<"phone" | "email">("phone");
  const [reviewStatus, setReviewStatus] = useState<"pending" | "approved" | "rejected">("pending");
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customSkill, setCustomSkill] = useState("");

  const progressSteps = ["skill", "experience", "media", "bio", "identity"];
  const currentStepIndex = progressSteps.indexOf(step as any);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-black flex flex-col pt-12 text-white overflow-hidden"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Progress Header */}
      <header className="px-6 flex items-center justify-between pointer-events-auto z-10 relative">
        <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        {currentStepIndex >= 0 && step !== "status" && step !== "success" && step !== "rejected" && (
           <div className="flex gap-1.5">
             {progressSteps.map((s, i) => (
                <div 
                  key={s} 
                  className={`h-1 rounded-full transition-all duration-500 ${i <= currentStepIndex ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-2 bg-white/10'}`} 
                />
             ))}
           </div>
        )}

        <div className="w-10" /> {/* Spacer */}
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar relative z-10">
        <AnimatePresence mode="wait">
          {/* STEP 1: INTRO / VALUE PROP */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center max-w-sm mx-auto mt-4"
            >
              <div className="w-24 h-24 bg-blue-600/20 border border-blue-500/30 rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(59,130,246,0.2)] relative">
                <Sparkles size={40} className="text-blue-400 z-10" />
                <div className="absolute inset-0 bg-blue-500/10 blur-xl rounded-full animate-pulse" />
              </div>
              <h1 className="text-4xl font-display font-black tracking-tight mb-4">
                Turn your skill into <span className="text-blue-400 italic text-4xl leading-tight block">Income.</span>
              </h1>
              <p className="text-white/60 font-light leading-relaxed mb-10 max-w-[280px]">
                Hustle validates your craft and connects you with clients. No resumes, just real work.
              </p>

              <div className="w-full flex flex-col gap-6 items-start text-left mb-12 p-6 bg-white/[0.03] rounded-[2rem] border border-white/5">
                 <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                       <TrendingUp size={20} className="text-blue-400" />
                    </div>
                    <div>
                       <h3 className="font-black text-sm uppercase tracking-tight text-white mb-1">Instant Visibility</h3>
                       <p className="text-xs text-white/50 font-medium">Appear in discovery feeds automatically.</p>
                    </div>
                 </div>
                 <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
                       <ShieldCheck size={20} className="text-purple-400" />
                    </div>
                    <div>
                       <h3 className="font-black text-sm uppercase tracking-tight text-white mb-1">Verified Trust</h3>
                       <p className="text-xs text-white/50 font-medium">Escrow protection on every booking.</p>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setStep("skill")}
                className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-[0_0_40px_rgba(59,130,246,0.3)] active:scale-[0.98] transition-transform hover:bg-blue-500 flex items-center justify-center gap-2"
              >
                Start Application <ArrowRight size={16} />
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
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div>
                {initialStep === "skill" ? (
                  <button onClick={onClose} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 hover:text-white">
                    <ChevronLeft size={14} /> Cancel
                  </button>
                ) : (
                  <button onClick={() => setStep("intro")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 hover:text-white">
                    <ChevronLeft size={14} /> Back
                  </button>
                )}
                <h2 className="text-3xl font-display font-black tracking-tight mb-2">
                  {initialStep === "skill" ? "Add to your Stack" : "What's your craft?"}
                </h2>
                <p className="text-white/40 font-medium text-sm">
                  {initialStep === "skill" ? "Select a secondary hustle skill." : "Select your primary offering."}
                </p>
              </div>

              {showCustomInput ? (
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    value={customSkill}
                    onChange={(e) => setCustomSkill(e.target.value)}
                    placeholder="Type custom skill..."
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm font-medium placeholder:text-white/20 focus:border-blue-500 focus:bg-white/10 transition-all outline-none"
                    autoFocus
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowCustomInput(false)}
                      className="flex-1 h-12 rounded-xl bg-white/5 text-white text-[10px] font-black uppercase tracking-widest"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        if (customSkill.trim()) {
                          const s = customSkill.trim();
                          setSkill(s);
                          setTimeout(() => setStep("experience"), 200);
                        }
                      }}
                      className="flex-1 h-12 rounded-xl bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest hover:bg-blue-500"
                    >
                      Add Skill
                    </button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 overflow-y-auto pb-4 no-scrollbar">
                   {[ "Graphic Design", "Plumbing & Repairs", "Personal Training", "Software Engineering", "Photography", "Beauty & Styling", "Delivery & Moving" ].map((s) => (
                      <button
                        key={s}
                        onClick={() => {
                          setSkill(s);
                          setTimeout(() => setStep("experience"), 200);
                        }}
                        className={`h-16 px-6 rounded-2xl border text-left flex items-center justify-between transition-all group active:scale-[0.98] ${skill === s ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'}`}
                      >
                        <span className="font-black tracking-wide">{s}</span>
                        <ChevronRight size={18} className={skill === s ? 'text-blue-400' : 'text-white/10'} />
                      </button>
                   ))}
                   <button 
                     onClick={() => setShowCustomInput(true)}
                     className="h-16 px-6 rounded-2xl border border-dashed border-white/20 text-white/40 text-left font-black tracking-wide hover:border-white/40 transition-colors"
                   >
                      Something else...
                   </button>
                </div>
              )}
            </motion.div>
          )}

          {/* STEP 3: EXPERIENCE LEVEL */}
          {step === "experience" && (
            <motion.div
              key="experience"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div>
                <button onClick={() => setStep("skill")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-4 hover:text-white">
                  <ChevronLeft size={14} /> Back
                </button>
                <h2 className="text-3xl font-display font-black tracking-tight mb-2">Level of expertise?</h2>
                <p className="text-white/40 font-medium text-sm">Honesty builds trust. We verify this later.</p>
              </div>

              <div className="flex flex-col gap-4">
                 {[
                   { id: "Beginner", label: "Emerging", desc: "Just starting out, building portfolio. (Lower rates)" },
                   { id: "Intermediate", label: "Professional", desc: "Consistent track record, standard industry rates." },
                   { id: "Expert", label: "Expert / Master", desc: "Top tier quality, premium pricing, verifiable history." }
                 ].map((exp) => (
                    <button
                      key={exp.id}
                      onClick={() => {
                        setExperience(exp.id);
                        setTimeout(() => setStep("media"), 200);
                      }}
                      className={`p-6 rounded-3xl border text-left flex flex-col gap-2 transition-all group active:scale-[0.98] ${experience === exp.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <span className={`text-lg font-black tracking-tight uppercase ${experience === exp.id ? 'text-blue-400' : 'text-white'}`}>{exp.label}</span>
                      <span className="text-xs text-white/50 font-medium leading-relaxed">{exp.desc}</span>
                    </button>
                 ))}
              </div>
            </motion.div>
          )}

          {/* STEP 4: WORK SAMPLES */}
          {step === "media" && (
             <motion.div
              key="media"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
             >
                <div className="flex flex-col gap-2">
                  <button onClick={() => setStep("experience")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                      <ChevronLeft size={14} /> Back
                   </button>
                  <h2 className="text-3xl font-display font-black tracking-tight mb-1">Proof of work.</h2>
                  <p className="text-white/40 font-medium text-sm">Upload images, videos, or portfolio links.</p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                   <div className="aspect-square rounded-[2rem] bg-indigo-500/10 border-2 border-dashed border-indigo-500/30 flex flex-col items-center justify-center gap-3 hover:bg-indigo-500/20 transition-all cursor-pointer">
                      <UploadCloud size={28} className="text-indigo-400" />
                      <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Upload Media</span>
                   </div>
                   <div className="aspect-square rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer text-white/30">
                      <Globe size={28} className="opacity-50" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Add Link</span>
                   </div>
                </div>
                
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-start gap-3">
                   <Info size={16} className="text-yellow-500 shrink-0 mt-0.5" />
                   <p className="text-xs text-yellow-500/80 font-medium leading-relaxed">
                     Our trust team reviews these manually. High-quality proof speeds up approval.
                   </p>
                </div>

                <button 
                  onClick={() => setStep("bio")}
                  className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs mt-auto active:scale-[0.98] transition-transform"
                >
                  Continue
                </button>
             </motion.div>
          )}

          {/* STEP 5: SERVICE DESCRIPTION */}
          {step === "bio" && (
             <motion.div
              key="bio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
             >
                <div className="flex flex-col gap-2">
                   <button onClick={() => setStep("media")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                      <ChevronLeft size={14} /> Back
                   </button>
                   <h2 className="text-3xl font-display font-black tracking-tight mb-1">Define your service.</h2>
                   <p className="text-white/40 font-medium text-sm">What exactly are you offering clients?</p>
                </div>

                <div className="flex flex-col gap-5">
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block pl-2">Service Title</label>
                     <input 
                       placeholder="e.g. Logo Design, Sink Repair"
                       className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm font-medium placeholder:text-white/20 focus:border-blue-500 focus:bg-white/10 transition-all outline-none"
                     />
                   </div>
                   
                   <div>
                     <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 block pl-2">Details</label>
                     <textarea 
                       placeholder="Describe deliverables, timeframes, and process..."
                       className="w-full h-32 bg-white/5 border border-white/10 rounded-2xl p-6 text-white text-sm font-medium placeholder:text-white/20 focus:border-blue-500 focus:bg-white/10 transition-all outline-none resize-none"
                     />
                   </div>
                </div>

                <button 
                  onClick={() => setStep("identity")}
                  className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs mt-auto active:scale-[0.98] transition-transform"
                >
                  Continue
                </button>
             </motion.div>
          )}

          {/* STEP 6: IDENTITY CONFIRMATION */}
          {step === "identity" && (
             <motion.div
              key="identity"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
             >
                <div className="flex flex-col gap-2">
                  <button onClick={() => setStep("bio")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                      <ChevronLeft size={14} /> Back
                   </button>
                  <h2 className="text-3xl font-display font-black tracking-tight mb-1">Verify Identity.</h2>
                  <p className="text-white/40 font-medium text-sm">We keep the marketplace safe from bots.</p>
                </div>

                <div className="flex flex-col gap-4 mb-4">
                  <div className="flex bg-white/5 border border-white/10 p-1 rounded-2xl">
                     <button 
                       onClick={() => setIdentityMethod('phone')}
                       className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${identityMethod === 'phone' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                     >
                        <Smartphone size={14} /> SMS
                     </button>
                     <button 
                       onClick={() => setIdentityMethod('email')}
                       className={`flex-1 py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${identityMethod === 'email' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                     >
                        <Mail size={14} /> Email
                     </button>
                  </div>

                  <input 
                    placeholder={identityMethod === 'phone' ? "+1 Phone Number" : "Email Address"}
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-sm font-medium placeholder:text-white/20 focus:border-blue-500 focus:bg-white/10 transition-all outline-none"
                  />
                </div>

                <div className="p-5 rounded-3xl bg-white/5 border border-white/10 border-dashed flex items-center gap-4 group hover:bg-white/10 transition-all cursor-pointer">
                   <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center shrink-0">
                      <FileText size={20} className="text-white/60 group-hover:text-white" />
                   </div>
                   <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-tight">Optional: Government ID</h4>
                      <p className="text-[10px] font-medium text-white/40 mt-1 leading-relaxed">Speeds up approval and unlocks "Identity Verified" badge instantly.</p>
                   </div>
                </div>

                <button 
                  onClick={() => setStep("status")}
                  className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs mt-auto active:scale-[0.98] transition-transform shadow-[0_0_40px_rgba(59,130,246,0.3)] hover:bg-blue-500"
                >
                  Submit Application
                </button>
             </motion.div>
          )}

          {/* STEP 7: STATUS TRACKING */}
          {step === "status" && (
             <motion.div
              key="status"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center max-w-sm mx-auto h-full text-center py-10 pt-20"
             >
                {reviewStatus === "pending" && (
                  <>
                    <div className="w-24 h-24 rounded-[3rem] bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-8 relative">
                       <RefreshCcw size={40} className="text-yellow-500 animate-spin-slow" />
                       <div className="absolute inset-0 bg-yellow-500/20 blur-xl rounded-full" />
                    </div>
                    <h2 className="text-3xl font-display font-black tracking-tight mb-3">Application Under Review</h2>
                    <p className="text-white/50 text-sm font-medium leading-relaxed mb-10 max-w-[260px]">
                       Our trust team is verifying your portfolio and identity. This usually takes 1-2 hours.
                    </p>

                    <div className="w-full bg-white/5 rounded-3xl p-6 border border-white/10 flex flex-col gap-4 text-left mb-auto">
                       <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest">Application Progress</h4>
                       <div className="flex gap-3 items-start">
                          <CheckCircle2 size={16} className="text-green-500 shrink-0 mt-0.5" />
                          <div>
                            <p className="text-xs font-black text-white">Identity Confirmed</p>
                            <p className="text-[10px] text-white/40 mt-0.5">Phone verification complete.</p>
                          </div>
                       </div>
                       <div className="flex gap-3 items-start opacity-50">
                          <RefreshCcw size={16} className="text-yellow-500 shrink-0 mt-0.5 animate-spin-slow" />
                          <div>
                            <p className="text-xs font-black text-white">Skill Verification</p>
                            <p className="text-[10px] text-white/40 mt-0.5">Evaluating portfolio quality.</p>
                          </div>
                       </div>
                    </div>

                    {/* Developer Sandbox Controls */}
                    <div className="w-full mt-8 p-4 border border-dashed border-white/20 rounded-2xl bg-black/50 backdrop-blur-md">
                       <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">Developer Simulation</p>
                       <div className="flex gap-2">
                         <button onClick={() => { setReviewStatus('approved'); setTimeout(() => setStep('success'), 500) }} className="flex-1 py-3 bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-500/30">Approve</button>
                         <button onClick={() => { setReviewStatus('rejected'); setTimeout(() => setStep('rejected'), 500) }} className="flex-1 py-3 bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/30">Reject</button>
                       </div>
                    </div>
                  </>
                )}
             </motion.div>
          )}

          {/* STEP 8: REJECTED STATE */}
          {step === "rejected" && (
             <motion.div
              key="rejected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center max-w-sm mx-auto h-full text-center py-10"
             >
                <div className="w-24 h-24 rounded-[3rem] bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-8 relative">
                   <AlertCircle size={40} className="text-red-500" />
                   <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tight mb-3">Needs Polish</h2>
                <p className="text-white/50 text-sm font-medium leading-relaxed mb-8 max-w-[280px]">
                   Your application didn't meet the current marketplace quality bar. Help us understand your skills better.
                </p>

                <div className="w-full bg-[#0c0c0c] rounded-[2rem] p-6 border border-white/10 text-left mb-8 relative overflow-hidden shadow-2xl">
                   <div className="absolute top-0 left-0 w-1 h-full bg-red-500" />
                   <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-3">Review Feedback</h4>
                   <p className="text-sm text-white font-medium mb-4">"The uploaded portfolio items are pixelated and do not clearly demonstrate the deliverables for the proposed service."</p>
                   
                   <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-2 mt-4">How to fix this:</h4>
                   <ul className="text-xs text-white/70 space-y-2 font-medium">
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/20" /> Upload high-resolution images.</li>
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/20" /> Include before/after context.</li>
                     <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-white/20" /> Link an external professional site.</li>
                   </ul>
                </div>

                <div className="flex flex-col gap-3 w-full mt-auto">
                  <button 
                    onClick={() => { setStep("media"); setReviewStatus('pending'); }}
                    className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform shadow-xl"
                  >
                    Update Portfolio
                  </button>
                  <button onClick={onClose} className="w-full h-16 bg-transparent text-white/40 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:text-white transition-colors">
                    Close for now
                  </button>
                </div>
             </motion.div>
          )}

          {/* STEP 9: SUCCESS / UNLOCKED STATE */}
          {step === "success" && (
             <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 100 }}
              className="flex flex-col items-center text-center py-6 h-full"
             >
                <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(34,197,94,0.3)] relative">
                   <CheckCircle2 size={48} className="text-white z-10" />
                   <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                </div>
                
                <h2 className="text-4xl font-display font-black tracking-tighter mb-4 uppercase">You're In.</h2>
                <p className="text-green-400 text-[10px] font-black uppercase tracking-widest mb-8 border border-green-500/30 bg-green-500/10 px-4 py-1.5 rounded-full">
                   Verified Hustler Badge Unlocked
                </p>

                <div className="w-full flex flex-col gap-3 text-left mb-auto">
                   <h4 className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1 text-center">New Capabilities Unlocked</h4>
                   
                   {[
                     { icon: <Briefcase size={16}/>, title: "Create Services", sub: "Charge clients directly." },
                     { icon: <CreditCard size={16}/>, title: "Earnings Dashboard", sub: "Track escrow and payouts." },
                     { icon: <Zap size={16} className="text-blue-400"/>, title: "Marketplace Visibility", sub: "Algorithm exposure active." }
                   ].map((u, i) => (
                      <div key={i} className="flex items-center gap-4 bg-[#0c0c0c] border border-white/10 p-5 rounded-[2rem]">
                         <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center text-white shrink-0">
                            {u.icon}
                         </div>
                         <div>
                            <h4 className="font-black text-white uppercase tracking-tight leading-tight">{u.title}</h4>
                            <p className="text-[10px] font-medium text-white/40 mt-0.5">{u.sub}</p>
                         </div>
                      </div>
                   ))}
                </div>

                <div className="w-full mt-6 flex flex-col gap-4">
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-2xl flex items-start gap-3 text-left">
                     <Info size={16} className="text-blue-400 shrink-0 mt-0.5" />
                     <div>
                       <p className="text-[11px] font-black text-blue-400 uppercase tracking-widest mb-1">Onboarding Tip</p>
                       <p className="text-[11px] text-blue-400/70 font-medium leading-relaxed">
                         Set up your first service listing from your new Hub. Include clear pricing and delivery times to secure your first booking.
                       </p>
                     </div>
                  </div>

                  <button 
                    onClick={() => onSuccess({ skill, experience })}
                    className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-all hover:bg-blue-500 shadow-[0_0_40px_rgba(59,130,246,0.4)]"
                  >
                    Enter My Hub
                  </button>
                </div>
             </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
