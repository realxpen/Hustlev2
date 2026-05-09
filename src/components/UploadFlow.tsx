import { motion, AnimatePresence } from "motion/react";
import { X, ChevronLeft, Image as ImageIcon, MapPin, Tag, Plus, Check, Sparkles, Video, Camera } from "lucide-react";
import { useState } from "react";

interface UploadFlowProps {
  onClose: () => void;
  onSuccess: () => void;
}

type Step = "media" | "details" | "service" | "success";

export default function UploadFlow({ onClose, onSuccess }: UploadFlowProps) {
  const [step, setStep] = useState<Step>("media");
  const [caption, setCaption] = useState("");
  const [selectedMedia, setSelectedMedia] = useState<number | null>(null);

  const nextStep = () => {
    if (step === "media") setStep("details");
    else if (step === "details") setStep("service");
    else if (step === "service") setStep("success");
  };

  const prevStep = () => {
    if (step === "details") setStep("media");
    else if (step === "service") setStep("details");
  };

  return (
    <motion.div
      initial={{ y: "100%" }}
      animate={{ y: 0 }}
      exit={{ y: "100%" }}
      transition={{ type: "spring", damping: 25, stiffness: 200 }}
      className="fixed inset-0 z-[80] bg-[#050505] flex flex-col text-white pb-10"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Header */}
      <header className="px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/5 relative bg-gradient-to-b from-black/40 to-transparent">
        <div className="flex items-center gap-4">
          {step !== "media" && step !== "success" ? (
            <button onClick={prevStep} className="text-white/40 hover:text-white transition-colors">
              <ChevronLeft size={24} />
            </button>
          ) : (
            <button onClick={onClose} className="text-white/40 hover:text-white transition-colors">
              <X size={24} />
            </button>
          )}
          <h2 className="text-sm font-display font-black tracking-[0.2em] uppercase">
            {step === "media" && "Select Work"}
            {step === "details" && "Add Details"}
            {step === "service" && "Monetize Work"}
            {step === "success" && "Published"}
          </h2>
        </div>

        {step !== "success" && (
           <button 
             disabled={step === "media" && selectedMedia === null}
             onClick={nextStep}
             className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${
               (step === "media" && selectedMedia === null) 
               ? 'bg-white/5 text-white/20' 
               : 'bg-white text-black active:scale-95'
             }`}
           >
             {step === "service" ? "Publish" : "Next"}
           </button>
        )}
      </header>

      {/* Steps Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar pb-24">
        <AnimatePresence mode="wait">
          {step === "media" && (
            <motion.div
              key="media-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between px-1">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30">Your Gallery</h3>
                  <div className="flex gap-4">
                     <Camera size={18} className="text-white/20" />
                     <Video size={18} className="text-white/20" />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[...Array(12)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedMedia(i)}
                      className={`aspect-square rounded-xl bg-white/5 relative border transition-all overflow-hidden ${
                        selectedMedia === i ? 'border-white scale-95' : 'border-white/5'
                      }`}
                    >
                      <div className={`w-full h-full bg-gradient-to-br from-white/10 to-transparent opacity-50`} />
                      {selectedMedia === i && (
                        <div className="absolute top-2 right-2 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center">
                          <Check size={12} strokeWidth={4} />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
                
                <div className="mt-8 p-6 rounded-3xl bg-white/[0.02] border border-white/5 text-center">
                   <Sparkles className="mx-auto text-yellow-500/40 mb-3" size={24} />
                   <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest leading-relaxed">
                     Tip: Videos of you working build 3x more trust than static images.
                   </p>
                </div>
              </div>
            </motion.div>
          )}

          {step === "details" && (
            <motion.div
              key="details-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6 flex flex-col gap-8"
            >
              {/* Media Preview Thumbnail */}
              <div className="aspect-[4/3] w-full rounded-3xl bg-white/5 border border-white/10 relative overflow-hidden flex items-center justify-center">
                 <ImageIcon size={48} className="text-white/10" />
                 <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                 <div className="absolute bottom-4 left-6 right-6">
                    <p className="text-[10px] text-white/60 font-black uppercase tracking-widest">Ayo's Studio • Native Tailor</p>
                 </div>
              </div>

              {/* Form Fields */}
              <div className="flex flex-col gap-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/30 block mb-3 ml-1">Caption</label>
                    <textarea 
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Showcase your hustle... #hair #barber #style"
                      className="w-full h-32 bg-white/[0.03] border border-white/10 rounded-2xl p-4 text-sm font-light outline-none focus:border-white/30 transition-all resize-none"
                    />
                 </div>

                 <div className="flex flex-col gap-3">
                    <button className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                       <div className="flex items-center gap-3">
                          <MapPin size={18} className="text-white/30" />
                          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Add Location</span>
                       </div>
                       <Plus size={16} className="text-white/20" />
                    </button>
                    <button className="w-full h-14 bg-white/[0.03] border border-white/10 rounded-2xl px-6 flex items-center justify-between group hover:bg-white/5 transition-all">
                       <div className="flex items-center gap-3">
                          <Tag size={18} className="text-white/30" />
                          <span className="text-[11px] font-bold uppercase tracking-widest text-white/60">Tag Skills</span>
                       </div>
                       <Plus size={16} className="text-white/20" />
                    </button>
                 </div>
              </div>
            </motion.div>
          )}

          {step === "service" && (
            <motion.div
              key="service-step"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-6"
            >
              <div className="flex flex-col gap-6">
                 <div className="flex flex-col gap-1 mb-2">
                    <h3 className="text-xl font-display font-black tracking-tight">ATTACH SERVICE</h3>
                    <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Make this content bookable</p>
                 </div>

                 {/* Existing Services (Mock) */}
                 <div className="flex flex-col gap-3">
                    <button className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                             <Check size={20} className="text-blue-400" />
                          </div>
                          <div className="text-left">
                             <h4 className="font-bold text-sm">Full Traditional Fit</h4>
                             <p className="text-[10px] text-blue-400/60 font-black uppercase tracking-widest">$45.00 • 3 Days</p>
                          </div>
                       </div>
                    </button>

                    <button className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 flex items-center justify-between group hover:bg-white/5">
                       <div className="flex items-center gap-4 opacity-40">
                          <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                             <Plus size={20} />
                          </div>
                          <div className="text-left">
                             <h4 className="font-bold text-sm">Alterations Only</h4>
                             <p className="text-[10px] uppercase tracking-widest">$12.00 • 1 Day</p>
                          </div>
                       </div>
                    </button>
                 </div>

                 <div className="h-px bg-white/5 my-4" />

                 {/* Custom One-Time Service */}
                 <div className="p-6 rounded-3xl bg-white/[0.02] border border-dashed border-white/10 flex flex-col items-center gap-4 group cursor-pointer hover:bg-white/[0.04] transition-all">
                    <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                       <Plus size={24} className="text-white/40" />
                    </div>
                    <div className="text-center">
                       <h4 className="font-bold text-sm mb-1 uppercase tracking-widest">Create New Service</h4>
                       <p className="text-[9px] text-white/20 font-bold uppercase leading-relaxed max-w-[180px]">Define a new price point for this specific showcase.</p>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {step === "success" && (
            <motion.div
              key="success-step"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="p-8 flex flex-col items-center justify-center min-h-[60vh] text-center"
            >
              <div className="relative mb-10">
                 <motion.div 
                   animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 10, -10, 0]
                   }}
                   transition={{ duration: 3, repeat: Infinity }}
                   className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center relative z-10 shadow-2xl shadow-blue-500/20"
                 >
                    <Check size={40} strokeWidth={4} />
                 </motion.div>
                 <motion.div 
                   animate={{ scale: [1, 1.5, 1], opacity: [0, 0.3, 0] }}
                   transition={{ duration: 2, repeat: Infinity }}
                   className="absolute inset-0 bg-blue-500 rounded-full blur-2xl"
                 />
              </div>

              <h3 className="text-3xl font-display font-black tracking-tight mb-4">ITS ALIVE!</h3>
              <p className="text-[11px] text-white/40 font-bold uppercase tracking-[0.2em] leading-relaxed max-w-[240px]">
                Your hustle is now discoverable to everyone within 5km of your location.
              </p>

              {/* Intelligence Feedback Loop */}
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-6 flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-2 rounded-full"
              >
                 <Sparkles size={12} className="text-blue-400" />
                 <span className="text-[8px] font-black uppercase tracking-[0.2em] text-blue-400">Visibility Boost Active: +25%</span>
              </motion.div>

              <div className="mt-12 flex flex-col gap-3 w-full max-w-[240px]">
                 <button 
                   onClick={onSuccess}
                   className="w-full h-14 bg-white text-black text-[10px] font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-transform"
                 >
                    View My Post
                 </button>
                 <button 
                   onClick={onClose}
                   className="w-full h-14 bg-white/5 text-white/40 text-[10px] font-black uppercase tracking-widest rounded-2xl hover:text-white transition-colors"
                 >
                    Back to Feed
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
