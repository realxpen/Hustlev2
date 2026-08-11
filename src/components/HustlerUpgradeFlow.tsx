import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Sparkles, User, MapPin, Phone, CheckCircle2, AlertCircle, RefreshCcw, Camera, Video, UploadCloud, Info, TrendingUp, ShieldCheck, ArrowRight, Briefcase, CreditCard, Zap, FileText } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";

interface HustlerUpgradeFlowProps {
  onClose: () => void;
  onSuccess: (data?: any) => void;
  initialStep?: UpgradeStep;
}

export type UpgradeStep = "intro" | "basic_info" | "skills" | "portfolio" | "review" | "status" | "success" | "rejected" | "needs_info";

export default function HustlerUpgradeFlow({ onClose, onSuccess, initialStep }: HustlerUpgradeFlowProps) {
  const [step, setStep] = useState<UpgradeStep>(initialStep || "intro");
  
  // Basic Info
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  // Skills
  const [primarySkill, setPrimarySkill] = useState("");
  const [secondarySkills, setSecondarySkills] = useState("");
  const [experienceYears, setExperienceYears] = useState("");

  // Portfolio
  const [photosAttached, setPhotosAttached] = useState(false);
  const [videosAttached, setVideosAttached] = useState(false);
  const [certificationsAttached, setCertificationsAttached] = useState(false);

  const [reviewStatus, setReviewStatus] = useState<"pending" | "approved" | "rejected" | "needs_info">("pending");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const progressSteps = ["basic_info", "skills", "portfolio", "review"];
  const currentStepIndex = progressSteps.indexOf(step as any);

  useEffect(() => {
    let channel: any;

    async function checkExistingVerification() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        const { data } = await supabase
          .from('creator_verifications')
          .select('*')
          .eq('user_id', user.id)
          .maybeSingle();
          
        if (data) {
          const d = data as any;
          
          // Map backend status to our local status
          let localStatus = d.status;
          if (localStatus === 'pending_info') localStatus = 'needs_info';

          setReviewStatus(localStatus);
          
          if (localStatus === 'pending') {
            setStep('status');
          } else if (localStatus === 'approved') {
            setStep('success');
          } else if (localStatus === 'rejected') {
            setStep('rejected');
          } else if (localStatus === 'needs_info') {
            setStep('needs_info');
          }
          
          if (d.submission_metadata) {
            const meta = d.submission_metadata as any;
            if (meta.fullName) setFullName(meta.fullName);
            if (meta.phone) setPhone(meta.phone);
            if (meta.location) setLocation(meta.location);
            if (meta.primarySkill) setPrimarySkill(meta.primarySkill);
            if (meta.secondarySkills) setSecondarySkills(meta.secondarySkills);
            if (meta.experienceYears) setExperienceYears(meta.experienceYears);
            if (meta.photosAttached) setPhotosAttached(meta.photosAttached);
            if (meta.videosAttached) setVideosAttached(meta.videosAttached);
            if (meta.certificationsAttached) setCertificationsAttached(meta.certificationsAttached);
          }
        }

        channel = supabase
          .channel(`my-verification-${user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'creator_verifications',
              filter: `user_id=eq.${user.id}`
            },
            (payload) => {
              const updated = payload.new as any;
              if (updated) {
                let localStatus = updated.status;
                if (localStatus === 'pending_info') localStatus = 'needs_info';

                setReviewStatus(localStatus);
                if (localStatus === 'pending') {
                  setStep('status');
                } else if (localStatus === 'approved') {
                  setStep('success');
                } else if (localStatus === 'rejected') {
                  setStep('rejected');
                } else if (localStatus === 'needs_info') {
                  setStep('needs_info');
                }
              }
            }
          )
          .subscribe();
      } catch (err) {
        console.error("Failed to load application status:", err);
      }
    }

    checkExistingVerification();

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const handleSubmitApplication = async () => {
    setIsSubmitting(true);
    setErrorMessage("");
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const metadata = {
        fullName,
        phone,
        location,
        primarySkill,
        secondarySkills,
        experienceYears,
        photosAttached,
        videosAttached,
        certificationsAttached,
        submitted_at: new Date().toISOString()
      };

      const { data: existing } = await supabase
        .from('creator_verifications')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      let error;
      if (existing) {
        const res = await supabase
          .from('creator_verifications')
          .update({
            status: 'pending',
            verification_type: 'hustler_application',
            submission_metadata: metadata,
            submitted_at: new Date().toISOString()
          })
          .eq('user_id', user.id);
        error = res.error;
      } else {
        const res = await supabase
          .from('creator_verifications')
          .insert({
            user_id: user.id,
            verification_type: 'hustler_application',
            status: 'pending',
            submission_metadata: metadata
          });
        error = res.error;
      }

      if (error) throw error;
      setReviewStatus('pending');
      setStep('status');
    } catch (err: any) {
      console.error("Submit application error:", err);
      setErrorMessage(err.message || "Failed to submit application.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] bg-[#0c0c0c] flex flex-col pt-12 text-white overflow-hidden"
    >
      <header className="px-6 flex items-center justify-between pointer-events-auto z-10 relative mb-4">
        <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        {currentStepIndex >= 0 && ["basic_info", "skills", "portfolio", "review"].includes(step) && (
           <div className="flex gap-1.5">
             {progressSteps.map((s, i) => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${i <= currentStepIndex ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]' : 'w-3 bg-white/10'}`} 
                />
             ))}
           </div>
        )}

        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-4 no-scrollbar relative z-10">
        <AnimatePresence mode="wait">
          
          {/* INTRO */}
          {step === "intro" && (
            <motion.div
              key="intro"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center text-center max-w-sm mx-auto h-full"
            >
              <div className="w-24 h-24 bg-blue-600/10 border border-blue-500/20 rounded-full flex items-center justify-center mb-8 relative">
                <Sparkles size={40} className="text-blue-400 z-10" />
                <div className="absolute inset-0 bg-blue-500/5 blur-xl rounded-full" />
              </div>
              <h1 className="text-4xl font-display font-black tracking-tight mb-4">
                Turn your skill into <span className="text-blue-400 italic block">Income.</span>
              </h1>
              <p className="text-white/60 font-medium leading-relaxed mb-10">
                Become a Hustler to list services, accept bookings, and earn.
              </p>

              <button 
                onClick={() => setStep("basic_info")}
                className="w-full h-16 mt-auto bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs shadow-xl active:scale-[0.98] transition-transform hover:bg-blue-500"
              >
                Apply Now
              </button>
            </motion.div>
          )}

          {/* STEP 1: BASIC INFO */}
          {step === "basic_info" && (
            <motion.div
              key="basic_info"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col max-w-sm mx-auto h-full"
            >
              <div className="mb-8">
                <h2 className="text-3xl font-display font-black tracking-tight mb-2">Basic Information</h2>
                <p className="text-white/40 font-medium text-sm">Let clients know who they are working with.</p>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">Full Name</label>
                  <div className="relative">
                    <User size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      value={fullName} onChange={e => setFullName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:border-blue-500 focus:bg-white/10 transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">Phone</label>
                  <div className="relative">
                    <Phone size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      placeholder="+1 (555) 000-0000"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:border-blue-500 focus:bg-white/10 transition-all outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">Location</label>
                  <div className="relative">
                    <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input 
                      value={location} onChange={e => setLocation(e.target.value)}
                      placeholder="City, State"
                      className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl pl-12 pr-4 text-white text-sm focus:border-blue-500 focus:bg-white/10 transition-all outline-none"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setStep("skills")}
                disabled={!fullName || !phone || !location}
                className="w-full h-16 mt-auto bg-white disabled:opacity-40 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 2: SKILLS */}
          {step === "skills" && (
            <motion.div
              key="skills"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col max-w-sm mx-auto h-full"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                    <h2 className="text-3xl font-display font-black tracking-tight mb-2">Skills</h2>
                    <p className="text-white/40 font-medium text-sm">Define your primary offering.</p>
                </div>
                <button onClick={() => setStep("basic_info")} className="text-white/40 hover:text-white p-2 border border-white/10 bg-white/5 rounded-full"><ChevronLeft size={16}/></button>
              </div>

              <div className="flex flex-col gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">Primary Skill</label>
                  <input 
                    value={primarySkill} onChange={e => setPrimarySkill(e.target.value)}
                    placeholder="e.g. Plumber, Graphic Designer"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">Secondary Skills</label>
                  <input 
                    value={secondarySkills} onChange={e => setSecondarySkills(e.target.value)}
                    placeholder="e.g. Painting, Illustration"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm focus:border-blue-500 transition-all outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-2 block">Years of Experience</label>
                  <input 
                    type="number" value={experienceYears} onChange={e => setExperienceYears(e.target.value)}
                    placeholder="e.g. 5"
                    className="w-full h-14 bg-white/5 border border-white/10 rounded-2xl px-4 text-white text-sm focus:border-blue-500 transition-all outline-none"
                  />
                </div>
              </div>

              <button 
                onClick={() => setStep("portfolio")}
                disabled={!primarySkill || !experienceYears}
                className="w-full h-16 mt-auto bg-white disabled:opacity-40 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 3: PORTFOLIO */}
          {step === "portfolio" && (
             <motion.div
              key="portfolio"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col max-w-sm mx-auto h-full"
             >
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-display font-black tracking-tight mb-2">Portfolio</h2>
                    <p className="text-white/40 font-medium text-sm">Upload proof of work.</p>
                  </div>
                  <button onClick={() => setStep("skills")} className="text-white/40 hover:text-white p-2 border border-white/10 bg-white/5 rounded-full"><ChevronLeft size={16}/></button>
                </div>

                <div className="space-y-4">
                  <div 
                    onClick={() => setPhotosAttached(!photosAttached)}
                    className={`h-24 rounded-2xl border-2 border-dashed flex flex-col flex-1 items-center justify-center cursor-pointer transition-all ${photosAttached ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                     <Camera size={24} className={photosAttached ? 'text-blue-400 mb-2' : 'text-white/40 mb-2'} />
                     <span className={`text-[10px] font-black uppercase tracking-widest ${photosAttached ? 'text-blue-400' : 'text-white/60'}`}>{photosAttached ? 'Photos Added' : 'Upload Photos'}</span>
                  </div>

                  <div 
                    onClick={() => setVideosAttached(!videosAttached)}
                    className={`h-24 rounded-2xl border-2 border-dashed flex flex-col flex-1 items-center justify-center cursor-pointer transition-all ${videosAttached ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                     <Video size={24} className={videosAttached ? 'text-indigo-400 mb-2' : 'text-white/40 mb-2'} />
                     <span className={`text-[10px] font-black uppercase tracking-widest ${videosAttached ? 'text-indigo-400' : 'text-white/60'}`}>{videosAttached ? 'Videos Added' : 'Upload Videos'}</span>
                  </div>

                  <div 
                    onClick={() => setCertificationsAttached(!certificationsAttached)}
                    className={`h-24 rounded-2xl border flex flex-col items-center justify-center cursor-pointer transition-all ${certificationsAttached ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                  >
                     <FileText size={24} className={certificationsAttached ? 'text-yellow-400 mb-2' : 'text-white/40 mb-2'} />
                     <span className={`text-[10px] font-black uppercase tracking-widest ${certificationsAttached ? 'text-yellow-400' : 'text-white/60'}`}>{certificationsAttached ? 'Certifications Added' : 'Certifications (Optional)'}</span>
                  </div>
                </div>

                <button 
                 onClick={() => setStep("review")}
                 disabled={!photosAttached && !videosAttached}
                 className="w-full h-16 mt-auto bg-white disabled:opacity-40 text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform"
                >
                  Review
                </button>
             </motion.div>
          )}

          {/* STEP 4: REVIEW */}
          {step === "review" && (
             <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col max-w-sm mx-auto h-full"
             >
                <div className="mb-6 flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-display font-black tracking-tight mb-2">Review</h2>
                    <p className="text-white/40 font-medium text-sm">Verify your details before submission.</p>
                  </div>
                  <button onClick={() => setStep("portfolio")} className="text-white/40 hover:text-white p-2 border border-white/10 bg-white/5 rounded-full"><ChevronLeft size={16}/></button>
                </div>

                <div className="flex flex-col gap-4 overflow-y-auto no-scrollbar pb-6">
                   <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Basic Information</h4>
                     <p className="text-sm font-medium text-white mb-1"><span className="text-white/50 w-20 inline-block">Name:</span> {fullName}</p>
                     <p className="text-sm font-medium text-white mb-1"><span className="text-white/50 w-20 inline-block">Phone:</span> {phone}</p>
                     <p className="text-sm font-medium text-white mb-1"><span className="text-white/50 w-20 inline-block">Location:</span> {location}</p>
                   </div>

                   <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Skills</h4>
                     <p className="text-sm font-medium text-white mb-1"><span className="text-white/50 w-20 inline-block">Primary:</span> {primarySkill}</p>
                     <p className="text-sm font-medium text-white mb-1"><span className="text-white/50 w-20 inline-block">Secondary:</span> {secondarySkills || 'None'}</p>
                     <p className="text-sm font-medium text-white mb-1"><span className="text-white/50 w-20 inline-block">Experience:</span> {experienceYears} Years</p>
                   </div>

                   <div className="p-5 bg-white/5 rounded-[2rem] border border-white/10 text-sm">
                     <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3">Portfolio</h4>
                     {photosAttached && <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 mr-2 mb-2 font-medium">Photos attached</span>}
                     {videosAttached && <span className="inline-flex items-center gap-1 text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded border border-indigo-500/20 mr-2 mb-2 font-medium">Videos attached</span>}
                     {certificationsAttached && <span className="inline-flex items-center gap-1 text-yellow-400 bg-yellow-500/10 px-2 py-1 rounded border border-yellow-500/20 mr-2 mb-2 font-medium">Certifications attached</span>}
                   </div>
                </div>

                {errorMessage && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-400 text-xs rounded-2xl flex items-center gap-2 mb-4">
                    <AlertCircle size={14} />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <button 
                  onClick={handleSubmitApplication}
                  disabled={isSubmitting}
                  className="w-full h-16 mt-auto bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform shadow-[0_0_40px_rgba(59,130,246,0.5)] flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : "Submit Application"}
                </button>
             </motion.div>
          )}

          {/* APPLICATION STATUS: PENDING */}
          {step === "status" && (
             <motion.div
              key="status"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center max-w-sm mx-auto h-full text-center"
             >
                <div className="w-24 h-24 rounded-[3rem] bg-yellow-500/10 border border-yellow-500/30 flex items-center justify-center mb-6">
                   <RefreshCcw size={40} className="text-yellow-500 animate-spin-slow" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tight mb-2 uppercase">Pending</h2>
                <p className="text-white/50 text-sm font-medium leading-relaxed mb-10 max-w-[260px]">
                   Your application is currently under review. This usually takes 1-2 hours.
                </p>

                <div className="w-full mt-auto p-4 border border-dashed border-white/20 rounded-2xl text-left bg-white/5">
                   <p className="text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-3">Admin Testing Actions</p>
                   <div className="grid grid-cols-2 gap-2">
                     <button onClick={() => { setReviewStatus('approved'); setStep('success'); }} className="py-3 bg-green-500/20 text-green-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-green-500/30">Approve</button>
                     <button onClick={() => { setReviewStatus('rejected'); setStep('rejected'); }} className="py-3 bg-red-500/20 text-red-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-red-500/30">Reject</button>
                     <button onClick={() => { setReviewStatus('needs_info'); setStep('needs_info'); }} className="py-3 bg-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-blue-500/30 col-span-2">Needs More Information</button>
                   </div>
                </div>
             </motion.div>
          )}

          {/* APPLICATION STATUS: APPROVED */}
          {step === "success" && (
             <motion.div
              key="success"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center justify-center text-center h-full max-w-sm mx-auto"
             >
                <div className="w-24 h-24 bg-green-500/10 border border-green-500/30 rounded-full flex items-center justify-center mb-6 relative">
                   <CheckCircle2 size={48} className="text-green-500 z-10" />
                   <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
                </div>
                
                <h2 className="text-3xl font-display font-black tracking-tight mb-2 uppercase">Approved</h2>
                <p className="text-white/60 text-sm font-medium leading-relaxed mb-6 max-w-[280px]">
                   Welcome to Hustle. Your skills have been verified and you can now list services.
                </p>

                <button 
                  onClick={() => onSuccess()}
                  className="w-full h-16 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-all hover:bg-blue-500 mt-auto"
                >
                  Go to Hub
                </button>
             </motion.div>
          )}

          {/* APPLICATION STATUS: REJECTED */}
          {step === "rejected" && (
             <motion.div
              key="rejected"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center max-w-sm mx-auto h-full text-center"
             >
                <div className="w-24 h-24 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-6">
                   <X size={40} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tight mb-2 uppercase">Rejected</h2>
                <p className="text-white/50 text-sm font-medium leading-relaxed mb-8 max-w-[280px]">
                   Unfortunately, your application did not meet our community standards.
                </p>

                <button onClick={onClose} className="w-full h-16 mt-auto bg-white/5 text-white/50 rounded-2xl font-black uppercase tracking-[0.2em] text-xs hover:text-white transition-colors">
                  Close
                </button>
             </motion.div>
          )}

          {/* APPLICATION STATUS: NEEDS MORE INFORMATION */}
          {step === "needs_info" && (
             <motion.div
              key="needs_info"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center max-w-sm mx-auto h-full text-center"
             >
                <div className="w-24 h-24 rounded-[2rem] bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-6">
                   <AlertCircle size={40} className="text-blue-500" />
                </div>
                <h2 className="text-3xl font-display font-black tracking-tight mb-2 uppercase leading-tight">Needs More<br/>Information</h2>
                <p className="text-white/50 text-sm font-medium leading-relaxed mb-8 max-w-[280px]">
                   We need clearer portfolio attachments to verify your skill level.
                </p>

                <button 
                  onClick={() => { setStep("portfolio"); }}
                  className="w-full h-16 mt-auto bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform"
                >
                  Update Portfolio
                </button>
             </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}

