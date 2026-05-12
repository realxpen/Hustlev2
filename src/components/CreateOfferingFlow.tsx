import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Sparkles, Plus, Image as ImageIcon, Video, AlignLeft, Tag, Clock, Calendar, CheckCircle2, Zap, ArrowRight, DollarSign, UploadCloud, Rocket, BarChart2 } from "lucide-react";
import { useState } from "react";

interface CreateOfferingFlowProps {
  onClose: () => void;
  onSuccess: (listing: any) => void;
}

type Step = "type" | "title" | "description" | "pricing" | "delivery" | "media" | "availability" | "preview" | "published";

export default function CreateOfferingFlow({ onClose, onSuccess }: CreateOfferingFlowProps) {
  const [step, setStep] = useState<Step>("type");
  const [offeringType, setOfferingType] = useState<"Service"|"Product"|"Training">("Service");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [priceType, setPriceType] = useState<"Fixed"|"Starting"|"Custom"|"Hourly">("Fixed");
  const [price, setPrice] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState<"Remote"|"On-site"|"Instant"|"Scheduled">("Remote");

  const progressSteps = ["type", "title", "description", "pricing", "delivery", "media", "availability"];
  const currentStepIndex = progressSteps.indexOf(step as any);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[120] bg-black flex flex-col pt-12 text-white overflow-hidden"
    >
      <div className="grain-overlay pointer-events-none" />

      {/* Progress Header */}
      <header className="px-6 flex items-center justify-between pointer-events-auto z-10 relative">
        <button onClick={onClose} className="p-2 -ml-2 text-white/40 hover:text-white transition-colors">
          <X size={24} />
        </button>
        
        {currentStepIndex >= 0 && step !== "preview" && step !== "published" && (
           <div className="flex gap-1.5">
             {progressSteps.map((s, i) => (
                <div 
                  key={s} 
                  className={`h-1.5 rounded-full transition-all duration-500 ${i <= currentStepIndex ? 'w-8 bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]' : 'w-2 bg-white/10'}`} 
                />
             ))}
           </div>
        )}

        <div className="w-10" />
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 no-scrollbar relative z-10">
        <AnimatePresence mode="wait">
          
          {/* STEP 1: TYPE */}
          {step === "type" && (
            <motion.div
              key="type"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div>
                <h2 className="text-3xl font-display font-black tracking-tight mb-2">What are you offering?</h2>
                <p className="text-white/40 font-medium text-sm">Choose the type of listing you want to create.</p>
              </div>

              <div className="flex flex-col gap-4 mt-4">
                 {[
                   { id: "Service", label: "Service", desc: "Freelance work, consulting, physical tasks.", icon: <Zap size={20}/> },
                   { id: "Product", label: "Product", desc: "Digital downloads, templates, physical goods.", icon: <Tag size={20}/> },
                   { id: "Training", label: "Training", desc: "Apprenticeships, 1-on-1 coaching, courses.", icon: <Rocket size={20}/> }
                 ].map((t) => (
                    <button
                      key={t.id}
                      onClick={() => {
                        setOfferingType(t.id as any);
                        setTimeout(() => setStep("title"), 200);
                      }}
                      className={`p-6 rounded-3xl border text-left flex flex-col gap-3 transition-all group active:scale-[0.98] ${offeringType === t.id ? 'bg-blue-600/20 border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border ${offeringType === t.id ? 'bg-blue-500 text-white border-blue-400' : 'bg-white/5 text-white/40 border-white/10 group-hover:text-white'}`}>
                        {t.icon}
                      </div>
                      <div>
                        <span className={`text-xl font-black tracking-tight uppercase ${offeringType === t.id ? 'text-blue-400' : 'text-white'}`}>{t.label}</span>
                        <p className="text-xs text-white/50 font-medium leading-relaxed mt-1">{t.desc}</p>
                      </div>
                    </button>
                 ))}
              </div>
            </motion.div>
          )}

          {/* STEP 2: TITLE & CATEGORY */}
          {step === "title" && (
            <motion.div
              key="title"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div className="flex flex-col gap-2">
                 <button onClick={() => setStep("type")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                    <ChevronLeft size={14} /> Back
                 </button>
                 <h2 className="text-3xl font-display font-black tracking-tight mb-1">Name your {offeringType.toLowerCase()}.</h2>
                 <p className="text-white/40 font-medium text-sm">Make it catchy and descriptive.</p>
              </div>

              <div className="flex flex-col gap-6">
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 block pl-2">Title</label>
                   <input 
                     value={title}
                     onChange={(e) => setTitle(e.target.value)}
                     placeholder={`e.g. Premium Logo Design`}
                     className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white text-lg font-bold placeholder:text-white/20 focus:border-blue-500 focus:bg-white/10 transition-all outline-none"
                   />
                 </div>
                 
                 <div>
                   <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 block pl-2">Category</label>
                   <div className="grid grid-cols-2 gap-2">
                     {["Design", "Engineering", "Marketing", "Writing", "Consulting", "Other"].map(cat => (
                        <button 
                          key={cat}
                          onClick={() => setCategory(cat)}
                          className={`h-12 rounded-xl text-xs font-black tracking-widest uppercase transition-all ${category === cat ? 'bg-blue-500 text-white' : 'bg-white/5 text-white/40 hover:bg-white/10'}`}
                        >
                          {cat}
                        </button>
                     ))}
                   </div>
                 </div>
              </div>

              <button 
                onClick={() => setStep("description")}
                disabled={!title || !category}
                className="w-full h-16 mt-auto bg-white text-black disabled:bg-white/20 disabled:text-white/40 rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 3: DESCRIPTION */}
          {step === "description" && (
            <motion.div
              key="description"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div className="flex flex-col gap-2">
                 <button onClick={() => setStep("title")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                    <ChevronLeft size={14} /> Back
                 </button>
                 <h2 className="text-3xl font-display font-black tracking-tight mb-1">Outline the details.</h2>
                 <p className="text-white/40 font-medium text-sm">What does the client get?</p>
              </div>

              <div className="flex flex-col gap-4 flex-1">
                 <textarea 
                   value={description}
                   onChange={(e) => setDescription(e.target.value)}
                   placeholder="Describe what's included, your process, and why they should choose you..."
                   className="w-full h-48 bg-white/5 border border-white/10 rounded-3xl p-6 text-white text-sm font-medium placeholder:text-white/20 focus:border-blue-500 focus:bg-white/10 transition-all outline-none resize-none"
                 />
                 
                 <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
                    <h4 className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-2">Pro Tip</h4>
                    <p className="text-xs text-blue-400/80 font-medium leading-relaxed">
                      Use bullet points to highlight key deliverables. Clients skim descriptions looking for specific outcomes.
                    </p>
                 </div>
              </div>

              <button 
                onClick={() => setStep("pricing")}
                disabled={!description}
                className="w-full h-16 bg-white text-black disabled:bg-white/20 disabled:text-white/40 rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 4: PRICING */}
          {step === "pricing" && (
            <motion.div
              key="pricing"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div className="flex flex-col gap-2">
                 <button onClick={() => setStep("description")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                    <ChevronLeft size={14} /> Back
                 </button>
                 <h2 className="text-3xl font-display font-black tracking-tight mb-1">Set your price.</h2>
                 <p className="text-white/40 font-medium text-sm">How do you charge for this?</p>
              </div>

              <div className="flex flex-col gap-6">
                 <div className="grid grid-cols-2 gap-3">
                   {["Fixed", "Starting", "Custom", "Hourly"].map(pt => (
                      <button 
                        key={pt}
                        onClick={() => setPriceType(pt as any)}
                        className={`h-14 rounded-2xl border text-xs font-black tracking-widest uppercase transition-all ${priceType === pt ? 'bg-blue-600/20 border-blue-500 text-blue-400' : 'bg-white/5 border-white/10 text-white/40 hover:bg-white/10'}`}
                      >
                        {pt}
                      </button>
                   ))}
                 </div>

                 {priceType !== "Custom" && (
                   <div className="relative">
                     <span className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 font-black text-2xl">$</span>
                     <input 
                       type="number"
                       value={price}
                       onChange={(e) => setPrice(e.target.value)}
                       placeholder="0.00"
                       className="w-full h-20 bg-white/5 border border-white/10 rounded-[2rem] pl-14 pr-6 text-white text-3xl font-black placeholder:text-white/20 focus:border-blue-500 focus:bg-white/10 transition-all outline-none"
                     />
                   </div>
                 )}
                 
                 {priceType === "Starting" && (
                   <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">Price will show as "From ${price || '0'}"</p>
                 )}
              </div>

              <button 
                onClick={() => setStep("delivery")}
                disabled={priceType !== "Custom" && !price}
                className="w-full h-16 mt-auto bg-white text-black disabled:bg-white/20 disabled:text-white/40 rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 5: DELIVERY */}
          {step === "delivery" && (
            <motion.div
              key="delivery"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div className="flex flex-col gap-2">
                 <button onClick={() => setStep("pricing")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                    <ChevronLeft size={14} /> Back
                 </button>
                 <h2 className="text-3xl font-display font-black tracking-tight mb-1">Delivery mode.</h2>
                 <p className="text-white/40 font-medium text-sm">How is this fulfilled?</p>
              </div>

              <div className="flex flex-col gap-3 mt-4">
                 {[
                   { id: "Remote", label: "Remote / Digital", desc: "Done online and delivered via chat/email." },
                   { id: "On-site", label: "On-site / Physical", desc: "Requires physical presence at a location." },
                   { id: "Instant", label: "Instant Download", desc: "For digital products, delivered immediately." },
                   { id: "Scheduled", label: "Scheduled Call/Meeting", desc: "Requires booking a specific time slot." }
                 ].map((d) => (
                    <button
                      key={d.id}
                      onClick={() => {
                        setDeliveryMethod(d.id as any);
                        setTimeout(() => setStep("media"), 200);
                      }}
                      className={`p-5 rounded-2xl border text-left flex flex-col gap-1 transition-all group active:scale-[0.98] ${deliveryMethod === d.id ? 'bg-blue-600/20 border-blue-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
                    >
                      <span className={`text-sm font-black tracking-wider uppercase ${deliveryMethod === d.id ? 'text-blue-400' : 'text-white'}`}>{d.label}</span>
                      <span className="text-xs text-white/50 font-medium leading-relaxed">{d.desc}</span>
                    </button>
                 ))}
              </div>
            </motion.div>
          )}

          {/* STEP 6: MEDIA */}
          {step === "media" && (
            <motion.div
              key="media"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div className="flex flex-col gap-2">
                 <button onClick={() => setStep("delivery")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                    <ChevronLeft size={14} /> Back
                 </button>
                 <h2 className="text-3xl font-display font-black tracking-tight mb-1">Add visuals.</h2>
                 <p className="text-white/40 font-medium text-sm">Listings with high quality media sell 3x more.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="aspect-square rounded-[2rem] bg-indigo-500/10 border-2 border-dashed border-indigo-500/30 flex flex-col items-center justify-center gap-3 hover:bg-indigo-500/20 transition-all cursor-pointer group">
                    <ImageIcon size={28} className="text-indigo-400 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Cover Image</span>
                 </div>
                 <div className="aspect-square rounded-[2rem] bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer text-white/30 group">
                    <Video size={28} className="opacity-50 group-hover:scale-110 transition-transform" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Video Demo</span>
                 </div>
                 <div className="col-span-2 h-20 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center gap-2 hover:bg-white/10 transition-all cursor-pointer text-white/30">
                    <UploadCloud size={20} className="opacity-50" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Add Portfolio Gallery Images</span>
                 </div>
              </div>

              <button 
                onClick={() => setStep("availability")}
                className="w-full h-16 mt-auto bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform"
              >
                Continue
              </button>
            </motion.div>
          )}

          {/* STEP 7: AVAILABILITY */}
          {step === "availability" && (
            <motion.div
              key="availability"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="flex flex-col gap-8 max-w-sm mx-auto h-full"
            >
              <div className="flex flex-col gap-2">
                 <button onClick={() => setStep("media")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                    <ChevronLeft size={14} /> Back
                 </button>
                 <h2 className="text-3xl font-display font-black tracking-tight mb-1">Availability.</h2>
                 <p className="text-white/40 font-medium text-sm">When can you work on this?</p>
              </div>

              <div className="flex flex-col gap-6">
                 <div>
                    <label className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-3 block pl-2">Expected Delivery Time</label>
                    <div className="grid grid-cols-2 gap-2">
                      {["1 Day", "3 Days", "1 Week", "2+ Weeks"].map(t => (
                         <button key={t} className="h-12 rounded-xl text-xs font-black tracking-widest uppercase transition-all bg-white/5 text-white/60 hover:bg-white/10 border border-white/5 hover:border-white/20 focus:bg-blue-500 focus:text-white focus:border-blue-400">
                           {t}
                         </button>
                      ))}
                    </div>
                 </div>

                 <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white tracking-tight">Active Capacity</h4>
                      <p className="text-[10px] font-medium text-white/40 mt-1 uppercase tracking-widest">Auto-pause when full</p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold hover:bg-white/20">-</button>
                       <span className="font-black text-lg">3</span>
                       <button className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-bold hover:bg-white/20">+</button>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => setStep("preview")}
                className="w-full h-16 mt-auto bg-blue-600 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] shadow-[0_0_40px_rgba(59,130,246,0.3)] transition-transform hover:bg-blue-500"
              >
                Review & Publish
              </button>
            </motion.div>
          )}

          {/* STEP 8: PREVIEW */}
          {step === "preview" && (
            <motion.div
              key="preview"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col gap-6 max-w-sm mx-auto h-full"
            >
              <div className="flex items-center justify-between">
                 <button onClick={() => setStep("availability")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white">
                    <ChevronLeft size={14} /> Edit
                 </button>
                 <span className="px-3 py-1 bg-white/10 text-white text-[9px] font-black uppercase tracking-widest rounded-md">Draft Preview</span>
              </div>

              <div className="w-full rounded-[2.5rem] bg-[#0c0c0c] border border-white/10 p-1 relative overflow-hidden shadow-2xl">
                 <div className="aspect-[4/3] w-full rounded-[2.2rem] bg-white/5 mb-4 relative overflow-hidden flex items-center justify-center">
                    <ImageIcon size={40} className="text-white/20" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
                       <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest">{category}</span>
                    </div>
                 </div>
                 
                 <div className="px-5 pb-6">
                    <h3 className="font-display font-black text-2xl tracking-tighter mb-2 leading-tight">{title || "Untitled Offering"}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
                       <span className="flex items-center gap-1"><Clock size={12}/> 3 Days</span>
                       <span>•</span>
                       <span className="flex items-center gap-1"><Zap size={12}/> {deliveryMethod}</span>
                    </div>
                    
                    <div className="w-full h-px bg-white/10 mb-4" />
                    
                    <div className="flex justify-between items-center">
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Starting at</p>
                          <p className="text-2xl font-black text-white">${price || '0'}</p>
                       </div>
                    </div>
                 </div>
              </div>

              <button 
                onClick={() => {
                  setTimeout(() => setStep("published"), 400);
                }}
                className="w-full h-16 mt-auto bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                <Rocket size={16} /> Publish Now
              </button>
            </motion.div>
          )}

          {/* STEP 9: PUBLISHED */}
          {step === "published" && (
            <motion.div
              key="published"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center text-center h-full max-w-sm mx-auto"
            >
              <div className="w-24 h-24 bg-green-500 rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(34,197,94,0.3)] relative">
                 <CheckCircle2 size={48} className="text-white z-10" />
                 <div className="absolute inset-0 bg-green-500/20 blur-xl rounded-full" />
              </div>
              
              <h2 className="text-4xl font-display font-black tracking-tighter mb-4 uppercase">It's Live.</h2>
              <p className="text-white/60 font-medium text-sm leading-relaxed mb-10 max-w-[280px]">
                 Your {offeringType.toLowerCase()} is now visible in the marketplace and on your profile.
              </p>

              <div className="w-full flex flex-col gap-3">
                 <button 
                   onClick={() => onSuccess({ title, price, desc: description, type: offeringType, status: "Active" })}
                   className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform shadow-xl"
                 >
                   View My Offerings
                 </button>
                 <button className="w-full h-16 bg-[#0c0c0c] border border-white/10 text-white rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-2 hover:bg-white/5">
                   <Zap size={14} className="text-yellow-500 fill-yellow-500" /> Boost Visibility
                 </button>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>
    </motion.div>
  );
}
