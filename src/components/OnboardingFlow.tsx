import React, { useState } from 'react';
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronRight, Sparkles, User, Briefcase, 
  Target, Zap, Rocket, Shield, Star, Globe,
  CheckCircle2, ArrowRight, ChevronLeft
} from "lucide-react";

interface OnboardingFlowProps {
  onComplete: (data: any) => void;
}

export default function OnboardingFlow({ onComplete }: OnboardingFlowProps) {
  const [step, setStep] = useState(1);
  const [role, setRole] = useState<'client' | 'hustler' | 'both' | null>(null);
  const [interests, setInterests] = useState<string[]>([]);

  const toggleInterest = (id: string) => {
    setInterests(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleNext = () => {
    if (step < 3) setStep(step + 1);
    else onComplete({ role, interests });
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  return (
    <div className="fixed inset-0 z-[300] bg-black text-white flex flex-col font-sans overflow-hidden">
      {/* Dynamic Backgrounds */}
      <AnimatePresence mode="wait">
        {step === 1 && (
          <motion.div 
            key="bg1"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-gradient-to-tr from-brand-primary/20 via-black to-blue-500/10"
          />
        )}
      </AnimatePresence>
      <div className="noise-overlay opacity-[0.05]" />

      {/* Progress Line */}
      <div className="absolute top-0 left-0 w-full h-1 bg-white/5 z-20">
         <motion.div 
           className="h-full bg-brand-primary shadow-[0_0_15px_rgba(255,51,102,0.5)]"
           animate={{ width: `${(step / 3) * 100}%` }}
         />
      </div>

      {/* Navigation Header */}
      <header className="relative z-20 px-8 py-8 flex justify-between items-center">
         {step > 1 ? (
           <button 
             onClick={handleBack}
             className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors"
           >
              <ChevronLeft size={16} /> Back
           </button>
         ) : <div />}
         <div className="text-[10px] font-black uppercase tracking-widest text-white/20">Step {step} of 3</div>
      </header>

      <main className="relative z-10 flex-1 flex flex-col px-8 justify-center max-w-lg mx-auto w-full -mt-20">
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
               <div className="w-20 h-20 rounded-[2rem] bg-brand-primary flex items-center justify-center shadow-2xl shadow-brand-primary/40 relative overflow-hidden group">
                  <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                  <Rocket size={40} className="text-white" />
               </div>
               <div className="space-y-4">
                  <h1 className="text-5xl font-black italic tracking-tighter leading-none uppercase">
                     The Future <br />
                     <span className="text-brand-primary">Of Work</span> <br />
                     Is Live.
                  </h1>
                  <p className="text-sm font-medium text-white/40 leading-relaxed max-w-[280px]">
                     Connect with thousands of specialized creators, freelancers, and businesses in real-time.
                  </p>
               </div>
               <div className="flex flex-col gap-4 pt-4">
                  <button 
                    onClick={handleNext}
                    className="h-16 bg-white text-black rounded-2xl flex items-center justify-center gap-3 active-scale group overflow-hidden relative"
                  >
                     <span className="text-[11px] font-black uppercase tracking-[0.2em] relative z-10">Start Your Hustle</span>
                     <ArrowRight size={18} className="relative z-10 group-hover:translate-x-2 transition-transform" />
                  </button>
               </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
               <div className="space-y-2">
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Who Are You?</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Define your role in the ecosystem</p>
               </div>

               <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'client', label: 'I want to Book', sub: 'Hire top talent instantly', icon: <Target className="text-blue-400" /> },
                    { id: 'hustler', label: 'I want to Lead', sub: 'Start your live business', icon: <Zap className="text-brand-primary" /> },
                    { id: 'both', label: 'I want it All', sub: 'The complete marketplace experience', icon: <Sparkles className="text-emerald-400" /> }
                  ].map(option => (
                    <button 
                      key={option.id}
                      onClick={() => setRole(option.id as any)}
                      className={`p-6 rounded-[2rem] border transition-all text-left flex items-center gap-6 group relative overflow-hidden active-scale ${role === option.id ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
                    >
                       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${role === option.id ? 'bg-black/5' : 'bg-white/5 border border-white/10'}`}>
                          {option.icon}
                       </div>
                       <div>
                          <h4 className="text-[11px] font-black uppercase tracking-[0.2em]">{option.label}</h4>
                          <p className={`text-[10px] font-bold ${role === option.id ? 'text-black/40' : 'text-white/40'}`}>{option.sub}</p>
                       </div>
                       <div className={`absolute right-6 transition-all ${role === option.id ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-4'}`}>
                          <CheckCircle2 size={24} className="text-brand-primary" />
                       </div>
                    </button>
                  ))}
               </div>

               <button 
                 disabled={!role}
                 onClick={handleNext}
                 className="h-16 w-full bg-brand-primary text-white rounded-2xl flex items-center justify-center gap-3 active-scale disabled:opacity-20 transition-all font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-brand-primary/40 mt-4"
               >
                  Choose Interests <ChevronRight size={18} />
               </button>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
               <div className="space-y-2">
                  <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none">Your Vibe</h2>
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/20">Select interests to tailor your feed</p>
               </div>

               <div className="grid grid-cols-2 gap-3">
                  {[
                    'UI DESIGN', 'MARKETING', 'BLOCKCHAIN', 'STREET FOOD', 
                    'FITNESS', 'REPAIR', 'LIVE SALES', 'COACHING',
                    'FASHION', 'REAL ESTATE', 'LOGISTICS', 'ENTERTAINMENT'
                  ].map(interest => (
                    <button 
                      key={interest}
                      onClick={() => toggleInterest(interest)}
                      className={`h-14 rounded-2xl border text-[9px] font-black uppercase tracking-widest transition-all active-scale ${interests.includes(interest) ? 'bg-brand-primary border-brand-primary text-white shadow-lg shadow-brand-primary/20' : 'bg-white/5 border-white/5 text-white/40 hover:bg-white/10'}`}
                    >
                       {interest}
                    </button>
                  ))}
               </div>

               <button 
                 disabled={interests.length < 3}
                 onClick={handleNext}
                 className="h-16 w-full bg-white text-black rounded-2xl flex items-center justify-center gap-3 active-scale disabled:opacity-20 transition-all font-black uppercase text-[11px] tracking-widest shadow-2xl shadow-white/10 mt-4"
               >
                  Complete Setup {interests.length < 3 && `(${3 - interests.length} more)`}
               </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Branding */}
      <footer className="relative z-10 py-12 flex flex-col items-center gap-4">
         <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 grayscale brightness-50">
               <Shield size={12} className="text-white" />
               <span className="text-[8px] font-black uppercase tracking-widest">Verified Nodes</span>
            </div>
            <div className="flex items-center gap-2 grayscale brightness-50">
               <Globe size={12} className="text-white" />
               <span className="text-[8px] font-black uppercase tracking-widest">Global Protocol</span>
            </div>
         </div>
         <p className="text-[8px] font-bold text-white/10 uppercase tracking-[0.3em]">Hustle Economy Layer v1.0</p>
      </footer>
    </div>
  );
}
