import React from 'react';
import { motion } from 'motion/react';
import { Sparkles, ArrowRight } from 'lucide-react';

export function WelcomeStep({ onNext }: { onNext: () => void, key?: React.Key }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className="flex-1 flex flex-col p-6 items-center justify-center relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 via-black to-purple-500/10" />
      
      <div className="relative z-10 flex flex-col items-center text-center max-w-sm">
        <motion.div 
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.5 }}
          className="w-16 h-16 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(255,255,255,0.1)]"
        >
          <Sparkles className="text-white w-8 h-8" />
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl font-bold tracking-tight mb-4"
        >
          Welcome to <span className="text-transparent bg-clip-text bg-gradient-to-r from-white to-white/50">Hustle</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-white/40 text-lg mb-12"
        >
          The economy of you. Connect, collaborate, and monetize your skills in a premium marketplace.
        </motion.p>
        
        <motion.button 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          onClick={onNext}
          className="w-full h-14 bg-white text-black rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-white/90 transition-all active:scale-[0.98]"
        >
          Get Started <ArrowRight className="w-5 h-5" />
        </motion.button>
      </div>
    </motion.div>
  );
}
