import { motion, AnimatePresence } from "motion/react";
import { X, ChevronRight, ChevronLeft, Sparkles, Plus, Image as ImageIcon, Video, AlignLeft, Tag, Clock, Calendar, CheckCircle2, Zap, ArrowRight, DollarSign, UploadCloud, Rocket, BarChart2 } from "lucide-react";
import { useState } from "react";
import { useMarketplaceStore } from "../features/marketplace/stores/useMarketplaceStore";
import { supabase } from "../lib/supabase";

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
  const [capacity, setCapacity] = useState(3);
  
  const [coverImageUrl, setCoverImageUrl] = useState("https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop");
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null);
  const [videoDemoUrl, setVideoDemoUrl] = useState("");
  const [videoDemoFile, setVideoDemoFile] = useState<File | null>(null);
  const [deliveryTime, setDeliveryTime] = useState("3 Days");
  const [publishedListing, setPublishedListing] = useState<any>(null);

  const [showCoverInput, setShowCoverInput] = useState(false);
  const [showVideoInput, setShowVideoInput] = useState(false);

  const progressSteps = ["type", "title", "description", "pricing", "delivery", "media", "availability"];
  const currentStepIndex = progressSteps.indexOf(step as any);

  const { createService, createProduct, createTraining } = useMarketplaceStore();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handlePublish = async () => {
    setErrorMessage(null);
    setIsSubmitting(true);
    let result = null;
    const priceNum = parseFloat(price) || 0;

    if (title.length < 3) {
      setErrorMessage("Title must be at least 3 characters.");
      setIsSubmitting(false);
      return;
    }
    if (priceType !== "Custom" && priceNum < 0) {
      setErrorMessage("Price cannot be negative.");
      setIsSubmitting(false);
      return;
    }

    let finalCoverUrl = coverImageUrl;
    let finalVideoUrl = videoDemoUrl;

    try {
      if (coverImageFile) {
        const fileExt = coverImageFile.name.split('.').pop();
        const rand = Math.random().toString(36).substring(2);
        const fileName = `${Date.now()}-${rand}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, coverImageFile, {
            cacheControl: '3600',
            upsert: true
          });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);
        
        finalCoverUrl = publicUrl;
      }

      if (videoDemoFile) {
        const fileExt = videoDemoFile.name.split('.').pop();
        const rand = Math.random().toString(36).substring(2);
        const fileName = `${Date.now()}-${rand}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from('posts')
          .upload(fileName, videoDemoFile, {
            cacheControl: '3600',
            upsert: true
          });
        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('posts')
          .getPublicUrl(fileName);
        
        finalVideoUrl = publicUrl;
      }
    } catch (uploadErr: any) {
      setErrorMessage("Error uploading file: " + (uploadErr.message || uploadErr));
      setIsSubmitting(false);
      return;
    }

    const finalMedia = [
      { url: finalCoverUrl, type: "image" as const },
      ...(finalVideoUrl ? [{ url: finalVideoUrl, type: "video" as const }] : [])
    ];

    try {
      if (offeringType === "Service") {
        result = await createService({
          title,
          description,
          category: category || "Tech",
          pricing_type: (priceType === "Starting" || priceType === "Custom" ? "negotiable" : priceType.toLowerCase()) as any,
          base_price: priceNum,
          delivery_time: deliveryTime,
          media: finalMedia
        });
      } else if (offeringType === "Product") {
        result = await createProduct({
          title,
          description,
          category: category || "Tech",
          product_type: deliveryMethod === "Instant" ? "digital" : "physical",
          price: priceNum,
          inventory_count: capacity,
          media: finalMedia
        });
      } else if (offeringType === "Training") {
        result = await createTraining({
          title,
          description,
          category: category || "Tech",
          training_type: deliveryMethod === "Scheduled" ? "live" : "recorded",
          price: priceNum,
          media: finalMedia
        });
      }

      if (result) {
        const listingPayload = {
          ...result,
          type: offeringType,
          title: result.title || title,
          name: result.title || title,
          price: priceNum,
          desc: result.description || description,
          description: result.description || description,
          media: finalMedia,
          image: finalCoverUrl, // direct field mapping for backwards compatibility
          video: finalVideoUrl || null,
          capacity
        };
        setPublishedListing(listingPayload);
        setStep("published");
      } else {
        const currentError = useMarketplaceStore.getState().error;
        setErrorMessage(currentError || "Failed to publish your offering. Please verify your info and try again.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "An unexpected error occurred.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
                   {title.length > 0 && title.length < 3 && (
                     <p className="text-red-500 text-[10px] font-black uppercase tracking-widest mt-2 pl-2">Title must be at least 3 characters</p>
                   )}
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

              {errorMessage && (
                <p className="text-red-500 text-xs font-black text-center mb-4 uppercase tracking-wider">{errorMessage}</p>
              )}

              <button 
                type="button"
                onClick={() => {
                  if (title.trim().length === 0) {
                    setErrorMessage("Please enter a title.");
                    return;
                  }
                  if (title.trim().length < 3) {
                    setErrorMessage("Title must be at least 3 characters long.");
                    return;
                  }
                  if (!category) {
                    setErrorMessage("Please select a category.");
                    return;
                  }
                  setErrorMessage(null);
                  setStep("description");
                }}
                className="w-full h-16 mt-auto bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform hover:bg-white/90 focus:outline-none"
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

              {errorMessage && (
                <p className="text-red-500 text-xs font-black text-center mb-4 uppercase tracking-wider">{errorMessage}</p>
              )}

              <button 
                type="button"
                onClick={() => {
                  if (description.trim().length === 0) {
                    setErrorMessage("Please enter a description outlining your deliverables.");
                    return;
                  }
                  setErrorMessage(null);
                  setStep("pricing");
                }}
                className="w-full h-16 bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform hover:bg-white/90"
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
                     {price && parseFloat(price) < 0 && (
                        <p className="absolute -bottom-5 left-4 text-red-500 text-[10px] font-black uppercase tracking-widest">Price cannot be negative</p>
                     )}
                   </div>
                 )}
                 
                 {priceType === "Starting" && (
                   <p className="text-[10px] font-bold uppercase tracking-widest text-white/30 text-center">Price will show as "From ${price || '0'}"</p>
                 )}
              </div>

              {errorMessage && (
                <p className="text-red-500 text-xs font-black text-center mb-4 uppercase tracking-wider">{errorMessage}</p>
              )}

              <button 
                type="button"
                onClick={() => {
                  if (priceType !== "Custom") {
                    if (!price.trim()) {
                      setErrorMessage("Please set a price.");
                      return;
                    }
                    const num = parseFloat(price);
                    if (isNaN(num) || num < 0) {
                      setErrorMessage("Price cannot be negative.");
                      return;
                    }
                  }
                  setErrorMessage(null);
                  setStep("delivery");
                }}
                className="w-full h-16 mt-auto bg-white text-black rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform hover:bg-white/90"
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
              className="flex flex-col gap-6 max-w-sm mx-auto h-full"
            >
              <div className="flex flex-col gap-2">
                 <button onClick={() => setStep("delivery")} className="w-fit flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-white/40 mb-2 hover:text-white">
                    <ChevronLeft size={14} /> Back
                 </button>
                 <h2 className="text-3xl font-display font-black tracking-tight mb-1">Add visuals.</h2>
                 <p className="text-white/40 font-medium text-sm">Add custom cover image mockups & premium video demos.</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 {/* Cover Mockup Card */}
                 <button
                    onClick={() => {
                      setShowCoverInput(!showCoverInput);
                      setShowVideoInput(false);
                    }}
                    type="button"
                    className={`aspect-square rounded-[2rem] border-2 relative overflow-hidden flex flex-col items-center justify-center gap-2 group transition-all text-left ${showCoverInput ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                 >
                    {coverImageUrl ? (
                      <>
                        <img src={coverImageUrl} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform" alt="Cover Preview" referrerPolicy="no-referrer" />
                        <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] group-hover:backdrop-blur-none transition-all" />
                        <div className="relative z-10 flex flex-col items-center gap-1.5 p-3 text-center">
                          <ImageIcon size={22} className="text-indigo-400" />
                          <span className="text-[9px] font-black uppercase tracking-widest text-indigo-200">Cover Active</span>
                          <span className="text-[7px] text-white/50 lowercase truncate max-w-[120px]">{coverImageUrl}</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <ImageIcon size={28} className="text-white/40 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Add Cover Image</span>
                      </div>
                    )}
                 </button>

                 {/* Video Demo Card */}
                 <button
                    onClick={() => {
                      setShowVideoInput(!showVideoInput);
                      setShowCoverInput(false);
                    }}
                    type="button"
                    className={`aspect-square rounded-[2rem] border-2 relative overflow-hidden flex flex-col items-center justify-center gap-2 group transition-all text-left ${showVideoInput ? 'border-emerald-500 bg-emerald-500/10' : 'border-white/10 hover:border-white/20 bg-white/5'}`}
                 >
                    {videoDemoUrl ? (
                      <div className="flex flex-col items-center gap-1.5 p-3 text-center relative z-10">
                        <Video size={24} className="text-emerald-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-emerald-300">Video Demo Loaded</span>
                        <span className="text-[7px] text-white/50 lowercase truncate max-w-[120px]">{videoDemoUrl}</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center gap-2">
                        <Video size={28} className="text-white/40 group-hover:text-white transition-colors" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-white/50">Video Demo URL</span>
                      </div>
                    )}
                 </button>
              </div>

              {/* Cover Image Input Panel */}
              {showCoverInput && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest text-indigo-400">Cover Image Web Link OR UPLOAD FILE</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={coverImageUrl}
                         onChange={(e) => { setCoverImageUrl(e.target.value); setCoverImageFile(null); }}
                         placeholder="Paste cover URL..."
                         className="flex-1 h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-mono text-white/80 focus:border-indigo-500 outline-none"
                       />
                       <label className="h-11 px-4 cursor-pointer bg-white/5 border border-white/10 hover:border-indigo-500 hover:bg-white/10 rounded-xl flex items-center justify-center text-indigo-300 text-[10px] font-black uppercase tracking-widest transition-all">
                          Upload
                           <input 
                             type="file" 
                             accept="image/*" 
                             className="hidden" 
                             onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const url = URL.createObjectURL(file);
                                 setCoverImageUrl(url);
                                 setCoverImageFile(file);
                               }
                             }} 
                           />
                       </label>
                    </div>
                  </div>

                  {/* Hot Presets */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Select Premium Preset Style</span>
                    <div className="grid grid-cols-4 gap-2">
                      {[
                        { name: "Tech", url: "https://images.unsplash.com/photo-1555066931-4365d14bab8c?q=80&w=600&auto=format&fit=crop" },
                        { name: "Code", url: "https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?q=80&w=600&auto=format&fit=crop" },
                        { name: "SaaS", url: "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=600&auto=format&fit=crop" },
                        { name: "Brand", url: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=600&auto=format&fit=crop" }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => { setCoverImageUrl(preset.url); setCoverImageFile(null); }}
                          className={`h-12 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all relative overflow-hidden flex items-center justify-center border ${coverImageUrl === preset.url ? 'border-indigo-400 text-white font-bold bg-indigo-500/10' : 'border-white/5 text-white/50 bg-white/5 hover:bg-white/10'}`}
                        >
                          <img src={preset.url} className="absolute inset-0 w-full h-full object-cover opacity-20" alt={preset.name} referrerPolicy="no-referrer" />
                          <span className="relative z-10">{preset.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Video Demo Input Panel */}
              {showVideoInput && (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} 
                  animate={{ opacity: 1, y: 0 }} 
                  className="p-5 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col gap-4"
                >
                  <div className="flex flex-col gap-2">
                    <label className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Interactive Video demo URL OR UPLOAD FILE</label>
                    <div className="flex gap-2">
                       <input 
                         type="text" 
                         value={videoDemoUrl}
                         onChange={(e) => { setVideoDemoUrl(e.target.value); setVideoDemoFile(null); }}
                         placeholder="URL link..."
                         className="flex-1 h-11 bg-black/40 border border-white/10 rounded-xl px-4 text-xs font-mono text-white/80 focus:border-emerald-500 outline-none"
                       />
                       <label className="h-11 px-4 cursor-pointer bg-white/5 border border-white/10 hover:border-emerald-500 hover:bg-white/10 rounded-xl flex items-center justify-center text-emerald-300 text-[10px] font-black uppercase tracking-widest transition-all">
                          Upload
                           <input 
                             type="file" 
                             accept="video/*" 
                             className="hidden" 
                             onChange={(e) => {
                               const file = e.target.files?.[0];
                               if (file) {
                                 const url = URL.createObjectURL(file);
                                 setVideoDemoUrl(url);
                                 setVideoDemoFile(file);
                               }
                             }} 
                           />
                       </label>
                    </div>
                    <p className="text-[8px] text-white/30 uppercase tracking-widest font-black leading-normal pl-1">
                      Provide a URL to display a rich video preview badge on your listing.
                    </p>
                  </div>
                </motion.div>
              )}

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
                         <button key={t} type="button" onClick={() => setDeliveryTime(t)} className={`h-12 rounded-xl text-xs font-black tracking-widest uppercase transition-all border ${deliveryTime === t ? 'bg-blue-600 border-blue-500 text-white' : 'bg-white/5 text-white/60 hover:bg-white/10 border-white/5 hover:border-white/20'}`}>
                           {t}
                         </button>
                      ))}
                    </div>
                 </div>

                 <div className="p-5 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                    <div>
                      <h4 className="text-sm font-black text-white tracking-tight">
                        {offeringType === "Product" ? "Stock Inventory" : "Active Capacity"}
                      </h4>
                      <p className="text-[10px] font-medium text-white/40 mt-1 uppercase tracking-widest">
                        {offeringType === "Product" ? "Total items available" : "Auto-pause when full"}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                       <button type="button" onClick={() => setCapacity(Math.max(1, capacity - 1))} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold hover:bg-white/20">-</button>
                       <span className="font-black text-lg">{capacity}</span>
                       <button type="button" onClick={() => setCapacity(capacity + 1)} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white font-semibold hover:bg-white/20">+</button>
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
                    {coverImageUrl ? (
                       <img src={coverImageUrl} className="w-full h-full object-cover" alt="Preview" referrerPolicy="no-referrer" />
                    ) : (
                       <ImageIcon size={40} className="text-white/20" />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                    <div className="absolute bottom-4 left-4 right-4 z-20 flex justify-between items-end">
                       <span className="px-2.5 py-1 bg-black/50 backdrop-blur-md rounded-lg text-[9px] font-black text-white uppercase tracking-widest">{category || "Uncategorized"}</span>
                    </div>
                 </div>
                 
                 <div className="px-5 pb-6">
                    <h3 className="font-display font-black text-2xl tracking-tighter mb-2 leading-tight">{title || "Untitled Offering"}</h3>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">
                       <span className="flex items-center gap-1"><Clock size={12}/> {deliveryTime}</span>
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

              {errorMessage && (
                 <p className="text-red-500 text-xs font-black text-center mt-2 px-4 uppercase tracking-wider">{errorMessage}</p>
              )}

              <button 
                onClick={handlePublish}
                disabled={isSubmitting}
                className="w-full h-16 mt-auto bg-white text-black disabled:bg-white/20 disabled:text-white/40 rounded-2xl font-black uppercase tracking-[0.2em] text-xs active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                   <span className="animate-spin h-5 w-5 border-2 border-black border-t-transparent rounded-full" />
                ) : (
                   <>
                     <Rocket size={16} /> Publish Now
                   </>
                )}
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
                   onClick={() => onSuccess({ title, price, desc: description, type: offeringType, status: "Active", image: coverImageUrl, video: videoDemoUrl })}
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
