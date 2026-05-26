import React from 'react';
import { motion } from 'motion/react';
import { ChevronLeft, ArrowRight, Loader2 } from 'lucide-react';
import { useOnboardingStore } from '../../stores/useOnboardingStore';

const INTERESTS = [
  'UI Design', 'Marketing', 'Blockchain', 'Fitness', 'Fashion', 
  'Logistics', 'Live Sales', 'Entertainment', 'Coaching', 
  'Real Estate', 'Repair', 'Street Food'
];

export function InterestsStep({ onBack, onComplete }: { onBack: () => void, onComplete: () => void, key?: React.Key }) {
  const { interests, toggleInterest, isLoading, error } = useOnboardingStore();

  return (
    <motion.div 
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex-1 flex flex-col p-6 max-w-lg mx-auto w-full relative z-10"
    >
      <button onClick={onBack} disabled={isLoading} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-white/50 hover:text-white transition-colors mb-8 mt-4 disabled:opacity-50">
        <ChevronLeft className="w-5 h-5" />
      </button>
      
      <div className="mb-10">
        <h2 className="text-3xl font-bold tracking-tight mb-2">What are you into?</h2>
        <p className="text-white/40">Select at least 3 categories to personalize your feed.</p>
      </div>

      <div className="flex-1">
        <div className="flex flex-wrap gap-3">
          {INTERESTS.map((interest, i) => {
            const isSelected = interests.includes(interest);
            return (
              <motion.button
                key={interest}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 * i }}
                onClick={() => toggleInterest(interest)}
                disabled={isLoading}
                className={`px-5 py-3 rounded-full text-sm font-medium transition-all duration-300 border ${isSelected ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' : 'bg-transparent border-white/10 text-white/70 hover:bg-white/5 hover:border-white/30 truncate'}`}
              >
                {interest}
              </motion.button>
            );
          })}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm border border-red-500/20">
          {error}
        </div>
      )}

      <motion.button 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        onClick={onComplete}
        disabled={interests.length < 3 || isLoading}
        className="w-full h-14 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/90 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-[0.98] mt-8 relative overflow-hidden group"
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <>
            Complete Onboarding <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </>
        )}
      </motion.button>
    </motion.div>
  );
}
