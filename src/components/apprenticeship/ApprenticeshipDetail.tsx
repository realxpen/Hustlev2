import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, Award, BookOpen, Clock, Users, 
  ChevronRight, Send, ShieldCheck, Zap 
} from 'lucide-react';
import { Apprenticeship } from '../../types/apprenticeship';
import { useApprenticeshipStore } from '../../stores/useApprenticeshipStore';
import { useAuthStore } from '../../features/auth/stores/useAuthStore';

interface ApprenticeshipDetailProps {
  program: Apprenticeship;
  onClose: () => void;
}

export function ApprenticeshipDetail({ program, onClose }: ApprenticeshipDetailProps) {
  const [message, setMessage] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const { applyToProgram } = useApprenticeshipStore();
  const { user } = useAuthStore();

  const handleApply = async () => {
    if (!message.trim()) return;
    setIsApplying(true);
    const success = await applyToProgram(program.id, message);
    if (success) {
      setHasApplied(true);
      setTimeout(onClose, 2000);
    }
    setIsApplying(false);
  };

  const mentorName = program.mentor_profile?.hustle_name || program.mentor_profile?.full_name || 'Mentor';
  const mentorAvatar = program.mentor_profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${program.mentor_id}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/90 backdrop-blur-md"
      />
      
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        className="relative w-full max-w-lg bg-[#0f0f0f] rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="relative h-48 shrink-0">
          <div className="absolute inset-0 bg-gradient-to-b from-brand-primary/20 to-transparent opacity-50" />
          <button 
            onClick={onClose}
            className="absolute top-6 right-6 w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white border border-white/10 z-10"
          >
            <X size={20} />
          </button>
          
          <div className="absolute bottom-6 left-8 flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl border-2 border-brand-primary bg-zinc-900 p-1">
              <img src={mentorAvatar} alt={mentorName} className="w-full h-full object-cover rounded-xl" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary">Mentor Program</p>
              <h2 className="text-2xl font-black text-white italic tracking-tighter uppercase">{program.title}</h2>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-8 pt-2">
          <div className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                   <BookOpen size={16} className="text-brand-primary" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Knowledge Area</span>
                </div>
                <p className="text-xs font-black text-white uppercase">{program.skill_area}</p>
              </div>
              <div className="bg-white/5 rounded-3xl p-4 border border-white/5">
                <div className="flex items-center gap-2 mb-2">
                   <Award size={16} className="text-brand-primary" />
                   <span className="text-[8px] font-black uppercase tracking-widest text-white/40">Credential</span>
                </div>
                <p className="text-xs font-black text-white uppercase">Proof of Skill</p>
              </div>
            </div>

            <div className="space-y-3">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">About the Program</h3>
              <p className="text-sm text-white/70 leading-relaxed font-medium italic">
                {program.description}
              </p>
            </div>

            <div className="bg-brand-primary/5 rounded-[2rem] p-6 border border-brand-primary/10">
              <div className="flex items-center gap-3 mb-4">
                <ShieldCheck size={20} className="text-brand-primary" />
                <h3 className="text-xs font-black text-white uppercase tracking-widest">Hustle Commitment</h3>
              </div>
              <ul className="space-y-3">
                {[
                  'Direct mentorship from a verified creator',
                  'Standardized milestone-based learning',
                  'On-chain verifiable certification',
                  'Connected to actual work opportunities'
                ].map((text, i) => (
                  <li key={i} className="flex items-center gap-3 text-[10px] font-bold text-white/60">
                    <Zap size={10} className="text-brand-primary" />
                    {text}
                  </li>
                ))}
              </ul>
            </div>

            {!hasApplied ? (
              <div className="space-y-4 pt-4">
                <div className="space-y-2">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-white/40">Why should you be selected?</h3>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="Describe your background and why you want to learn this skill..."
                    className="w-full bg-white/5 border border-white/10 rounded-3xl p-5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-brand-primary/50 transition-all min-h-[120px] resize-none italic"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleApply}
                  disabled={isApplying || !message.trim()}
                  className="w-full h-16 bg-brand-primary text-black rounded-full font-black uppercase tracking-[0.2em] flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_0_40px_rgba(var(--brand-primary-rgb),0.2)]"
                >
                  {isApplying ? (
                    <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send size={18} />
                      Submit Application
                    </>
                  )}
                </motion.button>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="pt-10 pb-6 flex flex-col items-center text-center gap-4"
              >
                <div className="w-20 h-20 rounded-full bg-brand-primary flex items-center justify-center text-black shadow-[0_0_50px_rgba(var(--brand-primary-rgb),0.3)]">
                  <ShieldCheck size={40} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white italic uppercase">Application Sent!</h3>
                  <p className="text-[10px] text-white/40 uppercase tracking-widest font-black mt-1">The mentor will review your profile shortly</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
