import React, { useState } from 'react';
import { motion } from 'motion/react';
import { ShieldCheck, ArrowRight, Video, Sparkles, CheckCircle, Smartphone } from 'lucide-react';
import { useAuth } from '../../../auth';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

interface SuccessStepProps {
  onComplete: () => void;
  key?: React.Key | string;
}

export function SuccessStep({ onComplete }: SuccessStepProps) {
  const { user, profile } = useAuth();
  const { interests } = useOnboardingStore();
  const [loading, setLoading] = useState(false);

  const handleStart = async () => {
    setLoading(true);
    try {
      await onComplete();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || 'Hustler Friend';

  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.6, ease: [0.19, 1, 0.22, 1] }}
      className="flex-1 flex flex-col p-6 max-w-md mx-auto w-full h-full justify-between relative z-10"
      id="success-step"
    >
      <div className="w-full h-2" /> {/* spacer */}

      {/* Main content area */}
      <div className="flex-1 flex flex-col items-center justify-center text-center px-4">
        {/* Animated Badge illustration */}
        <div className="relative w-36 h-36 flex items-center justify-center mb-10">
          {/* Outer glowing aura */}
          <div className="absolute inset-0 bg-brand-success/10 rounded-full blur-2xl animate-pulse" />
          
          <motion.div 
            animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="w-24 h-24 bg-gradient-to-tr from-emerald-500/20 to-teal-500/20 border-2 border-emerald-500/30 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(52,199,89,0.2)] relative z-10"
          >
            <ShieldCheck className="w-12 h-12 text-emerald-400 stroke-[1.5px]" />
          </motion.div>
          
          {/* Confetti decoration elements */}
          <Sparkles className="absolute top-2 right-2 w-6 h-6 text-brand-primary animate-bounce text-pink-500" />
          <div className="absolute -bottom-1 -left-2 w-5 h-5 bg-teal-500/40 rounded-full blur-xs animate-ping" />
        </div>

        {/* Welcome Message */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-3xl font-extrabold tracking-tight font-display mb-3">You're all set!</h2>
          <p className="text-xl font-medium text-white/90">
             Welcome to Hustle, <span className="text-gradient font-bold">{displayName}</span>
          </p>
        </motion.div>

        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/40 text-sm leading-relaxed max-w-sm mt-4"
        >
          Your feed has been personalized with <strong>{interests.length > 0 ? `${interests.length} skills` : 'all preset skills'}</strong>. Discover verified local service providers nearby instantly.
        </motion.p>

        {/* Feature quick-tip bullet list to ensure accessibility for low digital literacy */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="w-full bg-white/[0.02] border border-white/5 rounded-2xl p-4 mt-8 flex flex-col gap-3.5 text-left text-xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-brand-primary/10 flex items-center justify-center text-brand-primary shrink-0 mt-0.5">
              <Video className="w-3 h-3" />
            </div>
            <div>
              <p className="font-semibold text-white/90">Watch & Match</p>
              <p className="text-white/40">Swipe through fast vertical clips uploaded by local mechanics, barbers, tutors, and tradesmen to assess their work.</p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-brand-accent/10 flex items-center justify-center text-brand-accent shrink-0 mt-0.5">
              <Smartphone className="w-3 h-3" />
            </div>
            <div>
              <p className="font-semibold text-white/90">One-Tap Booking & Chat</p>
              <p className="text-white/40">No complicated forms. Instantly communicate or securely direct fund escrow transfers for service bookings.</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Button Action */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full pb-8 mt-auto pt-6"
      >
        <button 
          onClick={handleStart}
          disabled={loading}
          className="w-full h-14 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl font-semibold flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(52,199,89,0.3)] hover:opacity-95 transition-all text-base active-scale group"
          id="btn-success-explore"
        >
          {loading ? 'Entering...' : 'Start Exploring'} 
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>
      </motion.div>
    </motion.div>
  );
}
