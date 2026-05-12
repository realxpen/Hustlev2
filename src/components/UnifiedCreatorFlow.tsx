import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  X, ChevronLeft, ChevronRight, Video, Camera, Briefcase, 
  ShoppingBag, Radio, Play, Sparkles, Image as ImageIcon,
  Music, Volume2, Type, Sliders, Scissors, Plus,
  Bookmark, CheckCircle2, DollarSign, Calendar, Clock,
  ArrowRight, Globe, Lock, Users, Zap, Eye, Save
} from "lucide-react";

interface UnifiedCreatorFlowProps {
  initialType?: string;
  onClose: () => void;
  onPublish: (data: any) => void;
}

type Step = 'type' | 'media' | 'details' | 'monetize' | 'publish';

export default function UnifiedCreatorFlow({ initialType, onClose, onPublish }: UnifiedCreatorFlowProps) {
  const [step, setStep] = useState<Step>(initialType ? 'media' : 'type');
  const [selectedType, setSelectedType] = useState<string>(initialType || 'post');
  const [media, setMedia] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [selectedAudio, setSelectedAudio] = useState<string | null>(null);
  const [monetizationTag, setMonetizationTag] = useState<string | null>(null);
  const [isLivePremise, setIsLivePremise] = useState(false);
  const [scheduleDate, setScheduleDate] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const TYPES = [
    { id: 'post', label: 'Feed Post', icon: <Video />, desc: 'Share a story or video', color: 'bg-blue-500' },
    { id: 'service', label: 'Service', icon: <Briefcase />, desc: 'List your professional help', color: 'bg-purple-500' },
    { id: 'product', label: 'Product', icon: <ShoppingBag />, desc: 'Set up a physical item', color: 'bg-emerald-500' },
    { id: 'training', label: 'Training', icon: <Play />, desc: 'Teach a new skill', color: 'bg-yellow-500' },
    { id: 'live', label: 'Livestream', icon: <Radio />, desc: 'Go live and interact', color: 'bg-red-500' },
  ];

  const handleMediaUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setMedia(URL.createObjectURL(file));
      setStep('details');
    }
  };

  const handlePublish = () => {
    onPublish({
      type: selectedType,
      media,
      title,
      description,
      price,
      audio: selectedAudio,
      tag: monetizationTag,
      scheduleDate
    });
  };

  const nextStep = () => {
    if (step === 'type') setStep('media');
    else if (step === 'media') setStep('details');
    else if (step === 'details') setStep('monetize');
    else if (step === 'monetize') setStep('publish');
  };

  const prevStep = () => {
    if (step === 'media') setStep('type');
    else if (step === 'details') setStep('media');
    else if (step === 'monetize') setStep('details');
    else if (step === 'publish') setStep('monetize');
  };

  // Smart Template Logic
  useEffect(() => {
    if (step === 'details' && !title) {
      // Simulation of AI Loading Template
      if (selectedType === 'service') {
        setTitle("Professional Strategy Session");
        setDescription("A focused 60-minute session to unlock your growth potential.");
        setPrice("$150");
      } else if (selectedType === 'product') {
        setTitle("Digital Asset Bundle");
        setDescription("High-quality resources for your creative workflow.");
        setPrice("$49");
      }
    }
  }, [step, selectedType, title]);

  return (
    <div className="fixed inset-0 z-[110] bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Dynamic Background Noise/Glow */}
      <div className="absolute inset-0 bg-[#050505] overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-brand-primary/5 via-transparent to-black" />
        <div className="noise-overlay opacity-[0.03]" />
      </div>

      {/* Progress Header */}
      <header className="relative z-10 px-6 pt-12 pb-6 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl">
        <div className="flex items-center gap-4">
          <button 
            onClick={step === 'type' ? onClose : prevStep}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/60 hover:text-white"
          >
            {step === 'type' ? <X size={20} /> : <ChevronLeft size={24} />}
          </button>
          <div>
            <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/30 italic">Step {step === 'type' ? 1 : step === 'media' ? 2 : step === 'details' ? 3 : step === 'monetize' ? 4 : 5} of 5</h2>
            <h1 className="text-sm font-black uppercase tracking-tight italic">
              {step === 'type' ? 'Define Intent' : step === 'media' ? 'Capture Media' : step === 'details' ? 'Refine Story' : step === 'monetize' ? 'Link Income' : 'Finalize Flow'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {step !== 'type' && step !== 'publish' && (
            <button 
              onClick={nextStep}
              className="px-6 py-2 rounded-full bg-brand-primary text-white text-[10px] font-black uppercase tracking-widest shadow-glow-red"
            >
              Next
            </button>
          )}
          {step === 'publish' && (
            <button 
              onClick={handlePublish}
              className="px-8 py-3 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-premium"
            >
              Publish
            </button>
          )}
        </div>
      </header>

      {/* Content Engine */}
      <main className="relative z-10 flex-1 overflow-y-auto p-6 no-scrollbar">
        <AnimatePresence mode="wait">
          {step === 'type' && (
            <motion.div 
              key="step-type"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="grid grid-cols-1 gap-4"
            >
              <div className="mb-4">
                <h3 className="text-2xl font-black italic tracking-tighter mb-1">What are you building?</h3>
                <p className="text-xs text-white/40 italic">Select an asset type to generate a smart template.</p>
              </div>
              {TYPES.map((t) => (
                <button
                  key={t.id}
                  onClick={() => { setSelectedType(t.id); nextStep(); }}
                  className={`relative p-6 rounded-[2.5rem] border transition-all flex items-center justify-between group overflow-hidden ${selectedType === t.id ? 'border-brand-primary bg-brand-primary/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                >
                  <div className="flex items-center gap-5 relative z-10">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg ${t.color}`}>
                      {t.icon}
                    </div>
                    <div className="text-left">
                      <h4 className="text-xs font-black uppercase tracking-widest mb-1">{t.label}</h4>
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-tight italic">{t.desc}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-white/20 group-hover:text-white group-hover:translate-x-1 transition-all" />
                  {selectedType === t.id && (
                    <div className="absolute inset-0 bg-brand-primary/5 pointer-events-none" />
                  )}
                </button>
              ))}
            </motion.div>
          )}

          {step === 'media' && (
            <motion.div 
              key="step-media"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="h-full flex flex-col gap-6"
            >
              <div className="aspect-[3/4] rounded-[2.5rem] bg-white/5 border border-white/10 relative overflow-hidden flex flex-col items-center justify-center group">
                {media ? (
                  <>
                    <img src={media} alt="Preview" className="w-full h-full object-cover" />
                    <div className="absolute inset-x-4 bottom-4 flex gap-2">
                       <button onClick={() => setMedia(null)} className="flex-1 bg-black/60 backdrop-blur-xl py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10">Replace</button>
                       <button className="flex-1 bg-white text-black py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10 flex items-center justify-center gap-2">
                         <Scissors size={14} /> Trim
                       </button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary/10 to-blue-500/10 opacity-40" />
                    <div className="relative flex flex-col items-center gap-6">
                      <div className="w-20 h-20 rounded-full bg-white/5 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Camera size={32} className="text-white/40" />
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-black italic tracking-tighter mb-2">Import from Library</p>
                        <p className="text-xs text-white/30 font-bold italic">Max 4K resolution supported</p>
                      </div>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleMediaUpload} 
                        className="hidden" 
                        accept="image/*,video/*"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="px-10 py-4 rounded-full bg-white text-black text-[10px] font-black uppercase tracking-widest shadow-premium"
                      >
                        Choose File
                      </button>
                    </div>
                  </>
                )}
              </div>

              {selectedType === 'post' && (
                <div className="flex gap-4">
                  <button className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group">
                    <Music size={20} className="text-brand-primary" />
                    <span className="text-[8px] font-black uppercase text-white/40">Add Audio</span>
                  </button>
                  <button className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group">
                    <Type size={20} className="text-blue-400" />
                    <span className="text-[8px] font-black uppercase text-white/40">Add Text</span>
                  </button>
                  <button className="flex-1 bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col items-center gap-2 group">
                    <Sliders size={20} className="text-purple-400" />
                    <span className="text-[8px] font-black uppercase text-white/40">Filters</span>
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === 'details' && (
            <motion.div 
              key="step-details"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-col gap-8"
            >
              <div className="bg-brand-primary/10 border border-brand-primary/20 p-5 rounded-[1.5rem] flex items-center gap-4">
                <Sparkles size={18} className="text-brand-primary animate-pulse" />
                <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Smart Template Loaded</p>
              </div>

              <div className="space-y-6">
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2 italic">Creator Captions</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter a compelling title..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-6 py-4 text-sm font-bold text-white focus:outline-none focus:border-brand-primary transition-colors"
                  />
                  <textarea 
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe your hustle..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl px-6 py-6 text-sm font-medium text-white/60 h-32 resize-none focus:outline-none focus:border-brand-primary transition-colors"
                  />
                </div>

                {(selectedType === 'service' || selectedType === 'product') && (
                  <div className="space-y-4">
                     <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-2 italic">Pricing Strategy</label>
                     <div className="relative">
                        <div className="absolute left-6 top-1/2 -translate-y-1/2 text-white/40 text-sm font-black">$</div>
                        <input 
                          value={price}
                          onChange={(e) => setPrice(e.target.value.replace('$', ''))}
                          placeholder="0.00"
                          className="w-full bg-white/5 border border-white/10 rounded-2xl pl-12 pr-6 py-4 text-sm font-black text-white focus:outline-none focus:border-brand-primary transition-colors"
                        />
                     </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {step === 'monetize' && (
            <motion.div 
               key="step-monetize"
               initial={{ opacity: 0, scale: 0.95 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex flex-col gap-6"
            >
               <div className="mb-4">
                  <h3 className="text-2xl font-black italic tracking-tighter mb-1">Impact & Income</h3>
                  <p className="text-xs text-white/40 italic">Attach a marketplace action chip to this content.</p>
               </div>

               <div className="grid grid-cols-1 gap-3">
                  {[
                    { id: 'service-chip', label: 'Book Service', type: 'service', desc: 'Link to your active offerings', icon: <Briefcase size={16} /> },
                    { id: 'product-chip', label: 'Buy Product', type: 'product', desc: 'Direct sales from this post', icon: <ShoppingBag size={16} /> },
                    { id: 'training-chip', label: 'Apply Now', type: 'training', desc: 'Application-based access', icon: <Zap size={16} /> },
                    { id: 'none', label: 'None', type: 'none', desc: 'Purely engagement focused', icon: <Eye size={16} /> },
                  ].map((chip) => (
                    <button
                      key={chip.id}
                      onClick={() => setMonetizationTag(chip.id)}
                      className={`p-5 rounded-3xl border flex items-center justify-between transition-all group ${monetizationTag === chip.id ? 'border-brand-primary bg-brand-primary/10' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${monetizationTag === chip.id ? 'bg-brand-primary text-white' : 'bg-white/5 text-white/40 group-hover:text-white'}`}>
                          {chip.icon}
                        </div>
                        <div className="text-left">
                          <h4 className="text-[11px] font-black uppercase tracking-widest">{chip.label}</h4>
                          <p className="text-[9px] text-white/30 font-bold uppercase italic">{chip.desc}</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${monetizationTag === chip.id ? 'border-brand-primary bg-brand-primary' : 'border-white/10'}`}>
                        {monetizationTag === chip.id && <div className="w-1.5 h-1.5 bg-white rounded-full shadow-glow-white" />}
                      </div>
                    </button>
                  ))}
               </div>

               <div className="mt-8 bg-blue-500/10 border border-blue-500/20 p-6 rounded-[2rem] flex items-center gap-5">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-blue-500/20">
                    <DollarSign size={24} />
                  </div>
                  <div>
                    <h5 className="text-[10px] font-black uppercase text-blue-400 tracking-widest mb-1">Yield Optimization</h5>
                    <p className="text-xs text-white/60 leading-relaxed font-medium">Hustle dynamically adjusts visibility based on real-time niche demand.</p>
                  </div>
               </div>
            </motion.div>
          )}

          {step === 'publish' && (
            <motion.div 
               key="step-publish"
               initial={{ opacity: 0, y: 20 }}
               animate={{ opacity: 1, y: 0 }}
               className="flex flex-col gap-8 pb-20"
            >
               {/* Final Content Preview Card */}
               <section>
                  <div className="flex items-center justify-between mb-4 px-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 italic">Final Preview</h3>
                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Ready to Launch</span>
                  </div>
                  <div className="relative aspect-[3/4] rounded-[2.5rem] bg-white/5 border border-white/10 overflow-hidden shadow-2xl">
                     <img src={media || 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?auto=format&fit=crop&q=80&w=600'} alt="Preview" className="w-full h-full object-cover opacity-80" />
                     <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
                     
                     <div className="absolute bottom-10 left-8 right-8">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-10 h-10 rounded-full border-2 border-brand-primary p-0.5 shadow-glow-red">
                              <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Felix" alt="Me" className="w-full h-full rounded-full" />
                           </div>
                           <div className="flex flex-col">
                              <span className="text-xs font-black uppercase tracking-tight italic">@FelixTheHustler</span>
                              <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest italic">Global Identity</span>
                           </div>
                        </div>
                        <h4 className="text-lg font-black italic tracking-tighter mb-2">{title}</h4>
                        <div className="flex flex-wrap gap-2">
                           {monetizationTag && (
                             <div className="px-4 py-2 bg-brand-primary text-white rounded-full flex items-center gap-2 shadow-glow-red">
                               <Sparkles size={12} />
                               <span className="text-[9px] font-black uppercase tracking-widest italic">Link Active</span>
                             </div>
                           )}
                           <div className="px-4 py-2 bg-white/10 backdrop-blur-md rounded-full flex items-center gap-2 border border-white/5">
                             <CheckCircle2 size={12} className="text-blue-400" />
                             <span className="text-[9px] font-black uppercase tracking-widest italic">Verified Flow</span>
                           </div>
                        </div>
                     </div>
                  </div>
               </section>

               {/* Scheduling Options */}
               <section className="space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40 px-2 italic">Release Strategy</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                     <button 
                        onClick={() => setScheduleDate(null)}
                        className={`p-5 rounded-3xl border flex flex-col items-center gap-3 transition-colors ${!scheduleDate ? 'border-brand-primary bg-brand-primary/10' : 'bg-white/5 border-white/5'}`}
                     >
                        <Zap size={20} className={!scheduleDate ? 'text-brand-primary animate-pulse' : 'text-white/20'} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Post Now</span>
                     </button>
                     <button 
                        onClick={() => setScheduleDate('tomorrow')}
                        className={`p-5 rounded-3xl border flex flex-col items-center gap-3 transition-colors ${scheduleDate ? 'border-brand-primary bg-brand-primary/10' : 'bg-white/5 border-white/5'}`}
                     >
                        <Calendar size={20} className={scheduleDate ? 'text-brand-primary' : 'text-white/20'} />
                        <span className="text-[9px] font-black uppercase tracking-widest">Schedule</span>
                     </button>
                  </div>
               </section>

               {/* Save as Draft */}
               <button className="w-full py-5 rounded-3xl border border-white/10 flex items-center justify-center gap-3 group hover:bg-white/5 transition-all">
                  <Save size={18} className="text-white/30 group-hover:text-white" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-white/40 group-hover:text-white">Save as Working Draft</span>
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Success Animation Layer (Triggered on Publish) */}
      <AnimatePresence>
        {/* We would handle success state here with a big celebration animation */}
      </AnimatePresence>
    </div>
  );
}
