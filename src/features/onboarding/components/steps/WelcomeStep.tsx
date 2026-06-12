import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

interface WelcomeStepProps {
  onNext: () => void;
  onSignIn?: () => void;
  key?: React.Key | string;
}

export function WelcomeStep({ onNext, onSignIn }: WelcomeStepProps) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -15 }}
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className="flex-1 flex flex-col p-6 items-center justify-between h-full w-full max-w-md mx-auto relative z-10"
      id="welcome-step"
    >
      {/* Top Graphic decoration */}
      <div className="w-full flex-1 flex flex-col items-center justify-center text-center mt-12 md:mt-16">
        {/* Hustle Logo Icon */}
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.6, type: "spring", stiffness: 100 }}
          className="w-20 h-20 bg-gradient-to-tr from-brand-primary/20 via-brand-accent/20 to-brand-primary/10 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-glow-red relative group overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-tr from-brand-primary to-brand-accent opacity-10 group-hover:opacity-20 transition-opacity" />
          <Sparkles className="text-white w-10 h-10 animate-pulse" />
        </motion.div>
        
        {/* Brand Caption */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xs font-mono font-medium tracking-[0.3em] text-brand-primary uppercase mb-3"
        >
          SKILL DISCOVERY MARKETPLACE
        </motion.div>

        {/* Headline */}
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-5xl font-extrabold tracking-tight mb-4 font-display font-black"
        >
          HUSTLE
        </motion.h1>
        
        {/* Explanation */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-white/60 text-lg mb-8 max-w-xs font-normal leading-relaxed"
        >
          Discover skilled professionals, book services, and learn from creators through interactive short video content.
        </motion.p>
      </div>

      {/* Action Area at the bottom */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="w-full pb-8 mt-auto"
      >
        <button 
          onClick={onNext}
          className="w-full h-14 bg-gradient-to-r from-brand-primary to-brand-accent text-white rounded-xl font-semibold flex items-center justify-center gap-3 shadow-glow-red hover:opacity-95 transition-all text-base active-scale group"
          id="btn-welcome-continue"
        >
          Get Started 
          <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
        </button>

        {onSignIn && (
          <div className="text-center mt-3">
            <button 
              type="button" 
              onClick={onSignIn}
              className="text-sm font-medium text-white/50 hover:text-white transition-colors active-scale py-1 px-3"
              id="btn-welcome-signin"
            >
              Already have an account? <span className="text-brand-primary font-bold hover:underline">Sign In</span>
            </button>
          </div>
        )}

        <p className="text-[10px] text-white/20 text-center mt-4 uppercase tracking-widest font-mono">
          Explore local talentry instantly
        </p>
      </motion.div>
    </motion.div>
  );
}
