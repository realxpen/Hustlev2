import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Award, Target, Briefcase, Calendar } from 'lucide-react';
import { useApprenticeshipStore } from '../../stores/useApprenticeshipStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';

interface CreateApprenticeshipModalProps {
  onClose: () => void;
}

export function CreateApprenticeshipModal({ onClose }: CreateApprenticeshipModalProps) {
  const { createProgram, fetchMyApprenticeships } = useApprenticeshipStore();
  const { user } = useAuthStore();
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    skill_area: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.skill_area) return;
    
    setIsSubmitting(true);
    const success = await createProgram(formData);
    if (success && user) {
      await fetchMyApprenticeships(user.id);
      onClose();
    }
    setIsSubmitting(false);
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-end justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/95 backdrop-blur-xl"
      />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-xl bg-[#0c0c0c] rounded-[2.5rem] border border-white/10 overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-white/5 flex justify-between items-center bg-gradient-to-r from-brand-primary/5 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-primary/20 flex items-center justify-center border border-brand-primary/30">
              <Award size={20} className="text-brand-primary" />
            </div>
            <div>
              <h3 className="text-xl font-black text-white italic uppercase tracking-tighter">Deploy Fellowship</h3>
              <p className="text-[10px] text-white/40 font-black uppercase tracking-widest">Share your mastery with rising talent</p>
            </div>
          </div>
          <button onClick={onClose} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/60 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-4">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Fellowship Name</label>
                <div className="relative">
                  <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text" 
                    placeholder="e.g. UX Engineering Residency"
                    required
                    value={formData.title}
                    onChange={e => setFormData({...formData, title: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors font-medium placeholder:text-white/10"
                  />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Domain / Skill Area</label>
                <div className="relative">
                  <Target size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20" />
                  <input 
                    type="text" 
                    placeholder="e.g. Visual Design, Smart Contracts"
                    required
                    value={formData.skill_area}
                    onChange={e => setFormData({...formData, skill_area: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors font-medium placeholder:text-white/10"
                  />
                </div>
             </div>

             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30 px-1">Program Intent</label>
                <textarea 
                  placeholder="Describe what the learner will gain and what you expect from them..."
                  rows={4}
                  value={formData.description}
                  onChange={e => setFormData({...formData, description: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm text-white focus:outline-none focus:border-brand-primary transition-colors font-medium placeholder:text-white/10 resize-none italic"
                />
             </div>
          </div>

          <div className="pt-4 flex flex-col gap-3">
             <button 
               type="submit"
               disabled={isSubmitting}
               className="w-full h-16 bg-brand-primary text-black rounded-[2rem] font-black uppercase tracking-[0.2em] text-sm shadow-xl active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
             >
               {isSubmitting ? 'Initializing...' : 'Launch Fellowship'}
             </button>
             <p className="text-center text-[8px] font-medium text-white/20 uppercase tracking-[0.2em]">Fellowships are publicly discoverable for application upon launch</p>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
